import React from "react";

export function Progress({ value = 0, className = "", ...props }) {
  const pct = Math.min(100, Math.max(0, Number(value)));
  return (
    <div
      className={`h-1.5 w-full bg-filter-bar rounded-full overflow-hidden ${className}`}
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      {...props}
    >
      <div
        className="h-full bg-gray-600 rounded-full transition-all duration-300"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
