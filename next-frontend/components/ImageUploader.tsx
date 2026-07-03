"use client";

import React, { useState, useRef, ChangeEvent, DragEvent } from "react";

interface ImageUploaderProps {
  onImageProcessed: (base64Data: string, objectUrl: string) => void;
  isProcessing: boolean;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageProcessed, isProcessing }) => {
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    setError(null);

    if (!file.type.startsWith("image/")) {
      setError("Invalid file format. Please upload a JPEG, PNG, or WEBP image.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      // Pass both the raw base64 (for the API) and a temporary URL (for UI rendering)
      const objectUrl = URL.createObjectURL(file);
      onImageProcessed(result, objectUrl);
    };
    reader.onerror = () => {
      setError("File system reader encountered an anomaly while parsing the image.");
    };
    
    reader.readAsDataURL(file);
  };

  const onDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
      e.dataTransfer.clearData();
    }
  };

  const onFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFile(e.target.files[0]);
    }
  };

  return (
    <div className="w-full">
      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => !isProcessing && fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-2xl p-12 flex flex-col items-center justify-center transition-all duration-200 cursor-pointer ${
          isDragging
            ? "border-emerald-500 bg-emerald-500/10"
            : "border-slate-700 hover:border-slate-500 bg-slate-900"
        } ${isProcessing ? "opacity-50 pointer-events-none" : ""}`}
      >
        <input
          type="file"
          accept="image/jpeg, image/png, image/webp"
          className="hidden"
          ref={fileInputRef}
          onChange={onFileInputChange}
        />
        
        <svg className="w-12 h-12 text-slate-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
        </svg>
        <p className="text-sm font-semibold text-white tracking-wide">
          Click or drag a static image here
        </p>
        <p className="text-xs text-slate-500 mt-2 text-center max-w-xs">
          Supports high-resolution dataset samples (JPEG, PNG). The system will automatically downsample for inference.
        </p>
      </div>
      
      {error && (
        <div className="mt-4 p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-400 text-sm font-medium text-center">
          {error}
        </div>
      )}
    </div>
  );
};