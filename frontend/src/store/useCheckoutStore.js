import { create } from 'zustand';
import { saveJson, loadJson } from './browserStorage';

export const useCheckoutStore = create((set) => ({
  pendingOrderId: null,
  pendingOrderIds: [],
  pendingSessionAmount: null,

  hydratePendingOrderId: () => {
    const storedId = loadJson('aurafitPendingOrderId', null);
    const storedIds = loadJson('aurafitPendingOrderIds', []);
    const storedAmount = loadJson('aurafitPendingSessionAmount', null);
    set({ pendingOrderId: storedId, pendingOrderIds: storedIds, pendingSessionAmount: storedAmount });
    return storedId;
  },

  setPendingOrderId: (orderId, amount = null, orderIds = []) => {
    saveJson('aurafitPendingOrderId', orderId);
    saveJson('aurafitPendingOrderIds', orderIds.length > 0 ? orderIds : [orderId]);
    saveJson('aurafitPendingSessionAmount', amount);
    set({ pendingOrderId: orderId, pendingOrderIds: orderIds.length > 0 ? orderIds : [orderId], pendingSessionAmount: amount });
  },

  clearPendingOrderId: () => {
    saveJson('aurafitPendingOrderId', null);
    saveJson('aurafitPendingOrderIds', []);
    saveJson('aurafitPendingSessionAmount', null);
    set({ pendingOrderId: null, pendingOrderIds: [], pendingSessionAmount: null });
  },
}));
