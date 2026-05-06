"use client";

import { useState } from "react";
import { useCompletion } from "@ai-sdk/react";
import { deals, getWaterfallData, type Product, type Segment, type Region } from "@/data/deals";
import { fmtPct, fmtDollar } from "@/lib/utils";
import { useMemo } from "react";

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

  const { completion, complete, isLoading, error } = useCompletion({
    api: "/api/narrative",
    streamProtocol: "text",
  });

  const handleGenerate = () => {
    complete("", {
      body: { product, segment, region },
    });
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">AI Executive Narrative</h1>
        <p className="text-slate-500 mt-1">Gemini generates a board-ready pipeline summary from live deal data</p>
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

      {/* Live stats snapshot */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Deals", value: filtered.length.toString() },
          { label: "Realized Revenue", value: fmtDollar(s.totalRealized) },
          { label: "Avg Discount", value: fmtPct(s.avgDiscountRate) },
          { label: "Corridor Violations", value: s.corridorViolations.toString() },
        ].map(({ label, value }) => (
          <div key={label} className="bg-slate-100 rounded-lg p-3 text-center">
            <p className="text-xs text-slate-500 font-medium">{label}</p>
            <p className="text-xl font-bold text-slate-800 mt-0.5">{value}</p>
          </div>
        ))}
      </div>

      {/* Generate button */}
      <div className="mb-6">
        <button
          onClick={handleGenerate}
          disabled={isLoading}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold px-6 py-2.5 rounded-lg transition-colors"
        >
          {isLoading ? (
            <>
              <span className="animate-spin text-base">↻</span>
              Generating narrative…
            </>
          ) : (
            <>
              <span>✦</span>
              Generate Executive Narrative
            </>
          )}
        </button>
      </div>

      {/* Output */}
      {(completion || isLoading) && (
        <div className="bg-white rounded-xl border border-blue-200 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-blue-600 font-bold text-sm">✦ AI Executive Summary</span>
            <span className="text-xs text-slate-400">
              {product !== "All" && `${product} · `}
              {segment !== "All" && `${segment} · `}
              {region !== "All" && `${region} · `}
              {filtered.length} deals
            </span>
          </div>
          <p className="text-slate-800 leading-relaxed text-base font-serif">
            {completion}
            {isLoading && <span className="animate-pulse text-blue-400 ml-0.5">|</span>}
          </p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
          <strong>Error:</strong> {error.message}. Make sure <code className="bg-red-100 px-1 rounded">GOOGLE_GENERATIVE_AI_API_KEY</code> is set in your environment.
        </div>
      )}

      {!completion && !isLoading && (
        <div className="bg-slate-50 rounded-xl border border-slate-200 p-10 text-center text-slate-400">
          <p className="text-4xl mb-3">✦</p>
          <p className="text-sm">Select a filter scope and click <strong>Generate Executive Narrative</strong></p>
          <p className="text-xs mt-1">Gemini will analyze the filtered deal book and produce a 4-sentence executive summary</p>
        </div>
      )}
    </div>
  );
}
