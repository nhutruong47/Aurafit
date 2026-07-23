import { useState } from 'react';
import AlertMessage from '../ui/AlertMessage';
import ImageUploadField from '../ui/ImageUploadField';
import { StatusBadge } from './StaffDashboardShared';
import { formatDateTime, getDetailStatusLabel } from './StaffDashboardUtils';

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

export default function ShippingTab({
  filteredOrders,
  activeOrder,
  handoverImageUrl,
  handoverImageFile,
  note,
  isSubmitting,
  error,
  message,
  searchQuery,
  setSearchQuery,
  openOrder,
  setMode,
  setHandoverImageFile,
  setNote,
  handleHandoverImageUploaded,
  submitShipping,
  markOrderRented,
  handleDeliveryFailed,
  handleLostPackage,
  setPreviewImage
}) {
  const [activeSubTab, setActiveSubTab] = useState('PENDING'); // PENDING or IN_TRANSIT

  const displayedOrders = filteredOrders.filter(o => 
    activeSubTab === 'PENDING' ? o.status === 'CONFIRMED' : o.status === 'SHIPPING'
  );
  
  const isOrderValidForTab = activeOrder && displayedOrders.some(o => o.id === activeOrder.id);
  const trackingCode = activeOrder?.ghnOrderCode || activeOrder?.trackingCode || activeOrder?.deliveryInfo?.trackingCode;

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
              Chờ giao
            </button>
            <button
              onClick={() => setActiveSubTab('IN_TRANSIT')}
              className={`flex-1 py-1.5 text-sm font-medium rounded-sm transition-colors ${
                activeSubTab === 'IN_TRANSIT' ? 'bg-white text-[#171717] shadow-sm' : 'text-gray-500 hover:text-[#171717]'
              }`}
            >
              Đang giao
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
              {activeSubTab === 'PENDING' ? 'Không có đơn hàng cần giao (GHN).' : 'Không có đơn hàng đang giao.'}
            </div>
          ) : (
            displayedOrders.map(order => (
              <button
                key={order.id}
                onClick={() => {
                  setMode('SHIPPING');
                  openOrder(order.id);
                }}
                className={`w-full text-left p-4 hover:bg-[#f4f4f2] transition-colors ${activeOrder?.id === order.id ? 'bg-[#f4f4f2] border-l-4 border-[#7f7041]' : ''}`}
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
            Chọn một đơn hàng bên trái để xem chi tiết
          </div>
        ) : (
          <>
            <div className="rounded-none md:rounded-sm bg-white p-5 shadow-sm border border-[#d7d2c8] shrink-0">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-sm">
                <div className="space-y-3">
                  <h4 className="font-serif italic text-lg font-normal text-[#171717] border-b pb-2 mb-3">Thông tin Đơn hàng</h4>
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
                    <span className="font-medium text-gray-900 text-right">{activeOrder.deliveryMethod === 'GHN_DELIVERY' ? 'Giao hàng GHN' : 'Nhận tại cửa hàng'}</span>
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
                </div>
                
                <div className="space-y-3 border-t lg:border-t-0 lg:border-l border-gray-200 lg:pl-6 pt-4 lg:pt-0">
                  <h4 className="font-serif italic text-lg font-normal text-[#171717] border-b pb-2 mb-3">Thông tin Tài chính</h4>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Phí thuê:</span>
                    <span className="font-medium">{formatCurrency(activeOrder.totalRentalFee || activeOrder.totalRentalPrice || 0)}</span>
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
            </div>

            <div className="rounded-none md:rounded-sm bg-white p-6 shadow-sm border border-[#d7d2c8] flex flex-col">
              {activeSubTab === 'PENDING' ? (
                <>
                  <h3 className="font-serif italic text-xl font-normal text-[#171717] border-b pb-3 mb-4">Đóng gói & Giao GHN</h3>
                  <form onSubmit={(e) => { e.preventDefault(); submitShipping(); }} className="flex flex-col gap-6">
                    <div className="space-y-4">
                      <h4 className="font-serif italic text-lg font-normal text-[#171717]">Danh sách sản phẩm (Cần đóng gói)</h4>
                      {activeOrder.details?.map(detail => (
                        <div key={detail.id} className="p-4 border border-gray-200 rounded-md bg-gray-50 flex flex-col gap-3">
                          <div className="font-medium text-gray-900">{detail.costumeName}</div>
                          <div className="flex justify-between text-sm text-gray-500">
                            <span>Phí thuê: <span className="font-medium text-gray-900">{formatCurrency(detail.subtotal)}</span></span>
                            <span>Tiền cọc: <span className="font-medium text-gray-900">{formatCurrency(detail.deposit)}</span></span>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="border-t border-gray-200 pt-4 grid grid-cols-1 md:grid-cols-2 gap-6 bg-white shrink-0">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Ảnh minh chứng đóng gói (Bắt buộc)</label>
                        <ImageUploadField
                          label=""
                          value={handoverImageUrl}
                          disabled={isSubmitting}
                          readyLabel="Ảnh đã chọn."
                          autoUpload={false}
                          hideUploadButton={true}
                          onFileSelect={(file) => setHandoverImageFile(file)}
                          onUploaded={handleHandoverImageUploaded}
                        />
                        {(handoverImageUrl || handoverImageFile) && (
                          <button type="button" onClick={() => setPreviewImage(handoverImageFile ? URL.createObjectURL(handoverImageFile) : handoverImageUrl)} className="mt-2 text-xs font-medium text-[#7f7041] hover:underline flex items-center gap-1">
                            <span className="material-symbols-outlined text-[14px]">image</span>
                            Xem ảnh minh chứng đóng gói
                          </button>
                        )}
                      </div>
                      <div className="flex flex-col gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú đóng gói</label>
                          <textarea
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            rows={2}
                            className="block w-full rounded-md border-[#d7d2c8] text-sm border p-3 focus:border-[#7f7041] focus:ring-[#7f7041]"
                            placeholder="Ghi chú đóng gói, tình trạng hàng..."
                          />
                        </div>
                    <div className="mt-auto">
                      {(!handoverImageUrl && !handoverImageFile) && (
                        <p className="text-xs text-red-500 mb-2 italic">* Vui lòng chọn ảnh minh chứng đóng gói</p>
                      )}
                      <button
                        type="submit"
                        disabled={isSubmitting || (!handoverImageUrl && !handoverImageFile)}
                        className="w-full py-2.5 px-4 border border-transparent rounded-sm shadow-sm text-sm font-medium text-white bg-[#111111] hover:bg-[#7f7041] transition-colors focus:outline-none disabled:bg-[#d7d2c8] disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSubmitting ? 'Đang xử lý...' : `GIAO HÀNG CHO GHN`}
                      </button>
                    </div>
                      </div>
                    </div>
                  </form>
                </>
              ) : (
                <>
                  <h3 className="font-serif italic text-xl font-normal text-[#171717] border-b pb-3 mb-4">Theo dõi Đơn Hàng GHN</h3>
                  <div className="flex flex-col gap-6">
                    <div className="bg-orange-50 border border-orange-100 p-4 rounded-md flex items-center justify-between shrink-0">
                      <div>
                        <div className="text-sm text-orange-800 font-medium mb-1">Mã vận đơn GHN</div>
                        <div className="text-2xl font-bold text-orange-600">{trackingCode || 'Đang cập nhật...'}</div>
                      </div>
                      <span className="material-symbols-outlined text-orange-400 text-4xl">local_shipping</span>
                    </div>

                    <div className="border border-gray-200 rounded-md p-4 bg-gray-50">
                      <h4 className="font-serif italic text-lg font-normal text-[#171717] mb-3">Danh sách sản phẩm chi tiết</h4>
                      <div className="space-y-4">
                        {activeOrder.details?.map(detail => (
                          <div key={detail.id} className="border border-gray-200 rounded-lg p-4 flex flex-col gap-3 bg-white">
                            <div className="flex justify-between items-start">
                              <div className="flex gap-4">
                                <div className="h-20 w-16 shrink-0 overflow-hidden bg-gray-100 rounded border border-gray-200">
                                  <img 
                                    src={detail.costumeImageUrl || 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=200&q=80'} 
                                    alt={detail.costumeName} 
                                    className="h-full w-full object-cover" 
                                  />
                                </div>
                                <div>
                                  <p className="font-medium text-gray-900 text-base">{detail.costumeName}</p>
                                  <p className="text-sm text-gray-500 mt-1">
                                    SKU: <span className="font-medium">{detail.skuCode || 'N/A'}</span> | Size: <span className="font-medium">{detail.size || 'N/A'}</span>
                                  </p>
                                  <p className="text-sm text-gray-500 mt-1">
                                    Giá thuê: {formatCurrency(detail.subtotal)} | Cọc: {formatCurrency(detail.deposit)}
                                  </p>
                                </div>
                              </div>
                              <div className="flex flex-col items-end gap-2 shrink-0">
                                <StatusBadge status={detail.returnStatus || 'PENDING'} label={getDetailStatusLabel(detail.returnStatus || 'PENDING')} />
                                {detail.itemStatus && <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded border border-gray-200">Tình trạng: {detail.itemStatus}</span>}
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

                    <div className="space-y-4 shrink-0">
                      <h4 className="font-serif italic text-lg font-normal text-[#171717]">Hành động trạng thái</h4>
                      <div className="flex flex-col gap-3">
                        <button
                          onClick={() => markOrderRented()}
                          disabled={isSubmitting}
                          className="w-full flex items-center justify-center gap-2 py-3 px-4 border border-transparent rounded-sm shadow-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none disabled:bg-gray-400"
                        >
                          <span className="material-symbols-outlined">check_circle</span>
                          XÁC NHẬN KHÁCH ĐÃ NHẬN HÀNG
                        </button>
                        
                        <div className="flex gap-3">
                          <button
                            onClick={() => {
                              const reason = prompt("Lý do báo Boom hàng / Giao thất bại:");
                              if (reason) handleDeliveryFailed(reason);
                            }}
                            disabled={isSubmitting}
                            className="flex-1 flex items-center justify-center gap-2 py-2 px-4 border border-red-300 rounded-md shadow-sm text-sm font-medium text-red-700 bg-white hover:bg-red-50 focus:outline-none disabled:bg-gray-100 disabled:text-gray-400"
                          >
                            <span className="material-symbols-outlined text-[18px]">cancel</span>
                            Báo Boom hàng
                          </button>
                          <button
                            onClick={() => {
                              const reason = prompt("Lý do báo Thất lạc hàng hóa:");
                              if (reason) handleLostPackage(reason);
                            }}
                            disabled={isSubmitting}
                            className="flex-1 flex items-center justify-center gap-2 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none disabled:bg-gray-100 disabled:text-gray-400"
                          >
                            <span className="material-symbols-outlined text-[18px]">help_center</span>
                            Báo Thất lạc
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
