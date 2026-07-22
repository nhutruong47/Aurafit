import { useState } from 'react';
import { extendRentalOrder } from '../../services/rentalOrderService';
import { useToastStore } from '../../store/useToastStore';

export default function RentalExtensionModal({ isOpen, onClose, order, onSuccess }) {
  const [newEndDate, setNewEndDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const addToast = useToastStore((state) => state.addToast);

  if (!isOpen || !order) return null;

  // Min date should be tomorrow or order.details[0].rentalEndDate + 1 day
  // Just use tomorrow as a safe default minimum.
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newEndDate) {
      setError('Vui lòng chọn ngày trả mới.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await extendRentalOrder(order.id, newEndDate);
      addToast('Gia hạn thành công!', 'success');
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.message || 'Không thể gia hạn đơn hàng. Ngày này có thể đã có người khác đặt.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md animate-[fadeIn_0.3s_ease-out_forwards] border border-[#cfc4c5] bg-[#fafaf8] p-8 shadow-2xl">
        <div className="mb-6 flex items-center justify-between border-b border-[#cfc4c5] pb-4">
          <h2 className="font-serif text-2xl font-normal">Gia hạn thuê</h2>
          <button onClick={onClose} className="text-[#8b8787] hover:text-black">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="mb-2 block text-sm font-semibold uppercase tracking-wider text-[#3d3d3d]">
              Ngày hoàn trả mới
            </label>
            <input
              type="date"
              min={minDate}
              value={newEndDate}
              onChange={(e) => setNewEndDate(e.target.value)}
              className="w-full border border-[#cfc4c5] bg-white px-4 py-3 text-sm focus:border-black focus:outline-none"
              required
            />
          </div>

          <div className="text-amber-600 bg-amber-50 p-3 rounded-md text-sm">
            <span className="font-bold block mb-1">Lưu ý:</span>
            Phí gia hạn phát sinh sẽ được hệ thống tự động cấn trừ vào khoản tiền cọc của bạn khi hoàn trả.
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="w-1/2 border border-[#cfc4c5] bg-white px-6 py-3 text-[12px] font-semibold uppercase tracking-widest text-[#3d3d3d] transition hover:bg-[#f4f4f2] hover:text-black disabled:opacity-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-1/2 border border-black bg-black px-6 py-3 text-[12px] font-semibold uppercase tracking-widest text-white transition hover:bg-[#99854e] hover:border-[#99854e] disabled:opacity-50"
            >
              {isSubmitting ? 'Đang xử lý...' : 'Xác nhận'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
