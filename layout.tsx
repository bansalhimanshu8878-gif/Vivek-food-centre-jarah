import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "विवेक फूड सेंटर | Vivek Food Centre",
  description: "विवेक फूड सेंटर — पिज़्ज़ा, बर्गर, चाइनीज़ और साउथ इंडियन। तेज़ डिलीवरी के साथ ऑनलाइन ऑर्डर करें।",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="hi">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Devanagari:wght@400;600;700;800&family=Inter:wght@400;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body className="bg-[#FFF8F0] text-slate-900 antialiased">{children}</body>
    </html>
  );
}
