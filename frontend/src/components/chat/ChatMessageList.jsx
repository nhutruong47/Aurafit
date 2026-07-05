import { useEffect, useRef } from 'react';
import { getChatTypingText } from '../../utils/chatLanguage';
import { getCostumePrice } from '../../utils/costumeUtils';

function RecommendationCards({ messageId, recommendations, onNavigate, onRecommendationClick }) {
  if (!recommendations?.length) return null;

  return (
    <div className="mt-4 space-y-3">
      {recommendations.map((recommendation, index) => (
        <button
          key={recommendation.costume?.id || index}
          onClick={() => {
            onRecommendationClick?.({
              messageId,
              recommendation,
              index,
              product: recommendation.costume,
            });
            onNavigate?.('productDetail', recommendation.costume);
          }}
          className="block w-full border border-[#d9d4d3] bg-white p-3 text-left transition hover:border-black"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#99854e]">
                Gợi ý #{index + 1}
              </p>
              <h4 className="mt-1 font-serif text-lg italic text-black">{recommendation.costume?.name}</h4>
            </div>
            <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#777777]">
              {getCostumePrice(recommendation.costume)}
            </span>
          </div>
          <p className="mt-2 text-xs leading-5 text-[#5f5e5e]">{recommendation.reason || 'Còn sẵn để thuê'}</p>
        </button>
      ))}
    </div>
  );
}

function MessageBubble({ message, onNavigate, onRecommendationClick }) {
  const isUser = message.author === 'user';

  return (
    <div className={`flex max-w-lg items-end gap-3 ${isUser ? 'ml-auto justify-end' : ''}`}>
      {!isUser && (
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center bg-[#99854e]/10 text-[#99854e]">
          <span className="material-symbols-outlined text-[18px]">smart_toy</span>
        </div>
      )}
      <div className={`${isUser ? 'bg-black text-white' : 'border border-[#cfc4c5] bg-[#f3f3f4]'} overflow-hidden p-5`}>
        <p className="leading-relaxed">{message.text}</p>
        {!isUser && (
          <RecommendationCards
            messageId={message.id}
            recommendations={message.recommendations}
            onNavigate={onNavigate}
            onRecommendationClick={onRecommendationClick}
          />
        )}
        <span className={`mt-2 block text-[9px] font-semibold uppercase tracking-[0.12em] ${isUser ? 'text-white/60' : 'text-[#999999]'}`}>
          {message.time}
        </span>
      </div>
    </div>
  );
}

function TypingBubble({ language = 'vi' }) {
  return (
    <div className="flex max-w-lg items-end gap-3">
      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center bg-[#99854e]/10 text-[#99854e]">
        <span className="material-symbols-outlined text-[18px]">smart_toy</span>
      </div>
      <div className="border border-[#cfc4c5] bg-[#f3f3f4] p-5">
        <div className="flex items-center gap-3">
          <span className="text-sm text-[#4f4f4f]">{getChatTypingText(language)}</span>
          <span className="flex items-center gap-1 text-[#99854e]">
            <span className="h-2 w-2 animate-pulse rounded-full bg-current [animation-delay:-0.2s]" />
            <span className="h-2 w-2 animate-pulse rounded-full bg-current [animation-delay:-0.1s]" />
            <span className="h-2 w-2 animate-pulse rounded-full bg-current" />
          </span>
        </div>
      </div>
    </div>
  );
}

export default function ChatMessageList({
  messages,
  onNavigate,
  onRecommendationClick,
  isAssistantTyping = false,
  typingLanguage = 'vi',
}) {
  const listRef = useRef(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, isAssistantTyping]);

  return (
    <div ref={listRef} className="flex-1 space-y-8 overflow-y-auto px-5 pb-32 pt-8 md:px-8">
      <div className="flex items-center justify-center">
        <span className="h-px flex-1 bg-[#cfc4c5]" />
        <span className="px-4 text-[10px] font-semibold uppercase tracking-[0.3em] text-[#999999]">
          Hội thoại với Chatbot AuraFit
        </span>
        <span className="h-px flex-1 bg-[#cfc4c5]" />
      </div>

      {messages.map((message) => (
        <MessageBubble
          key={message.id}
          message={message}
          onNavigate={onNavigate}
          onRecommendationClick={onRecommendationClick}
        />
      ))}

      {isAssistantTyping && <TypingBubble language={typingLanguage} />}
      <div ref={bottomRef} />
    </div>
  );
}
