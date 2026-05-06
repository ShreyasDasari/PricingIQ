import { google } from "@ai-sdk/google";
import { streamText } from "ai";
import { deals, getWaterfallData } from "@/data/deals";

export const maxDuration = 30;

export async function POST(req: Request) {
  const { product, segment, region } = await req.json();

  const filtered = deals.filter((d) => {
    if (product !== "All" && d.product !== product) return false;
    if (segment !== "All" && d.segment !== segment) return false;
    if (region !== "All" && d.region !== region) return false;
    return true;
  });

  const { summary: s } = getWaterfallData(filtered);
  const high = filtered.filter((d) => d.riskLevel === "High");
  const topRisk = high.slice(0, 3);
  const byProduct = ["Creo", "Windchill", "Service"].map((p) => {
    const sub = filtered.filter((d) => d.product === p);
    if (!sub.length) return null;
    const avgDisc = sub.reduce((acc, d) => acc + d.totalDiscountRate, 0) / sub.length;
    const viol = sub.filter((d) => d.corridorStatus === "red").length;
    return { product: p, count: sub.length, avgDisc, violations: viol };
  }).filter(Boolean);

  const stats = `Pipeline summary (${filtered.length} deals${product !== "All" ? ` · ${product}` : ""}${segment !== "All" ? ` · ${segment}` : ""}${region !== "All" ? ` · ${region}` : ""}):
- Total list price: $${s.totalList.toFixed(1)}M | Net: $${s.totalNet.toFixed(1)}M | Realized: $${s.totalRealized.toFixed(1)}M
- Avg discount: ${(s.avgDiscountRate * 100).toFixed(1)}% | Realization rate: ${(s.realizationRate * 100).toFixed(1)}%
- Corridor violations (>35%): ${s.corridorViolations} | High-risk deals: ${high.length}
Products: ${byProduct.map((p) => `${p!.product} — ${p!.count} deals, avg ${(p!.avgDisc * 100).toFixed(1)}%, ${p!.violations} violations`).join("; ")}
Top risk: ${topRisk.map((d) => `${d.id} ${d.product}/${d.segment} ${(d.totalDiscountRate * 100).toFixed(1)}% disc $${(d.listPrice / 1000).toFixed(0)}K ${d.daysInPipeline}d`).join("; ")}`;

  const result = streamText({
    model: google("gemini-flash-latest"),
    system: `You are a senior pricing analyst generating an executive summary for a pricing intelligence dashboard.
Write in the style of a McKinsey analyst briefing a VP of Sales.
Be specific with numbers. Use the exact data provided — do not fabricate figures.
Output exactly 3-4 sentences: one on overall pipeline health, one on the primary risk area with specific numbers, one recommended action, one on the most critical deal or segment to watch.
No bullet points. No headers. Just flowing executive prose.`,
    prompt: stats,
  });

  return result.toTextStreamResponse();
}
