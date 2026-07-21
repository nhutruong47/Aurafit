import { useEffect, useState } from 'react';
import { fetchCategoryTree, flattenCategoryTree } from '../services/catalogService';
import {
  createCostume,
  fetchAdminCostumes,
  fetchCostumeEnrichment,
  runAllCostumeEnrichment,
  runCostumeEnrichment,
  updateCostume,
} from '../services/costumeService';
import { useToastStore } from '../store/useToastStore';
import { hasUserRole } from '../utils/roles';

export const emptyProductForm = {
  name: '',
  slug: '',
  description: '',
  imageUrls: [],
  rentalPrice: '',
  depositPrice: '',
  categoryId: '',
  status: 'ACTIVE',
  style: '',
  occasion: '',
  season: '',
  color: '',
  tags: '',
  skinTone: '',
  bodyType: '',
  gender: '',
  size: '',
  material: '',
  fitNote: '',
};

function generateSlug(name) {
  if (!name) return '';
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

const metadataTagsToInput = (tags) => (Array.isArray(tags) ? tags.join(', ') : '');

const buildMetadataPayload = (productForm) => ({
  style: productForm.style.trim(),
  occasion: productForm.occasion.trim(),
  season: productForm.season.trim(),
  color: productForm.color.trim(),
  tags: productForm.tags
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean),
  skinTone: productForm.skinTone.trim() || null,
  bodyType: productForm.bodyType.trim() || null,
  gender: productForm.gender.trim() || null,
  size: productForm.size.trim() || null,
  material: productForm.material.trim() || null,
  fitNote: productForm.fitNote.trim() || null,
});

export function useAdminCostumes(currentUser) {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [productForm, setProductForm] = useState(emptyProductForm);
  const [editingProductId, setEditingProductId] = useState(null);
  const [productSearch, setProductSearch] = useState('');
  const [productCategoryFilter, setProductCategoryFilter] = useState('all');
  const [productStatusFilter, setProductStatusFilter] = useState('all');
  const [productMessage, setProductMessage] = useState('');
  const [productError, setProductError] = useState('');
  const [isSavingProduct, setIsSavingProduct] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isRunningEnrichmentBatch, setIsRunningEnrichmentBatch] = useState(false);
  const [enrichmentBatchResult, setEnrichmentBatchResult] = useState(null);
  const [productEnrichment, setProductEnrichment] = useState(null);
  const [isLoadingProductEnrichment, setIsLoadingProductEnrichment] = useState(false);
  const [isEnrichingProduct, setIsEnrichingProduct] = useState(false);

  // Pagination state
  const [page, setPage] = useState(0);
  const [pageSize] = useState(12);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);

  const isAdmin = hasUserRole(currentUser, 'ADMIN');
  const canManageProducts = hasUserRole(currentUser, 'ADMIN') || hasUserRole(currentUser, 'STAFF');

  const filteredProducts = products; // Server side filtering replaces this

  useEffect(() => {
    if (!canManageProducts) return;

    setIsLoading(true);
    Promise.all([
      fetchAdminCostumes({
        pageNo: page,
        pageSize: pageSize,
        keyword: productSearch.trim() || undefined,
        status: productStatusFilter !== 'all' ? (productStatusFilter === 'available' ? 'ACTIVE' : 'HIDDEN') : undefined,
        categoryId: productCategoryFilter !== 'all' ? productCategoryFilter : undefined,
      }),
      fetchCategoryTree(),
    ])
      .then(([costumeData, categoryData]) => {
        const nextCategories = flattenCategoryTree(Array.isArray(categoryData) ? categoryData : []);
        setProducts(costumeData.data || []);
        setTotalPages(costumeData.totalPages || 1);
        setTotalElements(costumeData.totalElements || 0);

        setCategories(nextCategories);
        if (nextCategories.length > 0 && !productForm.categoryId) {
          setProductForm((currentForm) => ({
            ...currentForm,
            categoryId: nextCategories[0].id,
          }));
        }
      })
      .catch((err) => {
        setProductError(err.message || 'Không thể tải danh sách sản phẩm.');
        useToastStore.getState().addToast(err.message || 'Không thể tải danh sách sản phẩm.', 'error');
      })
      .finally(() => setIsLoading(false));
  }, [canManageProducts, isAdmin, page, pageSize, productSearch, productStatusFilter, productCategoryFilter]);

  // Reset page to 0 when filters change
  useEffect(() => {
    setPage(0);
  }, [productSearch, productStatusFilter, productCategoryFilter]);

  const loadProductEnrichment = async (costumeId) => {
    if (!isAdmin || !costumeId) {
      setProductEnrichment(null);
      return null;
    }

    setIsLoadingProductEnrichment(true);
    setProductEnrichment(null);
    try {
      const enrichment = await fetchCostumeEnrichment(costumeId);
      setProductEnrichment(enrichment);
      return enrichment;
    } catch {
      useToastStore.getState().addToast(
        'Không thể tải thông tin AI đã bổ sung cho sản phẩm. Vui lòng thử lại.',
        'error'
      );
      return null;
    } finally {
      setIsLoadingProductEnrichment(false);
    }
  };

  const enrichAllProducts = async () => {
    if (!isAdmin || isRunningEnrichmentBatch) return null;

    setIsRunningEnrichmentBatch(true);
    setEnrichmentBatchResult(null);
    try {
      const result = await runAllCostumeEnrichment();
      setEnrichmentBatchResult(result);
      useToastStore.getState().addToast(
        `Đã cập nhật thông tin AI cho ${result.successCount}/${result.processedCount} sản phẩm.`,
        result.failureCount > 0 ? 'warning' : 'success'
      );
      return result;
    } catch {
      useToastStore.getState().addToast(
        'Không thể cập nhật thông tin AI cho toàn bộ sản phẩm. Vui lòng kiểm tra kết nối và thử lại.',
        'error'
      );
      return null;
    } finally {
      setIsRunningEnrichmentBatch(false);
    }
  };

  const enrichProduct = async (costumeId) => {
    if (!isAdmin || !costumeId || isEnrichingProduct) return null;

    setIsEnrichingProduct(true);
    try {
      const enrichment = await runCostumeEnrichment(costumeId);
      setProductEnrichment(enrichment);
      const embeddingReady = enrichment?.embedding?.status === 'READY';
      useToastStore.getState().addToast(
        embeddingReady
          ? 'AI đã bổ sung thông tin hỗ trợ tư vấn và tìm kiếm cho sản phẩm.'
          : 'Thông tin hỗ trợ tư vấn đã được cập nhật, nhưng dữ liệu tìm kiếm chưa sẵn sàng.',
        embeddingReady ? 'success' : 'warning'
      );
      return enrichment;
    } catch {
      useToastStore.getState().addToast(
        'Không thể bổ sung thông tin AI cho sản phẩm. Vui lòng kiểm tra kết nối và thử lại.',
        'error'
      );
      return null;
    } finally {
      setIsEnrichingProduct(false);
    }
  };

  const handleProductFieldChange = (event) => {
    const { name, value, type, checked } = event.target;
    setProductForm((currentForm) => {
      const next = { ...currentForm, [name]: type === 'checkbox' ? checked : value };
      // Auto-generate slug when name changes (only if slug wasn't manually edited)
      if (name === 'name' && (currentForm.slug === '' || currentForm.slug === generateSlug(currentForm.name))) {
        next.slug = generateSlug(value);
      }
      return next;
    });
  };

  const handleProductImagesChange = (imageUrls) => {
    setProductForm((currentForm) => ({
      ...currentForm,
      imageUrls: Array.isArray(imageUrls) ? imageUrls : [],
    }));
  };

  const hydrateProductForm = (product) => {
    const metadata = product.metadata || {};
    const imageUrls = Array.isArray(product.imageUrls) && product.imageUrls.length > 0
      ? product.imageUrls.filter(Boolean)
      : product.imageUrl
        ? [product.imageUrl]
        : [];

    setEditingProductId(product.id);
    setProductForm({
      name: product.name || '',
      slug: product.slug || '',
      description: product.description || '',
      imageUrls,
      rentalPrice: product.rentalPrice ?? '',
      depositPrice: product.depositPrice ?? '',
      categoryId: product.category?.id || categories[0]?.id || 1,
      status: product.status || 'ACTIVE',
      style: metadata.style || '',
      occasion: metadata.occasion || '',
      season: metadata.season || '',
      color: metadata.color || '',
      tags: metadataTagsToInput(metadata.tags),
      skinTone: metadata.skinTone || '',
      bodyType: metadata.bodyType || '',
      gender: metadata.gender || '',
      size: metadata.size || '',
      material: metadata.material || '',
      fitNote: metadata.fitNote || '',
    });
    setProductMessage('');
    setProductError('');
    loadProductEnrichment(product.id);
  };

  const resetProductForm = () => {
    setEditingProductId(null);
    setProductForm({
      ...emptyProductForm,
      categoryId: categories[0]?.id || emptyProductForm.categoryId,
    });
    setProductMessage('');
    setProductError('');
    setProductEnrichment(null);
    setIsLoadingProductEnrichment(false);
  };

  const submitProduct = async () => {
    setIsSavingProduct(true);
    setProductMessage('');
    setProductError('');

    try {

      const payload = {
        name: productForm.name,
        slug: productForm.slug.trim() || generateSlug(productForm.name),
        description: productForm.description,
        imageUrls: [...productForm.imageUrls],
        rentalPrice: Number(productForm.rentalPrice),
        depositPrice: Number(productForm.depositPrice),
        categoryId: Number(productForm.categoryId),
        metadata: buildMetadataPayload(productForm),
      };

      if (editingProductId) {
        const updatedProduct = await updateCostume(editingProductId, {
          ...payload,
          status: productForm.status,
        });
        setProducts((currentProducts) =>
          currentProducts.map((product) =>
            product.id === updatedProduct.id ? updatedProduct : product
          )
        );
        setProductMessage('Sản phẩm đã được cập nhật thành công.');
        useToastStore.getState().addToast('Sản phẩm đã được cập nhật thành công.', 'success');
      } else {
        const createdProduct = await createCostume(payload);
        setProducts((currentProducts) => [createdProduct, ...currentProducts]);
        setProductMessage('Sản phẩm đã được đăng tải thành công.');
        useToastStore.getState().addToast('Sản phẩm đã được đăng tải thành công.', 'success');
      }

      setEditingProductId(null);
      setProductForm({
        ...emptyProductForm,
        categoryId: categories[0]?.id || emptyProductForm.categoryId,
      });
      return true;
    } catch (error) {
      setProductError(error.message || 'Không thể lưu sản phẩm.');
      useToastStore.getState().addToast(error.message || 'Không thể lưu sản phẩm.', 'error');
      return false;
    } finally {
      setIsSavingProduct(false);
    }
  };

  return {
    page,
    totalPages,
    totalElements,
    setPage,
    isLoading,
    isAdmin,
    canManageProducts,
    categories,
    filteredProducts,
    productForm,
    editingProductId,
    productSearch,
    productCategoryFilter,
    productStatusFilter,
    productMessage,
    productError,
    isSavingProduct,
    isRunningEnrichmentBatch,
    enrichmentBatchResult,
    productEnrichment,
    isLoadingProductEnrichment,
    isEnrichingProduct,
    setProductSearch,
    setProductCategoryFilter,
    setProductStatusFilter,
    handleProductFieldChange,
    handleProductImagesChange,
    hydrateProductForm,
    resetProductForm,
    submitProduct,
    enrichAllProducts,
    enrichProduct,
  };
}
