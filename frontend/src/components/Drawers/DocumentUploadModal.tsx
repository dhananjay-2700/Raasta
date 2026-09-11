"use client";

import React, { useState } from "react";
import { WarningCard } from "../Cards/WarningCard";
import { GuidanceCard } from "../Cards/GuidanceCard";
import { EvidenceCard } from "../Cards/EvidenceCard";

export function DocumentUploadModal({
  isOpen,
  onClose,
  onUploadSuccess,
  documentName,
}: {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess: (data: any) => void;
  documentName: string;
}) {
  const [isUploading, setIsUploading] = useState(false);
  const [step, setStep] = useState<"upload" | "processing" | "success">("upload");

  if (!isOpen) return null;

  const handleUpload = async () => {
    setIsUploading(true);
    setStep("processing");
    try {
      await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          application_id: "RAA-EDU-2026-10482",
          document_name: documentName,
          file_content_base64: "mock_doc_data"
        })
      });
    } catch (e) {
      console.warn("Document upload API call error:", e);
    }
    setTimeout(() => {
      setStep("success");
    }, 1500);
  };

  const handleUseData = () => {
    // Send back extracted mock data
    onUploadSuccess({
      status: "extracted",
      data: {
        householdIncome: "₹2,40,000",
      },
    });
    onClose();
    // Reset state after close
    setTimeout(() => {
      setStep("upload");
      setIsUploading(false);
    }, 500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-gray-900 bg-opacity-50 transition-opacity" 
        onClick={onClose}
      />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900">Upload {documentName}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6">
          {step === "upload" && (
            <>
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer" onClick={handleUpload}>
                <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
                </div>
                <p className="text-gray-900 font-medium mb-1">Click to upload document</p>
                <p className="text-gray-500 text-sm">or drag and drop</p>
                <button className="mt-4 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
                  Use camera
                </button>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">Why is this needed?</h4>
                <p className="text-gray-600 text-sm mb-4">This document is required to verify the household income requirement.</p>
                <EvidenceCard>
                  Income certificate is required for this application.
                </EvidenceCard>
              </div>
              <p className="text-xs text-gray-500 text-center flex items-center justify-center">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                Your document will only be used for this application.
              </p>
            </>
          )}

          {step === "processing" && (
            <div className="py-12 flex flex-col items-center justify-center space-y-6">
              <div className="relative w-24 h-24">
                <svg className="animate-spin text-red-600 w-24 h-24" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <div className="absolute inset-0 flex items-center justify-center text-red-600">
                  <span className="text-2xl">🤖</span>
                </div>
              </div>
              <div className="text-center">
                <h3 className="text-lg font-medium text-gray-900">RAASTA is analyzing...</h3>
                <p className="text-gray-500 text-sm mt-1">Extracting information from {documentName}</p>
              </div>
            </div>
          )}

          {step === "success" && (
            <div className="space-y-6">
              <div className="flex items-center space-x-3 bg-gray-50 p-4 rounded-xl border border-gray-100">
                <div className="text-2xl">📄</div>
                <div>
                  <p className="font-medium text-gray-900">income_certificate.pdf</p>
                  <p className="text-xs text-green-600 font-medium">✓ Processed successfully</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center text-sm text-gray-700">
                  <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                  Document detected
                </div>
                <div className="flex items-center text-sm text-gray-700">
                  <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                  Text extracted
                </div>
                <div className="flex items-center text-sm text-gray-700">
                  <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                  Information readable
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-xl p-4">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">HOUSEHOLD INCOME</p>
                <p className="text-2xl font-bold text-gray-900">₹2,40,000</p>
              </div>

              <button 
                onClick={handleUseData}
                className="w-full py-3 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center"
              >
                Use this information
                <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
