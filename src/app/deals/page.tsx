"use client";

import { useState, useMemo } from "react";
import { deals, type Deal, type Product, type Segment } from "@/data/deals";
import { fmtPct, fmtDollar, fmt } from "@/lib/utils";
import CorridorScatter from "@/components/CorridorScatter";

const RISK_COLORS: Record<string, string> = {
  High: "bg-red-100 text-red-700 border-red-200",
  Medium: "bg-amber-100 text-amber-700 border-amber-200",
  Low: "bg-green-100 text-green-700 border-green-200",
};

export default function DealsPage() {
  const [product, setProduct] = useState<Product | "All">("All");
  const [segment, setSegment] = useState<Segment | "All">("All");
  const [riskFilter, setRiskFilter] = useState<"All" | "High" | "Medium" | "Low">("All");
  const [selected, setSelected] = useState<Deal | null>(null);
  const [sortBy, setSortBy] = useState<"riskScore" | "listPrice" | "totalDiscountRate">("riskScore");

  const filtered = useMemo(() =>
    deals
      .filter((d) => {
        if (product !== "All" && d.product !== product) return false;
        if (segment !== "All" && d.segment !== segment) return false;
        if (riskFilter !== "All" && d.riskLevel !== riskFilter) return false;
        return true;
      })
      .sort((a, b) => b[sortBy] - a[sortBy])
      .slice(0, 100),
    [product, segment, riskFilter, sortBy]
  );

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Deal Scoring Engine</h1>
        <p className="text-slate-500 mt-1">Risk-scored deal book · Click any deal for SHAP breakdown</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        {[
          { label: "Product", value: product, setter: setProduct, options: ["All", "Creo", "Windchill", "ThingWorx"] },
          { label: "Segment", value: segment, setter: setSegment, options: ["All", "Enterprise", "Mid-Market", "SMB", "Partner"] },
          { label: "Risk", value: riskFilter, setter: setRiskFilter, options: ["All", "High", "Medium", "Low"] },
          { label: "Sort By", value: sortBy, setter: setSortBy as (v: string) => void, options: ["riskScore", "listPrice", "totalDiscountRate"] },
        ].map(({ label, value, setter, options }) => (
          <div key={label} className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-500 uppercase">{label}</span>
            <select
              value={value}
              onChange={(e) => setter(e.target.value as never)}
              className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {options.map((o) => <option key={o}>{o}</option>)}
            </select>
          </div>
        ))}
      </div>

      {/* Scatter chart */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
        <h2 className="text-base font-semibold text-slate-800 mb-1">Discount vs. Deal Size — Corridor Map</h2>
        <p className="text-xs text-slate-500 mb-4">Green zone: ≤20% · Yellow: 21–35% · Red: &gt;35%</p>
        <CorridorScatter deals={filtered} onSelect={setSelected} selected={selected} />
      </div>

      {/* SHAP panel + table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* SHAP breakdown */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-base font-semibold text-slate-800 mb-1">Risk Factor Breakdown</h2>
          <p className="text-xs text-slate-500 mb-4">
            {selected ? `Deal ${selected.id} — ${selected.riskLevel} Risk` : "Select a deal to see breakdown"}
          </p>
          {selected ? (
            <div className="space-y-4">
              {[
                { label: "Discount Depth", value: selected.shapFactors.discount, max: 0.4, color: "bg-red-500" },
                { label: "Deal Size", value: selected.shapFactors.dealSize, max: 0.2, color: "bg-blue-500" },
                { label: "Days in Pipeline", value: selected.shapFactors.pipeline, max: 0.2, color: "bg-amber-500" },
                { label: "Close Rate", value: selected.shapFactors.closeRate, max: 0.2, color: "bg-purple-500" },
              ].map(({ label, value, max, color }) => (
                <div key={label}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-700">{label}</span>
                    <span className="text-slate-500 text-xs font-medium">{((value / max) * 100).toFixed(0)}% of max</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2.5">
                    <div className={`h-2.5 rounded-full ${color}`} style={{ width: `${(value / max) * 100}%` }} />
                  </div>
                </div>
              ))}
              <div className="pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
                <div className="flex justify-between"><span>Total Discount</span><span className="font-semibold">{fmtPct(selected.totalDiscountRate)}</span></div>
                <div className="flex justify-between"><span>List Price</span><span className="font-semibold">{fmtDollar(selected.listPrice / 1_000_000)}</span></div>
                <div className="flex justify-between"><span>Net Price</span><span className="font-semibold">{fmtDollar(selected.netPrice / 1_000_000)}</span></div>
                <div className="flex justify-between"><span>Days in Pipeline</span><span className="font-semibold">{selected.daysInPipeline}d</span></div>
                <div className="flex justify-between"><span>Close Rate</span><span className="font-semibold">{fmtPct(selected.closeRate)}</span></div>
                <div className="flex justify-between"><span>Rep</span><span className="font-semibold">{selected.rep}</span></div>
              </div>
            </div>
          ) : (
            <div className="text-center py-10 text-slate-400 text-sm">
              Click a dot in the chart or a row in the table
            </div>
          )}
        </div>

        {/* Deal table */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="text-base font-semibold text-slate-800">Top {filtered.length} Deals</h2>
          </div>
          <div className="overflow-auto max-h-[460px]">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-slate-50 border-b border-slate-200">
                <tr>
                  {["ID", "Product", "Segment", "List Price", "Discount", "Net Price", "Pipeline", "Risk"].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-slate-600 font-medium whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map((d) => (
                  <tr
                    key={d.id}
                    onClick={() => setSelected(d)}
                    className={`cursor-pointer hover:bg-blue-50 transition-colors ${selected?.id === d.id ? "bg-blue-50" : ""}`}
                  >
                    <td className="px-4 py-2.5 font-mono text-slate-500">{d.id}</td>
                    <td className="px-4 py-2.5 font-medium text-slate-800">{d.product}</td>
                    <td className="px-4 py-2.5 text-slate-600">{d.segment}</td>
                    <td className="px-4 py-2.5 text-slate-700">${fmt(d.listPrice / 1_000_000)}</td>
                    <td className="px-4 py-2.5">
                      <span className={`font-semibold ${d.corridorStatus === "red" ? "text-red-600" : d.corridorStatus === "yellow" ? "text-amber-600" : "text-green-600"}`}>
                        {fmtPct(d.totalDiscountRate)}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-slate-700">${fmt(d.netPrice / 1_000_000)}</td>
                    <td className="px-4 py-2.5 text-slate-600">{d.daysInPipeline}d</td>
                    <td className="px-4 py-2.5">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium border ${RISK_COLORS[d.riskLevel]}`}>
                        {d.riskLevel}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
