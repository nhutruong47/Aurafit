import React, { useState, useEffect } from 'react';
import AlertMessage from '../ui/AlertMessage';
import ImageUploadField from '../ui/ImageUploadField';
import { StatusBadge } from './StaffDashboardShared';
import { adminOrderService } from '../../services/adminOrderService';

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);
};

const formatDate = (dateString) => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export default function ReturnTab({
  filteredOrders,
  activeOrder,
  searchQuery,
  setSearchQuery,
  openOrder,
  setMode,
  setPreviewImage,
  onOrderCompleted
}) {
  const isOrderValidForTab = activeOrder && filteredOrders.some(o => o.id === activeOrder.id);

  const [actualReturnDate, setActualReturnDate] = useState(new Date().toISOString().split('T')[0]);
  const [damageFee, setDamageFee] = useState(0);
  const [lateFee, setLateFee] = useState(0);
  const [inspectionNote, setInspectionNote] = useState('');
  const [returnImageUrl, setReturnImageUrl] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  // Tự động tính phí trễ dựa trên ngày trả
  useEffect(() => {
    if (activeOrder && actualReturnDate) {
      const returnDate = new Date(actualReturnDate);
      const endDate = new Date(activeOrder.rentalEndDate);
      const startDate = new Date(activeOrder.rentalStartDate);
      const diffTime = returnDate.getTime() - endDate.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays > 0) {
        let rentalDurationDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        if (rentalDurationDays <= 0) rentalDurationDays = 1;
        
        const totalRentalFee = Number(activeOrder.totalRentalFee || activeOrder.totalRentalPrice || 0);
        const dailyRate = totalRentalFee / rentalDurationDays;
        
        const calculatedLateFee = Math.round(dailyRate * 1.5 * diffDays);
        setLateFee(calculatedLateFee);
      } else {
        setLateFee(0);
      }
    }
  }, [actualReturnDate, activeOrder]);

  // Reset state khi đổi order
  useEffect(() => {
    if (activeOrder) {
      setActualReturnDate(new Date().toISOString().split('T')[0]);
      setDamageFee(0);
      setInspectionNote('');
      setReturnImageUrl('');
      setError('');
      setMessage('');
    }
  }, [activeOrder?.id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (damageFee < 0 || lateFee < 0) {
      setError('Phí không thể là số âm');
      return;
    }

    setIsSubmitting(true);
    setError('');
    setMessage('');

    try {
      // Nếu có API lưu ảnh return thì gọi ở đây, nhưng tạm thời truyền vào payload hoặc xử lý sau
      // Giả sử gọi adminOrderService.completeOrder
      const payload = {
        damageFee: Number(damageFee),
        lateFee: Number(lateFee),
        inspectionNote: inspectionNote + (returnImageUrl ? `\n[Ảnh minh chứng: ${returnImageUrl}]` : ''),
        actualReturnDate: actualReturnDate
      };

      await adminOrderService.completeOrder(activeOrder.id, payload);
      setMessage('Đã nghiệm thu đơn hàng thành công!');
      if (onOrderCompleted) {
        onOrderCompleted(activeOrder.id);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Có lỗi xảy ra khi nghiệm thu');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex h-full gap-6">
      <div className="w-1/3 flex flex-col gap-4">
        <div className="rounded-lg bg-white p-4 shadow-sm">
           <div className="relative">
             <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">search</span>
             <input
               type="text"
               placeholder="Tìm mã đơn, tên khách..."
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
               className="block w-full rounded-md border-gray-300 pl-10 focus:border-blue-500 focus:ring-blue-500 sm:text-sm h-10 border px-3"
             />
           </div>
        </div>
        <div className="flex-1 overflow-auto rounded-lg bg-white shadow-sm border border-gray-200 divide-y divide-gray-100">
          {filteredOrders.length === 0 ? (
            <div className="p-6 text-center text-sm text-gray-500">Không có đơn hàng cần nghiệm thu trả đồ.</div>
          ) : (
            filteredOrders.map(order => (
              <button
                key={order.id}
                onClick={() => {
                  setMode('RETURN');
                  openOrder(order.id);
                }}
                className={`w-full text-left p-4 hover:bg-gray-50 transition-colors ${activeOrder?.id === order.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''}`}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className="font-semibold text-gray-900">RO-{String(order.id).padStart(4, '0')}</span>
                  <StatusBadge status={order.status} />
                </div>
                <div className="text-sm text-gray-600 truncate">{order.customerName}</div>
                <div className="text-xs text-gray-400 mt-1">{formatDate(order.rentalStartDate)}</div>
              </button>
            ))
          )}
        </div>
      </div>
      
      <div className="flex-1 flex flex-col gap-4 overflow-auto">
        {error && <AlertMessage text={error} />}
        {message && <AlertMessage tone="success" text={message} />}
        
        {!isOrderValidForTab ? (
          <div className="flex-1 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50 text-gray-500">
            Chọn một đơn hàng bên trái để xử lý trả đồ (Nghiệm thu)
          </div>
        ) : (
          <>
            <div className="rounded-lg bg-white p-6 shadow-sm border border-gray-200 shrink-0">
              <h3 className="text-lg font-medium text-gray-900 border-b pb-3 mb-4">Thông tin khách hàng & Đơn hàng</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-gray-500">Khách hàng:</span> <span className="font-medium">{activeOrder.customerName}</span></div>
                <div><span className="text-gray-500">Điện thoại:</span> <span className="font-medium">{activeOrder.customerPhone}</span></div>
                <div><span className="text-gray-500">Ngày lấy dự kiến:</span> <span className="font-medium">{formatDate(activeOrder.rentalStartDate)}</span></div>
                <div><span className="text-gray-500">Ngày trả dự kiến:</span> <span className="font-medium">{formatDate(activeOrder.rentalEndDate)}</span></div>
                <div><span className="text-gray-500">Tiền thuê:</span> <span className="font-medium text-gray-900">{formatCurrency(activeOrder.totalRentalPrice || activeOrder.totalRentalFee)}</span></div>
                <div><span className="text-gray-500">Tổng cọc:</span> <span className="font-medium text-blue-600">{formatCurrency(activeOrder.totalDeposit)}</span></div>
              </div>
            </div>

            <div className="rounded-lg bg-white p-6 shadow-sm border border-gray-200 flex-1 flex flex-col">
              <h3 className="text-lg font-medium text-gray-900 border-b pb-3 mb-4">Nghiệm thu & Thanh toán (Return)</h3>
              <form onSubmit={handleSubmit} className="flex-1 flex flex-col gap-6 overflow-hidden">
                <div className="flex-1 overflow-auto space-y-4 pr-2">
                  <h4 className="font-medium text-sm text-gray-700">Chi tiết nghiệm thu</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Ngày trả thực tế</label>
                      <input
                        type="date"
                        required
                        className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        value={actualReturnDate}
                        onChange={(e) => setActualReturnDate(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Ảnh minh chứng trả hàng</label>
                      <ImageUploadField
                        label=""
                        value={returnImageUrl}
                        disabled={isSubmitting}
                        readyLabel="Ảnh đã tải lên."
                        autoUpload={true}
                        onUploaded={(asset) => setReturnImageUrl(asset?.secure_url || asset)}
                      />
                      {returnImageUrl && (
                         <button type="button" onClick={() => setPreviewImage(returnImageUrl)} className="mt-2 text-xs text-blue-600 hover:underline">
                           Xem ảnh minh chứng
                         </button>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phí phạt trễ (VND)</label>
                      <input
                        type="text"
                        className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        value={lateFee ? Number(lateFee).toLocaleString('vi-VN') : ''}
                        onChange={(e) => setLateFee(e.target.value.replace(/\D/g, ''))}
                      />
                      <p className="mt-1 text-xs text-gray-500">Mặc định tính phí = 1.5x giá thuê/ngày.</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phí hư hỏng/thất lạc (VND)</label>
                      <input
                        type="text"
                        className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        value={damageFee ? Number(damageFee).toLocaleString('vi-VN') : ''}
                        onChange={(e) => setDamageFee(e.target.value.replace(/\D/g, ''))}
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú (Tình trạng, lý do phạt...)</label>
                      <textarea
                        rows="2"
                        className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        value={inspectionNote}
                        onChange={(e) => setInspectionNote(e.target.value)}
                        placeholder="Nhập ghi chú..."
                      />
                    </div>
                  </div>
                  
                  <div className="bg-blue-50 p-4 rounded-md mt-4 border border-blue-100">
                    <h4 className="font-medium text-blue-900 mb-2">Tổng kết thanh toán</h4>
                    <div className="flex justify-between text-sm mb-1">
                       <span className="text-blue-800">Tiền cọc khách đã trả:</span>
                       <span className="font-medium">{formatCurrency(activeOrder.totalDeposit)}</span>
                    </div>
                    <div className="flex justify-between text-sm mb-1 text-red-600">
                       <span>Tổng phí phạt (Trễ + Hư hỏng):</span>
                       <span className="font-medium">- {formatCurrency(Number(lateFee) + Number(damageFee))}</span>
                    </div>
                    <div className="flex justify-between font-semibold mt-2 pt-2 border-t border-blue-200">
                       <span className="text-blue-900">Cần hoàn trả cho khách:</span>
                       <span className="text-blue-700">{formatCurrency(Math.max(0, activeOrder.totalDeposit - Number(lateFee) - Number(damageFee)))}</span>
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-4 bg-white shrink-0 flex justify-end">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="py-2.5 px-6 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none disabled:bg-gray-400"
                  >
                    {isSubmitting ? 'Đang xử lý...' : `XÁC NHẬN NGHIỆM THU & HOÀN CỌC`}
                  </button>
                </div>
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
