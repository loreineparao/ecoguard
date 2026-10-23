import type { ComponentProps } from "react";

export function Card({ className = "", ...props }: ComponentProps<"div">) {
  return (
    <div
      className={`rounded-xl border border-slate-200 bg-white text-slate-900 shadow-sm ${className}`}
      {...props}
    />
  );
}