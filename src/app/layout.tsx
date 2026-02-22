import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import Providers from "@/components/providers";
import { Toaster } from "@/components/ui/sonner";
import SiteHeader from "@/components/site-header";
import SiteFooter from "@/components/site-footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Sharath Chandra Reddy Dumpali — Portfolio",
  description: "Full-Stack Software Engineer | Next.js, PostgreSQL, Cloud",
  openGraph: {
    title: "Sharath Chandra Reddy Dumpali — Portfolio",
    description: "DB-driven portfolio CMS built with Next.js + PostgreSQL.",
    url: "http://localhost:3000",
    siteName: "Sharath Portfolio",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <Providers>
          <SiteHeader />
          <div className="min-h-[calc(100vh-56px)]">{children}</div>
          <SiteFooter />
        </Providers>

        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}