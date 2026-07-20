import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import StylistAvatar from '../components/common/StylistAvatar';
import StylistMessageBubble from '../components/common/StylistMessageBubble';
import StylistProductCards from '../components/common/StylistProductCards';
import {
  createStylistSessionId,
  fetchChatSessions,
  fetchSessionDetail,
  getStylistSessionId,
  saveStylistSessionId,
  sendChatMessage,
} from '../services/stylistService';
import { formatRelativeTime } from '../utils/formatRelativeTime';

const NETWORK_ERROR_MESSAGE = 'Không thể kết nối, vui lòng kiểm tra mạng và thử lại';
const PREVIEW_LENGTH = 40;

const createMessageId = () => {
  if (typeof window !== 'undefined' && window.crypto?.randomUUID) {
    return window.crypto.randomUUID();
  }

  return `message-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
};

const truncatePreview = (content) => {
  const characters = Array.from(content || '');
  return characters.length > PREVIEW_LENGTH
    ? `${characters.slice(0, PREVIEW_LENGTH).join('')}...`
    : characters.join('');
};

const isNotFoundError = (error) => error?.cause?.response?.status === 404;

const createDraftSession = (sessionId) => ({
  sessionId,
  previewText: 'Cuộc trò chuyện mới',
  lastMessageAt: null,
  messageCount: 0,
  isDraft: true,
});

export default function ChatDetailPage({ currentUser }) {
  const navigate = useNavigate();
  const location = useLocation();
  const messagesEndRef = useRef(null);
  const detailRequestRef = useRef(0);
  const initializationRef = useRef(0);
  const isAuthenticated = Boolean(currentUser?.id);
  const [sessions, setSessions] = useState([]);
  const [sessionId, setSessionId] = useState(() => getStylistSessionId());
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isSessionsLoading, setIsSessionsLoading] = useState(false);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [sessionsError, setSessionsError] = useState('');
  const [detailError, setDetailError] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const loadSessionDetail = useCallback(async (targetSessionId) => {
    const requestId = detailRequestRef.current + 1;
    detailRequestRef.current = requestId;
    setMessages([]);
    setDetailError('');
    setIsDetailLoading(true);

    try {
      const detail = await fetchSessionDetail(targetSessionId);
      if (detailRequestRef.current !== requestId) {
        return;
      }
      setMessages(detail.messages);
    } catch (error) {
      if (detailRequestRef.current !== requestId) {
        return;
      }

      if (isNotFoundError(error)) {
        setMessages([]);
      } else {
        setDetailError(error?.message || 'Không thể tải nội dung cuộc trò chuyện.');
      }
    } finally {
      if (detailRequestRef.current === requestId) {
        setIsDetailLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    const initializationId = initializationRef.current + 1;
    initializationRef.current = initializationId;

    const initializeChat = async () => {
      const nextSessionId = createStylistSessionId();
      const draftSession = createDraftSession(nextSessionId);
      detailRequestRef.current += 1;
      saveStylistSessionId(nextSessionId);
      setSessionId(nextSessionId);
      setSessions([draftSession]);
      setMessages([]);
      setInputValue('');
      setDetailError('');
      setIsDetailLoading(false);
      setSessionsError('');

      if (isAuthenticated) {
        setIsSessionsLoading(true);
        try {
          const loadedSessions = await fetchChatSessions();
          if (initializationRef.current !== initializationId) {
            return;
          }
          setSessions([
            draftSession,
            ...loadedSessions.filter((session) => session.sessionId !== nextSessionId),
          ]);
        } catch (error) {
          if (initializationRef.current !== initializationId) {
            return;
          }
          setSessionsError(error?.message || 'Không thể tải lịch sử trò chuyện.');
        } finally {
          if (initializationRef.current === initializationId) {
            setIsSessionsLoading(false);
          }
        }
      } else {
        setIsSessionsLoading(false);
      }
    };

    initializeChat();

    return () => {
      initializationRef.current += 1;
      detailRequestRef.current += 1;
    };
  }, [currentUser?.id, isAuthenticated, location.key]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [isSending, messages]);

  const handleSelectSession = async (selectedSessionId) => {
    if (isSending) {
      return;
    }

    initializationRef.current += 1;
    setSessionId(selectedSessionId);
    saveStylistSessionId(selectedSessionId);
    setIsSidebarOpen(false);
    await loadSessionDetail(selectedSessionId);
  };

  const handleNewChat = () => {
    if (isSending) {
      return;
    }

    const nextSessionId = createStylistSessionId();
    initializationRef.current += 1;
    detailRequestRef.current += 1;
    saveStylistSessionId(nextSessionId);
    setSessionId(nextSessionId);
    setMessages([]);
    setDetailError('');
    setInputValue('');
    setSessions((current) => {
      if (!isAuthenticated) {
        return [createDraftSession(nextSessionId)];
      }

      return [
        createDraftSession(nextSessionId),
        ...current.filter((session) => !session.isDraft),
      ];
    });
    setIsSidebarOpen(false);
  };

  const updateSessionSummary = (previousSessionId, nextSessionId, userMessage) => {
    const sentAt = new Date().toISOString();
    setSessions((current) => {
      const existing = current.find((session) => session.sessionId === previousSessionId);
      const updatedSession = {
        sessionId: nextSessionId,
        previewText:
          existing && !existing.isDraft && existing.previewText
            ? existing.previewText
            : truncatePreview(userMessage),
        lastMessageAt: sentAt,
        messageCount: (existing?.messageCount || 0) + 2,
        isDraft: false,
      };

      if (!isAuthenticated) {
        return [updatedSession];
      }

      return [
        updatedSession,
        ...current.filter(
          (session) =>
            session.sessionId !== previousSessionId &&
            session.sessionId !== nextSessionId
        ),
      ];
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const userMessage = inputValue.trim();
    if (!userMessage || isSending) {
      return;
    }

    const activeSessionId = sessionId;
    const localUserMessage = {
      id: createMessageId(),
      role: 'USER',
      content: userMessage,
      recommendedCostumes: [],
      createdAt: new Date().toISOString(),
    };

    setMessages((current) => [...current, localUserMessage]);
    setInputValue('');
    setIsSending(true);
    setDetailError('');

    try {
      const response = await sendChatMessage(activeSessionId, userMessage);
      const nextSessionId = response.sessionId || activeSessionId;
      const assistantMessage = {
        id: createMessageId(),
        role: 'ASSISTANT',
        content: response.replyText,
        recommendedCostumes: response.recommendedCostumes,
        createdAt: new Date().toISOString(),
        isError: response.hasError,
        errorType: response.errorType,
      };

      setMessages((current) => [...current, assistantMessage]);
      setSessionId(nextSessionId);
      saveStylistSessionId(nextSessionId);
      updateSessionSummary(activeSessionId, nextSessionId, userMessage);
    } catch {
      setMessages((current) => [
        ...current,
        {
          id: createMessageId(),
          role: 'ASSISTANT',
          content: NETWORK_ERROR_MESSAGE,
          recommendedCostumes: [],
          createdAt: new Date().toISOString(),
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

    navigate(`/products/${encodeURIComponent(costume.id)}`, {
      state: { product: costume },
    });
  };

  const renderSessionItem = (session) => {
    const isActive = session.sessionId === sessionId;
    const title = isAuthenticated
      ? session.previewText || 'Cuộc trò chuyện mới'
      : 'Cuộc trò chuyện hiện tại';

    return (
      <button
        key={session.sessionId}
        type="button"
        onClick={() => handleSelectSession(session.sessionId)}
        disabled={isSending}
        className={`w-full border px-3 py-3 text-left transition disabled:cursor-not-allowed disabled:opacity-60 ${
          isActive
            ? 'border-[#99854e] bg-[#111111] text-white'
            : 'border-transparent bg-white text-[#333333] hover:border-[#d8d0c3]'
        }`}
      >
        <p className="line-clamp-2 text-sm font-medium leading-5">{title}</p>
        <div
          className={`mt-2 flex items-center justify-between gap-2 text-[11px] ${
            isActive ? 'text-white/55' : 'text-[#8b877f]'
          }`}
        >
          <span>{formatRelativeTime(session.lastMessageAt) || 'Chưa có tin nhắn'}</span>
          {isAuthenticated && session.messageCount > 0 && (
            <span>{session.messageCount} tin</span>
          )}
        </div>
      </button>
    );
  };

  return (
    <section className="relative flex h-[calc(100dvh-5rem)] min-h-[36rem] overflow-hidden bg-[#f4f1eb]">
      {isSidebarOpen && (
        <button
          type="button"
          className="absolute inset-0 z-20 bg-black/35 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
          aria-label="Đóng lịch sử trò chuyện"
        />
      )}

      <aside
        className={`absolute inset-y-0 left-0 z-30 flex w-[280px] shrink-0 flex-col border-r border-[#d8d0c3] bg-[#efebe4] transition-transform duration-200 md:static md:translate-x-0 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="border-b border-[#d8d0c3] p-4">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8a7850]">
                AuraFit Stylist
              </p>
              <h1 className="mt-1 font-serif text-xl text-black">Lịch sử tư vấn</h1>
            </div>
            <button
              type="button"
              onClick={() => setIsSidebarOpen(false)}
              className="flex h-9 w-9 items-center justify-center text-[#666666] md:hidden"
              aria-label="Đóng sidebar"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleNewChat}
            disabled={isSending}
            className="flex w-full items-center justify-center gap-2 bg-[#99854e] px-4 py-3 text-sm font-semibold text-white transition hover:bg-black disabled:cursor-not-allowed disabled:bg-[#c7bda5]"
          >
            <span className="material-symbols-outlined text-[19px]">edit_square</span>
            Trò chuyện mới
          </button>
        </div>

        <div className="flex-1 space-y-2 overflow-y-auto p-3">
          {isSessionsLoading && (
            <div className="space-y-2" aria-label="Đang tải lịch sử trò chuyện">
              {[1, 2, 3].map((item) => (
                <div key={item} className="h-20 animate-pulse bg-white/70" />
              ))}
            </div>
          )}

          {!isSessionsLoading && sessionsError && (
            <div className="border border-red-200 bg-red-50 p-3 text-xs leading-5 text-red-700">
              {sessionsError}
            </div>
          )}

          {!isSessionsLoading && sessions.map(renderSessionItem)}
        </div>

        {!isAuthenticated && (
          <div className="m-3 border border-[#d8cba9] bg-[#fffaf0] p-3">
            <p className="text-xs leading-5 text-[#6f6244]">
              Đăng nhập để lưu và xem nhiều cuộc trò chuyện trên mọi thiết bị.
            </p>
            <button
              type="button"
              onClick={() => navigate('/account')}
              className="mt-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#8a7337] underline underline-offset-4"
            >
              Đăng nhập
            </button>
          </div>
        )}
      </aside>

      <main className="flex min-w-0 flex-1 flex-col bg-[#f9f9f9]">
        <header className="flex h-16 shrink-0 items-center gap-3 border-b border-[#d8d0c3] bg-white px-4 md:px-6">
          <button
            type="button"
            onClick={() => setIsSidebarOpen(true)}
            className="flex h-10 w-10 items-center justify-center border border-[#d8d0c3] text-[#333333] md:hidden"
            aria-label="Mở lịch sử trò chuyện"
          >
            <span className="material-symbols-outlined">menu</span>
          </button>
          <StylistAvatar className="h-10 w-10 border-2 border-[#99854e] bg-white" />
          <div>
            <h2 className="font-serif text-lg italic text-black">AuraFit Stylist</h2>
            <p className="text-[10px] uppercase tracking-[0.14em] text-[#8b877f]">
              Tư vấn trang phục cá nhân
            </p>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-4 py-5 sm:px-6 lg:px-10" aria-live="polite">
          <div className="mx-auto w-full max-w-4xl space-y-5">
            {isDetailLoading && (
              <div className="flex h-40 items-center justify-center text-sm text-[#777777]">
                <span className="material-symbols-outlined mr-2 animate-spin text-[#99854e]">
                  progress_activity
                </span>
                Đang tải cuộc trò chuyện...
              </div>
            )}

            {!isDetailLoading && detailError && (
              <div className="border border-red-200 bg-red-50 p-4 text-center text-sm text-red-700">
                <p>{detailError}</p>
                <button
                  type="button"
                  onClick={() => loadSessionDetail(sessionId)}
                  className="mt-3 font-semibold underline underline-offset-4"
                >
                  Thử lại
                </button>
              </div>
            )}

            {!isDetailLoading && !detailError && messages.length === 0 && (
              <div className="mx-auto mt-10 max-w-xl rounded-2xl border border-[#e4ddd2] bg-[#fffdf8] px-6 py-8 text-center shadow-[0_10px_32px_rgba(61,50,31,0.08)]">
                <StylistAvatar className="mx-auto h-16 w-16 border-2 border-[#99854e] bg-white" />
                <h3 className="mt-3 font-serif text-2xl text-black">Bạn đang tìm trang phục gì?</h3>
                <p className="mt-3 text-sm leading-6 text-[#666666]">
                  Hãy mô tả dịp sử dụng, phong cách, màu sắc hoặc ngân sách để AuraFit Stylist gợi ý lựa chọn phù hợp.
                </p>
              </div>
            )}

            {!isDetailLoading && messages.map((message, index) => {
              const isUser = String(message.role).toUpperCase() === 'USER';

              return (
                <div
                  key={message.id ?? `${message.role}-${index}`}
                  className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} animate-[fadeIn_220ms_ease-out]`}
                >
                  <StylistMessageBubble message={message} />

                  {!isUser && (
                    <div className="w-full pl-[2.625rem] sm:max-w-[82%]">
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
              <div className="flex w-fit items-center gap-1 border border-[#e4ddd2] bg-white px-4 py-3 text-[#99854e] shadow-sm">
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current [animation-delay:-0.3s]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current [animation-delay:-0.15s]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current" />
                <span className="ml-2 text-xs text-[#777777]">Stylist đang tư vấn...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        <form onSubmit={handleSubmit} className="shrink-0 border-t border-[#d8d0c3] bg-white px-4 py-3 sm:px-6">
          <div className="mx-auto flex w-full max-w-4xl gap-2">
            <input
              type="text"
              value={inputValue}
              onChange={(event) => setInputValue(event.target.value)}
              placeholder="Bạn đang tìm trang phục gì?"
              disabled={isSending || isDetailLoading}
              className="min-w-0 flex-1 rounded-full border border-[#cfc4c5] bg-white px-5 py-3 text-sm outline-none transition placeholder:text-[#999999] focus:border-[#99854e] focus:ring-2 focus:ring-[#99854e]/15 disabled:bg-[#f3f3f3]"
              aria-label="Tin nhắn cho trợ lý thời trang"
            />
            <button
              type="submit"
              disabled={isSending || isDetailLoading || !inputValue.trim()}
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#99854e] text-white shadow-sm transition hover:bg-black disabled:cursor-not-allowed disabled:bg-[#d4cec2] disabled:shadow-none"
              aria-label="Gửi tin nhắn"
            >
              <span className="material-symbols-outlined text-[21px]">send</span>
            </button>
          </div>
        </form>
      </main>
    </section>
  );
}
