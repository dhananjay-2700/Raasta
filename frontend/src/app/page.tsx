"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useJourney } from "@/context/JourneyContext";
import { motion, useScroll, useTransform, AnimatePresence, useMotionValueEvent, MotionValue } from "framer-motion";
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

export default function Home() {
  const router = useRouter();
  const { state, updateState } = useJourney();
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [siriActive, setSiriActive] = useState(false);
  const [voiceState, setVoiceState] = useState("IDLE");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [introFinished, setIntroFinished] = useState(false);

  // 1. Canvas Sequence Scroll hook
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress: canvasProgress } = useScroll({
    target: canvasContainerRef,
    offset: ["start start", "end end"]
  });

  useMotionValueEvent(canvasProgress, "change", (latest) => {
    if (latest >= 0.99 && !introFinished) {
      setIntroFinished(true);
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'instant' });
      }, 0);
    }
  });

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

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: finalQuery,
          application_state: appState
        }),
      });
      
      if (!res.ok) throw new Error("Failed to analyze query");
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
      } else if (data.status === "greeting") {
        const greetingText = data.next_best_action?.description || data.extraction?.summary || "Hello! I am RAASTA, your citizen service assistant. How can I help you today?";
        setQuery(greetingText);
        setVoiceState("IDLE");
        setLoading(false);
      } else {
        console.warn("Pipeline status:", data.status);
        const infoText = data.next_best_action?.description || "I can help you find government schemes. Could you tell me a little more about your situation?";
        setQuery(infoText);
        setVoiceState("IDLE");
        setLoading(false);
      }
    } catch (error) {
      console.error("Error submitting query:", error);
      setVoiceState("IDLE");
      setLoading(false);
    }
  };

  const { voiceState: newVoiceState, error: voiceError, forceWakeWord } = useVoiceAssistant({
    onWakeWord: () => {
      const greeting = "Hello, I'm RAASTA. How can I help you today?";
      setQuery(greeting);
    },
    onTranscriptChange: (text) => {
      setQuery(text);
    },
    onTranscriptComplete: (text) => {
      setQuery(text);
      handleSearchSubmit(text);
    }
  });

  useEffect(() => {
    setVoiceState(newVoiceState);
    if (newVoiceState === 'ACTIVATING' || newVoiceState === 'LISTENING') {
      setSiriActive(true);
    } else {
      setSiriActive(false);
    }
  }, [newVoiceState]);

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setQuery(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF4EB] text-slate-900 selection:bg-orange-500 selection:text-white pb-20 font-sans">
      {voiceError && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-red-600 text-white px-6 py-3 rounded-full z-[200] shadow-xl text-sm font-medium">
          {voiceError}
        </div>
      )}
      <SiriOrb active={siriActive} text="Listening..." />
      
      {/* 1. Canvas Sequence Section */}
      {!introFinished && (
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
      )}

      {/* 2. HERO & 3. MAIN INPUT */}
      <section className="px-6 pt-24 pb-16 md:pt-32 md:pb-24 max-w-4xl mx-auto text-center relative z-20 bg-[#FAF4EB]">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-serif font-bold text-slate-900 leading-tight mb-6">
            Tell us what happened.<br />
            <span className="text-orange-600">We&apos;ll find the way forward.</span>
          </h1>
          <p className="text-xl md:text-2xl text-slate-600 mb-12 max-w-2xl mx-auto font-light">
            You don&apos;t need to know the scheme name, department, or application process.
          </p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.6, delay: 0.2 }}
          className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 relative flex flex-col text-left max-w-3xl mx-auto"
        >
          <label className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2 ml-2">What are you trying to get done?</label>
          <div className="relative">
            <textarea
              ref={textareaRef}
              className="w-full text-2xl md:text-3xl text-slate-900 bg-transparent placeholder-slate-300 resize-none outline-none py-4 px-2 pr-32 transition-all font-serif"
              rows={1}
              placeholder="My daughter needs a scholarship..."
              value={query}
              onChange={handleTextareaChange}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSearchSubmit();
                }
              }}
            />
            <div className="absolute right-2 bottom-2 flex items-center space-x-2">
              <button
                type="button"
                onClick={forceWakeWord}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                  newVoiceState !== 'IDLE' ? 'bg-orange-600 text-white animate-pulse shadow-md' : 'bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-900'
                }`}
                title="Click to speak (or say 'Raasta')"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path>
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                  <line x1="12" y1="19" x2="12" y2="22"></line>
                </svg>
              </button>
              <button 
                onClick={handleSearchSubmit}
                disabled={loading || !query.trim()}
                className="w-12 h-12 rounded-full bg-slate-900 text-white flex items-center justify-center hover:bg-teal-700 transition-all shadow-md disabled:opacity-50"
              >
                {loading ? (
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                )}
              </button>
            </div>
          </div>
        </motion.div>

        {/* 4. EXAMPLE CHIPS */}
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          transition={{ duration: 0.6, delay: 0.4 }}
          className="flex flex-wrap items-center justify-center gap-3 mt-8"
        >
          <span className="text-sm font-medium text-slate-500 mr-2">Try:</span>
          {["Scholarship", "Certificate", "Financial help", "Healthcare", "Housing"].map((chip) => (
            <button 
              key={chip} 
              onClick={() => {
                setQuery(`I need help with a ${chip.toLowerCase()}`);
                if (textareaRef.current) textareaRef.current.focus();
              }}
              className="px-4 py-2 bg-white border border-slate-200 rounded-full text-sm font-medium text-slate-700 hover:border-slate-400 hover:text-slate-900 transition-colors shadow-sm"
            >
              {chip}
            </button>
          ))}
        </motion.div>
      </section>



      {/* 5. HOW RAASTA WORKS */}
      <section className="py-24 px-6 max-w-6xl mx-auto relative z-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-slate-900">How RAASTA Works</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { step: "01", title: "Understand", desc: "Tell us your situation in normal language." },
            { step: "02", title: "Find", desc: "RAASTA finds relevant government services and checks what may apply to you." },
            { step: "03", title: "Complete", desc: "RAASTA helps with documents, applications and tracking." }
          ].map((item) => (
            <div key={item.step} className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
              <div className="text-6xl font-bold text-slate-100 absolute -top-4 -right-4 -z-0 select-none pointer-events-none">{item.step}</div>
              <h3 className="text-xl font-bold text-slate-900 mb-4 relative z-10">{item.title}</h3>
              <p className="text-slate-600 relative z-10">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 6. CORE PRODUCT DEMONSTRATION */}
      <section className="py-24 px-6 bg-white border-y border-slate-200 overflow-hidden relative z-20">
        <div className="max-w-5xl mx-auto text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-slate-900">From a problem to a clear path</h2>
        </div>
        
        <div className="max-w-3xl mx-auto relative flex flex-col items-center">
          
          {/* Step 1 */}
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.3 }} transition={{ duration: 0.5 }} className="bg-slate-50 border border-slate-200 p-6 rounded-2xl w-full text-center relative z-10">
            <p className="text-sm font-semibold text-slate-500 uppercase tracking-widest mb-2">Citizen Problem</p>
            <p className="text-xl font-serif text-slate-900">"My daughter wants to go to college but we can't afford it."</p>
          </motion.div>
          
          <motion.div initial={{ opacity: 0, scaleY: 0, originY: 0 }} whileInView={{ opacity: 1, scaleY: 1 }} viewport={{ once: true, amount: 0.8 }} transition={{ duration: 0.4 }} className="w-0.5 h-12 bg-orange-300"></motion.div>
          
          {/* Step 2 */}
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.3 }} transition={{ duration: 0.5 }} className="bg-orange-50 border border-orange-200 p-6 rounded-2xl w-full text-center relative z-10">
            <p className="text-sm font-semibold text-orange-600 uppercase tracking-widest mb-2">RAASTA Understands</p>
            <p className="text-lg font-medium text-orange-900">Education + financial assistance</p>
          </motion.div>

          <motion.div initial={{ opacity: 0, scaleY: 0, originY: 0 }} whileInView={{ opacity: 1, scaleY: 1 }} viewport={{ once: true, amount: 0.8 }} transition={{ duration: 0.4 }} className="w-0.5 h-12 bg-teal-300"></motion.div>

          {/* Step 3 */}
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.3 }} transition={{ duration: 0.5 }} className="bg-teal-50 border border-teal-200 p-6 rounded-2xl w-full text-center relative z-10">
            <p className="text-sm font-semibold text-teal-600 uppercase tracking-widest mb-2">RAASTA Finds</p>
            <p className="text-lg font-medium text-teal-900">3 potentially relevant services</p>
          </motion.div>

          <motion.div initial={{ opacity: 0, scaleY: 0, originY: 0 }} whileInView={{ opacity: 1, scaleY: 1 }} viewport={{ once: true, amount: 0.8 }} transition={{ duration: 0.4 }} className="w-0.5 h-12 bg-slate-400"></motion.div>

          {/* Step 4 */}
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.3 }} transition={{ duration: 0.5 }} className="bg-slate-900 text-white p-6 rounded-2xl w-full flex flex-col md:flex-row items-center justify-between relative z-10 shadow-lg">
            <div className="text-center md:text-left mb-4 md:mb-0">
              <p className="text-sm font-semibold text-slate-400 uppercase tracking-widest mb-1">RAASTA Creates</p>
              <p className="text-lg font-medium">Your clear path forward</p>
            </div>
            <div className="flex items-center justify-center space-x-2 md:space-x-4 text-sm font-medium">
              <span className="bg-slate-800 px-3 py-1.5 rounded-lg">Eligibility</span>
              <span className="text-slate-600">→</span>
              <span className="bg-slate-800 px-3 py-1.5 rounded-lg">Documents</span>
              <span className="text-slate-600">→</span>
              <span className="bg-slate-800 px-3 py-1.5 rounded-lg">Application</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 8. ACTIVE JOURNEY PREVIEW */}
      {state.application && (
        <section className="py-24 px-6 max-w-4xl mx-auto relative z-20">
          <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between">
            <div className="mb-8 md:mb-0">
              <h3 className="font-serif text-2xl text-slate-900 font-bold mb-6">Education Support</h3>
              <div className="space-y-4">
                <div className="flex items-center space-x-3 text-emerald-600">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  <span className="font-medium">Need understood</span>
                </div>
                <div className="flex items-center space-x-3 text-emerald-600">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  <span className="font-medium">Service selected</span>
                </div>
                <div className="flex items-center space-x-3 text-slate-900">
                  <div className="w-5 h-5 rounded-full border-4 border-orange-500 bg-white"></div>
                  <span className="font-bold">Eligibility</span>
                </div>
                <div className="flex items-center space-x-3 text-slate-400">
                  <div className="w-5 h-5 rounded-full border-2 border-slate-300"></div>
                  <span className="font-medium">Documents</span>
                </div>
                <div className="flex items-center space-x-3 text-slate-400">
                  <div className="w-5 h-5 rounded-full border-2 border-slate-300"></div>
                  <span className="font-medium">Application</span>
                </div>
              </div>
            </div>
            
            <div className="flex-shrink-0">
              <button 
                onClick={() => router.push(`/journey/${state.application.id}`)}
                className="px-8 py-4 bg-slate-900 text-white font-medium rounded-full hover:bg-teal-700 transition-colors shadow-md text-lg"
              >
                View Journey
              </button>
            </div>
          </div>
        </section>
      )}

      {/* 9. FINAL CTA */}
      <section className="py-24 px-6 text-center max-w-2xl mx-auto relative z-20">
        <h2 className="text-3xl font-serif font-bold text-slate-900 mb-8">
          Have a government-service problem?
        </h2>
        <button 
          onClick={() => {
            if (textareaRef.current) {
              textareaRef.current.focus();
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }
          }}
          className="inline-flex items-center space-x-2 px-8 py-4 bg-orange-600 text-white font-medium rounded-full hover:bg-orange-700 transition-colors shadow-lg text-lg"
        >
          <span>Start your journey</span>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
        </button>
      </section>

    </div>
  );
}
