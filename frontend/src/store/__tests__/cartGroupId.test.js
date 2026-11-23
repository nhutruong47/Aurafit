import { describe, it, expect } from 'vitest';
import cartReducer, { getCartGroupId, setCartItems } from '../cartSlice';

describe('getCartGroupId', () => {
  it('matches the grouped cart id created from backend cart items', () => {
    const apiItem = {
      id: 7,
      costumeId: 3,
      costumeItemId: 9,
      costumeName: 'Áo dài',
      size: 'M',
      color: 'Đỏ',
    };

    const state = cartReducer(undefined, setCartItems([apiItem]));

    expect(state.items).toHaveLength(1);
    expect(state.items[0].cartId).toBe(getCartGroupId(apiItem));
    expect(state.items[0].cartId).toBe('group-3_M_Đỏ');
  });

  it('uses empty segments when size and color are missing', () => {
    expect(getCartGroupId({ costumeId: 5 })).toBe('group-5__');
  });
});
