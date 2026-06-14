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
  title: "진짜 AI - Adaptive Korean Tutor Powered by Gwan-Sik",
  description: "Master Korean with Gwan-Sik, your personalized local AI tutor. Practice writing with floating Hangeul soft keyboards and track your CEFR curriculum pathway.",
};

import SidebarLayout from "@/components/SidebarLayout";
import BackgroundDriftParticles from "@/components/BackgroundDriftParticles";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col relative">
        <BackgroundDriftParticles />
        <SidebarLayout>{children}</SidebarLayout>
      </body>
    </html>
  );
}
