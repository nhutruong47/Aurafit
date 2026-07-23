import { useState } from 'react';
import { 
  formatDate, 
  formatDateTime, 
  formatCurrency, 
  getDetailStatusLabel, 
  canShowPickupInfo, 
  getStaffPickupInfo, 
  StatusBadge 
} from './StaffDashboardUtils';
import { useToastStore } from '../../store/useToastStore';
import { compensateRentalOrder } from '../../services/rentalOrderService';

export default function StaffOrderDetailModal({ 
  activeOrder, 
  setIsModalOpen, 
  setPreviewImage,
  onReload
}) {
  const [showCompensateConfirm, setShowCompensateConfirm] = useState(false);
  const [isCompensating, setIsCompensating] = useState(false);
  const addToast = useToastStore((s) => s.addToast);

  if (!activeOrder) return null;

  const modalPickupInfo = getStaffPickupInfo(activeOrder);
  const showModalPickupInfo = canShowPickupInfo(activeOrder?.status);
  
  const parseInspectionNote = (note) => {
    if (!note) return { text: '', imageUrl: '' };
    const match = note.match(/\[Ảnh minh chứng:\s*(.*?)\]/);
    const imageUrl = match ? match[1] : '';
    const text = note.replace(/\[Ảnh minh chứng:\s*.*?\]/, '').trim();
    return { text, imageUrl };
  };

  const copyToClipboard = (text, type) => {
    navigator.clipboard.writeText(text);
    window.alert(`Đã copy mã vận đơn ${type}`);
  };

  const handleCompensate = async () => {
    try {
      setIsCompensating(true);
      await compensateRentalOrder(activeOrder.id);
      addToast('Đã hủy và gửi mã đền bù cho khách');
      setShowCompensateConfirm(false);
      setIsModalOpen(false);
      if (onReload) onReload();
    } catch (err) {
      console.error(err);
      addToast('Lỗi khi đền bù đơn hàng.');
    } finally {
      setIsCompensating(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onMouseDown={(e) => { if (e.target === e.currentTarget) setIsModalOpen(false); }}
    >
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50 rounded-t-lg">
          <h3 className="text-lg font-medium text-gray-900">Chi tiết đơn hàng RO-{String(activeOrder.id).padStart(4, '0')}</h3>
          <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-500">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        {showCompensateConfirm ? (
          <div className="p-6">
            <div className="bg-red-50 border border-red-200 p-4 rounded-md text-red-800">
              <p className="font-bold mb-2 flex items-center gap-2">
                <span className="material-symbols-outlined">warning</span> Cảnh báo Đền bù
              </p>
              <p>Hành động này sẽ hủy đơn hàng và tự động sinh ra mã giảm giá đền bù 50% cho khách hàng. Bạn có chắc chắn?</p>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button 
                onClick={() => setShowCompensateConfirm(false)}
                className="px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                disabled={isCompensating}
              >
                Hủy bỏ
              </button>
              <button 
                onClick={handleCompensate}
                className="px-4 py-2 bg-red-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-red-700 transition flex items-center gap-2"
                disabled={isCompensating}
              >
                {isCompensating ? <span className="material-symbols-outlined animate-spin text-sm">refresh</span> : null}
                Xác nhận Đền bù
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="p-6 overflow-y-auto">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-sm mb-6 bg-gray-50 p-5 rounded-lg border border-gray-200 shadow-sm">
                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-800 border-b pb-2 mb-3">Thông tin Đơn hàng</h4>
              <p className="flex justify-between items-start gap-4">
                <span className="text-gray-500 whitespace-nowrap">Khách hàng:</span> 
                <span className="font-medium text-gray-900 text-right">{activeOrder.customerName} - {activeOrder.customerPhone}</span>
              </p>
              {activeOrder.customerEmail && (
                <p className="flex justify-between items-start gap-4">
                  <span className="text-gray-500 whitespace-nowrap">Email:</span> 
                  <span className="font-medium text-gray-900 text-right">{activeOrder.customerEmail}</span>
                </p>
              )}
              <p className="flex justify-between items-start gap-4">
                <span className="text-gray-500 whitespace-nowrap">Ngày tạo đơn:</span> 
                <span className="font-medium text-gray-900 text-right">{formatDateTime(activeOrder.createdAt)}</span>
              </p>
              <p className="flex justify-between items-start gap-4">
                <span className="text-gray-500 whitespace-nowrap">Thời gian thuê:</span> 
                <span className="font-medium text-gray-900 text-right">
                  {formatDateTime(activeOrder.rentalStartDate)} <br/>
                  <span className="text-gray-400 font-normal italic text-xs">đến</span> <br/>
                  {formatDateTime(activeOrder.rentalEndDate)}
                </span>
              </p>
              <p className="flex justify-between items-center gap-4">
                <span className="text-gray-500 whitespace-nowrap">Giao hàng:</span> 
                <span className="font-medium text-gray-900 text-right">{activeOrder.deliveryMethod === 'GHN_DELIVERY' || activeOrder.deliveryMethod === 'GHN' ? 'Giao hàng GHN' : 'Nhận tại cửa hàng'}</span>
              </p>
              <div className="bg-white border border-gray-100 rounded p-3 mt-2 text-sm">
                <p className="font-medium text-gray-700 mb-1">
                  {(activeOrder.deliveryMethod === 'GHN_DELIVERY' || activeOrder.deliveryMethod === 'GHN') ? 'Địa chỉ nhận hàng:' : 'Địa chỉ khách hàng:'}
                </p>
                <p className="text-gray-600">
                  {activeOrder.receiverName || activeOrder.customerName} - {activeOrder.receiverPhone || activeOrder.customerPhone}
                </p>
                <p className="text-gray-600 mt-1">
                  {activeOrder.deliveryAddress || 'Nhận tại cửa hàng'}
                </p>
              </div>
              <p className="flex justify-between items-center gap-4">
                <span className="text-gray-500 whitespace-nowrap">Trạng thái:</span> 
                <StatusBadge status={activeOrder.status} label={getDetailStatusLabel(activeOrder.status)} />
              </p>
              {activeOrder.updatedAt && (
                <p className="flex justify-between items-start gap-4">
                  <span className="text-gray-500 whitespace-nowrap">
                    {activeOrder.status === 'CANCELLED' ? 'Ngày hủy:' : 
                     activeOrder.status === 'COMPLETED' ? 'Ngày hoàn thành:' :
                     activeOrder.status === 'RENTING' ? 'Ngày bắt đầu thuê:' :
                     activeOrder.status === 'DELIVERING' ? 'Ngày giao hàng:' :
                     activeOrder.status === 'WAITING_RETURN' ? 'Ngày chờ trả:' :
                     activeOrder.status === 'PENDING' ? 'Cập nhật:' :
                     'Cập nhật lần cuối:'}
                  </span> 
                  <span className="font-medium text-gray-900 text-right">{formatDateTime(activeOrder.updatedAt)}</span>
                </p>
              )}
            </div>
            <div className="space-y-3 border-t lg:border-t-0 lg:border-l border-gray-200 lg:pl-6 pt-4 lg:pt-0">
              <h4 className="font-semibold text-gray-800 border-b pb-2 mb-3">Thông tin Tài chính</h4>
              <div className="flex justify-between">
                <span className="text-gray-500">Phí thuê:</span>
                <span className="font-medium">{formatCurrency(activeOrder.totalRentalFee || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Tiền cọc ban đầu:</span>
                <span className="font-medium">{formatCurrency(activeOrder.totalDeposit || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Phí vận chuyển:</span>
                <span className="font-medium">{activeOrder.shippingFee ? formatCurrency(activeOrder.shippingFee) : '0 đ'}</span>
              </div>
              <div className="flex justify-between border-t border-gray-200 mt-2 pt-2">
                <span className="font-bold text-gray-700">Tổng thanh toán:</span>
                <span className="font-bold text-[#ba1a1a]">{formatCurrency(activeOrder.finalAmount || activeOrder.totalAmount || 0)}</span>
              </div>
            </div>
          </div>

          {/* GHN Tracking */}
          {(activeOrder.ghnOrderCode || activeOrder.ghnReturnOrderCode) && (
            <section className="mb-6 rounded-lg border border-gray-200 p-4">
              <h4 className="font-medium text-gray-900 mb-3 uppercase tracking-wider text-sm">Vận Đơn GHN</h4>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {activeOrder.ghnOrderCode && (
                  <div className="bg-[#f8f4e8] p-3 border border-[#99854e] flex justify-between items-center rounded">
                    <div>
                      <p className="text-xs text-[#5f5e5e] uppercase tracking-wider">Mã giao hàng</p>
                      <p className="font-semibold text-gray-800">{activeOrder.ghnOrderCode}</p>
                    </div>
                    <button 
                      onClick={() => copyToClipboard(activeOrder.ghnOrderCode, 'giao')}
                      className="text-[#99854e] hover:text-[#857241] p-2"
                      title="Copy mã giao hàng"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                      </svg>
                    </button>
                  </div>
                )}
                {activeOrder.ghnReturnOrderCode && (
                  <div className="bg-[#fdf3f3] p-3 border border-[#d32f2f] flex justify-between items-center rounded">
                    <div>
                      <p className="text-xs text-[#5f5e5e] uppercase tracking-wider">Mã thu hồi</p>
                      <p className="font-semibold text-gray-800">{activeOrder.ghnReturnOrderCode}</p>
                    </div>
                    <button 
                      onClick={() => copyToClipboard(activeOrder.ghnReturnOrderCode, 'thu hồi')}
                      className="text-[#d32f2f] hover:text-[#b71c1c] p-2"
                      title="Copy mã thu hồi"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            </section>
          )}

          {showModalPickupInfo && (
            <section className="mb-6 rounded-lg border border-gray-200 p-4">
              <h4 className="font-medium text-gray-900 mb-3">
                {activeOrder.deliveryMethod === 'STORE_PICKUP' ? 'Thông tin Pickup (Tại cửa hàng)' : 'Thông tin Đóng gói (GHN)'}
              </h4>
              <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
                {modalPickupInfo.pickedUpAt && (
                  <div>
                    <span className="text-gray-500">Thời gian {activeOrder.deliveryMethod === 'STORE_PICKUP' ? 'Pickup' : 'Đóng gói'}:</span>
                    <p className="mt-1 font-medium">{formatDateTime(modalPickupInfo.pickedUpAt)}</p>
                  </div>
                )}
                {modalPickupInfo.pickedUpBy && (
                  <div>
                    <span className="text-gray-500">Nhân viên {activeOrder.deliveryMethod === 'STORE_PICKUP' ? 'Pickup' : 'Đóng gói'}:</span>
                    <p className="mt-1 font-medium">{modalPickupInfo.pickedUpBy}</p>
                  </div>
                )}
                <div className="sm:col-span-2">
                  <span className="text-gray-500">Ghi chú {activeOrder.deliveryMethod === 'STORE_PICKUP' ? 'Pickup' : 'Đóng gói'}:</span>
                  <p className="mt-1 font-medium whitespace-pre-line">{modalPickupInfo.pickupNote || 'Chưa có ghi chú'}</p>
                </div>
                <div className="sm:col-span-2">
                  <span className="text-gray-500">Ảnh minh chứng {activeOrder.deliveryMethod === 'STORE_PICKUP' ? 'Pickup' : 'Đóng gói'}:</span>
                  {modalPickupInfo.pickupImages.length > 0 ? (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {modalPickupInfo.pickupImages.map((imageUrl, index) => (
                        <button
                          key={imageUrl}
                          type="button"
                          onClick={() => setPreviewImage(imageUrl)}
                          className="block h-24 w-24 overflow-hidden rounded-md border border-gray-200 bg-gray-100"
                        >
                          <img src={imageUrl} alt={`Ảnh minh chứng ${index + 1}`} className="h-full w-full object-cover" />
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-1 font-medium">Không có ảnh minh chứng</p>
                  )}
                </div>
              </div>
            </section>
          )}

          {(activeOrder.status === 'COMPLETED' || activeOrder.status === 'RETURNED') && (
            <section className="mb-6 rounded-lg border border-gray-200 p-4 bg-gray-50">
              <h4 className="font-medium text-gray-900 mb-3 text-blue-800">Thông tin Nghiệm thu & Hoàn trả</h4>
              <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
                {activeOrder.actualReturnDate && (
                  <div>
                    <span className="text-gray-500">Ngày trả thực tế:</span>
                    <p className="mt-1 font-medium">{formatDate(activeOrder.actualReturnDate)}</p>
                  </div>
                )}
                <div>
                  <span className="text-gray-500">Phí phạt trễ:</span>
                  <p className={`mt-1 font-medium ${activeOrder.totalLateFee > 0 ? 'text-red-600' : ''}`}>
                    {formatCurrency(activeOrder.totalLateFee || 0)}
                  </p>
                </div>
                <div>
                  <span className="text-gray-500">Phí hư hỏng/thất lạc:</span>
                  <p className={`mt-1 font-medium ${activeOrder.totalDamageFee > 0 ? 'text-red-600' : ''}`}>
                    {formatCurrency(activeOrder.totalDamageFee || 0)}
                  </p>
                </div>
                <div className="sm:col-span-2">
                  <span className="text-gray-500">Ghi chú nghiệm thu:</span>
                  <p className="mt-1 font-medium whitespace-pre-line text-gray-800">
                    {parseInspectionNote(activeOrder.inspectionNote).text || 'Không có ghi chú'}
                  </p>
                </div>
                <div className="sm:col-span-2">
                  <span className="text-gray-500">Ảnh minh chứng trả hàng:</span>
                  {parseInspectionNote(activeOrder.inspectionNote).imageUrl ? (
                    <button
                      type="button"
                      onClick={() => setPreviewImage(parseInspectionNote(activeOrder.inspectionNote).imageUrl)}
                      className="mt-2 block h-24 w-24 overflow-hidden rounded-md border border-gray-200 bg-gray-100"
                    >
                      <img src={parseInspectionNote(activeOrder.inspectionNote).imageUrl} alt="Ảnh minh chứng Return" className="h-full w-full object-cover" />
                    </button>
                  ) : (
                    <p className="mt-1 font-medium">Không có ảnh minh chứng</p>
                  )}
                </div>
              </div>
            </section>
          )}
          <h4 className="font-medium text-gray-900 mb-3">Danh sách sản phẩm chi tiết</h4>
          <div className="space-y-4">
            {activeOrder.details?.map(detail => (
              <div key={detail.id} className="border border-gray-200 rounded-lg p-4 flex flex-col gap-3">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-gray-900 text-base">{detail.costumeName}</p>
                    <p className="text-sm text-gray-500 mt-1">
                      SKU: <span className="font-medium">{detail.skuCode || 'N/A'}</span> | Size: <span className="font-medium">{detail.size || 'N/A'}</span>
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      Giá thuê: {formatCurrency(detail.subtotal)} | Cọc: {formatCurrency(detail.deposit)}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {activeOrder.status === 'CANCELLED' ? (
                      <StatusBadge status="CANCELLED" label="Đã hủy" />
                    ) : (
                      <StatusBadge status={detail.returnStatus || 'NOT_RETURNED'} label={getDetailStatusLabel(detail.returnStatus || 'NOT_RETURNED')} />
                    )}
                  </div>
                </div>
                {/* Các loại phí phát sinh / hoàn tiền nếu có */}
                {(detail.lateFee > 0 || detail.damageFee > 0 || detail.refundedAmount > 0) && (
                  <div className="bg-gray-50 p-3 rounded-md text-sm grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2 border border-gray-100">
                    {detail.lateFee > 0 && <div className="flex justify-between sm:block"><span className="text-gray-500">Phí trễ hạn:</span> <span className="font-medium text-red-600 sm:ml-2">{formatCurrency(detail.lateFee)}</span></div>}
                    {detail.damageFee > 0 && <div className="flex justify-between sm:block"><span className="text-gray-500">Phí hư hỏng:</span> <span className="font-medium text-red-600 sm:ml-2">{formatCurrency(detail.damageFee)}</span></div>}
                    {detail.refundedAmount > 0 && <div className="flex justify-between sm:col-span-2"><span className="text-gray-500">Đã hoàn tiền cọc:</span> <span className="font-medium text-green-600 sm:ml-2">{formatCurrency(detail.refundedAmount)}</span></div>}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-3 rounded-b-lg">
          {(activeOrder.status === 'PENDING' || activeOrder.status === 'CONFIRMED') && (
            <button 
              onClick={() => setShowCompensateConfirm(true)}
              className="px-4 py-2 bg-red-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-red-700 transition"
            >
              Hủy & Đền bù
            </button>
          )}
          <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">
            Đóng
          </button>
        </div>
        </>
        )}
      </div>
    </div>
  );
}
