// The san pham trong danh sach Shop.
import { useCallback, useEffect, useState } from 'react';
import { fallbackProductImage, toCartItem } from '../../utils/productMapper';
import { formatCurrency } from '../../utils/formatCurrency';
import { fetchCostumeItems } from '../../services/costumeService';

export default function ShopProductCard({ product, onNavigate, onAddToCart, onRentNow }) {
  const today = new Date().toISOString().split('T')[0];
  const [items, setItems] = useState(() => product.items || []);
  const [selectedItem, setSelectedItem] = useState(() => product.items?.[0] || null);
  const [showDates, setShowDates] = useState(false);
  const [rentalStartDate, setRentalStartDate] = useState(today);
  const [rentalEndDate, setRentalEndDate] = useState('');
  const [dateError, setDateError] = useState('');

  const available = product.available;

  // Neu items chua duoc load tu API, fetch ngay
  useEffect(() => {
    if ((!product.items || product.items.length === 0) && product.id) {
      fetchCostumeItems(product.id)
        .then((fetched) => {
          if (fetched && fetched.length > 0) {
            setItems(fetched);
            setSelectedItem((prev) => prev || fetched[0]);
          }
        })
        .catch(() => {});
    }
  }, [product.id, product.items]);

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

  const canRentNow = available && rentalStartDate && rentalEndDate && !dateError;

  const buildCartItem = useCallback(() => {
    if (selectedItem) {
      return { ...toCartItem(product, selectedItem) };
    }
    // Fallback: dung costume-level data khi chua co item nao
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
      deposit: product.deposit,
      image: product.image,
      sku: null,
      size: null,
      color: null,
      rentalStartDate,
      rentalEndDate,
    };
  }, [product, selectedItem, rentalStartDate, rentalEndDate]);

  const handleRentNow = () => {
    if (!canRentNow) { setShowDates(true); return; }
    const itemWithDates = {
      ...buildCartItem(),
      rentalStartDate,
      rentalEndDate,
    };
    onRentNow?.(itemWithDates);
  };

  const handleAddToCart = () => {
    const cartItem = buildCartItem();
    onAddToCart?.(cartItem);
  };

  return (
    <article className="group flex flex-col border border-[#cfc4c5] bg-white transition hover:border-[#99854e]">
      {/* Image */}
      <div
        onClick={() => onNavigate?.('productDetail', product)}
        className="relative aspect-[3/4] cursor-pointer overflow-hidden bg-[#eeeeee]"
      >
        <img
          src={product.image}
          alt={product.name}
          onError={(e) => { e.currentTarget.src = fallbackProductImage; }}
          className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
        />
        <span className="absolute left-3 top-3 z-10 bg-black px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-white">
          {product.category}
        </span>
        <span className={`absolute right-3 top-3 z-10 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] ${
          available ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        }`}>
          {available ? 'Còn hàng' : 'Tạm hết'}
        </span>
      </div>

      {/* Info */}
      <div className="flex flex-1 flex-col p-5">
        <div onClick={() => onNavigate?.('productDetail', product)} className="cursor-pointer">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#99854e]">
            {product.subcategory || product.rawCategory}{product.tag ? ` | ${product.tag}` : ''}
          </p>
          <h3 className="line-clamp-2 min-h-[48px] font-serif text-2xl italic leading-tight transition group-hover:text-[#99854e]">
            {product.name}
          </h3>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#999999]">Giá thuê</p>
            <p className="mt-1 font-medium">{formatCurrency(product.priceValue)}</p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#999999]">Tiền cọc</p>
            <p className="mt-1 font-medium">{formatCurrency(product.depositValue)}</p>
          </div>
        </div>

        {/* Date Picker (collapsible) */}
        <button
          onClick={() => setShowDates((v) => !v)}
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
                min={rentalStartDate ? new Date(new Date(rentalStartDate).getTime() + 86400000).toISOString().split('T')[0] : today}
                onChange={handleEndDateChange}
                className="w-full border border-[#cfc4c5] bg-white px-2 py-1.5 text-[11px] focus:border-black focus:outline-none"
              />
            </div>
            {dateError && <p className="col-span-2 text-[10px] text-red-500">{dateError}</p>}
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-auto flex flex-col gap-2 pt-4">
          <button
            disabled={!available}
            onClick={handleAddToCart}
            className={`w-full px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.16em] transition ${
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
            className={`w-full px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.16em] transition ${
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
