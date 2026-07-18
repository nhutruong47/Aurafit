import { useEffect, useState } from 'react';
import { fetchCategoryTree, flattenCategoryTree } from '../services/catalogService';
import { createCategory, deleteCategory, updateCategory } from '../services/categoryService';
import { useToastStore } from '../store/useToastStore';
import { hasUserRole } from '../utils/roles';

const emptyCategoryForm = { name: '', slug: '', description: '', parentId: '', sortOrder: '0' };

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

export function useAdminCategories(currentUser) {
  const isAdmin = hasUserRole(currentUser, 'ADMIN');

  const [categoryForm, setCategoryForm] = useState(emptyCategoryForm);
  const [editingCategoryId, setEditingCategoryId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const [categorySearch, setCategorySearch] = useState('');
  const [publicCategories, setPublicCategories] = useState([]);
  const [reloadKey, setReloadKey] = useState(0);

  // Load the complete hierarchy so parent and child nodes are never split across pages.
  useEffect(() => {
    if (!isAdmin) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsLoading(true);

    fetchCategoryTree()
      .then((treeData) => {
        setPublicCategories(flattenCategoryTree(Array.isArray(treeData) ? treeData : []));
      })
      .catch(() => {
        setError('Hệ thống không thể truy xuất danh sách danh mục.');
        useToastStore.getState().addToast('Hệ thống không thể truy xuất danh sách danh mục.', 'error');
      })
      .finally(() => setIsLoading(false));
  }, [isAdmin, reloadKey]);

  const handleFieldChange = (event) => {
    const { name, value } = event.target;
    setCategoryForm((prev) => {
      const next = { ...prev, [name]: value };
      // Auto-generate slug when name changes (only if slug wasn't manually edited)
      if (name === 'name' && (prev.slug === '' || prev.slug === generateSlug(prev.name))) {
        next.slug = generateSlug(value);
      }
      return next;
    });
  };

  const hydrateForm = (category) => {
    setEditingCategoryId(category.id);
    setCategoryForm({
      name: category.name || '',
      slug: category.slug || '',
      description: category.description || '',
      parentId: category.parentId ? String(category.parentId) : '',
      sortOrder: category.sortOrder != null ? String(category.sortOrder) : '0',
    });
    setMessage('');
    setError('');
  };

  const resetForm = () => {
    setEditingCategoryId(null);
    setCategoryForm(emptyCategoryForm);
    setMessage('');
    setError('');
  };

  const submitCategory = async (event) => {
    event.preventDefault();
    setIsSaving(true);
    setMessage('');
    setError('');

    try {
      const payload = {
        name: categoryForm.name.trim(),
        slug: categoryForm.slug.trim() || generateSlug(categoryForm.name.trim()),
        description: categoryForm.description.trim() || null,
        parentId: categoryForm.parentId ? Number(categoryForm.parentId) : null,
        sortOrder: categoryForm.sortOrder ? Number(categoryForm.sortOrder) : 0,
      };

      if (editingCategoryId) {
        const updated = await updateCategory(editingCategoryId, payload);
        setMessage(`Đã cập nhật danh mục "${updated.name}" thành công.`);
        useToastStore.getState().addToast(`Đã cập nhật danh mục "${updated.name}" thành công.`, 'success');
      } else {
        const created = await createCategory(payload);
        setMessage(`Đã tạo danh mục "${created.name}" thành công.`);
        useToastStore.getState().addToast(`Đã tạo danh mục "${created.name}" thành công.`, 'success');
      }

      setReloadKey((currentKey) => currentKey + 1);
      resetForm();
    } catch (err) {
      setError(err.message || 'Hệ thống gặp sự cố khi lưu thông tin danh mục.');
      useToastStore.getState().addToast(err.message || 'Hệ thống gặp sự cố khi lưu thông tin danh mục.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Xóa danh mục "${name}"? Hành động này không thể hoàn tác.`)) return;
    setError('');
    try {
      await deleteCategory(id);
      setReloadKey((currentKey) => currentKey + 1);
      setMessage(`Đã xóa danh mục "${name}".`);
      useToastStore.getState().addToast(`Đã xóa danh mục "${name}".`, 'success');
      if (editingCategoryId === id) resetForm();
    } catch (err) {
      setError(err.message || 'Hệ thống gặp sự cố khi xóa danh mục.');
      useToastStore.getState().addToast(err.message || 'Hệ thống gặp sự cố khi xóa danh mục.', 'error');
    }
  };

  return {
    categorySearch,
    setCategorySearch,
    publicCategories,
    categoryForm,
    editingCategoryId,
    isLoading,
    isSaving,
    message,
    error,
    handleFieldChange,
    hydrateForm,
    resetForm,
    submitCategory,
    handleDelete,
  };
}
