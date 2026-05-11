import { DM_Sans } from "next/font/google";
import Link from "next/link";

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

function PTCLogo() {
  return (
    <img
      src="/ptc-logo.png"
      alt="PTC"
      style={{ height: 72, width: "auto" }}
    />
  );
}

function LinkedInIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <rect width="16" height="16" rx="2.5" fill="#8B9CB6" />
      <rect x="3" y="6" width="2.2" height="6.5" fill="#0D1117" />
      <circle cx="4.1" cy="4" r="1.2" fill="#0D1117" />
      <path
        d="M7.2 6h2.1v1c.3-.5.9-1.2 2.2-1.2 2.2 0 2.5 1.5 2.5 3.4v3.3h-2.1V9.6c0-.9-.1-2-1.2-2s-1.4.9-1.4 2v2.9H7.2V6z"
        fill="#0D1117"
      />
    </svg>
  );
}

const STAT_PILLS = ["500 Synthetic Deals", "4 AI Agents", "Real-Time Analytics"];

export default function LandingPage() {
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
        overflow: "hidden",
      }}
    >
      {/* Subtle radial glow */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse 60% 50% at 50% 40%, rgba(109,193,67,0.05) 0%, transparent 60%)",
          pointerEvents: "none",
        }}
      />

      {/* ── Top bar (60px) ───────────────────────────────────────────── */}
      <header
        style={{
          height: 60,
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 32px",
          borderBottom: "1px solid rgba(255,255,255,0.05)",
          position: "relative",
          zIndex: 1,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#6DC143" }} />
          <span style={{ fontSize: 15, fontWeight: 500, color: "#FFFFFF" }}>
            PricingIQ
          </span>
        </div>
        <a
          href="https://linkedin.com/in/shreyasdasari"
          target="_blank"
          rel="noopener noreferrer"
          style={{ display: "flex", alignItems: "center", gap: 6, textDecoration: "none" }}
        >
          <LinkedInIcon />
          <span style={{ fontSize: 13, color: "#8B9CB6" }}>Built by Shreyas Dasari</span>
        </a>
      </header>

      {/* ── Center stage (flex-1) ────────────────────────────────────── */}
      <main
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 24,
          padding: "0 16px",
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* 1. PTC Logo lockup + horizontal rule */}
        <div
          style={{
            animation: "fadeUpIn 600ms ease-out 0ms both",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 16,
          }}
        >
          <PTCLogo />
          <div style={{ width: 120, height: 1, background: "rgba(109,193,67,0.4)" }} />
        </div>

        {/* 2. Product headline */}
        <div
          style={{ animation: "fadeUpIn 600ms ease-out 100ms both", textAlign: "center" }}
        >
          <h1
            className="landing-h1"
            style={{
              fontSize: 68,
              fontWeight: 700,
              color: "#FFFFFF",
              letterSpacing: "-2px",
              lineHeight: 1,
              margin: 0,
            }}
          >
            PricingIQ
          </h1>
          <p
            className="landing-sub"
            style={{
              fontSize: 20,
              fontWeight: 300,
              color: "#00A9E0",
              letterSpacing: "3px",
              textTransform: "uppercase",
              margin: "12px 0 0",
            }}
          >
            AI-Enabled Pricing Intelligence Platform
          </p>
        </div>

        {/* 3. Role badge */}
        <div style={{ animation: "fadeUpIn 600ms ease-out 200ms both" }}>
          <div
            style={{
              border: "1px solid #F47920",
              background: "rgba(244,121,32,0.08)",
              borderRadius: 100,
              padding: "6px 16px",
              fontSize: 12,
              fontWeight: 500,
              color: "#F47920",
            }}
          >
            Pricing Analyst · PTC Inc. · JR111667
          </div>
        </div>

        {/* 4. Description */}
        <p
          style={{
            animation: "fadeUpIn 600ms ease-out 300ms both",
            fontSize: 15,
            fontWeight: 400,
            color: "#8B9CB6",
            maxWidth: 520,
            textAlign: "center",
            lineHeight: 1.7,
            margin: 0,
          }}
        >
          Built for PTC&rsquo;s Pricing &amp; Packaging team &mdash; combining
          analytical rigor with an AI-first, agent-based approach to move pricing
          beyond reporting toward decision intelligence.
        </p>

        {/* 5. CTA buttons */}
        <div
          style={{
            animation: "fadeUpIn 600ms ease-out 400ms both",
            display: "flex",
            gap: 16,
            flexWrap: "wrap",
            justifyContent: "center",
          }}
        >
          <Link
            href="/dashboard"
            className="ptc-cta-primary"
            style={{
              background: "#6DC143",
              color: "white",
              fontSize: 14,
              fontWeight: 600,
              borderRadius: 6,
              padding: "12px 32px",
              border: "none",
              textDecoration: "none",
              display: "inline-block",
              transition: "background 150ms ease, box-shadow 150ms ease",
            }}
          >
            View Dashboard
          </Link>
          <Link
            href="/demo"
            className="ptc-cta-secondary"
            style={{
              background: "transparent",
              color: "white",
              fontSize: 14,
              fontWeight: 600,
              borderRadius: 6,
              padding: "12px 32px",
              border: "1px solid rgba(255,255,255,0.3)",
              textDecoration: "none",
              display: "inline-block",
              transition: "background 150ms ease, box-shadow 150ms ease",
            }}
          >
            View Demo
          </Link>
        </div>

        {/* 6. Stat pills */}
        <div
          style={{
            animation: "fadeUpIn 600ms ease-out 500ms both",
            display: "flex",
            gap: 12,
            flexWrap: "wrap",
            justifyContent: "center",
          }}
        >
          {STAT_PILLS.map((text) => (
            <div
              key={text}
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 100,
                padding: "4px 14px",
                fontSize: 12,
                fontWeight: 400,
                color: "#8B9CB6",
              }}
            >
              {text}
            </div>
          ))}
        </div>
      </main>

      {/* ── Bottom strip (80px) ──────────────────────────────────────── */}
      <footer
        style={{
          height: 80,
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderTop: "1px solid rgba(255,255,255,0.05)",
          position: "relative",
          zIndex: 1,
        }}
      >
        <p
          style={{
            fontSize: 12,
            color: "rgba(139,156,182,0.6)",
            margin: 0,
            fontWeight: 400,
            textAlign: "center",
          }}
        >
          PricingIQ &nbsp;·&nbsp; Built by Shreyas Dasari &nbsp;·&nbsp; Pricing
          Analyst Candidate &nbsp;·&nbsp; PTC Inc. JR111667
        </p>
      </footer>

      {/* Hover + responsive overrides */}
      <style>{`
        .ptc-cta-primary:hover {
          background: #56a334 !important;
          box-shadow: 0 0 0 3px rgba(109,193,67,0.28) !important;
        }
        .ptc-cta-secondary:hover {
          background: rgba(255,255,255,0.07) !important;
          box-shadow: 0 0 0 3px rgba(109,193,67,0.22) !important;
        }
        @media (max-width: 480px) {
          .landing-h1 { font-size: 44px !important; }
          .landing-sub { font-size: 14px !important; letter-spacing: 2px !important; }
          .ptc-cta-primary, .ptc-cta-secondary {
            width: 100% !important;
            text-align: center !important;
          }
        }
      `}</style>
    </div>
  );
}
