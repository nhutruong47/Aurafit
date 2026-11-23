import { logoutUser } from './authService';
import { beginLogout, clearAccessToken, endLogout } from './http/apiClient';
import { clearCurrentUser } from '../store/authSlice';
import { clearCart } from '../store/cartSlice';
import { useCheckoutStore } from '../store/useCheckoutStore';
import { useStylistChatStore } from '../store/useStylistChatStore';

/**
 * Ends the session everywhere it is kept:
 * - server: clears the HttpOnly refresh cookie
 * - Redux: current user + cart
 * - Zustand: pending order/payment and stylist chat
 * - localStorage: legacy token keys and pending customer data
 *
 * Local cleanup always runs even when the network call fails, so a
 * shared device never keeps the previous customer's data.
 */
export const performLogout = async (dispatch) => {
  // Abort any refresh already in flight so it cannot re-create the cookie
  // after the logout response clears it.
  beginLogout();

  try {
    await logoutUser();
  } catch {
    // Network/server failure must not block a local logout.
  }

  dispatch(clearCurrentUser());
  dispatch(clearCart());
  clearAccessToken();

  useCheckoutStore.getState().clearPendingOrderId();
  useStylistChatStore.getState().startNewConversation();

  window.localStorage.removeItem('aurafitCurrentUser');
  window.localStorage.removeItem('aurafitCartItems');
  window.localStorage.removeItem('accessToken');
  window.localStorage.removeItem('refreshToken');

  endLogout();
};
