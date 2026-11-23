import { useCallback, useEffect, useState } from 'react';
import { deleteTryOnHistory, fetchTryOnHistory } from '../../services/tryOnService';
import { useToastStore } from '../../store/useToastStore';

const PAGE_SIZE = 6;

const STATUS_META = {
  COMPLETED: { label: 'Hoàn tất', className: 'border-[#087b3f]/25 bg-[#e8f7ee] text-[#087b3f]' },
  FAILED: { label: 'Thất bại', className: 'border-[#ba1a1a]/25 bg-[#ffdad6] text-[#93000a]' },
  PENDING: { label: 'Đang xử lý', className: 'border-[#A98A55]/25 bg-[#756536]/10 text-[#756536]' },
};

const getStatusMeta = (status) => STATUS_META[status] || STATUS_META.PENDING;

const formatDate = (value) => {
  if (!value) return 'Chưa xác định thời gian';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Chưa xác định thời gian';
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

function HistoryCard({ item, isDeleting, onDelete }) {
  const status = getStatusMeta(item.status);
  const imageUrl = item.generatedImageUrl || item.originalImageUrl;

  return (
    <article className="overflow-hidden border border-[#DED2C2] bg-white">
      <div className="relative aspect-[4/3] bg-[#f3f1ed]">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={item.productName ? `Kết quả thử đồ ${item.productName}` : 'Kết quả thử đồ'}
            className="h-full w-full object-contain"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-[#6B6259]">
            <span className="material-symbols-outlined text-[42px]">image</span>
            <span className="text-xs">Chưa có ảnh kết quả</span>
          </div>
        )}
        <span className={`absolute left-3 top-3 border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] ${status.className}`}>
          {status.label}
        </span>
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate font-serif text-xl italic text-[#211E1B]">
              {item.productName || 'Trang phục AuraFit'}
            </h3>
            <p className="mt-1 text-xs text-[#6B6259]">{formatDate(item.createdAt)}</p>
          </div>
          <button
            type="button"
            onClick={() => onDelete(item)}
            disabled={isDeleting}
            aria-label="Xóa lịch sử thử đồ"
            title="Xóa lịch sử thử đồ"
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center border border-[#DED2C2] text-[#6B6259] transition hover:border-[#93000a] hover:text-[#93000a] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[18px]">delete</span>
          </button>
        </div>
        {item.status === 'FAILED' && item.errorMessage && (
          <p className="mt-3 border-l-2 border-[#ba1a1a] pl-3 text-xs leading-5 text-[#93000a]">{item.errorMessage}</p>
        )}
      </div>
    </article>
  );
}

export default function TryOnHistorySection() {
  const addToast = useToastStore((state) => state.addToast);
  const [history, setHistory] = useState([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState('');

  const loadHistory = useCallback(async (pageNumber = 0, signal) => {
    setIsLoading(true);
    setError('');
    try {
      const data = await fetchTryOnHistory({ page: pageNumber, size: PAGE_SIZE });
      if (signal?.aborted) return;
      setHistory(Array.isArray(data) ? data : data?.content || []);
      setPage(data?.number ?? pageNumber);
      setTotalPages(data?.totalPages ?? 0);
    } catch (loadError) {
      if (signal?.aborted) return;
      setError(loadError.message || 'Không thể tải lịch sử thử đồ.');
    } finally {
      if (!signal?.aborted) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void Promise.resolve().then(() => loadHistory(0, controller.signal));
    return () => controller.abort();
  }, [loadHistory]);

  const handleDelete = async (item) => {
    if (!item?.id || isDeleting) return;
    const confirmed = window.confirm(`Bạn có chắc muốn xóa lần thử đồ${item.productName ? ` "${item.productName}"` : ''}?`);
    if (!confirmed) return;

    setIsDeleting(true);
    try {
      await deleteTryOnHistory(item.id);
      const nextPage = history.length === 1 && page > 0 ? page - 1 : page;
      await loadHistory(nextPage);
      addToast('Đã xóa lịch sử thử đồ.');
    } catch (deleteError) {
      addToast(deleteError.message || 'Không thể xóa lịch sử thử đồ.', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <section className="mx-auto max-w-[1440px] px-5 pb-16 md:px-20 md:pb-24">
      <div className="border border-[#DED2C2] bg-white p-6 md:p-10">
        <div className="mb-8 flex flex-col gap-4 border-b border-[#DED2C2] pb-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.3em] text-[#756536]">Trải nghiệm cá nhân</p>
            <h2 className="font-serif text-3xl italic md:text-4xl">Lịch sử thử đồ AI</h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-[#6B6259]">
              Những kết quả thử đồ được lưu trong tài khoản của bạn để xem lại bất cứ lúc nào.
            </p>
          </div>
          <button
            type="button"
            onClick={() => loadHistory(page)}
            disabled={isLoading}
            className="inline-flex items-center justify-center gap-2 border border-black px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-black transition hover:border-[#A98A55] hover:text-[#756536] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[17px]">refresh</span>
            Làm mới
          </button>
        </div>

        {error && (
          <div className="mb-6 border border-[#ba1a1a]/30 bg-[#ffdad6] px-4 py-3 text-sm font-medium text-[#93000a]">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((item) => <div key={item} className="aspect-[4/3] animate-pulse bg-[#f3f1ed]" />)}
          </div>
        ) : history.length === 0 ? (
          <div className="border border-dashed border-[#DED2C2] px-6 py-12 text-center">
            <span className="material-symbols-outlined text-[44px] text-[#756536]">apparel</span>
            <h3 className="mt-4 font-serif text-2xl italic">Chưa có lịch sử thử đồ</h3>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#6B6259]">
              Hãy thử một trang phục để lưu lại kết quả đầu tiên của bạn.
            </p>
          </div>
        ) : (
          <>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {history.map((item) => (
                <HistoryCard key={item.id} item={item} isDeleting={isDeleting} onDelete={handleDelete} />
              ))}
            </div>
            {totalPages > 1 && (
              <div className="mt-8 flex items-center justify-between border-t border-[#DED2C2] pt-5">
                <button
                  type="button"
                  onClick={() => loadHistory(page - 1)}
                  disabled={page === 0 || isLoading}
                  className="border border-black px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.16em] transition hover:border-[#A98A55] hover:text-[#756536] disabled:cursor-not-allowed disabled:opacity-30"
                >
                  Trang trước
                </button>
                <span className="text-xs text-[#6B6259]">{page + 1} / {totalPages}</span>
                <button
                  type="button"
                  onClick={() => loadHistory(page + 1)}
                  disabled={page >= totalPages - 1 || isLoading}
                  className="border border-black px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.16em] transition hover:border-[#A98A55] hover:text-[#756536] disabled:cursor-not-allowed disabled:opacity-30"
                >
                  Trang sau
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
