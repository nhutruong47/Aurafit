import { create } from 'zustand';
import { saveJson, loadJson } from './browserStorage';

export const useCheckoutStore = create((set) => ({
  pendingOrderId: null,

  hydratePendingOrderId: () => {
    const stored = loadJson('aurafitPendingOrderId', null);
    set({ pendingOrderId: stored });
    return stored;
  },

  setPendingOrderId: (orderId) => {
    saveJson('aurafitPendingOrderId', orderId);
    set({ pendingOrderId: orderId });
  },

  clearPendingOrderId: () => {
    saveJson('aurafitPendingOrderId', null);
    set({ pendingOrderId: null });
  },
}));
