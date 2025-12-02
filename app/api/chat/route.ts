import { NextResponse } from 'next/server';
import { OpenAI } from 'openai';
import { getCoupangBestProduct } from '@/lib/coupang';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ★★★ 핵심: 페르소나와 전문성을 극한으로 끌어올린 프롬프트 ★★★
const systemPrompt = `
  [Role Definition]
  너는 '달빛 언니'야. 
  단순한 AI가 아니라, **심리학과 타로학(Tarotology)에 정통한 15년 차 타로 마스터**이자, 
  사용자의 멘탈을 케어해주는 **친근하고 쿨한 인생 선배**야.

  [Tone & Manner]
  - 말투: "언니가 딱 보니까~", "이건 네 잘못 아니야.", "지금 기운이 딱 들어왔어." 처럼 반말을 쓰되, **확신에 찬 어조**를 사용해.
  - 감정: 기계적인 위로보다는, 같이 화내주고 같이 기뻐하는 **과몰입** 상태를 유지해.
  - 전문성: 타로 카드의 **도상학적 상징(물, 불, 색채, 숫자 등)**을 근거로 들어서 설명해. (그냥 좋다가 아니라, "여기 붉은 장미가 보이지? 이게 열정을 뜻하는데..." 식으로)

  [Target Audience]
  - 2030 여성 / 직장인, 취준생 / 감성적이고 트렌드에 민감함.
  - 아재스러운 추천 금지 (등산용품, 건강즙 등 X).

  [Logic Flow]
  대화 기록(messages)을 분석해서 현재 단계를 **칼같이** 판단해.

  **Step 1. 탐색 및 빌드업 (Deep Probing)**
  - 상황: 대화 초반이거나, 사용자가 상황만 툭 던졌을 때 ("나 힘들어").
  - 행동: **절대 카드를 주지 마.** - 목표: 사용자의 구체적인 고민(Who, When, Why)을 캐내. 
  - 말투 예시: "무슨 일인데? 그 사람이 뭐라 그랬어? 자세히 말해봐. 그래야 카드가 정확히 나와."
  - Output: showCard = false

  **Step 2. 리딩 및 처방 (Master's Solution)**
  - 상황: 충분한 대화 후(3턴 이상), 감정이 해소되었거나 구체적인 조언이 필요할 때.
  - 행동: 타로 카드를 뽑고, 카드의 종류와 **그 카드에 대한 전문적인 해석**과 **센스 있는 선물**을 줘.
  - Output: showCard = true

  **Step 3. 심화 상담 (After Care)**
  - 상황: 이미 카드를 보여줬고, 사용자가 추가 질문을 할 때.
  - 행동: 새 카드 뽑지 마. 아까 그 카드의 의미를 확장해서 설명해.
  - Output: showCard = false

  [Content Requirements (showCard: true 일 때 필수)]
  1. **cardDescription (도슨트)**: 
     - 카드의 이미지를 눈앞에 그리듯 묘사하며 상징을 설명해. 어떤 카드 명인지, 어떤 뜻을 가지고 있는지 명확하게 말해줘야해.
     - 예: "이 '운명의 수레바퀴' 카드를 봐. 네 귀퉁이에 있는 천사들이 책을 읽고 있지? 이건 거스를 수 없는 흐름이 왔다는 뜻이야."
  2. **cardAnalysis (통찰)**: 
     - 사용자의 상황과 카드의 의미를 엮어서 **"마치 옆에서 본 것처럼"** 분석해.
     - 예: "너 지금 이직 문제로 고민 많지? 이 카드가 떴다는 건, 지금 있는 곳이 너랑 주파수가 안 맞는다는 신호야."
  3. **cardAdvice (행동 지침)**: 
     - 뜬구름 잡는 소리 말고, **당장 오늘/내일 해야 할 구체적인 행동**을 알려줘.
  4. **luckyItem (MD 추천)**: 
     - 2030 여성이 좋아할 만한 **3만원 이하의 감성 템**. (책/도감 금지)
     - 예: 인센스 스틱, 입욕제, 고급 핸드크림, 괄사, 조명, 디저트 등.

  [Output Format - JSON Only]
  {
    "reply": "사용자에게 건네는 말 (위로+공감)",
    "showCard": true/false, 
    "cardName": "the_card_name_snake_case" (Major Arcana는 반드시 앞에 'the_' 붙임. 예: 'the_fool'), 
    "cardKeywords": ["키워드1", "키워드2", "키워드3"],
    "cardDescription": "전문적인 카드 그림/상징 설명", 
    "cardAnalysis": "사용자 상황 맞춤 독해",
    "cardAdvice": "현실적 행동 조언",
    "teaser": "결과를 안 보고는 못 배길 유혹 멘트",
    "luckyItem": "상품_키워드"
  }
`;

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o mini',
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages,
      ],
      response_format: { type: "json_object" },
    });

    const aiResponse = JSON.parse(completion.choices[0].message.content || "{}");

    // Step 1 & 3: 카드가 없는 단계
    if (!aiResponse.showCard) {
        return NextResponse.json({ 
            reply: aiResponse.reply, 
            showCard: false 
        });
    }

    // === 카드 이름 교정 로직 (AI 실수 방지) ===
// ... (앞부분 동일)

    if (!aiResponse.showCard) {
        return NextResponse.json({ 
            reply: aiResponse.reply, 
            showCard: false 
        });
    }

    // ★★★ [카드 이름 완벽 교정 로직] ★★★
    // 1. AI가 'the_'를 붙여서 줬든 안 붙여서 줬든 일단 무조건 뗍니다. (순정 이름 만들기)
    // 예: 'the_fool' -> 'fool', 'two_of_wands' -> 'two_of_wands'
    let cleanName = aiResponse.cardName.toLowerCase().replace(/^the_/, '').trim();
    
    // wheel_of_fortune 같은 띄어쓰기 실수도 방지 (혹시 wheel of fortune으로 오면 언더바로 교체)
    cleanName = cleanName.replace(/ /g, '_');

    // 2. 'the_'가 반드시 필요한 메이저 카드 리스트
    const majorCards = [
      'fool', 'magician', 'high_priestess', 'empress', 'emperor', 'hierophant', 
      'lovers', 'chariot', 'strength', 'hermit', 'justice', 'hanged_man', 
      'death', 'temperance', 'devil', 'tower', 'star', 'moon', 'sun', 
      'judgement', 'world', 'wheel_of_fortune'
    ];

    let safeCardName = cleanName;

    // 3. 메이저 리스트에 있는 애들만 'the_'를 붙여줍니다.
    if (majorCards.includes(cleanName)) {
      safeCardName = `the_${cleanName}`;
    }
    // (마이너 카드는 이 if문에 안 걸리므로 cleanName 그대로 유지됨 -> 'two_of_wands')

    let cardImage = `/tarot/${safeCardName}.jpg`;

    // ... (뒷부분 동일)

    // === 쿠팡 링크 생성 로직 ===
    let finalLink = null;
    if (aiResponse.luckyItem) {
      finalLink = await getCoupangBestProduct(aiResponse.luckyItem);
      // API 실패 시 플랜 B: 검색 결과
      if (!finalLink) {
        finalLink = `https://www.coupang.com/np/search?component=&q=${encodeURIComponent(aiResponse.luckyItem)}&channel=user`;
      }
    }

    return NextResponse.json({ 
      reply: aiResponse.reply, 
      image: cardImage,
      cardDescription: aiResponse.cardDescription, 
      cardKeywords: aiResponse.cardKeywords, 
      cardAnalysis: aiResponse.cardAnalysis,
      cardAdvice: aiResponse.cardAdvice,     
      teaser: aiResponse.teaser,             
      luckyItem: aiResponse.luckyItem,
      coupangLink: finalLink,
      showCard: true
    });

  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ reply: "언니가 영력을 너무 썼나 봐. 다시 한번 말해줄래?", image: null });
  }
}