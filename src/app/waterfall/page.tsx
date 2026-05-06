"use client";

import { useState, useMemo } from "react";
import { deals, getWaterfallData, type Product, type Segment, type Region } from "@/data/deals";
import { fmtPct } from "@/lib/utils";
import WaterfallChart from "@/components/WaterfallChart";
import KpiCard from "@/components/KpiCard";

const CHART_COLORS = {
  start:    "#1E3A5F",
  decrease1: "#DC2626",
  decrease2: "#B91C1C",
  decrease3: "#991B1B",
  subtotal:  "#374151",
  leakage:   "#D97706",
  end:       "#059669",
};

export default function WaterfallPage() {
  const [product, setProduct] = useState<Product | "All">("All");
  const [segment, setSegment] = useState<Segment | "All">("All");
  const [region, setRegion] = useState<Region | "All">("All");

  const filtered = useMemo(() =>
    deals.filter((d) => {
      if (product !== "All" && d.product !== product) return false;
      if (segment !== "All" && d.segment !== segment) return false;
      if (region !== "All" && d.region !== region) return false;
      return true;
    }),
    [product, segment, region]
  );

  const { bars: rawBars, summary: s } = useMemo(() => getWaterfallData(filtered), [filtered]);

  // Apply financial color scheme
  const bars = rawBars.map((b, i) => ({
    ...b,
    fill: [
      CHART_COLORS.start,
      CHART_COLORS.decrease1,
      CHART_COLORS.decrease2,
      CHART_COLORS.decrease3,
      CHART_COLORS.subtotal,
      CHART_COLORS.leakage,
      CHART_COLORS.end,
    ][i] ?? b.fill,
  }));

  const corridorBreakdown = useMemo(() => ({
    green: filtered.filter((d) => d.corridorStatus === "green").length,
    yellow: filtered.filter((d) => d.corridorStatus === "yellow").length,
    red: filtered.filter((d) => d.corridorStatus === "red").length,
  }), [filtered]);

  const selectCls = "text-[12px] border border-slate-200 bg-white px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500";

  return (
    <div className="p-6 max-w-[1200px] mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between border-b border-slate-200 pb-4">
        <div>
          <p className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">Module 1</p>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight mt-0.5">Pricing Waterfall Analysis</h1>
          <p className="text-[12px] text-slate-500 mt-0.5">Revenue leakage decomposition across the discount chain</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {[
            { label: "Product", value: product, setter: setProduct, options: ["All", "Creo", "Windchill", "Service"] },
            { label: "Segment", value: segment, setter: setSegment, options: ["All", "Enterprise", "Mid-Market", "SMB", "Partner"] },
            { label: "Region", value: region, setter: setRegion, options: ["All", "Americas", "EMEA", "APAC"] },
          ].map(({ label, value, setter, options }) => (
            <div key={label} className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</span>
              <select value={value} onChange={(e) => setter(e.target.value as never)} className={selectCls}>
                {options.map((o) => <option key={o}>{o}</option>)}
              </select>
            </div>
          ))}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-3">
        <KpiCard
          label="List Price"
          value={`$${s.totalList.toFixed(1)}M`}
          sub={`${filtered.length} deals`}
          status="neutral"
        />
        <KpiCard
          label="Net Price"
          value={`$${s.totalNet.toFixed(1)}M`}
          sub={`$${s.totalDiscounts.toFixed(1)}M discounted`}
          status="neutral"
        />
        <KpiCard
          label="Realized Revenue"
          value={`$${s.totalRealized.toFixed(1)}M`}
          sub={`${fmtPct(s.realizationRate)} realization`}
          status={s.realizationRate < 0.96 ? "amber" : "green"}
        />
        <KpiCard
          label="Avg Discount Rate"
          value={fmtPct(s.avgDiscountRate)}
          sub={`${s.corridorViolations} corridor violations`}
          status={s.avgDiscountRate > 0.35 ? "red" : s.avgDiscountRate > 0.2 ? "amber" : "green"}
        />
      </div>

      {/* Waterfall chart */}
      <div className="bg-white border border-slate-200">
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200">
          <p className="section-title">Revenue Waterfall</p>
          <div className="flex items-center gap-4">
            {[
              { color: "bg-[#1E3A5F]", label: "List Price" },
              { color: "bg-red-600", label: "Discounts" },
              { color: "bg-slate-700", label: "Net Price" },
              { color: "bg-amber-600", label: "Rev. Leakage" },
              { color: "bg-emerald-600", label: "Realized" },
            ].map(({ color, label }) => (
              <div key={label} className="flex items-center gap-1.5">
                <div className={`w-2.5 h-2.5 ${color}`} />
                <span className="text-[10px] text-slate-500 font-medium">{label}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="px-4 py-4">
          <WaterfallChart data={bars} />
        </div>
        <div className="px-5 py-3 border-t border-slate-100 bg-slate-50 grid grid-cols-4 gap-6 text-center">
          {[
            { label: "Volume Discounts", val: `$${(filtered.reduce((s, d) => s + d.listPrice * d.volumeDiscount, 0) / 1e6).toFixed(1)}M` },
            { label: "Promo Discounts", val: `$${(filtered.reduce((s, d) => s + d.listPrice * d.promoDiscount, 0) / 1e6).toFixed(1)}M` },
            { label: "Partner Discounts", val: `$${(filtered.reduce((s, d) => s + d.listPrice * d.partnerDiscount, 0) / 1e6).toFixed(1)}M` },
            { label: "Total Leakage", val: `$${s.totalDiscounts.toFixed(1)}M` },
          ].map(({ label, val }) => (
            <div key={label}>
              <p className="text-[10px] text-slate-400 uppercase font-semibold tracking-wider">{label}</p>
              <p className="text-[15px] font-bold text-red-600 tabular-nums mt-0.5">{val}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Corridor analysis */}
      <div className="bg-white border border-slate-200">
        <div className="px-5 py-3 border-b border-slate-200">
          <p className="section-title">Discount Corridor Analysis</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Approved bands: Green ≤20% · Yellow 21–35% · Red &gt;35%</p>
        </div>
        <div className="p-5 space-y-4">
          {[
            {
              label: "Within Corridor", range: "0–20%", count: corridorBreakdown.green,
              pct: corridorBreakdown.green / filtered.length,
              bar: "bg-emerald-500", badge: "data-badge-green", text: "Compliant",
            },
            {
              label: "Approaching Limit", range: "21–35%", count: corridorBreakdown.yellow,
              pct: corridorBreakdown.yellow / filtered.length,
              bar: "bg-amber-400", badge: "data-badge-amber", text: "Monitor",
            },
            {
              label: "Outside Corridor", range: ">35%", count: corridorBreakdown.red,
              pct: corridorBreakdown.red / filtered.length,
              bar: "bg-red-600", badge: "data-badge-red", text: "Breach",
            },
          ].map(({ label, range, count, pct, bar, badge, text }) => (
            <div key={label}>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <span className={badge}>{text}</span>
                  <span className="text-[12px] font-medium text-slate-700">{label}</span>
                  <span className="text-[11px] text-slate-400">{range}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[11px] text-slate-500 tabular-nums">{count} deals</span>
                  <span className="text-[12px] font-bold text-slate-700 tabular-nums w-10 text-right">{fmtPct(pct)}</span>
                </div>
              </div>
              <div className="w-full bg-slate-100 h-1.5">
                <div className={`h-1.5 ${bar} transition-all duration-300`} style={{ width: `${pct * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
