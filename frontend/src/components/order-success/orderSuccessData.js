export const fallbackItems = [
  {
    name: 'Blazer dạ tiệc phá cách',
    size: 'Size: 48 (EU)',
    image:
      'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=600&q=85',
  },
  {
    name: 'Boot da điêu khắc Orbit',
    size: 'Size: 42 (EU)',
    image:
      'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=600&q=85',
  },
];

export const navLinks = ['Shop', 'Cosplay', 'Sự kiện', 'Yearbook'];

export const storyLinks = ['Instagram', 'Bộ ảnh'];

export const footerColumns = [
  { title: 'Liên hệ', links: ['Liên hệ', 'FAQ'] },
  { title: 'Pháp lý', links: ['Điều khoản', 'Bền vững'] },
  { title: 'Brand', links: ['Giới thiệu'] },
];

export const mobileNavLinks = [
  ['theater_comedy', 'Cosplay'],
  ['event', 'Sự kiện'],
  ['menu_book', 'Yearbook'],
  ['auto_awesome', 'Shop'],
];

export const getOrderSuccessItems = (cartItems = []) =>
  cartItems.length
    ? cartItems.map((item) => ({
        name: item.name,
        size:
          item.name?.toLowerCase().includes('gown') || item.name?.toLowerCase().includes('dress')
            ? 'Size: 38 (EU)'
            : 'Freesize',
        image: item.image,
      }))
    : fallbackItems;
