"use client";

import { useState, useMemo } from "react";
import { deals, getWaterfallData, type Product, type Segment, type Region } from "@/data/deals";
import { fmtDollar, fmtPct } from "@/lib/utils";
import WaterfallChart from "@/components/WaterfallChart";

export default function WaterfallPage() {
  const [product, setProduct] = useState<Product | "All">("All");
  const [segment, setSegment] = useState<Segment | "All">("All");
  const [region, setRegion] = useState<Region | "All">("All");

  const filtered = useMemo(() => {
    return deals.filter((d) => {
      if (product !== "All" && d.product !== product) return false;
      if (segment !== "All" && d.segment !== segment) return false;
      if (region !== "All" && d.region !== region) return false;
      return true;
    });
  }, [product, segment, region]);

  const { bars, summary: s } = useMemo(() => getWaterfallData(filtered), [filtered]);

  const corridorBreakdown = useMemo(() => ({
    green: filtered.filter((d) => d.corridorStatus === "green").length,
    yellow: filtered.filter((d) => d.corridorStatus === "yellow").length,
    red: filtered.filter((d) => d.corridorStatus === "red").length,
  }), [filtered]);

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Pricing Waterfall Analysis</h1>
        <p className="text-slate-500 mt-1">Revenue leakage across the discount chain · {filtered.length} deals</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        {[
          { label: "Product", value: product, setter: setProduct, options: ["All", "Creo", "Windchill", "ThingWorx"] },
          { label: "Segment", value: segment, setter: setSegment, options: ["All", "Enterprise", "Mid-Market", "SMB", "Partner"] },
          { label: "Region", value: region, setter: setRegion, options: ["All", "Americas", "EMEA", "APAC"] },
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

      {/* KPI row */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: "List Price", value: fmtDollar(s.totalList), color: "text-blue-700" },
          { label: "Net Price", value: fmtDollar(s.totalNet), color: "text-purple-700" },
          { label: "Realized Revenue", value: fmtDollar(s.totalRealized), color: "text-green-700" },
          { label: "Avg Discount", value: fmtPct(s.avgDiscountRate), color: s.avgDiscountRate > 0.35 ? "text-red-600" : "text-amber-600" },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white rounded-xl border border-slate-200 p-4">
            <p className="text-xs text-slate-500 uppercase font-medium">{label}</p>
            <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
        <h2 className="text-base font-semibold text-slate-800 mb-4">Revenue Waterfall</h2>
        <WaterfallChart data={bars} />
        <div className="mt-4 flex flex-wrap gap-4 justify-center">
          {[
            { color: "bg-blue-500", label: "List Price" },
            { color: "bg-red-500", label: "Volume Discount" },
            { color: "bg-orange-500", label: "Promo Discount" },
            { color: "bg-yellow-500", label: "Partner Discount" },
            { color: "bg-purple-500", label: "Net Price" },
            { color: "bg-pink-500", label: "Revenue Leakage" },
            { color: "bg-green-500", label: "Realized Revenue" },
          ].map(({ color, label }) => (
            <div key={label} className="flex items-center gap-1.5 text-xs text-slate-600">
              <div className={`w-3 h-3 rounded-sm ${color}`} />
              {label}
            </div>
          ))}
        </div>
      </div>

      {/* Corridor analysis */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-base font-semibold text-slate-800 mb-4">Discount Corridor Analysis</h2>
        <p className="text-xs text-slate-500 mb-4">Green: 0–20% · Yellow: 21–35% · Red: 36%+</p>
        <div className="space-y-3">
          {[
            { label: "Within Corridor (≤20%)", count: corridorBreakdown.green, pct: corridorBreakdown.green / filtered.length, bar: "bg-green-500", text: "text-green-700", badge: "bg-green-100 text-green-700" },
            { label: "Approaching Limit (21–35%)", count: corridorBreakdown.yellow, pct: corridorBreakdown.yellow / filtered.length, bar: "bg-amber-400", text: "text-amber-700", badge: "bg-amber-100 text-amber-700" },
            { label: "Outside Corridor (>35%)", count: corridorBreakdown.red, pct: corridorBreakdown.red / filtered.length, bar: "bg-red-500", text: "text-red-700", badge: "bg-red-100 text-red-700" },
          ].map(({ label, count, pct, bar, badge }) => (
            <div key={label}>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-slate-700">{label}</span>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${badge}`}>
                  {count} deals ({fmtPct(pct)})
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div className={`h-2 rounded-full ${bar}`} style={{ width: `${pct * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
