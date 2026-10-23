type PasswordVisibilityToggleProps = {
  visible: boolean;
  onToggle: () => void;
};

export function PasswordVisibilityToggle({
  visible,
  onToggle,
}: PasswordVisibilityToggleProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={visible ? "Hide password" : "Show password"}
      aria-pressed={visible}
      title={visible ? "Hide password" : "Show password"}
      style={{
        position: "absolute",
        top: "50%",
        right: "8px",
        transform: "translateY(-50%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "4px",
        padding: "6px",
        border: "none",
        background: "transparent",
        color: "#166534",
        cursor: "pointer",
        fontSize: "12px",
        fontWeight: 600,
      }}
    >
      {visible ? (
        <svg
          aria-hidden="true"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M3 3l18 18" />
          <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
          <path d="M9.9 5.2A10.8 10.8 0 0 1 12 5c5 0 8.3 4.5 9 6-.3.7-1.2 2-2.6 3.2" />
          <path d="M6.6 6.6C4.5 7.9 3.3 9.8 3 11c.7 1.5 4 6 9 6 1 0 2-.2 2.9-.5" />
        </svg>
      ) : (
        <svg
          aria-hidden="true"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      )}
      <span>{visible ? "Hide" : "Show"}</span>
    </button>
  );
}
