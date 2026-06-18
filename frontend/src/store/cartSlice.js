import { createSlice } from '@reduxjs/toolkit';
import { loadJson } from './browserStorage';

const cartSlice = createSlice({
  name: 'cart',
  initialState: {
    items: loadJson('aurafitCartItems', []),
  },
  reducers: {
    addCartItem: (state, action) => {
      const item = action.payload;
      const existingItem = state.items.find((cartItem) => cartItem.name === item.name);

      if (existingItem) {
        existingItem.quantity = (existingItem.quantity || 1) + 1;
        return;
      }

      state.items.push({
        ...item,
        quantity: 1,
        cartId: `${item.name}-${Date.now()}-${state.items.length}`,
      });
    },
    updateCartQuantity: (state, action) => {
      const { cartId, quantity } = action.payload;

      if (quantity < 1) {
        state.items = state.items.filter((item) => item.cartId !== cartId);
        return;
      }

      const item = state.items.find((cartItem) => cartItem.cartId === cartId);
      if (item) {
        item.quantity = quantity;
      }
    },
    removeCartItem: (state, action) => {
      state.items = state.items.filter((item) => item.cartId !== action.payload);
    },
    clearCart: (state) => {
      state.items = [];
    },
  },
});

export const { addCartItem, updateCartQuantity, removeCartItem, clearCart } = cartSlice.actions;

export const selectCartItems = (state) => state.cart.items;
export const selectCartCount = (state) =>
  state.cart.items.reduce((total, item) => total + (item.quantity || 1), 0);

export default cartSlice.reducer;
