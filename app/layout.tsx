import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Analytics } from "@vercel/analytics/react"; 
import Script from 'next/script'; // 카카오 SDK 로드

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://moonlight-sister.vercel.app/'),
  title: '달빛 언니의 교환일기',
  description: '오늘 힘든 일 있었어? 언니한테만 털어놔 봐. 타로로 해결책을 줄게.',
  openGraph: {
    title: '🌙 달빛 언니의 교환일기',
    description: '오늘 밤, 너의 감정을 치유해 줄 신비한 타로 상담소',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: '달빛 언니 메인 이미지',
      },
    ],
    locale: 'ko_KR',
    type: 'website',
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {children}
        
        {/* 방문자 측정기 */}
        <Analytics />
        
        {/* integrity 제거 (로딩 오류 방지 수정) */}
        <Script
          src="https://t1.kakaocdn.net/kakao_js_sdk/2.7.1/kakao.min.js"
          strategy="afterInteractive" 
        />
      </body>
    </html>
  );
}