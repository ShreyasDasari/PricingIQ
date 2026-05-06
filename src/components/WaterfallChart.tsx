"use client";

import {
  ComposedChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from "recharts";

interface WaterfallBar {
  name: string;
  value: number;
  base: number;
  fill: string;
  type: string;
}

interface Props {
  data: WaterfallBar[];
}

function CustomTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ value: number; dataKey: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  const visible = payload.find((p) => p.dataKey === "visible")?.value ?? 0;
  const isDecrease = label?.includes("Disc") || label?.includes("Leakage");
  return (
    <div className="bg-white border border-slate-200 rounded-lg px-4 py-3 shadow-lg text-sm">
      <p className="font-semibold text-slate-800">{label}</p>
      <p className={`font-bold mt-0.5 ${isDecrease ? "text-red-600" : "text-blue-700"}`}>
        {isDecrease ? "-" : ""}${visible.toFixed(1)}M
      </p>
    </div>
  );
}

export default function WaterfallChart({ data }: Props) {
  const chartData = data.map((d) => {
    if (d.type === "start" || d.type === "subtotal" || d.type === "end") {
      return { name: d.name, invisible: 0, visible: d.value, fill: d.fill };
    }
    const absVal = Math.abs(d.value);
    const base = d.base + d.value;
    return { name: d.name, invisible: base, visible: absVal, fill: d.fill };
  });

  return (
    <ResponsiveContainer width="100%" height={360}>
      <ComposedChart data={chartData} margin={{ top: 10, right: 20, left: 20, bottom: 10 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
        <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} />
        <YAxis
          tick={{ fontSize: 12, fill: "#64748b" }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `$${v.toFixed(0)}M`}
        />
        <Tooltip content={<CustomTooltip />} />
        <ReferenceLine y={0} stroke="#e2e8f0" />
        <Bar dataKey="invisible" stackId="a" fill="transparent" radius={0} />
        <Bar dataKey="visible" stackId="a" radius={[4, 4, 0, 0]}>
          {chartData.map((entry, index) => (
            <Cell key={index} fill={entry.fill} fillOpacity={0.9} />
          ))}
        </Bar>
      </ComposedChart>
    </ResponsiveContainer>
  );
}
