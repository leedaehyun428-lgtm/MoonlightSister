'use client';
import { useState, useRef, useEffect } from 'react';

// 채팅 메시지 타입 정의
type Message = {
  role: 'user' | 'assistant';
  content: string;
  image?: string;
  timestamp: number; // 시간 기록용 추가
};

export default function Home() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [isClient, setIsClient] = useState(false); // 클라이언트 렌더링 확인용
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 1. [기억하기] 컴포넌트 마운트 시 로컬스토리지에서 대화 불러오기
  useEffect(() => {
    setIsClient(true);
    const saved = localStorage.getItem('moonlight_diary_chat');
    if (saved) {
      setMessages(JSON.parse(saved));
    }
  }, []);

  // 2. [기억하기] 대화가 업데이트될 때마다 로컬스토리지에 저장
  useEffect(() => {
    if (isClient && messages.length > 0) {
      localStorage.setItem('moonlight_diary_chat', JSON.stringify(messages));
    }
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isClient]);

  // 3. [바이럴] 공유하기 기능 (모바일 네이티브 공유창 호출)
  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: '달빛 언니의 교환일기',
          text: '나 타로 봤는데 소름 돋아... 너도 고민 있으면 털어놔 봐.',
          url: window.location.href, // 배포하면 실제 주소로 연결됨
        });
      } else {
        // PC 등 공유 기능 미지원 시 링크 복사
        await navigator.clipboard.writeText(window.location.href);
        alert('주소가 복사되었어! 친구한테 붙여넣기 해봐.');
      }
    } catch (err) {
      console.log('공유 취소됨');
    }
  };

  // 4. [기능] 대화 초기화 (삭제) 버튼
  const clearChat = () => {
    if (confirm('정말 대화 내용을 다 지울까?')) {
      setMessages([]);
      localStorage.removeItem('moonlight_diary_chat');
    }
  };

// app/page.tsx 안의 sendMessage 함수 수정

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    setLoading(true);
    
    // 1. 사용자 메시지 생성
    const userMessage: Message = { role: 'user', content: input, timestamp: Date.now() };
    
    // 2. 화면에 즉시 표시 및 상태 업데이트
    // 주의: React 상태 업데이트는 비동기라, API에 보낼 땐 변수(newMessages)를 따로 만들어야 함
    const newMessages = [...messages, userMessage];
    setMessages(newMessages); 
    
    const tempInput = input;
    setInput('');

    try {
      // 3. ★핵심 변경★: message 하나가 아니라 'newMessages' 전체를 보냄
      // 단, image나 timestamp 같은 불필요한 정보는 빼고 role과 content만 추려서 보냄 (비용 절감)
      const apiMessages = newMessages.map(({ role, content }) => ({ role, content }));

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: apiMessages }), // messag'es' (복수형)
      });

      const data = await response.json();
      
      const aiMessage: Message = { 
        role: 'assistant', 
        content: data.reply,
        image: data.image, // 백엔드에서 null을 주면 이미지가 안 뜸
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

  // 화면 렌더링 전 깜빡임 방지
  if (!isClient) return null;

  return (
    // [UI] 전체 배경: 신비로운 그라데이션
    <div className="flex flex-col h-screen bg-gradient-to-b from-slate-900 via-purple-900 to-slate-900 text-white font-sans">
      
      {/* 헤더: 글래스모피즘(반투명 유리) 효과 적용 */}
      <header className="fixed top-0 w-full z-10 flex justify-between items-center p-4 bg-white/5 backdrop-blur-md border-b border-white/10 shadow-lg">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🌙</span>
          <h1 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-200 to-pink-200">
            달빛 언니
          </h1>
        </div>
        <div className="flex gap-2">
           {/* 초기화 버튼 */}
           <button onClick={clearChat} className="text-xs text-gray-400 hover:text-white px-3 py-1 border border-white/20 rounded-full">
            비우기
          </button>
          {/* 공유 버튼 */}
          <button 
            onClick={handleShare}
            className="text-xs bg-indigo-500 hover:bg-indigo-600 text-white px-3 py-1 rounded-full shadow-lg transition-transform active:scale-95 flex items-center gap-1"
          >
            <span>💌 자랑하기</span>
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
            {/* 프로필 아이콘 */}
            {msg.role === 'assistant' && (
              <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center mr-2 mt-1 shadow-lg shrink-0">
                <span>👩🏻</span>
              </div>
            )}
            
            {/* 말풍선 */}
            <div className={`max-w-[85%] rounded-2xl p-4 shadow-md backdrop-blur-sm ${
              msg.role === 'user' 
                ? 'bg-gradient-to-br from-purple-600 to-indigo-600 text-white rounded-tr-none' 
                : 'bg-white/10 text-gray-100 border border-white/5 rounded-tl-none' 
            }`}>
              <p className="whitespace-pre-wrap leading-relaxed text-sm">{msg.content}</p>
              
              {/* 타로 카드 이미지 (등장 효과 포함) */}
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
              {/* 시간 표시 */}
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

      {/* 입력창 (하단 고정) */}
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