// Hero section for Product Detail — Luxury Editorial with Shopee-style variant selectors.
// All purchase-critical UI (variants, qty, dates, CTAs) fits above the fold.
import { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { formatCurrency } from '../../utils/formatCurrency';
import { fallbackProductImage, toCartItem } from '../../utils/productMapper';

export default function ProductHero({
  product,
  selectedItem,
  onSelectItem,
  isLoading = false,
  isAddingToCart = false,
  onAddToCart,
  onRentNow,
  rentalStartDate,
  rentalEndDate,
  onStartDateChange,
  onEndDateChange,
}) {
  const getLocalDateString = (dateInput = new Date()) => {
    const d = new Date(dateInput);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const today = getLocalDateString();
  const [dateError, setDateError] = useState('');
  const [quantity, setQuantity] = useState(1);
  const cartItems = useSelector((state) => state.cart.items);

  const availableItems = product?.items || [];

  // ── Shopee-style: extract ALL unique sizes and colors ──
  const allUniqueSizes = useMemo(() => {
    if (!availableItems.length) return [];
    return [...new Set(availableItems.map((i) => i.size || ''))];
  }, [availableItems]);

  const allUniqueColors = useMemo(() => {
    if (!availableItems.length) return [];
    return [...new Set(availableItems.map((i) => i.color || ''))];
  }, [availableItems]);

  // Derive selectedSize/selectedColor from the currently selected item
  const selectedSize = selectedItem?.size || '';
  const selectedColor = selectedItem?.color || '';

  // ── Stock Validation Helpers ──
  const getVariantStock = (size, color) => {
    if (!product?.inventorySummary?.length) return product?.availableItemCount || 0;
    const summary = product.inventorySummary.find(
      (s) => (s.size || '') === (size || '') && (s.color || '') === (color || '')
    );
    return summary?.availableCount ?? 0;
  };

  const getInCartQty = (size, color) => {
    return cartItems
      .filter((ci) => {
        const matchesCostume = ci.costumeId === product?.id || ci.id === product?.id;
        const matchesSize = (ci.size || '') === (size || '');
        const matchesColor = (ci.color || '') === (color || '');
        return matchesCostume && matchesSize && matchesColor;
      })
      .reduce((sum, ci) => sum + (ci.quantity || 1), 0);
  };

  const isVariantInStock = (size, color) => {
    const stock = getVariantStock(size, color);
    const inCart = getInCartQty(size, color);
    return Math.max(0, stock - inCart) > 0;
  };

  // Check if a specific size has ANY available items in stock across all colors
  const isSizeAvailable = (size) => {
    const colorsForSize = availableItems.filter(i => (i.size || '') === size).map(i => i.color || '');
    if (colorsForSize.length === 0) return isVariantInStock(size, ''); 
    return colorsForSize.some(color => isVariantInStock(size, color));
  };

  // Check if a specific color exists for the SELECTED size AND is in stock
  const isColorAvailableForSize = (color) => {
    const sizeToCheck = selectedSize;
    const itemExists = availableItems.some((i) => (i.size || '') === sizeToCheck && (i.color || '') === color);
    if (!itemExists) return false;
    return isVariantInStock(sizeToCheck, color);
  };

  // ── Variant selection handlers ──
  const handleSizeChange = (size) => {
    if (!isSizeAvailable(size)) return;
    
    // Find matching items for the new size
    const matchingItems = availableItems.filter((i) => (i.size || '') === size);
    
    // Try to keep the same color if available, otherwise pick the first IN STOCK color
    let bestMatch = matchingItems.find((i) => (i.color || '') === selectedColor && isVariantInStock(size, i.color || ''));
    if (!bestMatch) {
      bestMatch = matchingItems.find((i) => isVariantInStock(size, i.color || '')) || matchingItems[0];
    }
    
    if (bestMatch) {
      onSelectItem?.(bestMatch);
      setQuantity(1);
    }
  };

  const handleColorChange = (color) => {
    if (!isColorAvailableForSize(color)) return;
    
    // Find the exact item for current size + this color
    const exactMatch = availableItems.find(
      (i) => (i.size || '') === selectedSize && (i.color || '') === color
    );
    if (exactMatch) {
      onSelectItem?.(exactMatch);
      setQuantity(1);
    }
  };

  // ── Date handlers ──
  const handleStartDateChange = (e) => {
    const val = e.target.value;
    onStartDateChange(val);
    setDateError('');
    if (rentalEndDate && val >= rentalEndDate) {
      onEndDateChange('');
    }
  };

  const handleEndDateChange = (e) => {
    const val = e.target.value;
    if (rentalStartDate && val <= rentalStartDate) {
      setDateError('Ngày trả phải sau ngày nhận.');
      return;
    }
    onEndDateChange(val);
    setDateError('');
  };

  const canRentNow = product?.available && rentalStartDate && rentalEndDate && !dateError;

  // ── Selected Item Stock ──
  const totalStock = getVariantStock(selectedSize, selectedColor);
  const inCartQty = getInCartQty(selectedSize, selectedColor);
  const effectiveStock = Math.max(0, totalStock - inCartQty);
  const isVariantAvailable = effectiveStock > 0;

  // ── Rent Now handler ──
  const handleRentNow = () => {
    if (!canRentNow || !isVariantAvailable) return;
    const item = selectedItem || product.items?.[0] || null;
    const itemWithDates = {
      ...toCartItem(product, item),
      quantity,
      rentalStartDate: rentalStartDate ? getLocalDateString(rentalStartDate) : null,
      rentalEndDate: rentalEndDate ? getLocalDateString(rentalEndDate) : null,
    };
    onRentNow?.(itemWithDates);
  };

  if (!product) return null;

  const discountPercentage = product.discountPercentage || 0;
  let salePrice = product.priceValue;
  if (discountPercentage > 0) {
    salePrice = Math.round(product.priceValue * (1 - discountPercentage / 100));
  }

  return (
    <div className="flex flex-col gap-0 border border-[#cfc4c5] bg-white md:flex-row">
      {/* ── Left: Image ── */}
      <div className="flex w-full justify-center overflow-hidden border-b border-[#cfc4c5]/30 bg-[#f5f4f3] md:w-[42%] md:border-b-0 md:border-r">
        <div className="w-full">
          <img
            src={product.image}
            alt={product.name}
            onError={(event) => { event.currentTarget.src = fallbackProductImage; }}
            className="w-full object-cover max-h-[60vh] md:max-h-[550px]"
          />
        </div>
      </div>

      {/* ── Right: Details + Actions ── */}
      <div className="flex w-full flex-col p-4 md:w-[58%] md:p-6">
        {/* Category + Tag */}
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <span className="bg-black px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-white">
            {product.category}
          </span>
          {product.tag && (
            <span className="bg-[#99854e] px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-white">
              {product.tag}
            </span>
          )}
        </div>

        {/* Name */}
        <h1 className="mb-1 font-serif text-xl text-black md:text-3xl">{product.name}</h1>
        <p className="mb-3 text-xs text-[#777777]">{product.subcategory}</p>

        {/* Price */}
        <div className="mb-3 grid grid-cols-2 gap-4 border-y border-[#e8e4e3] py-2.5">
          <div>
            <span className="mb-1 block text-[9px] font-semibold uppercase tracking-[0.2em] text-[#999999]">Giá thuê</span>
            <div className="flex items-baseline gap-2">
              <span className="font-serif text-xl text-black">{formatCurrency(discountPercentage > 0 ? salePrice : product.priceValue)}</span>
              {discountPercentage > 0 && (
                <span className="font-serif text-sm text-[#cfc4c5] line-through">{formatCurrency(product.priceValue)}</span>
              )}
            </div>
          </div>
          <div>
            <span className="mb-1 block text-[9px] font-semibold uppercase tracking-[0.2em] text-[#999999]">Tiền cọc</span>
            <span className="font-serif text-xl text-[#99854e]">{formatCurrency(product.depositValue)}</span>
          </div>
        </div>

        {/* ── Size Selector (Shopee-style pills) ── */}
        {allUniqueSizes.length > 0 && !(allUniqueSizes.length === 1 && allUniqueSizes[0] === '') && (
          <div className="mb-3">
            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#5f5e5e]">
              Kích cỡ
            </p>
            <div className="flex flex-wrap gap-2">
              {allUniqueSizes.map((size) => {
                const available = isSizeAvailable(size);
                const isSelected = selectedSize === size;
                const tooltipText = "Tạm hết hàng"; // Sizes from allUniqueSizes always exist, so if disabled, it's out of stock

                return (
                  <div key={size || '__freesize__'} className="group relative flex items-center justify-center">
                    <button
                      onClick={() => handleSizeChange(size)}
                      disabled={!available}
                      className={`border px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider transition ${
                        isSelected
                          ? 'border-black bg-black text-white'
                          : available
                            ? 'border-[#cfc4c5] bg-white text-black hover:border-black'
                            : 'cursor-not-allowed border-[#e0e0e0] bg-[#f5f5f5] text-[#b0b0b0]'
                      }`}
                    >
                      {size || 'Freesize'}
                    </button>
                    {!available && (
                      <span className="pointer-events-none absolute bottom-full z-10 mb-1.5 hidden w-max bg-black px-2 py-1 text-[9px] font-medium tracking-wider text-white opacity-0 shadow-sm transition-opacity group-hover:block group-hover:opacity-100">
                        {tooltipText}
                        <svg className="absolute left-1/2 top-full h-1 w-2 -translate-x-1/2 text-black" viewBox="0 0 8 4" fill="currentColor">
                          <path d="M0 0h8L4 4z" />
                        </svg>
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Color Selector (Shopee-style pills) ── */}
        {allUniqueColors.length > 0 && !(allUniqueColors.length === 1 && allUniqueColors[0] === '') && (
          <div className="mb-3">
            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#5f5e5e]">
              Màu sắc
            </p>
            <div className="flex flex-wrap gap-2">
              {allUniqueColors.map((color) => {
                const itemExists = availableItems.some((i) => (i.size || '') === selectedSize && (i.color || '') === color);
                const available = itemExists && isVariantInStock(selectedSize, color);
                const isSelected = selectedColor === color;
                
                let tooltipText = "";
                if (!available) {
                  tooltipText = !itemExists ? "Không có mẫu này" : "Tạm hết hàng";
                }

                return (
                  <div key={color || '__default__'} className="group relative flex items-center justify-center">
                    <button
                      onClick={() => handleColorChange(color)}
                      disabled={!available}
                      className={`border px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider transition ${
                        isSelected
                          ? 'border-[#99854e] bg-[#99854e] text-white'
                          : available
                            ? 'border-[#cfc4c5] bg-white text-black hover:border-[#99854e]'
                            : 'cursor-not-allowed border-[#e0e0e0] bg-[#f5f5f5] text-[#b0b0b0]'
                      }`}
                    >
                      {color || 'Mặc định'}
                    </button>
                    {!available && (
                      <span className="pointer-events-none absolute bottom-full z-10 mb-1.5 hidden w-max bg-black px-2 py-1 text-[9px] font-medium tracking-wider text-white opacity-0 shadow-sm transition-opacity group-hover:block group-hover:opacity-100">
                        {tooltipText}
                        <svg className="absolute left-1/2 top-full h-1 w-2 -translate-x-1/2 text-black" viewBox="0 0 8 4" fill="currentColor">
                          <path d="M0 0h8L4 4z" />
                        </svg>
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Quantity + Stock Status ── */}
        {selectedItem && (
          <div className="mb-3 flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#5f5e5e]">Số lượng</span>
              <div className="flex h-8 items-center border border-[#cfc4c5]">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="flex h-full w-8 items-center justify-center text-black transition hover:bg-[#f9f9f9] hover:text-[#99854e]"
                >
                  <span className="material-symbols-outlined text-[12px]">remove</span>
                </button>
                <span className="flex h-full w-8 items-center justify-center border-x border-[#cfc4c5] text-xs">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity((q) => Math.min(effectiveStock, q + 1))}
                  disabled={quantity >= effectiveStock}
                  className={`flex h-full w-8 items-center justify-center transition ${
                    quantity >= effectiveStock ? 'cursor-not-allowed bg-gray-50 text-gray-400' : 'text-black hover:bg-[#f9f9f9] hover:text-[#99854e]'
                  }`}
                >
                  <span className="material-symbols-outlined text-[12px]">add</span>
                </button>
              </div>
            </div>

            <div className="flex flex-col items-end gap-1">
              <span
                className={`inline-block border px-2 py-1 text-[9px] font-semibold uppercase tracking-wider ${
                  isVariantAvailable
                    ? 'border-green-200 bg-green-50 text-green-700'
                    : 'border-red-200 bg-red-50 text-red-700'
                }`}
              >
                {isVariantAvailable ? `Còn ${effectiveStock} sản phẩm` : 'Hết hàng'}
              </span>
              {inCartQty > 0 && (
                <span className="text-[9px] font-medium italic text-amber-600">
                  Đã có {inCartQty} trong giỏ hàng
                </span>
              )}
            </div>
          </div>
        )}

        {/* ── Rental Date Picker ── */}
        <div className="mb-4">
          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#5f5e5e]">Thời gian thuê</p>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="mb-1 block text-[8px] uppercase tracking-wide text-[#999]">Ngày nhận</label>
              <input
                type="date"
                value={rentalStartDate}
                min={today}
                onChange={handleStartDateChange}
                className="w-full border border-[#cfc4c5] bg-white px-2 py-1.5 text-xs focus:border-black focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-[8px] uppercase tracking-wide text-[#999]">Ngày trả</label>
              <input
                type="date"
                value={rentalEndDate}
                min={rentalStartDate ? getLocalDateString(new Date(new Date(rentalStartDate).getTime() + 86400000)) : today}
                onChange={handleEndDateChange}
                className="w-full border border-[#cfc4c5] bg-white px-2 py-1.5 text-xs focus:border-black focus:outline-none"
              />
            </div>
          </div>
          {dateError && <p className="mt-1 text-[10px] text-red-500">{dateError}</p>}
        </div>

        {/* ── Action Buttons ── */}
        <div className="mt-auto flex flex-col gap-2">
          <button
            disabled={!isVariantAvailable || isLoading || isAddingToCart}
            onClick={async () => {
              if (!isVariantAvailable || isLoading || isAddingToCart) return;
              const item = selectedItem || product.items?.[0] || null;
              const itemWithDates = {
                ...toCartItem(product, item),
                quantity,
                rentalStartDate: rentalStartDate ? getLocalDateString(rentalStartDate) : null,
                rentalEndDate: rentalEndDate ? getLocalDateString(rentalEndDate) : null,
              };
              const success = await onAddToCart?.(itemWithDates);
              if (success !== false) {
                setQuantity(1);
              }
            }}
            className={`w-full border border-black py-2.5 text-[11px] font-semibold uppercase tracking-[0.2em] transition-all duration-300 ${
              !isVariantAvailable || isLoading || isAddingToCart
                ? 'cursor-not-allowed border-[#eeeeee] bg-[#eeeeee] text-[#999999]'
                : 'text-black hover:bg-black hover:text-white'
            }`}
          >
            {isAddingToCart ? 'Đang thêm...' : isLoading ? 'Đang tải...' : !isVariantAvailable ? 'ĐÃ ĐẠT GIỚI HẠN TỒN KHO' : 'Thêm vào giỏ hàng'}
          </button>
          <button
            disabled={!canRentNow || !isVariantAvailable || isAddingToCart}
            onClick={handleRentNow}
            className={`w-full py-2.5 text-[11px] font-semibold uppercase tracking-[0.2em] transition-all duration-300 ${
              canRentNow && isVariantAvailable && !isAddingToCart
                ? 'bg-[#99854e] text-white hover:bg-black'
                : 'cursor-not-allowed bg-[#eeeeee] text-[#999999]'
            }`}
          >
            Thuê ngay {!canRentNow && !isAddingToCart && isVariantAvailable && (
              <span className="ml-1 font-normal normal-case tracking-normal text-white/60">
                (Hãy chọn ngày thuê)
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
