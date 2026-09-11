import React from "react";

export function ActivityTimeline() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Recent activity</h3>
      
      <div className="relative">
        <div className="absolute top-2 bottom-2 left-2.5 w-px bg-gray-200"></div>

        <div className="space-y-6">
          <div className="relative flex items-start">
            <div className="absolute left-0 bg-red-600 rounded-full w-5 h-5 flex items-center justify-center border-4 border-white z-10">
              <span className="w-1.5 h-1.5 bg-white rounded-full"></span>
            </div>
            <div className="ml-8">
              <p className="text-xs text-gray-500 mb-0.5">Today, 11:42 AM</p>
              <p className="text-sm font-medium text-gray-900">Application submitted</p>
            </div>
          </div>

          <div className="relative flex items-start">
            <div className="absolute left-0 bg-gray-300 rounded-full w-5 h-5 flex items-center justify-center border-4 border-white z-10"></div>
            <div className="ml-8">
              <p className="text-xs text-gray-500 mb-0.5">Today, 11:40 AM</p>
              <p className="text-sm font-medium text-gray-700">Consent provided</p>
            </div>
          </div>

          <div className="relative flex items-start">
            <div className="absolute left-0 bg-gray-300 rounded-full w-5 h-5 flex items-center justify-center border-4 border-white z-10"></div>
            <div className="ml-8">
              <p className="text-xs text-gray-500 mb-0.5">Today, 11:37 AM</p>
              <p className="text-sm font-medium text-gray-700">Documents verified</p>
            </div>
          </div>

          <div className="relative flex items-start">
            <div className="absolute left-0 bg-gray-300 rounded-full w-5 h-5 flex items-center justify-center border-4 border-white z-10"></div>
            <div className="ml-8">
              <p className="text-xs text-gray-500 mb-0.5">Today, 11:31 AM</p>
              <p className="text-sm font-medium text-gray-700">Income certificate uploaded</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
