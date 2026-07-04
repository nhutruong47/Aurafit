import { useEffect, useState } from 'react';
import { fetchPublicCategories } from '../services/catalogService';
import { createCategory, deleteCategory, updateCategory } from '../services/categoryService';
import { hasUserRole } from '../utils/roles';

const emptyCategoryForm = { name: '', description: '' };

export function useAdminCategories(currentUser) {
  const isAdmin = hasUserRole(currentUser, 'ADMIN');

  const [categories, setCategories] = useState([]);
  const [categoryForm, setCategoryForm] = useState(emptyCategoryForm);
  const [editingCategoryId, setEditingCategoryId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Load danh sách categories khi admin mount
  useEffect(() => {
    if (!isAdmin) return;
    setIsLoading(true);
    fetchPublicCategories()
      .then((data) => setCategories(Array.isArray(data) ? data : []))
      .catch(() => setError('Hệ thống không thể truy xuất danh sách danh mục.'))
      .finally(() => setIsLoading(false));
  }, [isAdmin]);

  const handleFieldChange = (event) => {
    const { name, value } = event.target;
    setCategoryForm((prev) => ({ ...prev, [name]: value }));
  };

  const hydrateForm = (category) => {
    setEditingCategoryId(category.id);
    setCategoryForm({ name: category.name || '', description: category.description || '' });
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
        description: categoryForm.description.trim() || null,
      };

      if (editingCategoryId) {
        const updated = await updateCategory(editingCategoryId, payload);
        setCategories((prev) =>
          prev.map((cat) => (cat.id === updated.id ? updated : cat))
        );
        setMessage(`Đã cập nhật danh mục "${updated.name}" thành công.`);
      } else {
        const created = await createCategory(payload);
        setCategories((prev) => [...prev, created]);
        setMessage(`Đã tạo danh mục "${created.name}" thành công.`);
      }

      resetForm();
    } catch (err) {
      setError(err.message || 'Hệ thống gặp sự cố khi lưu thông tin danh mục.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Xóa danh mục "${name}"? Hành động này không thể hoàn tác.`)) return;
    setError('');
    try {
      await deleteCategory(id);
      setCategories((prev) => prev.filter((cat) => cat.id !== id));
      setMessage(`Đã xóa danh mục "${name}".`);
      if (editingCategoryId === id) resetForm();
    } catch (err) {
      setError(err.message || 'Hệ thống gặp sự cố khi xóa danh mục.');
    }
  };

  return {
    categories,
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
