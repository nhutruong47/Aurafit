import { useMemo, useState } from 'react';
import AdminOverviewSection from '../components/admin/AdminOverviewSection';
import AdminProductsSection from '../components/admin/AdminProductsSection';
import AdminReportsSection from '../components/admin/AdminReportsSection';
import { StatusBadge } from '../components/admin/AdminDashboardShared';
import AdminSupportSection from '../components/admin/AdminSupportSection';
import { useAdminCostumes } from '../hooks/useAdminCostumes';

const supportTickets = [
  { id: 'SP-2198', customer: 'Minh Anh', subject: 'Chua nhan hoan coc', channel: 'Chat', status: 'Dang xu ly', owner: 'Admin' },
  { id: 'SP-2187', customer: 'Quoc Huy', subject: 'Muon doi lich nhan do', channel: 'Hotline', status: 'Moi', owner: 'Admin' },
  { id: 'SP-2172', customer: 'Bao Tran', subject: 'Loi thanh toan banking', channel: 'Email', status: 'Da phan hoi', owner: 'Admin' },
];

const metricCards = [
  { label: 'Don dang xu ly', value: '47', delta: '+8 hom nay' },
  { label: 'Doanh thu hom nay', value: '18.6M', delta: '+12.4%' },
  { label: 'Ticket mo', value: '11', delta: '3 uu tien cao' },
  { label: 'San pham active', value: '180', delta: 'admin quan ly' },
];

export default function AdminDashboardPage({ currentUser, onNavigate }) {
  const [activeTab, setActiveTab] = useState('overview');
  const {
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
  } = useAdminCostumes(currentUser);

  const ticketCount = useMemo(() => supportTickets.length, []);

  const handleSubmitProduct = async (event) => {
    event.preventDefault();
    await submitProduct();
  };

  if (!isAdmin) {
    return (
      <div className="bg-[#f4f4f2] text-[#171717]">
        <section className="mx-auto min-h-[calc(100dvh-80px)] max-w-[900px] px-5 py-20 md:px-20">
          <p className="mb-5 text-[11px] font-semibold uppercase tracking-[0.3em] text-[#7f7041]">Admin</p>
          <h1 className="font-serif text-[46px] font-normal italic leading-tight md:text-[70px]">
            Can tai khoan ADMIN de truy cap.
          </h1>
          <p className="mt-6 max-w-xl text-base leading-8 text-[#5f5e5e]">
            Chi admin moi co quyen dang tai va quan ly san pham tren AuraFit.
          </p>
          <button
            onClick={() => onNavigate?.('account')}
            className="mt-9 bg-black px-8 py-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-[#7f7041]"
          >
            Dang nhap admin
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
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#7f7041]">AuraFit Admin</p>
            <h1 className="mt-2 font-serif text-4xl font-normal italic leading-[1.15] md:text-5xl">
              Trung tam quan ly san pham va van hanh
            </h1>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm md:flex md:items-center">
            <StatusBadge label={`${ticketCount} ticket`} tone="warning" />
            <StatusBadge label={`${products.length} san pham`} tone="good" />
            <StatusBadge label="Admin only publish" tone="default" />
          </div>
        </div>
      </div>

      <div className="mx-auto grid max-w-[1500px] grid-cols-1 gap-8 px-5 py-8 md:px-10 xl:grid-cols-[240px_1fr]">
        <aside className="h-fit border border-[#d7d2c8] bg-[#111111] p-3 text-white">
          {[
            ['overview', 'Tong quan', 'dashboard'],
            ['products', 'San pham', 'inventory_2'],
            ['support', 'Ho tro', 'support_agent'],
            ['reports', 'Bao cao', 'monitoring'],
          ].map(([id, label, icon]) => (
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
          {activeTab === 'overview' && <AdminOverviewSection metricCards={metricCards} />}
          {activeTab === 'products' && (
            <AdminProductsSection
              products={products}
              categories={categories}
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
          {activeTab === 'support' && <AdminSupportSection supportTickets={supportTickets} />}
          {activeTab === 'reports' && (
            <AdminReportsSection availableProductCount={products.filter((product) => product.status === 'ACTIVE').length} />
          )}
        </main>
      </div>
    </div>
  );
}
