import { formatCurrency } from '../../utils/formatCurrency';

export const singleItemSummaryRows = [
  { label: 'Tiền thuê', value: '$180.00' },
  { label: 'Tiền đặt cọc (Hoàn trả)', value: '$120.00' },
  { label: 'Phí vệ sinh & bảo hiểm', value: '$20.00' },
];

export const multiItemSummaryRows = [
  { label: 'Tiền thuê', value: '$630.00' },
  { label: 'Tiền đặt cọc (Hoàn trả)', value: '$250.00' },
  { label: 'Phí vệ sinh & bảo hiểm', value: '$45.00' },
  { label: 'Giảm giá nhiều sản phẩm', value: '-$63.00', accent: true },
];

export const suggestions = [
  {
    category: 'Phụ kiện',
    name: 'Kính mắt mèo bản lớn',
    price: '$45 / 4 ngày',
    badge: '-10%',
    image:
      'https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&w=700&q=85',
  },
  {
    category: 'Giày dép',
    name: 'Giày cao gót satin mũi nhọn',
    price: '$95 / 4 ngày',
    badge: '-15%',
    image:
      'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=700&q=85',
  },
  {
    category: 'Trang sức',
    name: 'Vòng tay điêu khắc 18k',
    price: '$70 / 4 ngày',
    badge: '-10%',
    image:
      'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=700&q=85',
  },
  {
    category: 'Phụ kiện',
    name: 'Khăn lụa monogram',
    price: '$35 / 4 ngày',
    badge: '-15%',
    image:
      'https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?auto=format&fit=crop&w=700&q=85',
  },
];

export const mobileTabs = [
  { icon: 'theater_comedy', label: 'Cosplay' },
  { icon: 'event', label: 'Sự kiện' },
  { icon: 'shopping_bag', label: 'Giỏ hàng', active: true },
  { icon: 'auto_awesome', label: 'Phụ kiện' },
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
    tone: item.meta || 'Tuyển chọn cho thuê',
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
        label: item.size ? `Size ${item.size}` : isSizedItem ? 'Size 38' : 'Freesize',
        stock: 'Còn hàng',
        quantity: item.quantity || 1,
      },
    ],
    period:
      item.rentalStartDate && item.rentalEndDate
        ? `${item.rentalStartDate} - ${item.rentalEndDate}`
        : 'Chưa chọn thời gian thuê',
    detailLabel: item.name?.toLowerCase().includes('bag') ? 'Tình trạng' : 'Bảo vệ sản phẩm',
    detail: item.name?.toLowerCase().includes('bag') ? 'Sẵn sàng giao hàng' : 'Đã bao gồm bảo hiểm Premium',
    original: displayPrice,
    total: displayPrice,
    addText: item.name?.toLowerCase().includes('bag') ? 'Thêm một sản phẩm nữa' : 'Thêm kích cỡ',
  };
}
