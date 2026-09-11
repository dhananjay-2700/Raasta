import type { Metadata } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import "./globals.css";
import { JourneyProvider } from "@/context/JourneyContext";
import { Header } from "@/components/Layout/Header";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "RAASTA — Citizen-Service Journey Agent",
  description: "One conversation. Every government journey.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${playfair.variable} ${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-[#FAF4EB] text-[#111111] selection:bg-[#E32636] selection:text-white font-sans">
        <JourneyProvider>
          <Header />
          <div className="flex-grow">
            {children}
          </div>
        </JourneyProvider>
      </body>
    </html>
  );
}
