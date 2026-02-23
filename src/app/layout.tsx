import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import Providers from "@/components/providers";
import { Toaster } from "@/components/ui/sonner";
import SiteHeader from "@/components/site-header";
import Footer from "@/components/footer"; // ✅ dynamic footer

import { prisma } from "@/lib/prisma";
import { getBaseUrl } from "@/lib/site-url";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const profile = await prisma.profile.findFirst();

  const baseUrl = getBaseUrl();

  const fullName = profile?.fullName?.trim() || "Portfolio";
  const headline =
    profile?.headline?.trim() || "Full-Stack Software Engineer";

  const description =
    profile?.summary?.trim() ||
    `${headline} | Next.js, PostgreSQL, Cloud`;

  return {
    title: `${fullName} — Portfolio`,
    description,

    openGraph: {
      title: `${fullName} — Portfolio`,
      description,
      url: baseUrl,
      siteName: `${fullName} Portfolio`,
      type: "website",
      images: profile?.profileImage ? [profile.profileImage] : [],
    },

    twitter: {
      card: "summary_large_image",
      title: `${fullName} — Portfolio`,
      description,
      images: profile?.profileImage ? [profile.profileImage] : [],
    },
  };
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>

          {/* Header */}
          <SiteHeader />

          {/* Page Content */}
          <main className="min-h-[calc(100vh-56px)]">
            {children}
          </main>

          {/* Dynamic DB-driven Footer */}
          <Footer />

        </Providers>

        {/* Toast notifications */}
        <Toaster richColors position="top-right" />

      </body>
    </html>
  );
}