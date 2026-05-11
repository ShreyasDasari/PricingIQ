"use client";

import { useState, useEffect, useRef } from "react";
import type { WarRoomInput, WarRoomResponse } from "@/types/war-room";

// ─── Constants ───────────────────────────────────────────────────────────────

const PRESETS: Array<{ label: string; data: WarRoomInput }> = [
  {
    label: "High-Risk Partner",
    data: { product: "Service", segment: "Partner", region: "APAC", listPrice: 450000, totalDiscountRate: 42, daysInPipeline: 138, dealDescription: "Reseller deal with competitive pressure from SAP, requesting deep partner margin." },
  },
  {
    label: "Standard Enterprise",
    data: { product: "Windchill", segment: "Enterprise", region: "Americas", listPrice: 800000, totalDiscountRate: 18, daysInPipeline: 45, dealDescription: "Renewal expansion for existing Windchill PLM customer, low competitive risk." },
  },
  {
    label: "Borderline Mid-Market",
    data: { product: "Creo", segment: "Mid-Market", region: "EMEA", listPrice: 180000, totalDiscountRate: 31, daysInPipeline: 89, dealDescription: "New logo deal in DACH region, customer comparing vs SolidWorks." },
  },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function PulsingDot({ color = "bg-red-500" }: { color?: string }) {
  return (
    <span className="relative inline-flex h-2.5 w-2.5">
      <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${color} opacity-75`} />
      <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${color}`} />
    </span>
  );
}

function AgentLoadingCard({ name, accent, icon, status }: { name: string; accent: string; icon: React.ReactNode; status: "analyzing" | "waiting" }) {
  return (
    <div className={`bg-white border border-slate-200 border-l-4 ${accent} p-5`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <span className="text-slate-400">{icon}</span>
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{name}</span>
        </div>
        {status === "analyzing" ? (
          <div className="flex items-center gap-1.5">
            <PulsingDot color="bg-blue-500" />
            <span className="text-[10px] text-blue-600 font-medium">Analyzing…</span>
          </div>
        ) : (
          <span className="text-[10px] text-slate-400">Waiting…</span>
        )}
      </div>
      <div className="space-y-2">
        {[60, 40, 80].map((w, i) => (
          <div key={i} className="h-2 bg-slate-100 rounded animate-pulse" style={{ width: `${w}%` }} />
        ))}
        <div className="h-8 bg-slate-50 rounded animate-pulse mt-3" />
      </div>
    </div>
  );
}

function StatChip({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="text-center">
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
      <p className={`text-[13px] font-black tabular-nums mt-0.5 ${highlight ? "text-red-600" : "text-slate-800"}`}>{value}</p>
    </div>
  );
}

function fmtUSD(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}

// ─── Main page ────────────────────────────────────────────────────────────────

const EMPTY: WarRoomInput = {
  product: "Windchill",
  segment: "Enterprise",
  region: "Americas",
  listPrice: 500000,
  totalDiscountRate: 25,
  daysInPipeline: 60,
  dealDescription: "",
};

type Phase = "idle" | "loading" | "done";

export default function WarRoomPage() {
  const [form, setForm] = useState<WarRoomInput>(EMPTY);
  const [phase, setPhase] = useState<Phase>("idle");
  const [result, setResult] = useState<WarRoomResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(-1);
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  const update = (k: keyof WarRoomInput, v: string | number) =>
    setForm((f) => ({ ...f, [k]: v }));

  const loadPreset = (preset: WarRoomInput) => setForm(preset);

  const analyze = async () => {
    setPhase("loading");
    setResult(null);
    setError(null);
    setRevealed(-1);
    setElapsed(0);

    const startTime = Date.now();
    timerRef.current = setInterval(() => setElapsed(Date.now() - startTime), 100);

    try {
      const res = await fetch("/api/war-room", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error(`API error ${res.status}`);
      const data: WarRoomResponse = await res.json();

      clearInterval(timerRef.current!);
      setResult(data);
      setPhase("done");

      // Scroll to results
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);

      // Staggered reveal: 4 cards × 150ms each
      [0, 1, 2, 3].forEach((i) => setTimeout(() => setRevealed(i), i * 150));
    } catch (err) {
      clearInterval(timerRef.current!);
      setError(err instanceof Error ? err.message : "Unknown error");
      setPhase("idle");
    }
  };

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  const reset = () => {
    setPhase("idle");
    setResult(null);
    setRevealed(-1);
    setError(null);
  };

  const inputCls = "w-full border border-slate-200 bg-white px-3 py-2 text-[13px] text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-400 focus:border-slate-400 placeholder:text-slate-300";
  const selectCls = "w-full border border-slate-200 bg-white px-3 py-2 text-[13px] text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-400";
  const labelCls = "block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5";

  const decision = result?.orchestrator.decision;
  const decisionConfig = {
    APPROVE:      { bg: "bg-emerald-600", text: "APPROVE",      border: "border-emerald-600" },
    ESCALATE:     { bg: "bg-amber-500",   text: "ESCALATE",     border: "border-amber-500"   },
    RENEGOTIATE:  { bg: "bg-red-600",     text: "RENEGOTIATE",  border: "border-red-600"     },
  };
  const dc = decision ? decisionConfig[decision] : null;

  return (
    <div className="p-6 max-w-[1200px] mx-auto space-y-6">

      {/* ── Page header ─────────────────────────────────────────────────────── */}
      <div className="border-b border-slate-200 pb-5">
        <div className="flex items-center gap-3">
          <PulsingDot color="bg-red-500" />
          <h1 className="text-xl font-black text-slate-900 tracking-tight uppercase">Deal War Room</h1>
        </div>
        <p className="text-[12px] text-slate-500 mt-1 ml-[22px]">
          Multi-agent pricing decision system · Powered by Gemini · Three specialists + one orchestrator
        </p>
      </div>

      {/* ── Input panel ─────────────────────────────────────────────────────── */}
      <div className="bg-white border border-slate-200">
        <div className="px-5 py-3 border-b border-slate-200 bg-[#0D1117]">
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#8B949E]">Deal Input</p>
        </div>
        <div className="p-5 space-y-4">
          {/* Row 1: dropdowns */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className={labelCls}>Product</label>
              <select value={form.product} onChange={(e) => update("product", e.target.value)} className={selectCls}>
                {["Creo", "Windchill", "Service"].map((o) => <option key={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Segment</label>
              <select value={form.segment} onChange={(e) => update("segment", e.target.value)} className={selectCls}>
                {["Enterprise", "Mid-Market", "SMB", "Partner"].map((o) => <option key={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Region</label>
              <select value={form.region} onChange={(e) => update("region", e.target.value)} className={selectCls}>
                {["Americas", "EMEA", "APAC"].map((o) => <option key={o}>{o}</option>)}
              </select>
            </div>
          </div>

          {/* Row 2: numbers */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className={labelCls}>List Price</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[13px] font-medium">$</span>
                <input
                  type="number"
                  value={form.listPrice}
                  onChange={(e) => update("listPrice", Number(e.target.value))}
                  className={`${inputCls} pl-6`}
                  min={1000}
                  placeholder="500000"
                />
              </div>
            </div>
            <div>
              <label className={labelCls}>Total Discount Rate</label>
              <div className="relative">
                <input
                  type="number"
                  value={form.totalDiscountRate}
                  onChange={(e) => update("totalDiscountRate", Number(e.target.value))}
                  className={`${inputCls} pr-7`}
                  min={0}
                  max={55}
                  placeholder="25"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-[13px] font-medium">%</span>
              </div>
            </div>
            <div>
              <label className={labelCls}>Days in Pipeline</label>
              <input
                type="number"
                value={form.daysInPipeline}
                onChange={(e) => update("daysInPipeline", Number(e.target.value))}
                className={inputCls}
                min={1}
                placeholder="60"
              />
            </div>
          </div>

          {/* Row 3: description */}
          <div>
            <label className={labelCls}>Deal Context <span className="normal-case font-normal text-slate-400">(optional)</span></label>
            <textarea
              value={form.dealDescription ?? ""}
              onChange={(e) => update("dealDescription", e.target.value)}
              rows={2}
              className={`${inputCls} resize-none`}
              placeholder="Describe competitive pressure, customer relationship, strategic account context…"
            />
          </div>

          {/* Analyze button */}
          <button
            onClick={analyze}
            disabled={phase === "loading"}
            className="w-full bg-[#0D1117] hover:bg-slate-800 disabled:bg-slate-300 text-white text-[13px] font-bold uppercase tracking-wider py-3 transition-colors duration-150 flex items-center justify-center gap-2"
          >
            {phase === "loading" ? (
              <>
                <span className="inline-block w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Agents analyzing… {(elapsed / 1000).toFixed(1)}s
              </>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M8 1L9.5 5.5H14L10.5 8.5L12 13L8 10.5L4 13L5.5 8.5L2 5.5H6.5L8 1Z" />
                </svg>
                Analyze Deal
              </>
            )}
          </button>

          {/* Quick load presets */}
          <div className="flex items-center gap-3 pt-1 flex-wrap">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Quick Load:</span>
            {PRESETS.map(({ label, data }) => (
              <button
                key={label}
                onClick={() => loadPreset(data)}
                disabled={phase === "loading"}
                className="text-[11px] font-medium text-slate-600 border border-slate-200 px-3 py-1.5 hover:bg-slate-50 hover:border-slate-300 transition-colors disabled:opacity-40"
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Error state ──────────────────────────────────────────────────────── */}
      {error && (
        <div className="border border-red-200 bg-red-50 p-4 text-[12px] text-red-700">
          <strong>Error:</strong> {error}
          <button onClick={() => setError(null)} className="ml-3 underline">Dismiss</button>
        </div>
      )}

      {/* ── Loading state ────────────────────────────────────────────────────── */}
      {phase === "loading" && (
        <div ref={resultsRef} className="space-y-4">
          <div className="flex items-center gap-2">
            <PulsingDot color="bg-blue-500" />
            <p className="text-[11px] font-bold uppercase tracking-wider text-blue-600">
              War Room Active — Agents running in parallel
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AgentLoadingCard name="Deal Detective" accent="border-l-blue-500" status="analyzing"
              icon={<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="7" cy="7" r="5"/><path d="M11 11l3 3"/></svg>}
            />
            <AgentLoadingCard name="Risk Prosecutor" accent="border-l-red-600" status="analyzing"
              icon={<svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M8 1L15 14H1L8 1Z" opacity="0.2"/><path d="M8 1L15 14H1L8 1Z" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/><rect x="7.25" y="6" width="1.5" height="3.5" rx="0.5"/><rect x="7.25" y="11" width="1.5" height="1.5" rx="0.5"/></svg>}
            />
            <AgentLoadingCard name="Deal Architect" accent="border-l-emerald-500" status="analyzing"
              icon={<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 14l3-3 7-7-3-3-7 7-3 3 3 3z"/><path d="M9 4l3 3"/></svg>}
            />
            <AgentLoadingCard name="Orchestrator" accent="border-l-slate-400" status="waiting"
              icon={<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="8" cy="8" r="6"/><circle cx="8" cy="8" r="2"/><path d="M8 2v2M8 12v2M2 8h2M12 8h2"/></svg>}
            />
          </div>
        </div>
      )}

      {/* ── Results ──────────────────────────────────────────────────────────── */}
      {phase === "done" && result && (
        <div ref={resultsRef} className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <PulsingDot color="bg-emerald-500" />
              <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-600">
                Analysis Complete — {(result.durationMs / 1000).toFixed(1)}s
              </p>
            </div>
            <button onClick={reset} className="text-[11px] text-slate-500 border border-slate-200 px-3 py-1.5 hover:bg-slate-50 transition-colors">
              ← Run New Analysis
            </button>
          </div>

          {/* 2×2 agent cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* Card 1 — Deal Detective */}
            <div className={`bg-white border border-slate-200 border-l-4 border-l-blue-500 transition-all duration-300 ${revealed >= 0 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"}`}>
              <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="#3b82f6" strokeWidth="1.5">
                    <circle cx="7" cy="7" r="5"/><path d="M11 11l3 3"/>
                  </svg>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600">Deal Detective</span>
                </div>
                <span className="text-[10px] text-slate-400">Historical Pattern Analysis</span>
              </div>
              <div className="p-5">
                <div className="grid grid-cols-3 gap-2 pb-4 border-b border-slate-100 mb-4">
                  <StatChip label="Similar Deals" value={result.detective.similarDealsFound.toString()} />
                  <StatChip label="Avg Hist. Disc." value={`${result.detective.avgDiscountRate.toFixed(1)}%`} highlight={result.detective.avgDiscountRate > 30} />
                  <StatChip label="Violation Rate" value={`${result.detective.corridorViolationRate.toFixed(0)}%`} highlight={result.detective.corridorViolationRate > 30} />
                </div>
                <p className="text-[12px] text-slate-700 leading-relaxed mb-4">{result.detective.pattern}</p>
                {/* Discount comparison bar */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                    <span>Avg historical</span>
                    <span>This deal</span>
                  </div>
                  <div className="relative h-2 bg-slate-100">
                    <div className="absolute left-0 top-0 h-full bg-blue-300 transition-all duration-500"
                      style={{ width: `${Math.min(100, result.detective.avgDiscountRate * 100 / 55)}%` }} />
                    <div className="absolute top-0 h-full w-0.5 bg-blue-700"
                      style={{ left: `${Math.min(100, result.detective.avgDiscountRate * 100 / 55)}%` }} />
                    <div className="absolute top-0 h-full w-0.5 bg-red-500"
                      style={{ left: `${Math.min(100, form.totalDiscountRate * 100 / 55)}%` }} />
                  </div>
                  <div className="flex justify-between text-[10px] tabular-nums">
                    <span className="text-blue-600 font-semibold">{result.detective.avgDiscountRate.toFixed(1)}%</span>
                    <span className={`font-semibold ${form.totalDiscountRate > 35 ? "text-red-600" : "text-slate-600"}`}>{form.totalDiscountRate}%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 2 — Risk Prosecutor */}
            <div className={`bg-white border border-slate-200 border-l-4 border-l-red-600 transition-all duration-300 ${revealed >= 1 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"}`}>
              <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="#dc2626" strokeWidth="1.5" strokeLinejoin="round">
                    <path d="M8 1L15 14H1L8 1Z"/><rect x="7.25" y="6" width="1.5" height="3.5" rx="0.5" fill="#dc2626"/><rect x="7.25" y="11" width="1.5" height="1.5" rx="0.5" fill="#dc2626"/>
                  </svg>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-red-600">Risk Prosecutor</span>
                </div>
                <span className="text-[10px] text-slate-400">Worst-Case Analysis</span>
              </div>
              <div className="p-5">
                <div className="grid grid-cols-3 gap-2 pb-4 border-b border-slate-100 mb-4">
                  <StatChip label="Proj. Leakage" value={fmtUSD(result.prosecutor.projectedLeakage)} highlight={result.prosecutor.projectedLeakage > 0} />
                  <StatChip
                    label="Escalation Risk"
                    value={result.prosecutor.escalationProbability}
                    highlight={result.prosecutor.escalationProbability === "High"}
                  />
                  <StatChip label="Worst-Case Real." value={`${result.prosecutor.worstCaseRealization.toFixed(1)}%`} highlight={result.prosecutor.worstCaseRealization < 92} />
                </div>
                <p className="text-[12px] text-slate-700 leading-relaxed mb-4">{result.prosecutor.prosecution}</p>
                <div className="bg-red-50 border border-red-100 px-3 py-2.5 flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-red-600">Annualized Exposure</span>
                  <span className="text-[15px] font-black text-red-700 tabular-nums">{fmtUSD(result.prosecutor.annualizedRiskExposure)}</span>
                </div>
              </div>
            </div>

            {/* Card 3 — Deal Architect */}
            <div className={`bg-white border border-slate-200 border-l-4 border-l-emerald-500 transition-all duration-300 ${revealed >= 2 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"}`}>
              <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="#059669" strokeWidth="1.5">
                    <path d="M2 14l3-3 7-7-3-3-7 7-3 3 3 3z"/><path d="M9 4l3 3"/>
                  </svg>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600">Deal Architect</span>
                </div>
                <span className="text-[10px] text-slate-400">Constructive Recommendation</span>
              </div>
              <div className="p-5">
                <div className="grid grid-cols-3 gap-2 pb-4 border-b border-slate-100 mb-4">
                  <StatChip label="Rec. Discount" value={`${result.architect.recommendedTotalDiscount.toFixed(1)}%`} />
                  <StatChip label="Reduce" value={`${result.architect.discountToReduce}`} />
                  <StatChip label="Approval Tier" value={result.architect.approvalTier.split(" ")[0]} />
                </div>
                <p className="text-[12px] text-slate-700 leading-relaxed mb-4">{result.architect.architecture}</p>
                {/* Discount arrow viz */}
                <div className="flex items-center gap-3">
                  <div className={`text-center px-3 py-2 border flex-1 ${form.totalDiscountRate > 35 ? "bg-red-50 border-red-200" : "bg-amber-50 border-amber-200"}`}>
                    <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Current</p>
                    <p className={`text-[16px] font-black tabular-nums ${form.totalDiscountRate > 35 ? "text-red-600" : "text-amber-600"}`}>{form.totalDiscountRate}%</p>
                  </div>
                  <svg width="20" height="16" viewBox="0 0 20 16" fill="none">
                    <path d="M0 8h16M12 4l4 4-4 4" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <div className="text-center px-3 py-2 border border-emerald-200 bg-emerald-50 flex-1">
                    <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Target</p>
                    <p className="text-[16px] font-black tabular-nums text-emerald-600">{result.architect.recommendedTotalDiscount.toFixed(1)}%</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 4 — Orchestrator (full width on its row) */}
            <div className={`bg-white border border-slate-200 border-l-4 ${dc ? dc.border : "border-l-slate-300"} transition-all duration-300 ${revealed >= 3 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"}`}>
              <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="#64748b" strokeWidth="1.5">
                    <circle cx="8" cy="8" r="6"/><circle cx="8" cy="8" r="2"/><path d="M8 2v1.5M8 12.5V14M2 8h1.5M12.5 8H14"/>
                  </svg>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">Orchestrator</span>
                </div>
                <span className="text-[10px] text-slate-400">Final Synthesis</span>
              </div>
              <div className="p-5">
                <div className="flex items-center gap-3 mb-5">
                  {dc && (
                    <span className={`${dc.bg} text-white text-[13px] font-black uppercase tracking-widest px-4 py-2`}>
                      {dc.text}
                    </span>
                  )}
                  <span className={`text-[11px] font-bold border px-2.5 py-1.5 ${
                    result.orchestrator.confidenceLevel === "High" ? "border-emerald-300 text-emerald-700 bg-emerald-50" :
                    result.orchestrator.confidenceLevel === "Medium" ? "border-amber-300 text-amber-700 bg-amber-50" :
                    "border-red-300 text-red-700 bg-red-50"
                  }`}>
                    {result.orchestrator.confidenceLevel} Confidence
                  </span>
                </div>
                <p className="text-[13px] text-slate-700 leading-relaxed mb-4 font-serif">{result.orchestrator.executiveSummary}</p>
                <div className="bg-slate-900 text-white px-4 py-3 mb-3">
                  <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-1">Primary Action</p>
                  <p className="text-[12px] font-semibold leading-snug">{result.orchestrator.primaryAction}</p>
                </div>
                <div className="flex items-start gap-2 mb-4">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 shrink-0 mt-0.5">Revenue Impact</span>
                  <span className="text-[12px] text-slate-600">{result.orchestrator.revenueImpact}</span>
                </div>
                <p className="text-[10px] text-slate-400">
                  Analysis completed in {(result.durationMs / 1000).toFixed(1)}s · Powered by Gemini Flash
                </p>
              </div>
            </div>
          </div>

          {/* Reset button */}
          <div className="flex justify-center pt-2">
            <button onClick={reset} className="text-[12px] font-semibold text-slate-600 border border-slate-200 px-6 py-2.5 hover:bg-slate-50 transition-colors">
              ← Run New Analysis
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
