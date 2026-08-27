import { useState, useEffect } from 'react';
import AlertMessage from '../ui/AlertMessage';
import ImageUploadField from '../ui/ImageUploadField';
import { StatusBadge } from './StaffDashboardShared';
import { adminOrderService } from '../../services/adminOrderService';
import RefundDepositModal from './RefundDepositModal';
import { uploadImage } from '../../services/uploadService';
import { useToastStore } from '../../store/useToastStore';

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);
};

const parseDateString = (value) => {
  if (!value) return null;
  if (Array.isArray(value)) {
    const [year, month, day, hour = 0, minute = 0, second = 0] = value;
    return new Date(year, month - 1, day, hour, minute, second);
  }
  return new Date(value);
};

const formatDate = (dateString) => {
  if (!dateString) return '';
  return parseDateString(dateString).toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const formatDateTime = (dateString) => {
  if (!dateString) return '';
  return parseDateString(dateString).toLocaleString('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
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
  const [activeSubTab, setActiveSubTab] = useState('PENDING'); // PENDING, IN_TRANSIT, PENDING_REFUND, CANCELLED_REFUND
  const displayedOrders = filteredOrders.filter(o => {
    if (activeSubTab === 'PENDING') return o.status === 'RENTED';
    if (activeSubTab === 'IN_TRANSIT') return o.status === 'RETURNING' || o.status === 'RETURNED';
    if (activeSubTab === 'PENDING_REFUND') return o.status === 'PENDING_REFUND';
    if (activeSubTab === 'CANCELLED_REFUND') return o.status === 'CANCELLED' && o.hasPendingRefund;
    return false;
  }).sort((a, b) => {
    if (activeSubTab === 'CANCELLED_REFUND') {
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    }
    return 0;
  });
  
  const isOrderValidForTab = activeOrder && displayedOrders.some(o => o.id === activeOrder.id);

  const [actualReturnDate, setActualReturnDate] = useState(new Date().toISOString().split('T')[0]);
  const [damageFee, setDamageFee] = useState(0);
  const [lateFee, setLateFee] = useState(0);
  const [inspectionNote, setInspectionNote] = useState('');
  const [returnImageUrl, setReturnImageUrl] = useState('');
  const [returnImageFile, setReturnImageFile] = useState(null);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [lateDays, setLateDays] = useState(0);

  // Tự động tính phí trễ dựa trên ngày trả
  useEffect(() => {
    if (activeOrder && actualReturnDate) {
      const rDate = new Date(actualReturnDate);
      rDate.setHours(0, 0, 0, 0);

      const eDate = parseDateString(activeOrder.rentalEndDate) || rDate;
      eDate.setHours(0, 0, 0, 0);

      const sDate = parseDateString(activeOrder.rentalStartDate) || rDate;
      sDate.setHours(0, 0, 0, 0);

      const diffTime = rDate.getTime() - eDate.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      const calculatedLateDays = Math.max(0, diffDays);
      setLateDays(calculatedLateDays);

      if (calculatedLateDays > 0) {
        let rentalDurationDays = Math.ceil((eDate.getTime() - sDate.getTime()) / (1000 * 60 * 60 * 24));
        if (rentalDurationDays <= 0) rentalDurationDays = 1;
        
        // Ensure dailyPrice from backend is used if available, otherwise calculate it
        const totalRentalFee = Number(activeOrder.totalRentalFee || activeOrder.totalRentalPrice || 0);
        const dailyRate = activeOrder.details?.[0]?.dailyPrice || (totalRentalFee / rentalDurationDays);
        
        const calculatedLateFee = Math.round(dailyRate * 1.5 * calculatedLateDays);
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
      setReturnImageFile(null);
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

    const calculatedRefund = Math.max(0, activeOrder.totalDeposit - Number(lateFee) - Number(damageFee));
    
    if (calculatedRefund > 0) {
      setIsSubmitting(false);
      setShowRefundModal(true);
    } else {
      await proceedCompleteOrder('');
    }
  };

  const proceedCompleteOrder = async (receiptImageUrl) => {
    setIsSubmitting(true);
    setError('');
    setMessage('');
    
    try {
      const isPendingRefund = activeOrder?.status === 'PENDING_REFUND';
      let finalReturnImageUrl = returnImageUrl;
      if (returnImageFile) {
        const asset = await uploadImage(returnImageFile);
        finalReturnImageUrl = asset?.secureUrl || asset?.secure_url || asset?.imageUrl || asset?.image_url || asset?.url || '';
        setReturnImageUrl(finalReturnImageUrl);
      }

      const persistedInspectionNote = isPendingRefund
        ? activeOrder?.inspectionNote || ''
        : inspectionNote;
      const payload = {
        damageFee: isPendingRefund
          ? Number(activeOrder?.totalDamageFee || 0)
          : Number(damageFee),
        lateFee: isPendingRefund
          ? Number(activeOrder?.totalLateFee || 0)
          : Number(lateFee),
        inspectionNote: persistedInspectionNote
          + (finalReturnImageUrl ? `\n[Ảnh minh chứng: ${finalReturnImageUrl}]` : '')
          + (receiptImageUrl ? `\n[Biên lai chuyển khoản: ${receiptImageUrl}]` : ''),
        actualReturnDate: actualReturnDate
      };

      await adminOrderService.completeOrder(activeOrder.id, payload);
      setMessage('Đã nghiệm thu đơn hàng thành công!');
      if (onOrderCompleted) {
        onOrderCompleted(activeOrder.id);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Có lỗi xảy ra khi nghiệm thu 🥺');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRefundComplete = async (receiptImageUrl, reportedInvalid) => {
    setShowRefundModal(false);
    if (reportedInvalid) {
      if (onOrderCompleted) {
        onOrderCompleted(activeOrder.id);
      }
    } else if (receiptImageUrl) {
      if (activeOrder?.status === 'CANCELLED') {
        setIsSubmitting(true);
        setError('');
        try {
          await adminOrderService.completeOrder(activeOrder.id, {
            damageFee: 0,
            lateFee: 0,
            inspectionNote: `[Hoàn tiền hủy đơn: ${receiptImageUrl}]`,
            actualReturnDate: new Date().toISOString().split('T')[0]
          });
          useToastStore.getState().addToast('Đã hoàn tiền đơn hủy thành công!', 'success');
          if (onOrderCompleted) onOrderCompleted(activeOrder.id);
        } catch (err) {
          useToastStore.getState().addToast(err.response?.data?.message || err.message || 'Có lỗi xảy ra 🥺', 'error');
        } finally {
          setIsSubmitting(false);
        }
      } else {
        await proceedCompleteOrder(receiptImageUrl);
      }
    }
  };

  const renderInspectionForm = () => (
    <>
      <h3 className="font-serif italic text-xl font-normal text-[#171717] border-b pb-3 mb-4">Nghiệm thu & Thanh toán</h3>
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <div className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-md border border-gray-200 flex flex-col md:flex-row justify-between items-start md:items-center">
            <div>
              <p className="text-sm text-gray-500 mb-1">Ngày trả quy định</p>
              <div className="flex items-center gap-2">
                <p className="font-medium text-gray-900">{formatDate(activeOrder?.rentalEndDate)}</p>
                {(() => {
                  if (!activeOrder?.rentalStartDate || !activeOrder?.rentalEndDate || !activeOrder?.details?.[0]?.rentalDays) return null;
                  const sDate = parseDateString(activeOrder.rentalStartDate);
                  const eDate = parseDateString(activeOrder.rentalEndDate);
                  if (!sDate || !eDate) return null;
                  
                  const originalEnd = new Date(sDate);
                  originalEnd.setDate(originalEnd.getDate() + activeOrder.details[0].rentalDays - 1);
                  originalEnd.setHours(0,0,0,0);
                  eDate.setHours(0,0,0,0);
                  
                  if (eDate.getTime() > originalEnd.getTime()) {
                    return <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">Đã gia hạn</span>;
                  }
                  return null;
                })()}
              </div>
            </div>
            <div className="mt-3 md:mt-0">
              <p className="text-sm text-gray-500 mb-1">Giá thuê / ngày</p>
              <p className="font-medium text-gray-900">
                {formatCurrency(activeOrder?.details?.[0]?.dailyPrice || (() => {
                  const sDate = parseDateString(activeOrder?.rentalStartDate);
                  const eDate = parseDateString(activeOrder?.rentalEndDate);
                  if (sDate && eDate) {
                     const days = Math.max(1, Math.ceil((eDate.getTime() - sDate.getTime()) / (1000 * 60 * 60 * 24)));
                     return Number(activeOrder?.totalRentalFee || activeOrder?.totalRentalPrice || 0) / days;
                  }
                  return 0;
                })())}
              </p>
            </div>
          </div>
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
                readyLabel="Ảnh đã chọn."
                autoUpload={false}
                hideUploadButton={true}
                onFileSelect={(file) => setReturnImageFile(file)}
                onUploaded={(asset) => {
                  const url = asset?.secureUrl || asset?.secure_url || asset?.imageUrl || asset?.image_url || asset?.url || (typeof asset === 'string' ? asset : '');
                  setReturnImageUrl(url);
                }}
              />
              {(returnImageUrl || returnImageFile) && (
                <button type="button" onClick={() => setPreviewImage(returnImageFile ? URL.createObjectURL(returnImageFile) : returnImageUrl)} className="mt-2 text-xs font-medium text-[#7f7041] hover:underline flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">image</span>
                  Xem ảnh minh chứng trả hàng
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
            <h4 className="font-serif italic text-lg font-normal text-[#171717] mb-2">Tổng kết thanh toán</h4>
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
          {((!returnImageUrl && !returnImageFile) || !actualReturnDate) && (
            <p className="text-xs text-red-500 italic">* Vui lòng chọn ngày trả thực tế và tải lên ảnh minh chứng</p>
          )}
          <button
            type="submit"
            disabled={isSubmitting || (!returnImageUrl && !returnImageFile) || !actualReturnDate}
            className="py-2.5 px-6 border border-transparent rounded-sm shadow-sm text-sm font-medium text-white bg-[#111111] hover:bg-[#7f7041] transition-colors focus:outline-none disabled:bg-[#d7d2c8] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Đang xử lý...' : `XÁC NHẬN NGHIỆM THU & HOÀN CỌC`}
          </button>
        </div>
      </form>
      {showRefundModal && (
        <RefundDepositModal 
          order={activeOrder} 
          refundAmount={Math.max(0, activeOrder.totalDeposit - Number(lateFee) - Number(damageFee))}
          inspectionPayload={{
            damageFee: Number(damageFee),
            lateFee: Number(lateFee),
            inspectionNote,
            actualReturnDate
          }}
          onClose={() => setShowRefundModal(false)}
          onComplete={handleRefundComplete}
        />
      )}
    </>
  );

  const renderDisbursementPanel = () => {
    const hasBankInfo = activeOrder?.customer?.bankAccountNumber && activeOrder?.customer?.bankName;
    const calculatedRefundAmount = activeOrder?.totalRefundedAmount != null
      ? Number(activeOrder.totalRefundedAmount) || 0
      : Math.max(0, (activeOrder?.totalDeposit || 0) - (activeOrder?.totalLateFee || 0) - (activeOrder?.totalDamageFee || 0));
    
    const note = activeOrder?.inspectionNote || '';
    const imgMatch = note.match(/\[Ảnh minh chứng:\s*(https?:\/\/[^\]]+)\]/);
    const returnImageUrlFromNote = imgMatch ? imgMatch[1] : null;

    return (
      <>
        <h3 className="font-serif italic text-xl font-normal text-[#171717] border-b pb-3 mb-4">Chi tiết giải ngân</h3>
        <div className="flex flex-col gap-6">
          <div className="bg-gray-50 border border-gray-200 p-4 rounded-md">
            <h4 className="font-semibold text-gray-800 mb-3">Tóm tắt nghiệm thu</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Tổng tiền cọc:</span>
                <span className="font-medium text-gray-900">{formatCurrency(activeOrder?.totalDeposit)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Tổng phí phạt (Trễ + Hư hỏng):</span>
                <span className="font-medium text-red-600">- {formatCurrency((activeOrder?.totalLateFee || 0) + (activeOrder?.totalDamageFee || 0))}</span>
              </div>
              <div className="flex justify-between pt-2 border-t font-semibold">
                <span className="text-gray-800">Số tiền giải ngân:</span>
                <span className="text-blue-600">{formatCurrency(calculatedRefundAmount)}</span>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-gray-200">
              <span className="block text-sm text-gray-600 mb-2">Ảnh minh chứng nghiệm thu:</span>
              {returnImageUrlFromNote ? (
                <img src={returnImageUrlFromNote} alt="Minh chứng" className="w-32 h-32 object-cover rounded border border-gray-300" />
              ) : (
                <span className="text-sm text-gray-500 italic">Không có ảnh minh chứng</span>
              )}
            </div>
          </div>

          <div className="bg-gray-50 border border-gray-200 p-4 rounded-md">
            <h4 className="font-semibold text-gray-800 mb-3">Thông tin nhận tiền (Khách hàng)</h4>
            {hasBankInfo ? (
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Ngân hàng:</span>
                  <span className="font-medium text-gray-900">{activeOrder?.customer?.bankName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Số tài khoản:</span>
                  <span className="font-medium text-gray-900">{activeOrder?.customer?.bankAccountNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Chủ tài khoản:</span>
                  <span className="font-medium text-gray-900">{activeOrder?.customer?.bankAccountName}</span>
                </div>
              </div>
            ) : (
              <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-md flex items-start gap-2">
                <span className="material-symbols-outlined text-yellow-600 mt-0.5">warning</span>
                <p className="text-sm text-yellow-800">Khách hàng chưa cập nhật số tài khoản. Vui lòng chờ khách thao tác trên hệ thống.</p>
              </div>
            )}
          </div>

          <div className="border-t border-gray-200 pt-4 mt-2 flex justify-end">
            <button
              onClick={() => setShowRefundModal(true)}
              disabled={!hasBankInfo || isSubmitting}
              className="py-2.5 px-6 border border-transparent rounded-sm shadow-sm text-sm font-medium text-white bg-[#111111] hover:bg-[#7f7041] transition-colors disabled:bg-[#d7d2c8] disabled:cursor-not-allowed"
            >
              TIẾN HÀNH GIẢI NGÂN
            </button>
          </div>
        </div>
        {showRefundModal && (
          <RefundDepositModal 
            order={activeOrder} 
            refundAmount={calculatedRefundAmount}
            onClose={() => setShowRefundModal(false)}
            onComplete={handleRefundComplete}
          />
        )}
      </>
    );
  };

  return (
    <div className="flex h-full gap-6">
      <div className="w-1/3 flex flex-col gap-4">
        <div className="rounded-none md:rounded-sm bg-white border border-[#d7d2c8] p-4 shadow-sm flex flex-col gap-4 shrink-0">
          <div className="flex p-1 bg-[#f4f4f2] rounded-md border border-[#d7d2c8]">
            <button
              onClick={() => setActiveSubTab('PENDING')}
              className={`flex-1 py-1.5 text-sm font-medium rounded-sm transition-colors ${
                activeSubTab === 'PENDING' ? 'bg-white text-[#171717] shadow-sm' : 'text-gray-500 hover:text-[#171717]'
              }`}
            >
              Cần thu hồi
            </button>
            <button
              onClick={() => { setActiveSubTab('IN_TRANSIT'); openOrder(null); }}
              className={`flex-1 py-1.5 text-sm font-medium rounded-sm transition-colors ${
                activeSubTab === 'IN_TRANSIT' ? 'bg-white text-[#171717] shadow-sm' : 'text-gray-500 hover:text-[#171717]'
              }`}
            >
              Đang hoàn về
            </button>
            <button
              onClick={() => { setActiveSubTab('PENDING_REFUND'); openOrder(null); }}
              className={`flex-1 py-1.5 text-sm font-medium rounded-sm transition-colors ${
                activeSubTab === 'PENDING_REFUND' ? 'bg-white text-[#171717] shadow-sm' : 'text-gray-500 hover:text-[#171717]'
              }`}
            >
              Chờ giải ngân
            </button>
            <button
              onClick={() => { setActiveSubTab('CANCELLED_REFUND'); openOrder(null); }}
              className={`flex-1 py-1.5 text-sm font-medium rounded-sm transition-colors ${
                activeSubTab === 'CANCELLED_REFUND' ? 'bg-white text-[#171717] shadow-sm' : 'text-gray-500 hover:text-[#171717]'
              }`}
            >
              Đơn hủy
            </button>
          </div>
          <div className="relative">
             <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">search</span>
             <input
               type="text"
               placeholder="Tìm mã đơn, tên khách..."
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
               className="block w-full rounded-md border-[#d7d2c8] pl-10 focus:border-[#7f7041] focus:ring-[#7f7041] sm:text-sm h-10 border px-3"
             />
          </div>
        </div>
        <div className="flex-1 overflow-auto rounded-none md:rounded-sm bg-white shadow-sm border border-[#d7d2c8] divide-y divide-[#d7d2c8]">
          {displayedOrders.length === 0 ? (
            <div className="p-6 text-center text-sm text-gray-500">
              {activeSubTab === 'PENDING' ? 'Không có đơn hàng cần thu hồi.' : 
               activeSubTab === 'IN_TRANSIT' ? 'Không có đơn hàng đang hoàn về.' : 
               activeSubTab === 'PENDING_REFUND' ? 'Không có đơn giải ngân.' : 'Không có đơn hủy chờ hoàn tiền.'}
            </div>
          ) : (
            displayedOrders.map(order => (
              <button
                key={order.id}
                onClick={() => {
                  setMode('RETURN');
                  openOrder(order.id);
                }}
                className={`w-full text-left p-4 hover:bg-[#f4f4f2] transition-colors ${activeOrder?.id === order.id ? 'bg-[#f4f4f2] border-l-4 border-[#7f7041]' : ''}`}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className="font-semibold text-gray-900">RO-{String(order.id).padStart(4, '0')}</span>
                  <StatusBadge status={order.status} />
                </div>
                <div className="text-sm text-gray-600 truncate">{order.customerName}</div>
                <div className="text-xs text-gray-400 mt-1">
                  {order.status === 'CANCELLED' 
                    ? `Ngày hủy: ${formatDateTime(order.updatedAt)}` 
                    : formatDate(order.rentalStartDate)}
                </div>
              </button>
            ))
          )}
        </div>
      </div>
      
      <div className="flex-1 flex flex-col gap-4 overflow-auto">
        {error && <AlertMessage type="error" text={error} />}
        {message && <AlertMessage type="success" text={message} />}
        
        {!isOrderValidForTab ? (
          <div className="flex-1 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50 text-gray-500">
            Chọn một đơn hàng bên trái để xử lý
          </div>
        ) : (
          <>
            <div className="rounded-none md:rounded-sm bg-white p-5 shadow-sm border border-[#d7d2c8] shrink-0">
              <h3 className="font-serif italic text-xl font-normal text-[#171717] border-b pb-2 mb-3">Thông tin khách hàng & Đơn hàng</h3>
              <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-sm">
                <div><span className="text-gray-500">Khách hàng:</span> <span className="font-medium ml-1">{activeOrder.customerName}</span></div>
                <div><span className="text-gray-500">Điện thoại:</span> <span className="font-medium ml-1">{activeOrder.customerPhone}</span></div>
                <div><span className="text-gray-500">Ngày tạo đơn:</span> <span className="font-medium ml-1">{formatDateTime(activeOrder.createdAt)}</span></div>
                <div><span className="text-gray-500">Giao hàng:</span> <span className="font-medium ml-1">{activeOrder.deliveryMethod === 'GHN_DELIVERY' ? 'Giao hàng GHN' : 'Nhận tại cửa hàng'}</span></div>
                <div className="col-span-2"><span className="text-gray-500">Địa chỉ giao hàng:</span> <span className="font-medium ml-1">{activeOrder.deliveryAddress || 'Nhận tại cửa hàng'}</span></div>
                {activeOrder.status === 'CANCELLED' ? (
                  <div className="col-span-2"><span className="text-gray-500">Ngày hủy:</span> <span className="font-medium ml-1">{formatDateTime(activeOrder.updatedAt)}</span></div>
                ) : (
                  <>
                    <div><span className="text-gray-500">Ngày lấy dự kiến:</span> <span className="font-medium ml-1">{formatDate(activeOrder.rentalStartDate)}</span></div>
                    <div><span className="text-gray-500">Ngày trả dự kiến:</span> <span className="font-medium ml-1">{formatDate(activeOrder.rentalEndDate)}</span></div>
                  </>
                )}
                <div><span className="text-gray-500">Tiền thuê:</span> <span className="font-medium text-gray-900 ml-1">{formatCurrency(activeOrder.totalRentalPrice || activeOrder.totalRentalFee)}</span></div>
                <div><span className="text-gray-500">Tổng cọc:</span> <span className="font-medium text-blue-600 ml-1">{formatCurrency(activeOrder.totalDeposit)}</span></div>
              </div>
            </div>

            {activeOrder.status === 'CANCELLED' ? (
              <div className="bg-white rounded-none md:rounded-sm border border-[#d7d2c8] shadow-sm p-6 mb-4 flex flex-col">
                <h3 className="font-serif italic text-xl font-normal text-[#171717] border-b pb-3 mb-4">Hoàn tiền đơn hủy</h3>
                <p className="text-gray-600 text-sm mb-4">Đơn hàng này đã bị hủy. Vui lòng hoàn lại toàn bộ số tiền khách đã thanh toán.</p>
                <div className="bg-blue-50 border border-blue-200 p-4 rounded-md mb-6">
                  <div className="flex justify-between font-semibold text-lg text-blue-800">
                    <span>Số tiền cần hoàn:</span>
                    <span>{formatCurrency((activeOrder.totalRentalFee || 0) + (activeOrder.totalDeposit || 0))}</span>
                  </div>
                </div>
                <div className="flex justify-end">
                  <button
                    onClick={() => setShowRefundModal(true)}
                    className="py-2.5 px-6 border border-transparent rounded-sm shadow-sm text-sm font-medium text-white bg-[#111111] hover:bg-[#7f7041] transition-colors"
                  >
                    HOÀN TIỀN QUA VIETQR
                  </button>
                </div>
                {showRefundModal && (
                  <RefundDepositModal 
                    order={activeOrder} 
                    refundAmount={(activeOrder.totalRentalFee || 0) + (activeOrder.totalDeposit || 0)}
                    onClose={() => setShowRefundModal(false)}
                    onComplete={handleRefundComplete}
                  />
                )}
              </div>
            ) : (
            <div className="rounded-none md:rounded-sm bg-white p-6 shadow-sm border border-[#d7d2c8] flex flex-col">
              {activeSubTab === 'PENDING' ? (
                activeOrder.deliveryMethod === 'STORE_PICKUP' ? renderInspectionForm() :
                <>
                  <h3 className="font-serif italic text-xl font-normal text-[#171717] border-b pb-3 mb-4">Theo dõi thu hồi GHN</h3>
                  <div className="flex-1 flex flex-col gap-6 justify-center max-w-sm mx-auto w-full">
                    <div className="text-center text-gray-600 mb-2">
                      <span className="material-symbols-outlined text-5xl text-blue-400 mb-4">archive</span>
                      <p>Hệ thống sẽ tạo mã vận đơn để bưu tá GHN đến thu hồi trang phục tại địa chỉ của khách.</p>
                      <p className="text-sm mt-2">Sau khi tạo đơn thu hồi thành công, trạng thái sẽ chuyển sang <strong>Đang hoàn về</strong>.</p>
                    </div>
                    <button
                      onClick={() => returnOrder()}
                      disabled={isSubmitting}
                      className="w-full flex items-center justify-center gap-2 py-3 px-4 border border-transparent rounded-sm shadow-sm font-medium text-white bg-[#111111] hover:bg-[#7f7041] transition-colors focus:outline-none disabled:bg-[#d7d2c8]"
                    >
                      <span className="material-symbols-outlined">sync</span>
                      TẠO ĐƠN THU HỒI GHN
                    </button>
                  </div>
                </>
              ) : activeSubTab === 'PENDING_REFUND' ? (
                renderDisbursementPanel()
              ) : (
                activeOrder.status === 'RETURNING' ? (
                  <>
                    <h3 className="font-serif italic text-xl font-normal text-[#171717] border-b pb-3 mb-4">Theo dõi Đơn Hàng Hoàn Trả GHN</h3>
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
                          className="w-full flex items-center justify-center gap-2 py-3 px-4 border border-transparent rounded-sm shadow-sm font-medium text-white bg-[#111111] hover:bg-[#7f7041] transition-colors focus:outline-none disabled:bg-[#d7d2c8]"
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
                          className="w-full py-2.5 px-4 border border-red-300 rounded-sm shadow-sm text-sm font-medium text-red-600 bg-white hover:bg-red-50 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
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
            )}
          </>
        )}
      </div>
    </div>
  );
}
