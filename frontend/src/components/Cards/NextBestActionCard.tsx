import React from "react";

export function NextBestActionCard({
  actionRequired = false,
}: {
  actionRequired?: boolean;
}) {
  if (actionRequired) {
    return (
      <div className="bg-amber-50 border-l-4 border-amber-500 p-5 rounded-r-xl shadow-sm mb-6">
        <h3 className="text-xs font-bold text-amber-800 uppercase tracking-wider mb-2">
          ACTION REQUIRED
        </h3>
        <p className="text-amber-900 font-medium mb-4">
          Your income certificate needs to be updated.
        </p>
        <button className="bg-white text-amber-700 border border-amber-300 hover:bg-amber-100 font-medium py-2 px-4 rounded-lg transition-colors text-sm">
          Upload new document →
        </button>
      </div>
    );
  }

  return (
    <div className="bg-red-50 border-l-4 border-red-500 p-5 rounded-r-xl shadow-sm mb-6">
      <h3 className="text-xs font-bold text-red-800 uppercase tracking-wider mb-2">
        NEXT BEST ACTION
      </h3>
      <p className="text-red-900 font-medium mb-1">
        No action required right now.
      </p>
      <p className="text-red-700 text-sm">
        We'll tell you if something changes or if you need to provide additional information.
      </p>
    </div>
  );
}
