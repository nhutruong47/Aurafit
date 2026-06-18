import { useEffect, useState, useMemo } from 'react';
import { fetchCostumes } from '../services/api';
import { fallbackProductImage, mapCostumeToProduct, toCartItem } from '../utils/productMapper';
import { formatCurrency } from '../utils/formatCurrency';

export default function ShopDetail({ shop, onNavigate, onAddToCart }) {
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!shop) {
      onNavigate?.('catalog');
      return;
    }

    let isMounted = true;
    setIsLoading(true);
    setError('');

    fetchCostumes()
      .then((data) => {
        if (!isMounted) return;
        const mapped = Array.isArray(data) ? data.map(mapCostumeToProduct) : [];
        
        // Filter products belonging to this shop based on category
        const filtered = mapped.filter((product) => {
          const cat = product.rawCategory?.toLowerCase();
          if (shop.id === 'aura-cosplay') return cat === 'cosplay';
          if (shop.id === 'aura-event') return cat === 'events' || cat === 'event';
          if (shop.id === 'aura-yearbook') return cat === 'yearbook';
          if (shop.id === 'aura-accessory') return cat === 'accessories';
          return true; // General shop shows all
        });

        setProducts(filtered);
      })
      .catch((err) => {
        if (!isMounted) return;
        setError(err.message || 'Không thể tải danh sách sản phẩm của cửa hàng.');
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [shop, onNavigate]);

  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return products;
    return products.filter((p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [products, searchQuery]);

  if (!shop) return null;

  return (
    <div className="min-h-screen bg-[#f9f9f9] text-[#1a1c1c]">
      {/* Banner & Profile Section */}
      <section className="relative bg-white border-b border-[#cfc4c5]">
        <div className="h-[250px] md:h-[350px] overflow-hidden bg-[#eeeeee]">
          <img
            src={shop.banner}
            alt={shop.name}
            className="w-full h-full object-cover opacity-90"
          />
        </div>
        <div className="mx-auto max-w-[1440px] px-5 pb-8 md:px-20 relative">
          <div className="flex flex-col md:flex-row md:items-end gap-6 -mt-16 md:-mt-20 mb-6">
            <img
              src={shop.avatar}
              alt={shop.name}
              className="w-32 h-32 md:w-40 md:h-40 rounded-full object-cover border-4 border-white shadow-md bg-white"
            />
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="font-serif text-3xl md:text-4xl font-normal italic leading-tight">
                  {shop.name}
                </h1>
                <span className="bg-[#99854e] text-white text-[10px] font-semibold uppercase tracking-widest px-2.5 py-1 rounded">
                  Lessor Đối tác
                </span>
              </div>
              <p className="mt-2 text-sm text-[#5f5e5e] max-w-3xl leading-relaxed">
                {shop.description}
              </p>
              
              {/* Stats */}
              <div className="mt-4 flex flex-wrap gap-x-8 gap-y-2 text-xs md:text-sm text-[#5f5e5e] border-t border-[#cfc4c5]/40 pt-4">
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[#99854e] text-lg">star</span>
                  <strong>{shop.rating} / 5</strong>
                  <span className="text-[#999999]">({shop.reviewsCount} đánh giá)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[#99854e] text-lg">apparel</span>
                  <strong>{products.length}</strong> sản phẩm đăng thuê
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[#99854e] text-lg">verified_user</span>
                  Đã tham gia <strong>{shop.joinedYears} năm</strong>
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-4 md:mt-0">
              <button
                onClick={() => onNavigate?.('chat', { shopContext: shop })}
                className="px-6 py-3.5 bg-black text-white text-[11px] font-semibold uppercase tracking-[0.18em] transition hover:bg-[#99854e] flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-sm">chat</span> Chat với cửa hàng
              </button>
              <button
                onClick={() => onNavigate?.('catalog')}
                className="px-6 py-3.5 border border-[#cfc4c5] text-[11px] font-semibold uppercase tracking-[0.18em] text-[#5f5e5e] hover:border-black hover:text-black transition"
              >
                Về Catalog
              </button>
            </div>
          </div>
          <div className="border-t border-[#cfc4c5]/40 pt-4 text-xs md:text-sm text-[#5f5e5e] flex items-center gap-2">
            <span className="material-symbols-outlined text-base">location_on</span>
            <span>Địa chỉ: <strong>{shop.address}</strong></span>
          </div>
        </div>
      </section>

      {/* Products Section */}
      <main className="mx-auto max-w-[1440px] px-5 py-12 md:px-20">
        {/* Search and Filters */}
        <div className="mb-10 flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 border-b border-[#cfc4c5] pb-6">
          <div>
            <h2 className="font-serif text-2xl md:text-3xl italic">Sản phẩm từ cửa hàng</h2>
            <p className="text-sm text-[#5f5e5e] mt-1">
              Hiển thị danh sách trang phục được bảo dưỡng và cung cấp bởi {shop.name}.
            </p>
          </div>
          <div className="relative max-w-md w-full">
            <input
              type="text"
              placeholder="Tìm kiếm sản phẩm tại shop này..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-[#cfc4c5] bg-white text-sm outline-none focus:border-[#99854e] transition"
            />
            <span className="material-symbols-outlined absolute left-3 top-3.5 text-[#cfc4c5] text-sm">
              search
            </span>
          </div>
        </div>

        {error && (
          <p className="border border-[#ba1a1a]/30 bg-[#ffdad6] px-4 py-3 text-sm font-medium text-[#93000a] mb-8">
            {error}
          </p>
        )}

        {isLoading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="h-[420px] animate-pulse border border-[#cfc4c5] bg-white" />
            ))}
          </div>
        ) : filteredProducts.length ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {filteredProducts.map((product) => (
              <article
                key={product.id}
                onClick={() => onNavigate?.('productDetail', product)}
                className="group cursor-pointer border border-[#cfc4c5] bg-white transition hover:border-[#99854e]"
              >
                <div className="relative aspect-[3/4] overflow-hidden bg-[#eeeeee]">
                  <img
                    src={product.image}
                    alt={product.name}
                    onError={(event) => {
                      event.currentTarget.src = fallbackProductImage;
                    }}
                    className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                  />
                  <span className="absolute left-3 top-3 z-10 bg-black px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-white">
                    {product.category}
                  </span>

                  {/* Hover overlay — hiện thông tin sản phẩm khi rê chuột */}
                  <div className="absolute inset-0 z-[5] flex flex-col justify-end bg-gradient-to-t from-black/85 via-black/40 to-transparent p-4 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                    <h4 className="mb-1 line-clamp-2 font-serif text-lg italic leading-snug text-white">
                      {product.name}
                    </h4>
                    {product.description && (
                      <p className="mb-2 line-clamp-3 text-[11px] leading-[1.5] text-white/75">
                        {product.description}
                      </p>
                    )}
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-white/60">
                      {product.category && (
                        <span className="rounded-sm bg-white/15 px-1.5 py-0.5 font-semibold uppercase tracking-wider">
                          {product.category}
                        </span>
                      )}
                      {product.subcategory && (
                        <span className="rounded-sm bg-white/15 px-1.5 py-0.5 font-semibold uppercase tracking-wider">
                          {product.subcategory}
                        </span>
                      )}
                      {product.tag && (
                        <span className="rounded-sm bg-white/15 px-1.5 py-0.5 font-semibold uppercase tracking-wider">
                          {product.tag}
                        </span>
                      )}
                      {product.size && (
                        <span className="rounded-sm bg-white/15 px-1.5 py-0.5 font-semibold uppercase tracking-wider">
                          Size {product.size}
                        </span>
                      )}
                    </div>
                    <div className="mt-2.5 flex items-center gap-4 border-t border-white/15 pt-2.5 text-xs">
                      <div>
                        <span className="text-[9px] font-semibold uppercase tracking-wider text-white/45">Giá thuê</span>
                        <p className="mt-0.5 font-medium text-white">{formatCurrency(product.priceValue)}</p>
                      </div>
                      <div>
                        <span className="text-[9px] font-semibold uppercase tracking-wider text-white/45">Tiền cọc</span>
                        <p className="mt-0.5 font-medium text-white">{formatCurrency(product.depositValue)}</p>
                      </div>
                      <span className={`ml-auto inline-block h-2 w-2 rounded-full ${product.available ? 'bg-emerald-400' : 'bg-red-400'}`} title={product.available ? 'Còn hàng' : 'Hết hàng'} />
                    </div>
                  </div>
                </div>
                <div className="p-5">
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#99854e]">
                    {product.subcategory} {product.tag ? `| ${product.tag}` : ''}
                  </p>
                  <h3 className="line-clamp-2 min-h-[48px] font-serif text-2xl italic leading-tight transition group-hover:text-[#99854e]">
                    {product.name}
                  </h3>
                  <div className="mt-5 grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#999999]">Giá thuê</p>
                      <p className="mt-1 font-medium">{formatCurrency(product.priceValue)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#999999]">Tiền cọc</p>
                      <p className="mt-1 font-medium">{formatCurrency(product.depositValue)}</p>
                    </div>
                  </div>
                  <button
                    disabled={!product.available}
                    onClick={(event) => {
                      event.stopPropagation();
                      onAddToCart?.(toCartItem(product));
                    }}
                    className={`mt-5 w-full px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] transition ${
                      product.available
                        ? 'bg-black text-white hover:bg-[#99854e]'
                        : 'cursor-not-allowed bg-[#eeeeee] text-[#999999]'
                    }`}
                  >
                    Thuê ngay
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="border border-[#cfc4c5] bg-white p-12 text-center text-sm text-[#5f5e5e] italic">
            Không tìm thấy sản phẩm nào phù hợp với từ khóa tìm kiếm.
          </div>
        )}
      </main>
    </div>
  );
}
