import { useMemo, useState } from 'react';
import { useCostumes } from '../hooks/useCostumes';
import { fallbackProductImage, toCartItem } from '../utils/productMapper';

const filterGroups = [
  { key: 'subcategory', title: 'Thể loại' },
  { key: 'tag', title: 'Bộ sưu tập' },
  { key: 'size', title: 'Size' },
];

const accessoryHints = ['Wig', 'Weapon Prop', 'Jewelry', 'Boot Cover'];

export default function Cosplay({ onAddToCart, onNavigate }) {
  const [selectedFilters, setSelectedFilters] = useState({
    subcategory: [],
    tag: [],
    size: [],
  });
  const [quickFilter, setQuickFilter] = useState('all');
  const { costumes: cosplayProducts, isLoading, error } = useCostumes('cosplay');

  const availableFilterGroups = useMemo(
    () =>
      filterGroups
        .map((group) => ({
          ...group,
          items: [...new Set(cosplayProducts.map((product) => product[group.key]).filter(Boolean))],
        }))
        .filter((group) => group.items.length > 0),
    [cosplayProducts]
  );

  const filteredProducts = useMemo(() => {
    return cosplayProducts.filter((product) => {
      const matchesCheckboxes = availableFilterGroups.every((group) => {
        const selected = selectedFilters[group.key];
        return selected.length === 0 || selected.includes(product[group.key]);
      });

      const matchesQuickFilter =
        quickFilter === 'all' ||
        (quickFilter === 'available' && product.available) ||
        (quickFilter === 'free-size' && product.size === 'Free Size');

      return matchesCheckboxes && matchesQuickFilter;
    });
  }, [availableFilterGroups, quickFilter, selectedFilters]);

  const activeFilterCount =
    Object.values(selectedFilters).reduce((total, filters) => total + filters.length, 0) +
    (quickFilter === 'all' ? 0 : 1);

  const toggleFilter = (groupKey, item) => {
    setSelectedFilters((current) => {
      const currentItems = current[groupKey];
      const nextItems = currentItems.includes(item)
        ? currentItems.filter((value) => value !== item)
        : [...currentItems, item];

      return {
        ...current,
        [groupKey]: nextItems,
      };
    });
  };

  const clearFilters = () => {
    setSelectedFilters({
      subcategory: [],
      tag: [],
      size: [],
    });
    setQuickFilter('all');
  };

  return (
    <div className="bg-[#f7f7f7] text-[#111111]">
      <section className="relative min-h-[calc(100dvh-80px)] overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=1800&q=85"
          alt="Cosplay editorial scene with dramatic wardrobe"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-black/55" />
        <div className="relative z-10 mx-auto flex min-h-[calc(100dvh-80px)] max-w-[1440px] items-end px-5 pb-16 pt-20 md:px-20 md:pb-24">
          <div className="max-w-4xl text-white">
            <p className="mb-5 text-[11px] font-semibold uppercase tracking-[0.3em] text-[#d8c176]">
              Character Rental Studio
            </p>
            <h1 className="font-serif text-[52px] font-normal italic leading-[1.1] md:text-[86px]">
              Bộ sưu tập Cosplay
            </h1>
            <p className="mt-7 max-w-2xl text-base leading-8 text-white/78">
              Trang phục nhân vật được tuyển chọn cho shoot ảnh, event, sân khấu và những concept cần độ hoàn thiện
              cao từ form dáng đến phụ kiện.
            </p>
            <div className="mt-9 flex flex-wrap gap-4">
              <button
                onClick={() => document.getElementById('cosplay-products')?.scrollIntoView({ behavior: 'smooth' })}
                className="bg-white px-8 py-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-black transition hover:bg-[#99854e] hover:text-white"
              >
                Thuê trang phục
              </button>
              <button
                onClick={() => onNavigate?.('chat')}
                className="border border-white/70 px-8 py-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-white transition hover:border-[#d8c176] hover:text-[#d8c176]"
              >
                Gửi nhân vật cần tìm
              </button>
            </div>
          </div>
        </div>
      </section>

      <section id="cosplay-products" className="py-20 md:py-28">
        <div className="mx-auto grid max-w-[1440px] grid-cols-1 gap-12 px-5 md:grid-cols-12 md:px-20">
          <aside className="md:col-span-3">
            <div className="sticky top-28 space-y-8">
              <div className="flex items-center justify-between border-b border-[#cfc4c5] pb-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#999999]">
                  Bộ lọc
                </p>
                {activeFilterCount > 0 && (
                  <button
                    onClick={clearFilters}
                    className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#99854e] hover:text-black"
                  >
                    Xóa lọc
                  </button>
                )}
              </div>

              {availableFilterGroups.map((group) => (
                <FilterBlock
                  key={group.key}
                  title={group.title}
                  items={group.items}
                  selectedItems={selectedFilters[group.key]}
                  onToggle={(item) => toggleFilter(group.key, item)}
                />
              ))}

              <div className="border border-[#cfc4c5] bg-white p-6">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#99854e]">Gợi ý phụ kiện</p>
                <div className="mt-5 flex flex-wrap gap-2">
                  {accessoryHints.map((hint) => (
                    <button
                      key={hint}
                      className="border border-[#cfc4c5] px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#5f5e5e] transition hover:border-black hover:text-black"
                    >
                      {hint}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          <div className="md:col-span-9">
            <div className="mb-10 grid gap-6 border-b border-[#cfc4c5] pb-6 md:grid-cols-[1.3fr_0.7fr] md:items-end">
              <div>
                <h2 className="font-serif text-4xl font-normal italic md:text-5xl">Featured Characters</h2>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-[#5f5e5e]">
                  {isLoading
                    ? 'Đang tải sản phẩm Cosplay từ database...'
                    : `Đang hiển thị ${filteredProducts.length} / ${cosplayProducts.length} set từ database.`}
                </p>
                {error && <p className="mt-2 text-sm text-red-600">Chưa kết nối được backend/database.</p>}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setQuickFilter((current) => (current === 'available' ? 'all' : 'available'))}
                  className={`border px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.16em] transition ${
                    quickFilter === 'available'
                      ? 'border-black bg-black text-white'
                      : 'border-[#cfc4c5] text-[#5f5e5e] hover:border-black hover:text-black'
                  }`}
                >
                  Còn hàng
                </button>
                <button
                  onClick={() => setQuickFilter((current) => (current === 'free-size' ? 'all' : 'free-size'))}
                  className={`border px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.16em] transition ${
                    quickFilter === 'free-size'
                      ? 'border-black bg-black text-white'
                      : 'border-[#cfc4c5] text-[#5f5e5e] hover:border-black hover:text-black'
                  }`}
                >
                  Free Size
                </button>
              </div>
            </div>

            {filteredProducts.length > 0 ? (
              <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
                {filteredProducts.map((product, index) => (
                <CosplayCard key={product.name} product={product} index={index} onAddToCart={onAddToCart} />
                ))}
              </div>
            ) : (
              <div className="border border-[#cfc4c5] bg-white px-8 py-16 text-center">
                <span className="material-symbols-outlined mb-5 block text-[42px] text-[#99854e]">filter_alt_off</span>
                <h3 className="font-serif text-3xl font-normal italic">Không có set phù hợp</h3>
                <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[#5f5e5e]">
                  Thử bỏ bớt filter hoặc chọn nhóm trang phục khác để xem thêm lựa chọn.
                </p>
                <button
                  onClick={clearFilters}
                  className="mt-8 bg-black px-8 py-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-[#99854e]"
                >
                  Xóa toàn bộ filter
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="border-t border-[#cfc4c5] bg-white py-18 md:py-24">
        <div className="mx-auto grid max-w-[1440px] grid-cols-1 gap-5 px-5 md:grid-cols-4 md:px-20">
          {[
            ['01', 'Chọn nhân vật', 'Tìm set theo nguồn cảm hứng hoặc gửi reference cho stylist.'],
            ['02', 'Khóa phụ kiện', 'Thêm wig, prop, boot cover và jewelry ngay trong giỏ hàng.'],
            ['03', 'Fitting nhanh', 'Đội ngũ kiểm tra form, độ dài tà và khả năng di chuyển.'],
            ['04', 'Return sạch gọn', 'Trả đồ sau event, VIBE xử lý vệ sinh và bảo quản.'],
          ].map(([step, title, copy]) => (
            <article key={step} className="border border-[#cfc4c5] p-6">
              <p className="font-serif text-3xl italic text-[#99854e]">{step}</p>
              <h3 className="mt-6 text-[12px] font-semibold uppercase tracking-[0.18em]">{title}</h3>
              <p className="mt-3 text-sm leading-6 text-[#5f5e5e]">{copy}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

function FilterBlock({ title, items, selectedItems, onToggle }) {
  return (
    <div className="border-b border-[#cfc4c5] pb-7">
      <h3 className="mb-5 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#999999]">{title}</h3>
      <div className="space-y-3">
        {items.map((item) => (
          <label key={item} className="flex cursor-pointer items-center justify-between gap-4 text-sm text-[#4c4546]">
            <span>{item}</span>
            <input
              checked={selectedItems.includes(item)}
              className="h-4 w-4 accent-[#99854e]"
              onChange={() => onToggle(item)}
              type="checkbox"
            />
          </label>
        ))}
      </div>
    </div>
  );
}

function CosplayCard({ product, index, onAddToCart }) {
  return (
    <article
      className="group grid overflow-hidden border border-[#cfc4c5] bg-white md:grid-cols-[0.9fr_1.1fr]"
      style={{ animation: `fadeIn 0.7s ease-out ${index * 0.08}s both` }}
    >
      <div className="relative aspect-[4/5] overflow-hidden md:aspect-auto">
        <img
          src={product.image}
          alt={product.name}
          onError={(event) => {
            event.currentTarget.src = fallbackProductImage;
          }}
          className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
        />
      </div>
      <div className="flex flex-col justify-between p-7">
        <div>
          <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#99854e]">Rental Set</p>
          <h3 className="font-serif text-3xl font-normal italic leading-tight">{product.name}</h3>
          <p className="mt-4 text-sm leading-6 text-[#5f5e5e]">{product.meta}</p>
          <div className="mt-5 flex flex-wrap gap-2">
          {[product.subcategory, product.tag, product.size].filter(Boolean).map((tag) => (
              <span
                key={tag}
                className="border border-[#cfc4c5] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#777777]"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
        <div className="mt-9">
          <p className="mb-5 font-serif text-3xl">{product.price}</p>
          <button
            onClick={() => onAddToCart?.(toCartItem(product))}
            className="w-full bg-black px-5 py-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-[#99854e]"
          >
            Thêm vào giỏ
          </button>
        </div>
      </div>
    </article>
  );
}
