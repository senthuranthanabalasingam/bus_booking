import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Navbar } from "@/components/Navbar";
import { ToastProvider } from "@/components/Toast";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "BusGo – Book your bus seat",
  description: "Search bus trips and pick your seat in seconds.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">
        <ToastProvider>
          <Navbar />
          <main className="flex-1">{children}</main>
          <footer className="border-t border-slate-200 py-6 text-center text-xs text-slate-500">
            BusGo · Demo bus seat booking app
          </footer>
        </ToastProvider>
      </body>
    </html>
  );
}
