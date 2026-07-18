import React from 'react';
import AlertMessage from '../ui/AlertMessage';
import ImageUploadField from '../ui/ImageUploadField';
import { StatusBadge } from './StaffDashboardShared';

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

export default function PickupTab({
  filteredOrders,
  activeOrder,
  handoverImageUrl,
  note,
  isSubmitting,
  error,
  message,
  searchQuery,
  setSearchQuery,
  openOrder,
  setMode,
  setHandoverImageUrl,
  setNote,
  handleHandoverImageUploaded,
  submitHandover,
  setPreviewImage
}) {
  const isOrderValidForTab = activeOrder && filteredOrders.some(o => o.id === activeOrder.id);

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
            <div className="p-6 text-center text-sm text-gray-500">Không có đơn hàng cần xử lý.</div>
          ) : (
            filteredOrders.map(order => (
              <button
                key={order.id}
                onClick={() => {
                  setMode('PICKUP');
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
            <div className="rounded-lg bg-white p-6 shadow-sm border border-gray-200 shrink-0">
              <h3 className="text-lg font-medium text-gray-900 border-b pb-3 mb-4">Thông tin khách hàng & Đơn hàng</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-gray-500">Khách hàng:</span> <span className="font-medium">{activeOrder.customerName}</span></div>
                <div><span className="text-gray-500">Điện thoại:</span> <span className="font-medium">{activeOrder.customerPhone}</span></div>
                <div><span className="text-gray-500">Ngày lấy dự kiến:</span> <span className="font-medium">{formatDate(activeOrder.rentalStartDate)}</span></div>
                <div><span className="text-gray-500">Ngày trả dự kiến:</span> <span className="font-medium">{formatDate(activeOrder.rentalEndDate)}</span></div>
                <div className="col-span-2"><span className="text-gray-500">Tổng cọc:</span> <span className="font-medium text-blue-600">{formatCurrency(activeOrder.totalDeposit)}</span></div>
              </div>
            </div>

            <div className="rounded-lg bg-white p-6 shadow-sm border border-gray-200 flex-1 flex flex-col">
              <h3 className="text-lg font-medium text-gray-900 border-b pb-3 mb-4">Biên bản xử lý PICKUP</h3>
              <form onSubmit={(e) => { e.preventDefault(); submitHandover(); }} className="flex-1 flex flex-col gap-6 overflow-hidden">
                <div className="flex-1 overflow-auto space-y-4 pr-2">
                  <h4 className="font-medium text-sm text-gray-700">Danh sách sản phẩm</h4>
                  {activeOrder.details?.map(detail => (
                    <div key={detail.id} className="p-4 border border-gray-200 rounded-md bg-gray-50 flex flex-col gap-3">
                      <div className="font-medium text-gray-900">{detail.costumeName}</div>
                      <div className="flex justify-between text-sm text-gray-500">
                         <span>Tiền cọc: <span className="font-medium text-gray-900">{formatCurrency(detail.depositPrice)}</span></span>
                         <span>Trạng thái: {detail.returnStatus || 'PENDING'}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-gray-200 pt-4 grid grid-cols-1 md:grid-cols-2 gap-6 bg-white shrink-0">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ảnh minh chứng</label>
                    <ImageUploadField
                      label=""
                      value={handoverImageUrl}
                      disabled={isSubmitting}
                      readyLabel="Ảnh đã được tải lên Cloudinary."
                      autoUpload={true}
                      onUploaded={handleHandoverImageUploaded}
                    />
                    {handoverImageUrl && (
                       <button type="button" onClick={() => setPreviewImage(handoverImageUrl)} className="mt-2 aspect-[2/1] w-full max-w-[200px] rounded-md overflow-hidden bg-gray-100 border border-gray-200">
                         <img src={handoverImageUrl} className="w-full h-full object-cover" alt="Minh chứng" />
                       </button>
                    )}
                  </div>
                  <div className="flex flex-col gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú chung</label>
                      <textarea
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        rows={2}
                        className="block w-full rounded-md border-gray-300 text-sm border p-3 focus:border-blue-500 focus:ring-blue-500"
                        placeholder="Ghi chú thêm..."
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={isSubmitting || !handoverImageUrl.trim()}
                      className="w-full py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none disabled:bg-gray-400 mt-auto"
                    >
                      {isSubmitting ? 'Đang xử lý...' : `Xác nhận PICKUP`}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
