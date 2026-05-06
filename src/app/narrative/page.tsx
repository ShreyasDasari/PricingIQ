"use client";

import { useState, useMemo } from "react";
import { useCompletion } from "@ai-sdk/react";
import { deals, getWaterfallData, type Product, type Segment, type Region } from "@/data/deals";
import { fmtPct } from "@/lib/utils";
import KpiCard from "@/components/KpiCard";

export default function NarrativePage() {
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
  const { summary: s } = useMemo(() => getWaterfallData(filtered), [filtered]);
  const high = useMemo(() => filtered.filter((d) => d.riskLevel === "High").length, [filtered]);

  const { completion, complete, isLoading, error } = useCompletion({
    api: "/api/narrative",
    streamProtocol: "text",
  });

  const handleGenerate = () => {
    complete("", { body: { product, segment, region } });
  };

  const scopeLabel = [product, segment, region].filter((x) => x !== "All").join(" · ") || "All Products · All Segments · All Regions";
  const selectCls = "text-[12px] border border-slate-200 bg-white px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500";

  return (
    <div className="p-6 max-w-[900px] mx-auto space-y-5">
      {/* Header */}
      <div className="border-b border-slate-200 pb-4">
        <p className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">Module 3</p>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight mt-0.5">AI Executive Narrative</h1>
        <p className="text-[12px] text-slate-500 mt-0.5">Gemini generates a board-ready pipeline summary from live deal data</p>
      </div>

      {/* Filters + action */}
      <div className="bg-white border border-slate-200 p-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3 flex-wrap">
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
          <button
            onClick={handleGenerate}
            disabled={isLoading}
            className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white text-[12px] font-semibold px-4 py-2 transition-colors duration-150 shrink-0"
          >
            {isLoading ? (
              <>
                <span className="animate-spin inline-block w-3 h-3 border border-white border-t-transparent rounded-full" />
                Generating…
              </>
            ) : (
              <>
                <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M8 1L9.5 5.5H14L10.5 8.5L12 13L8 10.5L4 13L5.5 8.5L2 5.5H6.5L8 1Z" />
                </svg>
                Generate Narrative
              </>
            )}
          </button>
        </div>
      </div>

      {/* Snapshot KPIs */}
      <div className="grid grid-cols-4 gap-3">
        <KpiCard label="Deals in Scope" value={filtered.length.toString()} status="neutral" />
        <KpiCard label="Realized Revenue" value={`$${s.totalRealized.toFixed(1)}M`} sub={`${fmtPct(s.realizationRate)} realization`} status="green" />
        <KpiCard label="Avg Discount" value={fmtPct(s.avgDiscountRate)} status={s.avgDiscountRate > 0.3 ? "red" : s.avgDiscountRate > 0.2 ? "amber" : "green"} />
        <KpiCard label="High-Risk Deals" value={high.toString()} sub={`${s.corridorViolations} corridor violations`} status={high > 10 ? "red" : high > 5 ? "amber" : "green"} />
      </div>

      {/* Narrative output */}
      {(completion || isLoading) && (
        <div className="bg-white border border-slate-200">
          <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200 bg-slate-900">
            <div className="flex items-center gap-2">
              <svg width="12" height="12" viewBox="0 0 16 16" fill="#10B981">
                <path d="M8 1L9.5 5.5H14L10.5 8.5L12 13L8 10.5L4 13L5.5 8.5L2 5.5H6.5L8 1Z" />
              </svg>
              <span className="text-[11px] font-bold text-white uppercase tracking-wider">AI Executive Summary</span>
            </div>
            <span className="text-[10px] text-slate-400">{scopeLabel} · {filtered.length} deals</span>
          </div>
          <div className="px-6 py-5">
            <p className="text-[14px] text-slate-800 leading-relaxed font-serif tracking-tight">
              {completion}
              {isLoading && <span className="animate-pulse text-emerald-500 ml-0.5 font-sans">|</span>}
            </p>
          </div>
          {completion && !isLoading && (
            <div className="px-5 py-2.5 border-t border-slate-100 bg-slate-50 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
              <span className="text-[10px] text-slate-400">Generated by Gemini · {new Date().toLocaleTimeString()}</span>
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="border border-red-200 bg-red-50 p-4 text-[12px] text-red-700">
          <strong>Error:</strong> {error.message}. Ensure <code className="bg-red-100 px-1">GOOGLE_GENERATIVE_AI_API_KEY</code> is set.
        </div>
      )}

      {!completion && !isLoading && (
        <div className="bg-white border border-dashed border-slate-300 p-12 text-center">
          <div className="flex items-center justify-center mb-3">
            <svg width="32" height="32" viewBox="0 0 16 16" fill="#CBD5E1">
              <path d="M8 1L9.5 5.5H14L10.5 8.5L12 13L8 10.5L4 13L5.5 8.5L2 5.5H6.5L8 1Z" />
            </svg>
          </div>
          <p className="text-[13px] font-semibold text-slate-500">No narrative generated</p>
          <p className="text-[11px] text-slate-400 mt-1">Set filter scope and click <strong>Generate Narrative</strong> to produce an AI executive summary</p>
        </div>
      )}

      {/* How it works */}
      <div className="bg-white border border-slate-200 p-4">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">How This Works</p>
        <div className="grid grid-cols-3 gap-4">
          {[
            { step: "01", title: "Filter Scope", desc: "Select product, segment, and region to define the analysis population" },
            { step: "02", title: "Data Synthesis", desc: "Live deal metrics are aggregated: pipeline, discounts, violations, risk scores" },
            { step: "03", title: "AI Narration", desc: "Gemini Flash generates a 4-sentence executive brief in McKinsey style" },
          ].map(({ step, title, desc }) => (
            <div key={step} className="flex gap-2.5">
              <span className="text-[11px] font-black text-slate-300 shrink-0 mt-0.5">{step}</span>
              <div>
                <p className="text-[11px] font-bold text-slate-700">{title}</p>
                <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
