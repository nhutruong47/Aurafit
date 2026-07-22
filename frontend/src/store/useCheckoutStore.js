import { create } from 'zustand';
import { saveJson, loadJson } from './browserStorage';

export const useCheckoutStore = create((set) => ({
  pendingOrderId: null,
  pendingSessionAmount: null,

  hydratePendingOrderId: () => {
    const storedId = loadJson('aurafitPendingOrderId', null);
    const storedAmount = loadJson('aurafitPendingSessionAmount', null);
    set({ pendingOrderId: storedId, pendingSessionAmount: storedAmount });
    return storedId;
  },

  setPendingOrderId: (orderId, amount = null) => {
    saveJson('aurafitPendingOrderId', orderId);
    saveJson('aurafitPendingSessionAmount', amount);
    set({ pendingOrderId: orderId, pendingSessionAmount: amount });
  },

  clearPendingOrderId: () => {
    saveJson('aurafitPendingOrderId', null);
    saveJson('aurafitPendingSessionAmount', null);
    set({ pendingOrderId: null, pendingSessionAmount: null });
  },
}));
