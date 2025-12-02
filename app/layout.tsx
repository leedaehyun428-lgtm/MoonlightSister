import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
// 1. [추가] Analytics 불러오기
import { Analytics } from "@vercel/analytics/react";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// 2. [수정] 사이트 이름과 설명 바꾸기
export const metadata: Metadata = {
  title: "달빛 언니의 교환일기",
  description: "오늘의 감정을 털어놓고 위로받으세요.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // 3. [수정] 한국어 사이트니까 ko로 변경
    <html lang="ko">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        {/* 4. [추가] 방문자 측정기 설치 */}
        <Analytics />
      </body>
    </html>
  );
}