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
      <div className="relative w-64 h-64 flex items-center justify-center">
        {/* Lotus Image */}
        <img 
          src="/lotus.png" 
          alt="Lotus" 
          className="w-full h-full object-contain drop-shadow-[0_0_15px_rgba(232,83,26,0.6)] animate-float"
        />
      </div>
      
      <p className="mt-8 text-white font-medium text-lg tracking-wide animate-pulse">
        {text}
      </p>
    </div>
  );
}
