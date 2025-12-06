import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Analytics } from "@vercel/analytics/react"; 
import Script from 'next/script'; // 카카오와 애드센스 모두 이 컴포넌트를 씁니다.

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
        
        {/* 방문자 측정기 (Vercel) */}
        <Analytics />
        
        {/* 카카오 SDK 로드 */}
        <Script
          src="https://t1.kakaocdn.net/kakao_js_sdk/2.7.1/kakao.min.js"
          // strategy="afterInteractive" -- 대화 이후에 광고
          strategy="beforeInteractive"  
        />

        {/* ★★★ [NEW] 구글 애드센스 연동 ★★★ */}
        {/* Next.js 최적화를 위해 Script 컴포넌트 사용 */}
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-2382338957289604"
          crossOrigin="anonymous"
        />
      </body>
    </html>
  );
}