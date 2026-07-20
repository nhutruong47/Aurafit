import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getStylistSessionId,
  saveStylistSessionId,
  sendChatMessage,
} from '../../services/stylistService';
import StylistAvatar from './StylistAvatar';
import StylistMessageBubble from './StylistMessageBubble';
import StylistProductCards from './StylistProductCards';

const NETWORK_ERROR_MESSAGE = 'Không thể kết nối, vui lòng kiểm tra mạng và thử lại';

const createMessageId = () => {
  if (typeof window !== 'undefined' && window.crypto?.randomUUID) {
    return window.crypto.randomUUID();
  }

  return `message-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
};

export default function StylistChatWidget() {
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [sessionId, setSessionId] = useState(() => getStylistSessionId());
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [isOpen, isSending, messages]);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    const message = inputValue.trim();
    if (!message || isSending) {
      return;
    }

    setMessages((current) => [
      ...current,
      {
        id: createMessageId(),
        role: 'user',
        text: message,
        recommendedCostumes: [],
      },
    ]);
    setInputValue('');
    setIsSending(true);

    try {
      const response = await sendChatMessage(sessionId, message);
      const nextSessionId = response.sessionId || sessionId;

      setSessionId(nextSessionId);
      saveStylistSessionId(nextSessionId);
      setMessages((current) => [
        ...current,
        {
          id: createMessageId(),
          role: 'assistant',
          text: response.replyText,
          recommendedCostumes: response.recommendedCostumes,
          isError: response.hasError,
          errorType: response.errorType,
        },
      ]);
    } catch {
      setMessages((current) => [
        ...current,
        {
          id: createMessageId(),
          role: 'assistant',
          text: NETWORK_ERROR_MESSAGE,
          recommendedCostumes: [],
          isError: true,
          errorType: 'NETWORK_ERROR',
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  const handleCostumeSelect = (costume) => {
    if (costume?.id === undefined || costume?.id === null) {
      return;
    }

    setIsOpen(false);
    navigate(`/products/${encodeURIComponent(costume.id)}`, {
      state: { product: costume },
    });
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end sm:bottom-6 sm:right-6">
      {isOpen && (
        <section
          role="dialog"
          aria-label="Trợ lý thời trang AuraFit"
          className="mb-3 flex h-[min(62dvh,29rem)] w-[calc(100vw-2rem)] max-w-[22rem] flex-col overflow-hidden rounded-2xl border border-[#cfc4c5] bg-[#f9f9f9] shadow-[0_22px_60px_rgba(25,22,17,0.22)] sm:mb-4 sm:h-[30rem]"
        >
          <header className="flex items-center justify-between bg-gradient-to-r from-[#171613] to-[#2b2519] px-4 py-3 text-white">
            <div className="flex items-center gap-3">
              <StylistAvatar className="h-9 w-9 border-2 border-[#99854e] bg-white" />
              <div>
                <h2 className="font-serif text-base italic">AuraFit Stylist</h2>
                <p className="text-[10px] uppercase tracking-[0.14em] text-white/60">
                  Tư vấn trang phục
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="flex h-9 w-9 items-center justify-center text-white/70 transition hover:text-white"
              aria-label="Đóng trợ lý thời trang"
            >
              <span className="material-symbols-outlined text-[21px]">close</span>
            </button>
          </header>

          <div
            className="flex-1 space-y-4 overflow-y-auto px-3 py-4 sm:px-4"
            aria-live="polite"
          >
            {messages.length === 0 && (
              <div className="rounded-xl border border-[#e4ddd2] bg-[#fffdf8] p-4 text-sm leading-6 text-[#5f5e5e] shadow-sm">
                Xin chào! Hãy cho mình biết dịp sử dụng, phong cách, màu sắc hoặc ngân sách để được gợi ý trang phục phù hợp nhé.
              </div>
            )}

            {messages.map((message) => {
              const isUser = message.role === 'user';

              return (
                <div
                  key={message.id}
                  className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} animate-[fadeIn_220ms_ease-out]`}
                >
                  <StylistMessageBubble message={message} compact />

                  {!isUser && (
                    <div className="w-[calc(100%_-_2.375rem)] self-end">
                      <StylistProductCards
                        costumes={message.recommendedCostumes}
                        onSelect={handleCostumeSelect}
                      />
                    </div>
                  )}
                </div>
              );
            })}

            {isSending && (
              <div className="flex items-center gap-1 border border-[#e4ddd2] bg-white px-4 py-3 text-[#99854e]">
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current [animation-delay:-0.3s]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current [animation-delay:-0.15s]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current" />
                <span className="ml-2 text-xs text-[#777777]">Stylist đang tư vấn...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSubmit} className="flex gap-2 border-t border-[#ddd5ca] bg-white p-3">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(event) => setInputValue(event.target.value)}
              placeholder="Bạn đang tìm trang phục gì?"
              disabled={isSending}
              className="min-w-0 flex-1 rounded-full border border-[#cfc4c5] bg-white px-4 py-2.5 text-sm outline-none transition placeholder:text-[#999999] focus:border-[#99854e] focus:ring-2 focus:ring-[#99854e]/15 disabled:bg-[#f3f3f3]"
              aria-label="Tin nhắn cho trợ lý thời trang"
            />
            <button
              type="submit"
              disabled={isSending || !inputValue.trim()}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#99854e] text-white shadow-sm transition hover:bg-black disabled:cursor-not-allowed disabled:bg-[#d4cec2] disabled:shadow-none"
              aria-label="Gửi tin nhắn"
            >
              <span className="material-symbols-outlined text-[20px]">send</span>
            </button>
          </form>
        </section>
      )}

      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-[#111111] text-white shadow-xl transition hover:bg-[#99854e] focus:outline-none focus:ring-2 focus:ring-[#99854e] focus:ring-offset-2 sm:h-16 sm:w-16"
        aria-label={isOpen ? 'Đóng trợ lý thời trang' : 'Mở trợ lý thời trang'}
        aria-expanded={isOpen}
      >
        {isOpen ? (
          <span className="material-symbols-outlined text-[26px] sm:text-[30px]">close</span>
        ) : (
          <StylistAvatar className="h-12 w-12 border-2 border-white/70 bg-white sm:h-14 sm:w-14" />
        )}
      </button>
    </div>
  );
}
