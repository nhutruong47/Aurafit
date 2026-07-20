import CheckoutSummary from '../components/checkout/CheckoutSummary';
import RentalItemCard from '../components/checkout/RentalItemCard';
import EmptyState from '../components/ui/EmptyState';
import ConfirmDialog from '../components/common/ConfirmDialog';
import SearchableSelect from '../components/common/SearchableSelect';
import { useCheckout } from '../hooks/useCheckout';

export default function RentalOrderCheckoutPage({
  cartItems = [],
  currentUser,
  onRemoveFromCart,
  onUpdateCartItem,
  onCheckoutSuccess,
  onNavigate,
}) {
  const {
    deliveryInfo, setDeliveryInfo,
    deliveryMethod, setDeliveryMethod,
    provinces, districts, wards,
    selectedProvinceId, setSelectedProvinceId,
    selectedDistrictId, setSelectedDistrictId,
    selectedWardCode, setSelectedWardCode,
    streetAddress, setStreetAddress,
    shippingFee, isCalculatingFee,
    storePickupAddress, setStorePickupAddress,
    deliveryError, setDeliveryError,
    isSubmitting, submitError, problematicSku,
    isDeleteModalOpen, setIsDeleteModalOpen,
    selectedCartItemIds, setSelectedCartItemIds,
    cartDisplayItems, hasItems,
    hasMissingDates, summaryRows,
    formattedTotalDue,
    headingLabel, selectedCount, totalDisplayCount,
    selectedDisplayCount, isCartEmpty,
    handleDeliveryChange, handleProceedToCheckout,
    handleRemoveFromCart, handleUpdateItemDates,
    handleBulkDelete,
  } = useCheckout({
    cartItems,
    currentUser,
    onRemoveFromCart,
    onUpdateCartItem,
    onCheckoutSuccess,
    onNavigate,
  });

  if (isCartEmpty) {
    return (
      <div className="bg-[#f9f9f9] pb-20 text-[#1a1c1c] md:pb-0">
        <main className="mx-auto max-w-[1440px] px-5 pb-28 pt-8 md:px-20 md:pb-40 md:pt-12">
          <EmptyState
            icon="shopping_bag"
            title="Chưa có sản phẩm nào"
            message="Hãy chọn sản phẩm bạn muốn thuê từ danh mục của AuraFit."
            actionLabel="Xem bộ sưu tập"
            onAction={() => onNavigate?.('catalog')}
          />
        </main>
      </div>
    );
  }

  return (
    <div className="bg-[#f9f9f9] pb-20 text-[#1a1c1c] md:pb-0">
      <main className="mx-auto max-w-[1440px] px-5 pb-28 pt-8 md:px-20 md:pb-40 md:pt-12">
        <header className="mb-16 animate-[fadeIn_0.8s_ease-out_forwards]">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <p className="mb-2 text-[12px] font-semibold uppercase tracking-[0.22em] text-[#99854e]">
                Xác nhận đơn thuê
              </p>
              <h1 className="mb-2 font-serif text-[40px] font-normal italic leading-tight md:text-[64px]">
                {headingLabel}
              </h1>
              {hasItems && (
                <button
                  onClick={() => onNavigate?.('orders')}
                  className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-[#99854e] transition-colors hover:text-black"
                >
                  <span className="material-symbols-outlined text-[16px]">receipt_long</span>
                  Lịch sử đơn hàng
                </button>
              )}
            </div>
            {hasItems && (
              <div className="flex items-center gap-4 text-[#5f5e5e]">
                {cartDisplayItems.length > 0 && (
                  <>
                    <label className="flex cursor-pointer items-center gap-2 text-[12px] font-semibold">
                      <input
                        type="checkbox"
                        checked={selectedCount === cartDisplayItems.length && cartDisplayItems.length > 0}
                        onChange={(event) => {
                          if (event.target.checked) {
                            setSelectedCartItemIds((current) => {
                              const next = new Set(current);
                              cartDisplayItems.forEach((item) => next.add(item.id));
                              return next;
                            });
                          } else {
                            setSelectedCartItemIds(new Set());
                          }
                        }}
                        className="h-4 w-4 accent-[#99854e]"
                      />
                      Chọn tất cả
                    </label>
                    {selectedCount > 0 && (
                      <button
                        onClick={() => setIsDeleteModalOpen(true)}
                        className="text-[12px] font-semibold text-[#ba1a1a] hover:underline"
                      >
                        {selectedCount === cartDisplayItems.length ? 'Xóa tất cả' : 'Xóa đã chọn'}
                      </button>
                    )}
                  </>
                )}
                <span className="text-[12px] font-semibold uppercase tracking-[0.15em] ml-2 border-l border-[#cfc4c5] pl-4">
                  {selectedDisplayCount} / {totalDisplayCount} sản phẩm
                </span>
              </div>
            )}
          </div>
        </header>

        <div className="grid grid-cols-1 gap-16 lg:grid-cols-12">
          <section className="space-y-16 lg:col-span-8">
                {cartDisplayItems.length > 0 && (
                  <div className="space-y-8">
                    {cartDisplayItems.map((item, index) => (
                      <RentalItemCard
                        key={item.id}
                        item={item}
                        delay={index + 1}
                        showCheckbox
                        isProblematic={problematicSku === item.sku}
                        isChecked={selectedCartItemIds.has(item.id)}
                        onToggleCheck={(checked) => {
                          setSelectedCartItemIds((current) => {
                            const next = new Set(current);
                            if (checked) {
                              next.add(item.id);
                            } else {
                              next.delete(item.id);
                            }
                            return next;
                          });
                        }}
                        onRemoveFromCart={handleRemoveFromCart}
                        onUpdateDates={handleUpdateItemDates}
                      />
                    ))}
                  </div>
                )}

                <div className="border-t border-[#cfc4c5] pt-12">
                  <h2 className="mb-6 font-serif text-2xl font-normal uppercase italic">
                    Thông tin giao hàng
                  </h2>
                  <label className="mb-5 flex cursor-pointer items-center gap-3">
                    <input
                      type="checkbox"
                      className="h-4 w-4 accent-[#99854e]"
                      onChange={(e) => {
                        if (e.target.checked && currentUser) {
                          setDeliveryInfo({
                            receiverName: currentUser.fullName || '',
                            receiverPhone: currentUser.phone || '',
                          });
                          setStorePickupAddress(currentUser.address || '');
                          setStreetAddress(currentUser.address || '');
                        } else {
                          setDeliveryInfo({ receiverName: '', receiverPhone: '' });
                          setStorePickupAddress('');
                          setStreetAddress('');
                        }
                        setDeliveryError('');
                      }}
                    />
                    <span className="text-sm font-medium">Nhập thông tin của tôi (Tôi là người nhận)</span>
                  </label>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-[10px] font-bold uppercase tracking-[0.2em]">
                        Tên người nhận *
                      </label>
                      <input
                        type="text"
                        id="receiverName"
                        name="receiverName"
                        value={deliveryInfo.receiverName}
                        onChange={handleDeliveryChange}
                        placeholder="Họ và tên"
                        className="w-full border border-[#cfc4c5] bg-white px-4 py-3 text-sm focus:border-black focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-[10px] font-bold uppercase tracking-[0.2em]">
                        Số điện thoại *
                      </label>
                      <input
                        type="tel"
                        id="receiverPhone"
                        name="receiverPhone"
                        value={deliveryInfo.receiverPhone}
                        onChange={handleDeliveryChange}
                        placeholder="0xxx xxx xxx"
                        className="w-full border border-[#cfc4c5] bg-white px-4 py-3 text-sm focus:border-black focus:outline-none"
                      />
                    </div>
                    
                    <div className="md:col-span-2 mt-4">
                      <label className="mb-3 block text-[10px] font-bold uppercase tracking-[0.2em]">Hình thức nhận hàng</label>
                      <div className="flex flex-col gap-3 md:flex-row md:gap-8 mb-4">
                        <label className="flex items-center gap-2 text-sm cursor-pointer">
                          <input type="radio" name="deliveryMethod" value="STORE_PICKUP" checked={deliveryMethod === 'STORE_PICKUP'} onChange={() => setDeliveryMethod('STORE_PICKUP')} className="h-4 w-4 accent-[#99854e]" />
                          Nhận & Trả hàng tại cửa hàng
                        </label>
                        <label className="flex items-center gap-2 text-sm cursor-pointer">
                          <input type="radio" name="deliveryMethod" value="GHN_DELIVERY" checked={deliveryMethod === 'GHN_DELIVERY'} onChange={() => setDeliveryMethod('GHN_DELIVERY')} className="h-4 w-4 accent-[#99854e]" />
                          Giao hàng toàn quốc (GHN)
                        </label>
                      </div>
                    </div>

                    {deliveryMethod === 'STORE_PICKUP' && (
                      <div className="md:col-span-2">
                        <div className="mb-6 border border-[#cfc4c5] bg-[#fdfaf5] p-5">
                          <p className="text-[13px] font-medium text-black">
                            📍 Địa chỉ nhận/trả đồ:
                          </p>
                          <p className="mt-1 text-[13px] leading-relaxed text-[#5f5e5e]">
                            Cửa hàng AuraFit - Lô E2a-7, Đường D1, Khu Công nghệ cao, TP. Thủ Đức, TP. Hồ Chí Minh.
                          </p>
                        </div>
                        <label className="mb-1 block text-[10px] font-bold uppercase tracking-[0.2em]">
                          Địa chỉ thường trú (Để đối chiếu) *
                        </label>
                        <input
                          type="text"
                          id="storePickupAddress"
                          name="storePickupAddress"
                          value={storePickupAddress}
                          onChange={(e) => setStorePickupAddress(e.target.value)}
                          placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành phố"
                          className="w-full border border-[#cfc4c5] bg-white px-4 py-3 text-sm focus:border-black focus:outline-none"
                        />
                      </div>
                    )}

                    {deliveryMethod === 'GHN_DELIVERY' && (
                      <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="mb-1 block text-[10px] font-bold uppercase tracking-[0.2em]">Tỉnh/Thành phố *</label>
                          <SearchableSelect
                            value={selectedProvinceId}
                            onChange={(val) => setSelectedProvinceId(val)}
                            options={provinces.map(p => ({ value: p.ProvinceID, label: p.ProvinceName }))}
                            placeholder="Chọn Tỉnh/Thành"
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-[10px] font-bold uppercase tracking-[0.2em]">Quận/Huyện *</label>
                          <SearchableSelect
                            value={selectedDistrictId}
                            onChange={(val) => setSelectedDistrictId(val)}
                            disabled={!selectedProvinceId}
                            options={districts.map(d => ({ value: d.DistrictID, label: d.DistrictName }))}
                            placeholder="Chọn Quận/Huyện"
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-[10px] font-bold uppercase tracking-[0.2em]">Phường/Xã *</label>
                          <SearchableSelect
                            value={selectedWardCode}
                            onChange={(val) => setSelectedWardCode(val)}
                            disabled={!selectedDistrictId}
                            options={wards.map(w => ({ value: w.WardCode, label: w.WardName }))}
                            placeholder="Chọn Phường/Xã"
                          />
                        </div>
                        <div className="md:col-span-3">
                          <label className="mb-1 block text-[10px] font-bold uppercase tracking-[0.2em]">Địa chỉ chi tiết *</label>
                          <input
                            type="text"
                            id="streetAddress"
                            value={streetAddress}
                            onChange={(e) => setStreetAddress(e.target.value)}
                            placeholder="Số nhà, tên đường..."
                            className="w-full border border-[#cfc4c5] bg-white px-4 py-3 text-sm focus:border-black focus:outline-none"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                  {deliveryError && (
                    <div className="mt-4 border-l-2 border-[#ba1a1a] bg-[#fdf3f3] p-3 text-sm text-[#ba1a1a]">
                      {deliveryError}
                    </div>
                  )}
                </div>

          </section>

          <aside className="lg:col-span-4">
            <div className="sticky top-24">
              <CheckoutSummary
                summaryRows={summaryRows}
                formattedTotalDue={formattedTotalDue}
                submitError={submitError}
                isSubmitting={isSubmitting}
                hasMissingDates={hasMissingDates}
                selectedCount={selectedCount}
                onProceedToCheckout={handleProceedToCheckout}
                onNavigate={onNavigate}
                shippingFee={shippingFee}
                deliveryMethod={deliveryMethod}
                isCalculatingFee={isCalculatingFee}
              />
            </div>
          </aside>
        </div>
      </main>
      <ConfirmDialog
        isOpen={isDeleteModalOpen}
        title="Xóa sản phẩm"
        message={`Bạn có chắc chắn muốn xóa ${selectedCount} sản phẩm đã chọn khỏi giỏ hàng không?`}
        onConfirm={handleBulkDelete}
        onCancel={() => setIsDeleteModalOpen(false)}
        confirmLabel="Xóa"
        cancelLabel="Hủy"
        isDanger={true}
      />
    </div>
  );
}
