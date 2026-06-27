import { useMemo, useState } from 'react';
import EmptyState from '../components/ui/EmptyState';
import RentalItemCard from '../components/checkout/RentalItemCard';
import CheckoutSummary from '../components/checkout/CheckoutSummary';
import { multiItemSummaryRows, singleItemSummaryRows, suggestions, toRentalItem } from '../components/checkout/checkoutData';
import { useCatalogCostumes } from '../hooks/useCatalogCostumes';
import { clearAiStylistCartAttribution, logUserInteraction } from '../services/interactionsService';
import { createOrder } from '../services/rentalOrderService';
import { useDirectOrderStore } from '../store/useDirectOrderStore';
import { formatCurrency } from '../utils/formatCurrency';

const buildAiStylistAttributionSummary = (rentalItems = []) => {
  const attributedItems = rentalItems.filter((item) => item?.attribution?.source === 'AI_STYLIST');
  if (!attributedItems.length) {
    return null;
  }

  return {
    source: 'AI_STYLIST',
    chatAttributedItemCount: attributedItems.length,
    aiStylistSessionIds: [...new Set(attributedItems.map((item) => item.attribution?.aiStylistSessionId).filter(Boolean))],
    attributedCostumeIds: [...new Set(attributedItems.map((item) => item.costumeItemId || item.id).filter(Boolean))],
    attributedItems: attributedItems.map((item) => ({
      costumeItemId: item.costumeItemId || item.id || null,
      sku: item.sku || null,
      rentalStartDate: item.rentalStartDate || null,
      rentalEndDate: item.rentalEndDate || null,
      aiStylistSessionId: item.attribution?.aiStylistSessionId || null,
      aiStylistMessageId: item.attribution?.aiStylistMessageId || null,
      guestSessionId: item.attribution?.guestSessionId || null,
      interactionSessionId: item.attribution?.interactionSessionId || null,
      recommendationPosition: item.attribution?.position || null,
      recommendationReason: item.attribution?.reason || null,
    })),
  };
};

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
  // Cart items that are ticked for purchase
  const [selectedCartItemIds, setSelectedCartItemIds] = useState(() => {
    // Default: tick all cart items when page first loads
    const ids = cartItems.map((item) => item.cartId || item.id || item.costumeItemId);
    return new Set(ids);
  });

  // Separate direct item (Thuê ngay) and cart items
  const directDisplayItem = directItem ? toRentalItem(directItem, 0) : null;
  const cartDisplayItems = cartItems.map((item, i) => toRentalItem(item, i + 1));

  // Items actually shown and selected
  const hasItems = !!(directDisplayItem || cartDisplayItems.length > 0);
  const isSingleItem = (directDisplayItem ? 1 : 0) + cartDisplayItems.length === 1;
  const isDirectOnly = !!directItem && cartItems.length === 0;

  const handleDeliveryChange = (e) => {
    const { name, value } = e.target;
    setDeliveryInfo((prev) => ({ ...prev, [name]: value }));
    setDeliveryError('');
  };

  const isDeliveryValid = () =>
    deliveryInfo.receiverName.trim().length > 0 &&
    deliveryInfo.receiverPhone.trim().length > 0 &&
    deliveryInfo.deliveryAddress.trim().length > 0;

  const handleProceedToCheckout = async () => {
    if (!currentUser?.id) {
      onNavigate?.('account');
      return;
    }
    if (!isDeliveryValid()) {
      setDeliveryError('Vui lòng điền đầy đủ thông tin giao hàng.');
      return;
    }

    // Collect items to order: direct item (always included) + selected cart items
    const itemsToOrder = [];
    if (directDisplayItem) {
      itemsToOrder.push(directDisplayItem);
    }
    cartDisplayItems.forEach((item) => {
      const itemKey = item.id;
      if (selectedCartItemIds.has(itemKey)) {
        itemsToOrder.push(item);
      }
    });

    if (itemsToOrder.length === 0) {
      setSubmitError('Vui lòng chọn ít nhất một sản phẩm để thuê.');
      return;
    }

    const invalidItems = itemsToOrder.filter(
      (item) => !item?.sku || !item?.rentalStartDate || !item?.rentalEndDate
    );
    if (invalidItems.length > 0) {
      setSubmitError('Một số sản phẩm chưa có đủ thông tin thuê. Vui lòng kiểm tra lại.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');

    try {
      const orderItems = itemsToOrder.map((item) => ({
        sku: item.sku,
        quantity: item.quantity || 1,
        rentalStartDate: item.rentalStartDate,
        rentalEndDate: item.rentalEndDate,
      }));

      const orderResponse = await createOrder({
        receiverName: deliveryInfo.receiverName,
        receiverPhone: deliveryInfo.receiverPhone,
        deliveryAddress: deliveryInfo.deliveryAddress,
        items: orderItems,
      });
      const aiStylistAttribution = buildAiStylistAttributionSummary(rentalItems);

      logUserInteraction({
        eventType: 'RENT',
        targetType: 'ORDER',
        targetId: orderResponse.id,
        metadata: {
          itemCount: items.length,
          costumeIds: rentalItems.map((item) => item.costumeItemId || item.id),
          aiStylistAttribution,
        },
      }).catch(() => {});

      clearDirectItem();

      rentalItems.forEach((item) => {
        clearAiStylistCartAttribution(item);
      });

      setPendingOrderId(orderResponse.id);
      onCheckoutSuccess?.(orderResponse.id);
      onNavigate?.('payment');
    } catch (err) {
      setSubmitError(err.message || 'Không thể tạo đơn hàng. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveFromCart = (itemId) => {
    setSelectedCartItemIds((prev) => {
      const next = new Set(prev);
      next.delete(itemId);
      return next;
    });
    if (directItem && (directItem.cartId === itemId || directItem.id === itemId)) {
      clearDirectItem();
    } else {
      onRemoveFromCart?.(itemId);
    }
  };

  // Summary computed only from items being ordered
  const summaryRows = useMemo(() => {
    const rows = [];
    let totalRental = 0;
    let totalDeposit = 0;

    const itemsToSum = directDisplayItem
      ? [directDisplayItem, ...cartDisplayItems.filter((i) => selectedCartItemIds.has(i.id))]
      : cartDisplayItems.filter((i) => selectedCartItemIds.has(i.id));

    itemsToSum.forEach((item) => {
      const rentalDays = item.rentalDays || 1;
      const unitPrice = item.unitPrice || 0;
      const itemSubtotal = unitPrice * rentalDays;
      totalRental += itemSubtotal;
      const deposit = item.depositValue
        ? item.depositValue * (item.quantity || 1)
        : Math.round(unitPrice * 0.5);
      totalDeposit += deposit;
    });

    if (totalRental > 0) {
      rows.push({ label: 'Tiền thuê', value: formatCurrency(totalRental) });
    }
    if (totalDeposit > 0) {
      rows.push({ label: 'Tiền đặt cọc (Hoàn trả)', value: formatCurrency(totalDeposit) });
    }

    return rows;
  }, [directDisplayItem, cartDisplayItems, selectedCartItemIds]);

  const formattedTotalDue = useMemo(() => {
    const total = summaryRows.reduce((sum, row) => {
      const numeric = parseFloat(String(row.value).replace(/[^\d.]/g, ''));
      return sum + (isNaN(numeric) ? 0 : numeric);
    }, 0);
    return formatCurrency(total);
  }, [summaryRows]);

  const headingLabel = isSingleItem
    ? 'Đơn thuê của bạn'
    : isDirectOnly
    ? 'Đơn thuê của bạn'
    : 'Giỏ hàng thuê';

  const selectedCount = cartDisplayItems.filter((i) => selectedCartItemIds.has(i.id)).length;
  const totalDisplayCount = (directDisplayItem ? 1 : 0) + cartDisplayItems.length;
  const selectedDisplayCount = (directDisplayItem ? 1 : 0) + selectedCount;

  return (
    <div className="bg-[#f9f9f9] pb-20 text-[#1a1c1c] md:pb-0">
      <main className="mx-auto max-w-[1440px] px-5 pb-28 pt-36 md:px-20 md:pb-40">
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
                  <label className="flex cursor-pointer items-center gap-2 text-[12px] font-semibold">
                    <input
                      type="checkbox"
                      checked={selectedCount === cartDisplayItems.length && cartDisplayItems.length > 0}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedCartItemIds((prev) => {
                            const next = new Set(prev);
                            cartDisplayItems.forEach((i) => next.add(i.id));
                            return next;
                          });
                        } else {
                          setSelectedCartItemIds(new Set(directDisplayItem ? [directDisplayItem.id] : []));
                        }
                      }}
                      className="h-4 w-4 accent-[#99854e]"
                    />
                    Chọn tất cả
                  </label>
                )}
                <span className="text-[12px] font-semibold uppercase tracking-[0.15em]">
                  {selectedDisplayCount} / {totalDisplayCount} sản phẩm
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
                title="Chưa có sản phẩm nào"
                message="Hãy chọn sản phẩm bạn muốn thuê từ danh mục của AuraFit."
                actionLabel="Xem bộ sưu tập"
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
                        showCheckbox={true}
                        isChecked={selectedCartItemIds.has(item.id)}
                        onToggleCheck={(checked) => {
                          setSelectedCartItemIds((prev) => {
                            const next = new Set(prev);
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

                {hasItems && (
                  <div className="border-t border-[#cfc4c5] pt-12">
                    <h2 className="mb-6 font-serif text-2xl font-normal uppercase italic">
                      Thông tin giao hàng
                    </h2>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div>
                        <label className="mb-1 block text-[10px] font-bold uppercase tracking-[0.2em]">
                          Tên người nhận *
                        </label>
                        <input
                          type="text"
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
                          name="receiverPhone"
                          value={deliveryInfo.receiverPhone}
                          onChange={handleDeliveryChange}
                          placeholder="0xxx xxx xxx"
                          className="w-full border border-[#cfc4c5] bg-white px-4 py-3 text-sm focus:border-black focus:outline-none"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="mb-1 block text-[10px] font-bold uppercase tracking-[0.2em]">
                          Địa chỉ giao hàng *
                        </label>
                        <input
                          type="text"
                          name="deliveryAddress"
                          value={deliveryInfo.deliveryAddress}
                          onChange={handleDeliveryChange}
                          placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành phố"
                          className="w-full border border-[#cfc4c5] bg-white px-4 py-3 text-sm focus:border-black focus:outline-none"
                        />
                      </div>
                    </div>
                    {deliveryError && <p className="mt-3 text-sm text-red-600">{deliveryError}</p>}
                    {!currentUser?.id && (
                      <p className="mt-3 text-sm text-[#99854e]">
                        Vui lòng{' '}
                        <button
                          onClick={() => onNavigate?.('account')}
                          className="underline hover:text-black"
                        >
                          đăng nhập
                        </button>{' '}
                        để tiếp tục thanh toán.
                      </p>
                    )}
                  </div>
                )}
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
