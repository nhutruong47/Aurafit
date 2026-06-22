import { useEffect, useMemo, useState } from 'react';
import { fetchPublicCategories } from '../services/catalogService';
import { createCostume, fetchAdminCostumes, updateCostume } from '../services/costumeService';
import { hasUserRole } from '../utils/roles';

export const emptyProductForm = {
  name: '',
  description: '',
  imageUrl: '',
  rentalPrice: '',
  depositPrice: '',
  categoryId: 1,
};

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
  const isAdmin = hasUserRole(currentUser, 'ADMIN');

  const filteredProducts = useMemo(() => {
    const query = productSearch.trim().toLowerCase();
    return products.filter((product) => {
      const matchesSearch =
        !query ||
        [product.name, product.description]
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
    if (!isAdmin) return;

    Promise.all([fetchAdminCostumes(), fetchPublicCategories()])
      .then(([costumeData, categoryData]) => {
        const nextCategories = Array.isArray(categoryData) ? categoryData : [];
        setProducts(Array.isArray(costumeData) ? costumeData : []);
        setCategories(nextCategories);
        if (nextCategories.length > 0) {
          setProductForm((currentForm) => ({
            ...currentForm,
            categoryId: currentForm.categoryId || nextCategories[0].id,
          }));
        }
      })
      .catch(() => setProductError('Khong the tai danh sach san pham.'));
  }, [isAdmin]);

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
    setEditingProductId(product.id);
    setProductForm({
      name: product.name || '',
      description: product.description || '',
      imageUrl: product.imageUrl || '',
      rentalPrice: product.rentalPrice ?? '',
      depositPrice: product.depositPrice ?? '',
      categoryId: product.category?.id || categories[0]?.id || 1,
    });
    setProductMessage('');
    setProductError('');
  };

  const resetProductForm = () => {
    setEditingProductId(null);
    setProductForm({
      ...emptyProductForm,
      categoryId: categories[0]?.id || emptyProductForm.categoryId,
    });
    setProductMessage('');
    setProductError('');
  };

  const submitProduct = async () => {
    setIsSavingProduct(true);
    setProductMessage('');
    setProductError('');

    try {
      const payload = {
        name: productForm.name,
        description: productForm.description,
        imageUrl: productForm.imageUrl,
        rentalPrice: Number(productForm.rentalPrice),
        depositPrice: Number(productForm.depositPrice),
        categoryId: Number(productForm.categoryId),
      };

      if (editingProductId) {
        const updatedProduct = await updateCostume(editingProductId, payload);
        setProducts((currentProducts) =>
          currentProducts.map((product) =>
            product.id === updatedProduct.id ? updatedProduct : product
          )
        );
        setProductMessage('San pham da duoc cap nhat thanh cong.');
      } else {
        const createdProduct = await createCostume(payload);
        setProducts((currentProducts) => [createdProduct, ...currentProducts]);
        setProductMessage('San pham da duoc admin dang tai thanh cong.');
      }

      setEditingProductId(null);
      setProductForm({
        ...emptyProductForm,
        categoryId: categories[0]?.id || emptyProductForm.categoryId,
      });
      return true;
    } catch (error) {
      setProductError(error.message || 'Khong the luu san pham.');
      return false;
    } finally {
      setIsSavingProduct(false);
    }
  };

  return {
    isAdmin,
    products,
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
