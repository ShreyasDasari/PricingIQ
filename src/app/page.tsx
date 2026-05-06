import { deals, getWaterfallData } from "@/data/deals";
import { fmtDollar, fmtPct } from "@/lib/utils";
import Link from "next/link";

export default function DashboardPage() {
  const wf = getWaterfallData(deals);
  const s = wf.summary;

  const high = deals.filter((d) => d.riskLevel === "High").length;
  const red = deals.filter((d) => d.corridorStatus === "red").length;
  const yellow = deals.filter((d) => d.corridorStatus === "yellow").length;

  const byProduct = ["Creo", "Windchill", "ThingWorx"].map((p) => {
    const sub = deals.filter((d) => d.product === p);
    const wfs = getWaterfallData(sub).summary;
    return { product: p, deals: sub.length, avgDiscount: wfs.avgDiscountRate, violations: sub.filter(d => d.corridorStatus === "red").length };
  });

  const kpis = [
    { label: "Total Pipeline", value: fmtDollar(s.totalList), sub: "List price", color: "blue" },
    { label: "Realized Revenue", value: fmtDollar(s.totalRealized), sub: `${fmtPct(s.realizationRate)} realization`, color: "green" },
    { label: "Avg Discount Rate", value: fmtPct(s.avgDiscountRate), sub: "Across all deals", color: s.avgDiscountRate > 0.35 ? "red" : "amber" },
    { label: "Corridor Violations", value: red.toString(), sub: `${yellow} approaching limit`, color: "red" },
    { label: "High-Risk Deals", value: high.toString(), sub: "Flagged for review", color: "orange" },
    { label: "Revenue Leakage", value: fmtDollar(s.totalDiscounts), sub: "Total discounts applied", color: "purple" },
  ];

  const colorMap: Record<string, string> = {
    blue: "bg-blue-50 border-blue-200 text-blue-700",
    green: "bg-green-50 border-green-200 text-green-700",
    red: "bg-red-50 border-red-200 text-red-700",
    amber: "bg-amber-50 border-amber-200 text-amber-700",
    orange: "bg-orange-50 border-orange-200 text-orange-700",
    purple: "bg-purple-50 border-purple-200 text-purple-700",
  };

  const modules = [
    { href: "/waterfall", label: "Pricing Waterfall", desc: "Interactive revenue waterfall with corridor analysis", icon: "⬇" },
    { href: "/deals", label: "Deal Scoring", desc: "Risk-scored deal book with SHAP explainability", icon: "◎" },
    { href: "/narrative", label: "AI Executive Narrative", desc: "Claude-generated pipeline summary for stakeholders", icon: "✦" },
    { href: "/alerts", label: "Intelligent Alerts", desc: "Real-time threshold monitoring and breach detection", icon: "⚡" },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Pricing Intelligence Dashboard</h1>
        <p className="text-slate-500 mt-1">Q1–Q4 pipeline · 500 deals · Creo, Windchill, ThingWorx</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
        {kpis.map(({ label, value, sub, color }) => (
          <div key={label} className={`rounded-xl border p-5 ${colorMap[color]}`}>
            <p className="text-xs font-medium uppercase tracking-wide opacity-70">{label}</p>
            <p className="text-3xl font-bold mt-1">{value}</p>
            <p className="text-xs mt-1 opacity-70">{sub}</p>
          </div>
        ))}
      </div>

      <div className="mb-10">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Modules</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {modules.map(({ href, label, desc, icon }) => (
            <Link key={href} href={href} className="group rounded-xl border border-slate-200 bg-white p-5 hover:border-blue-400 hover:shadow-md transition-all">
              <span className="text-2xl">{icon}</span>
              <h3 className="text-sm font-semibold text-slate-900 mt-3 group-hover:text-blue-600">{label}</h3>
              <p className="text-xs text-slate-500 mt-1">{desc}</p>
            </Link>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Product Line Summary</h2>
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-6 py-3 text-slate-600 font-medium">Product</th>
                <th className="text-right px-6 py-3 text-slate-600 font-medium">Deals</th>
                <th className="text-right px-6 py-3 text-slate-600 font-medium">Avg Discount</th>
                <th className="text-right px-6 py-3 text-slate-600 font-medium">Corridor Violations</th>
                <th className="text-right px-6 py-3 text-slate-600 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {byProduct.map(({ product, deals: cnt, avgDiscount, violations }) => (
                <tr key={product} className="hover:bg-slate-50">
                  <td className="px-6 py-4 font-medium text-slate-900">{product}</td>
                  <td className="px-6 py-4 text-right text-slate-600">{cnt}</td>
                  <td className="px-6 py-4 text-right">
                    <span className={`font-medium ${avgDiscount > 0.35 ? "text-red-600" : avgDiscount > 0.2 ? "text-amber-600" : "text-green-600"}`}>
                      {fmtPct(avgDiscount)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right text-slate-600">{violations}</td>
                  <td className="px-6 py-4 text-right">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${violations > 30 ? "bg-red-100 text-red-700" : violations > 15 ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700"}`}>
                      {violations > 30 ? "Elevated Risk" : violations > 15 ? "Monitor" : "Healthy"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
