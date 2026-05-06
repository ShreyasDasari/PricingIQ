import { cn } from "@/lib/utils";

type Status = "green" | "amber" | "red" | "neutral";

interface KpiCardProps {
  label: string;
  value: string;
  sub?: string;
  qoq?: { value: string; positive: boolean };
  vsTarget?: string;
  status?: Status;
  className?: string;
}

const borderMap: Record<Status, string> = {
  green: "border-l-emerald-500",
  amber: "border-l-amber-500",
  red: "border-l-red-600",
  neutral: "border-l-slate-300",
};

const valueColorMap: Record<Status, string> = {
  green: "text-slate-900",
  amber: "text-slate-900",
  red: "text-slate-900",
  neutral: "text-slate-900",
};

export default function KpiCard({ label, value, sub, qoq, vsTarget, status = "neutral", className }: KpiCardProps) {
  return (
    <div
      className={cn(
        "bg-white border border-slate-200 border-l-4 p-4 hover:shadow-sm transition-shadow duration-150",
        borderMap[status],
        className
      )}
    >
      <p className="metric-label">{label}</p>
      <div className="flex items-baseline gap-2 mt-1.5">
        <span className={cn("metric-value", valueColorMap[status])}>{value}</span>
        {qoq && (
          <span
            className={cn(
              "text-[11px] font-semibold",
              qoq.positive ? "text-emerald-600" : "text-red-600"
            )}
          >
            {qoq.positive ? "↑" : "↓"} {qoq.value}
          </span>
        )}
      </div>
      {(sub || vsTarget) && (
        <div className="flex items-center justify-between mt-1">
          {sub && <p className="text-[11px] text-slate-400">{sub}</p>}
          {vsTarget && <p className="text-[11px] text-slate-400 tabular-nums">{vsTarget}</p>}
        </div>
      )}
    </div>
  );
}
