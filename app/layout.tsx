import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "EMA OS",
  description: "Personal project manager",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased bg-gray-950 text-gray-100`}
    >
      <body className="min-h-full flex">
        <aside className="w-64 bg-gray-900 border-r border-gray-800 p-4 hidden md:block">
          <h1 className="text-xl font-bold mb-6">EMA OS</h1>
          <nav className="space-y-2">
            <a href="/dashboard" className="block px-4 py-2 rounded hover:bg-gray-800 transition-colors">Dashboard</a>
            <a href="/my-day" className="block px-4 py-2 rounded hover:bg-gray-800 transition-colors">My Day</a>
            <a href="/projects" className="block px-4 py-2 rounded hover:bg-gray-800 transition-colors">Projects</a>
            <a href="/tasks" className="block px-4 py-2 rounded hover:bg-gray-800 transition-colors">Tasks</a>
            <a href="/notes" className="block px-4 py-2 rounded hover:bg-gray-800 transition-colors">Notes</a>
            <a href="/files" className="block px-4 py-2 rounded hover:bg-gray-800 transition-colors">Files</a>
            <a href="/settings" className="block px-4 py-2 rounded hover:bg-gray-800 transition-colors">Settings</a>
          </nav>
        </aside>
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </body>
    </html>
  );
}