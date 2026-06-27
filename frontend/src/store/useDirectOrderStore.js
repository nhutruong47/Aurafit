import { create } from 'zustand';
import { saveJson, loadJson } from './browserStorage';

const STORAGE_KEY = 'aurafitDirectOrder';

export const useDirectOrderStore = create((set) => ({
  // The single item selected for direct rent (Thuê ngay)
  // Shape: { ...cartItem, rentalStartDate, rentalEndDate }
  directItem: loadJson(STORAGE_KEY, null),

  setDirectItem: (item) => {
    saveJson(STORAGE_KEY, item);
    set({ directItem: item });
  },

  clearDirectItem: () => {
    saveJson(STORAGE_KEY, null);
    set({ directItem: null });
  },
}));
