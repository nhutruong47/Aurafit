export const fallbackItems = [
  {
    name: 'Avant-Garde Evening Blazer',
    size: 'Size: 48 (EU)',
    image:
      'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=600&q=85',
  },
  {
    name: 'Sculptural Leather Orbit Boots',
    size: 'Size: 42 (EU)',
    image:
      'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=600&q=85',
  },
];

export const navLinks = ['Shop', 'Cosplay', 'Events', 'Yearbook'];

export const storyLinks = ['Instagram', 'Editorial'];

export const footerColumns = [
  { title: 'Inquiries', links: ['Contact', 'FAQ'] },
  { title: 'Legal', links: ['Terms', 'Sustainability'] },
  { title: 'Brand', links: ['About'] },
];

export const mobileNavLinks = [
  ['theater_comedy', 'Cosplay'],
  ['event', 'Events'],
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
            : 'One Size',
        image: item.image,
      }))
    : fallbackItems;
