import React from "react";

export function Dialog({ open, onOpenChange, children }) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={() => onOpenChange?.(false)}
      role="dialog"
      aria-modal="true"
    >
      <div onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

export function DialogContent({ className = "", children, ...props }) {
  return (
    <div
      className={`bg-white rounded-lg border border-gray-200 shadow-xl p-4 max-w-lg w-full ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function DialogHeader({ className = "", children, ...props }) {
  return <div className={`mb-3 ${className}`} {...props}>{children}</div>;
}

export function DialogTitle({ className = "", children, ...props }) {
  return <div className={`text-base font-semibold text-gray-800 ${className}`} {...props}>{children}</div>;
}

export function DialogDescription({ className = "", children, ...props }) {
  return <p className={`text-xs text-gray-500 mt-1 ${className}`} {...props}>{children}</p>;
}

export function DialogFooter({ className = "", children, ...props }) {
  return <div className={`mt-4 flex justify-end ${className}`} {...props}>{children}</div>;
}
