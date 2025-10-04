import type { InputHTMLAttributes } from "react";
import { useId, useState } from "react";

type Props = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string | null;
  hint?: string;
  passwordToggle?: boolean;
};

export default function Input({
  label,
  error,
  hint,
  passwordToggle = false,
  type = "text",
  style,
  ...rest
}: Props) {
  const id = useId();
  const [show, setShow] = useState(false);
  const isPassword = type === "password";
  const finalType = isPassword && passwordToggle ? (show ? "text" : "password") : type;

  return (
    <div style={{ display: "grid", gap: 6, width: "100%", minWidth: 0 }}>
      {label && (
        <label htmlFor={id} style={{ fontWeight: 600, fontFamily: "system-ui" }}>
          {label}
        </label>
      )}
      <div style={{ position: "relative", width: "100%", minWidth: 0 }}>
        <input
          id={id}
          type={finalType}
          {...rest}
          style={{
            width: "100%",
            maxWidth: "100%",
            boxSizing: "border-box",  // ← key fix
            padding: "10px 12px",
            borderRadius: 10,
            border: `1px solid ${error ? "#ef4444" : "#d1d5db"}`,
            outline: "none",
            fontFamily: "system-ui",
            display: "block",
            ...style,
          }}
        />
        {isPassword && passwordToggle && (
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            style={{
              position: "absolute",
              right: 8,
              top: 8,
              border: "none",
              background: "transparent",
              cursor: "pointer",
              padding: 6,
            }}
            aria-label={show ? "Hide password" : "Show password"}
          >
            {show ? "hide" : "show"}
          </button>
        )}
      </div>
      {hint && !error && (
        <div style={{ color: "#6b7280", fontSize: 12, fontFamily: "system-ui" }}>{hint}</div>
      )}
      {error && (
        <div role="alert" style={{ color: "#ef4444", fontSize: 12, fontFamily: "system-ui" }}>
          {error}
        </div>
      )}
    </div>
  );
}