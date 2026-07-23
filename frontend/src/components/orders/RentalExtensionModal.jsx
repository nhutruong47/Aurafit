import { useState, useMemo } from 'react';
import { extendRentalOrder } from '../../services/rentalOrderService';
import { useToastStore } from '../../store/useToastStore';
import { formatCurrency } from '../../utils/formatCurrency';
import { getOrderCode } from './orderUtils';

const formatDate = (isoString) => {
  if (!isoString) return '';
  const date = new Date(isoString);
  return date.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

export default function RentalExtensionModal({ isOpen, onClose, order, onSuccess }) {
  const [newEndDate, setNewEndDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const addToast = useToastStore((state) => state.addToast);

  const { currentEndDate, minDate, dailyPrice } = useMemo(() => {
    if (!order) return {};
    const end = order.rentalEndDate || (order.details && order.details[0]?.rentalEndDate);
    let min = '';
    
    if (end) {
      const d = new Date(end);
      d.setDate(d.getDate() + 1);
      min = d.toISOString().split('T')[0];
    } else {
      const today = new Date();
      today.setDate(today.getDate() + 1);
      min = today.toISOString().split('T')[0];
    }

    const price = order.details?.reduce((sum, item) => sum + Number(item.rentalPrice || 0), 0) || 0;
    
    return { currentEndDate: end, minDate: min, dailyPrice: price };
  }, [order]);

  const extraDays = useMemo(() => {
    if (!newEndDate || !currentEndDate) return 0;
    const current = new Date(currentEndDate);
    current.setHours(0, 0, 0, 0);
    const next = new Date(newEndDate);
    next.setHours(0, 0, 0, 0);
    const diff = next - current;
    return diff > 0 ? Math.ceil(diff / (1000 * 60 * 60 * 24)) : 0;
  }, [newEndDate, currentEndDate]);

  if (!isOpen || !order) return null;

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
      onSuccess?.();
      onClose?.();
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
          <button onClick={onClose} className="text-[#8b8787] hover:text-black transition">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="mb-6 rounded-sm bg-gray-50 p-4 border border-[#e5e5e5]">
          <h3 className="mb-3 text-[10px] font-bold uppercase tracking-widest text-[#5f5e5e]">Thông tin đơn thuê</h3>
          <div className="space-y-2 text-sm text-[#3d3d3d]">
            <div className="flex justify-between">
              <span>Mã đơn:</span>
              <span className="font-semibold text-black">{getOrderCode(order.id)}</span>
            </div>
            <div className="flex justify-between">
              <span>Đang thuê đến:</span>
              <span className="font-semibold text-black">{formatDate(currentEndDate)}</span>
            </div>
            <div className="flex justify-between">
              <span>Giá thuê / ngày:</span>
              <span className="font-semibold text-black">{formatCurrency(dailyPrice)}</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="mb-2 block text-[10px] font-bold uppercase tracking-wider text-[#3d3d3d]">
              Ngày hoàn trả mới
            </label>
            <input
              type="date"
              min={minDate}
              value={newEndDate}
              onChange={(e) => setNewEndDate(e.target.value)}
              className="w-full border border-[#cfc4c5] bg-white px-4 py-3 text-sm focus:border-black focus:outline-none transition"
              required
            />
            {extraDays > 0 && (
              <p className="mt-2 text-[12px] font-medium text-[#7f7041]">
                Gia hạn thêm: <span className="font-bold">{extraDays} ngày</span>
              </p>
            )}
          </div>

          <div className="text-amber-700 bg-amber-50 p-3 rounded-sm border border-amber-100 text-[12px] leading-relaxed">
            <span className="font-bold block mb-1">Lưu ý:</span>
            Phí gia hạn phát sinh sẽ được hệ thống tự động cấn trừ vào khoản tiền cọc của bạn khi hoàn trả.
          </div>

          {error && <p className="text-[12px] font-semibold text-red-600">{error}</p>}

          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="w-1/2 border border-[#cfc4c5] bg-white px-6 py-3 text-[11px] font-bold uppercase tracking-widest text-[#3d3d3d] transition hover:bg-[#f4f4f2] hover:text-black disabled:opacity-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !newEndDate}
              className="w-1/2 border border-black bg-black px-6 py-3 text-[11px] font-bold uppercase tracking-widest text-white transition hover:bg-[#99854e] hover:border-[#99854e] disabled:opacity-50 disabled:bg-gray-300 disabled:border-gray-300"
            >
              {isSubmitting ? 'Đang xử lý...' : 'Xác nhận'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
