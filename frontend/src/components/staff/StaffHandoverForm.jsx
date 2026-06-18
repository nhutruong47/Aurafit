// Form ban giao va cap nhat tinh trang item cho staff.
import { returnStatuses } from './staffData';
import { Field } from './StaffDashboardShared';

export default function StaffHandoverForm({
  activeOrder,
  mode,
  selectedDetailId,
  selectedDetail,
  returnStatus,
  handoverImageUrl,
  note,
  isSubmitting,
  onModeChange,
  onSelectDetail,
  onReturnStatusChange,
  onImageUrlChange,
  onFileChange,
  onNoteChange,
  onPreviewImage,
  onSubmit,
}) {
  return (
    <aside className="border border-[#cfc4c5] bg-white p-5 lg:col-span-3">
      <h2 className="mb-5 text-[11px] font-semibold uppercase tracking-[0.2em]">Tạo biên bản</h2>
      <form className="space-y-5" onSubmit={onSubmit}>
        <div className="grid grid-cols-2 border border-[#cfc4c5] bg-[#f3f3f4] p-1">
          {['PICKUP', 'RETURN'].map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => onModeChange(value)}
              className={`px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.16em] ${
                mode === value ? 'bg-black text-white' : 'text-[#5f5e5e]'
              }`}
            >
              {value}
            </button>
          ))}
        </div>

        <Field label="Trang phục">
          <select
            value={selectedDetailId}
            onChange={(event) => onSelectDetail(event.target.value)}
            className="w-full border border-[#cfc4c5] bg-[#f9f9f9] px-3 py-3 text-sm outline-none focus:border-[#99854e]"
            required
          >
            {activeOrder?.details?.map((detail) => (
              <option key={detail.id} value={detail.id}>
                {detail.costumeName} | {detail.skuCode}
              </option>
            ))}
          </select>
        </Field>

        {selectedDetail && (
          <div className="border border-[#e1dddc] bg-[#f9f9f9] p-3 text-sm">
            <p className="font-medium">{selectedDetail.costumeName}</p>
            <p className="mt-1 text-[#5f5e5e]">{selectedDetail.skuCode} | Item {selectedDetail.itemStatus}</p>
          </div>
        )}

        {mode === 'RETURN' && (
          <Field label="Tình trạng trả">
            <div className="space-y-2">
              {returnStatuses.map((status) => (
                <label key={status.value} className="flex cursor-pointer items-center justify-between border border-[#cfc4c5] px-3 py-3">
                  <span className={`text-[11px] font-semibold uppercase tracking-[0.16em] ${status.tone}`}>{status.label}</span>
                  <input
                    checked={returnStatus === status.value}
                    onChange={() => onReturnStatusChange(status.value)}
                    type="radio"
                    name="returnStatus"
                  />
                </label>
              ))}
            </div>
          </Field>
        )}

        <Field label="Ảnh bàn giao">
          <input
            value={handoverImageUrl.startsWith('data:') ? '' : handoverImageUrl}
            onChange={(event) => onImageUrlChange(event.target.value)}
            placeholder="https://..."
            className="mb-3 w-full border border-[#cfc4c5] bg-[#f9f9f9] px-3 py-3 text-sm outline-none focus:border-[#99854e]"
            type="url"
          />
          <input
            onChange={onFileChange}
            className="block w-full text-sm file:mr-3 file:border-0 file:bg-black file:px-4 file:py-3 file:text-[10px] file:font-semibold file:uppercase file:tracking-[0.14em] file:text-white"
            type="file"
            accept="image/*"
          />
          {handoverImageUrl && (
            <button
              type="button"
              onClick={() => onPreviewImage(handoverImageUrl)}
              className="mt-3 aspect-[4/3] w-full overflow-hidden border border-[#cfc4c5] bg-[#eeeeee]"
            >
              <img src={handoverImageUrl} alt="Preview" className="h-full w-full object-cover" />
            </button>
          )}
        </Field>

        <Field label="Ghi chú">
          <textarea
            value={note}
            onChange={(event) => onNoteChange(event.target.value)}
            className="min-h-28 w-full border border-[#cfc4c5] bg-[#f9f9f9] px-3 py-3 text-sm outline-none focus:border-[#99854e]"
            placeholder="Kiểm tra tình trạng, phụ kiện, vết hỏng nếu có..."
          />
        </Field>

        <button
          disabled={isSubmitting || !handoverImageUrl || !selectedDetailId}
          className="w-full bg-black px-6 py-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-[#99854e] disabled:cursor-not-allowed disabled:bg-[#777777]"
        >
          {isSubmitting ? 'Đang lưu...' : mode === 'PICKUP' ? 'Xác nhận bàn giao' : 'Xác nhận trả đồ'}
        </button>
      </form>
    </aside>
  );
}
