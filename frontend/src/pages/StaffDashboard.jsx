import { useEffect, useMemo, useState } from 'react';
import {
  createPickupHandover,
  createReturnHandover,
  fetchStaffOrder,
  fetchStaffOrders,
} from '../services/api';
import { formatCurrency } from '../utils/formatCurrency';

const returnStatuses = [
  { value: 'RETURNED', label: 'Binh thuong', tone: 'text-[#087b3f]' },
  { value: 'DAMAGED', label: 'Hu hong', tone: 'text-[#a15c00]' },
  { value: 'LOST', label: 'Bi mat', tone: 'text-[#ba1a1a]' },
];

const statusTone = {
  PENDING_PAYMENT: 'border-[#a15c00]/30 bg-[#fff7df] text-[#7a4d00]',
  PENDING_CONFIRMATION: 'border-[#99854e]/30 bg-[#f8f4e8] text-[#725f2f]',
  PICKED_UP: 'border-[#1c6b9a]/30 bg-[#e8f4fb] text-[#165276]',
  RETURNED: 'border-[#087b3f]/30 bg-[#e8f7ee] text-[#087b3f]',
};

export default function StaffDashboard({ currentUser, onNavigate }) {
  const [orders, setOrders] = useState([]);
  const [activeOrderId, setActiveOrderId] = useState(null);
  const [activeOrder, setActiveOrder] = useState(null);
  const [mode, setMode] = useState('PICKUP');
  const [selectedDetailId, setSelectedDetailId] = useState('');
  const [returnStatus, setReturnStatus] = useState('RETURNED');
  const [handoverImageUrl, setHandoverImageUrl] = useState('');
  const [note, setNote] = useState('');
  const [previewImage, setPreviewImage] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const roles = currentUser?.role?.split(',').map((role) => role.trim()) || [];
  const canUseStaffTools = roles.includes('STAFF') || roles.includes('ADMIN');

  const selectedDetail = useMemo(
    () => activeOrder?.details?.find((detail) => String(detail.id) === String(selectedDetailId)),
    [activeOrder, selectedDetailId]
  );

  const activeTotals = useMemo(() => {
    const totalOrders = orders.length;
    const pickedUp = orders.filter((order) => order.status === 'PICKED_UP').length;
    const returned = orders.filter((order) => order.status === 'RETURNED').length;
    const waiting = orders.filter((order) => order.status === 'PENDING_CONFIRMATION').length;
    return { totalOrders, pickedUp, returned, waiting };
  }, [orders]);

  const loadOrders = async (preferredOrderId = null) => {
    const orderList = await fetchStaffOrders();
    setOrders(orderList);
    const nextOrderId = preferredOrderId || activeOrderId || orderList[0]?.id || null;
    setActiveOrderId(nextOrderId);
    if (nextOrderId) {
      const order = await fetchStaffOrder(nextOrderId);
      setActiveOrder(order);
      setSelectedDetailId(order.details?.[0]?.id || '');
    } else {
      setActiveOrder(null);
      setSelectedDetailId('');
    }
  };

  useEffect(() => {
    if (!canUseStaffTools) {
      setIsLoading(false);
      return;
    }

    let mounted = true;
    setIsLoading(true);
    setError('');

    fetchStaffOrders()
      .then(async (orderList) => {
        if (!mounted) return;
        setOrders(orderList);
        const firstOrderId = orderList[0]?.id || null;
        setActiveOrderId(firstOrderId);
        if (firstOrderId) {
          const order = await fetchStaffOrder(firstOrderId);
          if (!mounted) return;
          setActiveOrder(order);
          setSelectedDetailId(order.details?.[0]?.id || '');
        }
      })
      .catch((loadError) => setError(loadError.message || 'Khong the tai danh sach don.'))
      .finally(() => mounted && setIsLoading(false));

    return () => {
      mounted = false;
    };
  }, [canUseStaffTools]);

  const openOrder = async (orderId) => {
    setActiveOrderId(orderId);
    setError('');
    setMessage('');
    try {
      const order = await fetchStaffOrder(orderId);
      setActiveOrder(order);
      setSelectedDetailId(order.details?.[0]?.id || '');
    } catch (loadError) {
      setError(loadError.message || 'Khong the tai chi tiet don.');
    }
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => setHandoverImageUrl(String(reader.result || ''));
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!activeOrder || !selectedDetailId) return;

    setIsSubmitting(true);
    setError('');
    setMessage('');

    const payload = {
      staffUserId: currentUser.id,
      rentalOrderDetailId: Number(selectedDetailId),
      handoverImageUrl,
      note,
      returnStatus: mode === 'RETURN' ? returnStatus : null,
    };

    try {
      const updatedOrder =
        mode === 'PICKUP'
          ? await createPickupHandover(activeOrder.id, payload)
          : await createReturnHandover(activeOrder.id, payload);

      setActiveOrder(updatedOrder);
      setSelectedDetailId(updatedOrder.details?.[0]?.id || '');
      setHandoverImageUrl('');
      setNote('');
      setMessage(mode === 'PICKUP' ? 'Da tao bien ban ban giao PICKUP.' : 'Da ghi nhan khach tra do.');
      await loadOrders(updatedOrder.id);
    } catch (submitError) {
      setError(submitError.message || 'Khong the luu bien ban.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!currentUser || !canUseStaffTools) {
    return (
      <section className="mx-auto flex min-h-[calc(100dvh-80px)] max-w-[900px] flex-col justify-center px-5 py-16 text-[#1a1c1c] md:px-20">
        <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#99854e]">Staff Area</p>
        <h1 className="font-serif text-[44px] font-normal italic leading-[1.12] md:text-[64px]">Can tai khoan staff.</h1>
        <p className="mt-6 text-base leading-7 text-[#5f5e5e]">
          Dang nhap bang tai khoan staff demo de xu ly ban giao va nhan tra trang phuc.
        </p>
        <button
          onClick={() => onNavigate?.('account')}
          className="mt-8 w-fit border border-black px-8 py-4 text-[11px] font-semibold uppercase tracking-[0.18em] transition hover:bg-black hover:text-white"
        >
          Dang nhap
        </button>
      </section>
    );
  }

  return (
    <div className="min-h-[calc(100dvh-80px)] bg-[#f3f3f4] text-[#1a1c1c]">
      <div className="mx-auto max-w-[1500px] px-5 py-10 md:px-10">
        <header className="mb-8 flex flex-col justify-between gap-5 border-b border-[#cfc4c5] pb-8 lg:flex-row lg:items-end">
          <div>
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.28em] text-[#99854e]">AuraFit Staff</p>
            <h1 className="font-serif text-[42px] font-normal italic leading-[1.12] md:text-[62px]">Ban giao va nhan tra do</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[#5f5e5e]">
              Xu ly PICKUP, RETURN, anh ban giao va tinh trang RETURNED, DAMAGED, LOST cho tung trang phuc.
            </p>
          </div>
          <button
            onClick={() => loadOrders(activeOrderId)}
            className="w-fit border border-black px-6 py-4 text-[11px] font-semibold uppercase tracking-[0.18em] transition hover:bg-black hover:text-white"
          >
            Tai lai
          </button>
        </header>

        <section className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Metric label="Tong don" value={activeTotals.totalOrders} icon="inventory_2" />
          <Metric label="Cho xac nhan" value={activeTotals.waiting} icon="hourglass_top" />
          <Metric label="Da ban giao" value={activeTotals.pickedUp} icon="assignment_turned_in" />
          <Metric label="Da tra" value={activeTotals.returned} icon="undo" />
        </section>

        {error && <Alert tone="error" text={error} />}
        {message && <Alert tone="success" text={message} />}

        {isLoading ? (
          <div className="grid gap-4 lg:grid-cols-12">
            <Skeleton className="h-[560px] lg:col-span-3" />
            <Skeleton className="h-[560px] lg:col-span-6" />
            <Skeleton className="h-[560px] lg:col-span-3" />
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-12">
            <aside className="border border-[#cfc4c5] bg-white lg:col-span-3">
              <div className="border-b border-[#cfc4c5] px-5 py-4">
                <h2 className="text-[11px] font-semibold uppercase tracking-[0.2em]">Danh sach don thue</h2>
              </div>
              <div className="max-h-[680px] divide-y divide-[#e1dddc] overflow-auto">
                {orders.map((order) => (
                  <button
                    key={order.id}
                    onClick={() => openOrder(order.id)}
                    className={`w-full px-5 py-5 text-left transition hover:bg-[#f8f4e8] ${
                      order.id === activeOrderId ? 'bg-[#f8f4e8]' : 'bg-white'
                    }`}
                  >
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <span className="text-[11px] font-semibold uppercase tracking-[0.16em]">RO-{String(order.id).padStart(4, '0')}</span>
                      <StatusBadge status={order.status} />
                    </div>
                    <p className="font-medium">{order.customerName}</p>
                    <p className="mt-1 truncate text-sm text-[#5f5e5e]">{order.details?.[0]?.costumeName || 'Chua co trang phuc'}</p>
                  </button>
                ))}
              </div>
            </aside>

            <main className="space-y-4 lg:col-span-6">
              {activeOrder ? (
                <>
                  <section className="border border-[#cfc4c5] bg-white p-5 md:p-6">
                    <div className="mb-6 flex flex-col justify-between gap-4 border-b border-[#e1dddc] pb-5 md:flex-row md:items-start">
                      <div>
                        <div className="mb-2 flex items-center gap-3">
                          <h2 className="font-serif text-3xl italic">RO-{String(activeOrder.id).padStart(4, '0')}</h2>
                          <StatusBadge status={activeOrder.status} />
                        </div>
                        <p className="text-sm text-[#5f5e5e]">
                          {activeOrder.customerName} | {activeOrder.customerEmail} | {activeOrder.customerPhone}
                        </p>
                      </div>
                      <div className="text-sm md:text-right">
                        <p>Phi thue: <strong>{formatCurrency(activeOrder.totalRentalFee || 0)}</strong></p>
                        <p>Coc: <strong>{formatCurrency(activeOrder.totalDeposit || 0)}</strong></p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {activeOrder.details?.map((detail) => (
                        <article
                          key={detail.id}
                          className={`grid gap-4 border p-4 md:grid-cols-[112px_1fr] ${
                            String(selectedDetailId) === String(detail.id) ? 'border-[#99854e] bg-[#f8f4e8]' : 'border-[#e1dddc]'
                          }`}
                        >
                          <button onClick={() => setSelectedDetailId(detail.id)} className="aspect-[3/4] overflow-hidden bg-[#eeeeee]">
                            <img src={detail.costumeImageUrl} alt={detail.costumeName} className="h-full w-full object-cover" />
                          </button>
                          <div className="flex flex-col justify-between gap-4">
                            <div>
                              <button onClick={() => setSelectedDetailId(detail.id)} className="text-left font-serif text-2xl italic">
                                {detail.costumeName}
                              </button>
                              <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#5f5e5e]">
                                {detail.skuCode} | Size {detail.size}
                              </p>
                            </div>
                            <div className="grid grid-cols-2 gap-3 text-sm">
                              <SmallFact label="Item" value={detail.itemStatus} />
                              <SmallFact label="Tra do" value={detail.returnStatus || 'Chua tra'} />
                              <SmallFact label="Phi thue" value={formatCurrency(detail.rentalPrice || 0)} />
                              <SmallFact label="Tien coc" value={formatCurrency(detail.depositPrice || 0)} />
                            </div>
                          </div>
                        </article>
                      ))}
                    </div>
                  </section>

                  <section className="border border-[#cfc4c5] bg-white">
                    <div className="border-b border-[#cfc4c5] px-5 py-4">
                      <h2 className="text-[11px] font-semibold uppercase tracking-[0.2em]">Lich su anh va ghi chu</h2>
                    </div>
                    <div className="divide-y divide-[#e1dddc]">
                      {activeOrder.handovers?.length ? (
                        activeOrder.handovers.map((handover) => (
                          <article key={handover.id} className="grid gap-4 p-5 md:grid-cols-[104px_1fr]">
                            <button onClick={() => setPreviewImage(handover.handoverImageUrl)} className="aspect-square overflow-hidden bg-[#eeeeee]">
                              <img src={handover.handoverImageUrl} alt={handover.costumeName} className="h-full w-full object-cover" />
                            </button>
                            <div>
                              <div className="mb-2 flex flex-wrap items-center gap-2">
                                <span className="border border-black px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.16em]">
                                  {handover.type}
                                </span>
                                {handover.returnStatus && <StatusBadge status={handover.returnStatus} />}
                                <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#999999]">
                                  {new Date(handover.createdAt).toLocaleString('vi-VN')}
                                </span>
                              </div>
                              <p className="font-medium">{handover.costumeName}</p>
                              <p className="mt-1 text-sm text-[#5f5e5e]">
                                {handover.skuCode} | Staff: {handover.staffName}
                              </p>
                              {handover.note && <p className="mt-3 text-sm leading-6">{handover.note}</p>}
                            </div>
                          </article>
                        ))
                      ) : (
                        <p className="p-5 text-sm text-[#5f5e5e]">Chua co anh ban giao hoac anh tra do.</p>
                      )}
                    </div>
                  </section>
                </>
              ) : (
                <div className="border border-[#cfc4c5] bg-white p-10 text-center text-[#5f5e5e]">Chua co don thue.</div>
              )}
            </main>

            <aside className="border border-[#cfc4c5] bg-white p-5 lg:col-span-3">
              <h2 className="mb-5 text-[11px] font-semibold uppercase tracking-[0.2em]">Tao bien ban</h2>
              <form className="space-y-5" onSubmit={handleSubmit}>
                <div className="grid grid-cols-2 border border-[#cfc4c5] bg-[#f3f3f4] p-1">
                  {['PICKUP', 'RETURN'].map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setMode(value)}
                      className={`px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.16em] ${
                        mode === value ? 'bg-black text-white' : 'text-[#5f5e5e]'
                      }`}
                    >
                      {value}
                    </button>
                  ))}
                </div>

                <Field label="Trang phuc">
                  <select
                    value={selectedDetailId}
                    onChange={(event) => setSelectedDetailId(event.target.value)}
                    className="w-full border border-[#cfc4c5] bg-[#f9f9f9] px-3 py-3 text-sm outline-none focus:border-[#99854e]"
                    required
                  >
                    {activeOrder?.details?.map((detail) => (
                      <option key={detail.id} value={detail.id}>
                        {detail.costumeName} | {detail.skuCode}
                      </option>
                    ))}
                  </select>
                </Field>

                {selectedDetail && (
                  <div className="border border-[#e1dddc] bg-[#f9f9f9] p-3 text-sm">
                    <p className="font-medium">{selectedDetail.costumeName}</p>
                    <p className="mt-1 text-[#5f5e5e]">{selectedDetail.skuCode} | Item {selectedDetail.itemStatus}</p>
                  </div>
                )}

                {mode === 'RETURN' && (
                  <Field label="Tinh trang tra">
                    <div className="space-y-2">
                      {returnStatuses.map((status) => (
                        <label key={status.value} className="flex cursor-pointer items-center justify-between border border-[#cfc4c5] px-3 py-3">
                          <span className={`text-[11px] font-semibold uppercase tracking-[0.16em] ${status.tone}`}>{status.label}</span>
                          <input
                            checked={returnStatus === status.value}
                            onChange={() => setReturnStatus(status.value)}
                            type="radio"
                            name="returnStatus"
                          />
                        </label>
                      ))}
                    </div>
                  </Field>
                )}

                <Field label="Anh ban giao">
                  <input
                    value={handoverImageUrl.startsWith('data:') ? '' : handoverImageUrl}
                    onChange={(event) => setHandoverImageUrl(event.target.value)}
                    placeholder="https://..."
                    className="mb-3 w-full border border-[#cfc4c5] bg-[#f9f9f9] px-3 py-3 text-sm outline-none focus:border-[#99854e]"
                    type="url"
                  />
                  <input
                    onChange={handleFileChange}
                    className="block w-full text-sm file:mr-3 file:border-0 file:bg-black file:px-4 file:py-3 file:text-[10px] file:font-semibold file:uppercase file:tracking-[0.14em] file:text-white"
                    type="file"
                    accept="image/*"
                  />
                  {handoverImageUrl && (
                    <button
                      type="button"
                      onClick={() => setPreviewImage(handoverImageUrl)}
                      className="mt-3 aspect-[4/3] w-full overflow-hidden border border-[#cfc4c5] bg-[#eeeeee]"
                    >
                      <img src={handoverImageUrl} alt="Preview" className="h-full w-full object-cover" />
                    </button>
                  )}
                </Field>

                <Field label="Ghi chu">
                  <textarea
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                    className="min-h-28 w-full border border-[#cfc4c5] bg-[#f9f9f9] px-3 py-3 text-sm outline-none focus:border-[#99854e]"
                    placeholder="Kiem tra tinh trang, phu kien, vet hong neu co..."
                  />
                </Field>

                <button
                  disabled={isSubmitting || !handoverImageUrl || !selectedDetailId}
                  className="w-full bg-black px-6 py-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-[#99854e] disabled:cursor-not-allowed disabled:bg-[#777777]"
                >
                  {isSubmitting ? 'Dang luu...' : mode === 'PICKUP' ? 'Xac nhan ban giao' : 'Xac nhan tra do'}
                </button>
              </form>
            </aside>
          </div>
        )}
      </div>

      {previewImage && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 p-5" role="dialog">
          <button
            onClick={() => setPreviewImage(null)}
            className="absolute right-5 top-5 flex h-11 w-11 items-center justify-center bg-white text-black"
            aria-label="Dong anh"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
          <img src={previewImage} alt="Anh ban giao" className="max-h-[86dvh] max-w-[94vw] object-contain" />
        </div>
      )}
    </div>
  );
}

function Metric({ label, value, icon }) {
  return (
    <div className="border border-[#cfc4c5] bg-white p-4">
      <div className="mb-4 flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#5f5e5e]">{label}</span>
        <span className="material-symbols-outlined text-[#99854e]">{icon}</span>
      </div>
      <p className="font-serif text-3xl italic">{value}</p>
    </div>
  );
}

function StatusBadge({ status }) {
  return (
    <span className={`border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] ${statusTone[status] || 'border-[#cfc4c5] bg-white text-[#5f5e5e]'}`}>
      {status}
    </span>
  );
}

function SmallFact({ label, value }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#999999]">{label}</p>
      <p className="mt-1 font-medium">{value}</p>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.18em] text-[#5f5e5e]">{label}</span>
      {children}
    </label>
  );
}

function Alert({ tone, text }) {
  const className =
    tone === 'success'
      ? 'border-[#087b3f]/30 bg-[#e8f7ee] text-[#087b3f]'
      : 'border-[#ba1a1a]/30 bg-[#ffdad6] text-[#93000a]';
  return <div className={`mb-4 border px-4 py-3 text-sm font-medium ${className}`}>{text}</div>;
}

function Skeleton({ className }) {
  return <div className={`animate-pulse border border-[#cfc4c5] bg-white ${className}`} />;
}
