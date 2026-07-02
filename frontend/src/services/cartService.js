import { requestJson } from './http/request';

export const fetchCart = async () =>
  requestJson(
    {
      url: '/cart',
      method: 'GET',
    },
    'Khong the tai gio hang.'
  );

export const addItemToCart = async ({
  costumeItemId,
  rentalStartDate,
  rentalEndDate,
  aiStylistAttribution = null,
}) =>
  requestJson(
    {
      url: '/cart/items',
      method: 'POST',
      data: { costumeItemId, rentalStartDate, rentalEndDate, aiStylistAttribution },
    },
    'Khong the them san pham vao gio hang.'
  );

export const removeCartItem = async (cartItemId) =>
  requestJson(
    {
      url: `/cart/items/${encodeURIComponent(cartItemId)}`,
      method: 'DELETE',
    },
    'Khong the xoa san pham khoi gio hang.'
  );

export const updateCartItem = async (cartItemId, { rentalStartDate, rentalEndDate }) =>
  requestJson(
    {
      url: `/cart/items/${encodeURIComponent(cartItemId)}`,
      method: 'PUT',
      data: { rentalStartDate, rentalEndDate },
    },
    'Khong the cap nhat san pham trong gio hang.'
  );
