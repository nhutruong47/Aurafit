import { formatCurrency } from '../../utils/formatCurrency';

/**
 * Converts a cart item into a display-ready rental item for the checkout page.
 *
 * @param {Object} item - Cart item (from Redux cart state)
 * @param {number} index - Index for generating stable id
 * @returns {Object} Display item with computed fields: subtotal, rentalDays, period, etc.
 */
export function toRentalItem(item, index) {
  const rawPrice = item.unitPrice ?? item.priceValue ?? 0;
  const numericPrice = typeof rawPrice === 'string'
    ? Number(rawPrice.replace(/[^\d]/g, ''))
    : Number(rawPrice);
  const discountPercentage = item.discountPercentage || 0;

  let salePrice = numericPrice;
  if (discountPercentage > 0) {
    salePrice = Math.round(numericPrice * (1 - discountPercentage / 100));
  }

  const start = item.rentalStartDate;
  const end = item.rentalEndDate;

  let rentalDays = 1;
  if (start && end) {
    const msPerDay = 1000 * 60 * 60 * 24;
    rentalDays = Math.max(1, Math.round((new Date(end) - new Date(start)) / msPerDay));
  }

  const subtotal = salePrice * rentalDays;
  const originalSubtotal = numericPrice * rentalDays;

  return {
    id: item.cartId || item.id || item.name || index,
    cartItemId: item.cartItemId,
    costumeItemId: item.costumeItemId || item.id,
    costumeId: item.costumeId || null,
    name: item.name,
    tone: item.meta || item.subcategory || 'Tuyển chọn cho thuê',
    badge: discountPercentage > 0 ? `-${discountPercentage}%` : null,
    image: item.image,
    rawCategory: item.rawCategory,
    category: item.category,
    sku: item.sku,
    size: item.size,
    color: item.color,
    attribution: item.attribution || null,
    quantity: item.quantity || 1,
    rentalStartDate: start,
    rentalEndDate: end,
    rentalDays,
    unitPrice: salePrice,
    originalUnitPrice: numericPrice,
    subtotal,
    depositValue: item.depositValue,
    sizes: [
      {
        label: item.size ? `Size ${item.size}` : 'Freesize',
        stock: item.availableStock || 1,
        quantity: item.quantity || 1,
      },
    ],
    period: start && end ? `${start} — ${end}` : 'Chưa chọn thời gian thuê',
    detailLabel: 'Bảo vệ sản phẩm',
    detail: 'Đã bao gồm bảo hiểm Premium',
    original: discountPercentage > 0 ? formatCurrency(originalSubtotal) : null,
    total: formatCurrency(subtotal),
    addText: 'Thêm kích cỡ',
  };
}
