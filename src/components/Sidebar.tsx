"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/", label: "Dashboard", icon: "▦" },
  { href: "/waterfall", label: "Waterfall", icon: "⬇" },
  { href: "/deals", label: "Deal Scoring", icon: "◎" },
  { href: "/narrative", label: "AI Narrative", icon: "✦" },
  { href: "/alerts", label: "Alerts", icon: "⚡" },
];

export default function Sidebar() {
  const path = usePathname();
  return (
    <aside className="w-56 bg-slate-900 text-slate-100 flex flex-col shrink-0">
      <div className="px-5 py-6 border-b border-slate-700">
        <span className="text-xl font-bold tracking-tight text-white">PricingIQ</span>
        <p className="text-xs text-slate-400 mt-0.5">Pricing Intelligence Platform</p>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {nav.map(({ href, label, icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
              path === href
                ? "bg-blue-600 text-white font-medium"
                : "text-slate-300 hover:bg-slate-800 hover:text-white"
            )}
          >
            <span className="text-base w-5 text-center">{icon}</span>
            {label}
          </Link>
        ))}
      </nav>
      <div className="px-5 py-4 border-t border-slate-700">
        <p className="text-xs text-slate-500">SaaS Pricing Demo</p>
        <p className="text-xs text-slate-600 mt-0.5">500 synthetic deals</p>
      </div>
    </aside>
  );
}
