import { useEffect, useState } from 'react';
import { fetchPublicCategories } from '../../services/catalogService';
import { mosaicCategories } from './homeData';

const categoryKeyByName = {
  cosplay: 'cosplay',
  'anime cosplay': 'cosplay',
  'gaming characters': 'cosplay',
  events: 'events',
  event: 'events',
  'event & formal': 'events',
  yearbook: 'yearbook',
  'kỷ yếu': 'yearbook',
  'traditional & vintage': 'yearbook',
  accessories: 'accessories',
  'phụ kiện': 'accessories',
};

const placeholderImage =
  'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=1200&q=85';

function resolveCategoryKey(name) {
  if (!name) return null;
  return categoryKeyByName[String(name).trim().toLowerCase()] || null;
}

function CategoryTile({ category, wide = false, onClick }) {
  return (
    <article
      onClick={onClick}
      className={`group relative cursor-pointer overflow-hidden bg-black ${wide ? 'aspect-[16/10]' : 'aspect-square'}`}
    >
      <img
        src={category.image || placeholderImage}
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
          {category.cta || 'Shop'}
        </span>
      </div>
    </article>
  );
}

export default function HomeCategoryMosaic({ onNavigate }) {
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    let isMounted = true;

    fetchPublicCategories()
      .then((data) => {
        if (!isMounted) return;
        setCategories(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (isMounted) setCategories([]);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const mergedCategories = mosaicCategories.map((mosaic) => {
    const mosaicKey = resolveCategoryKey(mosaic.title);
    const match = categories.find((category) => resolveCategoryKey(category.name) === mosaicKey);

    return {
      ...mosaic,
      apiCategory: match || null,
    };
  });

  const handleClick = (mergedCategory) => {
    const key = resolveCategoryKey(mergedCategory.apiCategory?.name) || resolveCategoryKey(mergedCategory.title);
    onNavigate?.('catalog', { categoryKey: key, categoryId: mergedCategory.apiCategory?.id });
  };

  const wideTiles = mergedCategories.filter((category) => category.wide);
  const regularTiles = mergedCategories.filter((category) => !category.wide);

  return (
    <section className="bg-[#f9f9f9] py-24 md:py-[120px]" id="categories">
      <div className="mx-auto max-w-[1440px] px-5 md:px-20">
        <div className="mb-16 text-center">
          <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.3em] text-[#99854e]">Kham pha</p>
          <h2 className="font-serif text-4xl font-normal md:text-5xl">Shop by Category</h2>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-2">
          {wideTiles.map((category) => (
            <CategoryTile key={category.title} category={category} wide onClick={() => handleClick(category)} />
          ))}
        </div>

        <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
          {regularTiles.map((category) => (
            <CategoryTile key={category.title} category={category} onClick={() => handleClick(category)} />
          ))}
        </div>
      </div>
    </section>
  );
}
