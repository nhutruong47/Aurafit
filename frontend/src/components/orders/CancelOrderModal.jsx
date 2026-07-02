import { useState } from 'react';

const CANCEL_REASONS = [
  'Muốn thay đổi sản phẩm',
  'Thay đổi thông tin giao hàng',
  'Quên nhập mã khuyến mãi',
  'Lý do khác...'
];

export default function CancelOrderModal({ isOpen, onClose, onConfirm, isSubmitting }) {
  const [selectedReason, setSelectedReason] = useState(CANCEL_REASONS[0]);
  const [otherReason, setOtherReason] = useState('');

  if (!isOpen) return null;

  const handleConfirm = () => {
    const finalReason = selectedReason === 'Lý do khác...' && otherReason.trim()
      ? otherReason.trim()
      : selectedReason;
    onConfirm(finalReason);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={!isSubmitting ? onClose : undefined}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-md bg-white shadow-2xl animate-[fadeIn_0.3s_ease-out]">
        <div className="border-b border-gray-200 px-8 py-6">
          <h2 className="font-serif text-2xl uppercase tracking-widest text-black">
            Hủy đơn hàng
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            Vui lòng cho chúng tôi biết lý do bạn muốn hủy đơn hàng này.
          </p>
        </div>

        <div className="px-8 py-6 space-y-4">
          {CANCEL_REASONS.map((reason) => (
            <label key={reason} className="flex items-start gap-3 cursor-pointer group">
              <div className="relative flex h-5 items-center justify-center">
                <input
                  type="radio"
                  name="cancelReason"
                  value={reason}
                  checked={selectedReason === reason}
                  onChange={(e) => setSelectedReason(e.target.value)}
                  className="peer h-4 w-4 appearance-none rounded-full border border-gray-300 bg-white checked:border-black focus:outline-none transition-all"
                />
                <div className="absolute h-2 w-2 rounded-full bg-black opacity-0 peer-checked:opacity-100 transition-opacity" />
              </div>
              <span className={`text-sm transition-colors ${selectedReason === reason ? 'text-black font-medium' : 'text-gray-600 group-hover:text-black'}`}>
                {reason}
              </span>
            </label>
          ))}

          {selectedReason === 'Lý do khác...' && (
            <div className="pl-7 mt-2 animate-[fadeIn_0.2s_ease-out]">
              <textarea
                value={otherReason}
                onChange={(e) => setOtherReason(e.target.value)}
                placeholder="Nhập lý do cụ thể của bạn..."
                className="w-full border border-gray-300 p-3 text-sm focus:border-black focus:outline-none min-h-[80px] resize-none"
              />
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-4 border-t border-gray-200 bg-gray-50 px-8 py-6">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="text-sm font-medium uppercase tracking-wider text-gray-500 hover:text-black transition-colors"
          >
            Đóng
          </button>
          <button
            onClick={handleConfirm}
            disabled={isSubmitting}
            className="bg-black px-6 py-3 text-sm font-medium uppercase tracking-wider text-white hover:bg-gray-800 transition-colors disabled:opacity-50"
          >
            {isSubmitting ? 'Đang xử lý...' : 'Xác nhận hủy'}
          </button>
        </div>
      </div>
    </div>
  );
}
