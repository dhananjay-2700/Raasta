"use client";

import { useEffect, useState } from "react";

export default function SiriOrb({ active, text = "Listening..." }: { active: boolean, text?: string }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (active) setShow(true);
    else {
      // Small delay before unmounting to allow fade out
      const t = setTimeout(() => setShow(false), 300);
      return () => clearTimeout(t);
    }
  }, [active]);

  if (!show && !active) return null;

  return (
    <div 
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center transition-opacity duration-300"
      style={{
        background: "rgba(28, 18, 8, 0.7)",
        backdropFilter: "blur(12px)",
        opacity: active ? 1 : 0,
        pointerEvents: active ? "auto" : "none"
      }}
    >
      <div className="relative w-40 h-40 flex items-center justify-center">
        {/* Glowing Orbs */}
        <div className="absolute inset-0 rounded-full blur-2xl opacity-60 animate-spin"
             style={{ background: "conic-gradient(from 0deg, #E8531A, #FDBA74, #991B1B, #E8531A)", animationDuration: "3s" }} />
        <div className="absolute inset-0 rounded-full blur-3xl opacity-50 animate-spin"
             style={{ background: "conic-gradient(from 180deg, #FDBA74, #E8531A, #FDBA74)", animationDuration: "2s", animationDirection: "reverse" }} />
        <div className="absolute inset-4 rounded-full blur-xl opacity-80"
             style={{ background: "radial-gradient(circle, #E8531A 0%, transparent 80%)", animation: "pulse 1.5s infinite alternate ease-in-out" }} />
        
        {/* Core */}
        <div className="absolute inset-8 rounded-full bg-white shadow-[0_0_20px_rgba(255,255,255,0.8)]" />
      </div>
      
      <p className="mt-8 text-white font-medium text-lg tracking-wide animate-pulse">
        {text}
      </p>
    </div>
  );
}
