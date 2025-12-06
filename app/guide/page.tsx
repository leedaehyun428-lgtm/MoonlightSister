// app/guide/page.tsx
'use client';

import Link from 'next/link';
import { majorArcana } from '@/lib/tarotData'; // 아까 만든 데이터 가져오기

export default function GuidePage() {
  return (
    <div className="min-h-screen bg-slate-900 text-white font-sans">
      {/* 헤더 */}
      <header className="sticky top-0 z-10 flex items-center p-4 bg-slate-900/90 backdrop-blur-md border-b border-white/10">
        <Link href="/" className="text-2xl mr-4">←</Link>
        <h1 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-200 to-pink-200">
          타로 백서 : 메이저 아르카나
        </h1>
      </header>

      {/* 카드 리스트 */}
      <main className="p-4 space-y-6 max-w-3xl mx-auto pb-20">
        <div className="text-center py-6 space-y-2">
          <p className="text-2xl">🔮</p>
          <p className="text-gray-300 text-sm">
            타로의 여정은 '0번 바보'에서 시작해<br/>'21번 세계'에서 완성됩니다.<br/>
            각 카드가 가진 깊은 의미를 알아보세요.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {majorArcana.map((card) => (
            <div key={card.id} className="bg-white/5 border border-white/10 rounded-2xl p-4 flex gap-4 hover:bg-white/10 transition">
              {/* 카드 이미지 */}
              <div className="w-24 flex-shrink-0">
                <img 
                  src={`/tarot/${card.nameEn}.jpg`} 
                  alt={card.name} 
                  className="w-full rounded-lg shadow-lg"
                  onError={(e) => e.currentTarget.src = '/tarot/back.jpg'}
                />
              </div>
              
              {/* 설명 텍스트 */}
              <div className="flex-1 space-y-2">
                <h2 className="font-bold text-purple-300 text-sm">{card.id}. {card.name}</h2>
                <div className="flex flex-wrap gap-1">
                  {card.keyword.map((k) => (
                    <span key={k} className="text-[10px] bg-purple-900/50 px-2 py-0.5 rounded-full text-purple-100">
                      #{k}
                    </span>
                  ))}
                </div>
                <p className="text-xs text-gray-400 leading-relaxed">
                  {card.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}