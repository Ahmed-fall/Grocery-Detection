import type { Metadata } from "next";
import "./globals.css";
import { Navigation } from "../components/Navigation";

export const metadata: Metadata = {
  title: "Automated Checkout UI",
  description: "Phase 3 Frontend for Market Recognition",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-slate-950 text-slate-200 flex min-h-screen">
        {/* Global Sidebar */}
        <Navigation />
        
        {/* Dynamic Page Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {children}
        </div>
      </body>
    </html>
  );
}
