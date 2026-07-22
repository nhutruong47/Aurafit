import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { fetchProvinces, fetchDistricts, fetchWards, calculateShippingFee } from '../services/ghnService';
import { createOrder } from '../services/rentalOrderService';
import { setCartItems } from '../store/cartSlice';
import { useCheckoutStore } from '../store/useCheckoutStore';
import { useToastStore } from '../store/useToastStore';
import { formatCurrency } from '../utils/formatCurrency';
import { toRentalItem } from '../components/checkout/checkoutData';

export function useCheckout({
  cartItems = [],
  currentUser,
  onRemoveFromCart,
  onUpdateCartItem,
  onCheckoutSuccess,
  onNavigate,
}) {
  const dispatch = useDispatch();
  const location = useLocation();
  const { setPendingOrderId } = useCheckoutStore();
  const addToast = useToastStore((state) => state.addToast);
  
  const [deliveryInfo, setDeliveryInfo] = useState({ receiverName: '', receiverPhone: '' });
  const [deliveryMethod, setDeliveryMethod] = useState('STORE_PICKUP');
  
  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [wards, setWards] = useState([]);
  
  const [selectedProvinceId, setSelectedProvinceId] = useState('');
  const [selectedDistrictId, setSelectedDistrictId] = useState('');
  const [selectedWardCode, setSelectedWardCode] = useState('');
  const [streetAddress, setStreetAddress] = useState('');
  const [shippingFee, setShippingFee] = useState(0);
  const [isCalculatingFee, setIsCalculatingFee] = useState(false);
  const [storePickupAddress, setStorePickupAddress] = useState('');

  const [deliveryError, setDeliveryError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [problematicSku, setProblematicSku] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  
  const autoSelectId = location.state?.autoSelectId;

  const [selectedCartItemIds, setSelectedCartItemIds] = useState(() => {
    if (autoSelectId) {
      return new Set([autoSelectId]);
    }
    const ids = cartItems.map((item) => item.cartId || item.id || item.costumeItemId);
    return new Set(ids);
  });

  useEffect(() => {
    if (autoSelectId) {
      window.history.replaceState({}, document.title);
    }
  }, [autoSelectId]);

  useEffect(() => {
    fetchProvinces().then(setProvinces).catch(console.error);
  }, []);

  useEffect(() => {
    if (!selectedProvinceId) {
      setDistricts([]);
      setWards([]);
      setSelectedDistrictId('');
      setSelectedWardCode('');
      setShippingFee(0);
      return;
    }
    fetchDistricts(selectedProvinceId).then(setDistricts).catch(console.error);
  }, [selectedProvinceId]);

  useEffect(() => {
    if (!selectedDistrictId) {
      setWards([]);
      setSelectedWardCode('');
      setShippingFee(0);
      return;
    }
    fetchWards(selectedDistrictId).then(setWards).catch(console.error);
  }, [selectedDistrictId]);

  useEffect(() => {
    if (!selectedWardCode || !selectedDistrictId) {
      setShippingFee(0);
      return;
    }
    setIsCalculatingFee(true);
    calculateShippingFee(selectedDistrictId, selectedWardCode)
      .then(fee => setShippingFee(fee * 2))
      .catch(console.error)
      .finally(() => setIsCalculatingFee(false));
  }, [selectedWardCode, selectedDistrictId]);

  const cartDisplayItems = useMemo(() => cartItems.map((item, index) => toRentalItem(item, index + 1)), [cartItems]);
  const hasItems = cartDisplayItems.length > 0;
  const isSingleItem = cartDisplayItems.length === 1;

  const handleDeliveryChange = (event) => {
    const { name, value } = event.target;
    setDeliveryInfo((current) => ({ ...current, [name]: value }));
    setDeliveryError('');
  };

  const isDeliveryValid = () => {
    if (deliveryInfo.receiverName.trim().length === 0 || deliveryInfo.receiverPhone.trim().length === 0) return false;
    if (deliveryMethod === 'STORE_PICKUP') return storePickupAddress.trim().length > 0;
    if (deliveryMethod === 'GHN_DELIVERY') return selectedProvinceId && selectedDistrictId && selectedWardCode && streetAddress.trim().length > 0;
    return false;
  };

  const itemsToOrder = useMemo(() => {
    const nextItems = [];
    cartDisplayItems.forEach((item) => {
      if (selectedCartItemIds.has(item.id)) {
        nextItems.push(item);
      }
    });
    return nextItems;
  }, [cartDisplayItems, selectedCartItemIds]);

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
      else if (deliveryMethod === 'STORE_PICKUP' && !storePickupAddress.trim()) targetId = 'storePickupAddress';
      else if (deliveryMethod === 'GHN_DELIVERY' && !streetAddress.trim()) targetId = 'streetAddress';

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
      let finalAddress = '';
      if (deliveryMethod === 'STORE_PICKUP') {
        finalAddress = storePickupAddress.trim();
      } else {
        const provinceName = provinces.find(p => p.ProvinceID === Number(selectedProvinceId))?.ProvinceName || '';
        const districtName = districts.find(d => d.DistrictID === Number(selectedDistrictId))?.DistrictName || '';
        const wardName = wards.find(w => w.WardCode === selectedWardCode)?.WardName || '';
        finalAddress = `${streetAddress.trim()}, ${wardName}, ${districtName}, ${provinceName}`;
      }

      const orderResponse = await createOrder({
        receiverName: deliveryInfo.receiverName,
        receiverPhone: deliveryInfo.receiverPhone,
        deliveryAddress: finalAddress,
        districtId: deliveryMethod === 'STORE_PICKUP' ? null : Number(selectedDistrictId),
        wardCode: deliveryMethod === 'STORE_PICKUP' ? null : selectedWardCode,
        deliveryMethod,
        shippingFee: deliveryMethod === 'GHN_DELIVERY' ? shippingFee : 0,
        items: itemsToOrder.map((item) => ({
          sku: item.sku,
          quantity: item.quantity || 1,
          rentalStartDate: item.rentalStartDate,
          rentalEndDate: item.rentalEndDate,
        })),
      });

      const primaryOrderId = orderResponse.orders && orderResponse.orders.length > 0 ? orderResponse.orders[0].id : orderResponse.id;
      const orderIds = orderResponse.orders && orderResponse.orders.length > 0 ? orderResponse.orders.map(o => o.id) : [orderResponse.id];
      const sessionAmount = orderResponse.sessionTotalAmount || orderResponse.finalAmount;

      setPendingOrderId(primaryOrderId, sessionAmount, orderIds);

      const remainingCartItems = cartItems.filter(item => !selectedCartItemIds.has(item.cartId || item.id || item.costumeItemId));
      dispatch(setCartItems(remainingCartItems));

      onCheckoutSuccess?.(primaryOrderId);
      onNavigate?.('payment');
    } catch (error) {
      const errorMsg = error.message || '';
      
      if (errorMsg.includes('bị vô hiệu hóa') || errorMsg.includes('hủy đơn bất thường')) {
        addToast('Tài khoản của bạn đã bị vô hiệu hóa do tỷ lệ hủy đơn bất thường. Vui lòng liên hệ bộ phận CSKH.', 'error');
        onNavigate?.('home');
        return;
      }

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
    onRemoveFromCart?.(itemId);
  };

  const handleUpdateItemDates = async (cartItemId, localCartId, data) => {
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
  }, [itemsToOrder, deliveryMethod, shippingFee]); // shippingFee added as dependency but not used here, matching original

  const rawTotalDue = useMemo(() => {
    let total = itemsToOrder.reduce((acc, item) => acc + (item.subtotal || 0), 0);
    if (deliveryMethod === 'GHN_DELIVERY') {
      total += shippingFee;
    }
    return total;
  }, [itemsToOrder, deliveryMethod, shippingFee]);

  const formattedTotalDue = useMemo(() => {
    return formatCurrency(rawTotalDue);
  }, [rawTotalDue]);

  const headingLabel = isSingleItem ? 'Đơn thuê của bạn' : 'Giỏ hàng thuê';
  const selectedCount = cartDisplayItems.filter((item) => selectedCartItemIds.has(item.id)).length;
  const totalDisplayCount = cartDisplayItems.length;
  const selectedDisplayCount = selectedCount;
  const isCartEmpty = !cartItems || cartItems.length === 0;

  return {
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
    cartDisplayItems, hasItems, isSingleItem,
    itemsToOrder, hasMissingDates, summaryRows,
    rawTotalDue, formattedTotalDue,
    headingLabel, selectedCount, totalDisplayCount,
    selectedDisplayCount, isCartEmpty,
    handleDeliveryChange, handleProceedToCheckout,
    handleRemoveFromCart, handleUpdateItemDates,
    handleBulkDelete,
  };
}
