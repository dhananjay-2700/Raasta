"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useJourney } from "@/context/JourneyContext";
import { motion, useScroll, useTransform, AnimatePresence, useMotionValueEvent, MotionValue } from "framer-motion";
import { EvidenceCard } from "@/components/Cards/EvidenceCard";
import { GuidanceCard } from "@/components/Cards/GuidanceCard";
import SiriOrb from "@/components/ui/SiriOrb";
import { useVoiceAssistant } from "@/voice/useVoiceAssistant";

const CanvasSequence = ({ scrollProgress }: { scrollProgress: MotionValue<number> }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const images = useRef<HTMLImageElement[]>([]);
  const [imagesLoaded, setImagesLoaded] = useState(false);
  
  useEffect(() => {
    let loadedCount = 0;
    const totalFrames = 306;
    for (let i = 1; i <= totalFrames; i++) {
      const img = new Image();
      img.src = `/camel/${i.toString().padStart(3, '0')}.png`;
      img.onload = () => {
        loadedCount++;
        if (loadedCount === totalFrames) {
          setImagesLoaded(true);
        }
      };
      // To handle errors just in case, we still count them so it eventually finishes
      img.onerror = () => {
        loadedCount++;
        if (loadedCount === totalFrames) {
          setImagesLoaded(true);
        }
      }
      images.current.push(img);
    }
  }, []);

  const drawFrame = (frameIndex: number) => {
    const canvas = canvasRef.current;
    if (!canvas || images.current.length === 0) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    const img = images.current[frameIndex];
    if (img && img.complete) {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      
      const scale = Math.max(canvas.width / img.width, canvas.height / img.height);
      const x = (canvas.width / 2) - (img.width / 2) * scale;
      const y = (canvas.height / 2) - (img.height / 2) * scale;
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
    }
  };

  useEffect(() => {
    if (imagesLoaded) {
      drawFrame(0);
    }
  }, [imagesLoaded]);

  useMotionValueEvent(scrollProgress, "change", (latest) => {
    const frameIndex = Math.min(305, Math.max(0, Math.floor(latest * 305)));
    drawFrame(frameIndex);
  });

  return (
    <div className="relative w-full h-full bg-[#111]">
       <canvas ref={canvasRef} className="w-full h-full object-cover opacity-90" />
       {!imagesLoaded && (
         <div className="absolute inset-0 flex items-center justify-center text-white font-serif tracking-widest text-sm uppercase">
            Loading Experience...
         </div>
       )}
    </div>
  );
};

const AbstractArt = () => (
  <svg viewBox="0 0 800 800" className="w-full h-full opacity-0 animate-fade-in" style={{ animationDelay: '0.2s', animationFillMode: 'forwards' }}>
    <path 
      d="M250,200 C350,100 550,150 650,250 C750,350 700,500 550,550 C400,600 300,500 200,450 C100,400 150,300 250,200 Z" 
      fill="var(--color-brand-red)" 
      className="opacity-0 animate-blob-in" 
      style={{ animationDelay: '0.4s', transformOrigin: 'center' }} 
    />
    <path 
      d="M300,600 C450,550 550,600 650,700 C750,800 450,850 300,750 C150,650 150,650 300,600 Z" 
      fill="var(--color-brand-yellow)" 
      className="opacity-0 animate-blob-in" 
      style={{ animationDelay: '0.6s', transformOrigin: 'center' }} 
    />
    <path 
      d="M50,750 C100,650 200,750 300,650 C400,550 350,450 400,350 C450,250 550,300 600,400 C620,450 550,450 500,500 C450,550 400,600 500,650 C600,700 700,600 650,500 C600,400 550,300 450,200 C350,100 250,150 300,250 C320,300 300,350 400,450" 
      fill="none" 
      stroke="#111" 
      strokeWidth="4" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className="animate-draw-line"
      style={{ animationDelay: '0.2s' }}
    />
    <path 
      d="M350,550 C380,530 420,550 450,550 C480,550 520,530 550,550 C600,600 500,620 450,580 C400,620 300,600 350,550 Z" 
      fill="none" 
      stroke="#111" 
      strokeWidth="4" 
      strokeLinecap="round" 
      strokeLinejoin="round"
      className="animate-draw-line"
      style={{ animationDelay: '1.2s' }}
    />
  </svg>
);

export default function Home() {
  const router = useRouter();
  const { state, updateState } = useJourney();
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [siriActive, setSiriActive] = useState(false);
  const [voiceState, setVoiceState] = useState("IDLE");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSearchSubmit = async (overrideQuery?: string | React.MouseEvent) => {
    const finalQuery = typeof overrideQuery === 'string' ? overrideQuery : query;
    if (!finalQuery.trim()) return;
    setLoading(true);
    
    try {
      const appState = {
        application_id: state.application?.id || null,
        uploaded_documents: state.documents.filter((d: any) => d.status === "ready" || d.status === "uploaded").map((d: any) => d.name),
        consent_given: state.consent,
        reviewed: false,
        submitted: !!state.application
      };

      const res = await fetch("http://localhost:8000/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: finalQuery,
          application_state: appState
        }),
      });
      
      if (!res.ok) {
        throw new Error("Failed to analyze query");
      }
      
      const data = await res.json();
      
      if (data.status === "success") {
        setVoiceState("RESULT");
        updateState({
          intent: data.extraction?.intent || finalQuery,
          lifeEvent: data.extraction?.summary || "Life Event",
          need: data.extraction?.intent || "General Assistance",
          person: data.extraction?.entities?.relationship?.value || "Self",
          service: data.selected_scheme,
          eligibility: data.eligibility,
          evidence: data.provenance,
          nextBestAction: data.next_best_action
        });
        router.push("/journey/understand");
      } else {
        console.warn("Pipeline status:", data.status);
        alert(data.next_best_action?.description || "We need more information. Please try again.");
        setVoiceState("IDLE");
        setLoading(false);
      }
    } catch (error) {
      console.error("Error submitting query:", error);
      alert("There was an error processing your request. Please try again.");
      setVoiceState("IDLE");
      setLoading(false);
    }
  };

  useEffect(() => {
    // Connect to WebSocket for Vosk wake word detection
    const ws = new WebSocket("ws://localhost:8000/api/ws/voice");
    
    ws.onopen = () => console.log("[VOICE] WebSocket connected to backend.");
    ws.onerror = (e) => console.warn("[VOICE] WebSocket error (often safe to ignore during Strict Mode unmounts):", e);
    ws.onclose = () => console.log("[VOICE] WebSocket disconnected. Refresh to reconnect.");

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.event === "wake_word_detected") {
          setSiriActive(true);
          setVoiceState("WAKE_DETECTED");
          setQuery("Listening to your voice...");
          setTimeout(() => setVoiceState("LISTENING"), 500); // Visual transition
        } else if (data.event === "transcript") {
          setSiriActive(false);
          const transcriptText = data.text;
          
          setQuery((prev) => {
            const newQuery = prev === "Listening to your voice..." 
              ? transcriptText 
              : prev + " " + transcriptText;
            
            // Automatically submit after state update
            setTimeout(() => {
              setVoiceState("PROCESSING");
              handleSearchSubmit(newQuery);
            }, 100);
            
            return newQuery;
          });
        }
      } catch (e) {
        console.error("Error parsing WS message", e);
      }
    };

    return () => {
      ws.close();
    };
  }, [router, updateState, state]);

  // 1. Canvas Sequence Scroll hook
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress: canvasProgress } = useScroll({
    target: canvasContainerRef,
    offset: ["start start", "end end"]
  });

  // 2. Hero Parallax Scroll hook
  const heroContainerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress: heroProgress } = useScroll({
    target: heroContainerRef,
    offset: ["start start", "end start"]
  });

  const y1 = useTransform(heroProgress, [0, 1], [0, 400]);
  const y2 = useTransform(heroProgress, [0, 1], [0, -300]);
  const opacityHeroText = useTransform(heroProgress, [0, 0.8], [1, 0]);
  
  // Removed duplicate handleSearchSubmit

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setQuery(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-brand-red selection:text-white pb-32">
      <SiriOrb active={siriActive} text="Listening..." />
      
      {/* 1. Canvas Sequence Section */}
      <div ref={canvasContainerRef} className="h-[400vh] w-full relative z-40 bg-[#111]">
        <div className="sticky top-0 h-[100svh] w-full overflow-hidden">
           <CanvasSequence scrollProgress={canvasProgress} />
           
           <motion.div 
             className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center justify-center text-white/50"
           >
             <span className="text-[10px] md:text-xs uppercase tracking-widest mb-2 font-medium">Scroll</span>
             <div className="w-[1px] h-12 bg-white/20 overflow-hidden relative">
               <motion.div 
                 animate={{ y: [0, 48, 48], opacity: [0, 1, 0] }}
                 transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                 className="w-full h-full bg-white absolute top-[-100%]"
               />
             </div>
           </motion.div>
        </div>
      </div>

      {/* 2. Hero Parallax Section */}
      <div ref={heroContainerRef} className="h-[200vh] w-full relative z-30 bg-[#FAF4EB]">
        <div className="sticky top-0 h-[100svh] w-full overflow-hidden">
          
          <div className="absolute inset-0 z-0">
            {mounted && (
              <video 
                src="https://assets.mixkit.co/videos/preview/mixkit-ink-swirling-in-water-472-large.mp4"
                autoPlay 
                loop 
                muted 
                playsInline
                className="w-full h-full object-cover opacity-30 mix-blend-multiply"
              />
            )}
          </div>

          <motion.div style={{ y: y1 }} className="absolute inset-0 z-10 flex items-center justify-center opacity-80 pointer-events-none">
            <div className="w-[600px] h-[600px] md:w-[900px] md:h-[900px]">
               <AbstractArt />
            </div>
          </motion.div>

          <motion.div 
            style={{ y: y2, opacity: opacityHeroText }} 
            className="relative z-20 text-center w-full px-4 pt-12 h-full flex flex-col justify-center"
          >
            <motion.h1 
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.2, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              viewport={{ once: true }}
              className="font-serif text-[15vw] md:text-[12vw] leading-none text-[#111] uppercase tracking-tighter"
            >
              RAASTA
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.8 }}
              viewport={{ once: true }}
              className="mt-4 md:mt-6 text-lg md:text-3xl font-light italic text-[#111] max-w-2xl mx-auto"
            >
              One Conversation. Every Journey.
            </motion.p>
          </motion.div>

        </div>
      </div>

      {/* The rest of the page follows naturally */}
      <section className="py-32 md:py-48 px-6 bg-white relative z-20">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          >
            <h2 className="font-serif text-5xl md:text-7xl text-[#111] leading-tight mb-8">
              The New Standard <br/>
              <span className="italic text-gray-400">in Civic Interaction</span>
            </h2>
            <p className="text-xl md:text-2xl text-gray-700 font-light leading-relaxed max-w-3xl mx-auto">
              You don&apos;t need to memorize complex scheme names or navigate confusing bureaucratic structures. Simply describe your situation, and we translate it into the exact requirements you need.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="py-24 md:py-40 bg-background relative z-20 overflow-hidden border-t border-gray-200">
        <div className="max-w-5xl mx-auto px-6 relative">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            className="bg-white p-8 md:p-16 rounded-[2rem] shadow-2xl border border-gray-100 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-brand-yellow rounded-full mix-blend-multiply filter blur-3xl opacity-20 -translate-y-1/2 translate-x-1/4"></div>
            
            <h3 className="font-serif text-3xl md:text-5xl text-[#111] mb-12 relative z-10">Tell us what you need.</h3>
            
            <div className="relative z-10 group">
              <textarea
                ref={textareaRef}
                className="w-full p-4 md:p-6 pb-20 text-2xl md:text-4xl text-[#111] bg-transparent border-b border-gray-300 focus:border-brand-red resize-none outline-none transition-colors duration-500 placeholder:text-gray-300 font-serif"
                rows={1}
                placeholder="&quot;My daughter needs financial help for college...&quot;"
                value={query}
                onChange={handleTextareaChange}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSearchSubmit();
                  }
                }}
              />
              <div className="absolute bottom-4 right-4 flex items-center space-x-4">
                <button 
                  id="search-submit-btn"
                  onClick={handleSearchSubmit}
                  disabled={loading || !query.trim()}
                  className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-[#111] text-white flex items-center justify-center hover:bg-brand-red hover:scale-105 transition-all disabled:opacity-50 disabled:scale-100 shadow-xl"
                >
                  {loading ? (
                    <svg className="animate-spin h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {state.application && (
        <section className="pb-32 bg-background px-6 relative z-20">
          <div className="max-w-5xl mx-auto">
            <motion.div 
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="flex flex-col md:flex-row items-center justify-between p-10 md:p-16 bg-[#111] rounded-[2rem] shadow-2xl"
            >
              <div className="space-y-4 text-center md:text-left text-white">
                <p className="text-sm font-bold text-brand-yellow tracking-widest uppercase">Continue Your Journey</p>
                <h3 className="font-serif text-3xl md:text-4xl text-white">Education Financial Assistance</h3>
                <p className="text-gray-400 font-light text-lg">Application under review</p>
              </div>
              <button 
                onClick={() => router.push(`/journey/${state.application.id}`)}
                className="mt-8 md:mt-0 px-10 py-5 bg-white text-[#111] font-medium rounded-full hover:bg-gray-100 transition-colors tracking-wide text-lg"
              >
                Resume
              </button>
            </motion.div>
          </div>
        </section>
      )}
    </div>
  );
}
