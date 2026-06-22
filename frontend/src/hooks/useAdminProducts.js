import { useEffect, useMemo, useState } from 'react';
import { createCostume, fetchCostumes, updateCostume } from '../services/api';
import { hasUserRole } from '../utils/roles';

export const emptyProductForm = {
  name: '',
  description: '',
  imageUrl: '',
  rentalPrice: '',
  depositPrice: '',
  categoryId: 1,
};

export function useAdminProducts(currentUser) {
  const [products, setProducts] = useState([]);
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

    fetchCostumes()
      .then((data) => {
        // Backend returns paginated response with `content` array
        const list = Array.isArray(data) ? data : data?.content || [];
        setProducts(list);
      })
      .catch(() => setProductError('Không thể tải danh sách sản phẩm.'));
  }, [isAdmin]);

  const handleProductFieldChange = (event) => {
    const { name, value, type, checked } = event.target;
    setProductForm((currentForm) => ({
      ...currentForm,
      [name]: type === 'checkbox' ? checked : value,
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
      categoryId: product.category?.id || 1,
    });
    setProductMessage('');
    setProductError('');
  };

  const resetProductForm = () => {
    setEditingProductId(null);
    setProductForm(emptyProductForm);
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
        setProductMessage('Sản phẩm đã được cập nhật thành công.');
      } else {
        const createdProduct = await createCostume(payload);
        setProducts((currentProducts) => [createdProduct, ...currentProducts]);
        setProductMessage('Sản phẩm đã được admin đăng tải thành công.');
      }

      setEditingProductId(null);
      setProductForm(emptyProductForm);
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
    products,
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
    hydrateProductForm,
    resetProductForm,
    submitProduct,
  };
}
