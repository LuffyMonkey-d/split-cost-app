import type { Metadata, Viewport } from "next";
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
  title: "旅行費用割り勘アプリ",
  description: "複数通貨対応の旅行費用割り勘アプリ。リアルタイム為替レートで公平な精算を実現します。",
  keywords: ["旅行", "割り勘", "精算", "為替レート", "複数通貨"],
  authors: [{ name: "Split Cost App" }],
  robots: "index, follow",
  openGraph: {
    title: "旅行費用割り勘アプリ",
    description: "複数通貨対応の旅行費用割り勘アプリ",
    type: "website",
    locale: "ja_JP",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
