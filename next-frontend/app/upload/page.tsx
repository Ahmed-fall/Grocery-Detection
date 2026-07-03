"use client";

import React, { useState, useMemo } from "react";
import { ImageUploader } from "../../components/ImageUploader";
// We safely re-use the types we defined in the ScannerEngine
import { InferenceResponse, DetectionItem } from "../../components/ScannerEngine";

interface CartItem extends DetectionItem {
  quantity: number;
}

export default function StaticUploadPage() {
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [currentDetections, setCurrentDetections] = useState<DetectionItem[]>([]);
  const [lastInferenceTime, setLastInferenceTime] = useState<number>(0);
  const [apiError, setApiError] = useState<string | null>(null);

  const processStaticImage = async (base64Data: string, objectUrl: string) => {
    setSelectedImageUrl(objectUrl);
    setIsProcessing(true);
    setApiError(null);
    setCurrentDetections([]);
    setLastInferenceTime(0);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/v1/detect`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image_base64: base64Data }),
      });

      if (!response.ok) {
        throw new Error(`API Fault: Status Code [${response.status}]`);
      }

      const inferencePayload: InferenceResponse = await response.json();
      setCurrentDetections(inferencePayload.detections);
      setLastInferenceTime(inferencePayload.inference_time_ms);
    } catch (err) {
      const error = err as Error;
      setApiError(`Inference Pipeline Failure: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const resetUploader = () => {
    if (selectedImageUrl) URL.revokeObjectURL(selectedImageUrl);
    setSelectedImageUrl(null);
    setCurrentDetections([]);
    setLastInferenceTime(0);
    setApiError(null);
  };

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
    <main className="min-h-screen p-4 md:p-8 font-sans selection:bg-emerald-500/30">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-center border-b border-slate-800 pb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Static Image Analysis</h1>
            <p className="text-sm text-slate-400">Manual Dataset Inspection Module</p>
          </div>
          {lastInferenceTime > 0 && (
            <div className="text-right">
              <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold">Execution Time</p>
              <p className="text-lg font-mono font-medium text-emerald-400">
                {lastInferenceTime.toFixed(1)} ms
              </p>
            </div>
          )}
        </header>

        {/* Main Interface Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Image / Uploader */}
          <section className="lg:col-span-2 space-y-4">
            {!selectedImageUrl ? (
              <ImageUploader onImageProcessed={processStaticImage} isProcessing={isProcessing} />
            ) : (
              <div className="relative rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 shadow-2xl inline-block max-w-full">
                {/* The static image dictates the container size so percentages match perfectly */}
                <img 
                  src={selectedImageUrl} 
                  alt="Target for analysis" 
                  className={`w-full h-auto block transition-opacity duration-300 ${isProcessing ? 'opacity-50' : 'opacity-100'}`}
                />
                
                {isProcessing && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/60 backdrop-blur-sm z-10">
                    <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-3" />
                    <p className="text-xs font-medium text-white tracking-widest uppercase">Executing Neural Pass...</p>
                  </div>
                )}

                {!isProcessing && currentDetections.map((detection, idx) => {
                  const { x_min, y_min, x_max, y_max } = detection.bounding_box;
                  const top = `${y_min * 100}%`;
                  const left = `${x_min * 100}%`;
                  const width = `${(x_max - x_min) * 100}%`;
                  const height = `${(y_max - y_min) * 100}%`;

                  return (
                    <div
                      key={`static-${detection.class_id}-${idx}`}
                      className="absolute border-2 border-emerald-400 bg-emerald-400/20 pointer-events-none"
                      style={{ top, left, width, height }}
                    >
                      <div className="absolute -top-7 left-[-2px] bg-emerald-400 text-slate-950 px-2 py-1 text-xs font-bold whitespace-nowrap">
                        {detection.name_en} ({(detection.confidence_score * 100).toFixed(0)}%)
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {apiError && (
              <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 font-medium text-sm">
                {apiError}
              </div>
            )}

            {selectedImageUrl && !isProcessing && (
              <button 
                onClick={resetUploader}
                className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold rounded-lg transition-colors border border-slate-700"
              >
                Upload New Image
              </button>
            )}
          </section>

          {/* Right Column: Receipt UI */}
          <section className="bg-slate-900 rounded-2xl border border-slate-800 flex flex-col h-full max-h-[calc(100vh-12rem)] shadow-xl overflow-hidden">
            <div className="p-5 border-b border-slate-800 bg-slate-900/50">
              <h2 className="text-lg font-semibold text-white">Detected Items / العناصر المكتشفة</h2>
            </div>
            
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {cartTotals.items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-3">
                  <p className="text-sm">No items processed yet.</p>
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
            </div>
          </section>

        </div>
      </div>
    </main>
  );
}