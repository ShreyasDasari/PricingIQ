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
    <div className="bg-white border border-slate-200 rounded-lg px-3 py-2 shadow-lg text-xs">
      <p className="font-semibold text-slate-800">{d.id} · {d.product}</p>
      <p className="text-slate-500">{d.segment} · {d.rep}</p>
      <p className="mt-1">Discount: <span className="font-bold text-slate-700">{(d.totalDiscountRate * 100).toFixed(1)}%</span></p>
      <p>List Price: <span className="font-bold text-slate-700">${(d.listPrice / 1000).toFixed(0)}K</span></p>
      <p>Risk: <span className={`font-bold ${d.riskLevel === "High" ? "text-red-600" : d.riskLevel === "Medium" ? "text-amber-600" : "text-green-600"}`}>{d.riskLevel}</span></p>
    </div>
  );
}

const DOT_COLOR: Record<string, string> = {
  green: "#22c55e",
  yellow: "#f59e0b",
  red: "#ef4444",
};

export default function CorridorScatter({ deals, onSelect, selected }: Props) {
  const data = deals.map((d) => ({
    ...d,
    discountPct: d.totalDiscountRate * 100,
    listK: d.listPrice / 1000,
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <ScatterChart margin={{ top: 10, right: 20, bottom: 10, left: 10 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis
          dataKey="discountPct"
          type="number"
          domain={[0, 75]}
          label={{ value: "Discount Rate (%)", position: "insideBottom", offset: -4, fontSize: 11, fill: "#94a3b8" }}
          tick={{ fontSize: 11, fill: "#94a3b8" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          dataKey="listK"
          type="number"
          tickFormatter={(v) => `$${v >= 1000 ? (v / 1000).toFixed(0) + "M" : v + "K"}`}
          tick={{ fontSize: 11, fill: "#94a3b8" }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip content={<CustomTooltip />} />
        <ReferenceLine x={20} stroke="#22c55e" strokeDasharray="4 2" strokeWidth={1.5} label={{ value: "20%", fontSize: 10, fill: "#22c55e" }} />
        <ReferenceLine x={35} stroke="#f59e0b" strokeDasharray="4 2" strokeWidth={1.5} label={{ value: "35%", fontSize: 10, fill: "#f59e0b" }} />
        <Scatter
          data={data}
          onClick={(d) => onSelect(d as unknown as Deal)}
          cursor="pointer"
        >
          {data.map((entry, index) => (
            <Cell
              key={index}
              fill={DOT_COLOR[entry.corridorStatus]}
              fillOpacity={selected?.id === entry.id ? 1 : 0.55}
              stroke={selected?.id === entry.id ? "#1e40af" : "none"}
              strokeWidth={selected?.id === entry.id ? 2 : 0}
              r={selected?.id === entry.id ? 6 : 4}
            />
          ))}
        </Scatter>
      </ScatterChart>
    </ResponsiveContainer>
  );
}
