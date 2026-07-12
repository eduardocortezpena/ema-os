import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { prisma } from "@/app/lib/db";
import { CommandPalette } from "@/app/components/CommandPalette";
import { KeyboardShortcuts } from "@/app/components/KeyboardShortcuts";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Organizador de archivos",
  description: "Personal project manager",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const projects = await prisma.proyecto.findMany({
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  });

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased bg-gray-950 text-gray-100`}
    >
      <body className="min-h-full flex">
        <aside className="w-64 bg-gray-900 border-r border-gray-800 p-4 hidden md:block">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-xl font-bold">Organizador de archivos</h1>
            <span className="text-gray-500 text-xs" title="Ctrl+K paleta · ? ayuda">Ctrl+K · ?</span>
          </div>
          <nav className="space-y-2">
            <a href="/dashboard" className="block px-4 py-2 rounded hover:bg-gray-800 transition-colors">Dashboard</a>
            <a href="/my-day" className="block px-4 py-2 rounded hover:bg-gray-800 transition-colors">My Day</a>
            <a href="/inbox" className="block px-4 py-2 rounded hover:bg-gray-800 transition-colors">Inbox</a>
            <a href="/projects" className="block px-4 py-2 rounded hover:bg-gray-800 transition-colors">Projects</a>
            <a href="/tasks" className="block px-4 py-2 rounded hover:bg-gray-800 transition-colors">Tasks</a>
            <a href="/files" className="block px-4 py-2 rounded hover:bg-gray-800 transition-colors">Files</a>
            <a href="/settings" className="block px-4 py-2 rounded hover:bg-gray-800 transition-colors">Settings</a>
          </nav>
        </aside>
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
        <CommandPalette projects={projects} />
        <KeyboardShortcuts />
      </body>
    </html>
  );
}