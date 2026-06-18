import { configureStore, createListenerMiddleware, isAnyOf } from '@reduxjs/toolkit';
import authReducer, { clearCurrentUser, setCurrentUser } from './authSlice';
import cartReducer, { addCartItem, clearCart, removeCartItem, updateCartQuantity } from './cartSlice';
import { saveJson } from './browserStorage';

const listenerMiddleware = createListenerMiddleware();

listenerMiddleware.startListening({
  matcher: isAnyOf(setCurrentUser, clearCurrentUser),
  effect: (_, listenerApi) => {
    saveJson('aurafitCurrentUser', listenerApi.getState().auth.currentUser);
  },
});

listenerMiddleware.startListening({
  matcher: isAnyOf(addCartItem, updateCartQuantity, removeCartItem, clearCart),
  effect: (_, listenerApi) => {
    saveJson('aurafitCartItems', listenerApi.getState().cart.items);
  },
});

export const store = configureStore({
  reducer: {
    auth: authReducer,
    cart: cartReducer,
  },
  middleware: (getDefaultMiddleware) => getDefaultMiddleware().prepend(listenerMiddleware.middleware),
});
