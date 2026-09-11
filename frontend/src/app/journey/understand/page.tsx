"use client";

import { useEffect } from "react";
import { useJourney } from "@/context/JourneyContext";
import { useRouter } from "next/navigation";
export default function UnderstandNeed() {
  const { state, updateState } = useJourney();
  const router = useRouter();

  const handleConfirm = () => {
    // Navigate to the service page, which will now use state.service 
    // populated by the ML pipeline.
    router.push("/journey/service");
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">I understand what you're looking for.</h1>
        <p className="text-gray-600 text-lg">
          {state.lifeEvent || "You are looking for government assistance."}
        </p>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
        <div className="grid md:grid-cols-3 gap-6">
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Intent</p>
            <p className="text-gray-900 font-medium text-lg capitalize">
              {(state.intent || "General Request").replace(/_/g, " ")}
            </p>
          </div>
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Need</p>
            <p className="text-gray-900 font-medium text-lg capitalize">
              {(state.need || "Assistance").replace(/_/g, " ")}
            </p>
          </div>
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Person</p>
            <p className="text-gray-900 font-medium text-lg capitalize">{state.person || "Self"}</p>
          </div>
        </div>
        
        <div className="mt-8 pt-6 border-t border-gray-100">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Recommended Scheme</p>
          <div className="flex items-center space-x-3">
            <span className="text-2xl">🏛️</span>
            <span className="text-xl font-medium text-gray-900">
              {state.service?.scheme_name || "Assistance Program"}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-2 text-sm text-gray-600">
        <span className="text-lg">🤖</span>
        <span className="font-medium text-gray-900">RAASTA UNDERSTANDING</span>
        <span>—</span>
        <span>I inferred this from what you told me.</span>
      </div>

      <div className="flex items-center space-x-4 pt-4">
        <button 
          onClick={handleConfirm}
          className="px-6 py-3 bg-red-600 text-white font-medium rounded-xl hover:bg-red-700 transition-colors"
        >
          Yes, that's right →
        </button>
        <button className="px-6 py-3 bg-white border border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors">
          Edit
        </button>
      </div>
    </div>
  );
}
