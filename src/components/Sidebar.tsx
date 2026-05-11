"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const nav = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: (
      <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
        <rect x="1" y="1" width="6" height="6" rx="0.5" /><rect x="9" y="1" width="6" height="6" rx="0.5" />
        <rect x="1" y="9" width="6" height="6" rx="0.5" /><rect x="9" y="9" width="6" height="6" rx="0.5" />
      </svg>
    ),
  },
  {
    href: "/waterfall",
    label: "Waterfall",
    icon: (
      <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
        <rect x="1" y="1" width="14" height="2" rx="0.5" />
        <rect x="3" y="5" width="10" height="2" rx="0.5" opacity="0.7" />
        <rect x="5" y="9" width="6" height="2" rx="0.5" opacity="0.5" />
        <rect x="6" y="13" width="4" height="2" rx="0.5" opacity="0.35" />
      </svg>
    ),
  },
  {
    href: "/deals",
    label: "Deal Scoring",
    icon: (
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="8" cy="8" r="6.5" />
        <circle cx="8" cy="8" r="3" />
        <circle cx="8" cy="8" r="1" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    href: "/narrative",
    label: "AI Narrative",
    icon: (
      <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
        <path d="M8 1L9.5 5.5H14L10.5 8.5L12 13L8 10.5L4 13L5.5 8.5L2 5.5H6.5L8 1Z" />
      </svg>
    ),
  },
  {
    href: "/alerts",
    label: "Alerts",
    icon: (
      <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
        <path d="M8 1L15 14H1L8 1Z" opacity="0.15" />
        <path d="M8 1L15 14H1L8 1Z" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        <rect x="7.25" y="6" width="1.5" height="4" rx="0.5" />
        <rect x="7.25" y="11.5" width="1.5" height="1.5" rx="0.5" />
      </svg>
    ),
  },
  {
    href: "/war-room",
    label: "War Room",
    icon: (
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round">
        <circle cx="8" cy="8" r="6.5" />
        <circle cx="8" cy="8" r="2.5" />
        <path d="M8 1.5V5M8 11v3.5M1.5 8H5M11 8h3.5" strokeLinecap="round" />
      </svg>
    ),
  },
];

export default function Sidebar() {
  const path = usePathname();

  return (
    <aside className="w-[220px] flex flex-col shrink-0 bg-[#0D1117] border-r border-[#21262D]">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-[#21262D]">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-emerald-500 flex items-center justify-center shrink-0">
            <span className="text-white text-xs font-black tracking-tight">PQ</span>
          </div>
          <div>
            <p className="text-white text-sm font-bold tracking-tight leading-none">PricingIQ</p>
            <p className="text-[#8B949E] text-[10px] mt-0.5">Intelligence Platform</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4">
        <p className="text-[#8B949E] text-[9px] font-bold uppercase tracking-widest px-2 mb-2">Navigation</p>
        <div className="space-y-0.5">
          {nav.map(({ href, label, icon }) => {
            const active = path === href;
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 text-[13px] transition-all duration-150 border-l-2 group",
                  active
                    ? "border-emerald-500 bg-[#1C2733] text-white font-semibold"
                    : "border-transparent text-[#8B949E] hover:bg-[#161B22] hover:text-[#C9D1D9] hover:border-[#30363D]"
                )}
              >
                <span className={cn("shrink-0", active ? "text-emerald-500" : "text-[#8B949E] group-hover:text-[#C9D1D9]")}>
                  {icon}
                </span>
                {label}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-[#21262D]">
        <div className="flex items-center gap-1.5 mb-1">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <p className="text-[10px] text-[#8B949E]">Live — 500 synthetic deals</p>
        </div>
        <p className="text-[10px] text-[#484F58]">FY2026 Pipeline · Demo Mode</p>
      </div>
    </aside>
  );
}
