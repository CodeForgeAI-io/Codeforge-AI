import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "CodeForge AI — Master coding interviews with AI";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const MARK = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"><rect width="24" height="24" rx="5" fill="#006bff"/><path d="M12 3q1 4 4 6.5t3 5.5a1 1 0 0 1-14 0 5 5 0 0 1 1-3 1 1 0 0 0 5 0c0-2-1.5-3-1.5-5q0-2 2.5-4" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
)}`;

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#ffffff",
          padding: "72px",
          fontFamily: "sans-serif",
        }}
      >
        {/* wordmark */}
        <div style={{ display: "flex", alignItems: "center", gap: "18px" }}>
          <img src={MARK} width={64} height={64} alt="" />
          <div style={{ fontSize: 30, fontWeight: 600, color: "#171717" }}>
            CodeForge AI
          </div>
        </div>

        {/* headline */}
        <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              fontSize: 74,
              fontWeight: 600,
              letterSpacing: "-3px",
              lineHeight: 1.05,
              maxWidth: "940px",
            }}
          >
            <span style={{ color: "#171717" }}>Master coding interviews with&nbsp;</span>
            <span style={{ color: "#006bff" }}>AI.</span>
          </div>
          <div style={{ fontSize: 30, color: "#666666" }}>
            LeetCode-style problems · AI pair programming · spaced repetition
          </div>
        </div>

        {/* footer tags */}
        <div style={{ display: "flex", gap: "14px", fontSize: 24, fontWeight: 500, color: "#006bff" }}>
          <span>26+ features</span>
          <span style={{ color: "#cccccc" }}>·</span>
          <span>9 AI tools</span>
          <span style={{ color: "#cccccc" }}>·</span>
          <span>100% free</span>
        </div>
      </div>
    ),
    { ...size },
  );
}
