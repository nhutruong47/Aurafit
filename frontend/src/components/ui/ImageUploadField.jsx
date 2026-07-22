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

const validateImageFile = (file) => {
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

function SingleImageUploadField({
  label = 'Ảnh',
  value,
  disabled = false,
  readyLabel = 'Ảnh đã sẵn sàng để sử dụng.',
  autoUpload = false,
  showPreview = true,
  hideUploadButton = false,
  onUploaded,
  onFileSelect,
  onUploadStateChange,
}) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [localPreviewUrl, setLocalPreviewUrl] = useState('');
  const [uploadedAsset, setUploadedAsset] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const autoUploadFileKeyRef = useRef('');

  /* eslint-disable react-hooks/set-state-in-effect */
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
  /* eslint-enable react-hooks/set-state-in-effect */

  const previewUrl = useMemo(
    () => (
      error
        ? getUploadAssetUrl(uploadedAsset) || value || ''
        : localPreviewUrl || getUploadAssetUrl(uploadedAsset) || value || ''
    ),
    [error, localPreviewUrl, uploadedAsset, value]
  );

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
      validateImageFile(nextFile);
      setSelectedFile(nextFile);
      onFileSelect?.(nextFile);
    } catch (validationError) {
      const message = validationError.message || 'Tệp hình ảnh không hợp lệ.';
      setSelectedFile(null);
      onFileSelect?.(null);
      setError(message);
      notify.error(message);
      onUploadStateChange?.({ isUploading: false, error: message });
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      const message = 'Quý khách vui lòng chọn tệp hình ảnh trước khi tải lên.';
      setError(message);
      onUploadStateChange?.({ isUploading: false, error: message });
      return;
    }

    setIsUploading(true);
    setError('');
    onUploadStateChange?.({ isUploading: true, error: '' });

    try {
      const asset = await uploadImage(selectedFile);
      setUploadedAsset(asset);
      onUploaded?.(asset);
      onUploadStateChange?.({ isUploading: false, error: '' });
    } catch (uploadError) {
      const detail = uploadError.message || 'Hệ thống không thể tải hình ảnh lên máy chủ.';
      const message = `Ảnh "${selectedFile.name}" tải lên thất bại: ${detail}`;
      setError(message);
      notify.error(message);
      onUploadStateChange?.({ isUploading: false, error: message });
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
    // The upload callback intentionally uses the selected file from this render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        <div className="flex items-center gap-3 border border-[#ebe7df] bg-[#fafaf8] p-3 text-xs text-[#5f5e5e]">
          {showPreview && previewUrl && (
            <img src={previewUrl} alt="Xem trước" className="h-12 w-12 object-cover rounded-sm border border-[#d7d2c8] shrink-0" />
          )}
          <div className="min-w-0 flex-1">
            <p className="font-medium text-black truncate">{selectedFile.name}</p>
            <p className="mt-1">Kích thước: {formatFileSize(selectedFile.size)}</p>
          </div>
        </div>
      )}

      {showPreview && previewUrl && (
        <div className="overflow-hidden border border-[#ebe7df] bg-[#fafaf8]">
          <img src={previewUrl} alt="Xem trước ảnh tải lên" className="aspect-[3/4] w-full object-cover" />
        </div>
      )}

      {!autoUpload && !hideUploadButton && (
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
        <p className="border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-700">
          Đang tải ảnh lên Cloudinary...
        </p>
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

function MultipleImageUploadField({
  label = 'Ảnh đánh giá',
  disabled = false,
  maxFiles = 3,
  onUploadsChange,
  onUploadStateChange,
}) {
  const [items, setItems] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const itemsRef = useRef([]);
  const previewUrlsRef = useRef(new Set());
  const nextItemIdRef = useRef(0);
  const isMountedRef = useRef(true);
  const resolvedMaxFiles = Math.max(1, maxFiles);

  useEffect(() => {
    isMountedRef.current = true;
    const previewUrls = previewUrlsRef.current;

    return () => {
      isMountedRef.current = false;
      previewUrls.forEach((previewUrl) => URL.revokeObjectURL(previewUrl));
      previewUrls.clear();
    };
  }, []);

  const emitUploadsChange = (nextItems) => {
    onUploadsChange?.(
      nextItems
        .filter((item) => item.asset)
        .map((item) => item.asset)
    );
  };

  const commitItems = (nextItems) => {
    itemsRef.current = nextItems;
    if (isMountedRef.current) {
      setItems(nextItems);
      emitUploadsChange(nextItems);
    }
  };

  const handleFilesChange = async (event) => {
    const input = event.target;
    const files = Array.from(input.files || []);
    input.value = '';

    if (files.length === 0) return;

    setError('');
    if (itemsRef.current.length + files.length > resolvedMaxFiles) {
      const message = `Chỉ được chọn tối đa ${resolvedMaxFiles} ảnh.`;
      setError(message);
      notify.error(message);
      return;
    }

    try {
      files.forEach(validateImageFile);
    } catch (validationError) {
      const message = validationError.message || 'Tệp hình ảnh không hợp lệ.';
      setError(message);
      notify.error(message);
      return;
    }

    const newItems = files.map((file) => {
      nextItemIdRef.current += 1;
      const previewUrl = URL.createObjectURL(file);
      previewUrlsRef.current.add(previewUrl);
      return {
        id: nextItemIdRef.current,
        file,
        previewUrl,
        asset: null,
        status: 'uploading',
      };
    });

    commitItems([...itemsRef.current, ...newItems]);
    setIsUploading(true);
    onUploadStateChange?.({ isUploading: true, error: '' });

    for (const item of newItems) {
      try {
        const asset = await uploadImage(item.file);
        commitItems(itemsRef.current.map((currentItem) => (
          currentItem.id === item.id
            ? { ...currentItem, asset, status: 'uploaded' }
            : currentItem
        )));
      } catch (uploadError) {
        const detail = uploadError.message || 'Không thể tải ảnh lên backend.';
        const message = `Ảnh "${item.file.name}" tải lên thất bại: ${detail}`;
        commitItems(itemsRef.current.map((currentItem) => (
          currentItem.id === item.id
            ? { ...currentItem, status: 'error' }
            : currentItem
        )));
        if (isMountedRef.current) {
          setError(message);
          notify.error(message);
        }
      }
    }

    if (isMountedRef.current) {
      setIsUploading(false);
      onUploadStateChange?.({ isUploading: false, error: '' });
    }
  };

  const removeItem = (itemId) => {
    const removedItem = itemsRef.current.find((item) => item.id === itemId);
    if (removedItem?.previewUrl) {
      URL.revokeObjectURL(removedItem.previewUrl);
      previewUrlsRef.current.delete(removedItem.previewUrl);
    }

    // TODO: The uploaded asset may become orphaned after removal. Clean it up later with a scheduled job.
    commitItems(itemsRef.current.filter((item) => item.id !== itemId));
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
          disabled={disabled || isUploading || items.length >= resolvedMaxFiles}
          onChange={handleFilesChange}
          className="block w-full text-sm file:mr-3 file:border-0 file:bg-black file:px-4 file:py-3 file:text-[10px] file:font-semibold file:uppercase file:tracking-[0.14em] file:text-white disabled:opacity-60"
        />
        <p className="mt-1 text-xs text-[#777777]">
          Tối đa {resolvedMaxFiles} ảnh, mỗi ảnh không quá 5 MB. Hỗ trợ JPG, PNG và WEBP.
        </p>
      </div>

      {items.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {items.map((item) => {
            const previewUrl = getUploadAssetUrl(item.asset) || item.previewUrl;
            return (
              <div key={item.id} className="relative overflow-hidden border border-[#d7d2c8] bg-white p-1.5">
                <img
                  src={previewUrl}
                  alt={`Ảnh đánh giá ${item.file.name}`}
                  className="aspect-square w-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => removeItem(item.id)}
                  disabled={disabled}
                  aria-label={`Xóa ảnh ${item.file.name}`}
                  className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/75 text-white transition hover:bg-red-600 disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-[16px]">close</span>
                </button>
                <div className="px-1 pb-1 pt-2 text-[10px] text-[#5f5e5e]">
                  <p className="truncate" title={item.file.name}>{item.file.name}</p>
                  {item.status === 'uploading' && <p className="mt-1 text-blue-700">Đang tải lên...</p>}
                  {item.status === 'uploaded' && <p className="mt-1 text-green-700">Đã tải lên</p>}
                  {item.status === 'error' && <p className="mt-1 text-red-700">Tải lên thất bại</p>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {error && <p className="border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
    </div>
  );
}

export default function ImageUploadField(props) {
  return props.multiple
    ? <MultipleImageUploadField {...props} />
    : <SingleImageUploadField {...props} />;
}
