import { create } from 'zustand';
import { loadJson, saveJson, saveString } from '../store/browserStorage';

const scrollToTop = () => {
  if (typeof window !== 'undefined') {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
};

export const useNavigationStore = create((set, get) => ({
  currentPage:
    typeof window === 'undefined' ? 'home' : window.localStorage.getItem('aurafitCurrentPage') || 'home',
  currentProduct: loadJson('aurafitCurrentProduct', null),
  chatContext: null,
  searchFocusToken: 0,
  navigate: (page, data = null) => {
    const blockedPages = ['shopDetail', 'becomeLessor', 'sellerDashboard'];
    const nextPage = blockedPages.includes(page) ? 'catalog' : page;
    const updates = { currentPage: nextPage };
    const { currentProduct } = get();

    saveString('aurafitCurrentPage', nextPage);

    if (nextPage === 'productDetail' && data) {
      updates.currentProduct = data;
      saveJson('aurafitCurrentProduct', data);
    }

    if (nextPage === 'chat') {
      updates.chatContext = data || currentProduct || null;
    }

    set(updates);
    scrollToTop();
  },
  openSearch: () => {
    saveString('aurafitCurrentPage', 'catalog');
    set((state) => ({
      currentPage: 'catalog',
      searchFocusToken: state.searchFocusToken + 1,
    }));
    scrollToTop();
  },
}));
