import { createAnthropic } from "@ai-sdk/anthropic";
import { generateText } from "ai";
import { deals, getWaterfallData } from "@/data/deals";

export const maxDuration = 30;

function buildStats(product: string, segment: string, region: string) {
  const filtered = deals.filter((d) => {
    if (product !== "All" && d.product !== product) return false;
    if (segment !== "All" && d.segment !== segment) return false;
    if (region !== "All" && d.region !== region) return false;
    return true;
  });
  const { summary: s } = getWaterfallData(filtered);
  const high = filtered.filter((d) => d.riskLevel === "High");
  const topRisk = high.slice(0, 3);
  const byProduct = ["Creo", "Windchill", "ThingWorx"].map((p) => {
    const sub = filtered.filter((d) => d.product === p);
    if (!sub.length) return null;
    const avgDisc = sub.reduce((acc, d) => acc + d.totalDiscountRate, 0) / sub.length;
    const viol = sub.filter((d) => d.corridorStatus === "red").length;
    return { product: p, count: sub.length, avgDisc, violations: viol };
  }).filter(Boolean);
  return { filtered, s, high, topRisk, byProduct };
}

function localNarrative(product: string, segment: string, region: string): string {
  const { filtered, s, high, topRisk, byProduct } = buildStats(product, segment, region);
  const scopeLabel = [product, segment, region].filter((x) => x !== "All").join(" / ") || "full pipeline";
  const worstProduct = [...byProduct].sort((a, b) => b!.violations - a!.violations)[0];
  const topDeal = topRisk[0];
  const healthVerb = s.avgDiscountRate > 0.35
    ? "shows elevated discount pressure"
    : s.avgDiscountRate > 0.22
    ? "is operating within acceptable parameters with some corridor pressure"
    : "is performing within healthy discount corridors";
  const realizationAdj = s.realizationRate > 0.98 ? "strong" : s.realizationRate > 0.95 ? "solid" : "below-target";
  return [
    `The ${scopeLabel} ${healthVerb}, with ${filtered.length} active deals generating $${s.totalList.toFixed(1)}M in list-price pipeline and $${s.totalRealized.toFixed(1)}M in realized revenue at a ${realizationAdj} ${(s.realizationRate * 100).toFixed(1)}% realization rate.`,
    `Discount discipline remains the primary risk vector: average discount sits at ${(s.avgDiscountRate * 100).toFixed(1)}% across the book, with ${s.corridorViolations} deals (${((s.corridorViolations / filtered.length) * 100).toFixed(0)}% of pipeline) breaching the 35% corridor ceiling${worstProduct ? `, most acutely in ${worstProduct!.product} where ${worstProduct!.violations} deals average ${(worstProduct!.avgDisc * 100).toFixed(1)}% discount` : ""}.`,
    `Recommended action: convene a deal review for the ${high.length} high-risk deals flagged by the scoring engine, with priority on any deal combining corridor violations with pipeline age exceeding 90 days.`,
    topDeal
      ? `Deal ${topDeal.id} (${topDeal.product} / ${topDeal.segment}, $${(topDeal.listPrice / 1000).toFixed(0)}K list at ${(topDeal.totalDiscountRate * 100).toFixed(1)}% discount, ${topDeal.daysInPipeline} days in pipeline) represents the highest composite risk in the current book and warrants immediate rep-level intervention.`
      : `Management attention should focus on ${worstProduct?.product ?? "Enterprise"} deals approaching the approval ceiling before end of quarter.`,
  ].join(" ");
}

function streamWords(text: string): Response {
  const encoder = new TextEncoder();
  const words = text.split(" ");
  const stream = new ReadableStream({
    async start(controller) {
      for (const word of words) {
        controller.enqueue(encoder.encode(`0:${JSON.stringify(word + " ")}\n`));
        await new Promise((r) => setTimeout(r, 28));
      }
      controller.enqueue(
        encoder.encode(`d:{"finishReason":"stop","usage":{"promptTokens":0,"completionTokens":0}}\n`)
      );
      controller.close();
    },
  });
  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "x-vercel-ai-data-stream": "v1",
    },
  });
}

export async function POST(req: Request) {
  const { product, segment, region } = await req.json();

  if (process.env.ANTHROPIC_API_KEY) {
    const { filtered, s, high, topRisk, byProduct } = buildStats(product, segment, region);
    const stats = `Pipeline summary (${filtered.length} deals):
- Total list price: $${s.totalList.toFixed(1)}M | Net: $${s.totalNet.toFixed(1)}M | Realized: $${s.totalRealized.toFixed(1)}M
- Avg discount: ${(s.avgDiscountRate * 100).toFixed(1)}% | Realization rate: ${(s.realizationRate * 100).toFixed(1)}%
- Corridor violations (>35%): ${s.corridorViolations} | High-risk deals: ${high.length}
Products: ${byProduct.map((p) => `${p!.product} — ${p!.count} deals, avg ${(p!.avgDisc * 100).toFixed(1)}%, ${p!.violations} violations`).join("; ")}
Top risk: ${topRisk.map((d) => `${d.id} ${d.product}/${d.segment} ${(d.totalDiscountRate * 100).toFixed(1)}% disc $${(d.listPrice / 1000).toFixed(0)}K ${d.daysInPipeline}d`).join("; ")}`;

    try {
      const anthropic = createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
      const { text } = await generateText({
        model: anthropic("claude-haiku-4-5-20251001"),
        system: `You are a senior pricing analyst. Write a 3-4 sentence executive summary in McKinsey style for a VP of Sales. Use the exact numbers provided. Cover: pipeline health, primary risk with specifics, recommended action, most critical deal to watch. No bullets, no headers, flowing prose only.`,
        prompt: stats,
      });
      return streamWords(text);
    } catch (err) {
      console.warn("Anthropic API unavailable, using local narrative:", String(err));
    }
  }

  return streamWords(localNarrative(product, segment, region));
}
