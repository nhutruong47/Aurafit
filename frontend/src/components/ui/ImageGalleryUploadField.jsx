import { useState } from 'react';
import { uploadImage } from '../../services/uploadService';
import { notify } from '../../utils/notify';

const ACCEPTED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp'];
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

const getUploadAssetUrl = (asset) => (
  asset?.secureUrl || asset?.secure_url || asset?.imageUrl || asset?.image_url || asset?.url || ''
).trim();

const validateFile = (file) => {
  const extension = file.name.split('.').pop()?.toLowerCase() || '';
  if (!ACCEPTED_EXTENSIONS.includes(extension)) {
    throw new Error(`Tệp "${file.name}" không đúng định dạng jpg, jpeg, png hoặc webp.`);
  }

  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    throw new Error(`Tệp "${file.name}" vượt quá giới hạn 5 MB.`);
  }
};

export default function ImageGalleryUploadField({
  value = [],
  onChange,
  onUploadStateChange,
  label = 'Ảnh sản phẩm',
  disabled = false,
}) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [error, setError] = useState('');
  const imageUrls = Array.isArray(value) ? value : [];

  const handleFilesChange = async (event) => {
    const input = event.target;
    const files = Array.from(input.files || []);
    input.value = '';

    if (files.length === 0) return;

    setError('');
    try {
      files.forEach(validateFile);
    } catch (validationError) {
      const message = validationError.message || 'Tệp hình ảnh không hợp lệ.';
      setError(message);
      notify.error(message);
      onUploadStateChange?.({ isUploading: false, error: message });
      return;
    }

    setIsUploading(true);
    onUploadStateChange?.({ isUploading: true, error: '' });
    const nextImageUrls = [...imageUrls];
    let currentFile = null;

    try {
      for (let index = 0; index < files.length; index += 1) {
        currentFile = files[index];
        setUploadProgress(`Đang tải ảnh ${index + 1}/${files.length}...`);
        const asset = await uploadImage(currentFile);
        const uploadedUrl = getUploadAssetUrl(asset);
        if (!uploadedUrl) {
          throw new Error('Backend không trả về URL ảnh sau khi upload.');
        }

        nextImageUrls.push(uploadedUrl);
        onChange?.([...nextImageUrls]);
      }

      onUploadStateChange?.({ isUploading: false, error: '' });
    } catch (uploadError) {
      const detail = uploadError.message || 'Không thể tải ảnh lên backend.';
      const message = currentFile
        ? `Ảnh "${currentFile.name}" tải lên thất bại: ${detail}`
        : detail;
      setError(message);
      notify.error(message);
      onUploadStateChange?.({ isUploading: false, error: message });
    } finally {
      setIsUploading(false);
      setUploadProgress('');
    }
  };

  const removeImage = (indexToRemove) => {
    onChange?.(imageUrls.filter((_, index) => index !== indexToRemove));
  };

  const moveImage = (index, offset) => {
    const targetIndex = index + offset;
    if (targetIndex < 0 || targetIndex >= imageUrls.length) return;

    const reorderedUrls = [...imageUrls];
    [reorderedUrls[index], reorderedUrls[targetIndex]] = [
      reorderedUrls[targetIndex],
      reorderedUrls[index],
    ];
    onChange?.(reorderedUrls);
  };

  return (
    <div className="space-y-3">
      <div>
        <p className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.16em] text-[#777777]">
          {label}
        </p>
        <input
          type="file"
          accept=".jpg,.jpeg,.png,.webp"
          multiple
          disabled={disabled || isUploading}
          onChange={handleFilesChange}
          className="block w-full text-sm file:mr-3 file:border-0 file:bg-black file:px-4 file:py-3 file:text-[10px] file:font-semibold file:uppercase file:tracking-[0.14em] file:text-white disabled:opacity-60"
        />
        <p className="mt-1 text-xs text-[#777777]">Chọn nhiều ảnh; ảnh đầu tiên sẽ là ảnh chính.</p>
      </div>

      {imageUrls.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {imageUrls.map((imageUrl, index) => (
            <div key={`${imageUrl}-${index}`} className="border border-[#d7d2c8] bg-[#fafaf8] p-2">
              <div className="relative overflow-hidden bg-[#ebe7df]">
                <img
                  src={imageUrl}
                  alt={`Ảnh sản phẩm ${index + 1}`}
                  className="aspect-[3/4] w-full object-cover"
                />
                {index === 0 && (
                  <span className="absolute left-2 top-2 bg-black px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.12em] text-white">
                    Ảnh chính
                  </span>
                )}
              </div>

              <div className="mt-2 grid grid-cols-3 gap-1">
                <button
                  type="button"
                  onClick={() => moveImage(index, -1)}
                  disabled={disabled || isUploading || index === 0}
                  className="flex h-9 items-center justify-center border border-[#d7d2c8] text-black transition hover:border-black disabled:cursor-not-allowed disabled:opacity-30"
                  aria-label={`Đưa ảnh ${index + 1} lên trước`}
                  title="Đưa lên"
                >
                  <span className="material-symbols-outlined text-[18px]">arrow_upward</span>
                </button>
                <button
                  type="button"
                  onClick={() => moveImage(index, 1)}
                  disabled={disabled || isUploading || index === imageUrls.length - 1}
                  className="flex h-9 items-center justify-center border border-[#d7d2c8] text-black transition hover:border-black disabled:cursor-not-allowed disabled:opacity-30"
                  aria-label={`Đưa ảnh ${index + 1} xuống sau`}
                  title="Đưa xuống"
                >
                  <span className="material-symbols-outlined text-[18px]">arrow_downward</span>
                </button>
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  disabled={disabled || isUploading}
                  className="flex h-9 items-center justify-center border border-red-200 text-red-600 transition hover:border-red-600 disabled:cursor-not-allowed disabled:opacity-30"
                  aria-label={`Xóa ảnh ${index + 1}`}
                  title="Xóa ảnh"
                >
                  <span className="material-symbols-outlined text-[18px]">delete</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {isUploading && (
        <p className="border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-700">
          {uploadProgress}
        </p>
      )}
      {error && <p className="border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
    </div>
  );
}
