"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";

// Strict types updated for TypeScript standard compliance
export interface BoundingBox {
  x_min: number;
  y_min: number;
  x_max: number;
  y_max: number;
}

export interface DetectionItem {
  class_id: number;
  name_en: string;
  name_ar: string;
  confidence_score: number;
  bounding_box: BoundingBox;
  price: number;
}

export interface InferenceResponse {
  session_id: string;
  timestamp: string;
  inference_time_ms: number;
  total_detections: number;
  detections: DetectionItem[];
}

interface ScannerEngineProps {
  onDetectionsReceived: (data: InferenceResponse) => void;
  isScanning: boolean;
  frameIntervalMs?: number;
}

export const ScannerEngine: React.FC<ScannerEngineProps> = ({
  onDetectionsReceived,
  isScanning,
  frameIntervalMs = 300,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  // FIXED: Safely type the interval ID cross-environment
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [streamActive, setStreamActive] = useState<boolean>(false);
  const [hardwareError, setHardwareError] = useState<string | null>(null);

  const initializeCamera = useCallback(async () => {
    setHardwareError(null);
    try {
      if (streamRef.current) {
        // FIXED: Explicitly type 'track' as MediaStreamTrack
        streamRef.current.getTracks().forEach((track: MediaStreamTrack) => track.stop());
      }

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: "environment",
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 }
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setStreamActive(true);
      }
    } catch (err) {
      // FIXED: Cast the caught exception to standard Error
      const error = err as Error;
      console.error("Camera Initialization Vector Failed:", error);
      
      if (error.name === "NotAllowedError") {
        setHardwareError("Security Exception: Access to camera hardware was explicitly denied by user.");
      } else if (error.name === "NotFoundError") {
        setHardwareError("Hardware Exception: No compatible visual capture device found on host platform.");
      } else {
        setHardwareError(`Subsystem Failure: ${error.message || "Unknown hardware allocation error."}`);
      }
    }
  }, []);

  const terminateCamera = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (streamRef.current) {
      // FIXED: Explicitly type 'track' as MediaStreamTrack
      streamRef.current.getTracks().forEach((track: MediaStreamTrack) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setStreamActive(false);
  }, []);

  const captureAndInferenceFrame = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || !streamActive) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    if (!ctx || video.videoWidth === 0 || video.videoHeight === 0) return;

    if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    try {
      const base64DataUrl = canvas.toDataURL("image/jpeg", 0.85);
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/v1/detect`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ image_base64: base64DataUrl }),
      });

      if (!response.ok) {
        throw new Error(`API Transaction Error: Code status structural failure [${response.status}]`);
      }

      const inferencePayload: InferenceResponse = await response.json();
      onDetectionsReceived(inferencePayload);
    } catch (err) {
      const apiErr = err as Error;
      console.warn("Pipeline Frame Dropout. Backend context ingestion failed safely:", apiErr.message);
    }
  }, [streamActive, onDetectionsReceived]);

  useEffect(() => {
    if (isScanning) {
      initializeCamera();
    } else {
      terminateCamera();
    }

    return () => terminateCamera();
  }, [isScanning, initializeCamera, terminateCamera]);

  useEffect(() => {
    if (isScanning && streamActive) {
      intervalRef.current = setInterval(captureAndInferenceFrame, frameIntervalMs);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isScanning, streamActive, frameIntervalMs, captureAndInferenceFrame]);

  return (
    <div className="relative w-full h-full max-w-3xl mx-auto rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 shadow-2xl">
      {hardwareError ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-20 bg-slate-950/95">
          <svg className="w-12 h-12 text-rose-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <p className="text-sm font-semibold text-slate-200 antialiased">{hardwareError}</p>
          <button 
            onClick={initializeCamera}
            className="mt-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg tracking-wide uppercase transition-colors"
          >
            Retry Hardware Allocation
          </button>
        </div>
      ) : null}

      <canvas ref={canvasRef} className="hidden" />

      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-full object-cover aspect-video bg-black"
      />
      
      {!streamActive && isScanning && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm z-10">
          <div className="flex flex-col items-center space-y-3">
            <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-medium text-slate-400 tracking-wider">Mounting Peripheral Sensor Matrix...</p>
          </div>
        </div>
      )}
    </div>
  );
};