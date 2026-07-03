"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export const Navigation = () => {
  const pathname = usePathname();

  const navLinks = [
    { name: "Live Terminal", path: "/scanner", icon: "🔴" },
    { name: "Photo Upload", path: "/upload", icon: "📸" },
    { name: "Admin Dashboard", path: "/dashboard", icon: "📊" },
  ];

  return (
    <nav className="bg-slate-900 border-r border-slate-800 w-64 min-h-screen p-4 flex flex-col gap-2 hidden md:flex">
      <div className="mb-8 px-4">
        <Link href="/" className="block group">
          <h2 className="text-xl font-bold text-white tracking-tight group-hover:text-emerald-400 transition-colors">System Core</h2>
          <p className="text-xs text-slate-500 uppercase tracking-widest mt-1">Phase 3 UI</p>
        </Link>
      </div>
      
      {navLinks.map((link) => {
        const isActive = pathname === link.path;
        return (
          <Link 
            key={link.path} 
            href={link.path}
            className={`px-4 py-3 rounded-xl flex items-center gap-3 transition-all duration-200 ${
              isActive 
                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
            }`}
          >
            <span className="text-xl">{link.icon}</span>
            <span className="font-semibold text-sm">{link.name}</span>
          </Link>
        );
      })}
    </nav>
  );
};