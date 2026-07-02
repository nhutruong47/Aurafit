import { createSlice } from '@reduxjs/toolkit';
import { loadJson, saveJson } from './browserStorage';

const persistItems = (items) => {
  saveJson('aurafitCartItems', items);
};

const initialItems = loadJson('aurafitCartItems', []);

const mapCartItemToLocal = (cartItem) => ({
  cartId: `cart-item-${cartItem.id}`,
  id: cartItem.costumeItemId,
  cartItemId: cartItem.id,
  costumeId: cartItem.costumeId,
  costumeItemId: cartItem.costumeItemId,
  name: cartItem.costumeName,
  meta: [cartItem.sku, cartItem.size, cartItem.color].filter(Boolean).join(' • '),
  rawCategory: cartItem.category || 'Costume',
  category: cartItem.category || 'Costume',
  subcategory: cartItem.sku,
  tag: cartItem.size,
  image: cartItem.imageUrl,
  price: cartItem.subtotal,
  rentalStartDate: cartItem.rentalStartDate,
  rentalEndDate: cartItem.rentalEndDate,
  rentalDays: cartItem.rentalDays,
  unitPrice: cartItem.unitPrice,
  subtotal: cartItem.subtotal,
  sku: cartItem.sku,
  size: cartItem.size,
  color: cartItem.color,
  quantity: 1,
  attribution: cartItem.attribution || null,
});

const cartSlice = createSlice({
  name: 'cart',
  initialState: {
    items: initialItems,
  },
  reducers: {
    addCartItem: (state, action) => {
      const item = action.payload;
      const existingItem = state.items.find((cartItem) => cartItem.name === item.name);

      if (existingItem) {
        existingItem.quantity = (existingItem.quantity || 1) + 1;
        persistItems(state.items);
        return;
      }

      state.items.push({
        ...item,
        quantity: 1,
        cartId: item.cartId || `${item.name}-${Date.now()}-${state.items.length}`,
      });
      persistItems(state.items);
    },
    updateCartQuantity: (state, action) => {
      const { cartId, quantity } = action.payload;

      if (quantity < 1) {
        state.items = state.items.filter((item) => item.cartId !== cartId);
        persistItems(state.items);
        return;
      }

      const item = state.items.find((cartItem) => cartItem.cartId === cartId);
      if (item) {
        item.quantity = quantity;
        persistItems(state.items);
      }
    },
    updateCartItemDates: (state, action) => {
      const { cartId, rentalStartDate, rentalEndDate } = action.payload;
      const item = state.items.find((i) => i.cartId === cartId || i.cartItemId === cartId);
      if (item) {
        item.rentalStartDate = rentalStartDate;
        item.rentalEndDate = rentalEndDate;
        persistItems(state.items);
      }
    },
    removeCartItem: (state, action) => {
      state.items = state.items.filter((item) => item.cartId !== action.payload);
      persistItems(state.items);
    },
    clearCart: (state) => {
      state.items = [];
      persistItems([]);
    },
    setCartItems: (state, action) => {
      const payload = action.payload || [];
      state.items = payload.map((entry) =>
        typeof entry === 'object' && 'costumeName' in entry ? mapCartItemToLocal(entry) : entry
      );
      persistItems(state.items);
    },
  },
});

export const { addCartItem, updateCartQuantity, updateCartItemDates, removeCartItem, clearCart, setCartItems } = cartSlice.actions;

export const selectCartItems = (state) => state.cart.items;
export const selectCartCount = (state) =>
  state.cart.items.reduce((total, item) => total + (item.quantity || 1), 0);

export default cartSlice.reducer;
