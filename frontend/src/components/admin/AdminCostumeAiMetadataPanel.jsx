const TAG_FIELDS = [
  ['colorTags', 'Màu sắc'],
  ['styleTags', 'Phong cách'],
  ['occasionTags', 'Dịp sử dụng'],
  ['seasonTags', 'Mùa'],
  ['genderTags', 'Giới tính'],
  ['sizeTags', 'Kích thước'],
  ['materialTags', 'Chất liệu'],
  ['fitTags', 'Form dáng'],
  ['trendTags', 'Xu hướng'],
];

const formatDateTime = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString('vi-VN');
};

const getSearchStatus = (status) => {
  if (status === 'READY' || status === 'SUCCESS') return 'Sẵn sàng';
  if (status === 'FAILED') return 'Chưa hoàn tất';
  return 'Chưa có dữ liệu';
};

export default function AdminCostumeAiMetadataPanel({
  costumeId,
  enrichment,
  isLoading,
  isEnriching,
  onEnrich,
}) {
  const currentEnrichment = enrichment?.costumeId === costumeId ? enrichment : null;
  const metadata = currentEnrichment?.metadata;
  const embedding = currentEnrichment?.embedding;
  const embeddingReady = embedding?.status === 'READY';

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 border border-[#d7d2c8] bg-[#fafaf8] p-5 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#7f7041]">
            AI hỗ trợ tư vấn sản phẩm
          </p>
          <h3 className="mt-1 font-serif text-xl italic text-black">Thông tin sản phẩm dành cho trợ lý tư vấn</h3>
          <p className="mt-2 max-w-3xl text-xs leading-5 text-[#5f5e5e]">
            AI sẽ đọc thông tin đã lưu, bổ sung các đặc điểm liên quan và chuẩn bị dữ liệu để tìm sản phẩm phù hợp hơn. Hãy lưu sản phẩm trước khi thực hiện.
          </p>
        </div>
        <button
          type="button"
          onClick={() => onEnrich(costumeId)}
          disabled={isEnriching}
          className="inline-flex shrink-0 items-center justify-center gap-2 bg-black px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-[#7f7041] disabled:cursor-wait disabled:bg-[#777777]"
        >
          <span className={`material-symbols-outlined text-[17px] ${isEnriching ? 'animate-spin' : ''}`}>
            {isEnriching ? 'progress_activity' : 'auto_awesome'}
          </span>
          {isEnriching ? 'AI đang xử lý...' : metadata ? 'Cập nhật lại bằng AI' : 'Bổ sung thông tin bằng AI'}
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center gap-2 py-14 text-sm text-[#5f5e5e]">
          <span className="material-symbols-outlined animate-spin text-[24px] text-[#7f7041]">progress_activity</span>
          Đang tải thông tin AI đã bổ sung...
        </div>
      ) : !metadata ? (
        <div className="border border-dashed border-[#d7d2c8] px-6 py-12 text-center">
          <span className="material-symbols-outlined text-[42px] text-[#c4c0b8]">neurology</span>
          <p className="mt-3 text-sm font-medium text-black">Sản phẩm chưa được AI bổ sung thông tin</p>
          <p className="mt-1 text-xs text-[#777777]">Bấm “Bổ sung thông tin bằng AI” để hỗ trợ tư vấn và tìm kiếm sản phẩm chính xác hơn.</p>
        </div>
      ) : (
        <>
          <div className="grid gap-3 md:grid-cols-3">
            <div className="border border-[#ebe7df] bg-white p-4">
              <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-[#777777]">Thông tin hỗ trợ tư vấn</p>
              <p className="mt-2 text-sm font-semibold text-green-700">Đã cập nhật</p>
              <p className="mt-1 text-[11px] text-[#777777]">AI đã tổng hợp đặc điểm sản phẩm</p>
            </div>
            <div className="border border-[#ebe7df] bg-white p-4">
              <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-[#777777]">Tìm sản phẩm tương tự</p>
              <p className={`mt-2 text-sm font-semibold ${embeddingReady ? 'text-green-700' : 'text-red-600'}`}>
                {getSearchStatus(embedding?.status)}
              </p>
              <p className="mt-1 text-[11px] text-[#777777]">Dùng khi bộ lọc thông thường chưa tìm được kết quả</p>
            </div>
            <div className="border border-[#ebe7df] bg-white p-4">
              <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-[#777777]">Cập nhật gần nhất</p>
              <p className="mt-2 text-sm font-semibold text-black">{formatDateTime(metadata.updatedAt)}</p>
              <p className="mt-1 text-[11px] text-[#777777]">Thông tin được làm mới khi chạy lại AI</p>
            </div>
          </div>

          {embedding?.lastError && (
            <div className="border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">
              <span className="font-semibold">Dữ liệu tìm kiếm chưa được tạo.</span> Vui lòng kiểm tra kết nối dịch vụ AI hoặc thử lại.
            </div>
          )}

          <div>
            <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#7f7041]">
              Đặc điểm sản phẩm do AI tổng hợp
            </p>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {TAG_FIELDS.map(([key, label]) => {
                const tags = Array.isArray(metadata[key]) ? metadata[key] : [];
                return (
                  <div key={key} className="min-h-24 border border-[#ebe7df] bg-[#fafaf8] p-4">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#5f5e5e]">{label}</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {tags.length > 0 ? tags.map((tag) => (
                        <span key={tag} className="border border-[#d7d2c8] bg-white px-2 py-1 text-[11px] text-black">
                          {tag}
                        </span>
                      )) : <span className="text-xs text-[#999999]">Chưa có thông tin</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
