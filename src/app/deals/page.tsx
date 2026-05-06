"use client";

import { useState, useMemo } from "react";
import { deals, type Deal, type Product, type Segment } from "@/data/deals";
import { fmtPct, fmt } from "@/lib/utils";
import CorridorScatter from "@/components/CorridorScatter";

const RISK_BADGE: Record<string, string> = {
  High: "data-badge-red",
  Medium: "data-badge-amber",
  Low: "data-badge-green",
};

const SORT_OPTIONS = [
  { value: "riskScore", label: "Risk Score" },
  { value: "listPrice", label: "List Price" },
  { value: "totalDiscountRate", label: "Discount Rate" },
];

export default function DealsPage() {
  const [product, setProduct] = useState<Product | "All">("All");
  const [segment, setSegment] = useState<Segment | "All">("All");
  const [riskFilter, setRiskFilter] = useState<"All" | "High" | "Medium" | "Low">("All");
  const [sortBy, setSortBy] = useState<"riskScore" | "listPrice" | "totalDiscountRate">("riskScore");
  const [selected, setSelected] = useState<Deal | null>(null);

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

  const selectCls = "text-[12px] border border-slate-200 bg-white px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500";

  return (
    <div className="p-6 max-w-[1400px] mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between border-b border-slate-200 pb-4">
        <div>
          <p className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">Module 2</p>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight mt-0.5">Deal Scoring Engine</h1>
          <p className="text-[12px] text-slate-500 mt-0.5">Risk-scored deal book · Click any point or row for factor attribution</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {[
            { label: "Product", value: product, setter: setProduct, options: ["All", "Creo", "Windchill", "Service"] },
            { label: "Segment", value: segment, setter: setSegment, options: ["All", "Enterprise", "Mid-Market", "SMB", "Partner"] },
            { label: "Risk", value: riskFilter, setter: setRiskFilter, options: ["All", "High", "Medium", "Low"] },
          ].map(({ label, value, setter, options }) => (
            <div key={label} className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</span>
              <select value={value} onChange={(e) => setter(e.target.value as never)} className={selectCls}>
                {options.map((o) => <option key={o}>{o}</option>)}
              </select>
            </div>
          ))}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Sort</span>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value as never)} className={selectCls}>
              {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Scatter chart */}
      <div className="bg-white border border-slate-200">
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200">
          <p className="section-title">Discount vs. Deal Size — Corridor Map</p>
          <div className="flex items-center gap-4">
            {[
              { color: "bg-emerald-500", label: "Within corridor (≤20%)" },
              { color: "bg-amber-500", label: "Approaching (21–35%)" },
              { color: "bg-red-600", label: "Breach (>35%)" },
            ].map(({ color, label }) => (
              <div key={label} className="flex items-center gap-1.5">
                <div className={`w-2 h-2 rounded-full ${color}`} />
                <span className="text-[10px] text-slate-500 font-medium">{label}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="px-4 py-3">
          <CorridorScatter deals={filtered} onSelect={setSelected} selected={selected} />
        </div>
      </div>

      {/* Table + SHAP panel */}
      <div className="grid grid-cols-12 gap-4">
        {/* Deal table */}
        <div className="col-span-8 bg-white border border-slate-200">
          <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200">
            <p className="section-title">Deal Book</p>
            <span className="text-[11px] text-slate-400">{filtered.length} deals shown</span>
          </div>
          <div className="overflow-auto max-h-[420px]">
            <table className="ent-table">
              <thead>
                <tr>
                  <th>Deal ID</th>
                  <th>Product</th>
                  <th>Segment</th>
                  <th>Rep</th>
                  <th className="num">List Price</th>
                  <th className="num">Discount ↓</th>
                  <th className="num">Net Price</th>
                  <th className="num">Days</th>
                  <th>Risk</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((d) => (
                  <tr
                    key={d.id}
                    onClick={() => setSelected(d)}
                    className={`cursor-pointer ${selected?.id === d.id ? "!bg-blue-50 border-l-2 border-l-blue-500" : ""}`}
                  >
                    <td className="font-mono text-[11px] text-slate-400">{d.id}</td>
                    <td className="font-semibold text-slate-900">{d.product}</td>
                    <td className="text-slate-600">{d.segment}</td>
                    <td className="text-slate-500 text-[11px]">{d.rep}</td>
                    <td className="num tabular-nums text-slate-700">${fmt(d.listPrice / 1_000_000)}</td>
                    <td className="num tabular-nums">
                      <span className={`font-semibold ${d.corridorStatus === "red" ? "text-red-600" : d.corridorStatus === "yellow" ? "text-amber-600" : "text-emerald-600"}`}>
                        {fmtPct(d.totalDiscountRate)}
                      </span>
                    </td>
                    <td className="num tabular-nums text-slate-700">${fmt(d.netPrice / 1_000_000)}</td>
                    <td className="num tabular-nums text-slate-500">{d.daysInPipeline}d</td>
                    <td><span className={RISK_BADGE[d.riskLevel]}>{d.riskLevel}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* SHAP breakdown */}
        <div className="col-span-4 bg-white border border-slate-200">
          <div className="px-5 py-3 border-b border-slate-200">
            <p className="section-title">Risk Factor Attribution</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {selected ? `${selected.id} · ${selected.riskLevel} Risk` : "Select a deal to inspect"}
            </p>
          </div>

          {selected ? (
            <div className="p-4 space-y-4">
              {/* Risk score gauge */}
              <div className="border border-slate-100 bg-slate-50 p-3">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Composite Risk Score</span>
                  <span className={`text-[13px] font-black ${selected.riskLevel === "High" ? "text-red-600" : selected.riskLevel === "Medium" ? "text-amber-600" : "text-emerald-600"}`}>
                    {(selected.riskScore * 100).toFixed(0)} / 100
                  </span>
                </div>
                <div className="w-full bg-slate-200 h-2">
                  <div
                    className={`h-2 transition-all ${selected.riskLevel === "High" ? "bg-red-600" : selected.riskLevel === "Medium" ? "bg-amber-500" : "bg-emerald-500"}`}
                    style={{ width: `${selected.riskScore * 100}%` }}
                  />
                </div>
              </div>

              {/* Factor bars */}
              <div className="space-y-3">
                {[
                  { label: "Discount Depth", value: selected.shapFactors.discount, max: 0.4, color: "bg-red-500", weight: "40%" },
                  { label: "Deal Size", value: selected.shapFactors.dealSize, max: 0.2, color: "bg-blue-500", weight: "20%" },
                  { label: "Pipeline Age", value: selected.shapFactors.pipeline, max: 0.2, color: "bg-amber-500", weight: "20%" },
                  { label: "Close Probability", value: selected.shapFactors.closeRate, max: 0.2, color: "bg-purple-500", weight: "20%" },
                ].map(({ label, value, max, color, weight }) => (
                  <div key={label}>
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className="text-slate-700 font-medium">{label}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400 text-[10px]">{weight} weight</span>
                        <span className="text-slate-600 font-bold tabular-nums">{((value / max) * 100).toFixed(0)}%</span>
                      </div>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5">
                      <div className={`h-1.5 ${color}`} style={{ width: `${(value / max) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>

              {/* Deal details */}
              <div className="border-t border-slate-100 pt-3 space-y-1.5">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Deal Details</p>
                {[
                  { label: "Product", val: selected.product },
                  { label: "Segment", val: selected.segment },
                  { label: "Region", val: selected.region },
                  { label: "List Price", val: `$${(selected.listPrice / 1000).toFixed(0)}K` },
                  { label: "Net Price", val: `$${(selected.netPrice / 1000).toFixed(0)}K` },
                  { label: "Total Discount", val: fmtPct(selected.totalDiscountRate) },
                  { label: "Days in Pipeline", val: `${selected.daysInPipeline} days` },
                  { label: "Est. Close Rate", val: fmtPct(selected.closeRate) },
                  { label: "Rep", val: selected.rep },
                ].map(({ label, val }) => (
                  <div key={label} className="flex justify-between text-[11px]">
                    <span className="text-slate-400">{label}</span>
                    <span className="text-slate-800 font-semibold tabular-nums">{val}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400">
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none" className="mb-3 opacity-30">
                <circle cx="16" cy="16" r="13" stroke="currentColor" strokeWidth="2" />
                <circle cx="16" cy="16" r="6" stroke="currentColor" strokeWidth="2" />
                <circle cx="16" cy="16" r="2" fill="currentColor" />
              </svg>
              <p className="text-[12px] font-medium">Select a deal</p>
              <p className="text-[11px] mt-1">Click a dot in the chart or a row in the table</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
