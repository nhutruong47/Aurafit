import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ChatAdminSidebar from '../components/chat/ChatAdminSidebar';
import ChatComposer from '../components/chat/ChatComposer';
import ChatMessageList from '../components/chat/ChatMessageList';
import ChatProductSelector from '../components/chat/ChatProductSelector';
import { closeChatSession, createChatSession, fetchChatHistory, sendChatMessage } from '../services/api';
import { formatCurrency } from '../utils/formatCurrency';
import { adminContact } from '../utils/shopMock';

const formatTimeLabel = (value) => {
  if (!value) return 'Bây giờ';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Bây giờ';
  return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
};

const normalizeMessage = (msg, index, fallbackSender = 'AI') => ({
  id: msg.id ?? `msg-${index}-${msg.createdAt || Date.now()}`,
  author: (msg.sender || fallbackSender).toLowerCase() === 'user' ? 'user' : 'staff',
  text: msg.content || msg.text || '',
  time: formatTimeLabel(msg.createdAt || msg.created_at),
  intent: msg.detectedIntent || msg.detected_intent,
  categoryId: msg.detectedCategoryId || msg.detected_category_id,
});

export default function Chat({ onNavigate, contextProduct, cartItems = [] }) {
  const products = useMemo(() => {
    const selectedProducts = [];
    if (contextProduct) selectedProducts.push(contextProduct);

    cartItems.forEach((item) => {
      if (!selectedProducts.some((product) => product.name === item.name)) {
        selectedProducts.push(item);
      }
    });

    return selectedProducts.map((product) => ({
      ...product,
      price: product.price || formatCurrency(product.priceValue || 0),
    }));
  }, [cartItems, contextProduct]);

  const [activeProductName, setActiveProductName] = useState(products[0]?.name || '');
  const [draft, setDraft] = useState('');
  const [messages, setMessages] = useState([]);
  const [sessionId, setSessionId] = useState(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState('');
  const sessionStartedRef = useRef(false);

  const activeProduct = useMemo(
    () => products.find((product) => product.name === activeProductName) || products[0] || null,
    [activeProductName, products]
  );

  // Boot: create or reuse an AI chat session.
  useEffect(() => {
    if (sessionStartedRef.current) return;
    sessionStartedRef.current = true;
    setIsInitializing(true);
    setError('');

    const existing = typeof window !== 'undefined' ? window.localStorage.getItem('aurafitChatSessionId') : null;
    const storedSessionId = existing ? Number(existing) || existing : null;

    (async () => {
      try {
        let activeSession = storedSessionId;
        if (activeSession) {
          try {
            const history = await fetchChatHistory(activeSession);
            const existingMessages = Array.isArray(history) ? history : history?.messages || [];
            setMessages(existingMessages.map((m, i) => normalizeMessage(m, i, 'AI')));
            setSessionId(activeSession);
            return;
          } catch (innerError) {
            // Fall through to create a new session.
          }
        }

        const newSession = await createChatSession({});
        const newSessionId = newSession?.id || newSession?.sessionId;
        if (newSessionId) {
          window.localStorage.setItem('aurafitChatSessionId', String(newSessionId));
          setSessionId(newSessionId);
        }
        setMessages([
          normalizeMessage(
            {
              id: 'welcome',
              sender: 'AI',
              content: 'Xin chào, tôi là trợ lý AI của AuraFit. Bạn muốn tìm trang phục cho sự kiện nào?',
              createdAt: new Date().toISOString(),
            },
            0,
            'AI'
          ),
        ]);
      } catch (requestError) {
        setError(requestError.message || 'Không thể khởi tạo phiên chat. Vui lòng thử lại sau.');
        setMessages([
          normalizeMessage(
            {
              id: 'fallback-welcome',
              sender: 'AI',
              content: 'Xin chào, AuraFit AI đang sẵn sàng tư vấn. (Đang chạy ở chế độ cục bộ do chưa kết nối backend.)',
              createdAt: new Date().toISOString(),
            },
            0,
            'AI'
          ),
        ]);
      } finally {
        setIsInitializing(false);
      }
    })();
  }, []);

  const sendMessage = useCallback(
    async (textOverride) => {
      const text = (textOverride ?? draft).trim();
      if (!text) return;

      const optimisticId = `local-${Date.now()}`;
      setMessages((current) => [
        ...current,
        normalizeMessage(
          { id: optimisticId, sender: 'USER', content: text, createdAt: new Date().toISOString() },
          current.length,
          'USER'
        ),
      ]);
      setDraft('');

      if (!sessionId) {
        setMessages((current) => [
          ...current,
          normalizeMessage(
            {
              id: `${optimisticId}-fallback`,
              sender: 'AI',
              content: activeProduct
                ? `AI đã ghi nhận yêu cầu về "${activeProduct.name}". Chúng tôi sẽ phản hồi sớm.`
                : 'AI đã ghi nhận tin nhắn. Chúng tôi sẽ phản hồi sớm nhất có thể.',
              createdAt: new Date().toISOString(),
            },
            current.length,
            'AI'
          ),
        ]);
        return;
      }

      setIsSending(true);
      try {
        const response = await sendChatMessage({ sessionId, message: text });
        const aiMessage = response?.aiMessage || response?.message || response;
        const userEcho = response?.userMessage;

        if (userEcho) {
          setMessages((current) => [
            ...current,
            normalizeMessage(userEcho, current.length, 'USER'),
          ]);
        }

        if (aiMessage) {
          setMessages((current) => [
            ...current,
            normalizeMessage(aiMessage, current.length, 'AI'),
          ]);
        }
      } catch (requestError) {
        setMessages((current) => [
          ...current,
          normalizeMessage(
            {
              id: `${optimisticId}-error`,
              sender: 'AI',
              content: 'Xin lỗi, AI không thể phản hồi lúc này. Vui lòng thử lại.',
              createdAt: new Date().toISOString(),
            },
            current.length,
            'AI'
          ),
        ]);
        setError(requestError.message || 'Không thể gửi tin nhắn tới AI.');
      } finally {
        setIsSending(false);
      }
    },
    [activeProduct, draft, sessionId]
  );

  const sendPriceRequest = () => {
    if (!activeProduct) return;
    sendMessage(`Mình muốn được tư vấn giá và lịch thuê cho "${activeProduct.name}" (${activeProduct.price}).`);
  };

  const handleCloseSession = async () => {
    if (sessionId) {
      try {
        await closeChatSession(sessionId);
      } catch (closeError) {
        // Ignore — best-effort close.
      }
    }
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem('aurafitChatSessionId');
    }
    onNavigate?.('catalog');
  };

  return (
    <div className="h-[calc(100vh-80px)] overflow-hidden bg-[#f9f9f9] text-[#1a1c1c]">
      <div className="flex h-full w-full flex-col overflow-hidden md:flex-row">
        <ChatAdminSidebar products={products} />

        <section className="relative flex min-h-0 flex-1 flex-col bg-[#f9f9f9]">
          <header className="z-40 flex min-h-20 flex-shrink-0 items-center justify-between border-b border-[#cfc4c5] bg-[#f9f9f9]/90 px-6 py-4 backdrop-blur-md md:px-8">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="font-serif text-3xl font-normal leading-tight">AuraFit AI Assistant</h2>
                <span className="inline-flex items-center gap-1 text-xs text-[#99854e]">
                  <span className="material-symbols-outlined text-sm">verified_user</span>
                  <strong>Official</strong>
                </span>
              </div>
              <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.15em] text-[#999999]">
                {isInitializing ? 'Đang khởi tạo phiên AI...' : 'Trợ lý AI tư vấn sản phẩm và đơn thuê'}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleCloseSession}
                className="border border-[#cfc4c5] px-4 py-2 text-xs font-semibold uppercase tracking-wider transition hover:bg-black hover:text-white"
              >
                Đóng phiên
              </button>
              <button
                onClick={() => onNavigate?.('catalog')}
                className="border border-[#cfc4c5] px-4 py-2 text-xs font-semibold uppercase tracking-wider transition hover:bg-black hover:text-white"
              >
                Xem catalog
              </button>
            </div>
          </header>

          {error && (
            <div className="border-b border-[#ba1a1a]/30 bg-[#ffdad6] px-6 py-2 text-xs font-medium text-[#93000a] md:px-8">
              {error}
            </div>
          )}

          <ChatProductSelector
            products={products}
            activeProduct={activeProduct}
            onSelectProduct={setActiveProductName}
          />

          <ChatMessageList messages={messages} />

          <ChatComposer
            activeProduct={activeProduct}
            draft={draft}
            onDraftChange={setDraft}
            onSendPriceRequest={sendPriceRequest}
            onSendMessage={() => sendMessage()}
            disabled={isInitializing || isSending}
          />
        </section>
      </div>
    </div>
  );
}
