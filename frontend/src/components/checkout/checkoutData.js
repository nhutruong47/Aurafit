import { formatCurrency } from '../../utils/formatCurrency';

/**
 * Converts a cart item into a display-ready rental item for the checkout page.
 *
 * @param {Object} item - Cart item (from Redux cart state)
 * @param {number} index - Index for generating stable id
 * @returns {Object} Display item with computed fields: subtotal, rentalDays, period, etc.
 */
export function toRentalItem(item, index) {
  const numericPrice = Number(item.unitPrice ?? item.priceValue ?? 0);
  const displayPrice = typeof item.price === 'string' && item.price.trim()
    ? item.price
    : formatCurrency(numericPrice);

  const start = item.rentalStartDate;
  const end = item.rentalEndDate;

  let rentalDays = 1;
  if (start && end) {
    const msPerDay = 1000 * 60 * 60 * 24;
    rentalDays = Math.max(1, Math.round((new Date(end) - new Date(start)) / msPerDay));
  }

  const subtotal = numericPrice * rentalDays;

  return {
    id: item.cartId || item.id || item.name || index,
    cartItemId: item.cartItemId,
    costumeItemId: item.costumeItemId || item.id,
    name: item.name,
    tone: item.meta || item.subcategory || 'Tuyển chọn cho thuê',
    badge: '-10%',
    image: item.image,
    rawCategory: item.rawCategory,
    category: item.category,
    sku: item.sku,
    size: item.size,
    color: item.color,
    quantity: item.quantity || 1,
    rentalStartDate: start,
    rentalEndDate: end,
    rentalDays,
    unitPrice: numericPrice,
    subtotal,
    sizes: [
      {
        label: item.size ? `Size ${item.size}` : 'Freesize',
        stock: 'Còn hàng',
        quantity: item.quantity || 1,
      },
    ],
    period: start && end ? `${start} — ${end}` : 'Chưa chọn thời gian thuê',
    detailLabel: 'Bảo vệ sản phẩm',
    detail: 'Đã bao gồm bảo hiểm Premium',
    original: displayPrice,
    total: formatCurrency(subtotal),
    addText: 'Thêm kích cỡ',
  };
}
