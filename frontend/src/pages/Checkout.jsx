import { useMemo, useRef, useState } from 'react';
import { useCostumes } from '../hooks/useCostumes';

const singleItemSummaryRows = [
  { label: 'Rental Subtotal', value: '$180.00' },
  { label: 'Security Deposit (Refundable)', value: '$120.00' },
  { label: 'Cleaning & Insurance', value: '$20.00' },
];

const multiItemSummaryRows = [
  { label: 'Rental Subtotal', value: '$630.00' },
  { label: 'Security Deposit (Refundable)', value: '$250.00' },
  { label: 'Cleaning & Insurance', value: '$45.00' },
  { label: 'Multi-Item Discount', value: '-$63.00', accent: true },
];

const suggestions = [
  {
    category: 'Accessories',
    name: 'Oversized Cat-Eye Frames',
    price: '$45 / 4 days',
    badge: '-10%',
    image:
      'https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&w=700&q=85',
  },
  {
    category: 'Footwear',
    name: 'Pointed Satin Pump',
    price: '$95 / 4 days',
    badge: '-15%',
    image:
      'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=700&q=85',
  },
  {
    category: 'Jewelry',
    name: '18k Sculptural Cuff',
    price: '$70 / 4 days',
    badge: '-10%',
    image:
      'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=700&q=85',
  },
  {
    category: 'Accessories',
    name: 'Monogram Silk Foulard',
    price: '$35 / 4 days',
    badge: '-15%',
    image:
      'https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?auto=format&fit=crop&w=700&q=85',
  },
];

const mobileTabs = [
  { icon: 'theater_comedy', label: 'Cosplay' },
  { icon: 'event', label: 'Events' },
  { icon: 'shopping_bag', label: 'Bag', active: true },
  { icon: 'auto_awesome', label: 'Extras' },
];

function toRentalItem(item, index) {
  const isSizedItem = item.name?.toLowerCase().includes('gown') || item.name?.toLowerCase().includes('dress');

  return {
    id: item.cartId || item.id || item.name || index,
    name: item.name,
    tone: item.meta || 'Curated Rental',
    badge: '-10%',
    image: item.image,
    rawCategory: item.rawCategory,
    category: item.category,
    quantity: item.quantity || 1,
    sizes: [
      {
        label: isSizedItem ? 'Size 38' : 'One Size',
        stock: 'In Stock',
        quantity: item.quantity || 1,
      },
    ],
    period: 'Oct 14 - Oct 18 (4 Days)',
    detailLabel: item.name?.toLowerCase().includes('bag') ? 'Status' : 'Protection',
    detail: item.name?.toLowerCase().includes('bag') ? 'Available for Delivery' : 'Premium Insurance Included',
    original: item.price ? item.price.replace('đ', 'đ') : '$200.00',
    total: item.price || '$180.00',
    addText: item.name?.toLowerCase().includes('bag') ? 'Add another unit' : 'Add another size',
  };
}

export default function Checkout({
  cartItems = [],
  onAddToCart,
  onRemoveFromCart,
  onUpdateCartQuantity,
  onNavigate,
}) {
  const { costumes } = useCostumes();
  const accessoriesSliderRef = useRef(null);
  const [voucherCode, setVoucherCode] = useState('');
  const [voucherApplied, setVoucherApplied] = useState(false);

  const handleApplyVoucher = () => {
    if (voucherCode.toUpperCase() === 'AURA20WELCOME') {
      setVoucherApplied(true);
    } else {
      alert('Voucher không hợp lệ hoặc đã hết hạn.');
    }
  };

  const scrollAccessories = (direction) => {
    const slider = accessoriesSliderRef.current;
    if (!slider) return;
    const amount = slider.clientWidth * 0.8;
    slider.scrollBy({ left: direction === 'left' ? -amount : amount, behavior: 'smooth' });
  };

  const rentalItems = cartItems.map(toRentalItem);
  const hasCartItems = rentalItems.length > 0;
  const isSingleRentalItem = rentalItems.length === 1;
  const selectedItemName = rentalItems[0]?.name || 'your selected piece';
  
  let summaryRows = isSingleRentalItem ? [...singleItemSummaryRows] : [...multiItemSummaryRows];
  let currentTotalDue = isSingleRentalItem ? 320 : 862;

  if (voucherApplied) {
    const discount = isSingleRentalItem ? 36 : 126; // 20% off rental subtotal
    summaryRows.push({ label: 'Voucher (AURA20WELCOME)', value: `-$${discount}.00`, accent: true });
    currentTotalDue -= discount;
  }
  
  const formattedTotalDue = `$${currentTotalDue}.00`;

  const selectedCategory = cartItems[0]?.rawCategory || cartItems[0]?.category || cartItems[0]?.meta;

  const relatedItems = useMemo(() => {
    if (!costumes || costumes.length === 0) return [];
    
    const cartIds = cartItems.map(item => item.id || item.cartId || item.name);
    let filtered = costumes.filter(c => 
      (c.rawCategory === selectedCategory || c.category === selectedCategory || c.meta === selectedCategory) 
      && !cartIds.includes(c.id) && !cartIds.includes(c.name)
    );
    
    if (filtered.length < 4) {
       const extra = costumes.filter(c => !cartIds.includes(c.id) && !cartIds.includes(c.name) && !filtered.some(f => f.id === c.id));
       filtered = [...filtered, ...extra];
    }
    
    return filtered.slice(0, 4).map(item => ({
       category: item.rawCategory || 'Costume',
       name: item.name,
       price: item.price,
       badge: '-10%',
       image: item.image,
       originalItem: item
    }));
  }, [costumes, cartItems, selectedCategory]);

  return (
    <div className="bg-[#f9f9f9] pb-20 text-[#1a1c1c] md:pb-0">
      <main className="mx-auto max-w-[1440px] px-5 pb-28 pt-36 md:px-20 md:pb-40">
        <header className="mb-16 animate-[fadeIn_0.8s_ease-out_forwards]">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <p className="mb-2 text-[12px] font-semibold uppercase tracking-[0.22em] text-[#99854e]">
                Your Selection
              </p>
              <h1 className="font-serif text-[40px] font-normal italic leading-tight md:text-[64px] mb-2">
                The Rental Edit
              </h1>
              <button
                onClick={() => onNavigate?.('orders')}
                className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-[#99854e] hover:text-black transition-colors"
              >
                <span className="material-symbols-outlined text-[16px]">receipt_long</span>
                Lịch sử đơn hàng
              </button>
            </div>
            <div className="flex items-center gap-4 text-[#5f5e5e]">
              <span className="text-[12px] font-semibold uppercase tracking-[0.15em]">Step 01 / Bag</span>
              <span className="h-px w-12 bg-[#cfc4c5]" />
              <span className="text-[12px] font-semibold uppercase tracking-[0.15em] opacity-40">
                Step 02 / Delivery
              </span>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 gap-16 lg:grid-cols-12">
          <section className="space-y-16 lg:col-span-8">
            {hasCartItems ? (
              rentalItems.map((item, index) => (
                <RentalItem
                  key={item.id}
                  item={item}
                  delay={index + 1}
                  onRemoveFromCart={onRemoveFromCart}
                  onUpdateCartQuantity={onUpdateCartQuantity}
                  onNavigate={onNavigate}
                />
              ))
            ) : (
              <EmptyCart onNavigate={onNavigate} />
            )}

            {hasCartItems && (
              <div className="border-t border-[#cfc4c5] pt-12">
                <div className="mb-8 flex items-end justify-between">
                  <div>
                    <h2 className="font-serif text-2xl font-normal uppercase italic">Phụ kiện đi kèm phổ biến</h2>
                    <p className="mt-2 text-sm text-[#5f5e5e]">Hoàn thiện outfit của bạn với các phụ kiện được yêu thích nhất.</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => scrollAccessories('left')}
                      className="flex h-10 w-10 shrink-0 items-center justify-center border border-[#cfc4c5]/40 transition hover:bg-[#99854e] hover:text-white"
                      aria-label="Cuộn trái"
                    >
                      <span className="material-symbols-outlined text-sm">west</span>
                    </button>
                    <button
                      onClick={() => scrollAccessories('right')}
                      className="flex h-10 w-10 shrink-0 items-center justify-center border border-[#cfc4c5]/40 transition hover:bg-[#99854e] hover:text-white"
                      aria-label="Cuộn phải"
                    >
                      <span className="material-symbols-outlined text-sm">east</span>
                    </button>
                  </div>
                </div>
                <div 
                  ref={accessoriesSliderRef}
                  className="no-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pb-4"
                >
                  {suggestions.map((item) => (
                    <div key={item.name} className="w-[calc(100%-1rem)] shrink-0 snap-start sm:w-[calc(50%-8px)] lg:w-[calc(25%-12px)]">
                      <SuggestionCard item={item} onAddToCart={onAddToCart} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>

          <aside className="lg:col-span-4">
            <div className="sticky top-32 border border-[#cfc4c5] bg-white p-8 shadow-sm">
              <h2 className="mb-8 font-serif text-[28px] font-normal uppercase tracking-tight">Summary</h2>
              {hasCartItems ? (
                <>
                  <div className="space-y-6">
                    {summaryRows.map((row) => (
                      <div
                        key={row.label}
                        className={`flex items-center justify-between gap-6 ${row.accent ? 'text-[#99854e]' : ''}`}
                      >
                        <span className="text-[12px] font-semibold uppercase tracking-[0.15em] text-current opacity-80">
                          {row.label}
                          {row.accent && (
                            <span className="material-symbols-outlined ml-1 cursor-help align-middle text-[14px]" title="Discount applied for renting 2 or more items simultaneously.">
                              help
                            </span>
                          )}
                        </span>
                        <span className="font-medium">{row.value}</span>
                      </div>
                    ))}

                    <div className="border-t border-black pt-8">
                      <div className="mb-8 flex items-baseline justify-between">
                        <span className="font-serif text-xl uppercase">Total Due</span>
                        <span className="font-serif text-[32px] tracking-tight">{formattedTotalDue}</span>
                      </div>
                      <button
                        onClick={() => onNavigate?.('payment')}
                        className="mb-2 w-full bg-black py-5 text-[12px] font-semibold uppercase tracking-[0.2em] text-white transition duration-500 hover:bg-[#99854e] hover:tracking-[0.3em]"
                      >
                        Proceed to Checkout
                      </button>
                      <button
                        onClick={() => onNavigate?.('chat')}
                        className="mb-4 w-full border border-black py-4 text-[11px] font-semibold uppercase tracking-[0.2em] transition hover:bg-black hover:text-white"
                      >
                        Liên hệ admin tư vấn giỏ hàng
                      </button>
                      <p className="text-center text-[11px] leading-relaxed text-[#999999]">
                        By clicking checkout, you agree to our{' '}
                        <a className="underline hover:text-black" href="#">
                          Rental Agreement
                        </a>{' '}
                        and{' '}
                        <a className="underline hover:text-black" href="#">
                          Terms of Service
                        </a>
                        .
                      </p>
                    </div>
                  </div>

                  <div className="mt-12 border-t border-[#cfc4c5] pt-8">
                    <label className="mb-4 block text-[10px] font-bold uppercase tracking-[0.2em]">Nhập mã giảm giá / Voucher</label>
                    <div className="flex">
                      <input 
                        type="text" 
                        value={voucherCode}
                        onChange={(e) => setVoucherCode(e.target.value)}
                        placeholder="Voucher code..." 
                        className="w-full border border-r-0 border-[#cfc4c5] bg-transparent px-4 py-3 text-sm focus:border-black focus:outline-none"
                      />
                      <button 
                        onClick={handleApplyVoucher}
                        className="bg-black px-6 py-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-[#99854e]"
                      >
                        Áp dụng
                      </button>
                    </div>
                    {voucherApplied && <p className="mt-2 text-xs italic text-[#99854e]">Voucher giảm 20% đã được áp dụng!</p>}
                  </div>
                </>
              ) : (
                <p className="text-sm leading-6 text-[#5f5e5e]">
                  Your bag is empty. Add a rental piece to see deposits, insurance, and delivery options.
                </p>
              )}
            </div>
          </aside>
        </div>

        {hasCartItems && (
          <section className="mt-32 md:mt-40">
            <div className="mb-12 flex items-baseline justify-between border-b border-[#cfc4c5] pb-4">
              <div>
                <h2 className="font-serif text-3xl font-normal uppercase italic">
                  Các bộ đồ liên quan
                </h2>
                {isSingleRentalItem && (
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-[#5f5e5e]">
                    Gợi ý thêm các trang phục cùng chủ đề với {selectedItemName}.
                  </p>
                )}
              </div>
              <a className="group flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.2em] text-[#5f5e5e]" href="#">
                Xem tất cả
                <span className="h-px w-12 bg-[#5f5e5e] transition-all group-hover:w-20" />
              </a>
            </div>
            <div className="grid grid-cols-2 gap-6 md:grid-cols-4 md:gap-8">
              {relatedItems.map((item) => (
                <SuggestionCard key={item.name} item={item} onAddToCart={onAddToCart} />
              ))}
            </div>
          </section>
        )}
      </main>

      <nav className="fixed bottom-0 left-0 z-[60] flex h-16 w-full items-center justify-around border-t border-[#cfc4c5] bg-[#f9f9f9] px-4 md:hidden">
        {mobileTabs.map((tab) => (
          <button
            key={tab.label}
            className={`flex flex-col items-center justify-center p-2 text-[#5f5e5e] ${
              tab.active ? 'rounded-lg bg-[#eeeeee] px-4 text-black' : ''
            }`}
          >
            <span
              className="material-symbols-outlined"
              style={tab.active ? { fontVariationSettings: "'FILL' 1" } : undefined}
            >
              {tab.icon}
            </span>
            <span className="mt-1 text-[10px] font-semibold uppercase tracking-[0.12em]">{tab.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}

function EmptyCart({ onNavigate }) {
  return (
    <div className="border border-[#cfc4c5] bg-white p-10 text-center md:p-16">
      <span className="material-symbols-outlined mb-6 block text-[44px] text-[#99854e]">shopping_bag</span>
      <h2 className="font-serif text-3xl font-normal uppercase italic">Your bag is empty</h2>
      <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-[#5f5e5e]">
        Add a statement rental piece first, then we will suggest matching accessories to complete the look.
      </p>
      <button
        onClick={() => onNavigate?.('home')}
        className="mt-8 bg-black px-8 py-4 text-[12px] font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-[#99854e]"
      >
        Browse Collection
      </button>
    </div>
  );
}

function RentalItem({ item, delay, onRemoveFromCart, onUpdateCartQuantity }) {
  return (
    <article
      className="group relative flex flex-col items-start gap-8 md:flex-row"
      style={{ animation: `fadeIn 0.8s ease-out ${delay * 0.1}s both` }}
    >
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-[#f7f7f7] md:w-72">
        <img
          className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
          src={item.image}
          alt={item.name}
        />
        <div className="absolute left-3 top-3 z-10 bg-[#99854e] px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-white">
          {item.badge}
        </div>
      </div>

      <div className="flex h-full flex-1 flex-col justify-between py-2">
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-6">
            <div className="flex-1">
              <h3 className="font-serif text-3xl font-normal uppercase tracking-tight">{item.name}</h3>
              <p className="mt-1 text-[12px] font-semibold uppercase tracking-[0.15em] text-[#5f5e5e]">{item.tone}</p>
              <p className="mt-1.5 text-xs text-[#99854e]">
                Quản lý bởi: <span className="font-bold">AuraFit Admin</span>
              </p>

              <div className="mt-4 space-y-4">
                {item.sizes.map((size) => (
                  <div key={size.label} className="flex items-center justify-between border-b border-[#cfc4c5] pb-3">
                    <div className="flex flex-col">
                      <span className="text-[12px] font-semibold uppercase tracking-[0.15em]">{size.label}</span>
                      <span className="text-[10px] font-medium text-[#99854e]">{size.stock}</span>
                    </div>
                    <QuantityControl
                      quantity={size.quantity}
                      onDecrease={() => onUpdateCartQuantity?.(item.id, item.quantity - 1)}
                      onIncrease={() => onUpdateCartQuantity?.(item.id, item.quantity + 1)}
                    />
                  </div>
                ))}

                <button className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#99854e] hover:underline">
                  <span className="material-symbols-outlined text-sm">add_circle</span>
                  {item.addText}
                </button>
              </div>
            </div>

            <button
              onClick={() => onRemoveFromCart?.(item.id)}
              className="text-black transition hover:text-[#ba1a1a]"
              aria-label="Remove item"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4">
            <div>
              <p className="text-[12px] font-semibold uppercase tracking-[0.15em] text-[#999999]">Rental Period</p>
              <p className="mt-1 italic">{item.period}</p>
            </div>
            <div>
              <p className="text-[12px] font-semibold uppercase tracking-[0.15em] text-[#999999]">
                {item.detailLabel}
              </p>
              <p className="mt-1">{item.detail}</p>
            </div>
          </div>
        </div>

        <div className="mt-8 flex items-end justify-between border-t border-[#cfc4c5] pt-8">
          <div className="space-y-1">
            <p className="text-[12px] font-semibold uppercase tracking-[0.15em] text-[#999999]">Item Total</p>
            <p className="font-serif text-3xl">
              <span className="mr-2 text-xl text-[#999999] line-through">{item.original}</span>
              {item.total}
            </p>
            {item.quantity > 1 && (
              <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#99854e]">
                Quantity x {item.quantity}
              </p>
            )}
          </div>
          <button className="border border-black px-4 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] transition hover:bg-black hover:text-white">
            Edit Dates
          </button>
        </div>
      </div>
    </article>
  );
}

function QuantityControl({ quantity, onDecrease, onIncrease }) {
  return (
    <div className="flex items-center gap-4 border border-[#cfc4c5] bg-[#f3f3f4] px-3 py-1">
      <button onClick={onDecrease} className="text-black transition hover:text-[#99854e]" aria-label="Decrease quantity">
        <span className="material-symbols-outlined text-sm">remove</span>
      </button>
      <span className="text-sm">{quantity}</span>
      <button onClick={onIncrease} className="text-black transition hover:text-[#99854e]" aria-label="Increase quantity">
        <span className="material-symbols-outlined text-sm">add</span>
      </button>
    </div>
  );
}

function SuggestionCard({ item, onAddToCart }) {
  return (
    <article className="group cursor-pointer">
      <div className="relative mb-4 aspect-[3/4] overflow-hidden bg-[#f7f7f7]">
        <img
          className="h-full w-full object-cover transition duration-700 group-hover:scale-110"
          src={item.image}
          alt={item.name}
        />
        <div className="absolute left-3 top-3 z-10 bg-[#99854e] px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-white">
          {item.badge}
        </div>
        <div className="absolute bottom-4 right-4 opacity-0 transition group-hover:opacity-100">
          <button
            onClick={() => onAddToCart?.(item.originalItem || item)}
            className="flex items-center justify-center bg-white p-2 text-black"
            aria-label={`Add ${item.name}`}
          >
            <span className="material-symbols-outlined">add</span>
          </button>
        </div>
      </div>
      <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#999999]">{item.category}</p>
      <h3 className="uppercase transition group-hover:text-[#99854e]">{item.name}</h3>
      <p className="mt-1">{item.price}</p>
    </article>
  );
}
