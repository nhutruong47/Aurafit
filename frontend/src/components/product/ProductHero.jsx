// Hero chi tiet san pham voi gia, thong tin va hanh dong them vao gio.
import { useState } from 'react';
import { formatCurrency } from '../../utils/formatCurrency';
import { fallbackProductImage, toCartItem } from '../../utils/productMapper';
import { adminContact } from '../../utils/shopMock';

export default function ProductHero({
  product,
  selectedItem,
  onSelectItem,
  isLoading = false,
  isAddingToCart = false,
  onAddToCart,
  onRentNow,
  onNavigate,
  rentalStartDate,
  rentalEndDate,
  onStartDateChange,
  onEndDateChange,
}) {
  const today = new Date().toISOString().split('T')[0];
  const [dateError, setDateError] = useState('');
  const [showSizeSelector, setShowSizeSelector] = useState(false);

  const availableItems = product?.items || [];

  if (!product) return null;

  const sellerName = product.sellerName || product.owner?.fullName || product.owner?.email || adminContact.name;
  const sellerEmail = product.sellerEmail || product.owner?.email || '';

  const handleSelectItem = (item) => {
    onSelectItem?.(item);
  };

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

  const canRentNow = product.available && rentalStartDate && rentalEndDate && !dateError;

  const handleRentNow = () => {
    if (!canRentNow) return;
    const item = selectedItem || product.items?.[0] || null;
    const itemWithDates = {
      ...toCartItem(product, item),
      rentalStartDate,
      rentalEndDate,
    };
    onRentNow?.(itemWithDates);
  };

  return (
    <div className="flex flex-col gap-12 border border-[#cfc4c5] bg-white p-6 md:flex-row md:p-12">
      <div className="w-full overflow-hidden border border-[#cfc4c5]/20 bg-[#f9f9f9] md:w-1/2">
        <div className="aspect-[3/4]">
          <img
            src={product.image}
            alt={product.name}
            onError={(event) => {
              event.currentTarget.src = fallbackProductImage;
            }}
            className="h-full w-full object-cover"
          />
        </div>
      </div>

      <div className="flex w-full flex-col md:w-1/2">
        <div className="mb-4">
          <span className="mr-2 rounded-full bg-[#f0f0f0] px-3 py-1 text-xs font-semibold uppercase tracking-wider text-black">
            {product.category}
          </span>
          {product.tag && (
            <span className="rounded-full bg-[#99854e] px-3 py-1 text-xs font-semibold uppercase tracking-wider text-white">
              {product.tag}
            </span>
          )}
        </div>

        <h1 className="mb-2 font-serif text-3xl text-black md:text-5xl">{product.name}</h1>
        <p className="mb-8 text-sm text-[#777777]">{product.subcategory}</p>

        <div className="mb-10 grid grid-cols-2 gap-6 border-y border-[#cfc4c5]/30 py-6">
          <div>
            <div className="mb-2 flex items-center gap-3">
              <span className="text-[11px] uppercase tracking-[0.2em] text-[#999999]">Giá thuê</span>
              <span className="border border-[#99854e] px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-[#99854e]">
                Ưu đãi 20%
              </span>
            </div>
            <div className="flex items-baseline gap-3">
              <span className="font-serif text-3xl text-black">{formatCurrency(product.priceValue)}</span>
              <span className="font-serif text-xl text-[#cfc4c5] line-through">
                {formatCurrency(Math.round(product.priceValue * 1.25))}
              </span>
            </div>
          </div>
          <div>
            <span className="mb-2 block text-[11px] uppercase tracking-[0.2em] text-[#999999]">Tiền cọc</span>
            <span className="font-serif text-3xl text-[#99854e]">{formatCurrency(product.depositValue)}</span>
          </div>
        </div>

        {/* Size / Color Selector */}
        {availableItems.length > 0 && (
          <div className="mb-6">
            <button
              type="button"
              onClick={() => setShowSizeSelector((v) => !v)}
              className="flex w-full items-center justify-between border border-[#cfc4c5] px-4 py-2 text-left"
            >
              <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#5f5e5e]">
                {selectedItem ? `Size: ${selectedItem.size || 'Freesize'}${selectedItem.color ? ` / ${selectedItem.color}` : ''}` : 'Chọn size'}
              </span>
              <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#99854e]">
                {showSizeSelector ? 'Thu gọn' : 'Chọn size'}
              </span>
            </button>
            {showSizeSelector && (
              <div className="mt-2 flex flex-wrap gap-2">
                {availableItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      handleSelectItem(item);
                      setShowSizeSelector(false);
                    }}
                    className={`border px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider transition-all ${
                      selectedItem?.id === item.id
                        ? 'border-black bg-black text-white'
                        : 'border-[#cfc4c5] bg-white text-black hover:border-black'
                    }`}
                  >
                    {item.size || 'Freesize'}
                    {item.color ? ` / ${item.color}` : ''}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Rental Date Picker */}
        <div className="mb-6">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#5f5e5e]">Thời gian thuê</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-[10px] uppercase tracking-wide text-[#999]">Ngày nhận</label>
              <input
                type="date"
                value={rentalStartDate}
                min={today}
                onChange={handleStartDateChange}
                className="w-full border border-[#cfc4c5] bg-white px-3 py-2 text-sm focus:border-black focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-[10px] uppercase tracking-wide text-[#999]">Ngày trả</label>
              <input
                type="date"
                value={rentalEndDate}
                min={rentalStartDate ? new Date(new Date(rentalStartDate).getTime() + 86400000).toISOString().split('T')[0] : today}
                onChange={handleEndDateChange}
                className="w-full border border-[#cfc4c5] bg-white px-3 py-2 text-sm focus:border-black focus:outline-none"
              />
            </div>
          </div>
          {dateError && <p className="mt-1 text-xs text-red-500">{dateError}</p>}
        </div>

        <div className="mb-10">
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-[0.1em] text-black">Mô tả sản phẩm</h3>
          <p className="text-base leading-7 text-[#5f5e5e]">
            {product.description || 'Trang phục cao cấp mang đến trải nghiệm nổi bật cho sự kiện của bạn. Thiết kế tỉ mỉ, chất liệu chỉn chu và kiểu dáng ấn tượng giúp bạn tỏa sáng ở mọi góc nhìn.'}
          </p>
        </div>

        <div className="mb-8 flex items-center justify-between gap-4 border border-[#cfc4c5] bg-[#f9f9f9] p-5">
          <div className="flex items-center gap-4">
            <img
              src={adminContact.avatar}
              alt={sellerName}
              className="h-14 w-14 rounded-full border border-[#cfc4c5]/50 object-cover"
            />
            <div>
              <h4 className="font-serif text-lg font-bold">{sellerName}</h4>
              <div className="mt-1 flex items-center gap-2 text-xs text-[#5f5e5e]">
                <span className="flex items-center text-[#99854e]">
                  <span className="material-symbols-outlined text-xs" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                  {adminContact.rating}
                </span>
                <span>•</span>
                <span>{sellerEmail || adminContact.address.split(',').slice(-2).join(', ').trim()}</span>
              </div>
            </div>
          </div>
          <button
            onClick={() => onNavigate?.('chat', product)}
            className="border border-black px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.15em] text-black transition-all duration-300 hover:bg-black hover:text-white"
          >
            Chatbot tư vấn
          </button>
        </div>

        <div className="mt-auto">
          <div className="mb-4">
            <span
              className={`inline-block rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-wider ${
                product.available
                  ? 'border-green-200 bg-green-50 text-green-700'
                  : 'border-red-200 bg-red-50 text-red-700'
              }`}
            >
              {product.available ? `Tình trạng: Còn hàng (${product.availableItemCount})` : 'Tình trạng: Hết hàng'}
            </span>
          </div>

          <button
            disabled={!product.available || isLoading || isAddingToCart}
            onClick={onAddToCart}
            className={`mb-3 w-full border border-black py-4 text-[13px] font-semibold uppercase tracking-[0.2em] transition-all duration-300 hover:bg-black hover:text-white ${
              !product.available || isLoading || isAddingToCart
                ? 'cursor-not-allowed border-[#eeeeee] bg-[#eeeeee] text-[#999999]'
                : ''
            }`}
          >
            {isAddingToCart ? 'Đang thêm...' : isLoading ? 'Đang tải...' : !product.available ? 'Tạm hết hàng' : 'Thêm vào giỏ hàng'}
          </button>
          <button
            disabled={!canRentNow || isAddingToCart}
            onClick={handleRentNow}
            className={`mb-3 w-full py-4 text-[13px] font-semibold uppercase tracking-[0.2em] transition-all duration-300 ${
              canRentNow && !isAddingToCart
                ? 'bg-[#99854e] text-white hover:bg-black'
                : 'cursor-not-allowed bg-[#eeeeee] text-[#999999]'
            }`}
          >
            Thuê ngay {!canRentNow && !isAddingToCart && product.available && (
              <span className="ml-1 font-normal normal-case tracking-normal text-white/60">
                (Hãy chọn ngày thuê)
              </span>
            )}
          </button>
          <button
            onClick={() => onNavigate?.('chat', product)}
            className="w-full border border-black py-3 text-[12px] font-semibold uppercase tracking-[0.2em] text-black transition-all duration-300 hover:bg-black hover:text-white"
          >
            Chatbot tư vấn
          </button>
        </div>
      </div>
    </div>
  );
}
