import { useMemo } from 'react';
import { useCatalogCategories } from '../../hooks/useCatalogCategories';

const categoryVisualsByPath = {
  'su-kien': {
    copy: 'Váy dạ hội, suit và trang phục nổi bật cho những dịp quan trọng',
    cta: 'Xem bộ sưu tập',
    wide: true,
    image:
      'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1200&q=85',
  },
  cosplay: {
    copy: 'Trang phục nhân vật cùng phụ kiện đồng bộ cho concept nổi bật',
    cta: 'Khám phá ngay',
    wide: true,
    image:
      'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=1200&q=85',
  },
  'ky-yeu': {
    cta: 'Xem ngay',
    image:
      'https://images.unsplash.com/photo-1524592094714-0f0654e20314?auto=format&fit=crop&w=800&q=85',
  },
  'trang-phuc-truyen-thong': {
    cta: 'Khám phá ngay',
    image:
      'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=800&q=85',
  },
  'phu-kien': {
    cta: 'Xem ngay',
    image:
      'https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?auto=format&fit=crop&w=800&q=85',
  },
};

const fallbackImage =
  'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=1200&q=85';

function CategoryTile({ category, wide = false, onClick }) {
  return (
    <article
      onClick={onClick}
      className={`group relative cursor-pointer overflow-hidden bg-black ${wide ? 'aspect-[16/10]' : 'aspect-square'}`}
    >
      <img
        src={category.image || fallbackImage}
        alt={category.title}
        className="h-full w-full object-cover opacity-60 transition duration-1000 group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
      <div className={wide ? 'absolute bottom-0 left-0 p-8 md:p-10' : 'absolute bottom-0 left-0 p-5 md:p-6'}>
        <h3 className={`${wide ? 'text-3xl md:text-4xl' : 'text-xl'} mb-2 font-serif italic text-white`}>
          {category.title}
        </h3>
        {wide && category.copy && (
          <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/60">{category.copy}</p>
        )}
        <span className="inline-block border-b border-white pb-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-white transition group-hover:border-[#99854e] group-hover:text-[#99854e]">
          {category.cta || 'Xem ngay'}
        </span>
      </div>
    </article>
  );
}

export default function HomeCategoryMosaic({ onNavigate }) {
  const { categoryTree } = useCatalogCategories();

  const displayCategories = useMemo(() => {
    return categoryTree
      .map((category) => {
        const visual = categoryVisualsByPath[category.path] || {};

        return {
          id: category.id,
          path: category.path,
          title: category.name,
          copy: visual.copy || category.description || '',
          cta: visual.cta || 'Xem ngay',
          wide: Boolean(visual.wide),
          image: visual.image || fallbackImage,
        };
      })
      .filter((category) => category.path in categoryVisualsByPath);
  }, [categoryTree]);

  const wideTiles = displayCategories.filter((category) => category.wide);
  const regularTiles = displayCategories.filter((category) => !category.wide);

  return (
    <section className="bg-[#f9f9f9] py-24 md:py-[120px]" id="categories">
      <div className="mx-auto max-w-[1440px] px-5 md:px-20">
        <div className="mb-16 text-center">
          <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.3em] text-[#99854e]">Khám phá</p>
          <h2 className="font-serif text-4xl font-normal md:text-5xl">Khám phá theo danh mục</h2>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-2">
          {wideTiles.map((category) => (
            <CategoryTile
              key={category.id}
              category={category}
              wide
              onClick={() => onNavigate?.('catalog', { categoryPath: category.path, categoryId: category.id })}
            />
          ))}
        </div>

        <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
          {regularTiles.map((category) => (
            <CategoryTile
              key={category.id}
              category={category}
              onClick={() => onNavigate?.('catalog', { categoryPath: category.path, categoryId: category.id })}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
