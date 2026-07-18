import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
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
import {
  buildPricePromptMessage,
  detectChatReplyLanguage,
  getChatAssistantErrorMessage,
} from '../utils/chatLanguage';
import { getCostumePrice } from '../utils/costumeUtils';
import { formatCurrency } from '../utils/formatCurrency';

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
          costume: item.costume,
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

const getLastUserMessageContent = (messages = []) => {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];
    if (message?.role === 'USER' || message?.author === 'user') {
      return message.content || message.text || '';
    }
  }
  return '';
};

const getRecommendationIds = (recommendations = []) =>
  recommendations
    .map((item) => item?.costume?.id ?? null)
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

const createClientMessageId = (prefix) =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

export function useAiChatSession({ cartItems = [], currentUser, onNavigate }) {
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

    return selectedProducts.map((costume) => ({
      ...costume,
      price: costume.price || getCostumePrice(costume) || formatCurrency(costume.priceValue || 0),
    }));
  }, [cartItems, contextProduct]);

  const [activeProductName, setActiveProductName] = useState(contextProduct?.name || products[0]?.name || '');
  const [draft, setDraft] = useState('');
  const [sessionId, setSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [sessionError, setSessionError] = useState('');
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [typingLanguage, setTypingLanguage] = useState('vi');
  const [isAssistantTyping, setIsAssistantTyping] = useState(false);
  const trackedSessionEntryKeyRef = useRef('');
  const trackedRecommendationImpressionsRef = useRef(new Set());
  const isSendingRef = useRef(false);

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
        setTypingLanguage(detectChatReplyLanguage(getLastUserMessageContent(createdSession.messages)));
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
            setTypingLanguage(detectChatReplyLanguage(getLastUserMessageContent(existingSession.messages)));

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
          setSessionError(fallbackError.message || error.message || 'Không thể khởi tạo Chatbot AuraFit.');
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
    if (!text || !sessionId || isSendingRef.current) return;

    const nextLanguage = detectChatReplyLanguage(text);
    const optimisticUserMessage = {
      id: createClientMessageId('user'),
      author: 'user',
      time: formatMessageTime(new Date().toISOString()),
      text,
      recommendations: [],
    };

    isSendingRef.current = true;
    setTypingLanguage(nextLanguage);
    setIsAssistantTyping(true);
    setIsSending(true);
    setSessionError('');
    setDraft('');
    setMessages((currentMessages) => [...currentMessages, optimisticUserMessage]);

    trackAiStylistUserMessage({
      interactionSessionId: guestSessionId,
      aiStylistSessionId: sessionId,
      guestSessionId,
      queryText: text,
      selectedCostumeId: activeProduct?.id || null,
      rentalStartDate: activeRentalPeriod?.rentalStartDate || null,
      rentalEndDate: activeRentalPeriod?.rentalEndDate || null,
    }).catch(() => {});

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
    } catch {
      setMessages((currentMessages) => [
        ...currentMessages,
        {
          id: createClientMessageId('assistant-error'),
          author: 'assistant',
          time: formatMessageTime(new Date().toISOString()),
          text: getChatAssistantErrorMessage(nextLanguage),
          recommendations: [],
        },
      ]);
    } finally {
      isSendingRef.current = false;
      setIsAssistantTyping(false);
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
    sendMessage(buildPricePromptMessage(typingLanguage, activeProduct.name, activeProduct.price));
  };

  const handleCloseSession = () => {
    clearStoredAiStylistSessionId(guestSessionId, currentUser?.id);
    onNavigate?.('catalog');
  };

  return {
    products,
    activeProduct,
    activeProductName, setActiveProductName,
    activeRentalPeriod,
    draft, setDraft,
    messages,
    sessionError,
    isBootstrapping,
    isSending,
    typingLanguage,
    isAssistantTyping,
    sendMessage,
    handleRecommendationClick,
    sendPriceRequest,
    handleCloseSession
  };
}
