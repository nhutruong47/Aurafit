// Luoi danh muc noi bat trong khu vuc kham pha cua trang chu.
import { useEffect, useState } from 'react';
import { fetchPublicCategories } from '../../services/api';
import { mosaicCategories } from './homeData';

const categoryKeyByName = {
  Cosplay: 'cosplay',
  Events: 'events',
  Event: 'events',
  Yearbook: 'yearbook',
  'Kỷ yếu': 'yearbook',
  Accessories: 'accessories',
  'Phụ kiện': 'accessories',
};

const placeholderImage = 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=1200&q=85';

function CategoryTile({ category, wide = false, onClick }) {
  return (
    <article onClick={onClick} className={`group relative cursor-pointer overflow-hidden bg-black ${wide ? 'aspect-[16/10]' : 'aspect-square'}`}>
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

  // Merge backend categories into the existing visual mosaic so static imagery
  // is preserved but the labels & navigation targets reflect the real catalog.
  const mergedCategories = mosaicCategories.map((mosaic) => {
    const match = categories.find((c) => {
      const key = categoryKeyByName[c.name] || categoryKeyByName[c.name?.toLowerCase()];
      return key && mosaic.title.toLowerCase().includes(mosaic.title.toLowerCase());
    });
    return {
      ...mosaic,
      apiCategory: match || null,
    };
  });

  const handleClick = (mergedCategory) => {
    const key = categoryKeyByName[mergedCategory.apiCategory?.name] || categoryKeyByName[mergedCategory.title];
    onNavigate?.('catalog', { categoryKey: key, categoryId: mergedCategory.apiCategory?.id });
  };

  const wideTiles = mergedCategories.filter((category) => category.wide);
  const regularTiles = mergedCategories.filter((category) => !category.wide);

  return (
    <section className="bg-[#f9f9f9] py-24 md:py-[120px]" id="categories">
      <div className="mx-auto max-w-[1440px] px-5 md:px-20">
        <div className="mb-16 text-center">
          <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.3em] text-[#99854e]">Khám phá</p>
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
