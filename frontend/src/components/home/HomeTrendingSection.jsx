import {
  fallbackCostumeImage,
  getCostumeImage,
  getCostumePrice,
} from '../../utils/costumeUtils';

export default function HomeTrendingSection({
  trending,
  isLoading = false,
  error = '',
  onNavigate,
  title = 'Xu hướng tuần này',
  emptyMessage = 'Chưa có sản phẩm phù hợp lúc này. Hệ thống sẽ tự làm mới khi có thêm dữ liệu từ shop.',
}) {
  return (
    <section className="bg-[#f7f7f7] py-24 md:py-[120px]">
      <div className="mx-auto max-w-[1440px] px-5 md:px-20">
        <div className="mb-16 flex items-end justify-between gap-8">
          <h2 className="font-serif text-4xl font-normal md:text-5xl">{title}</h2>
          <a
            className="border-b border-[#99854e] pb-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#99854e]"
            href="#categories"
          >
            Xem tất cả
          </a>
        </div>

        {error ? (
          <div className="border border-[#e4c9c7] bg-[#fff6f5] px-5 py-4 text-sm text-[#a94442]">{error}</div>
        ) : isLoading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="overflow-hidden border border-[#cfc4c5] bg-white">
                <div className="h-64 animate-pulse bg-[#f1eceb]" />
                <div className="space-y-4 p-5">
                  <div className="h-5 w-3/4 animate-pulse bg-[#ece7e6]" />
                  <div className="h-4 w-1/2 animate-pulse bg-[#f1eceb]" />
                  <div className="grid grid-cols-2 gap-4">
                    <div className="h-10 animate-pulse bg-[#ece7e6]" />
                    <div className="h-10 animate-pulse bg-[#f1eceb]" />
                  </div>
                  <div className="h-11 animate-pulse bg-[#ece7e6]" />
                </div>
              </div>
            ))}
          </div>
        ) : trending.length ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {trending.map((item) => (
              <article
                key={item.id || item.name}
                className="group cursor-pointer"
                onClick={() => onNavigate?.('productDetail', item)}
              >
                <div className="mb-6 aspect-square overflow-hidden border border-[#cfc4c5]/20 bg-white">
                  <img
                    src={getCostumeImage(item)}
                    alt={item.name}
                    onError={(event) => {
                      event.currentTarget.src = fallbackCostumeImage;
                    }}
                    className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                  />
                </div>
                <h3 className="mb-1 text-[11px] font-semibold uppercase tracking-[0.2em]">{item.name}</h3>
                <p className="font-serif text-2xl text-[#99854e]">{getCostumePrice(item)}</p>
              </article>
            ))}
          </div>
        ) : (
          <div className="border border-dashed border-[#d8d0cf] bg-[#faf8f7] px-5 py-8 text-sm leading-6 text-[#5f5e5e]">
            {emptyMessage}
          </div>
        )}
      </div>
    </section>
  );
}
