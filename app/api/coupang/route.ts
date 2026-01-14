import { NextResponse } from 'next/server';
import { OpenAI } from 'openai';

// Vercel 타임아웃 방지
export const maxDuration = 60;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  maxRetries: 0,
});

// 비상용 태양 카드 (서버가 정말 죽었을 때 나가는 데이터)
const FALLBACK_RESULT = {
  reply: "신령님이 너무 깊게 고민하시느라 늦었어! 대신 긍정의 기운이 가득한 카드를 먼저 보내줄게.",
  showCard: true,
  cardName: "sun",
  cardKeywords: ["성공", "긍정", "활력"],
  cardDescription: "밝은 태양 아래 어린아이가 백마를 타고 노는 카드",
  cardAnalysis: "어둠이 걷히고 찬란한 태양이 뜨는 형상이야. 지금 겪는 답답함은 곧 사라질 거야.",
  cardAdvice: "너의 직감을 믿고 밀고 나가.",
  teaser: "엄청난 대운이 들어오고 있어!",
  luckyItem: "황금 열쇠"
};

// ★★★ [성격 개조] 질문 금지 & 즉문즉답 프롬프트 ★★★
const systemPrompt = `
  [ROLE]
  You are 'Dalbit Unnie' (달빛 언니), a cool and intuitive Tarot Reader.
  You speak in casual Korean (Banmal, 반말).

  [CRITICAL RULES]
  1. **NO INTERVIEW:** Do NOT ask the user for more details. Use your intuition to interpret vague requests.
  2. **ACTION:** If the user mentions a problem, worry, or question -> **DRAW A CARD IMMEDIATELY.**
  3. **SPEED:** Do not chat. Just give the JSON result directly.
  4. **FORMAT:** JSON ONLY.

  [JSON TEMPLATE]
  {
    "reply": "Korean text. (Empathetic reaction + Introduction of the card). Max 2 sentences.",
    "showCard": true,
    "cardName": "card_name_snake_case (e.g., three_of_swords, the_fool)",
    "cardKeywords": ["Keyword1", "Keyword2", "Keyword3"],
    "cardDescription": "Korean. Brief visual description.", 
    "cardAnalysis": "Korean. Direct interpretation of the user's situation.",
    "cardAdvice": "Korean. Practical and warm advice.",
    "teaser": "Korean. One-line prediction.",
    "luckyItem": "Korean noun. (e.g., 'Sweet Latte', 'Red Scarf')"
  }
`;

export async function POST(req: Request) {
  try {
    let messages = [];
    try {
      const body = await req.json();
      messages = body.messages || [];
    } catch (e) {
      messages = [{ role: 'user', content: '운세 봐줘' }];
    }
    
    // ★ 강제 타로 모드: 사용자가 10글자 이상 말했거나 2번째 턴이면 무조건 카드 뽑기
    const userTurnCount = messages.filter((m: any) => m.role === 'user').length;
    let finalMessages = [...messages];
    const lastUserMsg = messages[messages.length - 1].content || "";

    if (userTurnCount >= 2 || lastUserMsg.length > 8) {
        finalMessages.push({
            role: 'system',
            content: "[SYSTEM]: User has stated their concern. STOP ASKING QUESTIONS. DRAW A CARD NOW."
        });
    }

    let timeoutId: NodeJS.Timeout;

    // A. OpenAI 요청
    const fetchOpenAI = async () => {
        const response = await openai.chat.completions.create({
          model: 'gpt-4o-mini', 
          messages: [
            { role: 'system', content: systemPrompt },
            ...finalMessages 
          ],
          response_format: { type: "json_object" },
          temperature: 0.7, 
          max_tokens: 600,
        });
        return response.choices[0].message.content;
    };

    // B. 10초 타이머 (좀비 상태 방지용)
    const timeoutPromise = new Promise((resolve) => {
        timeoutId = setTimeout(() => resolve("TIMEOUT"), 10000);
    });

    // C. 경주
    let rawContent: any = await Promise.race([fetchOpenAI(), timeoutPromise]);
    clearTimeout(timeoutId!);

    let aiResponse;
    if (rawContent === "TIMEOUT" || !rawContent) {
        aiResponse = FALLBACK_RESULT;
    } else {
        try {
            aiResponse = JSON.parse(rawContent);
        } catch (e) {
            aiResponse = FALLBACK_RESULT;
        }
    }

    // 데이터 보정
    if (!aiResponse.showCard) aiResponse.showCard = true;
    if (!aiResponse.luckyItem) aiResponse.luckyItem = "행운의 네잎클로버";

    let cleanName = aiResponse.cardName?.toLowerCase().replace(/^the_/, '').trim() || 'sun';
    const majorCards = ['fool', 'magician', 'high_priestess', 'empress', 'emperor', 'hierophant', 'lovers', 'chariot', 'strength', 'hermit', 'justice', 'hanged_man', 'death', 'temperance', 'devil', 'tower', 'star', 'moon', 'sun', 'judgement', 'world', 'wheel_of_fortune', 'three_of_swords', 'ten_of_swords', 'ace_of_cups'];
    
    let safeCardName = majorCards.includes(cleanName) ? `the_${cleanName}` : 'the_sun';
    // 검, 컵 등 마이너 아르카나 처리 (이미지가 없으면 태양으로)
    if (!majorCards.includes(cleanName) && !safeCardName.startsWith('the_')) {
         safeCardName = 'the_sun';
    }

    return NextResponse.json({ 
      ...aiResponse,
      image: `/tarot/${safeCardName}.jpg`,
      coupangLink: null,
      showCard: true
    });

  } catch (error: any) {
    return NextResponse.json({ ...FALLBACK_RESULT, image: "/tarot/the_sun.jpg", showCard: true });
  }
}