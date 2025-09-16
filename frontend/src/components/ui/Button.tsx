import type { ButtonHTMLAttributes } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
  loading?: boolean;
  full?: boolean;
};

export default function Button({
  variant = "primary",
  loading = false,
  disabled,
  full = false,
  children,
  style,
  ...rest
}: Props) {
  const base: React.CSSProperties = {
    fontFamily: "system-ui",
    border: "1px solid transparent",
    borderRadius: 12,
    padding: "10px 14px",
    fontWeight: 600,
    cursor: disabled || loading ? "not-allowed" : "pointer",
    opacity: disabled || loading ? 0.6 : 1,
    width: full ? "100%" : undefined,
    transition: "transform .05s ease",
  };

  const variants: Record<string, React.CSSProperties> = {
    primary: { background: "#2563eb", color: "white" },
    secondary: { background: "#f3f4f6", color: "#111827", borderColor: "#d1d5db" },
    ghost: { background: "transparent", color: "#111827", borderColor: "#e5e7eb" },
  };

  return (
    <button
      {...rest}
      disabled={disabled || loading}
      style={{ ...base, ...variants[variant], ...style }}
      onMouseDown={(e) => {
        (e.currentTarget as HTMLButtonElement).style.transform = "scale(0.98)";
        rest.onMouseDown?.(e);
      }}
      onMouseUp={(e) => {
        (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)";
        rest.onMouseUp?.(e);
      }}
    >
      {loading ? "…" : children}
    </button>
  );
}