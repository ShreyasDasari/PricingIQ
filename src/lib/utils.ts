import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function fmt(n: number, decimals = 1): string {
  if (Math.abs(n) >= 1000) return (n / 1000).toFixed(1) + "B";
  if (Math.abs(n) >= 1) return n.toFixed(decimals) + "M";
  return (n * 1000).toFixed(0) + "K";
}

export function fmtPct(n: number): string {
  return (n * 100).toFixed(1) + "%";
}

export function fmtDollar(n: number): string {
  return "$" + fmt(n);
}
