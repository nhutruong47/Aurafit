import { createSlice } from '@reduxjs/toolkit';
import { loadJson, saveJson } from './browserStorage';
import { fallbackCostumeImage } from '../utils/costumeUtils';

const persistItems = (items) => {
  saveJson('aurafitCartItems', items);
};

const initialItems = loadJson('aurafitCartItems', []);

/**
 * Maps a single Backend CartItemDTO into a local flat object.
 * Each Backend row represents exactly 1 physical SKU.
 */
const mapCartItemToLocal = (cartItem) => {
  const imageUrls = Array.isArray(cartItem.imageUrls)
    ? cartItem.imageUrls.filter(Boolean)
    : [];
  const imageUrl = cartItem.imageUrl || imageUrls[0] || fallbackCostumeImage;

  return {
    cartId: `cart-item-${cartItem.id}`,
    id: cartItem.costumeItemId,
    cartItemId: cartItem.id,
    costumeId: cartItem.costumeId,
    costumeItemId: cartItem.costumeItemId,
    name: cartItem.costumeName,
    rawCategory: cartItem.category || 'Costume',
    category: cartItem.category || 'Costume',
    imageUrl,
    imageUrls,
    image: imageUrl,
    rentalStartDate: cartItem.rentalStartDate,
    rentalEndDate: cartItem.rentalEndDate,
    originalUnitPrice: cartItem.originalUnitPrice,
    unitPrice: cartItem.unitPrice,
    rentalDays: cartItem.rentalDays,
    originalRentalFee: cartItem.originalRentalFee,
    rentalFee: cartItem.rentalFee,
    discountPercent: cartItem.discountPercent,
    discountAmount: cartItem.discountAmount,
    eventName: cartItem.eventName,
    deposit: cartItem.deposit,
    depositPrice: cartItem.depositPrice,
    subtotal: cartItem.subtotal,
    sku: cartItem.sku,
    size: cartItem.size,
    color: cartItem.color,
    quantity: 1,
    availableStock: cartItem.availableStock,
    attribution: cartItem.attribution || null,
  };
};

/**
 * Groups an array of flat cart items (each representing 1 physical SKU row)
 * by costumeId + size + color. Produces 1 grouped entry per unique variant.
 *
 * Grouped item includes:
 * - quantity: total count of physical rows
 * - cartItemIds: array of Backend CartItem IDs (for batch delete)
 * - rentalFee / deposit / subtotal: summed across all rows
 * - sku: the first row's SKU (used by checkout to identify the variant)
 */
const groupCartItems = (flatItems) => {
  const groups = new Map();

  for (const item of flatItems) {
    const key = `${item.costumeId}_${item.size || ''}_${item.color || ''}`;

    if (groups.has(key)) {
      const group = groups.get(key);
      group.quantity += 1;
      group.cartItemIds.push(item.cartItemId);
      group.originalRentalFee = (Number(group.originalRentalFee) || 0) + (Number(item.originalRentalFee) || 0);
      group.rentalFee = (Number(group.rentalFee) || 0) + (Number(item.rentalFee) || 0);
      group.discountAmount = (Number(group.discountAmount) || 0) + (Number(item.discountAmount) || 0);
      group.deposit = (Number(group.deposit) || 0) + (Number(item.deposit) || 0);
      group.subtotal = (Number(group.subtotal) || 0) + (Number(item.subtotal) || 0);
    } else {
      groups.set(key, {
        ...item,
        // Override identity fields for the grouped representation
        cartId: `group-${key}`,
        meta: [item.size, item.color].filter(Boolean).join(' • '),
        quantity: 1,
        cartItemIds: [item.cartItemId],
      });
    }
  }

  return Array.from(groups.values());
};

const cartSlice = createSlice({
  name: 'cart',
  initialState: {
    items: initialItems,
  },
  reducers: {
    addCartItem: (state, action) => {
      const item = action.payload;
      const existingItem = state.items.find(
        (cartItem) => 
          (cartItem.costumeItemId && cartItem.costumeItemId === item.costumeItemId) ||
          (cartItem.sku && cartItem.sku === item.sku) || 
          (cartItem.id === item.id && cartItem.size === item.size && cartItem.color === item.color)
      );

      if (existingItem) {
        existingItem.quantity = (existingItem.quantity || 1) + (item.quantity || 1);
        // Refresh pricing metadata when an item already exists in a guest/local
        // cart so a newly activated event does not keep the stale base price.
        [
          'price',
          'priceValue',
          'originalUnitPrice',
          'unitPrice',
          'originalRentalFee',
          'rentalFee',
          'discountPercent',
          'discountAmount',
          'eventName',
          'depositPrice',
          'image',
          'imageUrl',
          'imageUrls',
        ].forEach((field) => {
          if (item[field] !== undefined) {
            existingItem[field] = item[field];
          }
        });
        persistItems(state.items);
        return;
      }

      state.items.push({
        ...item,
        quantity: item.quantity || 1,
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

      // Step 1: Map all backend DTOs to flat local items
      const flatItems = payload.map((entry) => {
        if (typeof entry === 'object' && 'costumeName' in entry) {
          return mapCartItemToLocal(entry);
        }
        return entry;
      });

      // Step 2: Group identical variants (costumeId + size + color)
      state.items = groupCartItems(flatItems);
      persistItems(state.items);
    },
    updateCartItemVariant: (state, action) => {
      const { cartId, costumeItemId, sku, size, color, rentalStartDate, rentalEndDate, quantity } = action.payload;
      const item = state.items.find((i) => i.cartId === cartId || i.cartItemId === cartId);
      if (item) {
        if (costumeItemId !== undefined) item.costumeItemId = costumeItemId;
        if (sku !== undefined) item.sku = sku;
        if (size !== undefined) item.size = size;
        if (color !== undefined) item.color = color;
        if (rentalStartDate !== undefined) item.rentalStartDate = rentalStartDate;
        if (rentalEndDate !== undefined) item.rentalEndDate = rentalEndDate;
        if (quantity !== undefined) item.quantity = quantity;
        item.meta = [item.size, item.color].filter(Boolean).join(' • ');
        persistItems(state.items);
      }
    },
  },
});

export const { addCartItem, updateCartQuantity, updateCartItemDates, updateCartItemVariant, removeCartItem, clearCart, setCartItems } = cartSlice.actions;

export const selectCartItems = (state) => state.cart.items;
export const selectCartCount = (state) =>
  state.cart.items.reduce((total, item) => total + (item.quantity || 1), 0);

export default cartSlice.reducer;
