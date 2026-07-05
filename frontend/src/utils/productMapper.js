import { categoryLabels, resolveRootCategory } from './catalogCategory';
import { formatCurrency } from './formatCurrency';

export const fallbackProductImage =
  'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=900&q=85';

const extractCategoryName = (value) => {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'object' && value.name) return value.name;
  return '';
};

const buildMeta = (costume, apiCategoryName, normalizedCategory) => {
  const parts = [
    extractCategoryName(costume.subcategory),
    costume.tag,
    costume.size,
    apiCategoryName && apiCategoryName !== normalizedCategory ? apiCategoryName : null,
  ].filter(Boolean);

  return parts.join(' • ');
};

export const mapCostumeToProduct = (costume) => {
  const rentalPrice = Number(costume.rentalPrice ?? costume.rental_price ?? costume.price ?? 0);
  const depositPrice = Number(costume.depositPrice ?? costume.deposit_price ?? costume.deposit ?? 0);
  const metadata = costume.metadata || null;
  const metadataTags = Array.isArray(metadata?.tags) ? metadata.tags : [];
  const availableItemCount = Number(costume.availableItemCount ?? costume.availableQuantity ?? 0);
  const isActive = String(costume.status || '').toUpperCase() !== 'INACTIVE';
  const categoryPath = costume.category?.path ?? costume.categoryPath ?? null;
  const categorySlug = costume.category?.slug ?? costume.categorySlug ?? null;
  const apiCategoryName = extractCategoryName(costume.category) || costume.categoryName || '';
  const rootCategory = resolveRootCategory(
    categoryPath,
    apiCategoryName,
    costume.category?.description,
    costume.description,
    metadata?.style,
    metadata?.occasion
  );
  const normalizedCategory = rootCategory.uiName || apiCategoryName || 'Cosplay';
  const subcategory =
    extractCategoryName(costume.subcategory) || apiCategoryName || rootCategory.label || normalizedCategory;
  const available =
    typeof costume.available === 'boolean' ? costume.available : isActive && availableItemCount > 0;

  return {
    id: costume.id,
    costumeId: costume.id,
    name: costume.name,
    description: costume.description || '',
    image: costume.imageUrl || costume.image_url || fallbackProductImage,
    rawCategory: normalizedCategory,
    apiCategoryName,
    category: categoryLabels[normalizedCategory] || normalizedCategory,
    subcategory,
    tag: costume.tag || metadataTags[0] || '',
    size: costume.size || metadata?.size || '',
    color: costume.color || metadata?.color || '',
    available,
    availableItemCount,
    status: costume.status,
    rentalPrice,
    depositPrice,
    priceValue: rentalPrice,
    depositValue: depositPrice,
    price: formatCurrency(rentalPrice),
    deposit: formatCurrency(depositPrice),
    categoryId: costume.category?.id ?? costume.categoryId ?? null,
    categoryName: apiCategoryName || categoryLabels[normalizedCategory] || normalizedCategory,
    categorySlug,
    categoryPath,
    rootCategoryKey: rootCategory.key,
    rootCategoryPath: rootCategory.rootPath,
    rootCategoryName: rootCategory.label || categoryLabels[normalizedCategory] || normalizedCategory,
    owner: costume.owner || null,
    sellerName: costume.owner?.fullName || costume.owner?.email || '',
    sellerEmail: costume.owner?.email || '',
    meta: buildMeta(costume, apiCategoryName, normalizedCategory),
    metadata,
    style: metadata?.style || '',
    occasion: metadata?.occasion || '',
    season: metadata?.season || '',
    tags: metadataTags,
    availableQuantity: availableItemCount,
    inventorySummary: Array.isArray(costume.inventorySummary)
      ? costume.inventorySummary.map((summary) => ({
          color: summary.color || '',
          size: summary.size || '',
          availableCount: Number(summary.availableCount || 0),
          alreadyInCartCount: Number(summary.alreadyInCartCount || 0),
        }))
      : [],
    items: Array.isArray(costume.items ?? costume.costumeItems)
      ? (costume.items ?? costume.costumeItems).map((item) => ({
          id: item.id,
          sku: item.sku,
          size: item.size,
          color: item.color,
          status: item.status,
        }))
      : [],
    costumeItems: Array.isArray(costume.items ?? costume.costumeItems)
      ? (costume.items ?? costume.costumeItems).map((item) => ({
          id: item.id,
          sku: item.sku,
          size: item.size,
          color: item.color,
          status: item.status,
        }))
      : [],
  };
};

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
