'use client';
import { useState, useRef, useEffect } from 'react';

// Typescript 에러 해결 (kakao)
declare global {
  interface Window {
    Kakao: any;
  }
}

// ... (Message 타입 정의는 그대로 두세요) ...
type Message = {
  role: 'user' | 'assistant';
  content: string;
  image?: string;
  timestamp: number;
  luckyItem?: string;
  coupangLink?: string;
  isLocked?: boolean;
  teaser?: string;
  cardKeywords?: string[];
  cardAnalysis?: string;
  cardAdvice?: string;
};

export default function Home() {
  // ... (useState, useEffect 등 로직은 그대로 유지) ...
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsClient(true);
    const saved = localStorage.getItem('moonlight_diary_chat');
    if (saved) setMessages(JSON.parse(saved));
  }, []);

  useEffect(() => {
    if (isClient && messages.length > 0) {
      localStorage.setItem('moonlight_diary_chat', JSON.stringify(messages));
    }
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isClient]);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.Kakao && !window.Kakao.isInitialized()) {
      window.Kakao.init(process.env.NEXT_PUBLIC_KAKAO_API_KEY); 
    }
  }, []);

  // ... (unlockMessage, handleShare, handleKakaoShare 함수들 그대로 유지) ...
  const unlockMessage = (index: number, link: string) => {
    window.open(link, '_blank');
    const updatedMessages = [...messages];
    updatedMessages[index].isLocked = false;
    setMessages(updatedMessages);
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: '달빛 언니의 교환일기',
          text: '나 타로 봤는데 소름 돋아... 너도 고민 있으면 털어놔 봐.',
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        alert('주소가 복사되었어! 친구한테 붙여넣기 해봐.');
      }
    } catch (err) {
      console.log('공유 취소됨');
    }
  };

  const handleKakaoShare = () => {
    if (!window.Kakao) return alert('로딩 중...');
    if (!window.Kakao.isInitialized()) window.Kakao.init(process.env.NEXT_PUBLIC_KAKAO_API_KEY);

    const lastAiMessage = messages.slice().reverse().find(m => m.role === 'assistant');
    if (lastAiMessage?.isLocked) return alert("🔒 결과를 확인해야 공유할 수 있어!");

    const currentUrl = window.location.origin; 
    const shareImage = lastAiMessage?.image ? `${currentUrl}${lastAiMessage.image}` : `${currentUrl}/kakao-square.jpg`;
    
    window.Kakao.Share.sendDefault({
      objectType: 'feed',
      content: {
        title: '🌙 달빛 언니의 답장',
        description: lastAiMessage?.cardAdvice || "오늘의 운세를 확인해보세요.",
        imageUrl: shareImage,
        link: { mobileWebUrl: window.location.href, webUrl: window.location.href },
      },
      buttons: [{ title: '결과 보러가기', link: { mobileWebUrl: window.location.href, webUrl: window.location.href } }],
    });
  };

  const clearChat = () => {
    if (confirm('대화를 삭제할까?')) {
      setMessages([]);
      localStorage.removeItem('moonlight_diary_chat');
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    setLoading(true);
    const userMessage: Message = { role: 'user', content: input, timestamp: Date.now() };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages); 
    const tempInput = input;
    setInput('');

    try {
      const apiMessages = newMessages.map(({ role, content }) => ({ role, content }));
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: apiMessages }),
      });

      const data = await response.json();
      const aiMessage: Message = { 
        role: 'assistant', 
        content: data.reply,
        image: data.image,
        timestamp: Date.now(),
        luckyItem: data.luckyItem,
        coupangLink: data.coupangLink,
        teaser: data.teaser,
        cardKeywords: data.cardKeywords,
        cardAnalysis: data.cardAnalysis,
        cardAdvice: data.cardAdvice,
        isLocked: !!data.luckyItem 
      };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error("Error:", error);
      alert("오류가 났어 ㅠㅠ");
    } finally {
      setLoading(false);
    }
  };

  if (!isClient) return null;

  return (
    <div className="flex flex-col h-screen bg-gradient-to-b from-slate-900 via-purple-900 to-slate-900 text-white font-sans">
      <header className="fixed top-0 w-full z-10 flex justify-between items-center p-4 bg-white/5 backdrop-blur-md border-b border-white/10 shadow-lg">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🌙</span>
          <h1 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-200 to-pink-200">
            달빛 언니
          </h1>
        </div>
        <div className="flex gap-2">
           <button onClick={clearChat} className="text-xs text-gray-400 hover:text-white px-3 py-1 border border-white/20 rounded-full">
            비우기
          </button>
          
          {/* ★ 여기가 '대화하기(링크복사)' 버튼입니다! ★ */}
          <button 
            onClick={handleShare} 
            className="text-xs bg-indigo-500 hover:bg-indigo-600 text-white px-3 py-1 rounded-full shadow-lg flex items-center gap-1"
          >
            <span>🔗 링크</span>
          </button>

          <button 
            onClick={handleKakaoShare} 
            className="bg-[#FEE500] text-[#191919] text-xs font-bold px-3 py-1 rounded-full shadow-lg flex items-center gap-1 hover:bg-[#Fdd835]"
          >
            <span>💬 카톡</span>
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto pt-20 pb-24 px-4 space-y-6 scrollbar-hide">
        {/* ... (초기 화면 생략, 그대로 두세요) ... */}
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-4 animate-fade-in-up">
            <div className="w-24 h-24 bg-purple-500/20 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(168,85,247,0.4)]"><span className="text-4xl">🔮</span></div>
            <p className="text-sm text-gray-400">힘든 일은 여기에 다 버리고 가.<br/>언니가 행운만 쏙 골라줄게.</p>
          </div>
        )}

        {messages.map((msg, index) => (
          <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
            {msg.role === 'assistant' && (
              <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center mr-2 mt-1 shadow-lg shrink-0"><span>👩🏻</span></div>
            )}
            
            <div className={`relative max-w-[90%] rounded-2xl p-4 shadow-md backdrop-blur-sm overflow-hidden ${
              msg.role === 'user' ? 'bg-purple-600 text-white rounded-tr-none' : 'bg-white/10 text-gray-100 border border-white/5 rounded-tl-none'
            }`}>
              
              {/* 잠금 UI */}
              {msg.isLocked && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-purple-950/90 backdrop-blur-md p-4 text-center">
                  <div className="text-4xl mb-3 animate-pulse">🔒</div>
                  <p className="text-sm font-bold text-white mb-1">{msg.teaser || "결과가 도착했어!"}</p>
                  <p className="text-xs text-gray-400 mb-4 leading-relaxed">
                    <span className="text-purple-300 font-semibold">{msg.luckyItem}</span>(으)로 복채 내고<br/>전체 해석 확인하기
                  </p>
                  <button onClick={() => unlockMessage(index, msg.coupangLink || '')} className="w-full bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold py-3 rounded-xl shadow-lg transition active:scale-95 flex items-center justify-center gap-2"><span>🔐 잠금 해제 (Click)</span></button>
                  <p className="text-[9px] text-gray-500 mt-2">쿠팡 파트너스 활동의 일환으로 수수료를 제공받습니다.</p>
                </div>
              )}

              {/* 내용 */}
              <div className={msg.isLocked ? 'blur-sm opacity-50' : ''}>
                  <p className="whitespace-pre-wrap leading-relaxed text-sm text-gray-100">{msg.content}</p>
                  
                  {msg.image && (
                    <div className="mt-4 animate-flip-in">
                      {/* ★★★ 이미지 디버깅 코드 추가됨 ★★★ */}
                      <img 
                        src={msg.image} 
                        alt="타로 카드" 
                        className="relative rounded-lg w-full max-w-[200px] mx-auto border border-white/10 shadow-2xl"
                        onError={(e) => {
                          console.error("이미지 로딩 실패! 찾는 경로:", msg.image); // F12 콘솔에서 확인 가능
                          e.currentTarget.style.display = 'none'; // 엑박 숨기기
                          // e.currentTarget.src = '/tarot/back.jpg'; // 뒷면으로 대체하려면 주석 해제
                        }}
                      />
                      {/* 이미지가 깨지면 경로를 텍스트로 보여줘서 확인 (테스트용) */}
                      <p className="text-[10px] text-red-400 mt-1 hidden group-hover:block">경로: {msg.image}</p>
                    </div>
                  )}

                  {/* ... (나머지 해석/버튼 부분은 그대로) ... */}
                  {msg.cardKeywords && (
                    <div className="mt-4 bg-black/20 rounded-xl p-4 border border-white/10 text-sm space-y-3">
                      <div className="flex gap-2 justify-center flex-wrap">
                        {msg.cardKeywords.map((k, i) => (<span key={i} className="bg-purple-500/20 text-purple-200 text-xs px-2 py-1 rounded-full border border-purple-500/30">#{k}</span>))}
                      </div>
                      <div className="h-px bg-white/10 my-2"></div>
                      <div className="space-y-2 text-xs leading-relaxed">
                        <p className="text-gray-300"><strong className="text-purple-300 block mb-1">🧐 상황 분석</strong>{msg.cardAnalysis}</p>
                        <p className="text-gray-300"><strong className="text-yellow-300 block mb-1">💡 언니의 조언</strong>{msg.cardAdvice}</p>
                      </div>
                    </div>
                  )}

                  {!msg.isLocked && msg.luckyItem && msg.coupangLink && (
                    <div className="mt-3 bg-purple-500/10 rounded-xl p-3 border border-purple-500/20 text-center">
                      <p className="text-[11px] text-gray-300 mb-2">이 기운 놓치지 마! <span className="text-purple-300 font-bold">"{msg.luckyItem}"</span></p>
                      <a href={msg.coupangLink} target="_blank" rel="noreferrer" className="block w-full bg-purple-600 hover:bg-purple-500 text-white text-center text-xs py-2.5 rounded-lg transition shadow-md">🎁 최저가 다시 보러가기</a>
                    </div>
                  )}
              </div>
              <p className={`text-[10px] mt-2 text-right ${msg.role === 'user' ? 'text-purple-200' : 'text-gray-500'}`}>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
            </div>
          </div>
        ))}
        {loading && <div className="flex items-center gap-2 text-gray-400 text-sm ml-10 animate-pulse"><span>카드를 섞는 중...</span><span className="animate-spin">💫</span></div>}
        <div ref={messagesEndRef} />
      </main>

      {/* Footer (그대로) */}
      <footer className="fixed bottom-0 w-full bg-slate-900/80 backdrop-blur-lg border-t border-white/5 p-4 pb-6">
        <div className="max-w-3xl mx-auto flex items-center bg-gray-800/50 rounded-full px-2 border border-white/10 focus-within:border-purple-500/50 transition-colors">
          <input type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && sendMessage()} placeholder="마음껏 털어놔 봐..." disabled={loading} className="flex-1 bg-transparent p-3 text-white placeholder-gray-500 focus:outline-none text-sm" />
          <button onClick={sendMessage} disabled={loading} className={`bg-purple-600 hover:bg-purple-500 text-white rounded-full w-10 h-10 flex items-center justify-center transition shadow-lg ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}><span className="text-lg">➤</span></button>
        </div>
      </footer>
    </div>
  );
}