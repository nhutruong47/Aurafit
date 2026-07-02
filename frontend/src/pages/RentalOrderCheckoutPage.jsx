import { useMemo, useState } from 'react';
import CheckoutSummary from '../components/checkout/CheckoutSummary';
import RentalItemCard from '../components/checkout/RentalItemCard';
import { toRentalItem } from '../components/checkout/checkoutData';
import EmptyState from '../components/ui/EmptyState';
import { clearAiStylistCartAttribution, toAiStylistAttributionRequest } from '../services/interactionsService';
import { createOrder } from '../services/rentalOrderService';
import { useDirectOrderStore } from '../store/useDirectOrderStore';
import { formatCurrency } from '../utils/formatCurrency';
import { useCheckoutStore } from '@/store/useCheckoutStore';
import ConfirmDialog from '../components/common/ConfirmDialog';
import { useToastStore } from '../store/useToastStore';

import { useDispatch } from 'react-redux';
import { setCartItems } from '../store/cartSlice';

export default function RentalOrderCheckoutPage({
  cartItems = [],
  currentUser,
  onRemoveFromCart,
  onUpdateCartItem,
  onCheckoutSuccess,
  onNavigate,
}) {
  const dispatch = useDispatch();
  const { directItem, clearDirectItem, setDirectItem } = useDirectOrderStore();
  const { setPendingOrderId } = useCheckoutStore();
  const addToast = useToastStore((state) => state.addToast);
  const [deliveryInfo, setDeliveryInfo] = useState({ receiverName: '', receiverPhone: '', deliveryAddress: '' });
  const [deliveryError, setDeliveryError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [problematicSku, setProblematicSku] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
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
      setDeliveryError('Vui lòng điền đầy đủ thông tin giao hàng.');
      addToast('Vui lòng điền đầy đủ Thông tin giao hàng.', 'error');

      let targetId = null;
      if (!deliveryInfo.receiverName.trim()) targetId = 'receiverName';
      else if (!deliveryInfo.receiverPhone.trim()) targetId = 'receiverPhone';
      else if (!deliveryInfo.deliveryAddress.trim()) targetId = 'deliveryAddress';

      if (targetId) {
        document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        document.getElementById(targetId)?.focus();
      }
      return;
    }
    if (!itemsToOrder.length) {
      setSubmitError('Vui lòng chọn ít nhất một sản phẩm để thuê.');
      return;
    }

    const invalidItems = itemsToOrder.filter((item) => !item?.sku || !item?.rentalStartDate || !item?.rentalEndDate);
    if (invalidItems.length > 0) {
      setSubmitError('Một số sản phẩm chưa có đủ thông tin thuê. Vui lòng kiểm tra lại.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');
    setProblematicSku(null);

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

      setPendingOrderId(orderResponse.id);
      clearDirectItem();
      itemsToOrder.forEach((item) => {
        clearAiStylistCartAttribution(item);
      });
      
      const remainingCartItems = cartItems.filter(item => !selectedCartItemIds.has(item.cartId || item.id || item.costumeItemId));
      dispatch(setCartItems(remainingCartItems));

      onCheckoutSuccess?.(orderResponse.id);
      onNavigate?.('payment');
    } catch (error) {
      const errorMsg = error.message || '';
      const skuMatch = errorMsg.match(/\[SKU:\s*(.*?)\]/);
      if (skuMatch && skuMatch[1]) {
        setSubmitError(`Sản phẩm [SKU: ${skuMatch[1]}] đã hết hàng hoặc không khả dụng. Vui lòng bỏ chọn sản phẩm này.`);
        setProblematicSku(skuMatch[1]);
      } else {
        setSubmitError(errorMsg || 'Không thể tạo đơn hàng. Vui lòng thử lại.');
      }
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

  const handleUpdateItemDates = async (cartItemId, localCartId, data) => {
    // RentalItemCard calls this with 3 arguments: (cartItemId, localCartId, { rentalStartDate, rentalEndDate })
    const checkoutItemTargetId = localCartId || cartItemId;
    if (directItem && (directItem.cartId === checkoutItemTargetId || directItem.id === checkoutItemTargetId || directDisplayItem?.id === checkoutItemTargetId)) {
      setDirectItem({ ...directItem, rentalStartDate: data.rentalStartDate, rentalEndDate: data.rentalEndDate });
      return;
    }
    await onUpdateCartItem?.(cartItemId, localCartId, data);
  };

  const handleBulkDelete = () => {
    selectedCartItemIds.forEach((id) => {
      handleRemoveFromCart(id);
    });
    setIsDeleteModalOpen(false);
    setSelectedCartItemIds(new Set());
    addToast('Đã xóa các sản phẩm được chọn.');
  };

  const hasMissingDates = useMemo(() => {
    return itemsToOrder.some((item) => !item.rentalStartDate || !item.rentalEndDate);
  }, [itemsToOrder]);

  const summaryRows = useMemo(() => {
    const rows = [];
    let totalRental = 0;
    let totalDeposit = 0;

    itemsToOrder.forEach((item) => {
      totalRental += item.rentalFee || 0;
      totalDeposit += item.deposit || 0;
    });

    if (totalRental > 0) {
      rows.push({ label: 'Tiền thuê', value: formatCurrency(totalRental) });
    }
    if (totalDeposit > 0) {
      rows.push({ label: 'Tiền đặt cọc (Hoàn trả)', value: formatCurrency(totalDeposit) });
    }

    return rows;
  }, [itemsToOrder]);

  const rawTotalDue = useMemo(() => {
    return itemsToOrder.reduce((total, item) => total + (item.subtotal || 0), 0);
  }, [itemsToOrder]);

  const formattedTotalDue = useMemo(() => {
    return formatCurrency(rawTotalDue);
  }, [rawTotalDue]);

  const headingLabel = isSingleItem || isDirectOnly ? 'Đơn thuê của bạn' : 'Giỏ hàng thuê';
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
                            setSelectedCartItemIds(new Set(directDisplayItem ? [directDisplayItem.id] : []));
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
                    item={directDisplayItem}
                    delay={1}
                    showCheckbox={false}
                    isProblematic={problematicSku === directDisplayItem.sku}
                    onRemoveFromCart={handleRemoveFromCart}
                    onUpdateCartItem={handleUpdateItemDates}
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
                        onUpdateCartItem={handleUpdateItemDates}
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
                            deliveryAddress: currentUser.address || '',
                          });
                        } else {
                          setDeliveryInfo({ receiverName: '', receiverPhone: '', deliveryAddress: '' });
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
                    <div className="md:col-span-2">
                      <label className="mb-1 block text-[10px] font-bold uppercase tracking-[0.2em]">
                        Địa chỉ giao hàng *
                      </label>
                      <input
                        type="text"
                        id="deliveryAddress"
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
              </>
            )}
          </section>

          <aside className="lg:col-span-4 sticky top-24 h-fit">
            {hasItems && (
              <CheckoutSummary
                summaryRows={summaryRows}
                formattedTotalDue={formattedTotalDue}
                onNavigate={onNavigate}
                onProceedToCheckout={handleProceedToCheckout}
                isSubmitting={isSubmitting}
                submitError={submitError}
                selectedCount={selectedDisplayCount}
                hasMissingDates={hasMissingDates}
              />
            )}
          </aside>
        </div>
      </main>
      <ConfirmDialog
        isOpen={isDeleteModalOpen}
        title="Xóa sản phẩm"
        message={`Bạn có chắc chắn muốn xóa ${selectedCount} sản phẩm đã chọn khỏi giỏ hàng?`}
        onConfirm={handleBulkDelete}
        onCancel={() => setIsDeleteModalOpen(false)}
      />
    </div>
  );
}
