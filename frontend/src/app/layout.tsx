import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "./components/Sidebar";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "VeriOTA — Post-Quantum Fleet Dashboard",
  description:
    "Real-time post-quantum secure automotive OTA fleet monitoring. CRYSTALS-Dilithium3 (NIST FIPS 204) + Merkle Tree tamper detection. Mich Josh Cybersecurity Hackathon 2026.",
  keywords: ["VeriOTA", "post-quantum", "OTA", "automotive", "Dilithium3", "FIPS 204", "cybersecurity"],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="bg-slate-950 text-white antialiased min-h-screen">
        {/* Ambient background effect */}
        <div className="fixed inset-0 pointer-events-none z-0">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />
        </div>
        <Sidebar />
        <div className="relative z-10">{children}</div>
      </body>
    </html>
  );
}
