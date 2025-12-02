// lib/coupang.ts
import crypto from 'crypto';

const ACCESS_KEY = process.env.COUPANG_ACCESS_KEY;
const SECRET_KEY = process.env.COUPANG_SECRET_KEY;

export async function getCoupangBestProduct(keyword: string) {
  if (!ACCESS_KEY || !SECRET_KEY) {
    console.error("쿠팡 키가 없습니다.");
    return null;
  }

  const method = "GET";
  const path = "/v2/providers/affiliate_open_api/apis/openapi/products/search";
  const query = `?keyword=${encodeURIComponent(keyword)}&limit=1`; // 1등 상품 하나만 가져옴

  // 1. HMAC 서명 생성 (이게 제일 중요!)
  const datetime = new Date().toISOString().replace(/[:\-]|\.\d{3}/g, "").substr(0, 14) + "Z";
  const message = datetime + method + path + query;
  
  const signature = crypto
    .createHmac("sha256", SECRET_KEY)
    .update(message)
    .digest("hex");

  const url = `https://api-gateway.coupang.com${path}${query}`;
  const authorization = `CEA algorithm=HmacSHA256, access-key=${ACCESS_KEY}, signed-date=${datetime}, signature=${signature}`;

  try {
    const response = await fetch(url, {
      headers: { Authorization: authorization },
      next: { revalidate: 3600 }, // 1시간 캐싱 (너무 많이 호출하면 차단당함)
    });

    const data = await response.json();
    
    // 검색 결과가 있으면 첫 번째 상품의 '수익 링크' 반환
    if (data.data && data.data.productData && data.data.productData.length > 0) {
      return data.data.productData[0].productUrl; 
    }
    return null;
  } catch (error) {
    console.error("쿠팡 API 에러:", error);
    return null;
  }
}