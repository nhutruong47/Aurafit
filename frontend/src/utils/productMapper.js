import { formatCurrency } from './formatCurrency';

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

export const mapCostumeToProduct = (costume) => {
  const rentalPrice = Number(costume.rentalPrice ?? costume.rental_price ?? costume.price ?? 0);
  const depositPrice = Number(costume.depositPrice ?? costume.deposit_price ?? costume.deposit ?? 0);
  const rawCategory = extractCategoryName(costume.category);
  const rawSubcategory = extractCategoryName(costume.subcategory);

  return {
    id: costume.id,
    name: costume.name,
    description: costume.description || '',
    image: costume.imageUrl || costume.image_url || fallbackProductImage,
    rawCategory,
    category: categoryLabels[rawCategory] || rawCategory,
    subcategory: rawSubcategory,
    tag: costume.tag || '',
    size: costume.size || '',
    available: costume.available !== false,
    rentalPrice,
    depositPrice,
    priceValue: rentalPrice,
    depositValue: depositPrice,
    price: formatCurrency(rentalPrice),
    deposit: formatCurrency(depositPrice),
    meta: [rawSubcategory, costume.tag, costume.size].filter(Boolean).join(' • '),
  };
};

function extractCategoryName(value) {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'object' && value.name) return value.name;
  return '';
}

export const toCartItem = (product) => ({
  id: product.id,
  name: product.name,
  meta: product.meta || product.description || product.tag,
  rawCategory: product.rawCategory,
  category: product.category,
  subcategory: product.subcategory,
  tag: product.tag,
  price: product.price,
  deposit: product.deposit,
  image: product.image,
});
