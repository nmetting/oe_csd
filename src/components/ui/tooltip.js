import React from "react";

export function TooltipProvider({ children }) {
  return <>{children}</>;
}

export function Tooltip({ children }) {
  return <span className="relative inline-flex group">{children}</span>;
}

export function TooltipTrigger({ children, "aria-label": ariaLabel, ...props }) {
  return <span role="button" tabIndex={0} aria-label={ariaLabel} {...props}>{children}</span>;
}

export function TooltipContent({ children }) {
  return (
    <span className="absolute left-0 bottom-full mb-1 px-2 py-1 text-xs text-gray-700 bg-white border border-gray-200 rounded shadow-lg whitespace-normal max-w-xs opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-10">
      {children}
    </span>
  );
}
