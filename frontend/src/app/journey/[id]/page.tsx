"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useJourney } from "@/context/JourneyContext";
import { NextBestActionCard } from "@/components/Cards/NextBestActionCard";
import { ActivityTimeline } from "@/components/Cards/ActivityTimeline";
import { EvidenceTrailDrawer } from "@/components/Drawers/EvidenceTrailDrawer";
import { useVoiceAssistant } from "@/voice/useVoiceAssistant";

export default function JourneyTracking() {
  const params = useParams();
  const { state } = useJourney();
  const [isEvidenceOpen, setIsEvidenceOpen] = useState(false);
  const { speak } = useVoiceAssistant();

  const applicationId = params?.id || state.application?.id || "RAA-EDU-2026-10482";

  useEffect(() => {
    speak(`Your application ${applicationId} has been successfully prepared. You can track your status or open the portal assistant.`);
  }, [applicationId, speak]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="bg-green-50 border-b border-green-100 p-6 md:p-8 text-center flex flex-col items-center">
          <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Application submitted</h1>
          <p className="text-gray-700">Your application has been successfully submitted.</p>
          
          <div className="mt-6 flex flex-col items-center">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Application ID</p>
            <div className="bg-white px-6 py-2 rounded-lg border border-gray-200 shadow-sm font-mono text-lg font-bold text-gray-900">
              {applicationId}
            </div>
          </div>

          <div className="mt-8 inline-flex items-center space-x-2 bg-gray-100/80 px-3 py-1.5 rounded-md text-xs font-medium text-gray-600 border border-gray-200">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
            <span>DEMO MODE: Mock Government Gateway</span>
          </div>
        </div>

        <div className="p-6 md:p-8">
          <div className="flex flex-col md:flex-row gap-8">
            <div className="md:w-2/3 space-y-8">
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center space-x-2">
                  <span className="text-2xl">🎓</span>
                  <span>{state.service?.name || "Education Financial Assistance"}</span>
                </h3>
                
                <div className="space-y-4">
                  <div className="flex items-center text-gray-800">
                    <svg className="w-5 h-5 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                    Need understood
                  </div>
                  <div className="flex items-center text-gray-800">
                    <svg className="w-5 h-5 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                    Service identified
                  </div>
                  <div className="flex items-center text-gray-800">
                    <svg className="w-5 h-5 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                    Eligibility checked
                  </div>
                  <div className="flex items-center text-gray-800">
                    <svg className="w-5 h-5 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                    Documents verified
                  </div>
                  <div className="flex items-center text-gray-800">
                    <svg className="w-5 h-5 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                    Application submitted
                  </div>
                  <div className="flex items-center font-medium text-red-700 bg-red-50 -mx-4 px-4 py-2 rounded-lg">
                    <div className="w-5 h-5 mr-3 flex items-center justify-center">
                      <span className="w-2.5 h-2.5 bg-red-600 rounded-full"></span>
                    </div>
                    Under review
                  </div>
                  <div className="flex items-center text-gray-400">
                    <div className="w-5 h-5 border-2 border-gray-300 rounded-full mr-3"></div>
                    Decision
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-6">
                <button 
                  onClick={() => setIsEvidenceOpen(true)}
                  className="px-4 py-2 bg-white border border-gray-200 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center"
                >
                  <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.956 11.956 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
                  View evidence trail
                </button>
              </div>
            </div>

            <div className="md:w-1/3 space-y-6">
              <NextBestActionCard />
              <ActivityTimeline />
            </div>
          </div>
        </div>
      </div>

      <EvidenceTrailDrawer 
        isOpen={isEvidenceOpen}
        onClose={() => setIsEvidenceOpen(false)}
      />
    </div>
  );
}
