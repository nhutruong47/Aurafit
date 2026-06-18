import { useState, useEffect, useMemo } from 'react';
import {
  fetchStaffOrders,
  fetchStaffOrder,
  createPickupHandover,
  createReturnHandover
} from '../services/api';
import { formatCurrency } from '../utils/formatCurrency';

const mockOffers = [
  {
    id: 'OFF-101',
    customer: 'Khách hàng ẩn danh',
    productName: 'Naruto Uzumaki',
    originalPrice: '550.000 ₫',
    offerPrice: '500.000 ₫',
    status: 'pending',
    date: '2 phút trước',
    image: 'https://images.unsplash.com/photo-1606663886628-1064ee640b3c?auto=format&fit=crop&w=500&q=80',
  },
  {
    id: 'OFF-102',
    customer: 'Minh Tuấn',
    productName: 'The Gilded Gala Gown',
    originalPrice: '1.200.000 ₫',
    offerPrice: '900.000 ₫',
    status: 'pending',
    date: '1 giờ trước',
    image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=500&q=85',
  },
];

const sidebarLinks = [
  { id: 'overview', label: 'Tổng quan', icon: 'dashboard' },
  { id: 'offers', label: 'Đề xuất thuê', icon: 'local_offer' },
  { id: 'orders', label: 'Quản lý Đơn hàng', icon: 'receipt_long' },
  { id: 'inventory', label: 'Kho hàng', icon: 'inventory_2' },
];

const returnStatuses = [
  { value: 'RETURNED', label: 'Bình thường', tone: 'text-green-600' },
  { value: 'DAMAGED', label: 'Hư hỏng', tone: 'text-amber-600' },
  { value: 'LOST', label: 'Bị mất', tone: 'text-red-600' },
];

const statusNames = {
  PENDING_PAYMENT: 'Chờ thanh toán',
  PENDING_CONFIRMATION: 'Chờ xác nhận',
  PICKED_UP: 'Đang vận chuyển',
  RETURNED: 'Hoàn thành',
};

const statusTone = {
  PENDING_PAYMENT: 'border-[#a15c00]/30 bg-[#fff7df] text-[#7a4d00]',
  PENDING_CONFIRMATION: 'border-[#99854e]/30 bg-[#f8f4e8] text-[#725f2f]',
  PICKED_UP: 'border-[#1c6b9a]/30 bg-[#e8f4fb] text-[#165276]',
  RETURNED: 'border-[#087b3f]/30 bg-[#e8f7ee] text-[#087b3f]',
};

export default function SellerDashboard({ currentUser, onNavigate }) {
  const [activeTab, setActiveTab] = useState('orders');
  const [offers, setOffers] = useState(mockOffers);

  // Order management state
  const [orders, setOrders] = useState([]);
  const [activeOrderId, setActiveOrderId] = useState(null);
  const [activeOrder, setActiveOrder] = useState(null);
  const [mode, setMode] = useState('PICKUP');
  const [selectedDetailId, setSelectedDetailId] = useState('');
  const [returnStatus, setReturnStatus] = useState('RETURNED');
  const [handoverImageUrl, setHandoverImageUrl] = useState('');
  const [note, setNote] = useState('');
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const selectedDetail = useMemo(
    () => activeOrder?.details?.find((detail) => String(detail.id) === String(selectedDetailId)),
    [activeOrder, selectedDetailId]
  );

  const loadOrders = async (preferredOrderId = null) => {
    setIsLoadingOrders(true);
    setError('');
    try {
      const orderList = await fetchStaffOrders();
      setOrders(orderList);
      const nextOrderId = preferredOrderId || activeOrderId || orderList[0]?.id || null;
      setActiveOrderId(nextOrderId);
      if (nextOrderId) {
        const order = await fetchStaffOrder(nextOrderId);
        setActiveOrder(order);
        setSelectedDetailId(order.details?.[0]?.id || '');
      } else {
        setActiveOrder(null);
        setSelectedDetailId('');
      }
    } catch (err) {
      setError(err.message || 'Không thể tải danh sách đơn hàng.');
    } finally {
      setIsLoadingOrders(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'orders') {
      loadOrders();
    }
  }, [activeTab]);

  const handleOpenOrder = async (orderId) => {
    setActiveOrderId(orderId);
    setError('');
    setMessage('');
    try {
      const order = await fetchStaffOrder(orderId);
      setActiveOrder(order);
      setSelectedDetailId(order.details?.[0]?.id || '');
    } catch (err) {
      setError(err.message || 'Không thể tải chi tiết đơn hàng.');
    }
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => setHandoverImageUrl(String(reader.result || ''));
    reader.readAsDataURL(file);
  };

  const handleOrderSubmit = async (event) => {
    event.preventDefault();
    if (!activeOrder || !selectedDetailId) return;

    setIsSubmitting(true);
    setError('');
    setMessage('');

    // Bán giao/nhận trả cần Staff ID, nếu chủ shop chưa có quyền STAFF ta sử dụng ID 2 của nhân viên demo
    const staffId = currentUser?.role?.includes('STAFF') || currentUser?.role?.includes('ADMIN')
      ? currentUser.id
      : 2;

    const payload = {
      staffUserId: staffId,
      rentalOrderDetailId: Number(selectedDetailId),
      handoverImageUrl: handoverImageUrl || 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=500&q=85',
      note,
      returnStatus: mode === 'RETURN' ? returnStatus : null,
    };

    try {
      const updatedOrder =
        mode === 'PICKUP'
          ? await createPickupHandover(activeOrder.id, payload)
          : await createReturnHandover(activeOrder.id, payload);

      setActiveOrder(updatedOrder);
      setSelectedDetailId(updatedOrder.details?.[0]?.id || '');
      setHandoverImageUrl('');
      setNote('');
      setMessage(mode === 'PICKUP' ? 'Đã xác nhận bàn giao đồ cho khách.' : 'Đã nhận lại đồ thành công.');
      await loadOrders(updatedOrder.id);
    } catch (err) {
      setError(err.message || 'Không thể cập nhật tiến trình đơn hàng.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAccept = (id) => {
    setOffers((currentOffers) =>
      currentOffers.map((offer) => (offer.id === id ? { ...offer, status: 'accepted' } : offer))
    );
  };

  const handleDecline = (id) => {
    setOffers((currentOffers) =>
      currentOffers.map((offer) => (offer.id === id ? { ...offer, status: 'declined' } : offer))
    );
  };

  return (
    <div className="flex min-h-screen bg-[#f3f3f4]">
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 bg-black text-white flex flex-col">
        <div className="p-6 border-b border-white/10">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#99854e]">Kênh Người Bán</h2>
          <h1 className="mt-2 font-serif text-2xl tracking-tight">AuraFit Shop</h1>
        </div>
        <nav className="flex-1 py-6">
          <ul className="space-y-1 px-3">
            {sidebarLinks.map((link) => (
              <li key={link.id}>
                <button
                  onClick={() => setActiveTab(link.id)}
                  className={`flex w-full items-center gap-4 rounded-md px-4 py-3 text-sm transition-colors ${
                    activeTab === link.id
                      ? 'bg-[#99854e] text-white font-medium'
                      : 'text-white/70 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <span className="material-symbols-outlined text-[20px]">{link.icon}</span>
                  <span>{link.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-8 lg:p-12">
        {/* TAB OVERVIEW */}
        {activeTab === 'overview' && (
          <div>
            <h2 className="mb-8 font-serif text-3xl">Tổng quan</h2>
            <div className="grid gap-4 md:grid-cols-3">
              <Metric label="Đề xuất chờ xử lý" value={offers.filter((offer) => offer.status === 'pending').length} />
              <Metric label="Đề xuất đã nhận" value={offers.filter((offer) => offer.status === 'accepted').length} />
              <Metric label="Sản phẩm trong kho" value="24" />
            </div>
          </div>
        )}

        {/* TAB OFFERS */}
        {activeTab === 'offers' && (
          <div>
            <h2 className="mb-2 font-serif text-3xl">Đề xuất thuê</h2>
            <p className="mb-8 text-sm text-[#5f5e5e]">Quản lý và duyệt các đề xuất giá từ khách hàng.</p>

            <div className="space-y-4">
              {offers.map((offer) => (
                <div
                  key={offer.id}
                  className="flex flex-col items-center justify-between gap-6 border border-[#cfc4c5] bg-white p-6 md:flex-row"
                >
                  <div className="flex flex-1 items-center gap-6">
                    <div className="h-20 w-16 flex-shrink-0 bg-[#eeeeee]">
                      <img src={offer.image} alt={offer.productName} className="h-full w-full object-cover" />
                    </div>
                    <div>
                      <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-[#999999]">
                        Từ: {offer.customer} • {offer.date}
                      </p>
                      <h3 className="text-base font-medium text-black">{offer.productName}</h3>
                      <div className="mt-2 flex items-center gap-3">
                        <span className="text-sm text-[#999999] line-through">{offer.originalPrice}</span>
                        <span className="text-lg font-bold text-[#99854e]">{offer.offerPrice}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex w-full items-center gap-3 md:w-auto">
                    {offer.status === 'pending' ? (
                      <>
                        <button
                          onClick={() => handleDecline(offer.id)}
                          className="flex-1 border border-black px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.15em] text-black transition hover:bg-black hover:text-white md:flex-none"
                        >
                          Từ chối
                        </button>
                        <button
                          onClick={() => handleAccept(offer.id)}
                          className="flex-1 border border-[#99854e] bg-[#99854e] px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.15em] text-white transition hover:border-black hover:bg-black md:flex-none"
                        >
                          Chấp nhận
                        </button>
                      </>
                    ) : (
                      <span
                        className={`px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.15em] ${
                          offer.status === 'accepted' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {offer.status === 'accepted' ? 'Đã chấp nhận' : 'Đã từ chối'}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB ORDERS (REAL ORDER MANAGEMENT) */}
        {activeTab === 'orders' && (
          <div>
            <div className="mb-8 border-b border-[#cfc4c5] pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <h2 className="font-serif text-3xl">Quản lý Đơn hàng</h2>
                <p className="text-sm text-[#5f5e5e] mt-1">Cập nhật tiến trình bàn giao (PICKUP) và nhận trả (RETURN) cho từng sản phẩm.</p>
              </div>
              <button
                onClick={() => loadOrders(activeOrderId)}
                className="border border-black px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.15em] text-black transition hover:bg-black hover:text-white"
              >
                Tải lại
              </button>
            </div>

            {error && (
              <div className="mb-6 border border-red-200 bg-red-50 text-red-700 px-4 py-3 text-sm font-medium">
                {error}
              </div>
            )}
            {message && (
              <div className="mb-6 border border-green-200 bg-green-50 text-green-700 px-4 py-3 text-sm font-medium">
                {message}
              </div>
            )}

            {isLoadingOrders ? (
              <div className="grid gap-4 lg:grid-cols-12">
                <div className="animate-pulse border border-[#cfc4c5] bg-white h-[400px] lg:col-span-3" />
                <div className="animate-pulse border border-[#cfc4c5] bg-white h-[400px] lg:col-span-6" />
                <div className="animate-pulse border border-[#cfc4c5] bg-white h-[400px] lg:col-span-3" />
              </div>
            ) : (
              <div className="grid gap-6 lg:grid-cols-12">
                {/* Orders List Side */}
                <div className="border border-[#cfc4c5] bg-white lg:col-span-3">
                  <div className="border-b border-[#cfc4c5] px-4 py-3 bg-[#f9f9f9]">
                    <h3 className="text-xs font-semibold uppercase tracking-wider">Đơn hàng của shop</h3>
                  </div>
                  <div className="max-h-[600px] overflow-y-auto divide-y divide-[#e1dddc]">
                    {orders.map((order) => (
                      <button
                        key={order.id}
                        onClick={() => handleOpenOrder(order.id)}
                        className={`w-full p-4 text-left transition hover:bg-[#f8f4e8] ${
                          order.id === activeOrderId ? 'bg-[#f8f4e8]' : 'bg-white'
                        }`}
                      >
                        <div className="mb-2 flex items-center justify-between">
                          <span className="text-xs font-bold">RO-{String(order.id).padStart(4, '0')}</span>
                          <span className={`px-2 py-0.5 text-[9px] border font-bold uppercase ${statusTone[order.status] || 'border-gray-200 bg-white text-gray-500'}`}>
                            {statusNames[order.status] || order.status}
                          </span>
                        </div>
                        <p className="text-sm font-medium">{order.customerName}</p>
                        <p className="mt-1 text-xs text-[#5f5e5e] truncate">
                          {order.details?.[0]?.costumeName || 'Chưa có sản phẩm'}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Selected Order Detail */}
                <div className="lg:col-span-6 space-y-6">
                  {activeOrder ? (
                    <>
                      <div className="border border-[#cfc4c5] bg-white p-6">
                        <div className="mb-6 flex flex-col sm:flex-row sm:items-start justify-between border-b border-[#e1dddc] pb-4 gap-4">
                          <div>
                            <div className="flex items-center gap-3">
                              <h3 className="font-serif text-2xl font-bold">RO-{String(activeOrder.id).padStart(4, '0')}</h3>
                              <span className={`px-2 py-0.5 text-[9px] border font-bold uppercase ${statusTone[activeOrder.status] || 'border-gray-200 bg-white text-gray-500'}`}>
                                {statusNames[activeOrder.status] || activeOrder.status}
                              </span>
                            </div>
                            <p className="text-xs text-[#5f5e5e] mt-1">
                              {activeOrder.customerName} • {activeOrder.customerEmail} • {activeOrder.customerPhone}
                            </p>
                          </div>
                          <div className="text-right text-xs">
                            <p>Phí thuê: <strong className="text-sm text-black">{formatCurrency(activeOrder.totalRentalFee || 0)}</strong></p>
                            <p className="mt-1">Tiền cọc: <strong className="text-sm text-black">{formatCurrency(activeOrder.totalDeposit || 0)}</strong></p>
                          </div>
                        </div>

                        <div className="space-y-4">
                          {activeOrder.details?.map((detail) => (
                            <div
                              key={detail.id}
                              onClick={() => setSelectedDetailId(detail.id)}
                              className={`grid gap-4 border p-4 sm:grid-cols-[80px_1fr] cursor-pointer transition ${
                                String(selectedDetailId) === String(detail.id) ? 'border-[#99854e] bg-[#f8f4e8]' : 'border-[#e1dddc] hover:border-black'
                              }`}
                            >
                              <div className="aspect-[3/4] overflow-hidden bg-[#eeeeee]">
                                <img src={detail.costumeImageUrl} alt={detail.costumeName} className="h-full w-full object-cover" />
                              </div>
                              <div className="flex flex-col justify-between">
                                <div>
                                  <h4 className="font-medium text-sm text-black">{detail.costumeName}</h4>
                                  <p className="text-[10px] text-[#5f5e5e] mt-0.5">{detail.skuCode} | Size {detail.size}</p>
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-[11px] mt-2 border-t border-[#cfc4c5]/20 pt-2">
                                  <div><span className="text-[#999999]">Sản phẩm:</span> <strong>{detail.itemStatus}</strong></div>
                                  <div><span className="text-[#999999]">Trả đồ:</span> <strong>{detail.returnStatus || 'Chưa trả'}</strong></div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Handovers History */}
                      <div className="border border-[#cfc4c5] bg-white p-6">
                        <h3 className="text-xs font-semibold uppercase tracking-wider mb-4 border-b border-[#cfc4c5] pb-2">Lịch sử ảnh & Ghi chú bàn giao</h3>
                        <div className="space-y-4 divide-y divide-[#e1dddc]">
                          {activeOrder.handovers?.length ? (
                            activeOrder.handovers.map((handover, idx) => (
                              <div key={handover.id} className={`grid gap-4 pt-4 first:pt-0 sm:grid-cols-[80px_1fr]`}>
                                <div className="aspect-square overflow-hidden bg-[#eeeeee] border border-gray-200">
                                  <img src={handover.handoverImageUrl} alt="Handover" className="h-full w-full object-cover" />
                                </div>
                                <div>
                                  <div className="flex flex-wrap items-center gap-2 mb-1">
                                    <span className="border border-black px-1.5 py-0.5 text-[8px] font-bold uppercase">
                                      {handover.type}
                                    </span>
                                    {handover.returnStatus && (
                                      <span className="bg-green-50 text-green-700 border border-green-200 px-1.5 py-0.5 text-[8px] font-bold uppercase">
                                        {handover.returnStatus}
                                      </span>
                                    )}
                                    <span className="text-[10px] text-[#999999]">
                                      {new Date(handover.createdAt).toLocaleString('vi-VN')}
                                    </span>
                                  </div>
                                  <p className="text-xs font-semibold text-black">{handover.costumeName} ({handover.skuCode})</p>
                                  <p className="text-[10px] text-[#5f5e5e] mt-0.5">Xử lý bởi: {handover.staffName}</p>
                                  {handover.note && <p className="mt-2 text-xs bg-[#f9f9f9] p-2 border border-[#cfc4c5]/40 leading-relaxed">"{handover.note}"</p>}
                                </div>
                              </div>
                            ))
                          ) : (
                            <p className="text-xs text-[#999999] py-4 italic">Chưa có ảnh bàn giao hoặc nhận trả cho đơn hàng này.</p>
                          )}
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="border border-[#cfc4c5] bg-white p-10 text-center text-[#999999] italic">
                      Vui lòng chọn một đơn hàng để xem chi tiết.
                    </div>
                  )}
                </div>

                {/* Handover Action Panel */}
                <div className="border border-[#cfc4c5] bg-white p-6 lg:col-span-3 h-fit">
                  <h3 className="text-xs font-semibold uppercase tracking-wider mb-4 border-b border-[#cfc4c5] pb-2">Cập nhật tiến độ</h3>
                  
                  {activeOrder && selectedDetail ? (
                    <form className="space-y-4" onSubmit={handleOrderSubmit}>
                      {/* Mode Switch */}
                      <div className="grid grid-cols-2 border border-[#cfc4c5] bg-[#f3f3f4] p-1">
                        {['PICKUP', 'RETURN'].map((v) => (
                          <button
                            key={v}
                            type="button"
                            onClick={() => setMode(v)}
                            className={`py-2 text-[10px] font-bold uppercase tracking-wider transition-colors ${
                              mode === v ? 'bg-black text-white' : 'text-[#5f5e5e] hover:text-black'
                            }`}
                          >
                            {v === 'PICKUP' ? 'Bàn giao (Giao)' : 'Nhận trả (Nhận)'}
                          </button>
                        ))}
                      </div>

                      {/* Selected Product Info */}
                      <div className="border border-[#e1dddc] bg-[#f9f9f9] p-3 text-xs">
                        <span className="text-[#999999] block mb-1">Sản phẩm đang chọn:</span>
                        <strong className="text-black block">{selectedDetail.costumeName}</strong>
                        <span className="text-[#5f5e5e] block mt-1">{selectedDetail.skuCode} | Size {selectedDetail.size}</span>
                      </div>

                      {/* Return Status (Only for RETURN Mode) */}
                      {mode === 'RETURN' && (
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold uppercase tracking-wider text-[#999999]">Tình trạng trả đồ</label>
                          <div className="space-y-2">
                            {returnStatuses.map((st) => (
                              <label key={st.value} className="flex cursor-pointer items-center justify-between border border-[#cfc4c5] p-2 bg-white hover:border-black transition">
                                <span className={`text-[10px] font-bold uppercase ${st.tone}`}>{st.label}</span>
                                <input
                                  checked={returnStatus === st.value}
                                  onChange={() => setReturnStatus(st.value)}
                                  type="radio"
                                  name="returnStatus"
                                  className="text-[#99854e] focus:ring-[#99854e]"
                                />
                              </label>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Photo Upload / Input */}
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-[#999999] block">Ảnh đối chứng / Bàn giao</label>
                        <input
                          value={handoverImageUrl.startsWith('data:') ? '' : handoverImageUrl}
                          onChange={(e) => setHandoverImageUrl(e.target.value)}
                          placeholder="Link ảnh minh họa..."
                          className="w-full border border-[#cfc4c5] bg-[#f9f9f9] px-3 py-2 text-xs outline-none focus:border-[#99854e] transition"
                        />
                        <input
                          onChange={handleFileChange}
                          className="block w-full text-xs file:mr-2 file:border-0 file:bg-black file:px-3 file:py-2 file:text-[9px] file:font-semibold file:uppercase file:text-white file:cursor-pointer"
                          type="file"
                          accept="image/*"
                        />
                        {handoverImageUrl && (
                          <div className="mt-2 aspect-[4/3] w-full overflow-hidden border border-[#cfc4c5] bg-[#eeeeee]">
                            <img src={handoverImageUrl} alt="Preview" className="h-full w-full object-cover" />
                          </div>
                        )}
                      </div>

                      {/* Note */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-[#999999] block">Ghi chú</label>
                        <textarea
                          value={note}
                          onChange={(e) => setNote(e.target.value)}
                          placeholder="Kiểm tra phụ kiện, tình trạng vải..."
                          className="w-full border border-[#cfc4c5] bg-[#f9f9f9] p-3 text-xs outline-none focus:border-[#99854e] transition min-h-[80px]"
                        />
                      </div>

                      {/* Submit Button */}
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-black py-4 text-[10px] font-bold uppercase tracking-widest text-white transition hover:bg-[#99854e] disabled:bg-[#777777] disabled:cursor-not-allowed"
                      >
                        {isSubmitting ? 'ĐANG LƯU...' : mode === 'PICKUP' ? 'XÁC NHẬN BÀN GIAO' : 'XÁC NHẬN NHẬN TRẢ'}
                      </button>
                    </form>
                  ) : (
                    <p className="text-xs text-[#999999] italic">Chọn sản phẩm của đơn hàng để cập nhật trạng thái.</p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB INVENTORY */}
        {activeTab === 'inventory' && (
          <div>
            <h2 className="mb-8 font-serif text-3xl">Kho hàng</h2>
            <p className="text-[#5f5e5e]">Tính năng đang được phát triển...</p>
          </div>
        )}
      </main>
    </div>
  );
}

function Metric({ label, value }) {
  return (
    <div className="border border-[#cfc4c5] bg-white p-6">
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#999999]">{label}</p>
      <p className="mt-4 font-serif text-4xl italic">{value}</p>
    </div>
  );
}
