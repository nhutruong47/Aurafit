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
  onOrderCompleted,
  returnOrder,
  markOrderReturned,
  handleLostPackage
}) {
  const [activeSubTab, setActiveSubTab] = useState('PENDING'); // PENDING or IN_TRANSIT
  const displayedOrders = filteredOrders.filter(o => 
    activeSubTab === 'PENDING' ? o.status === 'RENTED' : (o.status === 'RETURNING' || o.status === 'RETURNED')
  );
  
  const isOrderValidForTab = activeOrder && displayedOrders.some(o => o.id === activeOrder.id);

  const [actualReturnDate, setActualReturnDate] = useState(new Date().toISOString().split('T')[0]);
  const [damageFee, setDamageFee] = useState(0);
  const [lateFee, setLateFee] = useState(0);
  const [inspectionNote, setInspectionNote] = useState('');
  const [returnImageUrl, setReturnImageUrl] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [lateDays, setLateDays] = useState(0);

  // Tự động tính phí trễ dựa trên ngày trả
  useEffect(() => {
    if (activeOrder && actualReturnDate) {
      const returnDateStr = actualReturnDate; 
      const endDateStr = activeOrder.rentalEndDate?.split('T')[0] || returnDateStr;
      const startDateStr = activeOrder.rentalStartDate?.split('T')[0] || returnDateStr;
      
      const rDate = new Date(returnDateStr);
      rDate.setHours(0, 0, 0, 0);
      
      const eDate = new Date(endDateStr);
      eDate.setHours(0, 0, 0, 0);
      
      const sDate = new Date(startDateStr);
      sDate.setHours(0, 0, 0, 0);

      const diffTime = rDate.getTime() - eDate.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      setLateDays(Math.max(0, diffDays));

      if (diffDays > 0) {
        let rentalDurationDays = Math.ceil((eDate.getTime() - sDate.getTime()) / (1000 * 60 * 60 * 24));
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
      setLateDays(0);
    }
  }, [activeOrder?.id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (damageFee < 0 || lateFee < 0) {
      setError('Phí không thể là số âm');
      return;
    }

    if (activeOrder?.rentalStartDate && actualReturnDate) {
      const rDate = new Date(actualReturnDate);
      rDate.setHours(0, 0, 0, 0);
      const sDate = new Date(activeOrder.rentalStartDate.split('T')[0] || activeOrder.rentalStartDate);
      sDate.setHours(0, 0, 0, 0);
      if (rDate.getTime() < sDate.getTime()) {
        setError('Ngày trả thực tế không được trước ngày lấy (dự kiến).');
        return;
      }
    }

    setIsSubmitting(true);
    setError('');
    setMessage('');

    try {
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

  const renderInspectionForm = () => (
    <>
      <h3 className="text-lg font-medium text-gray-900 border-b pb-3 mb-4">Nghiệm thu & Thanh toán</h3>
      <form onSubmit={handleSubmit} className="flex-1 flex flex-col gap-6 overflow-hidden">
        <div className="flex-1 overflow-auto space-y-4 pr-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ngày trả thực tế</label>
              <input
                type="date"
                required
                min={activeOrder?.rentalStartDate?.split('T')[0] || ''}
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
                onUploaded={(asset) => {
                  const url = asset?.secureUrl || asset?.secure_url || asset?.imageUrl || asset?.image_url || asset?.url || (typeof asset === 'string' ? asset : '');
                  setReturnImageUrl(url);
                }}
              />
              {returnImageUrl && (
                <button type="button" onClick={() => setPreviewImage(returnImageUrl)} className="mt-2 text-xs text-blue-600 hover:underline">
                  Xem ảnh minh chứng
                </button>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phí phạt trễ (VND)</label>
              {lateDays > 0 && (
                <p className="mb-1 text-xs font-semibold text-red-600">
                  Đơn hàng trả trễ {lateDays} ngày. Phí phạt = {lateDays} ngày x 1.5 x (giá thuê/ngày).
                </p>
              )}
              <input
                type="text"
                className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                value={lateFee ? Number(lateFee).toLocaleString('vi-VN') : ''}
                onChange={(e) => setLateFee(e.target.value.replace(/\D/g, ''))}
              />
              {lateDays === 0 && (
                <p className="mt-1 text-xs text-gray-500">Mặc định tính phí = 1.5x giá thuê/ngày.</p>
              )}
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

        <div className="border-t border-gray-200 pt-4 bg-white shrink-0 flex flex-col items-end gap-2">
          {(!returnImageUrl || typeof returnImageUrl !== 'string' || !returnImageUrl.trim() || !actualReturnDate) && (
            <p className="text-xs text-red-500 italic">* Vui lòng chọn ngày trả thực tế và tải lên ảnh minh chứng</p>
          )}
          <button
            type="submit"
            disabled={isSubmitting || !returnImageUrl || typeof returnImageUrl !== 'string' || !returnImageUrl.trim() || !actualReturnDate}
            className="py-2.5 px-6 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none disabled:bg-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Đang xử lý...' : `XÁC NHẬN NGHIỆM THU & HOÀN CỌC`}
          </button>
        </div>
      </form>
    </>
  );

  return (
    <div className="flex h-full gap-6">
      <div className="w-1/3 flex flex-col gap-4">
        <div className="rounded-lg bg-white p-4 shadow-sm flex flex-col gap-4 shrink-0">
          <div className="flex p-1 bg-gray-100 rounded-lg">
            <button
              onClick={() => setActiveSubTab('PENDING')}
              className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${
                activeSubTab === 'PENDING' ? 'bg-white text-gray-900 shadow' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Cần thu hồi
            </button>
            <button
              onClick={() => setActiveSubTab('IN_TRANSIT')}
              className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${
                activeSubTab === 'IN_TRANSIT' ? 'bg-white text-gray-900 shadow' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Đang hoàn về
            </button>
          </div>
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
          {displayedOrders.length === 0 ? (
            <div className="p-6 text-center text-sm text-gray-500">
              {activeSubTab === 'PENDING' ? 'Không có đơn hàng cần thu hồi.' : 'Không có đơn hàng đang hoàn về.'}
            </div>
          ) : (
            displayedOrders.map(order => (
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
            Chọn một đơn hàng bên trái để xử lý
          </div>
        ) : (
          <>
            <div className="rounded-lg bg-white p-5 shadow-sm border border-gray-200 shrink-0 sticky top-0 z-10">
              <h3 className="text-lg font-medium text-gray-900 border-b pb-2 mb-3">Thông tin khách hàng & Đơn hàng</h3>
              <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-sm">
                <div><span className="text-gray-500">Khách hàng:</span> <span className="font-medium ml-1">{activeOrder.customerName}</span></div>
                <div><span className="text-gray-500">Điện thoại:</span> <span className="font-medium ml-1">{activeOrder.customerPhone}</span></div>
                <div><span className="text-gray-500">Ngày lấy dự kiến:</span> <span className="font-medium ml-1">{formatDate(activeOrder.rentalStartDate)}</span></div>
                <div><span className="text-gray-500">Ngày trả dự kiến:</span> <span className="font-medium ml-1">{formatDate(activeOrder.rentalEndDate)}</span></div>
                <div><span className="text-gray-500">Tiền thuê:</span> <span className="font-medium text-gray-900 ml-1">{formatCurrency(activeOrder.totalRentalPrice || activeOrder.totalRentalFee)}</span></div>
                <div><span className="text-gray-500">Tổng cọc:</span> <span className="font-medium text-blue-600 ml-1">{formatCurrency(activeOrder.totalDeposit)}</span></div>
              </div>
            </div>

            <div className="rounded-lg bg-white p-6 shadow-sm border border-gray-200 flex-1 flex flex-col">
              {activeSubTab === 'PENDING' ? (
                activeOrder.deliveryMethod === 'STORE_PICKUP' ? renderInspectionForm() :
                <>
                  <h3 className="text-lg font-medium text-gray-900 border-b pb-3 mb-4">Theo dõi thu hồi GHN</h3>
                  <div className="flex-1 flex flex-col gap-6 justify-center max-w-sm mx-auto w-full">
                    <div className="text-center text-gray-600 mb-2">
                      <span className="material-symbols-outlined text-5xl text-blue-400 mb-4">archive</span>
                      <p>Hệ thống sẽ tạo mã vận đơn để bưu tá GHN đến thu hồi trang phục tại địa chỉ của khách.</p>
                      <p className="text-sm mt-2">Sau khi tạo đơn thu hồi thành công, trạng thái sẽ chuyển sang <strong>Đang hoàn về</strong>.</p>
                    </div>
                    <button
                      onClick={() => returnOrder()}
                      disabled={isSubmitting}
                      className="w-full flex items-center justify-center gap-2 py-3 px-4 border border-transparent rounded-md shadow-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none disabled:bg-gray-400"
                    >
                      <span className="material-symbols-outlined">sync</span>
                      TẠO ĐƠN THU HỒI GHN
                    </button>
                  </div>
                </>
              ) : (
                activeOrder.status === 'RETURNING' ? (
                  <>
                    <h3 className="text-lg font-medium text-gray-900 border-b pb-3 mb-4">Theo dõi Đơn Hàng Hoàn Trả GHN</h3>
                    <div className="flex-1 flex flex-col gap-6 justify-center max-w-sm mx-auto w-full">
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
                        <span className="block text-sm text-gray-500 mb-1">Mã vận đơn thu hồi GHN</span>
                        <span className="block text-2xl font-bold text-gray-900 tracking-wider">
                          {activeOrder.ghnOrderCode || activeOrder.trackingCode || activeOrder.deliveryInfo?.trackingCode || 'Đang cập nhật...'}
                        </span>
                      </div>
                      <div className="flex flex-col gap-3">
                        <button
                          onClick={() => markOrderReturned()}
                          disabled={isSubmitting}
                          className="w-full flex items-center justify-center gap-2 py-3 px-4 border border-transparent rounded-md shadow-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none disabled:bg-gray-400"
                        >
                          <span className="material-symbols-outlined">inventory_2</span>
                          Xác nhận nhận hàng tại kho
                        </button>
                        <button
                          type="button"
                          disabled={isSubmitting}
                          onClick={() => {
                            if (window.confirm('Xác nhận thất lạc kiện hàng này do lỗi đơn vị vận chuyển? Tiền cọc sẽ được hoàn lại cho khách hàng và đơn hàng chuyển sang trạng thái LOST.')) {
                              handleLostPackage('Thất lạc trong quá trình hoàn về (Lỗi GHN)');
                            }
                          }}
                          className="w-full py-2.5 px-4 border border-red-300 rounded-md shadow-sm text-sm font-medium text-red-600 bg-white hover:bg-red-50 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Báo Thất Lạc (Lỗi do GHN)
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  renderInspectionForm()
                )
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
