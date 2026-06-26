import { requestJson } from './http/request';

export const fetchCart = async () =>
  requestJson(
    {
      url: '/cart',
      method: 'GET',
    },
    'Không thể tải giỏ hàng.'
  );

export const addItemToCart = async ({ costumeItemId, rentalStartDate, rentalEndDate }) =>
  requestJson(
    {
      url: '/cart/items',
      method: 'POST',
      data: { costumeItemId, rentalStartDate, rentalEndDate },
    },
    'Không thể thêm sản phẩm vào giỏ hàng.'
  );

export const removeCartItem = async (cartItemId) =>
  requestJson(
    {
      url: `/cart/items/${encodeURIComponent(cartItemId)}`,
      method: 'DELETE',
    },
    'Không thể xóa sản phẩm khỏi giỏ hàng.'
  );
