const PUBLIC_ROUTES = [
  { match: /^\/$/, title: 'AuraFit - Cho thuê trang phục cao cấp', description: 'Tuyển tập trang phục cho thuê cho sự kiện, cosplay, kỷ yếu và truyền thống.' },
  { match: /^\/catalog$/, title: 'Bộ sưu tập trang phục | AuraFit', description: 'Khám phá toàn bộ trang phục cho thuê tại AuraFit.' },
  { match: /^\/catalog\/cosplay$/, title: 'Trang phục Cosplay | AuraFit', description: 'Trang phục cosplay cho thuê với nhiều phong cách.' },
  { match: /^\/catalog\/traditional$/, title: 'Trang phục truyền thống | AuraFit', description: 'Áo dài, hanbok, kimono và trang phục truyền thống cho thuê.' },
  { match: /^\/catalog\/yearbook$/, title: 'Trang phục kỷ yếu | AuraFit', description: 'Trang phục chụp kỷ yếu, tốt nghiệp và concept nhóm.' },
  { match: /^\/catalog\/events$/, title: 'Trang phục sự kiện | AuraFit', description: 'Vest, đầm dạ hội và trang phục dành cho sự kiện.' },
  { match: /^\/events$/, title: 'Sự kiện & chương trình | AuraFit', description: 'Các chương trình và ưu đãi thuê trang phục đang diễn ra.' },
  { match: /^\/events\//, title: 'Chi tiết sự kiện | AuraFit', description: 'Thông tin chương trình thuê trang phục tại AuraFit.' },
  { match: /^\/products\//, title: 'Chi tiết trang phục | AuraFit', description: 'Xem chi tiết, giá thuê và tình trạng còn hàng.' },
  { match: /^\/policy$/, title: 'Chính sách thuê | AuraFit', description: 'Chính sách thuê, đặt cọc và hoàn trả tại AuraFit.' },
  { match: /^\/care$/, title: 'Hỗ trợ khách hàng | AuraFit', description: 'Liên hệ và giải đáp thắc mắc về dịch vụ thuê trang phục.' },
];

const PRIVATE_TITLES = [
  [/^\/admin/, 'Quản trị | AuraFit'],
  [/^\/staff/, 'Vận hành | AuraFit'],
  [/^\/account/, 'Tài khoản | AuraFit'],
  [/^\/checkout/, 'Xác nhận đơn thuê | AuraFit'],
  [/^\/payment/, 'Thanh toán | AuraFit'],
  [/^\/success/, 'Đặt thuê thành công | AuraFit'],
  [/^\/orders/, 'Đơn hàng | AuraFit'],
  [/^\/chat/, 'Trợ lý thời trang | AuraFit'],
];

const upsertMeta = (attribute, key, content) => {
  let tag = document.head.querySelector(`meta[${attribute}="${key}"]`);
  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute(attribute, key);
    document.head.appendChild(tag);
  }
  tag.setAttribute('content', content);
};

const upsertCanonical = (href) => {
  let link = document.head.querySelector('link[rel="canonical"]');
  if (!link) {
    link = document.createElement('link');
    link.setAttribute('rel', 'canonical');
    document.head.appendChild(link);
  }
  link.setAttribute('href', href);
};

export function applyRouteMeta(pathname) {
  const publicRoute = PUBLIC_ROUTES.find((route) => route.match.test(pathname));
  const privateRoute = PRIVATE_TITLES.find(([match]) => match.test(pathname));
  const isNotFound = !publicRoute && !privateRoute;
  const isPrivate = Boolean(privateRoute) || isNotFound;

  const title = isNotFound
    ? 'Không tìm thấy trang | AuraFit'
    : privateRoute?.[1] || publicRoute.title;
  const description = isNotFound
    ? 'Trang bạn tìm không tồn tại hoặc đã được thay đổi.'
    : publicRoute?.description || 'AuraFit - nền tảng cho thuê trang phục cao cấp.';

  document.title = title;
  upsertMeta('name', 'description', description);
  upsertMeta('name', 'robots', isPrivate ? 'noindex, nofollow' : 'index, follow');
  upsertMeta('property', 'og:title', title);
  upsertMeta('property', 'og:description', description);
  upsertMeta('property', 'og:type', 'website');
  upsertMeta('name', 'twitter:card', 'summary_large_image');
  upsertCanonical(`${window.location.origin}${pathname}`);
}
