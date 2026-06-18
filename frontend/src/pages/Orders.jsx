import { useState, useEffect, useMemo } from 'react';
import { fetchStaffOrders } from '../services/api';
import { formatCurrency } from '../utils/formatCurrency';

const mapStatus = (status) => {
  switch (status) {
    case 'PENDING_PAYMENT':
      return { text: 'Chờ thanh toán', color: 'text-[#a15c00]' };
    case 'PENDING_CONFIRMATION':
      return { text: 'Chờ xác nhận', color: 'text-[#99854e]' };
    case 'PICKED_UP':
      return { text: 'Đang vận chuyển', color: 'text-[#1c6b9a]' };
    case 'RETURNED':
      return { text: 'Hoàn thành', color: 'text-[#087b3f]' };
    case 'CANCELLED':
    case 'CANCELED':
      return { text: 'Đã hủy', color: 'text-gray-400' };
    default:
      return { text: status || 'Chờ xác nhận', color: 'text-gray-500' };
  }
};

const getTimeline = (order) => {
  const baseDate = new Date(order.rentalDate || order.createdAt || Date.now());
  const formatDate = (date, daysOffset, timeStr) => {
    const d = new Date(date);
    d.setDate(d.getDate() + daysOffset);
    return `${d.getDate()} Thg ${d.getMonth() + 1}, ${timeStr}`;
  };

  const timeline = [
    { 
      status: 'Đã xác nhận', 
      date: formatDate(baseDate, 0, '09:00'), 
      icon: 'receipt_long', 
      completed: true 
    }
  ];

  if (order.status === 'CANCELLED' || order.status === 'CANCELED' || order.status === 'Đã hủy') {
    timeline[0].completed = true;
    timeline.push({
      status: 'Đã hủy',
      date: formatDate(baseDate, 0, '10:30'),
      icon: 'cancel',
      completed: true,
      current: true,
      isCanceled: true
    });
    return timeline;
  }

  // Stage 2: Preparing
  const isPreparing = order.status === 'PENDING_CONFIRMATION' || order.status === 'PENDING_PAYMENT';
  const isPreparingDone = ['PENDING_CONFIRMATION', 'PICKED_UP', 'RETURNED'].includes(order.status);
  timeline.push({
    status: 'Đang chuẩn bị',
    date: formatDate(baseDate, 0, '14:30'),
    icon: 'inventory_2',
    completed: isPreparingDone,
    current: isPreparing
  });

  // Stage 3: Delivering
  const isDelivering = order.status === 'PICKED_UP';
  const isDeliveringDone = ['PICKED_UP', 'RETURNED'].includes(order.status);
  timeline.push({
    status: 'Đang vận chuyển',
    date: formatDate(baseDate, 1, '08:15'),
    icon: 'local_shipping',
    completed: isDeliveringDone,
    current: isDelivering
  });

  // Stage 4: Completed
  const isCompleted = order.status === 'RETURNED';
  timeline.push({
    status: 'Hoàn thành',
    date: isCompleted ? formatDate(baseDate, 3, '17:00') : `Dự kiến ${formatDate(baseDate, 2, '18:00').split(',')[0]}`,
    icon: 'check_circle',
    completed: isCompleted,
    current: isCompleted
  });

  return timeline;
};

export default function Orders({ currentUser, onNavigate }) {
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const targetEmail = currentUser?.email || 'customer@aurafit.vn'; // Mặc định cho tài khoản demo khách

  const loadOrders = async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await fetchStaffOrders();
      // Lọc các đơn hàng thuộc về user hiện tại
      const userOrders = data.filter(order => order.customerEmail === targetEmail);
      setOrders(userOrders);
      if (userOrders.length > 0) {
        // Giữ lại lựa chọn đơn cũ nếu vẫn tồn tại trong danh sách mới
        const currentSelected = selectedOrder ? userOrders.find(o => o.id === selectedOrder.id) : null;
        setSelectedOrder(currentSelected || userOrders[0]);
      } else {
        setSelectedOrder(null);
      }
    } catch (err) {
      setError(err.message || 'Không thể tải danh sách lịch sử đơn hàng.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [targetEmail]);

  return (
    <div className="min-h-screen bg-[#f9f9f9] text-[#1a1c1c]">
      <main className="mx-auto max-w-[1440px] px-5 py-16 md:px-20 lg:py-24">
        <div className="mb-12 flex flex-col sm:flex-row sm:items-end justify-between border-b border-[#cfc4c5] pb-6 gap-4">
          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.3em] text-[#99854e]">Tài khoản của bạn</p>
            <h1 className="font-serif text-4xl font-normal italic md:text-5xl">Lịch sử đơn hàng</h1>
          </div>
          <div className="flex gap-4">
            <button 
              onClick={loadOrders}
              className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#99854e] hover:text-black transition"
            >
              <span className="material-symbols-outlined text-[16px]">refresh</span>
              Tải lại
            </button>
            <button 
              onClick={() => onNavigate?.('home')}
              className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#5f5e5e] hover:text-black transition"
            >
              <span className="material-symbols-outlined text-[14px]">arrow_back</span>
              Tiếp tục mua sắm
            </button>
          </div>
        </div>

        {error && (
          <p className="border border-[#ba1a1a]/30 bg-[#ffdad6] px-4 py-3 text-sm font-medium text-[#93000a] mb-8">
            {error}
          </p>
        )}

        {isLoading ? (
          <div className="grid gap-4 lg:grid-cols-12">
            <div className="animate-pulse border border-[#cfc4c5] bg-white h-[400px] lg:col-span-5" />
            <div className="animate-pulse border border-[#cfc4c5] bg-white h-[400px] lg:col-span-7" />
          </div>
        ) : orders.length === 0 ? (
          <div className="border border-[#cfc4c5] bg-white p-12 text-center text-sm text-[#5f5e5e] italic">
            Bạn chưa có đơn đặt hàng nào trong lịch sử.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-20">
            {/* Order List */}
            <div className="lg:col-span-5">
              <h2 className="mb-6 text-[12px] font-semibold uppercase tracking-[0.2em]">Tất cả đơn hàng</h2>
              <div className="space-y-4">
                {orders.map((order) => {
                  const statusInfo = mapStatus(order.status);
                  return (
                    <div 
                      key={order.id}
                      onClick={() => setSelectedOrder(order)}
                      className={`flex cursor-pointer items-center justify-between border bg-white p-5 transition duration-300 hover:border-[#99854e] hover:shadow-md ${selectedOrder?.id === order.id ? 'border-[#99854e] shadow-md' : 'border-[#cfc4c5]'}`}
                    >
                      <div className="flex gap-4">
                        <div className="h-16 w-12 shrink-0 bg-[#eeeeee] overflow-hidden">
                          <img src={order.details?.[0]?.costumeImageUrl || 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=200&q=80'} alt="Product" className="h-full w-full object-cover" />
                        </div>
                        <div className="flex flex-col justify-center">
                          <p className="text-[11px] font-bold uppercase tracking-widest">RO-{String(order.id).padStart(4, '0')}</p>
                          <p className="mt-1 text-xs text-[#5f5e5e]">{new Date(order.rentalDate || order.createdAt).toLocaleDateString('vi-VN')}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-[11px] font-bold uppercase tracking-widest ${statusInfo.color}`}>{statusInfo.text}</p>
                        <p className="mt-1 font-serif text-lg">{formatCurrency(order.totalRentalFee || 0)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Tracking Details */}
            <div className="lg:col-span-7">
              {selectedOrder && (
                <div className="sticky top-28 border border-[#cfc4c5] bg-white p-8 md:p-10">
                  <div className="mb-8 flex items-baseline justify-between border-b border-[#cfc4c5] pb-6">
                    <h2 className="font-serif text-3xl font-normal">Chi tiết: RO-{String(selectedOrder.id).padStart(4, '0')}</h2>
                    <span className={`text-[12px] font-bold uppercase tracking-[0.2em] ${mapStatus(selectedOrder.status).color}`}>
                      {mapStatus(selectedOrder.status).text}
                    </span>
                  </div>

                  {selectedOrder.status === 'OVERDUE' && (
                    <div className="mb-8 border border-[#ba1a1a]/30 bg-[#ffdad6] p-5 text-[#93000a]">
                      <div className="flex items-start gap-4">
                        <span className="material-symbols-outlined mt-0.5 text-[20px]">error</span>
                        <div>
                          <p className="text-[11px] font-bold uppercase tracking-[0.15em]">Yêu cầu hoàn trả gấp</p>
                          <p className="mt-2 text-sm leading-6">
                            Đơn hàng của bạn đã vượt quá thời gian thuê quy định. Vui lòng hoàn trả sản phẩm ngay lập tức để tránh phát sinh thêm phí phạt.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="mb-12">
                    <h3 className="mb-6 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#5f5e5e]">Tiến trình theo dõi</h3>
                    <div className="relative pl-10">
                      {/* Timeline vertical line */}
                      <div className="absolute left-[20px] top-4 h-[calc(100%-2rem)] w-px bg-[#cfc4c5]"></div>
                      
                      <div className="space-y-8">
                        {getTimeline(selectedOrder).map((event, index) => {
                          const isPast = event.completed && !event.current;
                          const isCanceled = event.isCanceled;
                          const isCurrent = event.current;
                          
                          let circleClass = 'bg-[#eeeeee] border border-[#cfc4c5]';
                          let iconClass = 'text-[#cfc4c5]';
                          let textClass = 'text-[#999999]';
                          
                          if (event.isWarning) {
                            circleClass = 'bg-[#ba1a1a] border-[#ba1a1a] shadow-[0_0_0_4px_rgba(186,26,26,0.2)]';
                            iconClass = 'text-white';
                            textClass = 'text-[#ba1a1a] font-bold';
                          } else if (isCanceled) {
                            circleClass = 'bg-gray-400 border-gray-400';
                            iconClass = 'text-white';
                            textClass = 'text-gray-400 font-medium line-through';
                          } else if (isPast) {
                            circleClass = 'bg-black border-black';
                            iconClass = 'text-white';
                            textClass = 'text-black';
                          } else if (isCurrent) {
                            circleClass = 'bg-[#99854e] border-[#99854e] shadow-[0_0_0_4px_rgba(153,133,78,0.2)]';
                            iconClass = 'text-white';
                            textClass = 'text-[#99854e] font-medium';
                          }
     
                          return (
                            <div key={index} className="relative flex items-start gap-6">
                              <div className={`absolute -left-[36px] flex h-8 w-8 items-center justify-center rounded-full z-10 transition-colors duration-500 ${circleClass}`}>
                                <span className={`material-symbols-outlined text-[14px] ${iconClass}`}>{event.icon}</span>
                              </div>
                              <div className="pl-4 pt-1">
                                <p className={`text-sm uppercase tracking-widest ${textClass}`}>{event.status}</p>
                                <p className="mt-1 text-xs text-[#5f5e5e]">{event.date}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-[#cfc4c5] pt-8">
                    <h3 className="mb-6 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#5f5e5e]">Sản phẩm đã thuê</h3>
                    <div className="space-y-4">
                      {selectedOrder.details?.map((item, index) => (
                        <div key={index} className="flex items-center justify-between border-b border-[#cfc4c5]/20 pb-4">
                          <div className="flex items-center gap-4">
                            <div className="h-16 w-12 bg-[#eeeeee] overflow-hidden">
                              <img src={item.costumeImageUrl || 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=200&q=80'} alt={item.costumeName} className="h-full w-full object-cover" />
                            </div>
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-widest text-black">{item.costumeName}</p>
                              <p className="text-[10px] text-[#5f5e5e] mt-1">{item.skuCode} | Size {item.size}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xs font-bold text-black">{formatCurrency(item.rentalPrice || 0)}</p>
                            <p className="text-[9px] text-[#999999] mt-0.5">Đặt cọc: {formatCurrency(item.depositPrice || 0)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
