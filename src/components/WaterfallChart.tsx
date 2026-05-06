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
    <div className="bg-[#0D1117] border border-[#30363D] px-3 py-2 shadow-xl text-[12px]">
      <p className="text-[#8B949E] font-medium mb-0.5">{label}</p>
      <p className={`font-bold text-[14px] tabular-nums ${isDecrease ? "text-red-400" : "text-emerald-400"}`}>
        {isDecrease ? "−" : ""}${visible.toFixed(1)}M
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
    <ResponsiveContainer width="100%" height={320}>
      <ComposedChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 10 }} barCategoryGap="28%">
        <CartesianGrid strokeDasharray="2 4" stroke="#F1F5F9" vertical={false} />
        <XAxis
          dataKey="name"
          tick={{ fontSize: 11, fill: "#94A3B8", fontWeight: 500 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: "#94A3B8" }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `$${v.toFixed(0)}M`}
          width={52}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: "#F8FAFC" }} />
        <ReferenceLine y={0} stroke="#E2E8F0" strokeWidth={1} />
        <Bar dataKey="invisible" stackId="a" fill="transparent" radius={0} isAnimationActive={false} />
        <Bar dataKey="visible" stackId="a" radius={[2, 2, 0, 0]} isAnimationActive={false}>
          {chartData.map((entry, index) => (
            <Cell key={index} fill={entry.fill} />
          ))}
        </Bar>
      </ComposedChart>
    </ResponsiveContainer>
  );
}
