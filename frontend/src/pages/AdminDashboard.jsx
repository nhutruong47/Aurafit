import { useEffect, useMemo, useState } from 'react';
import { createCostume, fetchCostumes, updateCostume } from '../services/api';
import { formatCurrency } from '../utils/formatCurrency';

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

const emptyProductForm = {
  name: '',
  description: '',
  imageUrl: '',
  rentalPrice: '',
  depositPrice: '',
  category: 'Cosplay',
  subcategory: '',
  tag: '',
  size: 'Free Size',
  available: true,
};

export default function AdminDashboard({ currentUser, onNavigate }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [products, setProducts] = useState([]);
  const [productForm, setProductForm] = useState(emptyProductForm);
  const [editingProductId, setEditingProductId] = useState(null);
  const [productSearch, setProductSearch] = useState('');
  const [productCategoryFilter, setProductCategoryFilter] = useState('all');
  const [productStatusFilter, setProductStatusFilter] = useState('all');
  const [productMessage, setProductMessage] = useState('');
  const [productError, setProductError] = useState('');
  const [isSavingProduct, setIsSavingProduct] = useState(false);
  const isAdmin = currentUser?.role?.split(',').some((role) => role.trim() === 'ADMIN');

  const ticketCount = useMemo(() => supportTickets.length, []);
  const filteredProducts = useMemo(() => {
    const query = productSearch.trim().toLowerCase();

    return products.filter((product) => {
      const matchesSearch =
        !query ||
        [product.name, product.description, product.subcategory, product.tag]
          .filter(Boolean)
          .some((value) => value.toLowerCase().includes(query));
      const matchesCategory =
        productCategoryFilter === 'all' || product.category === productCategoryFilter;
      const matchesStatus =
        productStatusFilter === 'all' ||
        (productStatusFilter === 'available' && product.available) ||
        (productStatusFilter === 'hidden' && !product.available);

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [products, productSearch, productCategoryFilter, productStatusFilter]);

  useEffect(() => {
    if (!isAdmin) return;

    fetchCostumes()
      .then((data) => setProducts(Array.isArray(data) ? data : []))
      .catch(() => setProductError('Khong the tai danh sach san pham.'));
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
      category: product.category || 'Cosplay',
      subcategory: product.subcategory || '',
      tag: product.tag || '',
      size: product.size || 'Free Size',
      available: product.available ?? true,
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

  const handleSubmitProduct = async (event) => {
    event.preventDefault();
    setIsSavingProduct(true);
    setProductMessage('');
    setProductError('');

    try {
      const payload = {
        ...productForm,
        adminUserId: currentUser.id,
        rentalPrice: Number(productForm.rentalPrice),
        depositPrice: Number(productForm.depositPrice),
      };

      if (editingProductId) {
        const updatedProduct = await updateCostume(editingProductId, payload);
        setProducts((currentProducts) =>
          currentProducts.map((product) => (product.id === updatedProduct.id ? updatedProduct : product))
        );
        setProductMessage('San pham da duoc cap nhat thanh cong.');
      } else {
        const createdProduct = await createCostume(payload);
        setProducts((currentProducts) => [createdProduct, ...currentProducts]);
        setProductMessage('San pham da duoc admin dang tai thanh cong.');
      }

      setEditingProductId(null);
      setProductForm(emptyProductForm);
    } catch (error) {
      setProductError(error.message || 'Khong the luu san pham.');
    } finally {
      setIsSavingProduct(false);
    }
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
          {activeTab === 'overview' && (
            <section>
              <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                {metricCards.map((metric) => (
                  <MetricCard key={metric.label} {...metric} />
                ))}
              </div>
              <Panel title="Luồng quyền hiện tại">
                <div className="grid gap-4 md:grid-cols-3">
                  <RuleCard icon="admin_panel_settings" title="Admin" text="Dang tai, chinh sua va quan ly san pham." />
                  <RuleCard icon="support_agent" title="Lien he" text="Khach hang chi lien he AuraFit Admin." />
                  <RuleCard icon="block" title="Chu xuong" text="Luon lessor/seller/shop-owner da bi tat." />
                </div>
              </Panel>
            </section>
          )}

          {activeTab === 'products' && (
            <section className="grid grid-cols-1 gap-6 xl:grid-cols-[420px_1fr]">
              <Panel title={editingProductId ? 'Sua san pham' : 'Dang san pham'}>
                <form className="space-y-4" onSubmit={handleSubmitProduct}>
                  <AdminField label="Ten san pham" name="name" value={productForm.name} onChange={handleProductFieldChange} />
                  <AdminField label="Mo ta" name="description" value={productForm.description} onChange={handleProductFieldChange} multiline />
                  <AdminField label="Anh san pham URL" name="imageUrl" value={productForm.imageUrl} onChange={handleProductFieldChange} />
                  <div className="grid grid-cols-2 gap-3">
                    <AdminField label="Gia thue" name="rentalPrice" type="number" value={productForm.rentalPrice} onChange={handleProductFieldChange} />
                    <AdminField label="Tien coc" name="depositPrice" type="number" value={productForm.depositPrice} onChange={handleProductFieldChange} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <label className="block">
                      <span className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.16em] text-[#777777]">
                        Category
                      </span>
                      <select
                        name="category"
                        value={productForm.category}
                        onChange={handleProductFieldChange}
                        className="w-full border border-[#d7d2c8] bg-[#fafaf8] px-3 py-3 text-sm outline-none focus:border-[#7f7041]"
                      >
                        <option>Cosplay</option>
                        <option>Events</option>
                        <option>Yearbook</option>
                        <option>Accessories</option>
                      </select>
                    </label>
                    <AdminField label="Size" name="size" value={productForm.size} onChange={handleProductFieldChange} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <AdminField label="Subcategory" name="subcategory" value={productForm.subcategory} onChange={handleProductFieldChange} />
                    <AdminField label="Tag" name="tag" value={productForm.tag} onChange={handleProductFieldChange} />
                  </div>
                  <label className="flex items-center gap-3 border border-[#ebe7df] bg-[#fafaf8] p-3 text-sm">
                    <input
                      type="checkbox"
                      name="available"
                      checked={productForm.available}
                      onChange={handleProductFieldChange}
                      className="h-4 w-4 accent-[#7f7041]"
                    />
                    San pham dang co san
                  </label>

                  {productMessage && <p className="border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">{productMessage}</p>}
                  {productError && <p className="border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{productError}</p>}

                  <button
                    disabled={isSavingProduct}
                    className="w-full bg-black py-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-[#7f7041] disabled:bg-[#777777]"
                  >
                    {isSavingProduct ? 'Dang luu...' : editingProductId ? 'Cap nhat san pham' : 'Dang tai san pham'}
                  </button>
                  {editingProductId && (
                    <button
                      type="button"
                      onClick={resetProductForm}
                      className="w-full border border-[#d7d2c8] py-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#5f5e5e] transition hover:border-black hover:text-black"
                    >
                      Huy sua
                    </button>
                  )}
                </form>
              </Panel>

              <Panel title="Kho san pham" action={`${filteredProducts.length}/${products.length} san pham`}>
                <div className="mb-5 grid gap-3 lg:grid-cols-[1fr_180px_160px]">
                  <label className="relative block">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-[#999999]">
                      search
                    </span>
                    <input
                      value={productSearch}
                      onChange={(event) => setProductSearch(event.target.value)}
                      placeholder="Tim theo ten, mo ta, tag..."
                      className="w-full border border-[#d7d2c8] bg-[#fafaf8] py-3 pl-10 pr-3 text-sm outline-none focus:border-[#7f7041]"
                    />
                  </label>
                  <select
                    value={productCategoryFilter}
                    onChange={(event) => setProductCategoryFilter(event.target.value)}
                    className="w-full border border-[#d7d2c8] bg-[#fafaf8] px-3 py-3 text-sm outline-none focus:border-[#7f7041]"
                  >
                    <option value="all">Tat ca category</option>
                    <option value="Cosplay">Cosplay</option>
                    <option value="Events">Events</option>
                    <option value="Yearbook">Yearbook</option>
                    <option value="Accessories">Accessories</option>
                  </select>
                  <select
                    value={productStatusFilter}
                    onChange={(event) => setProductStatusFilter(event.target.value)}
                    className="w-full border border-[#d7d2c8] bg-[#fafaf8] px-3 py-3 text-sm outline-none focus:border-[#7f7041]"
                  >
                    <option value="all">Tat ca trang thai</option>
                    <option value="available">Dang hien</option>
                    <option value="hidden">Tam an</option>
                  </select>
                </div>
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                  {filteredProducts.slice(0, 24).map((product) => (
                    <article key={product.id} className="grid grid-cols-[88px_1fr] gap-4 border border-[#ebe7df] bg-[#fafaf8] p-3">
                      <div className="aspect-[3/4] overflow-hidden bg-[#eeeeee]">
                        {product.imageUrl ? (
                          <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full items-center justify-center text-[#999999]">
                            <span className="material-symbols-outlined">image</span>
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#7f7041]">
                          {product.category || 'Costume'}
                        </p>
                        <h3 className="mt-1 line-clamp-2 font-serif text-xl italic">{product.name}</h3>
                        <p className="mt-2 text-xs text-[#5f5e5e]">
                          Gia thue: <strong>{formatCurrency(product.rentalPrice || 0)}</strong>
                        </p>
                        <p className="mt-1 text-xs text-[#5f5e5e]">
                          Trang thai: <strong>{product.available ? 'Dang ban/thue' : 'Tam an'}</strong>
                        </p>
                        <button
                          onClick={() => hydrateProductForm(product)}
                          className="mt-3 border border-black px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.16em] transition hover:bg-black hover:text-white"
                        >
                          Sua san pham
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
                {filteredProducts.length === 0 && (
                  <p className="border border-[#ebe7df] bg-[#fafaf8] p-6 text-sm text-[#5f5e5e]">
                    Khong co san pham nao khop bo loc hien tai.
                  </p>
                )}
              </Panel>
            </section>
          )}

          {activeTab === 'support' && (
            <Panel title="Ho tro khach hang" action={`${supportTickets.length} ticket`}>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-[#d7d2c8] text-[11px] uppercase tracking-[0.16em] text-[#777777]">
                      <th className="py-3 pr-4 font-semibold">Ticket</th>
                      <th className="py-3 pr-4 font-semibold">Khach hang</th>
                      <th className="py-3 pr-4 font-semibold">Noi dung</th>
                      <th className="py-3 pr-4 font-semibold">Kenh</th>
                      <th className="py-3 pr-4 font-semibold">Phu trach</th>
                    </tr>
                  </thead>
                  <tbody>
                    {supportTickets.map((ticket) => (
                      <tr key={ticket.id} className="border-b border-[#ebe7df]">
                        <td className="py-4 pr-4 font-mono text-xs text-[#7f7041]">{ticket.id}</td>
                        <td className="py-4 pr-4 font-medium">{ticket.customer}</td>
                        <td className="py-4 pr-4">{ticket.subject}</td>
                        <td className="py-4 pr-4">{ticket.channel}</td>
                        <td className="py-4 pr-4">{ticket.owner}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Panel>
          )}

          {activeTab === 'reports' && (
            <Panel title="Bao cao nhanh">
              <div className="space-y-4">
                {[
                  ['Ty le don hoan tat', '84.7%', '+3.2% so voi tuan truoc'],
                  ['Thoi gian phan hoi admin', '11 phut', 'muc tieu duoi 15 phut'],
                  ['San pham con hang', `${products.filter((product) => product.available).length}`, 'cap nhat tu database'],
                ].map(([label, value, note]) => (
                  <div key={label} className="flex items-end justify-between border-b border-[#ebe7df] pb-4">
                    <div>
                      <p className="text-sm font-medium">{label}</p>
                      <p className="mt-1 text-xs text-[#777777]">{note}</p>
                    </div>
                    <p className="font-serif text-3xl italic">{value}</p>
                  </div>
                ))}
              </div>
            </Panel>
          )}
        </main>
      </div>
    </div>
  );
}

function AdminField({ label, name, value, onChange, type = 'text', multiline = false }) {
  return (
    <label className="block">
      <span className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.16em] text-[#777777]">{label}</span>
      {multiline ? (
        <textarea
          name={name}
          value={value}
          onChange={onChange}
          className="min-h-24 w-full resize-none border border-[#d7d2c8] bg-[#fafaf8] px-3 py-3 text-sm outline-none focus:border-[#7f7041]"
        />
      ) : (
        <input
          name={name}
          value={value}
          onChange={onChange}
          type={type}
          required={['name', 'rentalPrice', 'depositPrice'].includes(name)}
          className="w-full border border-[#d7d2c8] bg-[#fafaf8] px-3 py-3 text-sm outline-none focus:border-[#7f7041]"
        />
      )}
    </label>
  );
}

function MetricCard({ label, value, delta }) {
  return (
    <article className="border border-[#d7d2c8] bg-[#fdfdfb] p-6">
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#777777]">{label}</p>
      <p className="mt-5 font-serif text-5xl italic leading-none text-black">{value}</p>
      <p className="mt-4 text-sm text-[#5f5e5e]">{delta}</p>
    </article>
  );
}

function RuleCard({ icon, title, text }) {
  return (
    <div className="border border-[#ebe7df] bg-[#fafaf8] p-5">
      <span className="material-symbols-outlined text-[#7f7041]">{icon}</span>
      <p className="mt-4 text-sm font-semibold">{title}</p>
      <p className="mt-2 text-sm leading-6 text-[#5f5e5e]">{text}</p>
    </div>
  );
}

function Panel({ title, action, children }) {
  return (
    <section className="border border-[#d7d2c8] bg-[#fdfdfb] p-6">
      <div className="mb-6 flex items-center justify-between gap-4">
        <h2 className="font-serif text-3xl italic">{title}</h2>
        {action && <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#777777]">{action}</p>}
      </div>
      {children}
    </section>
  );
}

function StatusBadge({ label, tone = 'default' }) {
  const toneClass =
    tone === 'good'
      ? 'border-green-200 bg-green-50 text-green-700'
      : tone === 'warning'
        ? 'border-[#e5d7a8] bg-[#fbf7e8] text-[#7f7041]'
        : 'border-[#d7d2c8] bg-white text-[#5f5e5e]';

  return (
    <span className={`inline-flex w-fit border px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] ${toneClass}`}>
      {label}
    </span>
  );
}
