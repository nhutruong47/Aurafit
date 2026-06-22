import { formatCurrency } from '../../utils/formatCurrency';

export const singleItemSummaryRows = [
  { label: 'Rental Subtotal', value: '$180.00' },
  { label: 'Security Deposit (Refundable)', value: '$120.00' },
  { label: 'Cleaning & Insurance', value: '$20.00' },
];

export const multiItemSummaryRows = [
  { label: 'Rental Subtotal', value: '$630.00' },
  { label: 'Security Deposit (Refundable)', value: '$250.00' },
  { label: 'Cleaning & Insurance', value: '$45.00' },
  { label: 'Multi-Item Discount', value: '-$63.00', accent: true },
];

export const suggestions = [
  {
    category: 'Accessories',
    name: 'Oversized Cat-Eye Frames',
    price: '$45 / 4 days',
    badge: '-10%',
    image:
      'https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&w=700&q=85',
  },
  {
    category: 'Footwear',
    name: 'Pointed Satin Pump',
    price: '$95 / 4 days',
    badge: '-15%',
    image:
      'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=700&q=85',
  },
  {
    category: 'Jewelry',
    name: '18k Sculptural Cuff',
    price: '$70 / 4 days',
    badge: '-10%',
    image:
      'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=700&q=85',
  },
  {
    category: 'Accessories',
    name: 'Monogram Silk Foulard',
    price: '$35 / 4 days',
    badge: '-15%',
    image:
      'https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?auto=format&fit=crop&w=700&q=85',
  },
];

export const mobileTabs = [
  { icon: 'theater_comedy', label: 'Cosplay' },
  { icon: 'event', label: 'Events' },
  { icon: 'shopping_bag', label: 'Bag', active: true },
  { icon: 'auto_awesome', label: 'Extras' },
];

export function toRentalItem(item, index) {
  const isSizedItem = item.name?.toLowerCase().includes('gown') || item.name?.toLowerCase().includes('dress');
  const numericPrice = Number(item.subtotal ?? item.unitPrice ?? item.price ?? 0);
  const displayPrice =
    typeof item.price === 'string' && item.price.trim().length > 0 ? item.price : formatCurrency(numericPrice);

  return {
    id: item.cartId || item.id || item.name || index,
    cartItemId: item.cartItemId,
    costumeItemId: item.costumeItemId || item.id,
    name: item.name,
    tone: item.meta || 'Curated Rental',
    badge: '-10%',
    image: item.image,
    rawCategory: item.rawCategory,
    category: item.category,
    sku: item.sku,
    size: item.size,
    color: item.color,
    quantity: item.quantity || 1,
    rentalStartDate: item.rentalStartDate,
    rentalEndDate: item.rentalEndDate,
    rentalDays: item.rentalDays,
    unitPrice: item.unitPrice,
    subtotal: item.subtotal,
    sizes: [
      {
        label: item.size ? `Size ${item.size}` : isSizedItem ? 'Size 38' : 'One Size',
        stock: 'In Stock',
        quantity: item.quantity || 1,
      },
    ],
    period:
      item.rentalStartDate && item.rentalEndDate
        ? `${item.rentalStartDate} - ${item.rentalEndDate}`
        : 'Rental period pending',
    detailLabel: item.name?.toLowerCase().includes('bag') ? 'Status' : 'Protection',
    detail: item.name?.toLowerCase().includes('bag') ? 'Available for Delivery' : 'Premium Insurance Included',
    original: displayPrice,
    total: displayPrice,
    addText: item.name?.toLowerCase().includes('bag') ? 'Add another unit' : 'Add another size',
  };
}
