import React from "react";

export function WarningCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded-r-lg">
      <div className="flex">
        <div className="flex-shrink-0">
          <span className="text-amber-500 font-bold">⚠</span>
        </div>
        <div className="ml-3">
          <h3 className="text-xs font-bold text-amber-800 uppercase tracking-wider mb-1">
            NEEDS VERIFICATION
          </h3>
          <div className="text-amber-900 text-sm">{children}</div>
        </div>
      </div>
    </div>
  );
}
