import { useEffect, useMemo, useState } from 'react';
import CatalogSearchBar from '../components/catalog/CatalogSearchBar';
import CatalogSortBar from '../components/catalog/CatalogSortBar';
import CatalogProductCard from '../components/catalog/CatalogProductCard';
import UniversalFilterSidebar from '../components/catalog/UniversalFilterSidebar';
import CosplayHero from '../components/cosplay/CosplayHero';
import CosplayStepsSection from '../components/cosplay/CosplayStepsSection';
import CostumeCheckboxFilterGroup from '../components/costume/CostumeCheckboxFilterGroup';
import ShopPagination from '../components/shop/ShopPagination';
import EmptyState from '../components/ui/EmptyState';
import { useCatalogCategories } from '../hooks/useCatalogCategories';
import { useCatalogCostumes } from '../hooks/useCatalogCostumes';
import {
  getCostumeCategoryPath,
  getCostumeDisplayCategory,
  getCostumeDisplayMeta,
  getCostumeRentalPriceValue,
  getCostumeSubcategory,
  getCostumeTags,
} from '../utils/costumeUtils';

const PAGE_SIZE = 12;
const ROOT_PAGE_SIZE = 120;

function matchesCategoryPath(costume, categoryPath) {
  if (!categoryPath) {
    return true;
  }

  const normalizedCategoryPath = categoryPath.trim().toLowerCase();
  const costumeCategoryPath = String(getCostumeCategoryPath(costume) || '').toLowerCase();

  return (
    costumeCategoryPath === normalizedCategoryPath ||
    costumeCategoryPath.startsWith(`${normalizedCategoryPath}/`)
  );
}

function matchesSearchTerm(costume, searchTerm) {
  if (!searchTerm) {
    return true;
  }

  const normalizedSearch = searchTerm.trim().toLowerCase();
  if (!normalizedSearch) {
    return true;
  }

  const haystack = [
    costume.name,
    costume.description,
    getCostumeDisplayCategory(costume),
    getCostumeSubcategory(costume),
    getCostumeDisplayMeta(costume),
    ...getCostumeTags(costume),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  return haystack.includes(normalizedSearch);
}

function sortProducts(products, sortBy, sortDir) {
  const direction = sortDir === 'asc' ? 1 : -1;

  return [...products].sort((left, right) => {
    if (sortBy === 'rentalPrice') {
      return (getCostumeRentalPriceValue(left) - getCostumeRentalPriceValue(right)) * direction;
    }

    if (sortBy === 'name') {
      return left.name.localeCompare(right.name, 'vi') * direction;
    }

    return (Number(left.id || 0) - Number(right.id || 0)) * direction;
  });
}

export default function CosplayPage({ onNavigate }) {
  const [sortBy, setSortBy] = useState('id');
  const [sortDir, setSortDir] = useState('desc');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBrowsePaths, setSelectedBrowsePaths] = useState([]);
  const [activePage, setActivePage] = useState(1);
  const { categoriesByPath, error: categoryError } = useCatalogCategories();

  const thematicFilters = useMemo(() => {
    const root = categoriesByPath.get('cosplay');
    const options = Array.isArray(root?.children)
      ? root.children.map((category) => ({
          id: category.path,
          label: category.name,
        }))
      : [];

    return [
      {
        title: 'Danh mục cosplay',
        options,
      },
    ];
  }, [categoriesByPath]);

  const accessoryCategories = useMemo(() => {
    const root = categoriesByPath.get('phu-kien');
    return Array.isArray(root?.children)
      ? root.children.map((category) => ({
          id: category.path,
          label: category.name,
          description: category.description || '',
        }))
      : [];
  }, [categoriesByPath]);

  const processSteps = useMemo(() => {
    const cosplayRoot = categoriesByPath.get('cosplay');
    const sourceCategories = [
      ...(cosplayRoot?.children || []),
      ...accessoryCategories.map((category) => ({
        name: category.label,
        description: category.description,
      })),
    ].slice(0, 4);

    return sourceCategories.map((category, index) => [
      String(index + 1).padStart(2, '0'),
      category.name,
      category.description ||
        'Một gợi ý nhỏ để bạn hoàn thiện tạo hình và chọn set phù hợp với nhân vật mình muốn thể hiện.',
    ]);
  }, [accessoryCategories, categoriesByPath]);

  const {
    costumes: cosplayProducts,
    isLoading: isLoadingCosplay,
    error: cosplayError,
  } = useCatalogCostumes({
    categoryPath: 'cosplay',
    sortBy,
    sortDir,
    pageSize: ROOT_PAGE_SIZE,
  });

  const {
    costumes: accessoryProducts,
    isLoading: isLoadingAccessories,
    error: accessoryError,
  } = useCatalogCostumes({
    categoryPath: 'phu-kien',
    sortBy,
    sortDir,
    pageSize: ROOT_PAGE_SIZE,
  });

  const selectedBrowseCategories = useMemo(
    () =>
      selectedBrowsePaths
        .map((categoryPath) => categoriesByPath.get(categoryPath))
        .filter(Boolean),
    [categoriesByPath, selectedBrowsePaths]
  );

  const mergedProducts = useMemo(() => {
    const productsById = new Map();

    [...cosplayProducts, ...accessoryProducts].forEach((product) => {
      if (!productsById.has(product.id)) {
        productsById.set(product.id, product);
      }
    });

    return Array.from(productsById.values());
  }, [accessoryProducts, cosplayProducts]);

  const filteredProducts = useMemo(() => {
    const sourceProducts = selectedBrowsePaths.length
      ? mergedProducts.filter((product) =>
          selectedBrowsePaths.some((categoryPath) => matchesCategoryPath(product, categoryPath))
        )
      : mergedProducts;

    const searchMatchedProducts = sourceProducts.filter((product) => matchesSearchTerm(product, searchTerm));

    return sortProducts(searchMatchedProducts, sortBy, sortDir);
  }, [mergedProducts, searchTerm, selectedBrowsePaths, sortBy, sortDir]);

  const totalElements = filteredProducts.length;
  const totalPages = Math.max(1, Math.ceil(totalElements / PAGE_SIZE));
  const pagedProducts = useMemo(() => {
    const startIndex = Math.max(activePage - 1, 0) * PAGE_SIZE;
    return filteredProducts.slice(startIndex, startIndex + PAGE_SIZE);
  }, [activePage, filteredProducts]);
  const isLoading = isLoadingCosplay || isLoadingAccessories;
  const error = cosplayError || accessoryError || categoryError;

  useEffect(() => {
    setActivePage(1);
  }, [searchTerm, selectedBrowsePaths, sortBy, sortDir]);

  useEffect(() => {
    if (activePage > totalPages) {
      setActivePage(totalPages);
    }
  }, [activePage, totalPages]);

  const handleSortChange = (newSortBy, newSortDir) => {
    setSortBy(newSortBy);
    setSortDir(newSortDir);
  };

  const handleClearFilters = () => {
    setSortBy('id');
    setSortDir('desc');
    setSearchTerm('');
    setSelectedBrowsePaths([]);
    setActivePage(1);
  };

  const handleToggleBrowsePath = (categoryPath) => {
    setSelectedBrowsePaths((current) =>
      current.includes(categoryPath)
        ? current.filter((path) => path !== categoryPath)
        : [...current, categoryPath]
    );
  };

  return (
    <div className="bg-[#f7f7f7] text-[#111111]">
      <CosplayHero onNavigate={onNavigate} />

      <section id="cosplay-products" className="py-20 md:py-28">
        <div className="mx-auto grid max-w-[1440px] grid-cols-1 gap-12 px-5 md:grid-cols-12 md:px-20">
          <aside className="md:col-span-3">
            <UniversalFilterSidebar
              filterGroups={thematicFilters}
              selectedIds={selectedBrowsePaths}
              onToggle={handleToggleBrowsePath}
              onClearAll={handleClearFilters}
            >
              <CostumeCheckboxFilterGroup
                title="Phụ kiện đi kèm"
                items={accessoryCategories}
                selectedItems={selectedBrowsePaths}
                onToggle={handleToggleBrowsePath}
              />
            </UniversalFilterSidebar>
          </aside>

          <div className="md:col-span-9">
            <div className="mb-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#99854e]">
                Gợi ý cho buổi hóa thân
              </p>
              <h2 className="mt-3 font-serif text-3xl italic leading-tight text-black md:text-4xl">
                {selectedBrowseCategories.length
                  ? selectedBrowseCategories.map((category) => category.name).join(' + ')
                  : 'Chọn set phù hợp với nhân vật bạn muốn thể hiện'}
              </h2>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-[#5f5e5e]">
                {selectedBrowseCategories.length
                  ? `Bạn đang xem các mẫu thuộc ${selectedBrowseCategories.length} nhóm đã chọn để so sánh dễ hơn.`
                  : 'Từ trang phục chính đến phụ kiện đi kèm, bạn có thể lọc theo từng nhóm để tìm ra set hợp ý nhất cho buổi chụp ảnh hay sự kiện.'}
              </p>
              <p className="mt-4 text-sm text-[#5f5e5e]">
                {isLoading ? (
                  'Đang chuẩn bị danh sách cho bạn...'
                ) : (
                  <>
                    Đang hiển thị <span className="font-medium text-black">{pagedProducts.length}</span> /{' '}
                    <span className="font-medium text-black">{totalElements}</span> sản phẩm
                  </>
                )}
              </p>
              {error && (
                <p className="mt-2 text-sm text-red-600">
                  Hiện chưa thể tải danh sách sản phẩm. Vui lòng thử lại sau.
                </p>
              )}
            </div>

            <CatalogSearchBar
              searchTerm={searchTerm}
              onSearchTermChange={setSearchTerm}
              onClearSearch={() => setSearchTerm('')}
            />

            <CatalogSortBar sortBy={sortBy} sortDir={sortDir} onSortChange={handleSortChange} />

            {pagedProducts.length > 0 ? (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {pagedProducts.map((product) => (
                  <CatalogProductCard key={product.id} product={product} onNavigate={onNavigate} />
                ))}
              </div>
            ) : (
              !isLoading && (
                <EmptyState
                  icon="filter_alt_off"
                  title="Chưa tìm thấy mẫu phù hợp"
                  message="Bạn hãy thử đổi từ khóa hoặc nới bớt bộ lọc để xem thêm lựa chọn khác."
                  actionLabel="Xóa toàn bộ bộ lọc"
                  onAction={handleClearFilters}
                  className="px-8 py-16"
                />
              )
            )}

            {totalPages > 1 && (
              <div className="mt-12">
                <ShopPagination currentPage={activePage} totalPages={totalPages} onPageChange={setActivePage} />
              </div>
            )}
          </div>
        </div>
      </section>

      <CosplayStepsSection steps={processSteps} />
    </div>
  );
}
