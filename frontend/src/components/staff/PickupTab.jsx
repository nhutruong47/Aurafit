import AlertMessage from '../ui/AlertMessage';
import ImageUploadField from '../ui/ImageUploadField';
import { StatusBadge } from './StaffDashboardShared';
import { formatCurrency, formatDate, formatDateTime, getDetailStatusLabel } from './StaffDashboardUtils';
import OrderItemPromotion from '../orders/OrderItemPromotion';

export default function PickupTab({
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
  submitHandover,
  setPreviewImage
}) {
  const isOrderValidForTab = activeOrder && filteredOrders.some(o => o.id === activeOrder.id);

  return (
    <div className="flex h-full gap-6">
      <div className="w-1/3 flex flex-col gap-4">
        <div className="rounded-none md:rounded-sm bg-white border border-[#d7d2c8] p-4 shadow-sm">
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
            Chọn một đơn hàng bên trái để xử lý
          </div>
        ) : (
          <>
            <div className="rounded-none md:rounded-sm bg-white p-6 shadow-sm border border-[#d7d2c8] shrink-0">
              <h3 className="font-serif italic text-xl font-normal text-[#171717] border-b pb-3 mb-4">Thông tin khách hàng & Đơn hàng</h3>
              <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-sm">
                <div><span className="text-gray-500">Khách hàng:</span> <span className="font-medium ml-1">{activeOrder.customerName}</span></div>
                <div><span className="text-gray-500">Điện thoại:</span> <span className="font-medium ml-1">{activeOrder.customerPhone}</span></div>
                <div><span className="text-gray-500">Ngày tạo đơn:</span> <span className="font-medium ml-1">{formatDateTime(activeOrder.createdAt)}</span></div>
                <div><span className="text-gray-500">Giao hàng:</span> <span className="font-medium ml-1">{activeOrder.deliveryMethod === 'GHN_DELIVERY' ? 'Giao hàng GHN' : 'Nhận tại cửa hàng'}</span></div>
                <div className="col-span-2"><span className="text-gray-500">{activeOrder.deliveryMethod === 'GHN_DELIVERY' ? 'Địa chỉ giao hàng:' : 'Địa chỉ khách hàng:'}</span> <span className="font-medium ml-1">{activeOrder.deliveryAddress || 'Nhận tại cửa hàng'}</span></div>
                <div><span className="text-gray-500">Ngày lấy dự kiến:</span> <span className="font-medium ml-1">{formatDate(activeOrder.rentalStartDate)}</span></div>
                <div><span className="text-gray-500">Ngày trả dự kiến:</span> <span className="font-medium ml-1">{formatDate(activeOrder.rentalEndDate)}</span></div>
                <div><span className="text-gray-500">Tổng cọc:</span> <span className="font-medium text-blue-600 ml-1">{formatCurrency(activeOrder.totalDeposit)}</span></div>
              </div>
            </div>

            <div className="rounded-none md:rounded-sm bg-white p-6 shadow-sm border border-[#d7d2c8] flex flex-col">
              <h3 className="font-serif italic text-xl font-normal text-[#171717] border-b pb-3 mb-4">Biên bản xử lý PICKUP</h3>
              <form onSubmit={(e) => { e.preventDefault(); submitHandover(); }} className="flex flex-col gap-6">
                <div className="space-y-4">
                  <h4 className="font-serif italic text-lg font-normal text-[#171717]">Danh sách sản phẩm</h4>
                  {activeOrder.details?.map(detail => (
                    <div key={detail.id} className="p-4 border border-gray-200 rounded-md bg-gray-50 flex flex-col gap-3">
                      <div className="font-medium text-gray-900">{detail.costumeName}</div>
                      <OrderItemPromotion detail={detail} />
                      <div className="flex justify-between text-sm text-gray-500">
                         <span>Tiền cọc: <span className="font-medium text-gray-900">{formatCurrency(detail.deposit)}</span></span>
                         <span>Trạng thái: {getDetailStatusLabel(detail.returnStatus || 'PENDING')}</span>
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
                      readyLabel="Ảnh đã chọn."
                      autoUpload={false}
                      hideUploadButton={true}
                      onFileSelect={(file) => setHandoverImageFile(file)}
                      onUploaded={handleHandoverImageUploaded}
                    />
                    {(handoverImageUrl || handoverImageFile) && (
                       <button type="button" onClick={() => setPreviewImage(handoverImageFile ? URL.createObjectURL(handoverImageFile) : handoverImageUrl)} className="mt-2 text-xs font-medium text-[#7f7041] hover:underline flex items-center gap-1">
                         <span className="material-symbols-outlined text-[14px]">image</span>
                         Xem ảnh minh chứng
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
                        className="block w-full rounded-md border-[#d7d2c8] text-sm border p-3 focus:border-[#7f7041] focus:ring-[#7f7041]"
                        placeholder="Ghi chú thêm..."
                      />
                    </div>
                    <div className="mt-auto">
                      {(!handoverImageUrl && !handoverImageFile) && (
                        <p className="text-xs text-red-500 mb-2 italic">* Vui lòng chọn ảnh minh chứng</p>
                      )}
                      <button
                        type="submit"
                        disabled={isSubmitting || (!handoverImageUrl && !handoverImageFile)}
                        className="w-full py-2.5 px-4 border border-transparent rounded-sm shadow-sm text-sm font-medium text-white bg-[#111111] hover:bg-[#7f7041] transition-colors focus:outline-none disabled:bg-[#d7d2c8] disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSubmitting ? 'Đang xử lý...' : `Xác nhận PICKUP`}
                      </button>
                    </div>
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
