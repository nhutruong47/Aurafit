import StaffHandoverForm from '../components/staff/StaffHandoverForm';
import StaffOrderDetails from '../components/staff/StaffOrderDetails';
import StaffOrderList from '../components/staff/StaffOrderList';
import { Metric, Skeleton } from '../components/staff/StaffDashboardShared';
import AlertMessage from '../components/ui/AlertMessage';
import { useStaffRentalOrders } from '../hooks/useStaffRentalOrders';

export default function StaffDashboardPage({ currentUser, onNavigate }) {
  const {
    canUseStaffTools,
    orders,
    activeOrderId,
    activeOrder,
    mode,
    selectedDetailId,
    selectedDetail,
    returnStatus,
    handoverImageUrl,
    note,
    previewImage,
    isLoading,
    isSubmitting,
    message,
    error,
    activeTotals,
    loadOrders,
    openOrder,
    setMode,
    setSelectedDetailId,
    setReturnStatus,
    setHandoverImageUrl,
    setNote,
    setPreviewImage,
    handleHandoverImageUploaded,
    submitHandover,
  } = useStaffRentalOrders(currentUser);

  const handleSubmit = async (event) => {
    event.preventDefault();
    await submitHandover();
  };

  if (!currentUser || !canUseStaffTools) {
    return (
      <section className="mx-auto flex min-h-[calc(100dvh-80px)] max-w-[900px] flex-col justify-center px-5 py-16 text-[#1a1c1c] md:px-20">
        <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#99854e]">Staff Area</p>
        <h1 className="font-serif text-[44px] font-normal italic leading-[1.12] md:text-[64px]">Cần tài khoản staff.</h1>
        <p className="mt-6 text-base leading-7 text-[#5f5e5e]">
          Đăng nhập bằng tài khoản staff demo để xử lý bàn giao và nhận trả trang phục.
        </p>
        <button
          onClick={() => onNavigate?.('account')}
          className="mt-8 w-fit border border-black px-8 py-4 text-[11px] font-semibold uppercase tracking-[0.18em] transition hover:bg-black hover:text-white"
        >
          Đăng nhập
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
            <h1 className="font-serif text-[42px] font-normal italic leading-[1.12] md:text-[62px]">Bàn giao và nhận trả đồ</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[#5f5e5e]">
              Xử lý PICKUP, RETURN, ảnh bàn giao và tình trạng RETURNED, DAMAGED, LOST cho từng trang phục.
            </p>
          </div>
          <button
            onClick={() => loadOrders(activeOrderId)}
            className="w-fit border border-black px-6 py-4 text-[11px] font-semibold uppercase tracking-[0.18em] transition hover:bg-black hover:text-white"
          >
            Tải lại
          </button>
        </header>

        <section className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Metric label="Tổng đơn" value={activeTotals.totalOrders} icon="inventory_2" />
          <Metric label="Chờ xác nhận" value={activeTotals.waiting} icon="hourglass_top" />
          <Metric label="Đã bàn giao" value={activeTotals.pickedUp} icon="assignment_turned_in" />
          <Metric label="Đã trả" value={activeTotals.returned} icon="undo" />
        </section>

        {error && <AlertMessage text={error} className="mb-4" />}
        {message && <AlertMessage tone="success" text={message} className="mb-4" />}

        {isLoading ? (
          <div className="grid gap-4 lg:grid-cols-12">
            <Skeleton className="h-[560px] lg:col-span-3" />
            <Skeleton className="h-[560px] lg:col-span-6" />
            <Skeleton className="h-[560px] lg:col-span-3" />
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-12">
            <StaffOrderList orders={orders} activeOrderId={activeOrderId} onOpenOrder={openOrder} />

            <main className="space-y-4 lg:col-span-6">
              <StaffOrderDetails
                activeOrder={activeOrder}
                selectedDetailId={selectedDetailId}
                onSelectDetail={setSelectedDetailId}
                onPreviewImage={setPreviewImage}
              />
            </main>

            <StaffHandoverForm
              activeOrder={activeOrder}
              mode={mode}
              selectedDetailId={selectedDetailId}
              selectedDetail={selectedDetail}
              returnStatus={returnStatus}
              handoverImageUrl={handoverImageUrl}
              note={note}
              isSubmitting={isSubmitting}
              onModeChange={setMode}
              onSelectDetail={setSelectedDetailId}
              onReturnStatusChange={setReturnStatus}
              onImageUrlChange={setHandoverImageUrl}
              onImageUploaded={handleHandoverImageUploaded}
              onNoteChange={setNote}
              onPreviewImage={setPreviewImage}
              onSubmit={handleSubmit}
            />
          </div>
        )}
      </div>

      {previewImage && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 p-5" role="dialog">
          <button
            onClick={() => setPreviewImage(null)}
            className="absolute right-5 top-5 flex h-11 w-11 items-center justify-center bg-white text-black"
            aria-label="Đóng ảnh"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
          <img src={previewImage} alt="Ảnh bàn giao" className="max-h-[86dvh] max-w-[94vw] object-contain" />
        </div>
      )}
    </div>
  );
}
