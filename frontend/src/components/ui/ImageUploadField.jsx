import { useEffect, useMemo, useState } from 'react';
import { uploadImage } from '../../services/uploadService';

const ACCEPTED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp'];
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

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
  onUploaded,
}) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [localPreviewUrl, setLocalPreviewUrl] = useState('');
  const [uploadedAsset, setUploadedAsset] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');

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

    if (uploadedAsset?.secureUrl === value) {
      return;
    }

    setSelectedFile(null);
  }, [uploadedAsset, value]);

  const previewUrl = useMemo(
    () => localPreviewUrl || uploadedAsset?.secureUrl || value || '',
    [localPreviewUrl, uploadedAsset, value]
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

    if (!nextFile) {
      setSelectedFile(null);
      return;
    }

    try {
      validateSelectedFile(nextFile);
      setSelectedFile(nextFile);
    } catch (validationError) {
      setSelectedFile(null);
      setError(validationError.message || 'Tệp ảnh không hợp lệ.');
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Vui lòng chọn ảnh trước khi tải lên.');
      return;
    }

    setIsUploading(true);
    setError('');

    try {
      const asset = await uploadImage(selectedFile);
      setUploadedAsset(asset);
      onUploaded?.(asset);
    } catch (uploadError) {
      setError(uploadError.message || 'Không thể tải ảnh lên.');
    } finally {
      setIsUploading(false);
    }
  };

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

      {previewUrl && (
        <div className="overflow-hidden border border-[#ebe7df] bg-[#fafaf8]">
          <img src={previewUrl} alt="Preview upload" className="aspect-[3/4] w-full object-cover" />
        </div>
      )}

      <button
        type="button"
        onClick={handleUpload}
        disabled={disabled || isUploading || !selectedFile}
        className="bg-black px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-white transition hover:bg-[#7f7041] disabled:cursor-not-allowed disabled:bg-[#777777]"
      >
        {isUploading ? 'Đang tải ảnh...' : 'Tải ảnh lên'}
      </button>

      {(uploadedAsset?.secureUrl || value) && (
        <div className="border border-[#ebe7df] bg-[#fafaf8] p-3 text-xs text-[#5f5e5e]">
          <p className="font-medium text-black">{readyLabel}</p>
          <p className="mt-1 break-all">{uploadedAsset?.secureUrl || value}</p>
        </div>
      )}

      {error && <p className="border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
    </div>
  );
}
