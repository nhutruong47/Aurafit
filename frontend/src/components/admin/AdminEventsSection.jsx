import { useState } from 'react';
import { Panel } from './AdminDashboardShared';
import AdminEventModal from './AdminEventModal';

const STATUS_LABELS = {
  DRAFT: 'Bản nháp',
  ACTIVE: 'Đang hoạt động',
  ENDED: 'Đã kết thúc',
  CANCELLED: 'Đã hủy',
};

const STATUS_CLASSES = {
  DRAFT: 'border-[#d7d2c8] bg-[#f4f4f2] text-[#5f5e5e]',
  ACTIVE: 'border-green-200 bg-green-50 text-green-700',
  ENDED: 'border-blue-200 bg-blue-50 text-blue-700',
  CANCELLED: 'border-red-200 bg-red-50 text-red-700',
};

const formatDateTime = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

export default function AdminEventsSection({
  events,
  costumes,
  eventForm,
  editingEventId,
  statusFilter,
  isLoading,
  isLoadingCostumes,
  isSaving,
  message,
  error,
  setStatusFilter,
  handleFieldChange,
  handleBannerChange,
  handleCostumeAssignmentsChange,
  hydrateEventForm,
  resetEventForm,
  submitEvent,
  handleDelete,
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openCreateModal = () => {
    resetEventForm();
    setIsModalOpen(true);
  };

  const openEditModal = (event) => {
    hydrateEventForm(event);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    if (isSaving) return;
    setIsModalOpen(false);
    resetEventForm();
  };

  return (
    <>
      <Panel
        title="Quản lý sự kiện"
        action={
          <button
            type="button"
            onClick={openCreateModal}
            className="flex items-center gap-2 bg-black px-5 py-2.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-[#7f7041]"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            Tạo sự kiện
          </button>
        }
      >
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-[#5f5e5e]">
            Quản lý thời gian, mức giảm và các sản phẩm được áp dụng cho từng event.
          </p>
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="w-full border border-[#d7d2c8] bg-[#fafaf8] px-3 py-3 text-sm outline-none focus:border-[#7f7041] sm:w-52"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="DRAFT">Bản nháp</option>
            <option value="ACTIVE">Đang hoạt động</option>
            <option value="ENDED">Đã kết thúc</option>
            <option value="CANCELLED">Đã hủy</option>
          </select>
        </div>

        {message && (
          <p className="mb-4 border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">{message}</p>
        )}
        {error && !isModalOpen && (
          <p className="mb-4 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
        )}

        {isLoading ? (
          <div className="flex min-h-64 items-center justify-center text-sm text-[#777777]">
            Đang tải danh sách sự kiện...
          </div>
        ) : events.length === 0 ? (
          <div className="flex min-h-64 flex-col items-center justify-center gap-3 text-center">
            <span className="material-symbols-outlined text-[48px] text-[#c7bfae]">event_busy</span>
            <p className="text-sm text-[#5f5e5e]">Chưa có sự kiện phù hợp với bộ lọc hiện tại.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-left text-sm">
              <thead className="bg-[#111111] text-[10px] font-semibold uppercase tracking-[0.16em] text-white">
                <tr>
                  <th className="w-[90px] px-4 py-3">Banner</th>
                  <th className="px-4 py-3">Sự kiện</th>
                  <th className="px-4 py-3">Thời gian</th>
                  <th className="w-[110px] px-4 py-3 text-center">Giảm giá</th>
                  <th className="w-[100px] px-4 py-3 text-center">Sản phẩm</th>
                  <th className="w-[140px] px-4 py-3">Trạng thái</th>
                  <th className="w-[150px] px-4 py-3 text-right">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#ebe7df] bg-[#fafaf8]">
                {events.map((event) => (
                  <tr key={event.id} className="transition hover:bg-[#f5f2eb]">
                    <td className="px-4 py-3">
                      <div className="h-12 w-16 overflow-hidden bg-[#ebe7df]">
                        {event.bannerImageUrl ? (
                          <img src={event.bannerImageUrl} alt={event.name} className="h-full w-full object-cover" />
                        ) : (
                          <span className="material-symbols-outlined flex h-full items-center justify-center text-[#aaa49a]">
                            image
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-black">{event.name}</p>
                      <code className="mt-1 inline-block bg-[#eeeeee] px-1.5 py-0.5 text-[10px] text-[#777777]">
                        {event.slug || '—'}
                      </code>
                    </td>
                    <td className="px-4 py-3 text-xs leading-5 text-[#5f5e5e]">
                      <p>{formatDateTime(event.startDate)}</p>
                      <p>→ {formatDateTime(event.endDate)}</p>
                    </td>
                    <td className="px-4 py-3 text-center font-semibold text-[#7f7041]">
                      {Number(event.discountPercent || 0).toLocaleString('vi-VN')}%
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex min-w-8 items-center justify-center bg-[#efe9dc] px-2 py-1 text-xs font-semibold text-[#6f5e35]">
                        {Array.isArray(event.costumes) ? event.costumes.length : 0}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex border px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.12em] ${STATUS_CLASSES[event.status] || STATUS_CLASSES.DRAFT}`}>
                        {STATUS_LABELS[event.status] || event.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openEditModal(event)}
                          className="inline-flex items-center border border-black px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] transition hover:bg-black hover:text-white"
                        >
                          <span className="material-symbols-outlined text-[14px]">edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(event.id, event.name)}
                          className="inline-flex items-center border border-red-300 px-3 py-1.5 text-red-600 transition hover:bg-red-600 hover:text-white"
                          aria-label={`Xóa sự kiện ${event.name}`}
                        >
                          <span className="material-symbols-outlined text-[14px]">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <AdminEventModal
        key={isModalOpen ? editingEventId || 'new-event' : 'closed-event'}
        isOpen={isModalOpen}
        onClose={closeModal}
        eventForm={eventForm}
        editingEventId={editingEventId}
        costumes={costumes}
        isLoadingCostumes={isLoadingCostumes}
        isSaving={isSaving}
        error={error}
        onFieldChange={handleFieldChange}
        onBannerChange={handleBannerChange}
        onCostumeAssignmentsChange={handleCostumeAssignmentsChange}
        onSubmit={submitEvent}
      />
    </>
  );
}
