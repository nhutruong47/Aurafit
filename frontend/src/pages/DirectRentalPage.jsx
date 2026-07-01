import { useState } from 'react';
import { useDirectOrderStore } from '../store/useDirectOrderStore';
import { useCheckoutStore } from '../store/useCheckoutStore';
import { createOrder } from '../services/rentalOrderService';
import { toAiStylistAttributionRequest } from '../services/interactionsService';
import { formatCurrency } from '../utils/formatCurrency';
import { adminContact } from '../utils/shopMock';

export default function DirectRentalPage({ currentUser, onNavigate }) {
  const { directItem, clearDirectItem } = useDirectOrderStore();
  const { setPendingOrderId } = useCheckoutStore();
  const [deliveryInfo, setDeliveryInfo] = useState({ receiverName: '', receiverPhone: '', deliveryAddress: '' });
  const [deliveryError, setDeliveryError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const handleDeliveryChange = (e) => {
    const { name, value } = e.target;
    setDeliveryInfo((prev) => ({ ...prev, [name]: value }));
    setDeliveryError('');
  };

  const isDeliveryValid =
    deliveryInfo.receiverName.trim().length > 0 &&
    deliveryInfo.receiverPhone.trim().length > 0 &&
    deliveryInfo.deliveryAddress.trim().length > 0;

  const rentalDays = (() => {
    if (!directItem?.rentalStartDate || !directItem?.rentalEndDate) return 1;
    const ms = new Date(directItem.rentalEndDate) - new Date(directItem.rentalStartDate);
    return Math.max(1, Math.round(ms / (1000 * 60 * 60 * 24)));
  })();

  const unitPrice = Number(directItem?.unitPrice ?? directItem?.priceValue ?? directItem?.price ?? 0);
  const subtotal = unitPrice * rentalDays;
  const deposit = Number(directItem?.depositValue ?? directItem?.deposit ?? Math.round(unitPrice * 0.5));
  const total = subtotal + deposit;

  const handleSubmit = async () => {
    if (!currentUser?.id) {
      onNavigate?.('account');
      return;
    }
    if (!isDeliveryValid) {
      setDeliveryError('Vui lòng điền đầy đủ thông tin giao hàng.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');

    try {
      const orderResponse = await createOrder({
        receiverName: deliveryInfo.receiverName,
        receiverPhone: deliveryInfo.receiverPhone,
        deliveryAddress: deliveryInfo.deliveryAddress,
        items: [
          {
            sku: directItem.sku,
            quantity: directItem.quantity || 1,
            rentalStartDate: directItem.rentalStartDate,
            rentalEndDate: directItem.rentalEndDate,
            aiStylistAttribution: toAiStylistAttributionRequest(directItem.attribution),
          },
        ],
      });

      setPendingOrderId(orderResponse.id);
      clearDirectItem();
      onNavigate?.('payment');
    } catch (err) {
      setSubmitError(err.message || 'Không thể tạo đơn hàng. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!directItem) {
    return (
      <div className="min-h-screen bg-[#f9f9f9] px-4 py-36 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <span className="material-symbols-outlined text-6xl text-[#cfc4c5]">shopping_bag</span>
          <h2 className="mt-6 font-serif text-3xl">Không có sản phẩm nào</h2>
          <p className="mt-3 text-[#5f5e5e]">Vui lòng chọn sản phẩm để thuê.</p>
          <button
            onClick={() => onNavigate?.('catalog')}
            className="mt-8 border border-black px-8 py-3 text-[12px] font-semibold uppercase tracking-[0.2em] transition hover:bg-black hover:text-white"
          >
            Xem bộ sưu tập
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#f9f9f9] pb-20 text-[#1a1c1c] md:pb-0">
      <main className="mx-auto max-w-[1100px] px-5 pb-28 pt-36 md:px-20 md:pb-40">
        <header className="mb-12">
          <button
            onClick={() => onNavigate?.('catalog')}
            className="mb-6 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#5f5e5e] transition hover:text-black"
          >
            <span className="material-symbols-outlined text-[16px]">west</span>
            Quay lại
          </button>
          <p className="mb-2 text-[12px] font-semibold uppercase tracking-[0.22em] text-[#99854e]">
            Thuê ngay
          </p>
          <h1 className="font-serif text-[40px] font-normal italic leading-tight md:text-[52px]">
            Xác nhận đơn thuê
          </h1>
        </header>

        <div className="grid grid-cols-1 gap-16 lg:grid-cols-12">
          {/* Left: Product Info + Delivery Form */}
          <div className="space-y-12 lg:col-span-7">
            {/* Product Card */}
            <div className="flex flex-col gap-6 border border-[#cfc4c5] bg-white p-6 md:flex-row md:p-8">
              <div className="aspect-[3/4] w-full overflow-hidden bg-[#f9f9f9] md:w-44">
                <img
                  src={directItem.image}
                  alt={directItem.name}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="flex flex-1 flex-col justify-between">
                <div>
                  <div className="mb-2 flex flex-wrap gap-2">
                    <span className="rounded-full bg-[#f0f0f0] px-3 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-black">
                      {directItem.rawCategory || directItem.category || 'Costume'}
                    </span>
                    {directItem.tag && (
                      <span className="rounded-full bg-[#99854e] px-3 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white">
                        {directItem.tag}
                      </span>
                    )}
                  </div>
                  <h2 className="font-serif text-2xl font-normal uppercase tracking-tight">{directItem.name}</h2>
                  {directItem.sku && (
                    <p className="mt-1 text-[11px] text-[#999]">
                      SKU: <span className="font-mono font-semibold">{directItem.sku}</span>
                    </p>
                  )}
                </div>

                {/* Rental Period */}
                <div className="mt-4 grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[#999]">Ngày nhận</p>
                    <p className="mt-1 text-sm font-medium">{directItem.rentalStartDate}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[#999]">Ngày trả</p>
                    <p className="mt-1 text-sm font-medium">{directItem.rentalEndDate}</p>
                  </div>
                </div>

                {/* Price Summary */}
                <div className="mt-6 border-t border-[#cfc4c5] pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-[#5f5e5e]">Tiền thuê ({rentalDays} ngày)</span>
                    <span className="font-medium">{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[#5f5e5e]">Tiền đặt cọc (Hoàn trả)</span>
                    <span className="font-medium">{formatCurrency(deposit)}</span>
                  </div>
                  <div className="flex justify-between border-t border-[#cfc4c5] pt-2 text-base font-semibold">
                    <span>Tổng thanh toán</span>
                    <span className="font-serif text-lg text-[#99854e]">{formatCurrency(total)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Admin Contact */}
            <div className="flex items-center justify-between border border-[#cfc4c5] bg-[#f9f9f9] p-5">
              <div className="flex items-center gap-4">
                <img
                  src={adminContact.avatar}
                  alt={adminContact.name}
                  className="h-12 w-12 rounded-full border border-[#cfc4c5]/50 object-cover"
                />
                <div>
                  <h4 className="font-serif text-base font-bold">{adminContact.name}</h4>
                  <div className="mt-0.5 flex items-center gap-2 text-xs text-[#5f5e5e]">
                    <span className="flex items-center text-[#99854e]">
                      <span className="material-symbols-outlined text-xs" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                      {adminContact.rating}
                    </span>
                    <span>•</span>
                    <span>{adminContact.address.split(',').slice(-2).join(',').trim()}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => onNavigate?.('chat')}
                className="border border-black px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.15em] text-black transition-all hover:bg-black hover:text-white"
              >
                Chatbot tư vấn
              </button>
            </div>

            {/* Delivery Form */}
            <div className="border-t border-[#cfc4c5] pt-10">
              <h2 className="mb-6 font-serif text-2xl font-normal uppercase italic">
                Thông tin giao hàng
              </h2>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-[10px] font-bold uppercase tracking-[0.2em]">
                    Tên người nhận *
                  </label>
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
                  <label className="mb-1 block text-[10px] font-bold uppercase tracking-[0.2em]">
                    Số điện thoại *
                  </label>
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
                  <label className="mb-1 block text-[10px] font-bold uppercase tracking-[0.2em]">
                    Địa chỉ giao hàng *
                  </label>
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
              {deliveryError && <p className="mt-3 text-sm text-red-600">{deliveryError}</p>}
              {!currentUser?.id && (
                <p className="mt-3 text-sm text-[#99854e]">
                  Vui lòng{' '}
                  <button onClick={() => onNavigate?.('account')} className="underline hover:text-black">
                    đăng nhập
                  </button>{' '}
                  để tiếp tục thanh toán.
                </p>
              )}
            </div>
          </div>

          {/* Right: Summary Sidebar */}
          <aside className="lg:col-span-5">
            <div className="sticky top-32 border border-[#cfc4c5] bg-white p-8 shadow-sm">
              <h2 className="mb-8 font-serif text-[24px] font-normal uppercase tracking-tight">Tóm tắt đơn thuê</h2>

              <div className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="uppercase tracking-[0.1em] text-[#5f5e5e]">Tiền thuê ({rentalDays} ngày)</span>
                  <span className="font-medium">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="uppercase tracking-[0.1em] text-[#5f5e5e]">Tiền đặt cọc (Hoàn trả)</span>
                  <span className="font-medium">{formatCurrency(deposit)}</span>
                </div>
              </div>

              <div className="border-t border-black pt-6">
                <div className="mb-8 flex items-baseline justify-between">
                  <span className="font-serif text-lg uppercase">Tổng thanh toán</span>
                  <span className="font-serif text-3xl">{formatCurrency(total)}</span>
                </div>

                {submitError && <p className="mb-3 text-sm text-red-600">{submitError}</p>}

                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="mb-3 w-full bg-black py-5 text-[12px] font-semibold uppercase tracking-[0.2em] text-white transition duration-500 hover:bg-[#99854e] hover:tracking-[0.3em] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSubmitting ? 'Đang xử lý...' : 'Thanh toán'}
                </button>

                <button
                  onClick={() => onNavigate?.('chat')}
                  className="w-full border border-black py-4 text-[11px] font-semibold uppercase tracking-[0.2em] transition hover:bg-black hover:text-white"
                >
                  Chatbot tư vấn
                </button>

                <p className="mt-4 text-center text-[11px] leading-relaxed text-[#999]">
                  Bằng việc nhấn thanh toán, bạn đồng ý với{' '}
                  <a className="underline hover:text-black" href="#">điều khoản thuê</a>
                  {' '}và{' '}
                  <a className="underline hover:text-black" href="#">điều khoản dịch vụ</a>.
                </p>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
