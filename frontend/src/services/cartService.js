import { requestJson } from './http/request';

export const fetchCart = async () =>
  requestJson({
    url: '/cart',
    method: 'GET',
  });

export const addItemToCart = async ({ costumeItemId, rentalStartDate, rentalEndDate }) =>
  requestJson({
    url: '/cart/add',
    method: 'POST',
    data: { costumeItemId, rentalStartDate, rentalEndDate },
  });

export const removeCartItem = async (cartItemId) =>
  requestJson({
    url: `/cart/remove/${encodeURIComponent(cartItemId)}`,
    method: 'DELETE',
  });
