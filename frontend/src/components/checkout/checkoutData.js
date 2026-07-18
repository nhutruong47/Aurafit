import { formatCurrency } from '../../utils/formatCurrency';
import { fallbackCostumeImage } from '../../utils/costumeUtils';

/**
 * Tiered Duration Multiplier (mirrors PricingEngineService.java)
 * Days 1-2: 1.0x, Day 3: 1.2x, Day 4: 1.4x, etc.
 */
function calculateDurationMultiplier(days) {
  if (days <= 2) return 1.0;
  return 1.0 + (days - 2) * 0.2;
}

/**
 * Converts a cart item into a display-ready rental item for the checkout page.
 * Uses the Tiered Rental Pricing Engine for calculations.
 *
 * @param {Object} item - Cart item (from Redux cart state)
 * @param {number} index - Index for generating stable id
 * @returns {Object} Display item with computed fields: rentalFee, deposit, subtotal, etc.
 */
export function toRentalItem(item, index) {
  const basePrice = Number(item.unitPrice ?? item.priceValue ?? 0);
  const depositPrice = Number(item.depositPrice ?? 0); // retailValue from Costume.depositPrice

  const start = item.rentalStartDate;
  const end = item.rentalEndDate;

  let rentalDays = 1;
  if (start && end) {
    const msPerDay = 1000 * 60 * 60 * 24;
    rentalDays = Math.max(1, Math.round((new Date(end) - new Date(start)) / msPerDay));
  }

  // Tiered Pricing Engine (frontend mirror)
  const multiplier = calculateDurationMultiplier(rentalDays);
  const safeNumber = (val) => {
    if (val == null) return null;
    const num = Number(val);
    return isNaN(num) ? null : num;
  };

  const safeQuantity = Number(item.quantity) || 1;

  // Prefer backend-computed values; fall back to local calculation
  const parsedRentalFee = safeNumber(item.rentalFee);
  const rentalFee = parsedRentalFee != null
    ? parsedRentalFee
    : Math.round(basePrice * multiplier * safeQuantity);

  const expectedDeposit = Math.max(0, Math.round(depositPrice * 1.2 * safeQuantity - rentalFee));
  const parsedDeposit = safeNumber(item.deposit);
  const deposit = (parsedDeposit != null && (parsedDeposit > 0 || expectedDeposit === 0))
    ? parsedDeposit
    : expectedDeposit;

  const subtotal = rentalFee + deposit;

  return {
    id: item.cartId || item.id || item.name || index,
    cartItemId: item.cartItemId,
    cartItemIds: item.cartItemIds || (item.cartItemId ? [item.cartItemId] : []),
    costumeItemId: item.costumeItemId || item.id,
    costumeId: item.costumeId || null,
    name: item.name,
    tone: [item.size, item.color].filter(Boolean).join(' • ') || 'Tuyển chọn cho thuê',
    badge: null,
    image: item.image || fallbackCostumeImage,
    rawCategory: item.rawCategory,
    category: item.category,
    sku: item.sku,
    size: item.size,
    color: item.color,
    attribution: item.attribution || null,
    quantity: safeQuantity,
    rentalStartDate: start,
    rentalEndDate: end,
    rentalDays,
    multiplier,
    unitPrice: basePrice,
    depositPrice,
    rentalFee,
    deposit,
    subtotal,
    period: start && end ? `${start} — ${end}` : 'Chưa chọn thời gian thuê',
    total: formatCurrency(subtotal),
    rentalFeeFormatted: formatCurrency(rentalFee),
    depositFormatted: formatCurrency(deposit),
  };
}
