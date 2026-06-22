import { useMemo, useRef, useState } from 'react';
import CheckoutEmptyState from '../components/checkout/CheckoutEmptyState';
import CheckoutMobileTabs from '../components/checkout/CheckoutMobileTabs';
import CheckoutSuggestionCard from '../components/checkout/CheckoutSuggestionCard';
import CheckoutSummary from '../components/checkout/CheckoutSummary';
import RentalItemCard from '../components/checkout/RentalItemCard';
import { multiItemSummaryRows, singleItemSummaryRows, suggestions, toRentalItem } from '../components/checkout/checkoutData';
import { createOrder } from '../services/api';
import { useCostumes } from '../hooks/useCostumes';
import { useCheckoutStore } from '../store/useCheckoutStore';

const PAGE_SIZE = 20;

export default function Checkout({
  cartItems = [],
  currentUser,
  onAddToCart,
  onRemoveFromCart,
  onUpdateCartQuantity,
  onCheckoutSuccess,
  onNavigate,
}) {
  const { costumes } = useCostumes();
  const { setPendingOrderId } = useCheckoutStore();
  const accessoriesSliderRef = useRef(null);
  const [voucherCode, setVoucherCode] = useState('');
  const [voucherApplied, setVoucherApplied] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');
  const [deliveryInfo, setDeliveryInfo] = useState({
    receiverName: '',
    receiverPhone: '',
    deliveryAddress: '',
  });

  const rentalItems = cartItems.map(toRentalItem);
  const hasCartItems = rentalItems.length > 0;
  const isSingleRentalItem = rentalItems.length === 1;
  const selectedItemName = rentalItems[0]?.name || 'your selected piece';
  const selectedCategory = cartItems[0]?.rawCategory || cartItems[0]?.category || cartItems[0]?.meta;

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

  const relatedItems = useMemo(() => {
    if (!costumes || costumes.length === 0) return [];

    const cartIds = cartItems.map((item) => item.id || item.cartId || item.name);
    let filtered = costumes.filter(
      (costume) =>
        (costume.rawCategory === selectedCategory ||
          costume.category === selectedCategory ||
          costume.meta === selectedCategory) &&
        !cartIds.includes(costume.id) &&
        !cartIds.includes(costume.name)
    );

    if (filtered.length < 4) {
      const extra = costumes.filter(
        (costume) =>
          !cartIds.includes(costume.id) &&
          !cartIds.includes(costume.name) &&
          !filtered.some((current) => current.id === costume.id)
      );
      filtered = [...filtered, ...extra];
    }

    return filtered.slice(0, 4).map((item) => ({
      category: item.rawCategory || 'Costume',
      name: item.name,
      price: item.price,
      badge: '-10%',
      image: item.image,
      originalItem: item,
    }));
  }, [costumes, cartItems, selectedCategory]);

  const summaryRows = useMemo(() => {
    const rows = isSingleRentalItem ? [...singleItemSummaryRows] : [...multiItemSummaryRows];
    if (voucherApplied) {
      const discount = isSingleRentalItem ? 36 : 126;
      rows.push({ label: 'Voucher (AURA20WELCOME)', value: `-$${discount}.00`, accent: true });
    }
    return rows;
  }, [isSingleRentalItem, voucherApplied]);

  const formattedTotalDue = useMemo(() => {
    let totalDue = isSingleRentalItem ? 320 : 862;
    if (voucherApplied) {
      totalDue -= isSingleRentalItem ? 36 : 126;
    }
    return `$${totalDue}.00`;
  }, [isSingleRentalItem, voucherApplied]);

  const handleDeliveryChange = (event) => {
    const { name, value } = event.target;
    setDeliveryInfo((prev) => ({ ...prev, [name]: value }));
  };

  const isDeliveryValid = () => {
    return (
      deliveryInfo.receiverName.trim().length > 0 &&
      deliveryInfo.receiverPhone.trim().length > 0 &&
      deliveryInfo.deliveryAddress.trim().length > 0
    );
  };

  const handleProceedToCheckout = async () => {
    if (!currentUser?.id) {
      onNavigate?.('account');
      return;
    }

    if (!isDeliveryValid()) {
      setCheckoutError('Vui lòng điền đầy đủ thông tin giao hàng.');
      return;
    }

    setIsSubmitting(true);
    setCheckoutError('');

    try {
      const items = rentalItems.map((item) => ({
        sku: item.sku || item.id,
        quantity: 1,
        rentalStartDate: item.rentalStartDate || new Date().toISOString().split('T')[0],
        rentalEndDate: item.rentalEndDate || new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      }));

      const orderResponse = await createOrder({
        receiverName: deliveryInfo.receiverName,
        receiverPhone: deliveryInfo.receiverPhone,
        deliveryAddress: deliveryInfo.deliveryAddress,
        items,
      });

      setPendingOrderId(orderResponse.id);
      onCheckoutSuccess?.(orderResponse.id);
      onNavigate?.('payment');
    } catch (err) {
      setCheckoutError(err.message || 'Không thể tạo đơn hàng. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-[#f9f9f9] pb-20 text-[#1a1c1c] md:pb-0">
      <main className="mx-auto max-w-[1440px] px-5 pb-28 pt-36 md:px-20 md:pb-40">
        <header className="mb-16 animate-[fadeIn_0.8s_ease-out_forwards]">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <p className="mb-2 text-[12px] font-semibold uppercase tracking-[0.22em] text-[#99854e]">
                Your Selection
              </p>
              <h1 className="mb-2 font-serif text-[40px] font-normal italic leading-tight md:text-[64px]">
                The Rental Edit
              </h1>
              <button
                onClick={() => onNavigate?.('orders')}
                className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-[#99854e] transition-colors hover:text-black"
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
                <RentalItemCard
                  key={item.id}
                  item={item}
                  delay={index + 1}
                  onRemoveFromCart={onRemoveFromCart}
                  onUpdateCartQuantity={onUpdateCartQuantity}
                />
              ))
            ) : (
              <CheckoutEmptyState onNavigate={onNavigate} />
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
                      <CheckoutSuggestionCard item={item} onAddToCart={onAddToCart} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {hasCartItems && (
              <div className="border-t border-[#cfc4c5] pt-12">
                <h2 className="mb-6 font-serif text-2xl font-normal uppercase italic">Thông tin giao hàng</h2>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-[10px] font-bold uppercase tracking-[0.2em]">Tên người nhận *</label>
                    <input
                      type="text"
                      name="receiverName"
                      value={deliveryInfo.receiverName}
                      onChange={handleDeliveryChange}
                      placeholder="Họ và tên"
                      className="w-full border border-[#cfc4c5] bg-white px-4 py-3 text-sm focus:border-black focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[10px] font-bold uppercase tracking-[0.2em]">Số điện thoại *</label>
                    <input
                      type="tel"
                      name="receiverPhone"
                      value={deliveryInfo.receiverPhone}
                      onChange={handleDeliveryChange}
                      placeholder="0xxx xxx xxx"
                      className="w-full border border-[#cfc4c5] bg-white px-4 py-3 text-sm focus:border-black focus:outline-none"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="mb-1 block text-[10px] font-bold uppercase tracking-[0.2em]">Địa chỉ giao hàng *</label>
                    <input
                      type="text"
                      name="deliveryAddress"
                      value={deliveryInfo.deliveryAddress}
                      onChange={handleDeliveryChange}
                      placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành phố"
                      className="w-full border border-[#cfc4c5] bg-white px-4 py-3 text-sm focus:border-black focus:outline-none"
                    />
                  </div>
                </div>
                {checkoutError && (
                  <p className="mt-3 text-sm text-red-600">{checkoutError}</p>
                )}
                {!currentUser?.id && (
                  <p className="mt-3 text-sm text-[#99854e]">
                    Vui lòng{' '}
                    <button
                      onClick={() => onNavigate?.('account')}
                      className="underline hover:text-black"
                    >
                      đăng nhập
                    </button>{' '}
                    để tiếp tục thanh toán.
                  </p>
                )}
              </div>
            )}
          </section>

          <aside className="lg:col-span-4">
            <CheckoutSummary
              hasCartItems={hasCartItems}
              summaryRows={summaryRows}
              formattedTotalDue={formattedTotalDue}
              voucherCode={voucherCode}
              voucherApplied={voucherApplied}
              onVoucherCodeChange={setVoucherCode}
              onApplyVoucher={handleApplyVoucher}
              onNavigate={onNavigate}
              onProceedToCheckout={handleProceedToCheckout}
              isSubmitting={isSubmitting}
              checkoutError={checkoutError}
            />
          </aside>
        </div>

        {hasCartItems && (
          <section className="mt-32 md:mt-40">
            <div className="mb-12 flex items-baseline justify-between border-b border-[#cfc4c5] pb-4">
              <div>
                <h2 className="font-serif text-3xl font-normal uppercase italic">Các bộ đồ liên quan</h2>
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
                <CheckoutSuggestionCard key={item.name} item={item} onAddToCart={onAddToCart} />
              ))}
            </div>
          </section>
        )}
      </main>

      <CheckoutMobileTabs />
    </div>
  );
}
