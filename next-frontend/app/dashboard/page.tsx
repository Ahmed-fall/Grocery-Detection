"use client";

import React, { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// --- Mock Telemetry Data ---
// In production, this will be fetched from your FastAPI/Supabase endpoints
const latencyData = [
  { time: "08:00", ms: 120 }, { time: "09:00", ms: 115 },
  { time: "10:00", ms: 145 }, { time: "11:00", ms: 130 },
  { time: "12:00", ms: 180 }, { time: "13:00", ms: 125 },
  { time: "14:00", ms: 110 },
];

const inventoryData = [
  { name: "Red Bull", count: 145 },
  { name: "Lays Chips", count: 98 },
  { name: "Coca Cola", count: 210 },
  { name: "Dairy Milk", count: 64 },
  { name: "Water 1L", count: 315 },
];

export default function DashboardPage() {
  const [mounted, setMounted] = useState(false);

  // Recharts requires the component to be mounted on the client to calculate dimensions
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <main className="min-h-screen p-4 md:p-8 font-sans bg-slate-950 text-slate-200">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Dashboard Header */}
        <header className="border-b border-slate-800 pb-6 flex justify-between items-end">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">System Telemetry</h1>
            <p className="text-sm text-slate-400">YOLOv8 Edge Performance & Inventory Metrics</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-semibold text-emerald-500 uppercase tracking-widest">System Online</span>
          </div>
        </header>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-lg">
            <p className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-2">Total Scans (Today)</p>
            <p className="text-4xl font-bold text-white">1,284</p>
            <p className="text-xs text-emerald-400 mt-2 font-medium">+12% vs yesterday</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-lg">
            <p className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-2">Avg Inference Latency</p>
            <p className="text-4xl font-mono font-bold text-white">132 <span className="text-lg text-slate-500">ms</span></p>
            <p className="text-xs text-emerald-400 mt-2 font-medium">Optimal threshold (&lt;200ms)</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-lg">
            <p className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-2">Model Confidence Avg</p>
            <p className="text-4xl font-mono font-bold text-white">94.2 <span className="text-lg text-slate-500">%</span></p>
            <p className="text-xs text-rose-400 mt-2 font-medium">-1.5% drift detected</p>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Latency Time-Series Chart */}
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-lg">
            <h3 className="text-lg font-semibold text-white mb-6">Inference Latency (Live)</h3>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={latencyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                  <XAxis dataKey="time" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f8fafc' }}
                    itemStyle={{ color: '#34d399' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="ms" 
                    stroke="#34d399" 
                    strokeWidth={3}
                    dot={{ fill: '#0f172a', stroke: '#34d399', strokeWidth: 2 }}
                    activeDot={{ r: 6, fill: '#34d399' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Inventory Aggregation Chart */}
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-lg">
            <h3 className="text-lg font-semibold text-white mb-6">Top Detected Classes</h3>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={inventoryData} layout="vertical" margin={{ top: 0, right: 0, left: 30, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={true} vertical={false} />
                  <XAxis type="number" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis type="category" dataKey="name" stroke="#f8fafc" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip 
                    cursor={{ fill: '#1e293b' }}
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f8fafc' }}
                  />
                  <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={24} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>
      </div>
    </main>
  );
}