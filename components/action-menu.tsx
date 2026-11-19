"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { MoreVertical } from "lucide-react";

export type ActionMenuItem = {
  id?: string;
  label: string;
  icon?: ReactNode;
  onClick: () => void;
  variant?: "default" | "danger";
  disabled?: boolean;
};

export type ActionMenuProps = {
  items: ActionMenuItem[];
  ariaLabel?: string;
  className?: string;
  triggerClassName?: string;
};

export default function ActionMenu({
  items,
  ariaLabel = "Record actions",
  className = "",
  triggerClassName = "",
}: ActionMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Close menu on click outside or escape key
  useEffect(() => {
    function handleClickOutside(event: MouseEvent | TouchEvent) {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  function handleItemClick(item: ActionMenuItem) {
    if (item.disabled) return;
    setIsOpen(false);
    item.onClick();
  }

  return (
    <div
      ref={menuRef}
      className={`action-menu-container ${className}`}
      style={{ position: "relative", display: "inline-block" }}
    >
      <button
        ref={triggerRef}
        type="button"
        className={`action-menu-trigger ${triggerClassName} ${isOpen ? "active" : ""}`}
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen((prev) => !prev);
        }}
        aria-label={ariaLabel}
        aria-haspopup="true"
        aria-expanded={isOpen}
        title="More actions"
      >
        <MoreVertical size={17} aria-hidden="true" />
      </button>

      {isOpen && (
        <div
          className="action-menu-dropdown"
          role="menu"
          aria-label={ariaLabel}
          onClick={(e) => e.stopPropagation()}
        >
          {items.map((item, idx) => {
            const isDanger = item.variant === "danger";

            return (
              <button
                key={item.id || item.label || idx}
                type="button"
                role="menuitem"
                className={`action-menu-item ${isDanger ? "danger" : ""}`}
                disabled={item.disabled}
                onClick={() => handleItemClick(item)}
              >
                {item.icon && (
                  <span className="action-menu-item-icon" aria-hidden="true">
                    {item.icon}
                  </span>
                )}
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
