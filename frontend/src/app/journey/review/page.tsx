"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useJourney } from "@/context/JourneyContext";
import { EvidenceTrailDrawer } from "@/components/Drawers/EvidenceTrailDrawer";

export default function ReviewApplication() {
  const router = useRouter();
  const { state, updateState } = useJourney();
  const [isEvidenceOpen, setIsEvidenceOpen] = useState(false);
  const [hasConsent, setHasConsent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = () => {
    setIsSubmitting(true);
    // Simulate submission to mock gateway
    setTimeout(() => {
      const appId = "RAA-EDU-2026-10482";
      updateState({
        consent: true,
        application: {
          id: appId,
          status: "Under Review"
        }
      });
      router.push(`/journey/${appId}`);
    }, 1500);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">Review your application</h1>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-6 md:p-8 space-y-8">
          
          <div className="flex items-center justify-between border-b border-gray-100 pb-6">
            <div className="flex items-center space-x-3">
              <span className="text-3xl">🎓</span>
              <h2 className="text-xl font-bold text-gray-900">{state.service?.name || "Education Financial Assistance"}</h2>
            </div>
            <button 
              onClick={() => setIsEvidenceOpen(true)}
              className="px-4 py-2 bg-gray-50 border border-gray-200 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-100 transition-colors flex items-center"
            >
              <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.956 11.956 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
              See how this application was built
            </button>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Applicant</p>
                <p className="text-lg font-medium text-gray-900">{state.form?.studentName || "Ananya Sharma"}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Institution</p>
                <p className="text-lg font-medium text-gray-900">{state.form?.institution || "XYZ University"}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Course</p>
                <p className="text-lg font-medium text-gray-900">{state.form?.course || "B.Tech"}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Household income</p>
                <div className="flex items-center space-x-2">
                  <p className="text-xl font-bold text-gray-900 bg-green-50 px-3 py-1 rounded border border-green-100">{state.form?.householdIncome || "₹2,40,000"}</p>
                </div>
                <p className="text-xs text-green-600 font-medium mt-1.5 flex items-center">
                  <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                  Verified from income certificate
                </p>
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-6 border border-gray-100 h-fit">
              <h3 className="font-semibold text-gray-900 mb-4">Documents</h3>
              <div className="space-y-3">
                {state.documents.map((doc) => (
                  <div key={doc.id} className="flex items-center text-sm text-gray-700">
                    <svg className="w-5 h-5 text-green-500 mr-2 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                    {doc.name}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 border-t border-gray-100 p-6 md:p-8">
          <h3 className="text-lg font-bold text-gray-900 mb-4">You are in control.</h3>
          
          <div className="bg-white p-5 rounded-xl border border-gray-200 mb-6">
            <p className="text-sm font-medium text-gray-900 mb-3">Before you submit</p>
            <p className="text-sm text-gray-600 mb-4">
              RAASTA will share the following information for this application:
            </p>
            <div className="grid sm:grid-cols-2 gap-3 mb-4">
              <div className="flex items-center text-sm text-gray-700">
                <svg className="w-4 h-4 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                Applicant information
              </div>
              <div className="flex items-center text-sm text-gray-700">
                <svg className="w-4 h-4 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                Application details
              </div>
              <div className="flex items-center text-sm text-gray-700">
                <svg className="w-4 h-4 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                Supporting documents
              </div>
            </div>
            <div className="text-sm text-gray-600">
              <span className="font-medium text-gray-900">Purpose: </span> 
              Education assistance application
            </div>
          </div>

          <label className="flex items-start space-x-3 cursor-pointer p-4 border border-transparent hover:border-gray-200 rounded-xl transition-colors">
            <input 
              type="checkbox" 
              className="mt-1 w-5 h-5 text-red-600 border-gray-300 rounded focus:ring-red-500" 
              checked={hasConsent}
              onChange={(e) => setHasConsent(e.target.checked)}
            />
            <span className="text-gray-700 leading-tight">
              I have reviewed this information and consent to submit my application.
            </span>
          </label>

          <div className="mt-6 flex justify-end">
            <button 
              onClick={handleSubmit}
              disabled={!hasConsent || isSubmitting}
              className="w-full sm:w-auto px-8 py-3 bg-red-600 text-white font-medium rounded-xl hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Submitting...
                </>
              ) : (
                "Submit application →"
              )}
            </button>
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
