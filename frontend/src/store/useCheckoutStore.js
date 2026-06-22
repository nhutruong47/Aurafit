import { create } from 'zustand';
import { saveJson, loadJson } from './browserStorage';

export const useCheckoutStore = create((set) => ({
  pendingOrderId: loadJson('aurafitPendingOrderId', null),

  setPendingOrderId: (orderId) => {
    saveJson('aurafitPendingOrderId', orderId);
    set({ pendingOrderId: orderId });
  },

  clearPendingOrderId: () => {
    saveJson('aurafitPendingOrderId', null);
    set({ pendingOrderId: null });
  },
}));
