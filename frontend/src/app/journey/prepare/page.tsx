"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useJourney } from "@/context/JourneyContext";
import { DocumentUploadModal } from "@/components/Drawers/DocumentUploadModal";
import { ProvenanceDrawer } from "@/components/Drawers/ProvenanceDrawer";
import { GuidanceCard } from "@/components/Cards/GuidanceCard";

export default function PrepareApplication() {
  const router = useRouter();
  const { state, updateState } = useJourney();
  const [activeUpload, setActiveUpload] = useState<string | null>(null);
  const [activeProvenance, setActiveProvenance] = useState<any | null>(null);

  // Form state
  const [form, setForm] = useState(
    state.form || {
      studentName: (state.person && state.person !== "Self") ? state.person : "",
      institution: "",
      course: "",
      householdIncome: "",
    }
  );

  const handleUploadSuccess = (data: any) => {
    if (data.status === "extracted") {
      setForm((prev: any) => ({ ...prev, ...data.data }));
      
      // Update document status in state
      const updatedDocs = state.documents.map((doc) => 
        doc.id === "doc_3" ? { ...doc, status: "ready", extractedData: data.data } : doc
      );
      updateState({ documents: updatedDocs, form: { ...form, ...data.data } });
    }
  };

  const isComplete = form.householdIncome !== "";

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">Let's get your application ready.</h1>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-1 space-y-6">
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-4">Documents required</h3>
            <div className="space-y-4">
              {state.documents.map((doc) => (
                <div key={doc.id} className="flex flex-col">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {doc.status === "ready" ? (
                        <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                      ) : (
                        <div className="w-5 h-5 border-2 border-gray-300 rounded-full"></div>
                      )}
                      <span className={`text-sm ${doc.status === "ready" ? "text-gray-900" : "text-gray-700 font-medium"}`}>
                        {doc.name}
                      </span>
                    </div>
                  </div>
                  {doc.status === "required" && (
                    <button 
                      onClick={() => setActiveUpload(doc.id)}
                      className="mt-2 text-sm text-red-600 font-medium text-left ml-7 hover:underline"
                    >
                      Upload document
                    </button>
                  )}
                  {doc.status === "ready" && (
                     <span className="text-xs text-gray-500 ml-7 mt-0.5">Ready</span>
                  )}
                </div>
              ))}
            </div>
            
            <div className="mt-6 pt-4 border-t border-gray-100">
              <p className="text-sm text-gray-600">
                {state.documents.filter(d => d.status === "ready").length} of {state.documents.length} documents ready
              </p>
            </div>
          </div>
          
          <GuidanceCard>
            We pre-filled some information based on your profile. Please review the details and provide the missing documents.
          </GuidanceCard>
        </div>

        <div className="md:col-span-2 space-y-6">
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">Application details</h3>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Student / Applicant name</label>
                  <input 
                    type="text" 
                    className="w-full border border-gray-300 rounded-lg shadow-sm bg-white px-4 py-2 text-gray-900 focus:ring-2 focus:ring-red-500 focus:outline-none" 
                    value={form.studentName} 
                    placeholder="Enter student name"
                    onChange={(e) => setForm({ ...form, studentName: e.target.value })}
                  />
                  <p className="text-xs text-gray-500 mt-1 flex items-center">
                    <span className="w-2 h-2 bg-gray-400 rounded-full mr-1.5"></span>
                    Citizen details
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Institution</label>
                  <input 
                    type="text" 
                    className="w-full border border-gray-300 rounded-lg shadow-sm bg-white px-4 py-2 text-gray-900 focus:ring-2 focus:ring-red-500 focus:outline-none" 
                    value={form.institution} 
                    placeholder="Enter college or university name"
                    onChange={(e) => setForm({ ...form, institution: e.target.value })}
                  />
                  <p className="text-xs text-red-600 font-medium mt-1 flex items-center">
                    <span className="text-sm mr-1">🤖</span>
                    RAASTA verified
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Course</label>
                  <input 
                    type="text" 
                    className="w-full border border-gray-300 rounded-lg shadow-sm bg-white px-4 py-2 text-gray-900 focus:ring-2 focus:ring-red-500 focus:outline-none" 
                    value={form.course} 
                    placeholder="e.g. B.Tech / Higher Education"
                    onChange={(e) => setForm({ ...form, course: e.target.value })}
                  />
                  <p className="text-xs text-red-600 font-medium mt-1 flex items-center">
                    <span className="text-sm mr-1">🤖</span>
                    RAASTA verified
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Household income</label>
                  <div className="relative">
                    <input 
                      type="text" 
                      className={`w-full border rounded-lg shadow-sm px-4 py-2 text-gray-900 ${form.householdIncome ? "bg-green-50 border-green-200 font-medium" : "bg-white border-gray-300"}`} 
                      value={form.householdIncome} 
                      placeholder="Upload document"
                      readOnly 
                    />
                  </div>
                  {form.householdIncome ? (
                    <button 
                      onClick={() => setActiveProvenance("householdIncome")}
                      className="text-xs text-green-600 font-medium mt-1 flex items-center hover:underline"
                    >
                      <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                      From income certificate
                    </button>
                  ) : (
                    <p className="text-xs text-amber-600 font-medium mt-1 flex items-center">
                      <span className="w-2 h-2 bg-amber-500 rounded-full mr-1.5"></span>
                      Pending document upload
                    </p>
                  )}
                </div>
              </div>
            </div>
            
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end">
              <button 
                onClick={() => {
                  updateState({ form });
                  router.push("/journey/review");
                }}
                disabled={!isComplete}
                className="px-6 py-2.5 bg-red-600 text-white font-medium rounded-xl hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Review Application →
              </button>
            </div>
          </div>
        </div>
      </div>

      <DocumentUploadModal 
        isOpen={activeUpload !== null} 
        onClose={() => setActiveUpload(null)} 
        documentName={state.documents.find((d) => d.id === activeUpload)?.name || "Document"}
        onUploadSuccess={handleUploadSuccess}
      />

      <ProvenanceDrawer 
        isOpen={activeProvenance !== null}
        onClose={() => setActiveProvenance(null)}
        field="Household income"
        value={form.householdIncome}
        sourceDoc="Income Certificate"
        confidence={98}
      />
    </div>
  );
}
