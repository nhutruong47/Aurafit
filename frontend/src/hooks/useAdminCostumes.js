import { useEffect, useMemo, useState } from 'react';
import { fetchPublicCategories } from '../services/catalogService';
import { createCostume, fetchAdminCostumes, updateCostume } from '../services/costumeService';
import { fetchUsers } from '../services/userService';
import { hasUserRole } from '../utils/roles';

export const emptyProductForm = {
  name: '',
  description: '',
  imageUrl: '',
  rentalPrice: '',
  depositPrice: '',
  categoryId: 1,
  ownerUserId: '',
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
  const [sellerUsers, setSellerUsers] = useState([]);
  const [productForm, setProductForm] = useState(emptyProductForm);
  const [editingProductId, setEditingProductId] = useState(null);
  const [productSearch, setProductSearch] = useState('');
  const [productCategoryFilter, setProductCategoryFilter] = useState('all');
  const [productStatusFilter, setProductStatusFilter] = useState('all');
  const [productMessage, setProductMessage] = useState('');
  const [productError, setProductError] = useState('');
  const [isSavingProduct, setIsSavingProduct] = useState(false);
  const isAdmin = hasUserRole(currentUser, 'ADMIN');
  const canManageProducts = hasUserRole(currentUser, 'SELLER');

  const filteredProducts = useMemo(() => {
    const query = productSearch.trim().toLowerCase();
    return products.filter((product) => {
      const matchesSearch =
        !query ||
        [
          product.name,
          product.description,
          product.metadata?.style,
          product.metadata?.occasion,
          product.metadata?.season,
          product.metadata?.color,
          Array.isArray(product.metadata?.tags) ? product.metadata.tags.join(' ') : '',
        ]
          .filter(Boolean)
          .some((value) => value.toLowerCase().includes(query));
      const matchesCategory =
        productCategoryFilter === 'all' ||
        product.category?.name === productCategoryFilter;
      const matchesStatus =
        productStatusFilter === 'all' ||
        (productStatusFilter === 'available' && product.status === 'ACTIVE') ||
        (productStatusFilter === 'hidden' && product.status !== 'ACTIVE');

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [products, productCategoryFilter, productSearch, productStatusFilter]);

  useEffect(() => {
    if (!canManageProducts) return;

    Promise.all([
      fetchAdminCostumes(),
      fetchPublicCategories(),
      isAdmin ? fetchUsers() : Promise.resolve([]),
    ])
      .then(([costumeData, categoryData, userData]) => {
        const nextCategories = Array.isArray(categoryData) ? categoryData : [];
        const nextSellerUsers = Array.isArray(userData)
          ? userData.filter((user) => String(user.role).toUpperCase() === 'SELLER')
          : [];
        setProducts(Array.isArray(costumeData) ? costumeData : []);
        setCategories(nextCategories);
        setSellerUsers(nextSellerUsers);
        if (nextCategories.length > 0) {
          setProductForm((currentForm) => ({
            ...currentForm,
            categoryId: currentForm.categoryId || nextCategories[0].id,
            ownerUserId: currentForm.ownerUserId || nextSellerUsers[0]?.id || '',
          }));
        }
      })
      .catch(() => setProductError('Không thể tải danh sách sản phẩm.'));
  }, [canManageProducts, isAdmin]);

  const handleProductFieldChange = (event) => {
    const { name, value, type, checked } = event.target;
    setProductForm((currentForm) => ({
      ...currentForm,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleProductImageUploaded = (asset) => {
    setProductForm((currentForm) => ({
      ...currentForm,
      imageUrl: asset?.secureUrl || '',
    }));
  };

  const hydrateProductForm = (product) => {
    const metadata = product.metadata || {};

    setEditingProductId(product.id);
    setProductForm({
      name: product.name || '',
      description: product.description || '',
      imageUrl: product.imageUrl || '',
      rentalPrice: product.rentalPrice ?? '',
      depositPrice: product.depositPrice ?? '',
      categoryId: product.category?.id || categories[0]?.id || 1,
      ownerUserId: product.owner?.id || sellerUsers[0]?.id || currentUser?.id || '',
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
  };

  const resetProductForm = () => {
    setEditingProductId(null);
    setProductForm({
      ...emptyProductForm,
      categoryId: categories[0]?.id || emptyProductForm.categoryId,
      ownerUserId: sellerUsers[0]?.id || '',
    });
    setProductMessage('');
    setProductError('');
  };

  const submitProduct = async () => {
    setIsSavingProduct(true);
    setProductMessage('');
    setProductError('');

    try {
      if (isAdmin && !productForm.ownerUserId) {
        setProductError('Admin can chon tai khoan SELLER lam chu san pham.');
        return false;
      }

      const payload = {
        name: productForm.name,
        description: productForm.description,
        imageUrl: productForm.imageUrl,
        rentalPrice: Number(productForm.rentalPrice),
        depositPrice: Number(productForm.depositPrice),
        categoryId: Number(productForm.categoryId),
        ...(isAdmin ? { ownerUserId: Number(productForm.ownerUserId) } : {}),
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
      } else {
        const createdProduct = await createCostume(payload);
        setProducts((currentProducts) => [createdProduct, ...currentProducts]);
        setProductMessage('Sản phẩm đã được đăng tải thành công.');
      }

      setEditingProductId(null);
      setProductForm({
        ...emptyProductForm,
        categoryId: categories[0]?.id || emptyProductForm.categoryId,
        ownerUserId: sellerUsers[0]?.id || '',
      });
      return true;
    } catch (error) {
      setProductError(error.message || 'Không thể lưu sản phẩm.');
      return false;
    } finally {
      setIsSavingProduct(false);
    }
  };

  return {
    isAdmin,
    canManageProducts,
    products,
    categories,
    sellerUsers,
    filteredProducts,
    productForm,
    editingProductId,
    productSearch,
    productCategoryFilter,
    productStatusFilter,
    productMessage,
    productError,
    isSavingProduct,
    setProductSearch,
    setProductCategoryFilter,
    setProductStatusFilter,
    handleProductFieldChange,
    handleProductImageUploaded,
    hydrateProductForm,
    resetProductForm,
    submitProduct,
  };
}
