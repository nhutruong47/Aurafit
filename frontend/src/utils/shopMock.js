export const adminContact = {
  id: 'aurafit-admin',
  name: 'AuraFit Admin',
  avatar: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=150&h=150&q=80',
  banner: 'https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=1200&h=400&q=80',
  description: 'Kenh tu van va quan ly san pham chinh thuc cua AuraFit.',
  address: 'AuraFit Admin Center, TP. Ho Chi Minh',
  rating: 4.9,
  reviewsCount: 5200,
  productsCount: 180,
  joinedYears: 5,
  categoryKey: 'Admin',
};

export const mockShops = {
  General: adminContact,
  Cosplay: adminContact,
  Events: adminContact,
  Yearbook: adminContact,
  Accessories: adminContact,
};

export const getShopByProductCategory = () => adminContact;
