"use client";

import { useState } from "react";

export default function Home() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [intentData, setIntentData] = useState<any>(null);
  const [formCompleted, setFormCompleted] = useState(false);
  const [submissionData, setSubmissionData] = useState<any>(null);

  const handleSearchSubmit = async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });
      const data = await res.json();
      setIntentData(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitApplication = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          service_id: intentData?.matched_service_id,
          data: intentData?.extracted_entities,
        }),
      });
      const data = await res.json();
      setSubmissionData(data);
      setFormCompleted(true);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (formCompleted && submissionData) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Application Submitted!</h2>
          <p className="text-gray-600 mb-6">Your official Reference ID is:</p>
          <div className="bg-blue-50 text-blue-800 font-mono text-xl font-bold py-3 px-6 rounded-lg mb-6">
            {submissionData.application_id}
          </div>
          <button onClick={() => window.location.reload()} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg transition-colors">
            Return Home
          </button>
        </div>
      </main>
    );
  }

  if (intentData) {
    return (
      <main className="min-h-screen bg-gray-50 p-6 flex justify-center">
        <div className="max-w-3xl w-full">
          <button onClick={() => setIntentData(null)} className="flex items-center text-gray-500 hover:text-gray-800 mb-6">
            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
            Back
          </button>
          
          <h1 className="text-2xl font-bold text-gray-800 mb-2">{intentData.service_name}</h1>
          <p className="text-gray-600 mb-6">Department of Social Justice and Empowerment</p>

          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg mb-8 shadow-sm">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">Next Best Action</h3>
                <div className="mt-2 text-sm text-blue-700">
                  <p>Review the auto-filled application below and click submit.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
              <h2 className="text-lg font-semibold text-gray-800">Application Details</h2>
            </div>
            <div className="p-6 space-y-6">
              {Object.keys(intentData.extracted_entities).map((key) => {
                const entity = intentData.extracted_entities[key];
                return (
                  <div key={key}>
                    <label className="block text-sm font-medium text-gray-700 mb-1 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</label>
                    <input 
                      type="text" 
                      defaultValue={entity.value}
                      className="w-full border-gray-300 rounded-lg shadow-sm bg-gray-50 focus:border-blue-500 focus:ring-blue-500 px-4 py-2 border" 
                      readOnly 
                    />
                    <div className="mt-1 flex items-center text-xs text-green-600 font-medium">
                      <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                      Provenance: Extracted from {entity.source}
                    </div>
                  </div>
                );
              })}
              
              <button 
                onClick={handleSubmitApplication}
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg transition-colors mt-4 disabled:opacity-50"
              >
                {loading ? "Submitting..." : "Submit Application"}
              </button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
      <div className="max-w-2xl w-full space-y-8">
        <div className="text-center">
          <div className="inline-block bg-gradient-to-r from-blue-600 to-indigo-600 text-transparent bg-clip-text text-5xl font-extrabold mb-4">RAASTA</div>
          <p className="text-xl text-gray-600">One conversation. Every government journey.</p>
        </div>

        <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">What happened?</h2>
          <p className="text-gray-500 mb-6">Describe your situation in normal language, and RAASTA will figure out the rest.</p>
          
          <div className="relative">
            <textarea
              className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 pr-12 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none h-32"
              placeholder="e.g., My daughter just got admission to college, but we can't afford the fees."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            ></textarea>
            <button 
              onClick={handleSearchSubmit}
              disabled={loading || !query.trim()}
              className="absolute bottom-4 right-4 p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {loading ? (
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
              )}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
