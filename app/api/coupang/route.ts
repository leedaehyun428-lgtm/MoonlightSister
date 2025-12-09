import { NextResponse } from 'next/server';
import { getCoupangBestProduct } from '@/lib/coupang';

export async function POST(req: Request) {
  try {
    const { keyword } = await req.json();

    if (!keyword) {
      return NextResponse.json({ link: null });
    }

    // 1. API로 수익 링크 생성 시도
    let finalLink = await getCoupangBestProduct(keyword);

    // 2. 실패 시 검색 결과 페이지로 대체 (Fallback)
    if (!finalLink) {
      finalLink = `https://www.coupang.com/np/search?component=&q=${encodeURIComponent(keyword)}&channel=user`;
    }

    return NextResponse.json({ link: finalLink });

  } catch (error) {
    console.error("Coupang API Error:", error);
    // 에러 나도 죽지 말고 검색 결과라도 던져줌
    return NextResponse.json({ 
      link: `https://www.coupang.com/np/search?component=&q=${encodeURIComponent(keyword || '')}&channel=user` 
    });
  }
}