import { google } from "@ai-sdk/google";
import { generateText } from "ai";
import { deals } from "@/data/deals";
import type {
  WarRoomInput,
  WarRoomResponse,
  DetectiveToolData,
  ProsecutorToolData,
  ArchitectToolData,
  DetectiveOutput,
  ProsecutorOutput,
  ArchitectOutput,
  OrchestratorOutput,
} from "@/types/war-room";

export const maxDuration = 60;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function parseJson<T>(text: string, fallback: T): T {
  try {
    const cleaned = text
      .replace(/```json\s*/gi, "")
      .replace(/```\s*/g, "")
      .trim();
    return JSON.parse(cleaned) as T;
  } catch {
    return fallback;
  }
}

function fmtUSD(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}

// ─── Tool 1: Find similar historical deals ────────────────────────────────────

function findSimilarDeals(input: WarRoomInput): DetectiveToolData {
  const rate = input.totalDiscountRate / 100;

  // Priority 1: same product + same segment + within ±10pp discount
  let pool = deals.filter(
    (d) =>
      d.product === input.product &&
      d.segment === input.segment &&
      Math.abs(d.totalDiscountRate - rate) <= 0.1
  );

  // Fallback 1: same product + within ±15pp
  if (pool.length < 4) {
    pool = deals.filter(
      (d) =>
        d.product === input.product &&
        Math.abs(d.totalDiscountRate - rate) <= 0.15
    );
  }

  // Fallback 2: same segment
  if (pool.length < 4) {
    pool = deals.filter((d) => d.segment === input.segment);
  }

  const similar = pool
    .sort(
      (a, b) =>
        Math.abs(a.totalDiscountRate - rate) -
        Math.abs(b.totalDiscountRate - rate)
    )
    .slice(0, 8);

  const n = similar.length || 1;
  const avgDiscountRate =
    similar.reduce((s, d) => s + d.totalDiscountRate, 0) / n;
  const avgRealizationRate =
    similar.reduce((s, d) => s + d.realizedRevenue / d.netPrice, 0) / n;
  const avgDaysInPipeline =
    similar.reduce((s, d) => s + d.daysInPipeline, 0) / n;
  const corridorViolationRate =
    similar.filter((d) => d.corridorStatus === "red").length / n;

  return {
    similarDeals: similar.map((d) => ({
      id: d.id,
      product: d.product,
      segment: d.segment,
      totalDiscountRate: d.totalDiscountRate,
      realizationRate: d.realizedRevenue / d.netPrice,
      daysInPipeline: d.daysInPipeline,
      corridorStatus: d.corridorStatus,
      riskLevel: d.riskLevel,
    })),
    avgDiscountRate,
    avgRealizationRate,
    avgDaysInPipeline,
    corridorViolationRate,
  };
}

// ─── Tool 2: Prosecute risk ───────────────────────────────────────────────────

function prosecuteRisk(
  input: WarRoomInput,
  toolData: DetectiveToolData
): ProsecutorToolData {
  const rate = input.totalDiscountRate / 100;
  const corridorTarget = 0.2;

  const projectedLeakage = Math.max(0, input.listPrice * (rate - corridorTarget));
  const annualizedRiskExposure = projectedLeakage * 4;

  const escalationProbability: "Low" | "Medium" | "High" =
    rate > 0.42 || input.daysInPipeline > 120
      ? "High"
      : rate > 0.28 || input.daysInPipeline > 60
      ? "Medium"
      : "Low";

  const worstCaseRealization = Math.max(
    70,
    (toolData.avgRealizationRate - toolData.corridorViolationRate * 0.12) * 100
  );

  return {
    projectedLeakage,
    annualizedRiskExposure,
    escalationProbability,
    worstCaseRealization,
  };
}

// ─── Tool 3: Architect optimal deal structure ─────────────────────────────────

function architectDeal(
  input: WarRoomInput,
  riskData: ProsecutorToolData
): ArchitectToolData {
  const rate = input.totalDiscountRate / 100;
  const target = 0.2;
  const reductionNeeded = Math.max(0, rate - target);

  const discountToReduce =
    input.segment === "Partner"
      ? "partner"
      : input.segment === "Enterprise"
      ? "volume"
      : "promo";

  const projectedRealizationImprovement = Math.min(
    8,
    reductionNeeded * 100 * 0.35
  );

  const approvalTier =
    rate <= 0.2
      ? "Standard"
      : rate <= 0.35
      ? "VP Approval"
      : "C-Suite Approval";

  return {
    recommendedTotalDiscount: Math.min(rate, target) * 100,
    discountToReduce,
    reductionAmount: reductionNeeded * 100,
    projectedRealizationImprovement,
    approvalTier,
  };
}

// ─── Agent runners ────────────────────────────────────────────────────────────

async function runDetective(
  input: WarRoomInput,
  toolData: DetectiveToolData
): Promise<DetectiveOutput> {
  const context = `
Deal under analysis: ${input.product} | ${input.segment} | ${input.region}
List price: ${fmtUSD(input.listPrice)} | Discount: ${input.totalDiscountRate}% | Days in pipeline: ${input.daysInPipeline}

Historical comparables (${toolData.similarDeals.length} deals found):
- Average discount rate: ${(toolData.avgDiscountRate * 100).toFixed(1)}%
- Average realization rate: ${(toolData.avgRealizationRate * 100).toFixed(1)}%
- Average days in pipeline: ${toolData.avgDaysInPipeline.toFixed(0)} days
- Corridor violation rate: ${(toolData.corridorViolationRate * 100).toFixed(0)}% of similar deals violated the 35% corridor
${input.dealDescription ? `\nDeal context: ${input.dealDescription}` : ""}
`.trim();

  const { text } = await generateText({
    model: google("gemini-flash-latest"),
    system: `You are the Deal Detective, a pricing intelligence agent specializing in historical pattern analysis. You have been given data about similar historical deals. Analyze the patterns and provide concise, data-driven insights about what history tells us about this deal. Be specific with numbers. Be direct. Maximum 3 sentences.

Respond ONLY with a valid JSON object with exactly these fields (no markdown, no code blocks, no explanation):
{
  "similarDealsFound": <number>,
  "avgDiscountRate": <number, percentage like 22.5>,
  "avgRealizationRate": <number, percentage like 98.2>,
  "avgDaysInPipeline": <number>,
  "corridorViolationRate": <number, percentage like 37.5>,
  "pattern": "<2-3 sentence narrative string>"
}`,
    prompt: context,
  });

  return parseJson<DetectiveOutput>(text, {
    similarDealsFound: toolData.similarDeals.length,
    avgDiscountRate: toolData.avgDiscountRate * 100,
    avgRealizationRate: toolData.avgRealizationRate * 100,
    avgDaysInPipeline: toolData.avgDaysInPipeline,
    corridorViolationRate: toolData.corridorViolationRate * 100,
    pattern: "Historical analysis indicates elevated discount risk for this deal profile based on comparable transactions.",
  });
}

async function runProsecutor(
  input: WarRoomInput,
  toolData: ProsecutorToolData
): Promise<ProsecutorOutput> {
  const context = `
Deal under analysis: ${input.product} | ${input.segment} | ${input.region}
List price: ${fmtUSD(input.listPrice)} | Discount: ${input.totalDiscountRate}% | Days in pipeline: ${input.daysInPipeline}

Computed risk metrics:
- Projected revenue leakage vs corridor (20% target): ${fmtUSD(toolData.projectedLeakage)}
- Annualized risk exposure: ${fmtUSD(toolData.annualizedRiskExposure)}
- Escalation probability: ${toolData.escalationProbability}
- Worst-case realization rate: ${toolData.worstCaseRealization.toFixed(1)}%
${input.dealDescription ? `\nDeal context: ${input.dealDescription}` : ""}
`.trim();

  const { text } = await generateText({
    model: google("gemini-flash-latest"),
    system: `You are the Risk Prosecutor, a pricing intelligence agent whose job is to argue the worst-case scenario for every deal. You have been given risk metrics for this deal. State the maximum financial exposure clearly. Use specific dollar amounts. Do not hedge. Maximum 3 sentences.

Respond ONLY with a valid JSON object with exactly these fields (no markdown, no code blocks, no explanation):
{
  "projectedLeakage": <number in dollars>,
  "annualizedRiskExposure": <number in dollars>,
  "escalationProbability": "<Low|Medium|High>",
  "worstCaseRealization": <number, percentage like 91.4>,
  "prosecution": "<2-3 sentence worst-case narrative string, aggressive and specific>"
}`,
    prompt: context,
  });

  return parseJson<ProsecutorOutput>(text, {
    projectedLeakage: toolData.projectedLeakage,
    annualizedRiskExposure: toolData.annualizedRiskExposure,
    escalationProbability: toolData.escalationProbability,
    worstCaseRealization: toolData.worstCaseRealization,
    prosecution: `This deal exposes ${fmtUSD(toolData.projectedLeakage)} in immediate revenue leakage beyond the approved corridor, with annualized risk of ${fmtUSD(toolData.annualizedRiskExposure)} if the discount structure holds.`,
  });
}

async function runArchitect(
  input: WarRoomInput,
  toolData: ArchitectToolData
): Promise<ArchitectOutput> {
  const context = `
Deal under analysis: ${input.product} | ${input.segment} | ${input.region}
List price: ${fmtUSD(input.listPrice)} | Current discount: ${input.totalDiscountRate}% | Days in pipeline: ${input.daysInPipeline}

Recommended restructuring:
- Recommended total discount: ${toolData.recommendedTotalDiscount.toFixed(1)}% (corridor target: 20%)
- Discount type to reduce: ${toolData.discountToReduce}
- Reduction needed: ${toolData.reductionAmount.toFixed(1)} percentage points
- Projected realization improvement: +${toolData.projectedRealizationImprovement.toFixed(1)}%
- Required approval tier: ${toolData.approvalTier}
${input.dealDescription ? `\nDeal context: ${input.dealDescription}` : ""}
`.trim();

  const { text } = await generateText({
    model: google("gemini-flash-latest"),
    system: `You are the Deal Architect, a pricing intelligence agent who builds optimal deal structures. You have been given a deal with risk data and a recommended restructuring. Provide the specific restructuring recommendation with exact numbers. Be prescriptive, not descriptive. Maximum 3 sentences.

Respond ONLY with a valid JSON object with exactly these fields (no markdown, no code blocks, no explanation):
{
  "recommendedTotalDiscount": <number, percentage like 20.0>,
  "discountToReduce": "<volume|promo|partner>",
  "reductionAmount": <number, percentage points to cut>,
  "projectedRealizationImprovement": <number, percentage points>,
  "approvalTier": "<Standard|VP Approval|C-Suite Approval>",
  "architecture": "<2-3 sentence actionable recommendation string>"
}`,
    prompt: context,
  });

  return parseJson<ArchitectOutput>(text, {
    ...toolData,
    architecture: `Reduce the ${toolData.discountToReduce} discount by ${toolData.reductionAmount.toFixed(1)} percentage points to bring total to ${toolData.recommendedTotalDiscount.toFixed(1)}%, which requires ${toolData.approvalTier}.`,
  });
}

async function runOrchestrator(
  input: WarRoomInput,
  detective: DetectiveOutput,
  prosecutor: ProsecutorOutput,
  architect: ArchitectOutput
): Promise<OrchestratorOutput> {
  const context = `
Deal: ${input.product} | ${input.segment} | ${input.region}
List price: ${fmtUSD(input.listPrice)} | Discount: ${input.totalDiscountRate}% | Days in pipeline: ${input.daysInPipeline}
${input.dealDescription ? `Context: ${input.dealDescription}\n` : ""}
DEAL DETECTIVE findings:
- ${detective.similarDealsFound} comparable deals found, avg discount ${detective.avgDiscountRate.toFixed(1)}%, corridor violation rate ${detective.corridorViolationRate.toFixed(0)}%
- Pattern: ${detective.pattern}

RISK PROSECUTOR findings:
- Projected leakage: ${fmtUSD(prosecutor.projectedLeakage)} | Annualized exposure: ${fmtUSD(prosecutor.annualizedRiskExposure)}
- Escalation probability: ${prosecutor.escalationProbability} | Worst-case realization: ${prosecutor.worstCaseRealization.toFixed(1)}%
- Prosecution: ${prosecutor.prosecution}

DEAL ARCHITECT recommendation:
- Reduce to ${architect.recommendedTotalDiscount.toFixed(1)}% total discount (-${architect.reductionAmount.toFixed(1)}pp on ${architect.discountToReduce})
- Approval required: ${architect.approvalTier}
- Architecture: ${architect.architecture}
`.trim();

  const { text } = await generateText({
    model: google("gemini-flash-latest"),
    system: `You are the Pricing War Room Orchestrator. You have received analysis from three specialized agents. Synthesize their findings into a decisive pricing recommendation. The decision must be one of: APPROVE (deal is within or near corridor, low risk), ESCALATE (deal needs VP or C-suite approval but can proceed), or RENEGOTIATE (deal must be restructured before approval). Be decisive. No hedging.

Respond ONLY with a valid JSON object with exactly these fields (no markdown, no code blocks, no explanation):
{
  "decision": "<APPROVE|ESCALATE|RENEGOTIATE>",
  "confidenceLevel": "<High|Medium|Low>",
  "executiveSummary": "<exactly 4 sentences: situation, risk, recommendation, expected outcome>",
  "primaryAction": "<one sentence: the single most important thing to do right now>",
  "revenueImpact": "<one sentence quantifying the financial stakes>"
}`,
    prompt: context,
  });

  const rate = input.totalDiscountRate / 100;
  const defaultDecision: OrchestratorOutput["decision"] =
    rate <= 0.22 ? "APPROVE" : rate <= 0.37 ? "ESCALATE" : "RENEGOTIATE";

  return parseJson<OrchestratorOutput>(text, {
    decision: defaultDecision,
    confidenceLevel: "Medium",
    executiveSummary: `This ${input.product} deal for ${input.segment} carries a ${input.totalDiscountRate}% discount. ${prosecutor.prosecution} ${architect.architecture} Immediate action is required to protect margin integrity.`,
    primaryAction: architect.architecture,
    revenueImpact: `Projected leakage of ${fmtUSD(prosecutor.projectedLeakage)} with annualized exposure of ${fmtUSD(prosecutor.annualizedRiskExposure)}.`,
  });
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(req: Request): Promise<Response> {
  const start = Date.now();

  let input: WarRoomInput;
  try {
    input = await req.json();
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  // Run all three tool functions synchronously
  const detectiveData = findSimilarDeals(input);
  const prosecutorData = prosecuteRisk(input, detectiveData);
  const architectData = architectDeal(input, prosecutorData);

  // Fire all three agents in parallel
  let detective: DetectiveOutput;
  let prosecutor: ProsecutorOutput;
  let architect: ArchitectOutput;

  try {
    [detective, prosecutor, architect] = await Promise.all([
      runDetective(input, detectiveData),
      runProsecutor(input, prosecutorData),
      runArchitect(input, architectData),
    ]);
  } catch (err) {
    console.error("Agent parallel execution failed:", err);
    return Response.json({ error: "Agent execution failed" }, { status: 500 });
  }

  // Orchestrator runs after all three complete
  let orchestrator: OrchestratorOutput;
  try {
    orchestrator = await runOrchestrator(input, detective, prosecutor, architect);
  } catch (err) {
    console.error("Orchestrator failed:", err);
    return Response.json({ error: "Orchestrator failed" }, { status: 500 });
  }

  const response: WarRoomResponse = {
    detective,
    prosecutor,
    architect,
    orchestrator,
    durationMs: Date.now() - start,
  };

  return Response.json(response);
}
