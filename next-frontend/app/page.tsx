import Link from "next/link";
import React from "react";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-8 selection:bg-emerald-500/30">
      <div className="max-w-3xl w-full space-y-8 text-center mt-[-10vh]">
        
        <div className="space-y-4">
          <div className="inline-flex items-center justify-center p-3 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 mb-4">
            <span className="text-3xl">🧠</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight">
            Market Recognition Engine
          </h1>
          <p className="text-lg text-slate-400 max-w-xl mx-auto">
            Phase 3 Deployment. Select an operational module below to initialize the neural network pipeline.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          
          <Link href="/scanner" className="group flex flex-col items-center p-8 bg-slate-900 border border-slate-800 hover:border-emerald-500/50 rounded-3xl transition-all duration-300 hover:shadow-2xl hover:shadow-emerald-900/20">
            <span className="text-4xl mb-4 group-hover:scale-110 transition-transform">🔴</span>
            <h2 className="text-lg font-bold text-white mb-2">Live Terminal</h2>
            <p className="text-sm text-slate-500">Real-time WebRTC inference</p>
          </Link>

          <Link href="/upload" className="group flex flex-col items-center p-8 bg-slate-900 border border-slate-800 hover:border-blue-500/50 rounded-3xl transition-all duration-300 hover:shadow-2xl hover:shadow-blue-900/20">
            <span className="text-4xl mb-4 group-hover:scale-110 transition-transform">📸</span>
            <h2 className="text-lg font-bold text-white mb-2">Static Upload</h2>
            <p className="text-sm text-slate-500">Dataset anomaly testing</p>
          </Link>

          <Link href="/dashboard" className="group flex flex-col items-center p-8 bg-slate-900 border border-slate-800 hover:border-purple-500/50 rounded-3xl transition-all duration-300 hover:shadow-2xl hover:shadow-purple-900/20">
            <span className="text-4xl mb-4 group-hover:scale-110 transition-transform">📊</span>
            <h2 className="text-lg font-bold text-white mb-2">Telemetry</h2>
            <p className="text-sm text-slate-500">System metrics & inventory</p>
          </Link>

        </div>
      </div>
    </main>
  );
}