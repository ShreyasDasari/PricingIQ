import { deals, getWaterfallData } from "@/data/deals";
import { fmtPct } from "@/lib/utils";
import Link from "next/link";
import KpiCard from "@/components/KpiCard";

export default function DashboardPage() {
  const wf = getWaterfallData(deals);
  const s = wf.summary;

  const high = deals.filter((d) => d.riskLevel === "High").length;
  const red = deals.filter((d) => d.corridorStatus === "red").length;
  const yellow = deals.filter((d) => d.corridorStatus === "yellow").length;

  const byProduct = (["Creo", "Windchill", "Service"] as const).map((p) => {
    const sub = deals.filter((d) => d.product === p);
    const wfs = getWaterfallData(sub).summary;
    const highRisk = sub.filter((d) => d.riskLevel === "High").length;
    return {
      product: p,
      deals: sub.length,
      listPrice: wfs.totalList,
      realized: wfs.totalRealized,
      avgDiscount: wfs.avgDiscountRate,
      violations: sub.filter((d) => d.corridorStatus === "red").length,
      highRisk,
      realizationRate: wfs.realizationRate,
    };
  });

  const bySegment = (["Enterprise", "Mid-Market", "SMB", "Partner"] as const).map((seg) => {
    const sub = deals.filter((d) => d.segment === seg);
    const wfs = getWaterfallData(sub).summary;
    return {
      segment: seg,
      deals: sub.length,
      avgDiscount: wfs.avgDiscountRate,
      violations: sub.filter((d) => d.corridorStatus === "red").length,
      realized: wfs.totalRealized,
    };
  });

  const recentAlerts = deals
    .filter((d) => d.corridorStatus === "red" && d.riskLevel === "High")
    .sort((a, b) => b.riskScore - a.riskScore)
    .slice(0, 5);

  const modules = [
    { href: "/waterfall", label: "Pricing Waterfall", desc: "Revenue leakage across discount chain", status: "→" },
    { href: "/deals", label: "Deal Scoring", desc: "Risk-scored book with factor attribution", status: "→" },
    { href: "/narrative", label: "AI Narrative", desc: "Gemini executive pipeline summary", status: "→" },
    { href: "/alerts", label: "Intelligent Alerts", desc: "Configurable threshold monitoring", status: "→" },
  ];

  return (
    <div className="p-6 max-w-[1400px] mx-auto space-y-6">

      {/* Page header */}
      <div className="flex items-start justify-between border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Pricing Intelligence Dashboard</h1>
          <p className="text-[12px] text-slate-500 mt-0.5">FY2026 · All products · All regions · 500 active deals</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-500 border border-slate-200 bg-white px-2.5 py-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
            Live data
          </span>
          <span className="inline-flex items-center text-[11px] font-semibold bg-slate-900 text-white px-2.5 py-1.5">
            Q1–Q4 2026
          </span>
        </div>
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard
          label="Total Pipeline"
          value={`$${s.totalList.toFixed(1)}M`}
          qoq={{ value: "4.2% QoQ", positive: true }}
          vsTarget="vs $289.5M target"
          status="green"
        />
        <KpiCard
          label="Realized Revenue"
          value={`$${s.totalRealized.toFixed(1)}M`}
          qoq={{ value: "1.3% QoQ", positive: false }}
          sub={`${fmtPct(s.realizationRate)} realization rate`}
          status="amber"
        />
        <KpiCard
          label="Avg Discount Rate"
          value={fmtPct(s.avgDiscountRate)}
          qoq={{ value: "1.1pp QoQ", positive: false }}
          vsTarget="Target: ≤15.0%"
          status={s.avgDiscountRate > 0.25 ? "red" : s.avgDiscountRate > 0.2 ? "amber" : "green"}
        />
        <KpiCard
          label="Corridor Violations"
          value={red.toString()}
          qoq={{ value: "+8 QoQ", positive: false }}
          sub={`${yellow} approaching limit`}
          status="red"
        />
      </div>

      {/* Secondary KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard
          label="High-Risk Deals"
          value={high.toString()}
          qoq={{ value: "12% QoQ", positive: true }}
          sub="Flagged for exec review"
          status="amber"
        />
        <KpiCard
          label="Revenue Leakage"
          value={`$${s.totalDiscounts.toFixed(1)}M`}
          qoq={{ value: "2.8% QoQ", positive: false }}
          sub="Total discounts applied"
          status="red"
        />
        <KpiCard
          label="Net Price"
          value={`$${s.totalNet.toFixed(1)}M`}
          sub="After all discounts"
          status="neutral"
        />
        <KpiCard
          label="Total Deals"
          value="500"
          sub="Across all segments & regions"
          status="neutral"
        />
      </div>

      {/* Main content: product table + alert feed */}
      <div className="grid grid-cols-12 gap-4">

        {/* Product breakdown */}
        <div className="col-span-8 bg-white border border-slate-200">
          <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200">
            <p className="section-title">Product Line Performance</p>
            <span className="text-[11px] text-slate-400">FY2026 · All regions</span>
          </div>
          <table className="ent-table">
            <thead>
              <tr>
                <th>Product</th>
                <th className="num">Deals</th>
                <th className="num">List Price</th>
                <th className="num">Realized Rev.</th>
                <th className="num">Avg Discount</th>
                <th className="num">Realization</th>
                <th className="num">Violations</th>
                <th>Health</th>
              </tr>
            </thead>
            <tbody>
              {byProduct.map(({ product, deals: cnt, listPrice, realized, avgDiscount, violations, realizationRate }) => {
                const health = violations > 20 ? "data-badge-red" : violations > 8 ? "data-badge-amber" : "data-badge-green";
                const healthLabel = violations > 20 ? "Elevated" : violations > 8 ? "Monitor" : "Healthy";
                return (
                  <tr key={product}>
                    <td className="font-semibold text-slate-900">{product}</td>
                    <td className="num text-slate-600 tabular-nums">{cnt}</td>
                    <td className="num text-slate-700 tabular-nums">${listPrice.toFixed(1)}M</td>
                    <td className="num text-slate-700 tabular-nums">${realized.toFixed(1)}M</td>
                    <td className="num tabular-nums">
                      <span className={avgDiscount > 0.3 ? "text-red-600 font-semibold" : avgDiscount > 0.2 ? "text-amber-600 font-semibold" : "text-emerald-600 font-semibold"}>
                        {fmtPct(avgDiscount)}
                      </span>
                    </td>
                    <td className="num tabular-nums text-slate-600">{fmtPct(realizationRate)}</td>
                    <td className="num tabular-nums font-bold">
                      <span className={violations > 0 ? "text-red-600" : "text-slate-400"}>{violations}</span>
                    </td>
                    <td><span className={health}>{healthLabel}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div className="px-5 py-3 border-t border-slate-100">
            <p className="section-title mt-2 mb-3">Segment Breakdown</p>
            <table className="ent-table">
              <thead>
                <tr>
                  <th>Segment</th>
                  <th>Deals</th>
                  <th className="num">Realized Rev.</th>
                  <th className="num">Avg Discount</th>
                  <th className="num">Violations</th>
                </tr>
              </thead>
              <tbody>
                {bySegment.map(({ segment, deals: cnt, avgDiscount, violations, realized }) => (
                  <tr key={segment}>
                    <td className="font-medium text-slate-800">{segment}</td>
                    <td className="text-slate-600">{cnt}</td>
                    <td className="num tabular-nums text-slate-700">${realized.toFixed(1)}M</td>
                    <td className="num tabular-nums">
                      <span className={avgDiscount > 0.3 ? "text-red-600 font-semibold" : avgDiscount > 0.2 ? "text-amber-600 font-semibold" : "text-emerald-600 font-semibold"}>
                        {fmtPct(avgDiscount)}
                      </span>
                    </td>
                    <td className="num tabular-nums">
                      <span className={violations > 0 ? "text-red-600 font-semibold" : "text-slate-400"}>{violations}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right column: alerts + modules */}
        <div className="col-span-4 space-y-4">
          {/* Critical alert feed */}
          <div className="bg-white border border-slate-200">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-red-50">
              <p className="text-[11px] font-bold uppercase tracking-wider text-red-700">⚠ Critical Alerts</p>
              <Link href="/alerts" className="text-[11px] text-red-600 font-medium hover:underline">View all →</Link>
            </div>
            <div className="divide-y divide-slate-100">
              {recentAlerts.map((d) => (
                <div key={d.id} className="px-4 py-2.5 hover:bg-slate-50 transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-[12px] font-semibold text-slate-900">{d.id}</p>
                      <p className="text-[11px] text-slate-500">{d.product} · {d.segment}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[12px] font-bold text-red-600">{fmtPct(d.totalDiscountRate)}</p>
                      <p className="text-[10px] text-slate-400">{d.daysInPipeline}d pipeline</p>
                    </div>
                  </div>
                </div>
              ))}
              {recentAlerts.length === 0 && (
                <div className="px-4 py-6 text-center text-[12px] text-slate-400">No critical alerts</div>
              )}
            </div>
          </div>

          {/* Module navigation */}
          <div className="bg-white border border-slate-200">
            <div className="px-4 py-3 border-b border-slate-200">
              <p className="section-title">Analysis Modules</p>
            </div>
            <div className="divide-y divide-slate-100">
              {modules.map(({ href, label, desc }) => (
                <Link
                  key={href}
                  href={href}
                  className="flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition-colors group"
                >
                  <div>
                    <p className="text-[12px] font-semibold text-slate-900 group-hover:text-emerald-700">{label}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">{desc}</p>
                  </div>
                  <span className="text-slate-300 group-hover:text-emerald-600 transition-colors text-sm">→</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
