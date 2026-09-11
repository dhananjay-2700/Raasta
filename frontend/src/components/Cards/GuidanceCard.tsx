import React from "react";

export function GuidanceCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-amber-50 rounded-xl p-6 border border-amber-100 shadow-sm relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-32 h-32 bg-amber-100/50 rounded-bl-full -mr-16 -mt-16 transition-transform group-hover:scale-110"></div>
      
      <div className="flex items-center space-x-2 mb-4 relative z-10">
        <span className="text-xl">🤖</span>
        <span className="text-xs font-bold text-amber-800 uppercase tracking-wide">RAASTA GUIDANCE</span>
      </div>
      <div className="text-gray-800 text-sm leading-relaxed relative z-10">
        {children}
      </div>
    </div>
  );
}
