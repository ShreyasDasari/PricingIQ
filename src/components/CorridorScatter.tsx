"use client";

import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
  ReferenceArea,
} from "recharts";
import type { Deal } from "@/data/deals";

interface Props {
  deals: Deal[];
  onSelect: (d: Deal) => void;
  selected: Deal | null;
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: Deal }> }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-[#0D1117] border border-[#30363D] px-3 py-2.5 shadow-xl text-[11px]">
      <p className="font-bold text-white mb-1">{d.id} · {d.product}</p>
      <p className="text-[#8B949E]">{d.segment} · {d.rep}</p>
      <div className="mt-1.5 space-y-0.5">
        <div className="flex justify-between gap-4">
          <span className="text-[#8B949E]">Discount</span>
          <span className={`font-bold tabular-nums ${d.corridorStatus === "red" ? "text-red-400" : d.corridorStatus === "yellow" ? "text-amber-400" : "text-emerald-400"}`}>
            {(d.totalDiscountRate * 100).toFixed(1)}%
          </span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-[#8B949E]">List Price</span>
          <span className="text-white font-semibold tabular-nums">${(d.listPrice / 1000).toFixed(0)}K</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-[#8B949E]">Risk</span>
          <span className={`font-bold ${d.riskLevel === "High" ? "text-red-400" : d.riskLevel === "Medium" ? "text-amber-400" : "text-emerald-400"}`}>
            {d.riskLevel}
          </span>
        </div>
      </div>
    </div>
  );
}

const DOT_COLOR: Record<string, string> = {
  green: "#059669",
  yellow: "#D97706",
  red: "#DC2626",
};

export default function CorridorScatter({ deals, onSelect, selected }: Props) {
  const data = deals.map((d) => ({
    ...d,
    discountPct: d.totalDiscountRate * 100,
    listK: d.listPrice / 1000,
  }));

  return (
    <ResponsiveContainer width="100%" height={260}>
      <ScatterChart margin={{ top: 8, right: 20, bottom: 16, left: 10 }}>
        <ReferenceArea x1={0} x2={20} fill="#F0FDF4" fillOpacity={0.6} />
        <ReferenceArea x1={20} x2={35} fill="#FFFBEB" fillOpacity={0.6} />
        <ReferenceArea x1={35} x2={75} fill="#FEF2F2" fillOpacity={0.6} />
        <CartesianGrid strokeDasharray="2 4" stroke="#F1F5F9" />
        <XAxis
          dataKey="discountPct"
          type="number"
          domain={[0, 75]}
          label={{ value: "Discount Rate (%)", position: "insideBottom", offset: -8, fontSize: 10, fill: "#94A3B8", fontWeight: 500 }}
          tick={{ fontSize: 10, fill: "#94A3B8" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          dataKey="listK"
          type="number"
          tickFormatter={(v) => v >= 1000 ? `$${(v / 1000).toFixed(0)}M` : `$${v}K`}
          tick={{ fontSize: 10, fill: "#94A3B8" }}
          axisLine={false}
          tickLine={false}
          width={48}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: "3 3", stroke: "#CBD5E1" }} />
        <ReferenceLine x={20} stroke="#059669" strokeDasharray="3 2" strokeWidth={1} label={{ value: "20%", fontSize: 9, fill: "#059669", position: "insideTopRight" }} />
        <ReferenceLine x={35} stroke="#D97706" strokeDasharray="3 2" strokeWidth={1} label={{ value: "35%", fontSize: 9, fill: "#D97706", position: "insideTopRight" }} />
        <Scatter data={data} onClick={(d) => onSelect(d as unknown as Deal)} cursor="pointer">
          {data.map((entry, index) => (
            <Cell
              key={index}
              fill={DOT_COLOR[entry.corridorStatus]}
              fillOpacity={selected?.id === entry.id ? 1 : 0.5}
              stroke={selected?.id === entry.id ? "#111827" : DOT_COLOR[entry.corridorStatus]}
              strokeWidth={selected?.id === entry.id ? 2 : 0.5}
              r={selected?.id === entry.id ? 6 : 3.5}
            />
          ))}
        </Scatter>
      </ScatterChart>
    </ResponsiveContainer>
  );
}
