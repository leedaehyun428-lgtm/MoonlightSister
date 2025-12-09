// app/api/coupang/route.ts
import { NextResponse } from 'next/server';
import { getCoupangBestProduct } from '@/lib/coupang';

export async function POST(req: Request) {
  // ★ 중요: try 안에서 터져도 catch에서 쓸 수 있게 변수를 밖에서 선언
  let keyword = '';

  try {
    const body = await req.json();
    keyword = body.keyword;

    if (!keyword) {
      return NextResponse.json({ link: null });
    }

    // 1. API로 수익 링크 생성 시도
    // (lib/coupang.ts에 async가 붙어 있어야 경고가 안 뜸)
    let finalLink = await getCoupangBestProduct(keyword);

    // 2. 실패 시 검색 결과 페이지로 대체 (Fallback)
    if (!finalLink) {
      finalLink = `https://www.coupang.com/np/search?component=&q=${encodeURIComponent(keyword)}&channel=user`;
    }

    return NextResponse.json({ link: finalLink });

  } catch (error) {
    console.error("Coupang API Error:", error);
    
    // ★ 수정됨: 이제 keyword가 try 밖에서 선언되었으므로 여기서도 안전하게 사용 가능
    return NextResponse.json({ 
      link: `https://www.coupang.com/np/search?component=&q=${encodeURIComponent(keyword || '')}&channel=user` 
    });
  }
}