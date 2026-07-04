import ShopProductCard from '../shop/ShopProductCard';

function SimilarProductsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="border border-[#cfc4c5] bg-white">
          <div className="aspect-[4/5] animate-pulse bg-[#ece7e6]" />
          <div className="space-y-3 p-5">
            <div className="h-3 w-28 animate-pulse bg-[#ece7e6]" />
            <div className="h-8 w-3/4 animate-pulse bg-[#ece7e6]" />
            <div className="h-16 animate-pulse bg-[#f3efee]" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function SimilarProductsSection({
  recommendations,
  isLoading = false,
  error = '',
  onNavigate,
  onAddToCart,
  onRecommendationClick,
}) {
  return (
    <section className="mt-12 border border-[#cfc4c5] bg-white p-6 md:p-8">
      <div className="mb-8 flex flex-col gap-3 border-b border-[#e7dfde] pb-5 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#99854e]">
            Sản phẩm tương tự
          </p>
          <h2 className="mt-2 font-serif text-3xl italic text-black">Gợi ý tương tự cho costume này</h2>
        </div>
        <p className="max-w-xl text-sm leading-6 text-[#5f5e5e]">
          Gợi ý ưu tiên theo metadata của costume và chỉ hiển thị những sản phẩm còn sẵn để thuê.
        </p>
      </div>

      {error ? (
        <p className="text-sm text-[#a94442]">{error}</p>
      ) : isLoading ? (
        <SimilarProductsSkeleton />
      ) : recommendations.length ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
          {recommendations.map((recommendation, index) => (
            <div key={recommendation.costume?.id || recommendation.product?.id} className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <span className="inline-flex rounded-full border border-[#d9cfb1] bg-[#fbf6e8] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#7a6730]">
                  {recommendation.reason || 'Còn sẵn để thuê'}
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
          Chưa có gợi ý phù hợp lúc này. Hệ thống sẽ ưu tiên đề xuất khi metadata và inventory đầy đủ hơn.
        </div>
      )}
    </section>
  );
}
