import { categoryLabels, resolveRootCategory } from './catalogCategory';
import { formatCurrency } from './formatCurrency';

export const fallbackCostumeImage =
  'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=900&q=85';

export const extractCategoryName = (value) => {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'object' && value.name) return value.name;
  return '';
};

export const getCostumeImage = (costume) =>
  costume?.imageUrls?.[0] || costume?.imageUrl || costume?.image_url || costume?.image || fallbackCostumeImage;

export const getCostumeImages = (costume) => {
  const imageUrls = Array.isArray(costume?.imageUrls)
    ? costume.imageUrls.filter((imageUrl) => typeof imageUrl === 'string' && imageUrl.trim())
    : [];

  if (imageUrls.length > 0) {
    return imageUrls;
  }

  const legacyImageUrl = costume?.imageUrl || costume?.image_url || costume?.image;
  return legacyImageUrl ? [legacyImageUrl] : [fallbackCostumeImage];
};

export const getCostumeRentalPriceValue = (costume) =>
  Number(costume?.rentalPrice ?? costume?.rental_price ?? costume?.priceValue ?? costume?.price ?? 0);

export const getCostumeDiscountPercentValue = (costume) => {
  const value = Number(costume?.discountPercent ?? costume?.discount_percent);
  return Number.isFinite(value) && value > 0 && value <= 100 ? value : null;
};

export const getCostumeFinalPriceValue = (costume) => {
  const rawValue = costume?.finalPrice ?? costume?.final_price;
  if (rawValue === null || rawValue === undefined || rawValue === '') return null;
  const value = Number(rawValue);
  return Number.isFinite(value) && value >= 0 ? value : null;
};

export const hasCostumeDiscount = (costume) =>
  getCostumeDiscountPercentValue(costume) !== null
  && getCostumeFinalPriceValue(costume) !== null;

export const getCostumeDepositPriceValue = (costume) =>
  Number(costume?.depositPrice ?? costume?.deposit_price ?? costume?.depositValue ?? costume?.deposit ?? 0);

export const getCostumeAvailableItemCount = (costume) =>
  Number(costume?.availableItemCount ?? costume?.availableQuantity ?? 0);

export const getCostumeCategoryPath = (costume) =>
  costume?.category?.path ?? costume?.categoryPath ?? null;

export const getCostumeCategorySlug = (costume) =>
  costume?.category?.slug ?? costume?.categorySlug ?? null;

export const getCostumeApiCategoryName = (costume) =>
  extractCategoryName(costume?.category) || costume?.categoryName || '';

export const getCostumeRootCategory = (costume) =>
  resolveRootCategory(
    getCostumeCategoryPath(costume),
    getCostumeApiCategoryName(costume),
    costume?.category?.description,
    costume?.description,
    costume?.metadata?.style,
    costume?.metadata?.occasion
  );

export const getCostumeDisplayCategory = (costume) => {
  const rawCategory = getCostumeApiCategoryName(costume);
  const rootCategory = getCostumeRootCategory(costume);
  const normalizedCategory = rootCategory.uiName || rawCategory || 'Cosplay';
  return categoryLabels[normalizedCategory] || normalizedCategory;
};

export const getCostumeSubcategory = (costume) => {
  const rawCategory = getCostumeApiCategoryName(costume);
  const rootCategory = getCostumeRootCategory(costume);
  return extractCategoryName(costume?.subcategory) || rawCategory || rootCategory.label || getCostumeDisplayCategory(costume);
};

export const getCostumeTag = (costume) => {
  const metadataTags = Array.isArray(costume?.metadata?.tags) ? costume.metadata.tags : [];
  return costume?.tag || metadataTags[0] || '';
};

export const getCostumeTags = (costume) => {
  const metadataTags = Array.isArray(costume?.metadata?.tags) ? costume.metadata.tags : [];
  const costumeTags = Array.isArray(costume?.tags) ? costume.tags : [];
  return [...new Set([...costumeTags, ...metadataTags].filter(Boolean))];
};

export const getCostumePrimarySize = (costume) => costume?.size || costume?.metadata?.size || '';

export const getCostumePrimaryColor = (costume) => costume?.color || costume?.metadata?.color || '';

export const isCostumeAvailable = (costume) => {
  if (typeof costume?.available === 'boolean') {
    return costume.available;
  }

  if (typeof costume?.isAvailable === 'boolean') {
    return costume.isAvailable;
  }

  const isActive = String(costume?.status || '').toUpperCase() !== 'INACTIVE';
  return isActive && getCostumeAvailableItemCount(costume) > 0;
};

export const getCostumeDisplayMeta = (costume) => {
  const apiCategoryName = getCostumeApiCategoryName(costume);
  const normalizedCategory = getCostumeDisplayCategory(costume);
  const parts = [
    extractCategoryName(costume?.subcategory),
    getCostumeTag(costume),
    getCostumePrimarySize(costume),
    apiCategoryName && apiCategoryName !== normalizedCategory ? apiCategoryName : null,
  ].filter(Boolean);

  return parts.join(' • ');
};

export const getCostumeItems = (costume) =>
  Array.isArray(costume?.items ?? costume?.costumeItems) ? costume.items ?? costume.costumeItems : [];

export const getCostumeInventorySummary = (costume) =>
  Array.isArray(costume?.inventorySummary) ? costume.inventorySummary : [];

/**
 * Counts items currently being held by pending (unpaid) orders.
 * The frontend uses this to show a "X đang được giữ" hint so shoppers
 * understand why stock may differ from what they can actually book right now.
 */
export const getCostumeReservedCount = (costume) =>
  Array.isArray(costume?.items)
    ? costume.items.filter((item) => item?.status === 'RESERVED').length
    : 0;

export const getCostumePrice = (costume) => formatCurrency(getCostumeRentalPriceValue(costume));

export const getCostumeDeposit = (costume) => formatCurrency(getCostumeDepositPriceValue(costume));

export const toCartItemFromCostume = (costume, selectedItem = null) => {
  const item = selectedItem || getCostumeItems(costume)[0] || null;
  const originalUnitPrice = getCostumeRentalPriceValue(costume);
  const discounted = hasCostumeDiscount(costume);
  const effectiveUnitPrice = discounted
    ? getCostumeFinalPriceValue(costume)
    : originalUnitPrice;

  return {
    id: costume.id,
    costumeId: costume.id,
    costumeItemId: item?.id ?? null,
    name: costume.name,
    meta: getCostumeDisplayMeta(costume) || costume.description || getCostumeTag(costume),
    rawCategory: getCostumeDisplayCategory(costume),
    category: getCostumeDisplayCategory(costume),
    subcategory: getCostumeSubcategory(costume),
    tag: getCostumeTag(costume),
    price: formatCurrency(effectiveUnitPrice),
    priceValue: effectiveUnitPrice,
    originalUnitPrice,
    discountPercent: discounted ? getCostumeDiscountPercentValue(costume) : null,
    eventName: discounted ? costume?.eventName || null : null,
    deposit: getCostumeDeposit(costume),
    depositValue: getCostumeDepositPriceValue(costume),
    depositPrice: getCostumeDepositPriceValue(costume),
    image: getCostumeImage(costume),
    sku: item?.sku ?? null,
    size: item?.size ?? getCostumePrimarySize(costume) ?? null,
    color: item?.color ?? getCostumePrimaryColor(costume) ?? null,
    rentalStartDate: costume?.rentalStartDate,
    rentalEndDate: costume?.rentalEndDate,
  };
};
