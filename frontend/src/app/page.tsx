"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useJourney } from "@/context/JourneyContext";
import { EvidenceCard } from "@/components/Cards/EvidenceCard";
import { GuidanceCard } from "@/components/Cards/GuidanceCard";

const AbstractArt = () => (
  <svg viewBox="0 0 800 800" className="w-full h-full opacity-0 animate-fade-in" style={{ animationDelay: '0.3s', animationFillMode: 'forwards' }}>
    {/* Red Blob (Turban) */}
    <path 
      d="M250,200 C350,100 550,150 650,250 C750,350 700,500 550,550 C400,600 300,500 200,450 C100,400 150,300 250,200 Z" 
      fill="var(--color-brand-red)" 
      className="opacity-0 animate-blob-in" 
      style={{ animationDelay: '0.5s', transformOrigin: 'center' }} 
    />
    {/* Yellow Blob (Lower body/accent) */}
    <path 
      d="M300,600 C450,550 550,600 650,700 C750,800 450,850 300,750 C150,650 150,650 300,600 Z" 
      fill="var(--color-brand-yellow)" 
      className="opacity-0 animate-blob-in" 
      style={{ animationDelay: '0.7s', transformOrigin: 'center' }} 
    />
    {/* Abstract continuous face line */}
    <path 
      d="M50,750 C100,650 200,750 300,650 C400,550 350,450 400,350 C450,250 550,300 600,400 C620,450 550,450 500,500 C450,550 400,600 500,650 C600,700 700,600 650,500 C600,400 550,300 450,200 C350,100 250,150 300,250 C320,300 300,350 400,450" 
      fill="none" 
      stroke="#111" 
      strokeWidth="4" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className="animate-draw-line"
    />
    {/* Mustache flourish */}
    <path 
      d="M350,550 C380,530 420,550 450,550 C480,550 520,530 550,550 C600,600 500,620 450,580 C400,620 300,600 350,550 Z" 
      fill="none" 
      stroke="#111" 
      strokeWidth="4" 
      strokeLinecap="round" 
      strokeLinejoin="round"
      className="animate-draw-line"
      style={{ animationDelay: '1s' }}
    />
  </svg>
);

export default function Home() {
  const router = useRouter();
  const { state, updateState } = useJourney();
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSearchSubmit = async () => {
    if (!query.trim()) return;
    setLoading(true);
    
    // Simulate API delay and intent parsing
    setTimeout(() => {
      updateState({
        intent: query,
        lifeEvent: "Higher education",
        need: "Financial assistance",
        person: "Daughter"
      });
      router.push("/journey/understand");
    }, 1000);
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setQuery(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden pb-32">
      {/* Hero Section */}
      <div className="relative min-h-[90vh] flex flex-col items-center justify-center px-6">
        
        {/* Background Abstract Art */}
        <div className="absolute inset-0 z-0 flex items-center justify-center opacity-80 pointer-events-none">
          <div className="w-[600px] h-[600px] md:w-[800px] md:h-[800px] max-w-full">
            <AbstractArt />
          </div>
        </div>

        {/* Content */}
        <div className="relative z-10 w-full max-w-5xl mx-auto flex flex-col items-center text-center space-y-12">
          
          <h1 className="font-serif text-5xl md:text-7xl lg:text-8xl text-[#111] leading-tight tracking-tight opacity-0 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            One Conversation.<br/>
            <span className="italic font-light text-gray-700">Every Journey.</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-800 font-light max-w-2xl opacity-0 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
            A new standard for civic interaction. Tell us what you need in your own words.
          </p>

          {/* Luxury Input */}
          <div className="w-full max-w-3xl pt-8 opacity-0 animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
            <div className="relative group bg-white/60 backdrop-blur-xl border border-white/50 shadow-2xl rounded-3xl p-2 transition-all duration-500 hover:shadow-3xl hover:bg-white/80 focus-within:bg-white/90 focus-within:shadow-3xl">
              <textarea
                ref={textareaRef}
                className="w-full p-6 text-2xl md:text-3xl bg-transparent border-none resize-none outline-none placeholder:text-gray-400 font-serif"
                rows={1}
                placeholder="What do you need help with?"
                value={query}
                onChange={handleTextareaChange}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSearchSubmit();
                  }
                }}
              />
              
              <div className="flex justify-end p-4">
                <button 
                  onClick={handleSearchSubmit}
                  disabled={loading || !query.trim()}
                  className="w-16 h-16 rounded-full bg-brand-red text-white flex items-center justify-center hover:scale-105 transition-transform disabled:opacity-50 disabled:scale-100 shadow-xl"
                >
                  {loading ? (
                    <svg className="animate-spin h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                  )}
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Editorial Content Section */}
      <div className="max-w-6xl mx-auto px-6 py-24 space-y-32 relative z-10">
        
        {/* Active Journey Demo */}
        {state.application && (
          <div className="flex flex-col md:flex-row items-center justify-between p-12 bg-white/50 backdrop-blur-md rounded-[3rem] border border-white/40 shadow-xl opacity-0 animate-fade-in-up" style={{ animationDelay: '0.8s' }}>
            <div className="space-y-4 text-center md:text-left">
              <p className="text-sm font-bold text-brand-red tracking-widest uppercase">Continue</p>
              <h3 className="font-serif text-3xl text-gray-900">Education Financial Assistance</h3>
              <p className="text-gray-500 font-light">Application under review</p>
            </div>
            <button 
              onClick={() => router.push(`/journey/${state.application.id}`)}
              className="mt-8 md:mt-0 px-10 py-5 bg-[#111] text-white font-medium rounded-full hover:bg-black transition-colors tracking-wide text-lg shadow-lg"
            >
              Resume Journey
            </button>
          </div>
        )}

        {/* Feature 1 */}
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <div className="space-y-8 order-2 md:order-1">
            <h2 className="font-serif text-4xl md:text-6xl leading-tight text-[#111]">No Jargon. <br/><span className="italic text-gray-500">Just Clarity.</span></h2>
            <p className="text-xl text-gray-700 font-light leading-relaxed">
              You don&apos;t need to memorize complex scheme names or navigate confusing bureaucratic structures. Simply describe your situation, and we translate it into the exact requirements you need.
            </p>
          </div>
          <div className="order-1 md:order-2 bg-white/50 backdrop-blur-sm p-16 rounded-[3rem] border border-white/40 shadow-2xl flex items-center justify-center transform hover:-translate-y-2 transition-transform duration-500">
             <p className="font-serif text-3xl text-center text-gray-800 italic leading-relaxed">
              &quot;My daughter needs financial help for college.&quot;
             </p>
          </div>
        </div>

        {/* Feature 2 */}
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <div className="bg-white/50 backdrop-blur-sm p-12 rounded-[3rem] border border-white/40 shadow-2xl transform hover:-translate-y-2 transition-transform duration-500">
            <div className="space-y-6">
              <EvidenceCard title="Verified Data">
                Official rules and requirements directly sourced from government portals.
              </EvidenceCard>
              <GuidanceCard>
                RAASTA&apos;s intelligent interpretation to effortlessly guide your journey.
              </GuidanceCard>
            </div>
          </div>
          <div className="space-y-8 pl-0 md:pl-12">
            <h2 className="font-serif text-4xl md:text-6xl leading-tight text-[#111]">Truth First. <br/><span className="italic text-gray-500">Always Verified.</span></h2>
            <p className="text-xl text-gray-700 font-light leading-relaxed">
              We separate AI guidance from ground truth. Every piece of advice is clearly demarcated from official government requirements, ensuring you always know what is absolute.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
