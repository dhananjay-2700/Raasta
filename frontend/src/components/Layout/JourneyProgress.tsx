"use client";

import React from "react";
import { usePathname } from "next/navigation";

const steps = [
  { id: "understand", label: "Need", paths: ["/journey/understand"] },
  { id: "service", label: "Service", paths: ["/journey/service"] },
  { id: "prepare", label: "Prepare", paths: ["/journey/prepare"] },
  { id: "review", label: "Submit", paths: ["/journey/review"] },
  { id: "track", label: "Track", paths: ["/journey/track", "/journey/[id]"] }, // Will adapt later for dynamic id
];

export function JourneyProgress() {
  const pathname = usePathname();

  // Find current step index based on pathname
  let currentStepIndex = 0;
  if (pathname) {
    const activeStep = steps.findIndex((step) =>
      step.paths.some((p) => {
        if (p === "/journey/[id]") {
          return pathname.startsWith("/journey/") && pathname !== "/journey/understand" && pathname !== "/journey/service" && pathname !== "/journey/prepare" && pathname !== "/journey/review";
        }
        return pathname === p;
      })
    );
    if (activeStep !== -1) {
      currentStepIndex = activeStep;
    }
  }

  return (
    <div className="w-full bg-white border-b border-gray-100 py-3 shadow-sm">
      <div className="max-w-3xl mx-auto px-4 flex items-center justify-between">
        {steps.map((step, index) => {
          const isCompleted = index < currentStepIndex;
          const isCurrent = index === currentStepIndex;

          return (
            <React.Fragment key={step.id}>
              <div className="flex items-center space-x-2">
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                    isCompleted
                      ? "bg-red-600 text-white"
                      : isCurrent
                      ? "bg-red-100 text-red-600 ring-2 ring-red-600 ring-offset-2"
                      : "bg-gray-100 text-gray-400"
                  }`}
                >
                  {isCompleted ? (
                    <svg
                      className="w-3 h-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="3"
                        d="M5 13l4 4L19 7"
                      ></path>
                    </svg>
                  ) : isCurrent ? (
                    <span className="w-2 h-2 bg-red-600 rounded-full"></span>
                  ) : (
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full"></span>
                  )}
                </div>
                <span
                  className={`hidden sm:block text-sm font-medium ${
                    isCurrent ? "text-red-600" : isCompleted ? "text-gray-800" : "text-gray-400"
                  }`}
                >
                  {step.label}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`flex-grow h-0.5 mx-2 sm:mx-4 ${
                    isCompleted ? "bg-red-600" : "bg-gray-200"
                  }`}
                ></div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
