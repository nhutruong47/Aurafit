import { useEffect, useState } from 'react';
import ImageUploadField from '../ui/ImageUploadField';
import { useToastStore } from '../../store/useToastStore';
import { AdminField } from './AdminDashboardShared';
import AdminEventCostumePicker from './AdminEventCostumePicker';

const getUploadAssetUrl = (asset) => (
  asset?.secureUrl || asset?.secure_url || asset?.imageUrl || asset?.image_url || asset?.url || ''
).trim();

export default function AdminEventModal({
  isOpen,
  onClose,
  eventForm,
  editingEventId,
  costumes,
  isLoadingCostumes,
  isSaving,
  error,
  onFieldChange,
  onBannerChange,
  onCostumeAssignmentsChange,
  onSubmit,
}) {
  const [uploadState, setUploadState] = useState({ isUploading: false, error: '' });

  useEffect(() => {
    if (!isOpen) return undefined;
    document.body.style.overflow = 'hidden';
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && !isSaving) onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [editingEventId, isOpen, isSaving, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (uploadState.isUploading) {
      useToastStore.getState().addToast('Vui lòng chờ banner tải lên hoàn tất.', 'error');
      return;
    }
    if (uploadState.error) {
      useToastStore.getState().addToast(uploadState.error, 'error');
      return;
    }
    const succeeded = await onSubmit();
    if (succeeded) onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-[3px]"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isSaving) onClose();
      }}
    >
      <div className="flex max-h-[95vh] w-full max-w-6xl flex-col overflow-hidden rounded-lg bg-[#fdfdfb] shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#d7d2c8] px-6 py-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#7f7041]">AuraFit Event</p>
            <h2 className="mt-1 font-serif text-2xl italic text-black">
              {editingEventId ? 'Cập nhật sự kiện' : 'Tạo sự kiện mới'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="flex h-9 w-9 items-center justify-center text-[#5f5e5e] transition hover:bg-[#f0ede6] hover:text-black disabled:opacity-50"
            aria-label="Đóng"
          >
            <span className="material-symbols-outlined text-[22px]">close</span>
          </button>
        </div>

        <form className="flex-1 overflow-y-auto" onSubmit={handleSubmit}>
          <div className="grid gap-8 px-6 py-6 lg:grid-cols-[320px_minmax(0,1fr)]">
            <div className="space-y-5">
              <ImageUploadField
                key={editingEventId || 'new-event'}
                label="Banner sự kiện"
                value={eventForm.bannerImageUrl}
                autoUpload
                disabled={isSaving}
                readyLabel="Banner đã sẵn sàng."
                onUploaded={(asset) => onBannerChange(getUploadAssetUrl(asset))}
                onUploadStateChange={setUploadState}
              />
              {eventForm.bannerImageUrl && (
                <button
                  type="button"
                  onClick={() => onBannerChange('')}
                  disabled={isSaving || uploadState.isUploading}
                  className="w-full border border-red-200 px-4 py-2.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-red-600 transition hover:border-red-600 hover:bg-red-50 disabled:opacity-50"
                >
                  Xóa banner
                </button>
              )}

              <label className="block">
                <span className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.16em] text-[#777777]">
                  Trạng thái
                </span>
                <select
                  name="status"
                  value={eventForm.status}
                  onChange={onFieldChange}
                  disabled={isSaving}
                  className="w-full border border-[#d7d2c8] bg-[#fafaf8] px-3 py-3 text-sm outline-none focus:border-[#7f7041]"
                >
                  <option value="DRAFT">Bản nháp</option>
                  <option value="ACTIVE">Đang hoạt động</option>
                  <option value="ENDED">Đã kết thúc</option>
                  <option value="CANCELLED">Đã hủy</option>
                </select>
              </label>
            </div>

            <div className="space-y-5">
              <AdminField
                label="Tên sự kiện"
                name="name"
                value={eventForm.name}
                onChange={onFieldChange}
              />
              <AdminField
                label="Mô tả"
                name="description"
                value={eventForm.description}
                onChange={onFieldChange}
                multiline
                required={false}
              />

              <div className="grid gap-4 md:grid-cols-3">
                <label className="block">
                  <span className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.16em] text-[#777777]">
                    Giảm giá chung (%)
                  </span>
                  <input
                    name="discountPercent"
                    type="number"
                    min="0.01"
                    max="100"
                    step="0.01"
                    required
                    value={eventForm.discountPercent}
                    onChange={onFieldChange}
                    className="w-full border border-[#d7d2c8] bg-[#fafaf8] px-3 py-3 text-sm outline-none focus:border-[#7f7041]"
                  />
                </label>
                <AdminField
                  label="Bắt đầu"
                  name="startDate"
                  type="datetime-local"
                  value={eventForm.startDate}
                  onChange={onFieldChange}
                  required
                />
                <AdminField
                  label="Kết thúc"
                  name="endDate"
                  type="datetime-local"
                  value={eventForm.endDate}
                  onChange={onFieldChange}
                  required
                />
              </div>

              <AdminEventCostumePicker
                costumes={costumes}
                assignments={eventForm.costumeAssignments}
                onChange={onCostumeAssignmentsChange}
                disabled={isSaving}
                isLoading={isLoadingCostumes}
              />

              {error && (
                <p className="border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
              )}
            </div>
          </div>

          <div className="sticky bottom-0 flex justify-end gap-3 border-t border-[#d7d2c8] bg-[#fdfdfb] px-6 py-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="border border-[#d7d2c8] px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#5f5e5e] transition hover:border-black hover:text-black disabled:opacity-50"
            >
              Hủy
            </button>
            <button
              disabled={isSaving || uploadState.isUploading || Boolean(uploadState.error)}
              className="bg-black px-7 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-[#7f7041] disabled:cursor-not-allowed disabled:bg-[#777777]"
            >
              {uploadState.isUploading
                ? 'Đang tải banner...'
                : isSaving
                  ? 'Đang lưu...'
                  : editingEventId
                    ? 'Cập nhật sự kiện'
                    : 'Tạo sự kiện'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
