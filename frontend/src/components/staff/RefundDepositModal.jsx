import React, { useState } from 'react';
import ImageUploadField from '../ui/ImageUploadField';
import { adminOrderService } from '../../services/adminOrderService';

export default function RefundDepositModal({ order, refundAmount, onClose, onComplete }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [receiptImageUrl, setReceiptImageUrl] = useState('');
  const [receiptImageFile, setReceiptImageFile] = useState(null);

  const bankName = order?.customer?.bankName;
  const bankAccountNumber = order?.customer?.bankAccountNumber;
  const bankAccountName = order?.customer?.bankAccountName;

  const hasBankInfo = bankName && bankAccountNumber;
  const vietQrUrl = hasBankInfo 
    ? `https://img.vietqr.io/image/${bankName}-${bankAccountNumber}-compact2.png?amount=${refundAmount}&accountName=${encodeURIComponent(bankAccountName || '')}`
    : null;

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    alert('Đã copy: ' + text);
  };

  const handleReportInvalid = async () => {
    if (!window.confirm('Xác nhận báo lỗi thông tin ngân hàng? Đơn sẽ chuyển sang trạng thái "Chờ giải ngân".')) return;
    setIsSubmitting(true);
    setError('');
    try {
      await adminOrderService.reportInvalidBank(order.id);
      onComplete(null, true); // true indicates reported invalid
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Lỗi khi báo sai thông tin');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleComplete = async () => {
    let finalReceiptUrl = receiptImageUrl;
    if (receiptImageFile) {
      setIsSubmitting(true);
      setError('');
      try {
        const { uploadImage } = await import('../../services/uploadService');
        const asset = await uploadImage(receiptImageFile);
        finalReceiptUrl = asset?.secureUrl || asset?.secure_url || asset?.imageUrl || asset?.image_url || asset?.url || '';
      } catch (err) {
        setError('Lỗi upload biên lai: ' + err.message);
        setIsSubmitting(false);
        return;
      }
    }
    onComplete(finalReceiptUrl, false);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onMouseDown={(e) => { if (e.target === e.currentTarget && !isSubmitting) onClose(); }}
    >
      <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto shadow-xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Hoàn cọc khách hàng</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="bg-blue-50 p-3 rounded-md mb-4 flex justify-between items-center border border-blue-100">
          <span className="font-medium text-blue-900">Số tiền hoàn:</span>
          <span className="text-lg font-bold text-blue-700">{Number(refundAmount).toLocaleString('vi-VN')} đ</span>
        </div>

        {hasBankInfo ? (
          <div className="space-y-4">
            <div className="flex justify-center bg-gray-50 p-4 rounded-lg border">
              <img src={vietQrUrl} alt="VietQR" className="max-w-[250px] h-auto rounded" />
            </div>
            
            <div className="bg-gray-50 p-3 rounded-md text-sm border space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Ngân hàng:</span>
                <span className="font-medium text-right ml-2">{bankName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Số tài khoản:</span>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{bankAccountNumber}</span>
                  <button 
                    type="button"
                    onClick={() => handleCopy(bankAccountNumber)}
                    className="text-gray-400 hover:text-blue-600 transition-colors"
                    title="Copy số tài khoản"
                  >
                    <span className="material-symbols-outlined text-sm">content_copy</span>
                  </button>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Tên tài khoản:</span>
                <span className="font-medium text-right ml-2">{bankAccountName}</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Biên lai chuyển khoản <span className="text-red-500">*</span>
              </label>
              <ImageUploadField
                label=""
                value={receiptImageUrl}
                disabled={isSubmitting}
                readyLabel="Ảnh đã chọn."
                autoUpload={false}
                hideUploadButton={true}
                onFileSelect={(file) => setReceiptImageFile(file)}
                onUploaded={(asset) => {
                  const url = asset?.secureUrl || asset?.secure_url || asset?.imageUrl || asset?.image_url || asset?.url || (typeof asset === 'string' ? asset : '');
                  setReceiptImageUrl(url);
                }}
              />
              {(receiptImageUrl || receiptImageFile) && (
                <div className="mt-2 p-2 border rounded-md bg-white">
                  <img src={receiptImageFile ? URL.createObjectURL(receiptImageFile) : receiptImageUrl} alt="Biên lai" className="max-h-40 object-contain mx-auto" />
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-yellow-50 text-yellow-800 p-4 rounded-md mb-4 border border-yellow-200">
            <p className="flex items-center gap-2 font-medium mb-1">
              <span className="material-symbols-outlined">warning</span>
              Khách chưa cập nhật ngân hàng!
            </p>
            <p className="text-sm text-yellow-700">
              Vui lòng báo lỗi thông tin để khách cập nhật, sau đó mới có thể giải ngân.
            </p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded text-sm my-4 border border-red-200">
            {error}
          </div>
        )}

        <div className="mt-6 flex flex-col gap-3">
          {hasBankInfo && (
            <button
              onClick={handleComplete}
              disabled={isSubmitting || (!receiptImageUrl && !receiptImageFile)}
              className="w-full py-2.5 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? 'Đang xử lý...' : 'Đã chuyển khoản & Hoàn tất'}
            </button>
          )}
          <button
            onClick={handleReportInvalid}
            disabled={isSubmitting}
            className="w-full py-2 bg-white text-red-600 border border-red-600 rounded-md font-medium hover:bg-red-50 disabled:opacity-50 transition-colors"
          >
            Báo lỗi thông tin (Khách nhập sai)
          </button>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="w-full py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-md transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
