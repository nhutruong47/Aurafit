import { useEffect, useMemo, useRef, useState } from 'react';
import { uploadImage } from '../../services/uploadService';
import { notify } from '../../utils/notify';

const ACCEPTED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp'];
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

const getUploadAssetUrl = (asset) => (
  asset?.secureUrl || asset?.secure_url || asset?.imageUrl || asset?.image_url || asset?.url || ''
).trim();

const formatFileSize = (sizeInBytes) => {
  if (!Number.isFinite(sizeInBytes) || sizeInBytes <= 0) {
    return '0 MB';
  }

  return `${(sizeInBytes / (1024 * 1024)).toFixed(2)} MB`;
};

export default function ImageUploadField({
  label = 'Ảnh',
  value,
  disabled = false,
  readyLabel = 'Ảnh đã sẵn sàng để sử dụng.',
  autoUpload = false,
  showPreview = true,
  onUploaded,
}) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [localPreviewUrl, setLocalPreviewUrl] = useState('');
  const [uploadedAsset, setUploadedAsset] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const autoUploadFileKeyRef = useRef('');

  useEffect(() => {
    if (!selectedFile) {
      setLocalPreviewUrl('');
      return undefined;
    }

    const objectUrl = URL.createObjectURL(selectedFile);
    setLocalPreviewUrl(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [selectedFile]);

  useEffect(() => {
    if (!value) {
      setUploadedAsset(null);
      setSelectedFile(null);
      setError('');
      return;
    }

    if (getUploadAssetUrl(uploadedAsset) === value) {
      return;
    }

    setSelectedFile(null);
  }, [uploadedAsset, value]);

  const previewUrl = useMemo(
    () => (
      error
        ? getUploadAssetUrl(uploadedAsset) || value || ''
        : localPreviewUrl || getUploadAssetUrl(uploadedAsset) || value || ''
    ),
    [error, localPreviewUrl, uploadedAsset, value]
  );

  const validateSelectedFile = (file) => {
    if (!file) {
      throw new Error('Vui lòng chọn một ảnh để tải lên.');
    }

    const extension = file.name.split('.').pop()?.toLowerCase() || '';
    if (!ACCEPTED_EXTENSIONS.includes(extension)) {
      throw new Error('Chỉ chấp nhận ảnh jpg, jpeg, png hoặc webp.');
    }

    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      throw new Error('Ảnh vượt quá giới hạn 5 MB.');
    }
  };

  const handleFileChange = (event) => {
    const nextFile = event.target.files?.[0] || null;
    setError('');
    setUploadedAsset(null);
    autoUploadFileKeyRef.current = '';

    if (!nextFile) {
      setSelectedFile(null);
      return;
    }

    try {
      validateSelectedFile(nextFile);
      setSelectedFile(nextFile);
    } catch (validationError) {
      const message = validationError.message || 'Tệp hình ảnh không hợp lệ.';
      setSelectedFile(null);
      setError(message);
      notify.error(message);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Quý khách vui lòng chọn tệp hình ảnh trước khi tải lên.');
      return;
    }

    setIsUploading(true);
    setError('');

    try {
      const asset = await uploadImage(selectedFile);
      setUploadedAsset(asset);
      onUploaded?.(asset);
    } catch (uploadError) {
      const detail = uploadError.message || 'Hệ thống không thể tải hình ảnh lên máy chủ.';
      const message = `Ảnh "${selectedFile.name}" tải lên thất bại: ${detail}`;
      setError(message);
      notify.error(message);
    } finally {
      setIsUploading(false);
    }
  };

  useEffect(() => {
    if (!autoUpload || !selectedFile || isUploading || uploadedAsset) return;
    const fileKey = `${selectedFile.name}:${selectedFile.size}:${selectedFile.lastModified}`;
    if (autoUploadFileKeyRef.current === fileKey) return;
    autoUploadFileKeyRef.current = fileKey;
    handleUpload();
  }, [autoUpload, selectedFile, isUploading, uploadedAsset]);

  return (
    <div className="space-y-3">
      <div>
        <p className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.16em] text-[#777777]">{label}</p>
        <input
          type="file"
          accept=".jpg,.jpeg,.png,.webp"
          disabled={disabled || isUploading}
          onChange={handleFileChange}
          className="block w-full text-sm file:mr-3 file:border-0 file:bg-black file:px-4 file:py-3 file:text-[10px] file:font-semibold file:uppercase file:tracking-[0.14em] file:text-white disabled:opacity-60"
        />
      </div>

      {selectedFile && (
        <div className="border border-[#ebe7df] bg-[#fafaf8] p-3 text-xs text-[#5f5e5e]">
          <p className="font-medium text-black">{selectedFile.name}</p>
          <p className="mt-1">Kích thước: {formatFileSize(selectedFile.size)}</p>
        </div>
      )}

      {showPreview && previewUrl && (
        <div className="overflow-hidden border border-[#ebe7df] bg-[#fafaf8]">
          <img src={previewUrl} alt="Xem trước ảnh tải lên" className="aspect-[3/4] w-full object-cover" />
        </div>
      )}

      {!autoUpload && (
      <button
        type="button"
        onClick={handleUpload}
        disabled={disabled || isUploading || !selectedFile}
        className="bg-black px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-white transition hover:bg-[#7f7041] disabled:cursor-not-allowed disabled:bg-[#777777]"
      >
        {isUploading ? 'Đang tải ảnh...' : 'Tải ảnh lên'}
      </button>
      )}

      {autoUpload && selectedFile && isUploading && (
        <p className="border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-700">Đang tải ảnh lên Cloudinary...</p>
      )}

      {autoUpload && selectedFile && error && !isUploading && (
        <button
          type="button"
          onClick={handleUpload}
          disabled={disabled}
          className="bg-black px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-white transition hover:bg-[#7f7041] disabled:cursor-not-allowed disabled:bg-[#777777]"
        >
          Tải ảnh lên lại
        </button>
      )}

      {(getUploadAssetUrl(uploadedAsset) || value) && (
        <div className="border border-[#ebe7df] bg-[#fafaf8] p-3 text-xs text-[#5f5e5e]">
          <p className="font-medium text-black">{readyLabel}</p>
          <p className="mt-1 break-all">{getUploadAssetUrl(uploadedAsset) || value}</p>
        </div>
      )}

      {error && <p className="border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
    </div>
  );
}
