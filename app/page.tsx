'use client';
import { useState, useRef, useEffect } from 'react';

// Typescript 에러 해결 (kakao)
declare global {
  interface Window {
    Kakao: any;
  }
}

// 채팅 메시지 타입 정의
type Message = {
  role: 'user' | 'assistant';
  content: string;
  image?: string;
  timestamp: number;
};

export default function Home() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 1. [기억하기] 로컬스토리지 불러오기
  useEffect(() => {
    setIsClient(true);
    const saved = localStorage.getItem('moonlight_diary_chat');
    if (saved) {
      setMessages(JSON.parse(saved));
    }
  }, []);

  // 2. [기억하기] 로컬스토리지 저장
  useEffect(() => {
    if (isClient && messages.length > 0) {
      localStorage.setItem('moonlight_diary_chat', JSON.stringify(messages));
    }
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isClient]);

  // 3. [초기화] 카카오 SDK 초기화
  useEffect(() => {
    if (window.Kakao && !window.Kakao.isInitialized()) {
      // .env.local에 저장한 키를 가져옵니다.
      window.Kakao.init(process.env.NEXT_PUBLIC_KAKAO_API_KEY); 
    }
  }, []);

  // 4. [기능] 일반 공유하기
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

  // 5. [기능] 카카오톡 공유하기
  const handleKakaoShare = () => {
    if (!window.Kakao || !window.Kakao.isInitialized()) {
      alert('카카오톡 연결 중이야.. 잠시만 기다려줘!');
      return;
    }

    const lastAiMessage = messages.slice().reverse().find(m => m.role === 'assistant');
    
    // 현재 접속된 주소 (localhost 혹은 배포된 주소)를 자동으로 가져옴
    const currentUrl = window.location.origin; 
    
    // 공유할 이미지
    const shareImage = lastAiMessage?.image 
      ? `${currentUrl}${lastAiMessage.image}` 
      : `${currentUrl}/og-image.jpg`; // public 폴더에 og-image.jpg 넣어두세요

    const shareDescription = lastAiMessage?.content.substring(0, 50) + "..." || "오늘의 운세를 확인해보세요.";

    window.Kakao.Share.sendDefault({
      objectType: 'feed',
      content: {
        title: '🌙 달빛 언니가 보내는 편지',
        description: shareDescription,
        imageUrl: shareImage,
        link: {
          mobileWebUrl: window.location.href,
          webUrl: window.location.href,
        },
      },
      buttons: [
        {
          title: '나도 상담받으러 가기',
          link: {
            mobileWebUrl: window.location.href,
            webUrl: window.location.href,
          },
        },
      ],
    });
  };

  const clearChat = () => {
    if (confirm('정말 대화 내용을 다 지울까?')) {
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
        timestamp: Date.now()
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
      {/* 헤더 */}
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
          <button 
            onClick={handleShare}
            className="text-xs bg-indigo-500 hover:bg-indigo-600 text-white px-3 py-1 rounded-full shadow-lg transition-transform active:scale-95 flex items-center gap-1"
          >
            <span>💌 대화하기</span>
          </button>
          <button 
            onClick={handleKakaoShare}
            className="bg-[#FEE500] text-[#191919] text-xs font-bold px-3 py-1 rounded-full shadow-lg flex items-center gap-1 hover:bg-[#Fdd835]"
          >
            <span>💬 카톡 공유</span>
          </button>
        </div>
      </header>

      {/* 메인 채팅 영역 */}
      <main className="flex-1 overflow-y-auto pt-20 pb-24 px-4 space-y-6 scrollbar-hide">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-4 animate-fade-in-up">
            <div className="w-24 h-24 bg-purple-500/20 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(168,85,247,0.4)]">
              <span className="text-4xl">🔮</span>
            </div>
            <div className="space-y-2">
              <p className="text-lg font-medium text-purple-200">오늘 하루, 어땠어?</p>
              <p className="text-sm text-gray-400 max-w-xs mx-auto">
                힘든 일은 여기에 다 버리고 가.<br/>
                언니가 행운만 쏙 골라줄게.
              </p>
            </div>
          </div>
        )}
        
        {messages.map((msg, index) => (
          <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
            {msg.role === 'assistant' && (
              <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center mr-2 mt-1 shadow-lg shrink-0">
                <span>👩🏻</span>
              </div>
            )}
            <div className={`max-w-[85%] rounded-2xl p-4 shadow-md backdrop-blur-sm ${
              msg.role === 'user' 
                ? 'bg-gradient-to-br from-purple-600 to-indigo-600 text-white rounded-tr-none' 
                : 'bg-white/10 text-gray-100 border border-white/5 rounded-tl-none' 
            }`}>
              <p className="whitespace-pre-wrap leading-relaxed text-sm">{msg.content}</p>
              
              {msg.image && (
                <div className="mt-4 animate-flip-in">
                  <div className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-pink-600 to-purple-600 rounded-lg blur opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200"></div>
                    <img 
                      src={msg.image} 
                      alt="타로 카드" 
                      className="relative rounded-lg w-full max-w-[200px] mx-auto border border-white/10 shadow-2xl"
                    />
                  </div>
                  <p className="text-center text-xs text-purple-300 mt-3 font-medium">✨ 언니의 처방전</p>
                </div>
              )}
              <p className={`text-[10px] mt-2 text-right ${msg.role === 'user' ? 'text-purple-200' : 'text-gray-500'}`}>
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex items-center gap-2 text-gray-400 text-sm ml-10 animate-pulse">
            <span>카드를 섞는 중...</span>
            <span className="animate-spin">💫</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </main>

      {/* 입력창 */}
      <footer className="fixed bottom-0 w-full bg-slate-900/80 backdrop-blur-lg border-t border-white/5 p-4 pb-6">
        <div className="max-w-3xl mx-auto flex items-center bg-gray-800/50 rounded-full px-2 border border-white/10 focus-within:border-purple-500/50 transition-colors">
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="마음껏 털어놔 봐..."
            disabled={loading}
            className="flex-1 bg-transparent p-3 text-white placeholder-gray-500 focus:outline-none text-sm"
          />
          <button 
            onClick={sendMessage} 
            disabled={loading}
            className={`bg-purple-600 hover:bg-purple-500 text-white rounded-full w-10 h-10 flex items-center justify-center transition shadow-lg ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <span className="text-lg">➤</span>
          </button>
        </div>
      </footer>
    </div>
  );
}