import { useEffect, useMemo, useState } from 'react';
import AdminCategoriesSection from '../components/admin/AdminCategoriesSection';
import AdminOverviewSection from '../components/admin/AdminOverviewSection';
import AdminProductsSection from '../components/admin/AdminProductsSection';
import AdminReportsSection from '../components/admin/AdminReportsSection';
import { StatusBadge } from '../components/admin/AdminDashboardShared';
import AdminSupportSection from '../components/admin/AdminSupportSection';
import AdminUsersSection from '../components/admin/AdminUsersSection';
import { useAdminCategories } from '../hooks/useAdminCategories';
import { useAdminCostumes } from '../hooks/useAdminCostumes';
import { useAdminUsers } from '../hooks/useAdminUsers';
import { useRecommendationAnalytics } from '../hooks/useRecommendationAnalytics';

const supportTickets = [
  { id: 'SP-2198', customer: 'Minh Anh', subject: 'Chưa nhận hoàn cọc', channel: 'Chat', status: 'Đang xử lý', owner: 'Admin' },
  { id: 'SP-2187', customer: 'Quốc Huy', subject: 'Muốn đổi lịch nhận đồ', channel: 'Hotline', status: 'Mới', owner: 'Admin' },
  { id: 'SP-2172', customer: 'Bảo Trân', subject: 'Lỗi thanh toán chuyển khoản', channel: 'Email', status: 'Đã phản hồi', owner: 'Admin' },
];

export default function AdminDashboardPage({ currentUser, onNavigate }) {
  const [activeTab, setActiveTab] = useState('overview');

  const {
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
  } = useAdminCostumes(currentUser);

  const {
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
    users,
    filteredUsers,
    userSearch,
    message: userMessage,
    error: userError,
    isLoading: isUserLoading,
    isCreatingStaff,
    updatingUserId,
    setUserSearch,
    setSellerPermission,
    createStaff,
  } = useAdminUsers(currentUser);

  const {
    analytics,
    periodDays,
    isLoading: isAnalyticsLoading,
    error: analyticsError,
    setPeriodDays,
  } = useRecommendationAnalytics(currentUser);

  const ticketCount = useMemo(() => supportTickets.length, []);
  const tabs = useMemo(
    () =>
      [
        isAdmin ? ['overview', 'Tổng quan', 'dashboard'] : null,
        ['products', 'Sản phẩm', 'inventory_2'],
        isAdmin ? ['users', 'Tài khoản bán', 'manage_accounts'] : null,
        isAdmin ? ['categories', 'Danh mục', 'category'] : null,
        isAdmin ? ['support', 'Hỗ trợ', 'support_agent'] : null,
        isAdmin ? ['reports', 'Báo cáo', 'monitoring'] : null,
      ].filter(Boolean),
    [isAdmin]
  );

  useEffect(() => {
    if (!canManageProducts) return;
    if (!tabs.some(([id]) => id === activeTab)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setActiveTab(tabs[0]?.[0] || 'products');
    }
  }, [activeTab, canManageProducts, tabs]);

  const metricCards = useMemo(() => {
    if (!analytics?.overview || !analytics?.aiStylist) {
      return [
        { label: 'Đơn đang xử lý', value: '47', delta: '+8 hôm nay' },
        { label: 'Recommendation CTR', value: '--', delta: 'Đang chờ dữ liệu' },
        { label: 'AI Stylist session', value: '--', delta: 'Đang chờ dữ liệu' },
        { label: 'Sản phẩm đang hiển thị', value: `${products.length}`, delta: 'Admin quản lý' },
      ];
    }

    return [
      {
        label: 'Recommendation CTR',
        value: `${Number(analytics.overview.recommendationCtr || 0).toFixed(2)}%`,
        delta: `${analytics.overview.recommendationClicks} click / ${analytics.overview.recommendationImpressions} impression`,
      },
      {
        label: 'AI Stylist session',
        value: `${analytics.aiStylist.sessionsStarted}`,
        delta: `${analytics.aiStylist.userMessages} tin nhắn người dùng`,
      },
      {
        label: 'Rent từ AI Stylist',
        value: `${analytics.aiStylist.attributedRents}`,
        delta: `${analytics.aiStylist.attributedAddToCarts} add-to-cart có attribution`,
      },
      {
        label: 'Sản phẩm đang hiển thị',
        value: `${products.length}`,
        delta: `${managedCategories.length} danh mục đang hoạt động`,
      },
    ];
  }, [analytics, managedCategories.length, products.length]);

  const handleSubmitProduct = async (event) => {
    event.preventDefault();
    await submitProduct();
  };

  if (!canManageProducts) {
    return (
      <div className="bg-[#f4f4f2] text-[#171717]">
        <section className="mx-auto min-h-[calc(100dvh-80px)] max-w-[900px] px-5 py-20 md:px-20">
          <p className="mb-5 text-[11px] font-semibold uppercase tracking-[0.3em] text-[#7f7041]">Quyền cho thuê</p>
          <h1 className="font-serif text-[46px] font-normal italic leading-tight md:text-[70px]">
            Cần được Admin cấp quyền SELLER.
          </h1>
          <p className="mt-6 max-w-xl text-base leading-8 text-[#5f5e5e]">
            Tài khoản chưa được cấp quyền chỉ có thể đi thuê sản phẩm. Sau khi Admin cấp quyền SELLER, tài khoản mới
            được đăng đồ lên AuraFit để cho thuê.
          </p>
          <button
            onClick={() => onNavigate?.('account')}
            className="mt-9 bg-black px-8 py-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-[#7f7041]"
          >
            Về tài khoản
          </button>
        </section>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100dvh-80px)] bg-[#f4f4f2] text-[#171717]">
      <div className="border-b border-[#d7d2c8] bg-[#fdfdfb]">
        <div className="mx-auto flex max-w-[1500px] flex-col gap-5 px-5 py-6 md:flex-row md:items-center md:justify-between md:px-10">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#7f7041]">
              {isAdmin ? 'AuraFit Admin' : 'AuraFit Seller'}
            </p>
            <h1 className="mt-2 font-serif text-4xl font-normal italic leading-[1.15] md:text-5xl">
              {isAdmin ? 'Trung tâm quản lý sản phẩm và vận hành' : 'Khu đăng sản phẩm cho thuê'}
            </h1>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm md:flex md:items-center">
            {isAdmin && <StatusBadge label={`${ticketCount} yêu cầu`} tone="warning" />}
            <StatusBadge label={`${products.length} sản phẩm`} tone="good" />
            {isAdmin && <StatusBadge label={`${users.length} tài khoản`} tone="default" />}
            {isAdmin && <StatusBadge label={`${managedCategories.length} danh mục`} tone="default" />}
          </div>
        </div>
      </div>

      <div className="mx-auto grid max-w-[1500px] grid-cols-1 gap-8 px-5 py-8 md:px-10 xl:grid-cols-[240px_1fr]">
        <aside className="h-fit border border-[#d7d2c8] bg-[#111111] p-3 text-white">
          {tabs.map(([id, label, icon]) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`mb-1 flex w-full items-center gap-3 px-4 py-3 text-left text-sm transition ${
                activeTab === id ? 'bg-[#7f7041] text-white' : 'text-white/68 hover:bg-white/10 hover:text-white'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">{icon}</span>
              <span>{label}</span>
            </button>
          ))}
        </aside>

        <main>
          {activeTab === 'overview' && isAdmin && <AdminOverviewSection metricCards={metricCards} />}
          {activeTab === 'products' && (
            <AdminProductsSection
              products={products}
              categories={categories}
              sellerUsers={sellerUsers}
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
              onProductImageUploaded={handleProductImageUploaded}
              onEditProduct={hydrateProductForm}
              onResetProductForm={resetProductForm}
              onSubmitProduct={handleSubmitProduct}
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
              onSellerPermissionChange={setSellerPermission}
              onCreateStaff={createStaff}
            />
          )}
          {activeTab === 'categories' && isAdmin && (
            <AdminCategoriesSection
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
            />
          )}
          {activeTab === 'support' && isAdmin && <AdminSupportSection supportTickets={supportTickets} />}
          {activeTab === 'reports' && isAdmin && (
            <AdminReportsSection
              analytics={analytics}
              isLoading={isAnalyticsLoading}
              error={analyticsError}
              periodDays={periodDays}
              onPeriodDaysChange={setPeriodDays}
            />
          )}
        </main>
      </div>
    </div>
  );
}
