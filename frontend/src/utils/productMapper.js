import {
  fallbackCostumeImage,
  toCartItemFromCostume,
} from './costumeUtils';

// Legacy compatibility layer. Runtime code should consume raw costume objects directly.
export const fallbackProductImage = fallbackCostumeImage;
export const toCartItem = toCartItemFromCostume;
export const mapCostumeToProduct = (costume) => costume;
