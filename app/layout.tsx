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
  title: "Inventory Portal",
  description: "Mobile-first inventory portal",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {/* Global page shell (SAFE UI ONLY) */}
        <div className="min-h-screen bg-neutral-50 text-neutral-900">
          <div className="mx-auto w-full max-w-6xl px-3 sm:px-4 md:px-6">
            <div className="py-3 sm:py-4 md:py-6">{children}</div>
          </div>
        </div>
      </body>
    </html>
  );
}
