import React from "react";
import { Drawer } from "./Drawer";

export function EvidenceTrailDrawer({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  return (
    <Drawer isOpen={isOpen} onClose={onClose} title="Evidence Trail">
      <div className="space-y-6">
        <div className="relative">
          <div className="absolute top-8 bottom-0 left-4 w-0.5 bg-gray-200"></div>

          <div className="relative flex items-start mb-6">
            <div className="bg-gray-100 rounded-full w-8 h-8 flex items-center justify-center shrink-0 z-10 border-4 border-white text-gray-500">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
            </div>
            <div className="ml-4">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">YOUR NEED</p>
              <p className="text-gray-900 bg-gray-50 p-2 rounded-lg border border-gray-100">"My daughter needs financial help."</p>
            </div>
          </div>

          <div className="relative flex items-start mb-6">
            <div className="bg-red-100 rounded-full w-8 h-8 flex items-center justify-center shrink-0 z-10 border-4 border-white text-red-600">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"></path></svg>
            </div>
            <div className="ml-4">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">SERVICE</p>
              <p className="text-gray-900 font-medium">Education Financial Assistance</p>
            </div>
          </div>

          <div className="relative flex items-start mb-6">
            <div className="bg-gray-100 rounded-full w-8 h-8 flex items-center justify-center shrink-0 z-10 border-4 border-white text-gray-500">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.956 11.956 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
            </div>
            <div className="ml-4">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">ELIGIBILITY</p>
              <p className="text-gray-900">Income requirement</p>
            </div>
          </div>

          <div className="relative flex items-start mb-6">
            <div className="bg-gray-100 rounded-full w-8 h-8 flex items-center justify-center shrink-0 z-10 border-4 border-white">
              <span className="text-sm">🏛</span>
            </div>
            <div className="ml-4">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">OFFICIAL EVIDENCE</p>
              <p className="text-gray-900">Government source</p>
            </div>
          </div>
          
          <div className="relative flex items-start mb-6">
            <div className="bg-green-100 rounded-full w-8 h-8 flex items-center justify-center shrink-0 z-10 border-4 border-white text-green-600">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
            </div>
            <div className="ml-4">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">DOCUMENT</p>
              <p className="text-gray-900">Income Certificate</p>
            </div>
          </div>

          <div className="relative flex items-start mb-6">
            <div className="bg-gray-100 rounded-full w-8 h-8 flex items-center justify-center shrink-0 z-10 border-4 border-white text-gray-500">
              <span className="text-sm">🤖</span>
            </div>
            <div className="ml-4">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">EXTRACTED DATA</p>
              <p className="text-gray-900 bg-gray-50 p-2 rounded-lg border border-gray-100 font-mono text-sm">₹2,40,000</p>
            </div>
          </div>

          <div className="relative flex items-start mb-6">
            <div className="bg-red-100 rounded-full w-8 h-8 flex items-center justify-center shrink-0 z-10 border-4 border-white text-red-600">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
            </div>
            <div className="ml-4">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">FORM FIELD</p>
              <p className="text-gray-900">Household income</p>
            </div>
          </div>

          <div className="relative flex items-start">
            <div className="bg-green-100 rounded-full w-8 h-8 flex items-center justify-center shrink-0 z-10 border-4 border-white text-green-600">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
            </div>
            <div className="ml-4">
              <p className="text-xs font-bold text-green-600 uppercase tracking-wide mb-1">APPLICATION</p>
              <p className="text-green-900 font-medium">Ready for submission</p>
            </div>
          </div>
        </div>
      </div>
    </Drawer>
  );
}
