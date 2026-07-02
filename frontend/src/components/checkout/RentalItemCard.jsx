import { useState } from 'react';
import { Link } from 'react-router-dom';

export default function RentalItemCard({
  item,
  delay,
  showCheckbox = false,
  isChecked = false,
  isProblematic = false,
  onToggleCheck,
  onRemoveFromCart,
  onUpdateCartItem,
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editStartDate, setEditStartDate] = useState(item.rentalStartDate || '');
  const [editEndDate, setEditEndDate] = useState(item.rentalEndDate || '');
  const [isUpdating, setIsUpdating] = useState(false);

  const productLink = item.costumeId && item.costumeId !== 'undefined' ? '/products/' + item.costumeId : '#';

  if (!item.costumeId || item.costumeId === 'undefined') {
    console.warn(`[RentalItemCard] Warning: costumeId is missing for cart item: ${item.name}`, item);
  }

  const handleSaveUpdate = async () => {
    if (!editStartDate || !editEndDate || !onUpdateCartItem) return;
    if (editStartDate >= editEndDate) return;

    setIsUpdating(true);
    try {
      await onUpdateCartItem(item.cartItemId, item.id, {
        rentalStartDate: editStartDate,
        rentalEndDate: editEndDate,
      });
      setIsEditing(false);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancelEdit = () => {
    setEditStartDate(item.rentalStartDate || '');
    setEditEndDate(item.rentalEndDate || '');
    setIsEditing(false);
  };

  const imageElement = (
    <img
      className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
      src={item.image}
      alt={item.name}
    />
  );

  const titleElement = (
    <h3 className="font-serif text-3xl font-normal uppercase tracking-tight">{item.name}</h3>
  );

  return (
    <article
      className={`group relative flex flex-row py-6 border-b border-gray-200 items-start gap-6 transition-colors ${
        isProblematic ? 'bg-red-50' : 'bg-transparent'
      }`}
      style={{ animation: `fadeIn 0.5s ease-out ${delay * 0.1}s both` }}
    >
      {showCheckbox && (
        <div className="absolute left-2 top-8 z-10 flex h-6 w-6 items-center justify-center bg-white shadow-sm border border-gray-100">
          <input
            type="checkbox"
            checked={isChecked}
            onChange={(e) => onToggleCheck?.(e.target.checked)}
            className="h-4 w-4 cursor-pointer accent-black"
            aria-label={`Chọn ${item.name}`}
          />
        </div>
      )}

      {/* Left: Thumbnail */}
      <div className="relative w-24 h-32 md:w-28 md:h-36 flex-shrink-0 bg-gray-100 overflow-hidden">
        {productLink ? (
          <Link to={productLink} className="block h-full w-full">
            {imageElement}
          </Link>
        ) : (
          imageElement
        )}
        {item.badge && (
          <div className="absolute bottom-1 left-1 bg-[#99854e] px-1.5 py-0.5 text-[9px] font-semibold uppercase text-white">
            {item.badge}
          </div>
        )}
      </div>

      {/* Middle: Content Restructuring */}
      <div className="flex flex-col flex-1 gap-1 min-w-0 py-1">
        {/* Title */}
        {productLink ? (
          <Link to={productLink} className="hover:text-[#99854e] transition-colors truncate">
            <h3 className="uppercase font-serif tracking-wide text-base md:text-lg text-black truncate">{item.name}</h3>
          </Link>
        ) : (
          <h3 className="uppercase font-serif tracking-wide text-base md:text-lg text-black truncate">{item.name}</h3>
        )}

        {/* Variant & Quantity */}
        <p className="text-sm text-gray-500 mt-1 truncate">
          {item.size ? `Size ${item.size}` : 'Freesize'} 
          {item.tone ? ` • ${item.tone}` : ''} 
          <span className="mx-2">|</span> 
          Số lượng: {item.quantity || 1}
        </p>

        {/* Rental Time */}
        <div className="mt-2 text-sm text-gray-600">
          {isEditing ? (
             <div className="mt-2 p-2 bg-gray-50 border border-gray-200 text-xs space-y-2">
                <div className="flex items-center gap-2">
                  <label className="w-16 font-medium">Từ ngày:</label>
                  <input
                    type="date"
                    value={editStartDate}
                    onChange={(e) => setEditStartDate(e.target.value)}
                    className="border px-1 py-0.5 w-full focus:outline-none focus:border-black"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="w-16 font-medium">Đến ngày:</label>
                  <input
                    type="date"
                    value={editEndDate}
                    onChange={(e) => setEditEndDate(e.target.value)}
                    className="border px-1 py-0.5 w-full focus:outline-none focus:border-black"
                  />
                </div>
                {editStartDate && editEndDate && editStartDate >= editEndDate && (
                  <p className="text-red-500 text-[10px]">Ngày kết thúc phải sau ngày bắt đầu</p>
                )}
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={handleSaveUpdate}
                    disabled={isUpdating || !editStartDate || !editEndDate || editStartDate >= editEndDate}
                    className="bg-black text-white px-2 py-1 disabled:opacity-50 uppercase tracking-wider text-[10px]"
                  >
                    {isUpdating ? 'Đang lưu...' : 'Lưu'}
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    disabled={isUpdating}
                    className="bg-gray-200 text-gray-700 px-2 py-1 uppercase tracking-wider text-[10px]"
                  >
                    Hủy
                  </button>
                </div>
             </div>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              <span className="material-symbols-outlined text-[16px] text-gray-400">calendar_month</span>
              {item.period ? (
                <span>{item.period}</span>
              ) : (
                <span className="italic text-red-500 text-xs">Vui lòng chọn ngày thuê</span>
              )}
              <button
                onClick={() => setIsEditing(true)}
                className="text-sm underline text-gray-400 hover:text-black ml-1 transition-colors"
              >
                Chỉnh sửa
              </button>
            </div>
          )}
          
          {item.multiplier && item.multiplier > 1 && !isEditing && (
            <p className="text-xs text-gray-400 mt-0.5 ml-6">
              Hệ số thuê: {item.multiplier.toFixed(1)}x ({item.rentalDays} ngày)
            </p>
          )}
        </div>
      </div>

      {/* Right: Pricing & Actions */}
      <div className="flex flex-col justify-between items-end min-w-[120px] h-full py-1 self-stretch">
        {/* Delete button */}
        <button
          onClick={() => onRemoveFromCart?.(item.id)}
          className="text-gray-400 hover:text-black transition-colors"
          aria-label="Xóa sản phẩm"
        >
          <span className="material-symbols-outlined text-[18px]">close</span>
        </button>

        <div className="flex-1" />

        {/* Price Breakdown */}
        <div className="text-xs text-gray-500 uppercase tracking-wider flex flex-col items-end gap-1 mb-2 mt-4">
          <div className="flex justify-between w-full min-w-[100px] gap-2">
            <span>Thuê:</span>
            <span>{item.rentalFeeFormatted || item.total}</span>
          </div>
          <div className="flex justify-between w-full min-w-[100px] gap-2">
            <span>Cọc:</span>
            <span>{item.depositFormatted || '—'}</span>
          </div>
        </div>

        {/* Total Price */}
        <div className="text-lg font-serif font-medium text-black mt-2">
          {item.total}
        </div>
      </div>
    </article>
  );
}
