import React from "react";

export function Card({ className = "", children, ...props }) {
  return (
    <div className={`bg-white rounded-lg border border-gray-200 shadow-sm ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardHeader({ className = "", children, ...props }) {
  return (
    <div className={`px-4 py-3 border-b border-gray-100 ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({ className = "", children, ...props }) {
  return (
    <div className={`text-base font-semibold text-gray-800 ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardContent({ className = "", children, ...props }) {
  return (
    <div className={`px-4 py-3 ${className}`} {...props}>
      {children}
    </div>
  );
}
