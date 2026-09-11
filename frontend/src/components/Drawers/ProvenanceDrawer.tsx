import React from "react";
import { Drawer } from "./Drawer";

export function ProvenanceDrawer({
  isOpen,
  onClose,
  field,
  value,
  sourceDoc,
  confidence,
}: {
  isOpen: boolean;
  onClose: () => void;
  field: string;
  value: string;
  sourceDoc: string;
  confidence: number;
}) {
  return (
    <Drawer isOpen={isOpen} onClose={onClose} title="Field Provenance">
      <div className="space-y-6">
        <div>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">FIELD SOURCE</p>
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
            <p className="text-sm text-gray-600 mb-1">{field}</p>
            <p className="text-xl font-bold text-gray-900">{value}</p>
          </div>
        </div>

        <div>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">EXTRACTION DETAILS</p>
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <span className="text-sm text-gray-600">Source Document</span>
              <span className="text-sm font-medium text-gray-900">{sourceDoc}</span>
            </div>
            <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center bg-white">
              <span className="text-sm text-gray-600">Page</span>
              <span className="text-sm font-medium text-gray-900">1</span>
            </div>
            <div className="px-4 py-3 flex justify-between items-center bg-gray-50">
              <span className="text-sm text-gray-600">Extraction Confidence</span>
              <div className="flex items-center">
                <span className="text-sm font-bold text-green-600 mr-2">{confidence}%</span>
                <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-green-500" style={{ width: `${confidence}%` }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <button className="w-full py-3 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors">
          View document
        </button>
      </div>
    </Drawer>
  );
}
