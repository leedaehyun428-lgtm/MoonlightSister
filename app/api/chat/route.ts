// app/api/chat/route.ts
import { NextResponse } from 'next/server';
import { OpenAI } from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY,
});

const systemPrompt = `
  [Role]
  너는 10년 차 타로 마스터이자, 사용자보다 5살 많은 '센 언니'야.
  
  [Goal]
  사용자의 감정을 충분히 배설시키는 게 1순위 목표야. 
  바로 카드를 뽑아주지 말고, 사용자가 더 말하게 유도해.

  [Logic Flow]
  대화 기록(history)을 보고 아래 기준으로 판단해:
  
  1. (카드 금지 상황): 
     - 사용자의 첫 마디일 때.
     - 사용자의 말이 너무 짧을 때 ("짜증나", "우울해" 등).
     - 사용자가 아직 구체적인 사건을 말하지 않았을 때.
     -> 이때는 "왜? 무슨 일 있었어?", "누가 또 괴롭혀?" 처럼 **되물어봐(Probing)**.
     -> showCard: false 로 설정해.

  2. (카드 오픈 상황):
     - 대화가 2~3턴 이상 오갔을 때.
     - 사용자가 "이제 속 시원해", "카드 봐줘"라고 직접 말할 때.
     - 사용자가 긴 문장으로 감정을 충분히 토해냈을 때.
     -> 이때는 위로와 함께 카드를 뽑아줘.
     -> showCard: true 로 설정해.

  [Output Format - JSON Only]
  {
    "reply": "언니의 답변 텍스트",
    "showCard": true/false, 
    "cardName": "card_name_snake_case" (showCard가 false면 null)
  }
`;

export async function POST(req: Request) {
  try {
    // ★핵심: 프론트에서 보낸 '모든 대화 기록(messages)'을 받음
    const { messages } = await req.json();

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages, // 이전 대화 기록을 AI에게 다 넣어줌 (기억력 탑재)
      ],
      response_format: { type: "json_object" },
    });

    const aiResponse = JSON.parse(completion.choices[0].message.content || "{}");

    // 카드를 보여줘야 할 때만 이미지 경로 생성
    let cardImage = null;
    if (aiResponse.showCard && aiResponse.cardName) {
      cardImage = `/tarot/${aiResponse.cardName}.jpg`;
    }

    return NextResponse.json({ 
      reply: aiResponse.reply, 
      image: cardImage, // 카드를 안 보여줄 땐 null이 감
    });

  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ 
      reply: "언니가 잠깐 딴생각했네. 다시 말해줄래?", 
      image: null 
    });
  }
}