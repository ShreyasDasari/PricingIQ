import { DM_Sans } from "next/font/google";
import Link from "next/link";

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

/* ── Mini visual components (defined before MODULES array) ─────────────── */

function WaterfallVisual() {
  const bars = [
    { w: "100%", label: "List", color: "#007DB8" },
    { w: "82%", label: "Vol", color: "#0EA5E9" },
    { w: "68%", label: "Promo", color: "#F59E0B" },
    { w: "57%", label: "Partner", color: "#F97316" },
    { w: "48%", label: "Net", color: "#10B981" },
  ];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5, padding: "4px 0" }}>
      {bars.map((b) => (
        <div key={b.label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ width: 36, fontSize: 9, color: "#8B9CB6", textAlign: "right", flexShrink: 0 }}>
            {b.label}
          </span>
          <div style={{ height: 8, width: b.w, background: b.color, borderRadius: 2, opacity: 0.85 }} />
        </div>
      ))}
    </div>
  );
}

function ScatterVisual() {
  const dots = [
    { x: 20, y: 72, c: "#10B981" }, { x: 35, y: 65, c: "#10B981" },
    { x: 48, y: 69, c: "#10B981" }, { x: 62, y: 52, c: "#F59E0B" },
    { x: 70, y: 45, c: "#F59E0B" }, { x: 55, y: 37, c: "#EF4444" },
    { x: 80, y: 27, c: "#EF4444" }, { x: 88, y: 19, c: "#EF4444" },
    { x: 30, y: 82, c: "#10B981" }, { x: 75, y: 57, c: "#F59E0B" },
  ];
  return (
    <div style={{ position: "relative", height: 72, width: "100%" }}>
      <div style={{ position: "absolute", inset: 0, top: 0, height: "38%", background: "rgba(239,68,68,0.08)", borderRadius: "3px 3px 0 0" }} />
      <div style={{ position: "absolute", inset: 0, top: "38%", height: "30%", background: "rgba(245,158,11,0.08)" }} />
      <div style={{ position: "absolute", inset: 0, top: "68%", height: "32%", background: "rgba(16,185,129,0.08)", borderRadius: "0 0 3px 3px" }} />
      {dots.map((d, i) => (
        <div key={i} style={{
          position: "absolute",
          left: `${d.x}%`,
          bottom: `${d.y - 12}%`,
          width: 6, height: 6,
          borderRadius: "50%",
          background: d.c,
          opacity: 0.9,
        }} />
      ))}
    </div>
  );
}

function NarrativeVisual() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 7, padding: "4px 0" }}>
      <div style={{ height: 8, background: "rgba(255,255,255,0.12)", borderRadius: 4, width: "100%" }} />
      <div style={{ height: 8, background: "rgba(255,255,255,0.09)", borderRadius: 4, width: "88%" }} />
      <div style={{ height: 8, background: "rgba(255,255,255,0.12)", borderRadius: 4, width: "94%" }} />
      <div style={{ height: 8, background: "rgba(255,255,255,0.07)", borderRadius: 4, width: "72%" }} />
      <div style={{ height: 8, background: "rgba(0,169,224,0.3)", borderRadius: 4, width: "60%" }} />
    </div>
  );
}

function AgentVisual() {
  const agents = [
    { label: "D", name: "Detective", color: "#007DB8" },
    { label: "P", name: "Prosecutor", color: "#EF4444" },
    { label: "A", name: "Architect", color: "#10B981" },
    { label: "O", name: "Orchestrator", color: "#F59E0B" },
  ];
  return (
    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
      {agents.map((a) => (
        <div key={a.label} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 6,
            background: `${a.color}22`,
            border: `1px solid ${a.color}55`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 11, fontWeight: 700, color: a.color,
          }}>
            {a.label}
          </div>
          <span style={{ fontSize: 8, color: "#8B9CB6", whiteSpace: "nowrap" }}>{a.name}</span>
        </div>
      ))}
    </div>
  );
}

/* ── Module data ─────────────────────────────────────────────────────────── */

const MODULES = [
  {
    id: "waterfall",
    href: "/waterfall",
    label: "Pricing Waterfall",
    tag: "Module 01",
    description:
      "Decompose list price → volume → promo → partner discounts into a layered waterfall. Identify where margin leaks at each stage across 500 pipeline deals.",
    Visual: WaterfallVisual,
  },
  {
    id: "deals",
    href: "/deals",
    label: "Deal Scoring Engine",
    tag: "Module 02",
    description:
      "Risk-weighted scatter view of every deal. Color-coded corridor zones (green / amber / red) map discount rate vs. realization rate to flag outliers instantly.",
    Visual: ScatterVisual,
  },
  {
    id: "narrative",
    href: "/narrative",
    label: "AI Executive Narrative",
    tag: "Module 03",
    description:
      "Gemini-powered analyst brief streamed in real time. Filter by product, segment, or region — get a McKinsey-style executive summary of pipeline health.",
    Visual: NarrativeVisual,
  },
  {
    id: "war-room",
    href: "/war-room",
    label: "Pricing War Room",
    tag: "Module 04",
    description:
      "Three parallel AI agents (Detective, Prosecutor, Architect) run simultaneously and feed an Orchestrator for a final APPROVE / ESCALATE / RENEGOTIATE verdict.",
    Visual: AgentVisual,
  },
];

/* ── Page ────────────────────────────────────────────────────────────────── */

export default function DemoPage() {
  return (
    /* Fixed overlay covers the Sidebar + main shell entirely */
    <div
      className={dmSans.className}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "#0D1117",
        display: "flex",
        flexDirection: "column",
        overflowY: "auto",
      }}
    >
      {/* Radial glow */}
      <div style={{
        position: "fixed",
        inset: 0,
        background: "radial-gradient(ellipse 70% 40% at 50% 20%, rgba(0,125,184,0.05) 0%, transparent 60%)",
        pointerEvents: "none",
        zIndex: 0,
      }} />

      {/* ── Header ───────────────────────────────────────────────────── */}
      <header style={{
        height: 60,
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 32px",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
        position: "sticky",
        top: 0,
        background: "#0D1117",
        zIndex: 10,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#007DB8" }} />
          <span style={{ fontSize: 15, fontWeight: 500, color: "#FFFFFF" }}>PricingIQ</span>
        </div>
        <Link href="/landing" className="demo-back-link" style={{
          textDecoration: "none",
          fontSize: 13,
          color: "#8B9CB6",
          transition: "color 150ms",
        }}>
          ← Back to Overview
        </Link>
      </header>

      {/* ── Title ────────────────────────────────────────────────────── */}
      <section style={{
        padding: "56px 32px 40px",
        textAlign: "center",
        position: "relative",
        zIndex: 1,
      }}>
        <div style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          border: "1px solid rgba(0,125,184,0.3)",
          borderRadius: 100,
          padding: "4px 14px",
          marginBottom: 24,
        }}>
          <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#007DB8" }} />
          <span style={{ fontSize: 11, color: "#007DB8", fontWeight: 500, letterSpacing: "1px", textTransform: "uppercase" }}>
            Platform Walkthrough
          </span>
        </div>
        <h1 style={{
          fontSize: 48,
          fontWeight: 700,
          color: "#FFFFFF",
          letterSpacing: "-1.5px",
          lineHeight: 1.1,
          margin: "0 0 16px",
        }}>
          Four Modules.<br />One Pricing Platform.
        </h1>
        <p style={{
          fontSize: 16,
          fontWeight: 300,
          color: "#8B9CB6",
          maxWidth: 540,
          margin: "0 auto",
          lineHeight: 1.7,
        }}>
          Each module targets a distinct failure mode in enterprise pricing — from
          margin leakage detection to AI-driven deal decisions.
        </p>
      </section>

      {/* ── Module cards ─────────────────────────────────────────────── */}
      <section style={{
        flex: 1,
        padding: "0 32px 56px",
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
        gap: 20,
        maxWidth: 1100,
        margin: "0 auto",
        width: "100%",
        position: "relative",
        zIndex: 1,
        boxSizing: "border-box",
      }}>
        {MODULES.map(({ id, href, label, tag, description, Visual }) => (
          <div key={id} style={{
            background: "#161B22",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 12,
            padding: 24,
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}>
            <span style={{
              fontSize: 10,
              fontWeight: 600,
              color: "#007DB8",
              letterSpacing: "2px",
              textTransform: "uppercase",
            }}>
              {tag}
            </span>

            <div style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: 8,
              padding: "14px 16px",
              minHeight: 90,
              display: "flex",
              alignItems: "center",
            }}>
              <div style={{ width: "100%" }}><Visual /></div>
            </div>

            <div>
              <h3 style={{
                fontSize: 16,
                fontWeight: 600,
                color: "#FFFFFF",
                margin: "0 0 8px",
                letterSpacing: "-0.3px",
              }}>
                {label}
              </h3>
              <p style={{
                fontSize: 13,
                fontWeight: 400,
                color: "#8B9CB6",
                lineHeight: 1.65,
                margin: 0,
              }}>
                {description}
              </p>
            </div>

            <Link href={href} className="demo-module-link" style={{
              marginTop: "auto",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              fontSize: 13,
              fontWeight: 600,
              color: "#007DB8",
              textDecoration: "none",
              transition: "color 150ms",
            }}>
              Open Module
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M2.5 6H9.5M6.5 3L9.5 6L6.5 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
          </div>
        ))}
      </section>

      {/* ── Footer ───────────────────────────────────────────────────── */}
      <footer style={{
        height: 72,
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderTop: "1px solid rgba(255,255,255,0.05)",
        position: "relative",
        zIndex: 1,
      }}>
        <p style={{ fontSize: 12, color: "rgba(139,156,182,0.6)", margin: 0 }}>
          PricingIQ &nbsp;·&nbsp; Built by Shreyas Dasari &nbsp;·&nbsp; Pricing Analyst Candidate &nbsp;·&nbsp; PTC Inc. JR111667
        </p>
      </footer>

      <style>{`
        .demo-back-link:hover { color: #FFFFFF !important; }
        .demo-module-link:hover { color: #00A9E0 !important; }
      `}</style>
    </div>
  );
}
