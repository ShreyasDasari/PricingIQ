"use client";

import { useState, useMemo } from "react";
import { deals } from "@/data/deals";
import { fmtPct, fmtDollar } from "@/lib/utils";

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
    description: "Flag deals where total discount exceeds this threshold",
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
    description: "Flag deals where realized revenue falls below this % of net price",
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
    description: "Flag deals stuck in pipeline longer than this many days",
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
    label: "Large Deal Threshold",
    description: "Flag high-discount deals above this list price (requires extra approval)",
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
      RULES.map((rule) => [
        rule.id,
        deals.filter((d) => rule.check(d, thresholds[rule.id])),
      ])
    ),
    [thresholds]
  );

  const activeAlerts = alertsByRule[activeRule] ?? [];
  const activeRuleDef = RULES.find((r) => r.id === activeRule)!;

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Intelligent Alerts</h1>
        <p className="text-slate-500 mt-1">Threshold-based monitoring · Configure rules and review breaches in real time</p>
      </div>

      {/* Alert cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {RULES.map((rule) => {
          const count = alertsByRule[rule.id]?.length ?? 0;
          const isActive = rule.id === activeRule;
          return (
            <button
              key={rule.id}
              onClick={() => setActiveRule(rule.id)}
              className={`text-left rounded-xl border p-4 transition-all ${
                isActive
                  ? rule.severity === "critical"
                    ? "border-red-400 bg-red-50 shadow-md"
                    : "border-amber-400 bg-amber-50 shadow-md"
                  : "border-slate-200 bg-white hover:border-slate-300"
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <span className={`text-lg ${rule.severity === "critical" ? "text-red-500" : "text-amber-500"}`}>
                  {rule.severity === "critical" ? "🔴" : "🟡"}
                </span>
                <span className={`text-2xl font-bold ${count > 0 ? (rule.severity === "critical" ? "text-red-600" : "text-amber-600") : "text-slate-400"}`}>
                  {count}
                </span>
              </div>
              <p className="text-sm font-semibold text-slate-800">{rule.label}</p>
              <p className="text-xs text-slate-500 mt-0.5">@ {thresholds[rule.id]}{rule.unit}</p>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Threshold controls */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-base font-semibold text-slate-800 mb-4">Threshold Configuration</h2>
          <div className="space-y-6">
            {RULES.map((rule) => (
              <div key={rule.id}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium text-slate-700">{rule.label}</span>
                  <span className={`font-bold ${rule.severity === "critical" ? "text-red-600" : "text-amber-600"}`}>
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
                  className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-slate-200 accent-blue-600"
                />
                <div className="flex justify-between text-xs text-slate-400 mt-0.5">
                  <span>{rule.min}{rule.unit}</span>
                  <span>{rule.max}{rule.unit}</span>
                </div>
                <p className="text-xs text-slate-400 mt-1">{rule.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Active alert list */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className={`px-6 py-4 border-b ${activeRuleDef.severity === "critical" ? "bg-red-50 border-red-100" : "bg-amber-50 border-amber-100"}`}>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-slate-800">{activeRuleDef.label} Breaches</h2>
                <p className="text-xs text-slate-500 mt-0.5">Threshold: {thresholds[activeRule]}{activeRuleDef.unit}</p>
              </div>
              <span className={`text-2xl font-bold ${activeRuleDef.severity === "critical" ? "text-red-600" : "text-amber-600"}`}>
                {activeAlerts.length} breaches
              </span>
            </div>
          </div>

          {activeAlerts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400">
              <span className="text-4xl mb-2">✓</span>
              <p className="text-sm font-medium">No breaches at current threshold</p>
              <p className="text-xs mt-1">Lower the threshold to surface more alerts</p>
            </div>
          ) : (
            <div className="overflow-auto max-h-[440px]">
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-slate-50 border-b border-slate-200">
                  <tr>
                    {["Deal ID", "Product", "Segment", "Rep", "List Price", "Discount", "Net Price", "Days", "Risk"].map((h) => (
                      <th key={h} className="text-left px-4 py-3 text-slate-600 font-medium whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {activeAlerts.slice(0, 100).map((d) => (
                    <tr key={d.id} className="hover:bg-slate-50">
                      <td className="px-4 py-2.5 font-mono text-slate-500">{d.id}</td>
                      <td className="px-4 py-2.5 font-medium text-slate-800">{d.product}</td>
                      <td className="px-4 py-2.5 text-slate-600">{d.segment}</td>
                      <td className="px-4 py-2.5 text-slate-600 whitespace-nowrap">{d.rep}</td>
                      <td className="px-4 py-2.5 text-slate-700">{fmtDollar(d.listPrice / 1_000_000)}</td>
                      <td className="px-4 py-2.5">
                        <span className={`font-semibold ${d.corridorStatus === "red" ? "text-red-600" : d.corridorStatus === "yellow" ? "text-amber-600" : "text-green-600"}`}>
                          {fmtPct(d.totalDiscountRate)}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-slate-700">{fmtDollar(d.netPrice / 1_000_000)}</td>
                      <td className="px-4 py-2.5 text-slate-600">{d.daysInPipeline}d</td>
                      <td className="px-4 py-2.5">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium border ${
                          d.riskLevel === "High" ? "bg-red-100 text-red-700 border-red-200" :
                          d.riskLevel === "Medium" ? "bg-amber-100 text-amber-700 border-amber-200" :
                          "bg-green-100 text-green-700 border-green-200"
                        }`}>
                          {d.riskLevel}
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
