import { useCallback, useEffect, useState } from 'react';
import { formatCurrency } from '../../utils/formatCurrency';
import { fallbackProductImage, toCartItem } from '../../utils/productMapper';
import { fetchCostumeItems } from '../../services/costumeService';

export default function ShopProductCard({ product, onNavigate, onAddToCart, onRentNow }) {
  const getLocalDateString = (dateInput = new Date()) => {
    const date = new Date(dateInput);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const today = getLocalDateString();
  const [selectedItem, setSelectedItem] = useState(() => product.items?.[0] || null);
  const [showDates, setShowDates] = useState(false);
  const [rentalStartDate, setRentalStartDate] = useState(() => getLocalDateString(0));
  const [rentalEndDate, setRentalEndDate] = useState(() => getLocalDateString(1));
  const [dateError, setDateError] = useState('');

  const hasInlineRentalActions = Boolean(onAddToCart || onRentNow);
  const available = product.available;
  const discountPercentage = product.discountPercentage || 0;
  let salePrice = product.priceValue;
  if (discountPercentage > 0) {
    salePrice = Math.round(product.priceValue * (1 - discountPercentage / 100));
  }

  useEffect(() => {
    if ((!product.items || product.items.length === 0) && product.id) {
      fetchCostumeItems(product.id)
        .then((fetched) => {
          if (fetched?.length) {
            setSelectedItem((current) => current || fetched[0]);
          }
        })
        .catch(() => {});
    }
  }, [product.id, product.items]);

  const handleStartDateChange = (event) => {
    const value = event.target.value;
    setRentalStartDate(value);
    setDateError('');
    if (rentalEndDate && value >= rentalEndDate) {
      setRentalEndDate('');
    }
  };

  const handleEndDateChange = (event) => {
    const value = event.target.value;
    if (rentalStartDate && value <= rentalStartDate) {
      setDateError('Ngày trả phải sau ngày nhận.');
      return;
    }

    setRentalEndDate(value);
    setDateError('');
  };

  const buildCartItem = useCallback(() => {
    if (selectedItem) {
      return {
        ...toCartItem(product, selectedItem),
        rentalStartDate,
        rentalEndDate,
        discountPercentage,
      };
    }

    return {
      id: product.id,
      costumeId: product.costumeId || product.id,
      costumeItemId: null,
      name: product.name,
      meta: product.meta || product.description || product.tag,
      rawCategory: product.rawCategory,
      category: product.category,
      subcategory: product.subcategory,
      tag: product.tag,
      price: product.price,
      priceValue: product.priceValue,
      deposit: product.deposit,
      depositValue: product.depositValue,
      image: product.image,
      sku: null,
      size: null,
      color: null,
      rentalStartDate,
      rentalEndDate,
      discountPercentage,
    };
  }, [discountPercentage, product, rentalEndDate, rentalStartDate, selectedItem]);

  const canRentNow = available && rentalStartDate && rentalEndDate && !dateError;

  return (
    <article className="group flex flex-col border border-[#cfc4c5] bg-white transition hover:border-[#99854e]">
      <div
        onClick={() => onNavigate?.('productDetail', product)}
        className="relative aspect-[4/5] cursor-pointer overflow-hidden bg-[#eeeeee]"
      >
        <img
          src={product.image}
          alt={product.name}
          onError={(event) => {
            event.currentTarget.src = fallbackProductImage;
          }}
          className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
        />
        {discountPercentage > 0 && (
          <span className="absolute left-3 top-3 z-10 bg-[#ba1a1a] px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-white">
            -{discountPercentage}%
          </span>
        )}
        <span
          className={`absolute ${discountPercentage > 0 ? 'left-3 top-10' : 'left-3 top-3'} z-10 bg-black px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-white`}
        >
          {product.category}
        </span>
        <span
          className={`absolute right-3 top-3 z-10 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] ${
            available ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}
        >
          {available ? 'Còn hàng' : 'Tạm hết'}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div onClick={() => onNavigate?.('productDetail', product)} className="cursor-pointer">
          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#99854e]">
            {product.subcategory || product.rawCategory}
            {product.tag ? ` · ${product.tag}` : ''}
          </p>
          <h3 className="line-clamp-2 min-h-[44px] font-serif text-xl italic leading-tight transition group-hover:text-[#99854e]">
            {product.name}
          </h3>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-3 border-t border-[#e8e4e3] pt-3 text-sm">
          <div>
            <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-[#999999]">Giá thuê</p>
            <p className="mt-0.5 font-medium">
              {discountPercentage > 0 ? (
                <>
                  <span className="mr-1.5 text-xs text-[#999999] line-through">
                    {formatCurrency(product.priceValue)}
                  </span>
                  <span className="text-[#ba1a1a]">{formatCurrency(salePrice)}</span>
                </>
              ) : (
                formatCurrency(product.priceValue)
              )}
            </p>
          </div>
          <div>
            <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-[#999999]">Tiền cọc</p>
            <p className="mt-0.5 font-medium">{formatCurrency(product.depositValue)}</p>
          </div>
        </div>

        {hasInlineRentalActions ? (
          <>
            <button
              onClick={() => setShowDates((current) => !current)}
              className="mt-3 flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.14em] text-[#99854e] hover:underline"
            >
              <span>{showDates ? '▼ Ẩn ngày thuê' : '▶  Chọn ngày thuê'}</span>
            </button>

            {showDates && (
              <div className="mt-2 grid grid-cols-2 gap-2">
                <div>
                  <label className="mb-1 block text-[9px] uppercase tracking-wide text-[#999]">Ngày nhận</label>
                  <input
                    type="date"
                    value={rentalStartDate}
                    min={today}
                    onChange={handleStartDateChange}
                    className="w-full border border-[#cfc4c5] bg-white px-2 py-1.5 text-[11px] focus:border-black focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[9px] uppercase tracking-wide text-[#999]">Ngày trả</label>
                  <input
                    type="date"
                    value={rentalEndDate}
                    min={
                      rentalStartDate
                        ? getLocalDateString(new Date(new Date(rentalStartDate).getTime() + 86400000))
                        : today
                    }
                    onChange={handleEndDateChange}
                    className="w-full border border-[#cfc4c5] bg-white px-2 py-1.5 text-[11px] focus:border-black focus:outline-none"
                  />
                </div>
                {dateError && <p className="col-span-2 text-[10px] text-red-500">{dateError}</p>}
              </div>
            )}

            <div className="mt-auto flex flex-col gap-2 pt-4">
              {onAddToCart && (
                <button
                  disabled={!available}
                  onClick={() => onAddToCart(buildCartItem())}
                  className={`w-full border px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.16em] transition ${
                    available
                      ? 'border-black text-black hover:bg-black hover:text-white'
                      : 'cursor-not-allowed border-[#eeeeee] bg-[#eeeeee] text-[#999999]'
                  }`}
                >
                  Thêm vào giỏ hàng
                </button>
              )}
              {onRentNow && (
                <button
                  disabled={!available}
                  onClick={() => {
                    if (!canRentNow) {
                      setShowDates(true);
                      return;
                    }

                    onRentNow({
                      ...buildCartItem(),
                      rentalStartDate,
                      rentalEndDate,
                    });
                  }}
                  className={`w-full px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.16em] transition ${
                    available
                      ? 'bg-[#99854e] text-white hover:bg-black'
                      : 'cursor-not-allowed bg-[#eeeeee] text-[#999999]'
                  }`}
                >
                  Thuê ngay
                </button>
              )}
            </div>
          </>
        ) : (
          <div className="mt-auto pt-4">
            <button
              onClick={() => onNavigate?.('productDetail', product)}
              className="w-full border border-black px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-black transition hover:bg-black hover:text-white"
            >
              Xem chi tiết
            </button>
          </div>
        )}
      </div>
    </article>
  );
}
