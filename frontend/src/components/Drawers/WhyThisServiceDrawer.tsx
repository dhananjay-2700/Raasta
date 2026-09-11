import React from "react";
import { Drawer } from "./Drawer";

export function WhyThisServiceDrawer({
  isOpen,
  onClose,
  need,
}: {
  isOpen: boolean;
  onClose: () => void;
  need?: string;
}) {
  return (
    <Drawer isOpen={isOpen} onClose={onClose} title="Why this service?">
      <div className="space-y-6">
        <div className="relative">
          <div className="absolute top-8 bottom-0 left-4 w-0.5 bg-gray-200"></div>
          
          <div className="relative flex items-start mb-6">
            <div className="bg-gray-100 rounded-full w-8 h-8 flex items-center justify-center shrink-0 z-10 border-4 border-white text-gray-500">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
            </div>
            <div className="ml-4">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">YOUR NEED</p>
              <p className="text-gray-900 bg-gray-50 p-3 rounded-lg border border-gray-100">"{need || "My daughter needs financial help for college."}"</p>
            </div>
          </div>

          <div className="relative flex items-start mb-6">
            <div className="bg-red-100 rounded-full w-8 h-8 flex items-center justify-center shrink-0 z-10 border-4 border-white text-red-600">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"></path></svg>
            </div>
            <div className="ml-4">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">SERVICE CATEGORY</p>
              <p className="text-gray-900 font-medium">Higher education assistance</p>
            </div>
          </div>

          <div className="relative flex items-start mb-6">
            <div className="bg-gray-100 rounded-full w-8 h-8 flex items-center justify-center shrink-0 z-10 border-4 border-white text-gray-500">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.956 11.956 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
            </div>
            <div className="ml-4">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">ELIGIBILITY SIGNALS</p>
              <p className="text-gray-900">Relevant education need</p>
            </div>
          </div>

          <div className="relative flex items-start mb-6">
            <div className="bg-gray-100 rounded-full w-8 h-8 flex items-center justify-center shrink-0 z-10 border-4 border-white">
              <span className="text-sm">🏛</span>
            </div>
            <div className="ml-4">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">OFFICIAL EVIDENCE</p>
              <p className="text-gray-900">Government requirement match</p>
            </div>
          </div>

          <div className="relative flex items-start">
            <div className="bg-red-100 rounded-full w-8 h-8 flex items-center justify-center shrink-0 z-10 border-4 border-white">
              <span className="text-sm">🤖</span>
            </div>
            <div className="ml-4">
              <p className="text-xs font-bold text-red-600 uppercase tracking-wide mb-1">RAASTA ASSESSMENT</p>
              <p className="text-red-900 font-medium">Potentially relevant</p>
            </div>
          </div>
        </div>
      </div>
    </Drawer>
  );
}
