import { formatCurrency } from './formatCurrency';

const UI_CATEGORY_BY_KEYWORD = [
  { match: ['cosplay', 'anime', 'gaming', 'game', 'fantasy', 'character'], value: 'Cosplay' },
  { match: ['event', 'sự kiện', 'formal', 'gala', 'prom', 'wedding', 'vest'], value: 'Events' },
  { match: ['yearbook', 'kỷ yếu', 'graduation', 'traditional', 'vintage', 'áo dài', 'kimono', 'hanbok'], value: 'Yearbook' },
  { match: ['accessor', 'phụ kiện', 'wig', 'shoe', 'jewelry', 'weapon', 'makeup'], value: 'Accessories' },
];

export const categoryLabels = {
  Cosplay: 'Cosplay',
  Events: 'Event',
  Event: 'Event',
  Yearbook: 'Kỷ yếu',
  'Kỷ yếu': 'Kỷ yếu',
  Accessories: 'Phụ kiện',
  'Phụ kiện': 'Phụ kiện',
};

export const categoryApiNames = {
  cosplay: 'Cosplay',
  event: 'Events',
  events: 'Events',
  yearbook: 'Yearbook',
  accessories: 'Accessories',
};

export const fallbackProductImage =
  'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=900&q=85';

const extractCategoryName = (value) => {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'object' && value.name) return value.name;
  return '';
};

const normalizeUiCategory = (costume) => {
  const rawCategory = extractCategoryName(costume.category);
  const text = [rawCategory, costume.category?.description, costume.description].filter(Boolean).join(' ').toLowerCase();

  const matched = UI_CATEGORY_BY_KEYWORD.find((entry) => entry.match.some((keyword) => text.includes(keyword)));
  return matched?.value || rawCategory || 'Cosplay';
};

const buildMeta = (costume, rawCategory, normalizedCategory) => {
  const parts = [
    extractCategoryName(costume.subcategory),
    costume.tag,
    costume.size,
    rawCategory && rawCategory !== normalizedCategory ? rawCategory : null,
  ].filter(Boolean);

  return parts.join(' • ');
};

export const mapCostumeToProduct = (costume) => {
  const rentalPrice = Number(costume.rentalPrice ?? costume.rental_price ?? costume.price ?? 0);
  const depositPrice = Number(costume.depositPrice ?? costume.deposit_price ?? costume.deposit ?? 0);
  const rawCategory = extractCategoryName(costume.category);
  const normalizedCategory = normalizeUiCategory(costume);
  const subcategory = extractCategoryName(costume.subcategory) || rawCategory;

  return {
    id: costume.id,
    costumeId: costume.id,
    name: costume.name,
    description: costume.description || '',
    image: costume.imageUrl || costume.image_url || fallbackProductImage,
    rawCategory: normalizedCategory,
    apiCategoryName: rawCategory,
    category: categoryLabels[normalizedCategory] || normalizedCategory,
    subcategory,
    tag: costume.tag || '',
    size: costume.size || '',
    available: String(costume.status || '').toUpperCase() !== 'INACTIVE' && costume.available !== false,
    status: costume.status,
    rentalPrice,
    depositPrice,
    priceValue: rentalPrice,
    depositValue: depositPrice,
    price: formatCurrency(rentalPrice),
    deposit: formatCurrency(depositPrice),
    categoryId: costume.category?.id ?? costume.categoryId ?? null,
    meta: buildMeta(costume, rawCategory, normalizedCategory),
  };
};

export const toCartItem = (product) => ({
  id: product.id,
  costumeId: product.costumeId || product.id,
  costumeItemId: product.costumeItemId || null,
  name: product.name,
  meta: product.meta || product.description || product.tag,
  rawCategory: product.rawCategory,
  category: product.category,
  subcategory: product.subcategory,
  tag: product.tag,
  price: product.price,
  deposit: product.deposit,
  image: product.image,
  sku: product.sku,
  size: product.size,
  color: product.color,
  rentalStartDate: product.rentalStartDate,
  rentalEndDate: product.rentalEndDate,
});
