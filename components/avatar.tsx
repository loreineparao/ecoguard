"use client";

import { useState } from "react";
import Image from "next/image";
import { User } from "lucide-react";

export interface AvatarProps {
  src?: string | null;
  name?: string | null;
  size?: "xs" | "sm" | "md" | "lg" | "xl" | number;
  className?: string;
  alt?: string;
  shape?: "circle" | "rounded";
}

const sizeMap: Record<string, number> = {
  xs: 24,
  sm: 34,
  md: 40,
  lg: 44,
  xl: 88,
};

export default function Avatar({
  src,
  name,
  size = "md",
  className = "",
  alt,
  shape = "circle",
}: AvatarProps) {
  const [hasError, setHasError] = useState(false);
  const [prevSrc, setPrevSrc] = useState(src);

  if (prevSrc !== src) {
    setPrevSrc(src);
    setHasError(false);
  }

  const dimension = typeof size === "number" ? size : sizeMap[size] || 40;
  const borderRadius = shape === "circle" ? "50%" : "8px";

  // Compute 2-letter initials
  const initials = name
    ? name
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .map((part) => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "";

  const fontSize = Math.max(11, Math.round(dimension * 0.38));
  const iconSize = Math.max(14, Math.round(dimension * 0.48));

  if (src && !hasError) {
    return (
      <div
        className={`avatar-wrapper ${className}`}
        style={{
          width: `${dimension}px`,
          height: `${dimension}px`,
          minWidth: `${dimension}px`,
          minHeight: `${dimension}px`,
          borderRadius,
          overflow: "hidden",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "var(--surface-elevated, #E6F4EA)",
          border: "1.5px solid var(--border, #CBE7D7)",
          position: "relative",
          flexShrink: 0,
        }}
      >
        <Image
          src={src}
          alt={alt || (name ? `${name}'s avatar` : "User profile picture")}
          width={dimension}
          height={dimension}
          unoptimized
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            borderRadius,
          }}
          onError={() => setHasError(true)}
        />
      </div>
    );
  }

  return (
    <div
      className={`avatar-fallback-wrapper ${className}`}
      aria-label={name ? `${name}'s avatar` : "Default avatar"}
      style={{
        width: `${dimension}px`,
        height: `${dimension}px`,
        minWidth: `${dimension}px`,
        minHeight: `${dimension}px`,
        borderRadius,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "var(--brand-surface, #E6F4EA)",
        color: "var(--brand-main, #0F6E56)",
        fontWeight: 700,
        fontSize: `${fontSize}px`,
        lineHeight: 1,
        letterSpacing: "0.02em",
        border: "1.5px solid var(--border, #CBE7D7)",
        userSelect: "none",
        flexShrink: 0,
      }}
    >
      {initials ? initials : <User size={iconSize} aria-hidden="true" />}
    </div>
  );
}
