import type { ReactNode } from "react";

export function Card({ children, style }: { children: ReactNode; style?: React.CSSProperties }) {
  return (
    <div
      style={{
        border: "1px solid #e5e7eb",
        borderRadius: 16,
        padding: 16,
        boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
        background: "white",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function CardHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ fontWeight: 700, fontSize: 18, fontFamily: "system-ui" }}>{title}</div>
      {subtitle && (
        <div style={{ color: "#6b7280", fontSize: 13, fontFamily: "system-ui" }}>{subtitle}</div>
      )}
    </div>
  );
}

export function CardContent({ children }: { children: React.ReactNode }) {
  return <div>{children}</div>;
}