import { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { formatCurrency } from '../../utils/formatCurrency';
import {
  fallbackCostumeImage,
  getCostumeDepositPriceValue,
  getCostumeDisplayCategory,
  getCostumeImage,
  getCostumeInventorySummary,
  getCostumeItems,
  getCostumeRentalPriceValue,
  getCostumeSubcategory,
  getCostumeTag,
  isCostumeAvailable,
  toCartItemFromCostume,
} from '../../utils/costumeUtils';

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
    const date = new Date(dateInput);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const today = getLocalDateString();
  const [dateError, setDateError] = useState('');
  const [quantity, setQuantity] = useState(1);
  const cartItems = useSelector((state) => state.cart.items);
  const availableItems = useMemo(() => getCostumeItems(product), [product]);
  const categoryLabel = getCostumeDisplayCategory(product);
  const tag = getCostumeTag(product);
  const rentalPriceValue = getCostumeRentalPriceValue(product);
  const depositPriceValue = getCostumeDepositPriceValue(product);

  const allUniqueSizes = useMemo(
    () => [...new Set(availableItems.map((item) => item.size || ''))],
    [availableItems]
  );
  const allUniqueColors = useMemo(
    () => [...new Set(availableItems.map((item) => item.color || ''))],
    [availableItems]
  );

  if (!product) {
    return null;
  }

  const selectedSize = selectedItem?.size || '';
  const selectedColor = selectedItem?.color || '';

  const getVariantStock = (size, color) => {
    const inventorySummary = getCostumeInventorySummary(product);
    if (!inventorySummary.length) {
      return Number(product?.availableItemCount || 0);
    }

    const summary = inventorySummary.find(
      (item) => (item.size || '') === (size || '') && (item.color || '') === (color || '')
    );

    return summary?.availableCount ?? 0;
  };

  const getInCartQty = (size, color) =>
    cartItems
      .filter((cartItem) => {
        const matchesCostume = cartItem.costumeId === product.id || cartItem.id === product.id;
        const matchesSize = (cartItem.size || '') === (size || '');
        const matchesColor = (cartItem.color || '') === (color || '');
        return matchesCostume && matchesSize && matchesColor;
      })
      .reduce((sum, cartItem) => sum + (cartItem.quantity || 1), 0);

  const isVariantInStock = (size, color) => {
    const stock = getVariantStock(size, color);
    const inCart = getInCartQty(size, color);
    return Math.max(0, stock - inCart) > 0;
  };

  const isSizeAvailable = (size) => {
    const colorsForSize = availableItems
      .filter((item) => (item.size || '') === size)
      .map((item) => item.color || '');

    if (colorsForSize.length === 0) {
      return isVariantInStock(size, '');
    }

    return colorsForSize.some((color) => isVariantInStock(size, color));
  };

  const isColorAvailableForSize = (color) => {
    const itemExists = availableItems.some(
      (item) => (item.size || '') === selectedSize && (item.color || '') === color
    );

    if (!itemExists) {
      return false;
    }

    return isVariantInStock(selectedSize, color);
  };

  const handleSizeChange = (size) => {
    if (!isSizeAvailable(size)) {
      return;
    }

    const matchingItems = availableItems.filter((item) => (item.size || '') === size);
    let bestMatch = matchingItems.find(
      (item) => (item.color || '') === selectedColor && isVariantInStock(size, item.color || '')
    );

    if (!bestMatch) {
      bestMatch = matchingItems.find((item) => isVariantInStock(size, item.color || '')) || matchingItems[0];
    }

    if (bestMatch) {
      onSelectItem?.(bestMatch);
      setQuantity(1);
    }
  };

  const handleColorChange = (color) => {
    if (!isColorAvailableForSize(color)) {
      return;
    }

    const exactMatch = availableItems.find(
      (item) => (item.size || '') === selectedSize && (item.color || '') === color
    );

    if (exactMatch) {
      onSelectItem?.(exactMatch);
      setQuantity(1);
    }
  };

  const handleStartDateChange = (event) => {
    const value = event.target.value;
    onStartDateChange(value);
    setDateError('');

    if (rentalEndDate && value >= rentalEndDate) {
      onEndDateChange('');
    }
  };

  const handleEndDateChange = (event) => {
    const value = event.target.value;
    if (rentalStartDate && value <= rentalStartDate) {
      setDateError('Ngày trả phải sau ngày nhận.');
      return;
    }

    onEndDateChange(value);
    setDateError('');
  };

  const canRentNow = isCostumeAvailable(product) && rentalStartDate && rentalEndDate && !dateError;
  const totalStock = getVariantStock(selectedSize, selectedColor);
  const inCartQty = getInCartQty(selectedSize, selectedColor);
  const effectiveStock = Math.max(0, totalStock - inCartQty);
  const isVariantAvailable = effectiveStock > 0;

  const handleRentNow = () => {
    if (!canRentNow || !isVariantAvailable) {
      return;
    }

    const item = selectedItem || getCostumeItems(product)[0] || null;
    onRentNow?.({
      ...toCartItemFromCostume(product, item),
      quantity,
      rentalStartDate: rentalStartDate ? getLocalDateString(rentalStartDate) : null,
      rentalEndDate: rentalEndDate ? getLocalDateString(rentalEndDate) : null,
    });
  };

  return (
    <div className="flex flex-col gap-0 border border-[#cfc4c5] bg-white md:flex-row">
      <div className="flex w-full justify-center overflow-hidden border-b border-[#cfc4c5]/30 bg-[#f5f4f3] md:w-[42%] md:border-b-0 md:border-r">
        <div className="w-full">
          <img
            src={getCostumeImage(product)}
            alt={product.name}
            onError={(event) => {
              event.currentTarget.src = fallbackCostumeImage;
            }}
            className="max-h-[60vh] w-full object-cover md:max-h-[550px]"
          />
        </div>
      </div>

      <div className="flex w-full flex-col p-4 md:w-[58%] md:p-6">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <span className="bg-black px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-white">
            {categoryLabel}
          </span>
          {tag && (
            <span className="bg-[#99854e] px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-white">
              {tag}
            </span>
          )}
        </div>

        <h1 className="mb-1 font-serif text-xl text-black md:text-3xl">{product.name}</h1>
        <p className="mb-3 text-xs text-[#777777]">{getCostumeSubcategory(product)}</p>

        <div className="mb-3 grid grid-cols-2 gap-4 border-y border-[#e8e4e3] py-2.5">
          <div>
            <span className="mb-1 block text-[9px] font-semibold uppercase tracking-[0.2em] text-[#999999]">
              Giá thuê
            </span>
            <span className="font-serif text-xl text-black">{formatCurrency(rentalPriceValue)}</span>
          </div>
          <div>
            <span className="mb-1 block text-[9px] font-semibold uppercase tracking-[0.2em] text-[#999999]">
              Tiền cọc
            </span>
            <span className="font-serif text-xl text-[#99854e]">{formatCurrency(depositPriceValue)}</span>
          </div>
        </div>

        {allUniqueSizes.length > 0 && !(allUniqueSizes.length === 1 && allUniqueSizes[0] === '') && (
          <div className="mb-3">
            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#5f5e5e]">
              Kích cỡ
            </p>
            <div className="flex flex-wrap gap-2">
              {allUniqueSizes.map((size) => {
                const available = isSizeAvailable(size);
                const isSelected = selectedSize === size;

                return (
                  <button
                    key={size || '__freesize__'}
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
                );
              })}
            </div>
          </div>
        )}

        {allUniqueColors.length > 0 && !(allUniqueColors.length === 1 && allUniqueColors[0] === '') && (
          <div className="mb-3">
            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#5f5e5e]">
              Màu sắc
            </p>
            <div className="flex flex-wrap gap-2">
              {allUniqueColors.map((color) => {
                const itemExists = availableItems.some(
                  (item) => (item.size || '') === selectedSize && (item.color || '') === color
                );
                const available = itemExists && isVariantInStock(selectedSize, color);
                const isSelected = selectedColor === color;

                return (
                  <button
                    key={color || '__default__'}
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
                );
              })}
            </div>
          </div>
        )}

        {selectedItem && (
          <div className="mb-3 flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#5f5e5e]">
                Số lượng
              </span>
              <div className="flex h-8 items-center border border-[#cfc4c5]">
                <button
                  onClick={() => setQuantity((current) => Math.max(1, current - 1))}
                  className="flex h-full w-8 items-center justify-center text-black transition hover:bg-[#f9f9f9] hover:text-[#99854e]"
                >
                  <span className="material-symbols-outlined text-[12px]">remove</span>
                </button>
                <span className="flex h-full w-8 items-center justify-center border-x border-[#cfc4c5] text-xs">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity((current) => Math.min(effectiveStock, current + 1))}
                  disabled={quantity >= effectiveStock}
                  className={`flex h-full w-8 items-center justify-center transition ${
                    quantity >= effectiveStock
                      ? 'cursor-not-allowed bg-gray-50 text-gray-400'
                      : 'text-black hover:bg-[#f9f9f9] hover:text-[#99854e]'
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

        <div className="mb-4">
          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#5f5e5e]">
            Thời gian thuê
          </p>
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
                min={
                  rentalStartDate
                    ? getLocalDateString(new Date(new Date(rentalStartDate).getTime() + 86400000))
                    : today
                }
                onChange={handleEndDateChange}
                className="w-full border border-[#cfc4c5] bg-white px-2 py-1.5 text-xs focus:border-black focus:outline-none"
              />
            </div>
          </div>
          {dateError && <p className="mt-1 text-[10px] text-red-500">{dateError}</p>}
        </div>

        <div className="mt-auto flex flex-col gap-2">
          <button
            disabled={!isVariantAvailable || isLoading || isAddingToCart}
            onClick={async () => {
              if (!isVariantAvailable || isLoading || isAddingToCart) {
                return;
              }

              const item = selectedItem || getCostumeItems(product)[0] || null;
              const success = await onAddToCart?.({
                ...toCartItemFromCostume(product, item),
                quantity,
                rentalStartDate: rentalStartDate ? getLocalDateString(rentalStartDate) : null,
                rentalEndDate: rentalEndDate ? getLocalDateString(rentalEndDate) : null,
              });

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
            {isAddingToCart
              ? 'Đang thêm...'
              : isLoading
                ? 'Đang tải...'
                : !isVariantAvailable
                  ? 'Đã đạt giới hạn tồn kho'
                  : 'Thêm vào giỏ hàng'}
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
            Thuê ngay{' '}
            {!canRentNow && !isAddingToCart && isVariantAvailable && (
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
