import ShopProductCard from '../shop/ShopProductCard';

function PersonalizedSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="border border-[#d8d0cf] bg-white p-4">
          <div className="mb-4 h-5 w-40 animate-pulse bg-[#ece7e6]" />
          <div className="aspect-[4/5] animate-pulse bg-[#f1eceb]" />
          <div className="mt-4 space-y-3">
            <div className="h-4 w-3/4 animate-pulse bg-[#ece7e6]" />
            <div className="h-4 w-1/2 animate-pulse bg-[#f1eceb]" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function HomePersonalizedSection({
  recommendations,
  isLoading = false,
  error = '',
  onNavigate,
  onAddToCart,
  onRecommendationClick,
}) {
  return (
    <section className="bg-[linear-gradient(180deg,#f4eee9_0%,#f9f9f9_100%)] py-24 md:py-[120px]">
      <div className="mx-auto max-w-[1440px] px-5 md:px-20">
        <div className="mb-14 flex flex-col gap-4 border-b border-[#d7cecd] pb-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.28em] text-[#99854e]">
              Dành cho bạn
            </p>
            <h2 className="font-serif text-4xl font-normal italic md:text-5xl">
              Gợi ý cá nhân hóa cho trang chủ
            </h2>
          </div>
          <p className="max-w-2xl text-sm leading-7 text-[#5f5e5e]">
            Hệ thống ưu tiên các costume đang còn sẵn để thuê và xếp hạng theo hành vi gần đây của bạn như xem sản phẩm,
            tìm kiếm, thêm giỏ hàng và các tương tác liên quan.
          </p>
        </div>

        {error ? (
          <div className="border border-[#e4c9c7] bg-[#fff6f5] px-5 py-4 text-sm text-[#a94442]">{error}</div>
        ) : isLoading ? (
          <PersonalizedSkeleton />
        ) : recommendations.length ? (
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 xl:grid-cols-3">
            {recommendations.map((recommendation, index) => (
              <div key={recommendation.costume?.id || recommendation.product?.id} className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="inline-flex rounded-full border border-[#d9cfb1] bg-[#fbf6e8] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#7a6730]">
                    {recommendation.reason || 'Gợi ý cho bạn'}
                  </span>
                  <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8d8887]">
                    #{index + 1}
                  </span>
                </div>

                <ShopProductCard
                  product={recommendation.product}
                  onNavigate={(page, product) => {
                    onRecommendationClick?.(recommendation, index, page, product);
                    onNavigate?.(page, product);
                  }}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="border border-dashed border-[#d8d0cf] bg-[#faf8f7] px-5 py-8 text-sm leading-6 text-[#5f5e5e]">
            Chưa có gợi ý phù hợp lúc này. Hệ thống sẽ tự làm mới khi có thêm dữ liệu hành vi hoặc sản phẩm khả dụng.
          </div>
        )}
      </div>
    </section>
  );
}
