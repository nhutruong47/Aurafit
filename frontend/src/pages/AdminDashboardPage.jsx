import { useCallback, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import AdminCategoriesSection from '../components/admin/AdminCategoriesSection';
import AdminOverviewTab from '../components/admin/AdminOverviewTab';
import AdminProductsSection from '../components/admin/AdminProductsSection';
import AdminSupportSection from '../components/admin/AdminSupportSection';
import AdminUsersSection from '../components/admin/AdminUsersSection';
import { useAdminCategories } from '../hooks/useAdminCategories';
import { useAdminCostumes } from '../hooks/useAdminCostumes';
import { useAdminUsers } from '../hooks/useAdminUsers';

export default function AdminDashboardPage({ currentUser }) {
  const location = useLocation();
  const navigate = useNavigate();

  // Read active tab from URL hash, default to 'overview'
  const hashTab = location.hash.replace('#', '') || 'overview';

  const {
    page: productPage,
    totalPages: productTotalPages,
    totalElements: productTotalElements,
    setPage: setProductPage,
    isAdmin,
    canManageProducts,
    products,
    categories: publicCategories,
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
    handleProductImagesChange,
    hydrateProductForm,
    resetProductForm,
    submitProduct,
  } = useAdminCostumes(currentUser);

  const {
    page: categoryPage,
    totalPages: categoryTotalPages,
    totalElements: categoryTotalElements,
    setPage: setCategoryPage,
    categorySearch,
    setCategorySearch,
    categories: managedCategories,
    categoryForm,
    editingCategoryId,
    isLoading: isCategoryLoading,
    isSaving: isCategorySaving,
    message: categoryMessage,
    error: categoryError,
    handleFieldChange: handleCategoryFieldChange,
    hydrateForm: hydrateCategoryForm,
    resetForm: resetCategoryForm,
    submitCategory,
    handleDelete: handleDeleteCategory,
  } = useAdminCategories(currentUser);

  const {
    page: userPage,
    totalPages: userTotalPages,
    totalElements: userTotalElements,
    setPage: setUserPage,
    filteredUsers,
    userSearch,
    message: userMessage,
    error: userError,
    isLoading: isUserLoading,
    isCreatingStaff,
    updatingUserId,
    setUserSearch,
    createStaff,
  } = useAdminUsers(currentUser);

  const tabs = useMemo(
    () =>
      [
        isAdmin ? ['overview', 'Tổng quan', 'dashboard'] : null,
        ['products', 'Sản phẩm', 'inventory_2'],
        isAdmin ? ['users', 'Tài khoản', 'manage_accounts'] : null,
        isAdmin ? ['categories', 'Danh mục', 'category'] : null,
        isAdmin ? ['support', 'Hỗ trợ', 'support_agent'] : null,
      ].filter(Boolean),
    [isAdmin]
  );

  // Resolve active tab from hash
  const activeTab = useMemo(() => {
    if (tabs.some(([id]) => id === hashTab)) return hashTab;
    return tabs[0]?.[0] || 'products';
  }, [hashTab, tabs]);

  const setActiveTab = useCallback(
    (tabId) => navigate(`/admin#${tabId}`, { replace: true }),
    [navigate]
  );

  // Redirect to valid tab if hash is invalid
  useEffect(() => {
    if (!canManageProducts) return;
    if (hashTab && !tabs.some(([id]) => id === hashTab)) {
      navigate(`/admin#${tabs[0]?.[0] || 'products'}`, { replace: true });
    }
  }, [canManageProducts, hashTab, navigate, tabs]);

  const handleSubmitProduct = async (event) => {
    event.preventDefault();
    return await submitProduct();
  };

  return (
    <div className="flex min-h-[calc(100dvh-56px)] flex-col bg-[#f4f4f2] text-[#171717]">
      {/* Sub-header with stats */}
      <div className="border-b border-[#d7d2c8] bg-[#fdfdfb]">
        <div className="mx-auto flex max-w-[1600px] flex-col gap-4 px-5 py-5 md:flex-row md:items-center md:justify-between md:px-8">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#7f7041]">
              {isAdmin ? 'AuraFit Admin' : 'AuraFit Staff'}
            </p>
            <h1 className="mt-1.5 font-serif text-3xl font-normal italic leading-[1.15] md:text-4xl">
              {isAdmin ? 'Trung tâm quản lý' : 'Khu vực nhân viên'}
            </h1>
          </div>
        </div>
      </div>

      <div className="mx-auto grid w-full max-w-[1600px] flex-1 grid-cols-1 items-start gap-0 md:grid-cols-[220px_1fr]">
        {/* Sidebar navigation with hash links */}
        <aside className="sticky top-14 z-20 h-auto w-full border-r border-[#d7d2c8] bg-[#111111] p-2 text-white md:h-[calc(100vh-56px)] md:overflow-y-auto">
          {tabs.map(([id, label, icon]) => (
            <a
              key={id}
              href={`#${id}`}
              onClick={(event) => {
                event.preventDefault();
                setActiveTab(id);
              }}
              className={`mb-0.5 flex w-full items-center gap-3 px-4 py-3 text-left text-sm transition ${
                activeTab === id ? 'bg-[#7f7041] text-white' : 'text-white/68 hover:bg-white/10 hover:text-white'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">{icon}</span>
              <span>{label}</span>
            </a>
          ))}
        </aside>

        {/* Main content area — 100% width */}
        <main className="min-w-0 flex-1 p-5 md:p-8">
          {activeTab === 'overview' && isAdmin && (
            <AdminOverviewTab 
              productsCount={products?.length || 0} 
              categoriesCount={managedCategories?.length || 0} 
            />
          )}
          {activeTab === 'products' && (
            <AdminProductsSection
              products={products}
              categories={publicCategories}
              isAdmin={isAdmin}
              filteredProducts={filteredProducts}
              productForm={productForm}
              editingProductId={editingProductId}
              productSearch={productSearch}
              productCategoryFilter={productCategoryFilter}
              productStatusFilter={productStatusFilter}
              productMessage={productMessage}
              productError={productError}
              isSavingProduct={isSavingProduct}
              onProductSearchChange={setProductSearch}
              onProductCategoryFilterChange={setProductCategoryFilter}
              onProductStatusFilterChange={setProductStatusFilter}
              onProductFieldChange={handleProductFieldChange}
              onProductImagesChange={handleProductImagesChange}
              onEditProduct={hydrateProductForm}
              onResetProductForm={resetProductForm}
              onSubmitProduct={handleSubmitProduct}
              page={productPage}
              totalPages={productTotalPages}
              totalElements={productTotalElements}
              setPage={setProductPage}
            />
          )}
          {activeTab === 'users' && isAdmin && (
            <AdminUsersSection
              filteredUsers={filteredUsers}
              userSearch={userSearch}
              message={userMessage}
              error={userError}
              isLoading={isUserLoading}
              isCreatingStaff={isCreatingStaff}
              updatingUserId={updatingUserId}
              onUserSearchChange={setUserSearch}
              onCreateStaff={createStaff}
              page={userPage}
              totalPages={userTotalPages}
              totalElements={userTotalElements}
              setPage={setUserPage}
            />
          )}
          {activeTab === 'categories' && isAdmin && (
            <AdminCategoriesSection
              publicCategories={publicCategories}
              categories={managedCategories}
              categoryForm={categoryForm}
              editingCategoryId={editingCategoryId}
              isLoading={isCategoryLoading}
              isSaving={isCategorySaving}
              message={categoryMessage}
              error={categoryError}
              onFieldChange={handleCategoryFieldChange}
              onEdit={hydrateCategoryForm}
              onReset={resetCategoryForm}
              onSubmit={submitCategory}
              onDelete={handleDeleteCategory}
              categorySearch={categorySearch}
              setCategorySearch={setCategorySearch}
              page={categoryPage}
              totalPages={categoryTotalPages}
              totalElements={categoryTotalElements}
              setPage={setCategoryPage}
            />
          )}
          {activeTab === 'support' && isAdmin && <AdminSupportSection />}
        </main>
      </div>
    </div>
  );
}
