import React from "react";

export function EvidenceCard({
  title,
  children,
  source = "Official Government Portal",
  updated = "2026",
}: {
  title?: string;
  children: React.ReactNode;
  source?: string;
  updated?: string;
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
      <div className="bg-gray-50 border-b border-gray-200 px-4 py-3 flex items-center space-x-2">
        <span className="text-xl">🏛</span>
        <h3 className="text-sm font-semibold text-gray-800 uppercase tracking-wide">
          Verified Government Information
        </h3>
      </div>
      <div className="p-4">
        {title && <h4 className="text-lg font-medium text-gray-900 mb-2">{title}</h4>}
        <div className="text-gray-700 text-sm space-y-2">{children}</div>
      </div>
      <div className="bg-gray-50 px-4 py-2 border-t border-gray-100 flex justify-between items-center text-xs text-gray-500">
        <div>
          <span>Source: <span className="font-medium text-gray-700">{source}</span></span>
          <span className="mx-2">•</span>
          <span>Updated: {updated}</span>
        </div>
        <button className="text-red-600 hover:underline flex items-center">
          View source 
          <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
        </button>
      </div>
    </div>
  );
}
