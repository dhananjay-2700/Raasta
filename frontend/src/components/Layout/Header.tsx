"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function Header() {
  const pathname = usePathname();
  const isJourney = pathname?.startsWith("/journey");

  return (
    <header className="bg-[#FAF4EB] border-b border-slate-200/60 sticky top-0 z-50 shadow-sm w-full">
      <div className="w-full px-6 md:px-12 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center space-x-2">
          <div className="text-slate-900 font-serif text-2xl font-bold tracking-tight">
            RAASTA
          </div>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center space-x-8 text-sm font-medium text-slate-600">
          <Link href="/" className="hover:text-slate-900 transition-colors">Home</Link>
          <button onClick={() => alert("My Journeys coming soon")} className="hover:text-slate-900 transition-colors">My Journeys</button>
          <button onClick={() => alert("Documents coming soon")} className="hover:text-slate-900 transition-colors">Documents</button>
          <button onClick={() => alert("Help coming soon")} className="hover:text-slate-900 transition-colors">Help</button>
        </nav>
        
        <div className="hidden md:flex items-center space-x-4">
          <button onClick={() => alert("Profile coming soon")} className="text-sm font-medium text-slate-900 hover:text-orange-600 transition-colors">
            Profile
          </button>
        </div>

        {/* Mobile Nav */}
        <div className="md:hidden flex items-center">
          <button className="text-slate-600 hover:text-slate-900" onClick={() => alert("Menu clicked")}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
          </button>
        </div>
      </div>
    </header>
  );
}
