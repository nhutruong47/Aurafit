import { useEffect, useState } from 'react';
import {
  fetchAiInsights,
  triggerAiInsightGeneration,
} from '../../services/aiInsightService';
import AiRichText from '../common/AiRichText';
import AdminEventModal from './AdminEventModal';
import { Panel } from './AdminDashboardShared';

const formatPeriodDate = (value) => {
  if (!value) return '—';

  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
};

const formatCreatedAt = (value) => {
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

const formatDiscount = (value) => {
  if (value === null || value === undefined || value === '') return '—';
  const discount = Number(value);
  return Number.isFinite(discount) ? `${discount.toLocaleString('vi-VN')}%` : '—';
};

export default function AiInsightTab({ eventManagement }) {
  const [insights, setInsights] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const {
    costumes,
    eventForm,
    editingEventId,
    isLoadingCostumes,
    isSaving,
    error: eventError,
    handleFieldChange,
    handleBannerChange,
    handleSideBannerChange,
    handleCostumeAssignmentsChange,
    hydrateSuggestedEventForm,
    resetEventForm,
    submitEvent,
  } = eventManagement;

  useEffect(() => {
    let isMounted = true;

    fetchAiInsights()
      .then((data) => {
        if (isMounted) {
          setInsights(Array.isArray(data) ? data : []);
        }
      })
      .catch((loadError) => {
        if (isMounted) {
          setError(loadError.message || 'Không thể tải danh sách phân tích AI.');
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleGenerate = async () => {
    if (isGenerating) return;

    setIsGenerating(true);
    setError('');
    setMessage('');

    try {
      await triggerAiInsightGeneration();
      const refreshedInsights = await fetchAiInsights();
      setInsights(Array.isArray(refreshedInsights) ? refreshedInsights : []);
      setMessage('Đã tạo phân tích AI mới thành công.');
    } catch (generationError) {
      setError(generationError.message || 'Không thể tạo phân tích AI mới.');
    } finally {
      setIsGenerating(false);
    }
  };

  const openSuggestedEventModal = (suggestion) => {
    hydrateSuggestedEventForm(suggestion);
    setIsEventModalOpen(true);
  };

  const closeEventModal = () => {
    if (isSaving) return;
    setIsEventModalOpen(false);
    resetEventForm();
  };

  return (
    <>
      <Panel
        title="Phân tích AI"
        action={
          <button
            type="button"
            onClick={handleGenerate}
            disabled={isGenerating}
            className="flex items-center gap-2 rounded-full bg-[#1d1b16] px-4 py-2.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-[#8a7442] hover:shadow-md disabled:cursor-not-allowed disabled:translate-y-0 disabled:bg-[#aaa49a] disabled:shadow-none sm:px-5"
          >
            <span className={`material-symbols-outlined text-[18px] ${isGenerating ? 'animate-spin' : ''}`}>
              {isGenerating ? 'progress_activity' : 'auto_awesome'}
            </span>
            <span>{isGenerating ? 'Đang phân tích...' : 'Tạo phân tích mới'}</span>
          </button>
        }
      >
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-[#e3d8bc] bg-gradient-to-r from-[#fbf7ed] to-[#f7f3ea] px-4 py-4 text-sm leading-6 text-[#5f5849]">
          <span className="material-symbols-outlined mt-0.5 text-[21px] text-[#9b8248]">lightbulb</span>
          AI tổng hợp dữ liệu hội thoại và hành vi trong 7 ngày hoàn chỉnh gần nhất để nhận diện xu hướng, sau đó đề xuất hành động cho cửa hàng.
        </div>

        {message && (
          <p className="mb-5 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 shadow-sm">
            {message}
          </p>
        )}

        {error && (
          <p className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 shadow-sm">
            {error}
          </p>
        )}

        {isLoading ? (
        <div className="flex min-h-64 flex-col items-center justify-center gap-3 text-center">
          <span className="material-symbols-outlined animate-spin text-[30px] text-[#7f7041]">
            progress_activity
          </span>
          <p className="text-sm text-[#5f5e5e]">Đang tải các phân tích gần nhất...</p>
        </div>
      ) : insights.length === 0 ? (
        <div className="flex min-h-72 flex-col items-center justify-center rounded-2xl border border-dashed border-[#cfc7ba] bg-[#fafaf8] px-6 text-center">
          <span className="material-symbols-outlined text-[48px] text-[#b7aa8a]">insights</span>
          <h3 className="mt-4 font-serif text-2xl italic text-black">Chưa có phân tích AI</h3>
          <p className="mt-3 max-w-lg text-sm leading-6 text-[#5f5e5e]">
            Bấm “Tạo phân tích mới” để tổng hợp dữ liệu 7 ngày gần nhất và nhận đề xuất xu hướng cho cửa hàng.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {insights.map((insight, index) => {
            const isLatest = index === 0;
            const suggestedEvents = Array.isArray(insight.suggestedEvents)
              ? insight.suggestedEvents
              : [];

            return (
              <article
                key={insight.id}
                className={`relative overflow-hidden rounded-2xl border bg-white p-5 sm:p-6 ${
                  isLatest
                    ? 'border-[#b49a5d] shadow-[0_12px_34px_rgba(101,83,43,0.13)]'
                    : 'border-[#ded8ce] shadow-[0_5px_18px_rgba(46,39,27,0.05)]'
                }`}
              >
                {isLatest && (
                  <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#765f2d] via-[#c6a962] to-[#765f2d]" />
                )}
                <div className="flex flex-col gap-3 border-b border-[#ebe7df] pb-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="material-symbols-outlined text-[20px] text-[#7f7041]">
                        date_range
                      </span>
                      <h3 className="text-sm font-semibold text-black">
                        {formatPeriodDate(insight.periodStart)} – {formatPeriodDate(insight.periodEnd)}
                      </h3>
                      {isLatest && (
                        <span className="rounded-full border border-[#c9b982] bg-[#fbf7e8] px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.14em] text-[#7f7041]">
                          Mới nhất
                        </span>
                      )}
                    </div>
                    <p className="mt-2 text-xs text-[#777777]">
                      Tạo lúc {formatCreatedAt(insight.createdAt)}
                    </p>
                  </div>
                  <span className="w-fit rounded-full border border-[#d7d2c8] bg-[#faf9f6] px-3 py-1.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-[#5f5e5e]">
                    Xu hướng tuần
                  </span>
                </div>

                <div className="mt-5 grid gap-4 sm:grid-cols-[2.5rem_minmax(0,1fr)]">
                  <div className="hidden h-10 w-10 items-center justify-center rounded-full bg-[#f3eddf] text-[#8a7442] sm:flex">
                    <span className="material-symbols-outlined text-[21px]">analytics</span>
                  </div>
                  <AiRichText content={insight.content} variant="analyst" />
                </div>

                <section className="mt-6 border-t border-[#ebe7df] pt-5">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[21px] text-[#8a7442]">
                      event_upcoming
                    </span>
                    <h4 className="font-serif text-xl italic text-black">Gợi ý event từ AI</h4>
                  </div>

                  {suggestedEvents.length === 0 ? (
                    <p className="mt-4 rounded-xl border border-dashed border-[#d7d2c8] bg-[#fafaf8] px-4 py-5 text-sm text-[#777777]">
                      Không có gợi ý event tuần này
                    </p>
                  ) : (
                    <div className="mt-4 grid gap-3 lg:grid-cols-2">
                      {suggestedEvents.map((suggestion, suggestionIndex) => {
                        const costumeCount = Array.isArray(suggestion.costumeIds)
                          ? suggestion.costumeIds.length
                          : 0;

                        return (
                          <div
                            key={`${insight.id}-${suggestion.name}-${suggestionIndex}`}
                            className="flex flex-col rounded-xl border border-[#dfd4b8] bg-[#fbf8ef] p-4"
                          >
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <div className="min-w-0">
                                <h5 className="font-semibold text-black">{suggestion.name}</h5>
                                <p className="mt-2 text-sm leading-6 text-[#5f5849]">
                                  {suggestion.reason}
                                </p>
                              </div>
                              <span className="shrink-0 rounded-full border border-[#c9b982] bg-white px-2.5 py-1 text-xs font-semibold text-[#7f7041]">
                                -{formatDiscount(suggestion.suggestedDiscountPercent)}
                              </span>
                            </div>

                            <div className="mt-4 flex flex-wrap gap-2 text-xs text-[#5f5e5e]">
                              <span className="rounded-full bg-white px-3 py-1.5">
                                Danh mục: {suggestion.categorySlug || '—'}
                              </span>
                              <span className="rounded-full bg-white px-3 py-1.5">
                                {costumeCount} sản phẩm liên quan
                              </span>
                              <span className="rounded-full bg-white px-3 py-1.5">
                                Giảm đề xuất: {formatDiscount(suggestion.suggestedDiscountPercent)}
                              </span>
                            </div>

                            <button
                              type="button"
                              onClick={() => openSuggestedEventModal(suggestion)}
                              className="mt-5 inline-flex w-fit items-center gap-2 bg-black px-4 py-2.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-white transition hover:bg-[#7f7041]"
                            >
                              <span className="material-symbols-outlined text-[17px]">add</span>
                              Tạo event từ gợi ý này
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </section>
              </article>
            );
          })}
        </div>
        )}
      </Panel>

      <AdminEventModal
        key={isEventModalOpen ? 'suggested-event' : 'closed-suggested-event'}
        isOpen={isEventModalOpen}
        onClose={closeEventModal}
        eventForm={eventForm}
        editingEventId={editingEventId}
        costumes={costumes}
        isLoadingCostumes={isLoadingCostumes}
        isSaving={isSaving}
        error={eventError}
        onFieldChange={handleFieldChange}
        onBannerChange={handleBannerChange}
        onSideBannerChange={handleSideBannerChange}
        onCostumeAssignmentsChange={handleCostumeAssignmentsChange}
        onSubmit={submitEvent}
      />
    </>
  );
}
