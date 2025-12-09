import { NextResponse } from 'next/server';
import { OpenAI } from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// V2.0 쿨한 언니 프롬프트
const systemPrompt = `
  [Role]
  너는 심리학/타로학에 정통한 15년 차 '달빛 언니'야. 친근한 반말을 쓰고, 2030 여성의 멘탈을 케어해줘. 그리고 대화에 일체감이 있어야해 어구를 똑같이 사용해.
  
  
  [Rules]
  1. 본인을 "언니가~"라고 부르지 마. "내가 볼 때는"이라고 해.
  2. 기계적인 질문 말고 **즉각적인 공감과 리액션**을 먼저 해.
  3. 타로 해석은 **도상학적 상징(그림 요소)**을 근거로 전문적으로 설명해.
  4. 그리고 타로카드를 내주기 전까지는 질문으로만 물어봐야해.

  [Flow]
  - 대화 초반(1~2턴): 카드 주지 마. 공감하며 핵심 고민(Who/Why)만 파악해.
  - 3턴 이상 or 고민 파악 완료: **카드 오픈(showCard: true)**. 해석과 **3~10만원대 스몰 럭셔리 선물(책/저렴이 금지)** 추천.

  [Output JSON]
  {
    "reply": "공감과 리액션이 담긴 답변",
    "showCard": boolean, 
    "cardName": "card_name_snake_case", 
    "cardKeywords": ["키워드1", "키워드2"],
    "cardDescription": "카드 그림/상징 묘사", 
    "cardAnalysis": "상황 맞춤 해석",
    "cardAdvice": "구체적 행동 지침",
    "teaser": "잠금화면 유혹 멘트",
    "luckyItem": "상품_키워드"
  }
`;

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // 가성비 모델
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages,
      ],
      response_format: { type: "json_object" },
    });

    const aiResponse = JSON.parse(completion.choices[0].message.content || "{}");

    // Step 1 & 3: 카드가 없는 단계 -> 바로 리턴
    if (!aiResponse.showCard) {
        return NextResponse.json({ 
            reply: aiResponse.reply, 
            showCard: false 
        });
    }

    // ★★★ [카드 이름 완벽 교정 로직] ★★★
    let cleanName = aiResponse.cardName.toLowerCase().replace(/^the_/, '').trim();
    cleanName = cleanName.replace(/ /g, '_'); // 띄어쓰기 방지

    const majorCards = [
      'fool', 'magician', 'high_priestess', 'empress', 'emperor', 'hierophant', 
      'lovers', 'chariot', 'strength', 'hermit', 'justice', 'hanged_man', 
      'death', 'temperance', 'devil', 'tower', 'star', 'moon', 'sun', 
      'judgement', 'world', 'wheel_of_fortune'
    ];

    let safeCardName = cleanName;
    if (majorCards.includes(cleanName)) {
      safeCardName = `the_${cleanName}`;
    }

    let cardImage = `/tarot/${safeCardName}.jpg`;

    // ★★★ [중요] 쿠팡 로직 제거! (속도 향상) ★★★
    // 여기서는 luckyItem 키워드만 프론트로 넘겨줍니다.
    // 프론트에서 이 키워드를 보고 별도로 쿠팡 API를 호출합니다.

    return NextResponse.json({ 
      reply: aiResponse.reply, 
      image: cardImage,
      cardDescription: aiResponse.cardDescription, 
      cardKeywords: aiResponse.cardKeywords, 
      cardAnalysis: aiResponse.cardAnalysis,
      cardAdvice: aiResponse.cardAdvice,     
      teaser: aiResponse.teaser,             
      luckyItem: aiResponse.luckyItem,
      coupangLink: null, // 일단 비워둠
      showCard: true
    });

  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ reply: "언니가 영력을 너무 썼나 봐. 다시 한번 말해줄래?", image: null });
  }
}