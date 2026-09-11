"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

export type JourneyState = {
  id: string | null;
  intent: string;
  lifeEvent: string | null;
  need: string | null;
  person: string | null;
  service: any | null;
  eligibility: any | null;
  documents: any[];
  form: any | null;
  consent: boolean;
  application: any | null;
  nextBestAction: any | null;
  evidence: any | null;
};

const initialState: JourneyState = {
  id: null,
  intent: "",
  lifeEvent: null,
  need: null,
  person: null,
  service: null,
  eligibility: null,
  documents: [
    { id: "doc_1", name: "Admission proof", status: "ready" },
    { id: "doc_2", name: "Identity document", status: "ready" },
    { id: "doc_3", name: "Income certificate", status: "required" },
  ],
  form: null,
  consent: false,
  application: null,
  nextBestAction: null,
  evidence: null,
};

type JourneyContextType = {
  state: JourneyState;
  updateState: (updates: Partial<JourneyState>) => void;
  resetJourney: () => void;
};

const JourneyContext = createContext<JourneyContextType | undefined>(undefined);

export function JourneyProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<JourneyState>(initialState);

  const updateState = (updates: Partial<JourneyState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  };

  const resetJourney = () => {
    setState(initialState);
  };

  return (
    <JourneyContext.Provider value={{ state, updateState, resetJourney }}>
      {children}
    </JourneyContext.Provider>
  );
}

export function useJourney() {
  const context = useContext(JourneyContext);
  if (context === undefined) {
    throw new Error("useJourney must be used within a JourneyProvider");
  }
  return context;
}
