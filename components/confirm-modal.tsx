"use client";

import { useCallback, useEffect, useRef } from "react";
import { AlertTriangle, LoaderCircle, X } from "lucide-react";

export type ConfirmModalProps = {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  confirmText?: string;
  cancelLabel?: string;
  cancelText?: string;
  loading?: boolean;
  isLoading?: boolean;
  isDestructive?: boolean;
  onConfirm: () => void | Promise<void>;
  onCancel?: () => void;
  onClose?: () => void;
};

export default function ConfirmModal({
  isOpen,
  title,
  description,
  confirmLabel,
  confirmText,
  cancelLabel,
  cancelText,
  loading,
  isLoading,
  isDestructive = true,
  onConfirm,
  onCancel,
  onClose,
}: ConfirmModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  const finalConfirmLabel = confirmText || confirmLabel || "Confirm";
  const finalCancelLabel = cancelText || cancelLabel || "Cancel";
  const finalLoading = Boolean(loading || isLoading);
  const handleClose = useCallback(() => {
    if (onClose) onClose();
    else if (onCancel) onCancel();
  }, [onClose, onCancel]);

  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !finalLoading) {
        handleClose();
      }
    }

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, finalLoading, handleClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
      aria-describedby="confirm-modal-desc"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        backdropFilter: "blur(2px)",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !finalLoading) {
          handleClose();
        }
      }}
    >
      <div
        ref={modalRef}
        style={{
          width: "100%",
          maxWidth: "460px",
          backgroundColor: "var(--card-bg, #ffffff)",
          borderRadius: "12px",
          border: "1px solid var(--border)",
          boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 8px 10px -6px rgba(0, 0, 0, 0.2)",
          padding: "24px",
          color: "var(--text-main)",
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", gap: "14px", marginBottom: "16px" }}>
          {isDestructive ? (
            <div
              style={{
                flexShrink: 0,
                width: "40px",
                height: "40px",
                borderRadius: "50%",
                backgroundColor: "rgba(220, 38, 38, 0.12)",
                color: "#DC2626",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <AlertTriangle size={22} aria-hidden="true" />
            </div>
          ) : null}

          <div style={{ flex: 1 }}>
            <h3
              id="confirm-modal-title"
              style={{
                margin: "0 0 6px 0",
                fontSize: "17px",
                fontWeight: 700,
                color: isDestructive ? "#DC2626" : "var(--dark-forest)",
              }}
            >
              {title}
            </h3>
            <p
              id="confirm-modal-desc"
              style={{
                margin: 0,
                fontSize: "14px",
                lineHeight: "1.5",
                color: "var(--text-secondary)",
              }}
            >
              {description}
            </p>
          </div>

          {!finalLoading && (
            <button
              type="button"
              onClick={handleClose}
              style={{
                background: "transparent",
                border: "none",
                cursor: "pointer",
                padding: "4px",
                color: "var(--text-secondary)",
                borderRadius: "6px",
              }}
              aria-label="Close dialog"
            >
              <X size={18} />
            </button>
          )}
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
            gap: "10px",
            marginTop: "20px",
            flexWrap: "wrap",
          }}
        >
          <button
            type="button"
            className="button secondary"
            onClick={handleClose}
            disabled={finalLoading}
            style={{ minWidth: "85px" }}
          >
            {finalCancelLabel}
          </button>

          <button
            type="button"
            className={`button ${isDestructive ? "danger" : "green"}`}
            onClick={onConfirm}
            disabled={finalLoading}
            style={{ minWidth: "100px", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
          >
            {finalLoading ? (
              <LoaderCircle className="spin" size={15} aria-hidden="true" />
            ) : null}
            {finalConfirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
