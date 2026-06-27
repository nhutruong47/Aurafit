import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import ChatAdminSidebar from '../components/chat/ChatAdminSidebar';
import ChatComposer from '../components/chat/ChatComposer';
import ChatMessageList from '../components/chat/ChatMessageList';
import ChatProductSelector from '../components/chat/ChatProductSelector';
import {
  attachAiStylistSessionToCurrentUser,
  clearStoredAiStylistSessionId,
  createAiStylistSession,
  fetchAiStylistSession,
  getStoredAiStylistSessionId,
  promoteAiStylistSessionIdToUser,
  sendAiStylistMessage,
  storeAiStylistSessionId,
} from '../services/aiStylistService';
import {
  getInteractionSessionId,
  rememberAiStylistRecommendationAttribution,
  trackAiStylistAssistantMessage,
  trackAiStylistRecommendationClick,
  trackAiStylistRecommendationImpression,
  trackAiStylistSessionStart,
  trackAiStylistUserMessage,
} from '../services/interactionsService';
import { formatCurrency } from '../utils/formatCurrency';
import { mapCostumeToProduct } from '../utils/productMapper';

const formatMessageTime = (createdAt) => {
  if (!createdAt) return 'Bây giờ';

  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) {
    return 'Bây giờ';
  }

  return date.toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

const mapBackendRecommendations = (recommendations = []) =>
  Array.isArray(recommendations)
    ? recommendations
        .filter((item) => item?.costume?.id)
        .map((item) => ({
          ...item,
          product: mapCostumeToProduct({
            ...item.costume,
            available: item.availableItemCount > 0,
          }),
        }))
    : [];

const mapBackendMessages = (messages = []) =>
  Array.isArray(messages)
    ? messages.map((message) => ({
        id: message.id || `${message.role}-${message.createdAt || Date.now()}`,
        author: message.role === 'USER' ? 'user' : 'assistant',
        time: formatMessageTime(message.createdAt),
        text: message.content,
        recommendations: mapBackendRecommendations(message.recommendations),
      }))
    : [];

const getLastAssistantMessage = (messages = []) => {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    if (messages[index]?.role === 'ASSISTANT') {
      return messages[index];
    }
  }
  return null;
};

const getRecommendationIds = (recommendations = []) =>
  recommendations
    .map((item) => item?.costume?.id ?? item?.product?.id ?? null)
    .filter((id) => id !== undefined && id !== null);

const getStableRentalPeriod = (products = []) => {
  const ranges = products
    .filter((product) => product?.rentalStartDate && product?.rentalEndDate)
    .map((product) => `${product.rentalStartDate}|${product.rentalEndDate}`);

  const uniqueRanges = [...new Set(ranges)];
  if (uniqueRanges.length !== 1) {
    return null;
  }

  const [rentalStartDate, rentalEndDate] = uniqueRanges[0].split('|');
  return rentalStartDate && rentalEndDate ? { rentalStartDate, rentalEndDate } : null;
};

export default function ChatPage({ onNavigate, cartItems = [], currentUser }) {
  const location = useLocation();
  const contextProduct = location.state?.contextProduct || null;
  const guestSessionId = useMemo(() => getInteractionSessionId(), []);
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

  const [activeProductName, setActiveProductName] = useState(contextProduct?.name || products[0]?.name || '');
  const [draft, setDraft] = useState('');
  const [sessionId, setSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [sessionError, setSessionError] = useState('');
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const trackedSessionEntryKeyRef = useRef('');
  const trackedRecommendationImpressionsRef = useRef(new Set());

  const activeProduct = useMemo(
    () => products.find((product) => product.name === activeProductName) || products[0] || null,
    [activeProductName, products]
  );
  const activeRentalPeriod = useMemo(() => {
    if (activeProduct?.rentalStartDate && activeProduct?.rentalEndDate) {
      return {
        rentalStartDate: activeProduct.rentalStartDate,
        rentalEndDate: activeProduct.rentalEndDate,
      };
    }

    if (contextProduct?.rentalStartDate && contextProduct?.rentalEndDate) {
      return {
        rentalStartDate: contextProduct.rentalStartDate,
        rentalEndDate: contextProduct.rentalEndDate,
      };
    }

    return getStableRentalPeriod(products);
  }, [activeProduct, contextProduct, products]);
  const activeRentalPeriodRef = useRef(activeRentalPeriod);

  useEffect(() => {
    activeRentalPeriodRef.current = activeRentalPeriod;
  }, [activeRentalPeriod]);

  useEffect(() => {
    let isMounted = true;

    const bootstrapSession = async () => {
      setIsBootstrapping(true);
      setSessionError('');
      const guestStoredSessionId = getStoredAiStylistSessionId(guestSessionId, null);
      let resolvedStoredSessionId = getStoredAiStylistSessionId(guestSessionId, currentUser?.id);

      const createFreshSession = async () => {
        const createdSession = await createAiStylistSession({
          guestSessionId,
          contextCostumeId: contextProduct?.id || null,
        });
        if (!isMounted) return;

        setSessionId(createdSession.id);
        setMessages(mapBackendMessages(createdSession.messages));
        storeAiStylistSessionId(createdSession.id, guestSessionId, currentUser?.id);

        const sessionEntryKey = `${createdSession.id}:created:${currentUser?.id || 'guest'}`;
        if (trackedSessionEntryKeyRef.current !== sessionEntryKey) {
          trackedSessionEntryKeyRef.current = sessionEntryKey;
          trackAiStylistSessionStart({
            interactionSessionId: guestSessionId,
            aiStylistSessionId: createdSession.id,
            guestSessionId,
            lifecycle: 'created',
            contextCostumeId: contextProduct?.id || null,
            userType: currentUser?.id ? 'authenticated' : 'guest',
          }).catch(() => {});
        }

        const introAssistantMessage = getLastAssistantMessage(createdSession.messages);
        if (introAssistantMessage?.id) {
          trackAiStylistAssistantMessage({
            interactionSessionId: guestSessionId,
            aiStylistSessionId: createdSession.id,
            guestSessionId,
            assistantMessageId: introAssistantMessage.id,
            recommendationIds: getRecommendationIds(introAssistantMessage.recommendations),
            rentalStartDate: activeRentalPeriodRef.current?.rentalStartDate || null,
            rentalEndDate: activeRentalPeriodRef.current?.rentalEndDate || null,
            variant: 'intro',
          }).catch(() => {});
        }
      };

      try {
        if (currentUser?.id && guestStoredSessionId) {
          const preferredSessionId = Number(guestStoredSessionId);
          const attachResponse = await attachAiStylistSessionToCurrentUser({
            guestSessionId,
            preferredSessionId: Number.isFinite(preferredSessionId) ? preferredSessionId : null,
          });
          if (!isMounted) return;

          if (attachResponse?.preferredSessionId) {
            resolvedStoredSessionId = String(attachResponse.preferredSessionId);
            promoteAiStylistSessionIdToUser({
              sessionId: attachResponse.preferredSessionId,
              guestSessionId,
              userId: currentUser.id,
            });
          } else {
            promoteAiStylistSessionIdToUser({
              sessionId: resolvedStoredSessionId,
              guestSessionId,
              userId: currentUser.id,
            });
          }
        }

        if (resolvedStoredSessionId) {
          const existingSession = await fetchAiStylistSession(resolvedStoredSessionId, guestSessionId);
          if (!isMounted) return;

          const shouldResetForNewContext =
            contextProduct?.id &&
            existingSession?.contextCostume?.id &&
            existingSession.contextCostume.id !== contextProduct.id;

          if (shouldResetForNewContext) {
            clearStoredAiStylistSessionId(guestSessionId, currentUser?.id);
            await createFreshSession();
          } else {
            setSessionId(existingSession.id);
            setMessages(mapBackendMessages(existingSession.messages));

            const sessionEntryKey = `${existingSession.id}:resume:${currentUser?.id || 'guest'}`;
            if (trackedSessionEntryKeyRef.current !== sessionEntryKey) {
              trackedSessionEntryKeyRef.current = sessionEntryKey;
              trackAiStylistSessionStart({
                interactionSessionId: guestSessionId,
                aiStylistSessionId: existingSession.id,
                guestSessionId,
                lifecycle: 'resume',
                contextCostumeId: existingSession?.contextCostume?.id || contextProduct?.id || null,
                userType: currentUser?.id ? 'authenticated' : 'guest',
              }).catch(() => {});
            }
          }
        } else {
          await createFreshSession();
        }
      } catch (error) {
        if (!isMounted) return;

        clearStoredAiStylistSessionId(guestSessionId, currentUser?.id);

        try {
          await createFreshSession();
        } catch (fallbackError) {
          if (!isMounted) return;
          setSessionError(fallbackError.message || error.message || 'Không thể khởi tạo AI Stylist.');
          setMessages([]);
          setSessionId(null);
        }
      } finally {
        if (isMounted) {
          setIsBootstrapping(false);
        }
      }
    };

    bootstrapSession();

    return () => {
      isMounted = false;
    };
  }, [contextProduct?.id, currentUser?.id, guestSessionId]);

  useEffect(() => {
    if (!sessionId || !messages.length) {
      return;
    }

    messages.forEach((message) => {
      if (message.author !== 'assistant' || !message.recommendations?.length) {
        return;
      }

      const recommendationIds = getRecommendationIds(message.recommendations);
      if (!recommendationIds.length) {
        return;
      }

      const impressionKey = `${sessionId}:${message.id}:${recommendationIds.join(',')}`;
      if (trackedRecommendationImpressionsRef.current.has(impressionKey)) {
        return;
      }

      trackedRecommendationImpressionsRef.current.add(impressionKey);
      trackAiStylistRecommendationImpression({
        interactionSessionId: guestSessionId,
        aiStylistSessionId: sessionId,
        guestSessionId,
        assistantMessageId: message.id,
        recommendationIds,
        rentalStartDate: activeRentalPeriod?.rentalStartDate || null,
        rentalEndDate: activeRentalPeriod?.rentalEndDate || null,
      }).catch(() => {});
    });
  }, [activeRentalPeriod?.rentalEndDate, activeRentalPeriod?.rentalStartDate, guestSessionId, messages, sessionId]);

  const sendMessage = async (textOverride) => {
    const text = (textOverride ?? draft).trim();
    if (!text || !sessionId || isSending) return;

    trackAiStylistUserMessage({
      interactionSessionId: guestSessionId,
      aiStylistSessionId: sessionId,
      guestSessionId,
      queryText: text,
      selectedCostumeId: activeProduct?.id || null,
      rentalStartDate: activeRentalPeriod?.rentalStartDate || null,
      rentalEndDate: activeRentalPeriod?.rentalEndDate || null,
    }).catch(() => {});

    setIsSending(true);
    setSessionError('');
    setDraft('');

    try {
      const session = await sendAiStylistMessage({
        sessionId,
        guestSessionId,
        selectedCostumeId: activeProduct?.id || null,
        rentalStartDate: activeRentalPeriod?.rentalStartDate || null,
        rentalEndDate: activeRentalPeriod?.rentalEndDate || null,
        message: text,
      });

      const assistantMessage = getLastAssistantMessage(session.messages);
      if (assistantMessage?.id) {
        trackAiStylistAssistantMessage({
          interactionSessionId: guestSessionId,
          aiStylistSessionId: session.id,
          guestSessionId,
          assistantMessageId: assistantMessage.id,
          recommendationIds: getRecommendationIds(assistantMessage.recommendations),
          rentalStartDate: activeRentalPeriod?.rentalStartDate || null,
          rentalEndDate: activeRentalPeriod?.rentalEndDate || null,
          variant: 'reply',
        }).catch(() => {});
      }

      setMessages(mapBackendMessages(session.messages));
      setSessionId(session.id);
      storeAiStylistSessionId(session.id, guestSessionId, currentUser?.id);
    } catch (error) {
      setDraft(text);
      setSessionError(error.message || 'Không thể gửi tin nhắn đến AI Stylist.');
    } finally {
      setIsSending(false);
    }
  };

  const handleRecommendationClick = ({ messageId, recommendation, index, product }) => {
    if (!product?.id || !sessionId) {
      return;
    }

    rememberAiStylistRecommendationAttribution({
      costumeId: product.id,
      aiStylistSessionId: sessionId,
      guestSessionId,
      interactionSessionId: guestSessionId,
      aiStylistMessageId: messageId,
      reason: recommendation?.reason || null,
      position: index + 1,
      rentalStartDate: activeRentalPeriod?.rentalStartDate || null,
      rentalEndDate: activeRentalPeriod?.rentalEndDate || null,
    });

    trackAiStylistRecommendationClick({
      interactionSessionId: guestSessionId,
      aiStylistSessionId: sessionId,
      guestSessionId,
      assistantMessageId: messageId,
      costumeId: product.id,
      position: index + 1,
      reason: recommendation?.reason || null,
      rentalStartDate: activeRentalPeriod?.rentalStartDate || null,
      rentalEndDate: activeRentalPeriod?.rentalEndDate || null,
    }).catch(() => {});
  };

  const sendPriceRequest = () => {
    if (!activeProduct) return;
    sendMessage(`Mình muốn được AI Stylist tư vấn giá và gợi ý costume phù hợp với "${activeProduct.name}" (${activeProduct.price}).`);
  };

  const handleCloseSession = () => {
    clearStoredAiStylistSessionId(guestSessionId, currentUser?.id);
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
                <h2 className="font-serif text-3xl font-normal leading-tight">AuraFit AI Stylist</h2>
                <span className="inline-flex items-center gap-1 text-xs text-[#99854e]">
                  <span className="material-symbols-outlined text-sm">verified_user</span>
                  <strong>Bám theo catalog</strong>
                </span>
              </div>
              <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.15em] text-[#999999]">
                Chỉ đề xuất costume có thật và còn sẵn trong hệ thống
              </p>
              {activeRentalPeriod && (
                <p className="mt-2 text-xs text-[#5f5e5e]">
                  Đang ưu tiên lịch thuê từ {activeRentalPeriod.rentalStartDate} đến {activeRentalPeriod.rentalEndDate}.
                </p>
              )}
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

          <ChatProductSelector
            products={products}
            activeProduct={activeProduct}
            onSelectProduct={setActiveProductName}
          />

          {sessionError && (
            <div className="border-b border-[#e4c9c7] bg-[#fff6f5] px-6 py-4 text-sm text-[#a94442] md:px-8">
              {sessionError}
            </div>
          )}

          <ChatMessageList
            messages={messages}
            onNavigate={onNavigate}
            onRecommendationClick={handleRecommendationClick}
          />

          <ChatComposer
            activeProduct={activeProduct}
            draft={draft}
            isSending={isSending || isBootstrapping}
            onDraftChange={setDraft}
            onSendPriceRequest={sendPriceRequest}
            onSendMessage={() => sendMessage()}
          />
        </section>
      </div>
    </div>
  );
}
