"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function Header() {
  const pathname = usePathname();
  const isJourney = pathname?.startsWith("/journey");

  return (
    <header className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center space-x-2">
          <div className="text-red-600 text-2xl font-extrabold tracking-tight flex items-center">
            RAASTA
          </div>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center space-x-6 text-sm font-medium text-gray-600">
          <Link href="/" className="hover:text-red-600 transition-colors">Home</Link>
          <Link href="#" className="hover:text-red-600 transition-colors">My Journeys</Link>
          <Link href="#" className="hover:text-red-600 transition-colors">Benefits</Link>
          <Link href="#" className="hover:text-red-600 transition-colors">Help</Link>
          <Link href="#" className="hover:text-red-600 transition-colors">Profile</Link>
        </nav>

        {/* Mobile Nav */}
        <nav className="md:hidden flex items-center space-x-4 text-xs font-medium text-gray-600">
          <Link href="/" className="hover:text-red-600">Home</Link>
          <Link href="#" className="hover:text-red-600">Journeys</Link>
          <Link href="#" className="hover:text-red-600">Benefits</Link>
          <Link href="#" className="hover:text-red-600">Profile</Link>
        </nav>
      </div>
    </header>
  );
}
