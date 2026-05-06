"use client";

import { useState, useMemo } from "react";
import { deals } from "@/data/deals";
import { fmtPct, fmt } from "@/lib/utils";

interface AlertRule {
  id: string;
  label: string;
  description: string;
  threshold: number;
  unit: string;
  min: number;
  max: number;
  step: number;
  check: (d: (typeof deals)[0], t: number) => boolean;
  severity: "critical" | "warning";
}

const RULES: AlertRule[] = [
  {
    id: "discount_ceiling",
    label: "Discount Ceiling",
    description: "Flag deals where total discount exceeds threshold",
    threshold: 35,
    unit: "%",
    min: 10,
    max: 65,
    step: 5,
    check: (d, t) => d.totalDiscountRate * 100 > t,
    severity: "critical",
  },
  {
    id: "realization_floor",
    label: "Realization Rate Floor",
    description: "Flag deals where realized revenue falls below % of net price",
    threshold: 95,
    unit: "%",
    min: 80,
    max: 100,
    step: 1,
    check: (d, t) => (d.realizedRevenue / d.netPrice) * 100 < t,
    severity: "warning",
  },
  {
    id: "pipeline_age",
    label: "Pipeline Age Limit",
    description: "Flag deals stuck longer than threshold days",
    threshold: 90,
    unit: "days",
    min: 30,
    max: 180,
    step: 10,
    check: (d, t) => d.daysInPipeline > t,
    severity: "warning",
  },
  {
    id: "deal_size",
    label: "Large Deal Approval",
    description: "Flag high-discount deals above list price threshold",
    threshold: 500,
    unit: "$K",
    min: 100,
    max: 2000,
    step: 100,
    check: (d, t) => d.listPrice > t * 1000 && d.totalDiscountRate > 0.25,
    severity: "critical",
  },
];

export default function AlertsPage() {
  const [thresholds, setThresholds] = useState<Record<string, number>>(
    Object.fromEntries(RULES.map((r) => [r.id, r.threshold]))
  );
  const [activeRule, setActiveRule] = useState<string>("discount_ceiling");

  const updateThreshold = (id: string, value: number) =>
    setThresholds((prev) => ({ ...prev, [id]: value }));

  const alertsByRule = useMemo(() =>
    Object.fromEntries(
      RULES.map((rule) => [rule.id, deals.filter((d) => rule.check(d, thresholds[rule.id]))])
    ),
    [thresholds]
  );

  const activeAlerts = alertsByRule[activeRule] ?? [];
  const activeRuleDef = RULES.find((r) => r.id === activeRule)!;

  return (
    <div className="p-6 max-w-[1300px] mx-auto space-y-5">
      {/* Header */}
      <div className="border-b border-slate-200 pb-4">
        <p className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">Module 4</p>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight mt-0.5">Intelligent Alerts</h1>
        <p className="text-[12px] text-slate-500 mt-0.5">Threshold-based monitoring · Adjust rules and review breaches in real time</p>
      </div>

      {/* Rule selector cards */}
      <div className="grid grid-cols-4 gap-3">
        {RULES.map((rule) => {
          const count = alertsByRule[rule.id]?.length ?? 0;
          const isActive = rule.id === activeRule;
          const isCritical = rule.severity === "critical";
          return (
            <button
              key={rule.id}
              onClick={() => setActiveRule(rule.id)}
              className={`text-left border p-4 transition-all duration-150 border-l-4 hover:shadow-sm ${
                isActive
                  ? isCritical
                    ? "border-red-600 border-l-red-600 bg-red-50"
                    : "border-amber-500 border-l-amber-500 bg-amber-50"
                  : "border-slate-200 border-l-slate-300 bg-white hover:border-slate-300"
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <span className={`text-[10px] font-bold uppercase tracking-wider ${isCritical ? "text-red-600" : "text-amber-600"}`}>
                  {isCritical ? "● CRITICAL" : "◆ WARNING"}
                </span>
                <span className={`text-2xl font-black tabular-nums leading-none ${count > 0 ? (isCritical ? "text-red-600" : "text-amber-600") : "text-slate-300"}`}>
                  {count}
                </span>
              </div>
              <p className="text-[12px] font-bold text-slate-800">{rule.label}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">@ {thresholds[rule.id]}{rule.unit}</p>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-12 gap-4">
        {/* Threshold controls */}
        <div className="col-span-3 bg-white border border-slate-200">
          <div className="px-4 py-3 border-b border-slate-200">
            <p className="section-title">Rule Configuration</p>
          </div>
          <div className="p-4 space-y-6">
            {RULES.map((rule) => {
              const isCritical = rule.severity === "critical";
              return (
                <div key={rule.id}>
                  <div className="flex justify-between items-baseline mb-1">
                    <span className="text-[11px] font-bold text-slate-700">{rule.label}</span>
                    <span className={`text-[13px] font-black tabular-nums ${isCritical ? "text-red-600" : "text-amber-600"}`}>
                      {thresholds[rule.id]}{rule.unit}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={rule.min}
                    max={rule.max}
                    step={rule.step}
                    value={thresholds[rule.id]}
                    onChange={(e) => updateThreshold(rule.id, Number(e.target.value))}
                    className="w-full h-1 rounded-none appearance-none cursor-pointer bg-slate-200 accent-slate-800"
                  />
                  <div className="flex justify-between text-[9px] text-slate-400 mt-0.5 font-medium">
                    <span>{rule.min}{rule.unit}</span>
                    <span>{rule.max}{rule.unit}</span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1.5 leading-relaxed">{rule.description}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Breach list */}
        <div className="col-span-9 bg-white border border-slate-200">
          <div className={`flex items-center justify-between px-5 py-3 border-b border-slate-200 ${activeRuleDef.severity === "critical" ? "bg-red-50" : "bg-amber-50"}`}>
            <div>
              <p className={`section-title ${activeRuleDef.severity === "critical" ? "text-red-800" : "text-amber-800"}`}>
                {activeRuleDef.severity === "critical" ? "● " : "◆ "}{activeRuleDef.label} Breaches
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5">Threshold: {thresholds[activeRule]}{activeRuleDef.unit}</p>
            </div>
            <div className="text-right">
              <p className={`text-3xl font-black tabular-nums leading-none ${activeRuleDef.severity === "critical" ? "text-red-600" : "text-amber-600"}`}>
                {activeAlerts.length}
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5">breach{activeAlerts.length !== 1 ? "es" : ""} detected</p>
            </div>
          </div>

          {activeAlerts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mb-3 opacity-30">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-[13px] font-semibold">No breaches at current threshold</p>
              <p className="text-[11px] mt-1">Adjust the threshold to surface alerts</p>
            </div>
          ) : (
            <div className="overflow-auto max-h-[480px]">
              <table className="ent-table">
                <thead>
                  <tr>
                    <th>Deal ID</th>
                    <th>Product</th>
                    <th>Segment</th>
                    <th>Rep</th>
                    <th className="num">List Price</th>
                    <th className="num">Discount</th>
                    <th className="num">Net Price</th>
                    <th className="num">Days</th>
                    <th>Risk</th>
                    <th>Corridor</th>
                  </tr>
                </thead>
                <tbody>
                  {activeAlerts.slice(0, 150).map((d) => (
                    <tr key={d.id}>
                      <td className="font-mono text-[11px] text-slate-400">{d.id}</td>
                      <td className="font-semibold text-slate-900">{d.product}</td>
                      <td className="text-slate-600">{d.segment}</td>
                      <td className="text-slate-500 text-[11px]">{d.rep}</td>
                      <td className="num tabular-nums text-slate-700">${fmt(d.listPrice / 1_000_000)}</td>
                      <td className="num tabular-nums">
                        <span className={`font-bold ${d.corridorStatus === "red" ? "text-red-600" : d.corridorStatus === "yellow" ? "text-amber-600" : "text-emerald-600"}`}>
                          {fmtPct(d.totalDiscountRate)}
                        </span>
                      </td>
                      <td className="num tabular-nums text-slate-700">${fmt(d.netPrice / 1_000_000)}</td>
                      <td className="num tabular-nums text-slate-500">{d.daysInPipeline}d</td>
                      <td>
                        <span className={d.riskLevel === "High" ? "data-badge-red" : d.riskLevel === "Medium" ? "data-badge-amber" : "data-badge-green"}>
                          {d.riskLevel}
                        </span>
                      </td>
                      <td>
                        <span className={d.corridorStatus === "red" ? "data-badge-red" : d.corridorStatus === "yellow" ? "data-badge-amber" : "data-badge-green"}>
                          {d.corridorStatus === "red" ? "Breach" : d.corridorStatus === "yellow" ? "Near" : "OK"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
