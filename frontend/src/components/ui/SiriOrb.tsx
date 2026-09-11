"use client";

import { useEffect, useState } from "react";

export default function SiriOrb({ active, text = "Listening..." }: { active: boolean, text?: string }) {
  const [show, setShow] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [prevText, setPrevText] = useState(text);

  useEffect(() => {
    if (active) setShow(true);
    else {
      // Small delay before unmounting to allow fade out
      const t = setTimeout(() => setShow(false), 300);
      return () => clearTimeout(t);
    }
  }, [active]);

  useEffect(() => {
    if (text !== prevText) {
      setPrevText(text);
      if (text !== "Listening..." && text !== "Listening to your voice...") {
        setIsSpeaking(true);
        // Turn off speaking animation after a short delay of no new text
        const t = setTimeout(() => setIsSpeaking(false), 800);
        return () => clearTimeout(t);
      }
    }
  }, [text, prevText]);

  if (!show && !active) return null;

  return (
    <div 
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center transition-opacity duration-300"
      style={{
        background: "rgba(10, 5, 2, 0.8)", // Darker backdrop to make the screen blend mode pop
        backdropFilter: "blur(16px)",
        opacity: active ? 1 : 0,
        pointerEvents: active ? "auto" : "none"
      }}
    >
      <div className="relative w-72 h-72 flex items-center justify-center">
        {/* Outer Rotating Red Spherical Aura */}
        <div 
          className={`absolute inset-0 transition-all duration-300 ${isSpeaking ? 'scale-110' : 'scale-100'}`}
          style={{
            animation: isSpeaking ? 'spin 3s linear infinite' : 'spin 12s linear infinite',
            mixBlendMode: "screen"
          }}
        >
          <img 
            src="/lotus_orb.png" 
            alt="Orb Aura" 
            className="w-full h-full object-cover"
            style={{
              WebkitMaskImage: "radial-gradient(circle, transparent 40%, black 52%, black 65%, transparent 70%)",
              maskImage: "radial-gradient(circle, transparent 40%, black 52%, black 65%, transparent 70%)",
              filter: isSpeaking ? "brightness(1.5) drop-shadow(0 0 20px rgba(255,50,50,0.8))" : "brightness(1)",
              transition: "filter 0.3s ease"
            }}
          />
        </div>

        {/* Inner Stable Lotus */}
        <div 
          className={`absolute inset-0 transition-transform duration-300 ${isSpeaking ? 'scale-105' : 'scale-100'}`}
          style={{ mixBlendMode: "screen" }}
        >
          <img 
            src="/lotus_orb.png" 
            alt="Lotus Center" 
            className="w-full h-full object-cover"
            style={{
              WebkitMaskImage: "radial-gradient(circle, black 40%, transparent 50%)",
              maskImage: "radial-gradient(circle, black 40%, transparent 50%)"
            }}
          />
        </div>
      </div>
      
      <p className={`mt-12 font-medium text-xl tracking-wide transition-all duration-300 ${isSpeaking ? 'text-red-400 scale-110 drop-shadow-[0_0_8px_rgba(255,0,0,0.8)]' : 'text-white/80 scale-100 animate-pulse'}`}>
        {text}
      </p>

      <style jsx global>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
