"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useJourney } from "@/context/JourneyContext";
import { EvidenceCard } from "@/components/Cards/EvidenceCard";
import { GuidanceCard } from "@/components/Cards/GuidanceCard";
import { WhyThisServiceDrawer } from "@/components/Drawers/WhyThisServiceDrawer";
export default function FindService() {
  const router = useRouter();
  const { state } = useJourney();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const handleSchemeClick = async () => {
    const targetUrl = state.service?.scheme_url || "http://127.0.0.1:8000/extension/mock_gov_site.html";
    try {
      await fetch("http://127.0.0.1:8000/api/raasta/journey/active", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          journey_id: "JRN_" + Date.now(),
          scheme_id: state.service?.scheme_id || "PM_USP_CSS",
          scheme_name: state.service?.scheme_name || "PM-USP Scholarship",
          status: "ready_to_apply",
          citizen_data: {
            "full_name": { "value": state.person || "Rahul Sharma", "source": "Citizen Conversation", "confidence": 0.96 },
            "state": { "value": "Rajasthan", "source": "Citizen Profile", "confidence": 0.98 },
            "annual_income": { "value": 400000, "source": "Citizen Conversation", "confidence": 0.95 }
          }
        })
      });
    } catch (err) {
      console.error("Failed to set active journey:", err);
    }
    window.open(targetUrl, "_blank");
  };


  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">We found a service that may help.</h1>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-8">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <span className="text-4xl">🎓</span>
              <div>
                <h2 
                  className="text-2xl font-bold flex items-center gap-2 text-red-600 cursor-pointer hover:underline"
                  onClick={handleSchemeClick}
                  title="Click to visit official portal and launch RAASTA extension"
                >
                  {state.service?.scheme_name || "Assistance Service"}
                  <svg className="w-6 h-6 inline-block text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
                </h2>
                <div className="flex items-center mt-1 space-x-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-red-100 text-red-800 text-xs font-semibold">Potentially relevant</span>
                </div>
              </div>
            </div>
          </div>
          
          <p className="mt-6 text-gray-700 text-lg">
            Based on your needs, we found this official government service that may be applicable.
          </p>

          <div className="mt-8">
            <button 
              onClick={() => router.push("/journey/prepare")}
              className="w-full sm:w-auto px-8 py-3 bg-red-600 text-white font-medium rounded-xl hover:bg-red-700 transition-colors"
            >
              Continue →
            </button>
          </div>
        </div>

        <div className="bg-gray-50 border-t border-gray-100 p-6 md:px-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Why this service?</h3>
            <button 
              onClick={() => setIsDrawerOpen(true)}
              className="text-sm font-medium text-red-600 hover:text-red-800 flex items-center"
            >
              See how we decided
              <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
            </button>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center text-gray-700">
              <svg className="w-5 h-5 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
              Matches your education need
            </div>
            <div className="flex items-center text-gray-700">
              <svg className="w-5 h-5 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
              Relevant to higher education
            </div>
            <div className="flex items-center text-gray-700">
              <div className="w-5 h-5 border-2 border-gray-300 rounded-full mr-3"></div>
              Household income needs confirmation
            </div>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8 pt-4">
        <EvidenceCard>
          <p className="font-medium mb-1">Eligibility information</p>
          <p>Must be a resident of the state and pursuing higher education.</p>
          <p className="font-medium mt-3 mb-1">Required conditions</p>
          <p>Household income must be below ₹3,00,000 per annum.</p>
          <p className="font-medium mt-3 mb-1">Application requirements</p>
          <p>Valid income certificate and proof of admission.</p>
        </EvidenceCard>
        
        <GuidanceCard>
          <p className="mb-2">Based on what you've told me, this service appears relevant to your daughter's situation.</p>
          <p>This is guidance, not a government decision. We'll need to check your income certificate to confirm eligibility before submitting.</p>
        </GuidanceCard>
      </div>

      <WhyThisServiceDrawer 
        isOpen={isDrawerOpen} 
        onClose={() => setIsDrawerOpen(false)} 
        need={state.intent}
      />
    </div>
  );
}
