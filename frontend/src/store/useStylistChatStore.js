import { create } from 'zustand';
import {
  createStylistSessionId,
  getStylistSessionId,
  saveStylistSessionId,
} from '../services/stylistService';

export const useStylistChatStore = create((set) => ({
  sessionId: getStylistSessionId(),
  messages: [],
  isWidgetOpen: false,

  setSessionId: (sessionId) => {
    if (!sessionId) {
      return;
    }

    saveStylistSessionId(sessionId);
    set({ sessionId });
  },

  setMessages: (messagesOrUpdater) => {
    set((state) => ({
      messages:
        typeof messagesOrUpdater === 'function'
          ? messagesOrUpdater(state.messages)
          : messagesOrUpdater,
    }));
  },

  setConversation: (sessionId, messages = []) => {
    if (!sessionId) {
      return;
    }

    saveStylistSessionId(sessionId);
    set({
      sessionId,
      messages: Array.isArray(messages) ? messages : [],
    });
  },

  startNewConversation: () => {
    const sessionId = createStylistSessionId();
    saveStylistSessionId(sessionId);
    set({ sessionId, messages: [], isWidgetOpen: false });
    return sessionId;
  },

  setWidgetOpen: (isWidgetOpen) => set({ isWidgetOpen }),
}));
