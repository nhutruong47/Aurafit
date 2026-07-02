// The san pham dung trong danh sach catalog.
import { useCallback, useEffect, useState } from 'react';
import { formatCurrency } from '../../utils/formatCurrency';
import { fallbackProductImage, toCartItem } from '../../utils/productMapper';
import { fetchCostumeItems } from '../../services/costumeService';

const extractCategoryName = (value) => {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'object' && value.name) return value.name;
  return '';
};

export default function CatalogProductCard({ costume, onNavigate, onAddToCart, onRentNow }) {
  const getLocalDateString = (dateInput = new Date()) => {
    const d = new Date(dateInput);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  const today = getLocalDateString();

  const [items, setItems] = useState(() => costume.items || []);
  const [selectedItem, setSelectedItem] = useState(() => costume.items?.[0] || null);
  const [showDates, setShowDates] = useState(false);
  const [rentalStartDate, setRentalStartDate] = useState(() => getLocalDateString(0));
  const [rentalEndDate, setRentalEndDate] = useState(() => getLocalDateString(1));
  const [dateError, setDateError] = useState('');

  const categoryLabel = extractCategoryName(costume.category);
  const subcategoryLabel = extractCategoryName(costume.subcategory);
  const available = costume.available;

  // Neu items chua duoc load tu API, fetch ngay
  useEffect(() => {
    if ((!costume.items || costume.items.length === 0) && costume.id) {
      fetchCostumeItems(costume.id)
        .then((fetched) => {
          if (fetched && fetched.length > 0) {
            setItems(fetched);
            setSelectedItem((prev) => prev || fetched[0]);
          }
        })
        .catch(() => {});
    }
  }, [costume.id, costume.items]);

  const handleStartDateChange = (e) => {
    const val = e.target.value;
    setRentalStartDate(val);
    setDateError('');
    if (rentalEndDate && val >= rentalEndDate) setRentalEndDate('');
  };

  const handleEndDateChange = (e) => {
    const val = e.target.value;
    if (rentalStartDate && val <= rentalStartDate) {
      setDateError('Ngày trả phải sau ngày nhận.');
      return;
    }
    setRentalEndDate(val);
    setDateError('');
  };

  const buildCartItem = useCallback(() => {
    if (selectedItem) {
      return {
        ...toCartItem(costume, selectedItem),
        rentalStartDate,
        rentalEndDate,
      };
    }
    return {
      id: costume.id,
      costumeId: costume.id,
      costumeItemId: null,
      name: costume.name,
      meta: costume.tag || '',
      rawCategory: categoryLabel,
      category: categoryLabel,
      subcategory: subcategoryLabel,
      tag: costume.tag,
      price: costume.price,
      priceValue: costume.priceValue,
      deposit: costume.deposit,
      depositValue: costume.depositValue,
      image: costume.image,
      sku: null,
      size: null,
      color: null,
      rentalStartDate,
      rentalEndDate,
    };
  }, [costume, selectedItem, categoryLabel, subcategoryLabel, rentalStartDate, rentalEndDate]);

  const handleAddToCart = useCallback(() => {
    onAddToCart?.(buildCartItem());
  }, [buildCartItem, onAddToCart]);

  const canRentNow = available && rentalStartDate && rentalEndDate && !dateError;

  const handleRentNow = useCallback(() => {
    if (!canRentNow) { setShowDates(true); return; }
    onRentNow?.(buildCartItem());
  }, [canRentNow, buildCartItem, onRentNow]);

  return (
    <article
      className="group relative cursor-pointer overflow-hidden border border-[#cfc4c5] bg-white transition-all duration-500 hover:border-[#99854e]/50"
    >
      <div
        onClick={() => onNavigate?.('productDetail', costume)}
        className="relative h-64 overflow-hidden"
      >
        <img
          src={costume.image}
          alt={costume.name}
          onError={(event) => {
            event.currentTarget.src = fallbackProductImage;
          }}
          className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-black/20" />

        <div className="absolute top-3 left-3 flex flex-col items-start gap-2">
          <span className="rounded-full border border-white/10 bg-black/50 px-3 py-1 text-xs font-semibold text-white backdrop-blur-md">
            {categoryLabel}
          </span>
          {costume.tag && (
            <span className="rounded-sm border border-white/20 bg-white/20 px-2 py-0.5 text-[10px] uppercase tracking-wider text-white backdrop-blur-md">
              {costume.tag}
            </span>
          )}
        </div>

        <div className="absolute top-3 right-3">
          <span
            className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider backdrop-blur-md ${
              available
                ? 'border-green-500/30 bg-green-500/20 text-green-100'
                : 'border-red-500/30 bg-red-500/20 text-red-100'
            }`}
          >
            {available ? 'Còn hàng' : 'Hết hàng'}
          </span>
        </div>

        <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <button className="border border-white/30 bg-white/20 px-5 py-2.5 text-[11px] font-semibold uppercase tracking-widest text-white backdrop-blur-sm transition-colors duration-200 hover:bg-white/30">
            Xem chi tiết
          </button>
        </div>
      </div>

      <div className="p-5">
        <h3 className="mb-1 line-clamp-1 text-base font-semibold text-black transition-colors duration-300 group-hover:text-[#99854e]">
          {costume.name}
        </h3>
        <p className="mb-4 line-clamp-1 text-[11px] text-[#777777]">{subcategoryLabel} • {costume.tag}</p>

        <div className="mb-4 grid grid-cols-2 gap-4">
          <div>
            <span className="mb-1 block text-[10px] uppercase tracking-wider text-[#999999]">Giá thuê</span>
            <span className="font-serif text-xl text-black">{formatCurrency(costume.priceValue)}</span>
          </div>
          <div>
            <span className="mb-1 block text-[10px] uppercase tracking-wider text-[#999999]">Tiền cọc</span>
            <span className="font-serif text-xl text-black">{formatCurrency(costume.depositValue)}</span>
          </div>
        </div>

        {/* Date picker toggle */}
        <button
          onClick={() => setShowDates((v) => !v)}
          className="mb-3 flex w-full items-center justify-between text-[10px] font-semibold uppercase tracking-[0.14em] text-[#99854e] hover:underline"
        >
          <span>{showDates ? '▼ Ẩn ngày thuê' : '▶  Chọn ngày thuê'}</span>
        </button>

        {showDates && (
          <div className="mb-3 grid grid-cols-2 gap-2">
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
                min={rentalStartDate ? getLocalDateString(new Date(new Date(rentalStartDate).getTime() + 86400000)) : today}
                onChange={handleEndDateChange}
                className="w-full border border-[#cfc4c5] bg-white px-2 py-1.5 text-[11px] focus:border-black focus:outline-none"
              />
            </div>
            {dateError && <p className="col-span-2 text-[10px] text-red-500">{dateError}</p>}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col gap-2">
          <button
            disabled={!available}
            onClick={handleAddToCart}
            className={`w-full px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] transition-all duration-300 active:scale-95 ${
              available
                ? 'border border-black text-black hover:bg-black hover:text-white'
                : 'cursor-not-allowed border border-[#eeeeee] bg-[#eeeeee] text-[#999999]'
            }`}
          >
            Thêm vào giỏ hàng
          </button>
          <button
            disabled={!available}
            onClick={handleRentNow}
            className={`w-full px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] transition-all duration-300 active:scale-95 ${
              available
                ? 'bg-[#99854e] text-white hover:bg-black'
                : 'cursor-not-allowed bg-[#eeeeee] text-[#999999]'
            }`}
          >
            Thuê ngay
          </button>
        </div>
      </div>
    </article>
  );
}
