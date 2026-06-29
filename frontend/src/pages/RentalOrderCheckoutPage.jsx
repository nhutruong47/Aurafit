import { useMemo, useState } from 'react';
import CheckoutSummary from '../components/checkout/CheckoutSummary';
import RentalItemCard from '../components/checkout/RentalItemCard';
import { toRentalItem } from '../components/checkout/checkoutData';
import EmptyState from '../components/ui/EmptyState';
import { clearAiStylistCartAttribution, toAiStylistAttributionRequest } from '../services/interactionsService';
import { createOrder } from '../services/rentalOrderService';
import { useDirectOrderStore } from '../store/useDirectOrderStore';
import { formatCurrency } from '../utils/formatCurrency';

export default function RentalOrderCheckoutPage({
  cartItems = [],
  currentUser,
  onRemoveFromCart,
  onUpdateCartQuantity,
  onCheckoutSuccess,
  onNavigate,
}) {
  const { directItem, clearDirectItem } = useDirectOrderStore();
  const [deliveryInfo, setDeliveryInfo] = useState({ receiverName: '', receiverPhone: '', deliveryAddress: '' });
  const [deliveryError, setDeliveryError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [selectedCartItemIds, setSelectedCartItemIds] = useState(() => {
    const ids = cartItems.map((item) => item.cartId || item.id || item.costumeItemId);
    return new Set(ids);
  });

  const directDisplayItem = directItem ? toRentalItem(directItem, 0) : null;
  const cartDisplayItems = cartItems.map((item, index) => toRentalItem(item, index + 1));
  const hasItems = !!(directDisplayItem || cartDisplayItems.length > 0);
  const isSingleItem = (directDisplayItem ? 1 : 0) + cartDisplayItems.length === 1;
  const isDirectOnly = !!directItem && cartItems.length === 0;

  const handleDeliveryChange = (event) => {
    const { name, value } = event.target;
    setDeliveryInfo((current) => ({ ...current, [name]: value }));
    setDeliveryError('');
  };

  const isDeliveryValid = () =>
    deliveryInfo.receiverName.trim().length > 0 &&
    deliveryInfo.receiverPhone.trim().length > 0 &&
    deliveryInfo.deliveryAddress.trim().length > 0;

  const itemsToOrder = useMemo(() => {
    const nextItems = [];
    if (directDisplayItem) {
      nextItems.push(directDisplayItem);
    }

    cartDisplayItems.forEach((item) => {
      if (selectedCartItemIds.has(item.id)) {
        nextItems.push(item);
      }
    });

    return nextItems;
  }, [cartDisplayItems, directDisplayItem, selectedCartItemIds]);

  const handleProceedToCheckout = async () => {
    if (!currentUser?.id) {
      onNavigate?.('account');
      return;
    }
    if (!isDeliveryValid()) {
      setDeliveryError('Vui long dien day du thong tin giao hang.');
      return;
    }
    if (!itemsToOrder.length) {
      setSubmitError('Vui long chon it nhat mot san pham de thue.');
      return;
    }

    const invalidItems = itemsToOrder.filter((item) => !item?.sku || !item?.rentalStartDate || !item?.rentalEndDate);
    if (invalidItems.length > 0) {
      setSubmitError('Mot so san pham chua co du thong tin thue. Vui long kiem tra lai.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');

    try {
      const orderResponse = await createOrder({
        receiverName: deliveryInfo.receiverName,
        receiverPhone: deliveryInfo.receiverPhone,
        deliveryAddress: deliveryInfo.deliveryAddress,
        items: itemsToOrder.map((item) => ({
          sku: item.sku,
          quantity: item.quantity || 1,
          rentalStartDate: item.rentalStartDate,
          rentalEndDate: item.rentalEndDate,
          aiStylistAttribution: toAiStylistAttributionRequest(item.attribution),
        })),
      });

      clearDirectItem();
      itemsToOrder.forEach((item) => {
        clearAiStylistCartAttribution(item);
      });

      onCheckoutSuccess?.(orderResponse.id);
      onNavigate?.('payment');
    } catch (error) {
      setSubmitError(error.message || 'Khong the tao don hang. Vui long thu lai.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveFromCart = (itemId) => {
    setSelectedCartItemIds((current) => {
      const next = new Set(current);
      next.delete(itemId);
      return next;
    });

    if (directItem && (directItem.cartId === itemId || directItem.id === itemId)) {
      clearDirectItem();
      return;
    }

    onRemoveFromCart?.(itemId);
  };

  const summaryRows = useMemo(() => {
    const rows = [];
    let totalRental = 0;
    let totalDeposit = 0;

    itemsToOrder.forEach((item) => {
      const rentalDays = item.rentalDays || 1;
      const unitPrice = item.unitPrice || 0;
      totalRental += unitPrice * rentalDays;
      totalDeposit += item.depositValue
        ? item.depositValue * (item.quantity || 1)
        : Math.round(unitPrice * 0.5);
    });

    if (totalRental > 0) {
      rows.push({ label: 'Tien thue', value: formatCurrency(totalRental) });
    }
    if (totalDeposit > 0) {
      rows.push({ label: 'Tien dat coc (Hoan tra)', value: formatCurrency(totalDeposit) });
    }

    return rows;
  }, [itemsToOrder]);

  const formattedTotalDue = useMemo(() => {
    const total = summaryRows.reduce((sum, row) => {
      const numeric = parseFloat(String(row.value).replace(/[^\d.]/g, ''));
      return sum + (Number.isNaN(numeric) ? 0 : numeric);
    }, 0);

    return formatCurrency(total);
  }, [summaryRows]);

  const headingLabel = isSingleItem || isDirectOnly ? 'Don thue cua ban' : 'Gio hang thue';
  const selectedCount = cartDisplayItems.filter((item) => selectedCartItemIds.has(item.id)).length;
  const totalDisplayCount = (directDisplayItem ? 1 : 0) + cartDisplayItems.length;
  const selectedDisplayCount = (directDisplayItem ? 1 : 0) + selectedCount;

  return (
    <div className="bg-[#f9f9f9] pb-20 text-[#1a1c1c] md:pb-0">
      <main className="mx-auto max-w-[1440px] px-5 pb-28 pt-36 md:px-20 md:pb-40">
        <header className="mb-16 animate-[fadeIn_0.8s_ease-out_forwards]">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <p className="mb-2 text-[12px] font-semibold uppercase tracking-[0.22em] text-[#99854e]">
                Xac nhan don thue
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
                  Lich su don hang
                </button>
              )}
            </div>
            {hasItems && (
              <div className="flex items-center gap-4 text-[#5f5e5e]">
                {cartDisplayItems.length > 0 && (
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
                          setSelectedCartItemIds(new Set(directDisplayItem ? [directDisplayItem.id] : []));
                        }
                      }}
                      className="h-4 w-4 accent-[#99854e]"
                    />
                    Chon tat ca
                  </label>
                )}
                <span className="text-[12px] font-semibold uppercase tracking-[0.15em]">
                  {selectedDisplayCount} / {totalDisplayCount} san pham
                </span>
              </div>
            )}
          </div>
        </header>

        <div className="grid grid-cols-1 gap-16 lg:grid-cols-12">
          <section className="space-y-16 lg:col-span-8">
            {!hasItems ? (
              <EmptyState
                icon="shopping_bag"
                title="Chua co san pham nao"
                message="Hay chon san pham ban muon thue tu danh muc cua AuraFit."
                actionLabel="Xem bo suu tap"
                onAction={() => onNavigate?.('catalog')}
              />
            ) : (
              <>
                {directDisplayItem && (
                  <RentalItemCard
                    key={directDisplayItem.id}
                    item={directDisplayItem}
                    delay={1}
                    showCheckbox={false}
                    onRemoveFromCart={handleRemoveFromCart}
                    onUpdateCartQuantity={onUpdateCartQuantity}
                  />
                )}

                {cartDisplayItems.length > 0 && (
                  <div className="space-y-8">
                    {cartDisplayItems.map((item, index) => (
                      <RentalItemCard
                        key={item.id}
                        item={item}
                        delay={index + 1 + (directDisplayItem ? 1 : 0)}
                        showCheckbox
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
                        onUpdateCartQuantity={onUpdateCartQuantity}
                      />
                    ))}
                  </div>
                )}

                <div className="border-t border-[#cfc4c5] pt-12">
                  <h2 className="mb-6 font-serif text-2xl font-normal uppercase italic">
                    Thong tin giao hang
                  </h2>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-[10px] font-bold uppercase tracking-[0.2em]">
                        Ten nguoi nhan *
                      </label>
                      <input
                        type="text"
                        name="receiverName"
                        value={deliveryInfo.receiverName}
                        onChange={handleDeliveryChange}
                        placeholder="Ho va ten"
                        className="w-full border border-[#cfc4c5] bg-white px-4 py-3 text-sm focus:border-black focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-[10px] font-bold uppercase tracking-[0.2em]">
                        So dien thoai *
                      </label>
                      <input
                        type="tel"
                        name="receiverPhone"
                        value={deliveryInfo.receiverPhone}
                        onChange={handleDeliveryChange}
                        placeholder="0xxx xxx xxx"
                        className="w-full border border-[#cfc4c5] bg-white px-4 py-3 text-sm focus:border-black focus:outline-none"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="mb-1 block text-[10px] font-bold uppercase tracking-[0.2em]">
                        Dia chi giao hang *
                      </label>
                      <input
                        type="text"
                        name="deliveryAddress"
                        value={deliveryInfo.deliveryAddress}
                        onChange={handleDeliveryChange}
                        placeholder="So nha, duong, phuong/xa, quan/huyen, tinh/thanh pho"
                        className="w-full border border-[#cfc4c5] bg-white px-4 py-3 text-sm focus:border-black focus:outline-none"
                      />
                    </div>
                  </div>
                  {deliveryError && <p className="mt-3 text-sm text-red-600">{deliveryError}</p>}
                  {!currentUser?.id && (
                    <p className="mt-3 text-sm text-[#99854e]">
                      Vui long{' '}
                      <button
                        onClick={() => onNavigate?.('account')}
                        className="underline hover:text-black"
                      >
                        dang nhap
                      </button>{' '}
                      de tiep tuc thanh toan.
                    </p>
                  )}
                </div>
              </>
            )}
          </section>

          <aside className="lg:col-span-4">
            {hasItems && (
              <CheckoutSummary
                summaryRows={summaryRows}
                formattedTotalDue={formattedTotalDue}
                onNavigate={onNavigate}
                onProceedToCheckout={handleProceedToCheckout}
                isSubmitting={isSubmitting}
                submitError={submitError}
                selectedCount={selectedDisplayCount}
              />
            )}
          </aside>
        </div>
      </main>
    </div>
  );
}
