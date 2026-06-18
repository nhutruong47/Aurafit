export const mockShops = {
  Cosplay: {
    id: 'aura-cosplay',
    name: 'AuraCosplay - Thế Giới Hóa Thân',
    avatar: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=150&h=150&q=80',
    banner: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=1200&h=400&q=80',
    description: 'Chuyên cung cấp trang phục hóa thân anime, game, fantasy chất lượng cao, đầy đủ phụ kiện đi kèm.',
    address: '120 Điện Biên Phủ, Phường Đa Kao, Quận 1, TP. Hồ Chí Minh',
    rating: 4.9,
    reviewsCount: 1540,
    productsCount: 38,
    joinedYears: 2,
    categoryKey: 'Cosplay'
  },
  Events: {
    id: 'aura-event',
    name: 'AuraEvent - Tiệm Đồ Sự Kiện',
    avatar: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=150&h=150&q=80',
    banner: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1200&h=400&q=80',
    description: 'Cho thuê vest nam nữ lịch lãm, đầm dạ hội sang trọng, mascot hoạt náo và các trang phục biểu diễn sân khấu nổi bật.',
    address: '45 Nguyễn Thị Minh Khai, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh',
    rating: 4.8,
    reviewsCount: 2120,
    productsCount: 40,
    joinedYears: 3,
    categoryKey: 'Events'
  },
  Yearbook: {
    id: 'aura-yearbook',
    name: 'Thanh Xuân Kỷ Yếu Store',
    avatar: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=150&h=150&q=80',
    banner: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=1200&h=400&q=80',
    description: 'Chuyên áo dài truyền thống, áo dài học sinh, vest cử nhân, đồng phục học sinh Hàn Quốc/Nhật Bản và các concept chụp ảnh kỷ yếu thanh xuân.',
    address: '88 Nguyễn Gia Trí, Phường 25, Quận Bình Thạnh, TP. Hồ Chí Minh',
    rating: 4.9,
    reviewsCount: 3450,
    productsCount: 30,
    joinedYears: 4,
    categoryKey: 'Yearbook'
  },
  Accessories: {
    id: 'aura-accessory',
    name: 'AuraAccessory - Thế Giới Phụ Kiện',
    avatar: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=150&h=150&q=80',
    banner: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=1200&h=400&q=80',
    description: 'Cung cấp tóc giả (wigs) chất lượng cao, đạo cụ vũ khí cosplay, trang sức lấp lánh và các phụ kiện đi kèm hoàn hảo cho từng bộ trang phục.',
    address: '250 Cách Mạng Tháng Tám, Phường 10, Quận 3, TP. Hồ Chí Minh',
    rating: 4.7,
    reviewsCount: 890,
    productsCount: 70,
    joinedYears: 1,
    categoryKey: 'Accessories'
  },
  General: {
    id: 'aura-general',
    name: 'AuraFit General Store',
    avatar: 'https://images.unsplash.com/photo-1472851294608-062f824d296e?auto=format&fit=crop&w=150&h=150&q=80',
    banner: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1200&h=400&q=80',
    description: 'Cửa hàng chính thức của AuraFit, cung cấp đầy đủ các mẫu trang phục cho thuê chất lượng cao.',
    address: '350 Nguyễn Trãi, Phường Nguyễn Cư Trinh, Quận 1, TP. Hồ Chí Minh',
    rating: 4.9,
    reviewsCount: 5200,
    productsCount: 180,
    joinedYears: 5,
    categoryKey: 'General'
  }
};

export const getShopByProductCategory = (category) => {
  if (!category) return mockShops.General;
  const lowerCategory = category.toLowerCase();
  if (lowerCategory === 'cosplay') return mockShops.Cosplay;
  if (lowerCategory === 'events' || lowerCategory === 'event') return mockShops.Events;
  if (lowerCategory === 'yearbook') return mockShops.Yearbook;
  if (lowerCategory === 'accessories') return mockShops.Accessories;
  return mockShops.General;
};
