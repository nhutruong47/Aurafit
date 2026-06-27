import { formatCurrency } from './formatCurrency';

const UI_CATEGORY_BY_KEYWORD = [
  { match: ['cosplay', 'anime', 'gaming', 'game', 'fantasy', 'character'], value: 'Cosplay' },
  { match: ['event', 'sự kiện', 'formal', 'gala', 'prom', 'wedding', 'vest'], value: 'Events' },
  { match: ['yearbook', 'kỷ yếu', 'graduation', 'traditional', 'vintage', 'áo dài', 'kimono', 'hanbok'], value: 'Yearbook' },
  { match: ['accessor', 'phụ kiện', 'wig', 'shoe', 'jewelry', 'weapon', 'makeup'], value: 'Accessories' },
];

export const categoryLabels = {
  Cosplay: 'Cosplay',
  Events: 'Sự kiện',
  Event: 'Sự kiện',
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
  const metadata = costume.metadata || null;
  const metadataTags = Array.isArray(metadata?.tags) ? metadata.tags : [];
  const availableItemCount = Number(costume.availableItemCount ?? 0);
  const isActive = String(costume.status || '').toUpperCase() !== 'INACTIVE';

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
    tag: costume.tag || metadataTags[0] || '',
    size: costume.size || metadata?.size || '',
    color: costume.color || metadata?.color || '',
    available: isActive && availableItemCount > 0,
    availableItemCount,
    status: costume.status,
    rentalPrice,
    depositPrice,
    priceValue: rentalPrice,
    depositValue: depositPrice,
    price: formatCurrency(rentalPrice),
    deposit: formatCurrency(depositPrice),
    categoryId: costume.category?.id ?? costume.categoryId ?? null,
    meta: buildMeta(costume, rawCategory, normalizedCategory),
    metadata,
    style: metadata?.style || '',
    occasion: metadata?.occasion || '',
    season: metadata?.season || '',
    tags: metadataTags,
    // Items array: each entry has id, sku, size, color, status
    items: Array.isArray(costume.items)
      ? costume.items.map((item) => ({
          id: item.id,
          sku: item.sku,
          size: item.size,
          color: item.color,
          status: item.status,
        }))
      : [],
  };
};

/**
 * Converts a product into a cart item.
 *
 * @param {Object} product - The product object (from mapCostumeToProduct).
 *   Must have: id, name, rawCategory, category, image, priceValue (rentalPrice),
 *   depositValue, items (array of {id, sku, size, color}).
 * @param {Object|null} selectedItem - The selected item from product.items array
 *   (from the size/color selector). If omitted, the first available item is used.
 * @returns {Object} Cart item ready to be added to Redux cart state.
 */
export const toCartItem = (product, selectedItem = null) => {
  const item = selectedItem || product.items?.[0];
  return {
    id: product.id,
    costumeId: product.costumeId || product.id,
    costumeItemId: item?.id ?? null,
    name: product.name,
    meta: product.meta || product.description || product.tag,
    rawCategory: product.rawCategory,
    category: product.category,
    subcategory: product.subcategory,
    tag: product.tag,
    price: product.price,
    priceValue: product.priceValue ?? product.rentalPrice ?? 0,
    deposit: product.deposit,
    depositValue: product.depositValue ?? product.depositPrice ?? 0,
    image: product.image,
    sku: item?.sku ?? null,
    size: item?.size ?? product.size ?? null,
    color: item?.color ?? product.color ?? null,
    rentalStartDate: product.rentalStartDate,
    rentalEndDate: product.rentalEndDate,
  };
};
