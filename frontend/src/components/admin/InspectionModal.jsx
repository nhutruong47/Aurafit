import { useState, useEffect } from 'react';
import { adminOrderService } from '../../services/adminOrderService';

const InspectionModal = ({ order, isOpen, onClose, onSuccess }) => {
  const [actualReturnDate, setActualReturnDate] = useState(new Date().toISOString().split('T')[0]);
  const [damageFee, setDamageFee] = useState(0);
  const [lateFee, setLateFee] = useState(0);
  const [inspectionNote, setInspectionNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (order && actualReturnDate) {
      const returnDate = new Date(actualReturnDate);
      const endDate = new Date(order.rentalEndDate);
      const startDate = new Date(order.rentalStartDate);
      const diffTime = returnDate.getTime() - endDate.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays > 0) {
        let rentalDurationDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        if (rentalDurationDays <= 0) rentalDurationDays = 1;
        
        const totalRentalFee = Number(order.totalRentalFee || order.totalRentalPrice || 0);
        const dailyRate = totalRentalFee / rentalDurationDays;
        
        const calculatedLateFee = Math.round(dailyRate * 1.5 * diffDays);
        setLateFee(calculatedLateFee);
      } else {
        setLateFee(0);
      }
    }
  }, [actualReturnDate, order]);

  if (!isOpen || !order) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      if (damageFee < 0 || lateFee < 0) {
        throw new Error('Phí không thể là số âm');
      }
      
      const payload = {
        damageFee: Number(damageFee),
        lateFee: Number(lateFee),
        inspectionNote: inspectionNote,
        actualReturnDate: actualReturnDate
      };

      await adminOrderService.completeOrder(order.id, payload);
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Có lỗi xảy ra khi nghiệm thu');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={onClose}></div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <form onSubmit={handleSubmit}>
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div className="sm:flex sm:items-start">
                <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                  <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                    Nghiệm thu Đơn hàng #{order.id}
                  </h3>
                  
                  {error && (
                    <div className="mt-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative text-sm">
                      {error}
                    </div>
                  )}

                  <div className="mt-4 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Ngày trả thực tế</label>
                      <input
                        type="date"
                        required
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[#99854e] focus:border-[#99854e] sm:text-sm"
                        value={actualReturnDate}
                        onChange={(e) => setActualReturnDate(e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Phí phạt trễ (VND)</label>
                      <input
                        type="text"
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[#99854e] focus:border-[#99854e] sm:text-sm"
                        value={lateFee ? Number(lateFee).toLocaleString('vi-VN') : ''}
                        onChange={(e) => setLateFee(e.target.value.replace(/\D/g, ''))}
                      />
                      <p className="mt-1 text-xs text-gray-500">Mặc định tính phí phạt = 1.5x Giá thuê ngày. Bạn có thể tự chỉnh sửa (nhập 0 nếu lỗi vận chuyển).</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Phí đền bù hư hỏng (VND)</label>
                      <input
                        type="text"
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[#99854e] focus:border-[#99854e] sm:text-sm"
                        value={damageFee ? Number(damageFee).toLocaleString('vi-VN') : ''}
                        onChange={(e) => setDamageFee(e.target.value.replace(/\D/g, ''))}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Ghi chú kiểm định</label>
                      <textarea
                        rows="3"
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[#99854e] focus:border-[#99854e] sm:text-sm"
                        value={inspectionNote}
                        onChange={(e) => setInspectionNote(e.target.value)}
                        placeholder="Nhập tình trạng hàng hoá, lý do đền bù (nếu có)..."
                      ></textarea>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-[#1976d2] text-base font-medium text-white hover:bg-[#115293] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1976d2] sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
              >
                {isSubmitting ? 'Đang xử lý...' : 'Xác nhận Nghiệm Thu'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#99854e] sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
              >
                Huỷ
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default InspectionModal;
