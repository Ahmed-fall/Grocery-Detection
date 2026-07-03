"use client";

import React, { useState, useMemo } from "react";
import { ScannerEngine, InferenceResponse, DetectionItem } from "../../components/ScannerEngine";

// Helper interface for the aggregated shopping cart
interface CartItem extends DetectionItem {
  quantity: number;
}

export default function CheckoutPage() {
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [currentDetections, setCurrentDetections] = useState<DetectionItem[]>([]);
  const [lastInferenceTime, setLastInferenceTime] = useState<number>(0);

  // Callback fired every time the FastAPI backend resolves a frame
  const handleDetections = (data: InferenceResponse) => {
    setCurrentDetections(data.detections);
    setLastInferenceTime(data.inference_time_ms);
  };

  // Memoized aggregation matrix: Groups raw frame detections into cart quantities
  const cartTotals = useMemo(() => {
    const map = new Map<number, CartItem>();
    
    currentDetections.forEach((item) => {
      if (map.has(item.class_id)) {
        const existing = map.get(item.class_id)!;
        existing.quantity += 1;
      } else {
        map.set(item.class_id, { ...item, quantity: 1 });
      }
    });

    const items = Array.from(map.values());
    const grandTotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    return { items, grandTotal };
  }, [currentDetections]);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-200 p-4 md:p-8 font-sans selection:bg-emerald-500/30">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header Section */}
        <header className="flex flex-col md:flex-row justify-between items-center border-b border-slate-800 pb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Smart Checkout Terminal</h1>
            <p className="text-sm text-slate-400">Egyptian Market Recognition System (Phase 3)</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold">Engine Latency</p>
              <p className={`text-lg font-mono font-medium ${lastInferenceTime > 150 ? 'text-rose-400' : 'text-emerald-400'}`}>
                {lastInferenceTime > 0 ? `${lastInferenceTime.toFixed(1)} ms` : "---"}
              </p>
            </div>
            <button
              onClick={() => setIsScanning(!isScanning)}
              className={`px-6 py-3 rounded-xl font-bold uppercase tracking-wider transition-all duration-300 ${
                isScanning 
                  ? "bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 border border-rose-500/50" 
                  : "bg-emerald-600 text-white hover:bg-emerald-500 shadow-lg shadow-emerald-900/20"
              }`}
            >
              {isScanning ? "Halt Scanner" : "Engage System"}
            </button>
          </div>
        </header>

        {/* Main Interface Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Visual Scanner Matrix (Takes up 2/3 width on large screens) */}
          <section className="lg:col-span-2 space-y-4">
            <div className="flex justify-between items-end">
              <h2 className="text-lg font-semibold text-slate-300">Live Optical Feed</h2>
              <span className="flex h-3 w-3 relative">
                {isScanning && (
                  <>
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                  </>
                )}
              </span>
            </div>
            
            {/* The relative container is crucial here to anchor the absolute bounding boxes */}
            <div className="relative aspect-video rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 shadow-2xl">
              <ScannerEngine
                isScanning={isScanning}
                onDetectionsReceived={handleDetections}
                frameIntervalMs={250} // 4 FPS processing rate
              />

              {/* Bounding Box Overlay Engine */}
              {isScanning && currentDetections.map((detection, idx) => {
                const { x_min, y_min, x_max, y_max } = detection.bounding_box;
                // Convert normalized YOLO spatial data (0-1) to CSS layout percentages
                const top = `${y_min * 100}%`;
                const left = `${x_min * 100}%`;
                const width = `${(x_max - x_min) * 100}%`;
                const height = `${(y_max - y_min) * 100}%`;

                return (
                  <div
                    key={`${detection.class_id}-${idx}`}
                    className="absolute border-2 border-emerald-400 bg-emerald-400/10 pointer-events-none transition-all duration-75"
                    style={{ top, left, width, height }}
                  >
                    <div className="absolute -top-7 left-[-2px] bg-emerald-400 text-slate-950 px-2 py-1 text-xs font-bold whitespace-nowrap">
                      {detection.name_en} ({(detection.confidence_score * 100).toFixed(0)}%)
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Right Column: Transaction Receipt UI */}
          <section className="bg-slate-900 rounded-2xl border border-slate-800 flex flex-col h-full max-h-[calc(100vh-12rem)] shadow-xl overflow-hidden">
            <div className="p-5 border-b border-slate-800 bg-slate-900/50">
              <h2 className="text-lg font-semibold text-white">Active Cart / السلة</h2>
            </div>
            
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {cartTotals.items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-3">
                  <svg className="w-12 h-12 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <p className="text-sm">No items localized in frame.</p>
                </div>
              ) : (
                cartTotals.items.map((item) => (
                  <div key={item.class_id} className="flex justify-between items-center p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-white">{item.name_en}</span>
                        <span className="text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded-full">x{item.quantity}</span>
                      </div>
                      <p className="text-sm text-slate-400 font-arabic mt-1">{item.name_ar}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-mono text-emerald-400 font-semibold">
                        {(item.price * item.quantity).toFixed(2)} EGP
                      </p>
                      <p className="text-xs text-slate-500 font-mono">
                        {item.price.toFixed(2)} / ea
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-5 border-t border-slate-800 bg-slate-950">
              <div className="flex justify-between items-center mb-4">
                <span className="text-slate-400 uppercase tracking-widest text-sm font-semibold">Total / الإجمالي</span>
                <span className="text-2xl font-mono font-bold text-white">
                  {cartTotals.grandTotal.toFixed(2)} <span className="text-emerald-500 text-lg">EGP</span>
                </span>
              </div>
              <button 
                disabled={cartTotals.items.length === 0}
                className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-600 disabled:cursor-not-allowed text-white font-bold rounded-xl uppercase tracking-widest transition-colors"
              >
                Complete Transaction
              </button>
            </div>
          </section>

        </div>
      </div>
    </main>
  );
}