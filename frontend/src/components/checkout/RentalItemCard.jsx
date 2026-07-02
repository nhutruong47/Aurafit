import { useState } from 'react';
import { Link } from 'react-router-dom';

function QuantityControl({ quantity, onDecrease, onIncrease }) {
  return (
    <div className="flex items-center gap-4 border border-[#cfc4c5] bg-[#f3f3f4] px-3 py-1">
      <button onClick={onDecrease} className="text-black transition hover:text-[#99854e]" aria-label="Giảm số lượng">
        <span className="material-symbols-outlined text-sm">remove</span>
      </button>
      <span className="text-sm">{quantity}</span>
      <button onClick={onIncrease} className="text-black transition hover:text-[#99854e]" aria-label="Tăng số lượng">
        <span className="material-symbols-outlined text-sm">add</span>
      </button>
    </div>
  );
}

export default function RentalItemCard({
  item,
  delay,
  showCheckbox = false,
  isChecked = false,
  isProblematic = false,
  onToggleCheck,
  onRemoveFromCart,
  onUpdateCartQuantity,
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
    if (!editStartDate || !editEndDate || !item.cartItemId || !onUpdateCartItem) return;
    if (editStartDate >= editEndDate) return;

    setIsUpdating(true);
    try {
      await onUpdateCartItem(item.cartItemId, {
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
      className={`group relative flex flex-col items-start gap-8 p-4 md:flex-row transition-colors ${
        isProblematic ? 'bg-red-50 border border-red-300' : 'bg-transparent'
      }`}
      style={{ animation: `fadeIn 0.8s ease-out ${delay * 0.1}s both` }}
    >
      {showCheckbox && (
        <div className="absolute left-0 top-0 z-10 flex h-full w-10 items-center justify-center bg-white/80">
          <input
            type="checkbox"
            checked={isChecked}
            onChange={(e) => onToggleCheck?.(e.target.checked)}
            className="h-5 w-5 cursor-pointer accent-[#99854e]"
            aria-label={`Chọn ${item.name}`}
          />
        </div>
      )}

      <div className="relative aspect-[3/4] w-full overflow-hidden bg-[#f7f7f7] md:w-72">
        {productLink ? (
          <Link to={productLink} className="block h-full w-full">
            {imageElement}
          </Link>
        ) : (
          imageElement
        )}
        <div className="absolute left-3 top-3 z-10 bg-[#99854e] px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-white">
          {item.badge}
        </div>
      </div>

      <div className={`flex h-full flex-1 flex-col justify-between py-2${showCheckbox ? ' md:ml-10' : ''}`}>
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-6">
            <div className="flex-1">
              {productLink ? (
                <Link to={productLink} className="hover:text-[#99854e] transition-colors">
                  {titleElement}
                </Link>
              ) : (
                titleElement
              )}
              <p className="mt-1 text-[12px] font-semibold uppercase tracking-[0.15em] text-[#5f5e5e]">{item.tone}</p>
              <p className="mt-1.5 text-xs text-[#99854e]">
                Quản lý bởi: <span className="font-bold">AuraFit Admin</span>
              </p>

              <div className="mt-4 space-y-4">
                {item.sizes.map((size) => (
                  <div key={size.label} className="flex items-center justify-between border-b border-[#cfc4c5] pb-3">
                    <div className="flex flex-col">
                      <span className="text-[12px] font-semibold uppercase tracking-[0.15em]">{size.label}</span>
                      <span className="text-[10px] font-medium text-[#99854e]">{size.stock}</span>
                    </div>
                    <QuantityControl
                      quantity={size.quantity}
                      onDecrease={() => onUpdateCartQuantity?.(item.id, item.quantity - 1)}
                      onIncrease={() => onUpdateCartQuantity?.(item.id, item.quantity + 1)}
                    />
                  </div>
                ))}

                <button className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#99854e] hover:underline">
                  <span className="material-symbols-outlined text-sm">add_circle</span>
                  {item.addText}
                </button>
              </div>
            </div>

            <button
              onClick={() => onRemoveFromCart?.(item.id)}
              className="text-black transition hover:text-[#ba1a1a]"
              aria-label="Xóa sản phẩm"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4">
            <div>
              <p className="text-[12px] font-semibold uppercase tracking-[0.15em] text-[#999999]">Thời gian thuê</p>
              {isEditing ? (
                <div className="mt-2 space-y-2">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#666]">Từ ngày</label>
                    <input
                      type="date"
                      value={editStartDate}
                      onChange={(e) => setEditStartDate(e.target.value)}
                      className="border border-[#cfc4c5] bg-white px-2 py-1 text-sm focus:border-[#99854e] focus:outline-none"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#666]">Đến ngày</label>
                    <input
                      type="date"
                      value={editEndDate}
                      onChange={(e) => setEditEndDate(e.target.value)}
                      className="border border-[#cfc4c5] bg-white px-2 py-1 text-sm focus:border-[#99854e] focus:outline-none"
                    />
                  </div>
                  {editStartDate && editEndDate && editStartDate >= editEndDate && (
                    <p className="text-[10px] text-red-500">Ngày kết thúc phải sau ngày bắt đầu</p>
                  )}
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={handleSaveUpdate}
                      disabled={isUpdating || !editStartDate || !editEndDate || editStartDate >= editEndDate}
                      className="border border-[#99854e] bg-[#99854e] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-[#7a6a3e] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isUpdating ? 'Đang cập nhật...' : 'Cập nhật'}
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      disabled={isUpdating}
                      className="border border-[#cfc4c5] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#666] transition hover:bg-[#f3f3f4]"
                    >
                      Hủy
                    </button>
                  </div>
                </div>
              ) : (
                <p className="mt-1 italic">{item.period}</p>
              )}
            </div>
            <div>
              <p className="text-[12px] font-semibold uppercase tracking-[0.15em] text-[#999999]">
                {item.detailLabel}
              </p>
              <p className="mt-1">{item.detail}</p>
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-col md:flex-row md:items-end justify-between border-t border-[#cfc4c5] pt-8 gap-4">
          <div className="space-y-1">
            <p className="text-[12px] font-semibold uppercase tracking-[0.15em] text-[#999999]">Thành tiền</p>
            <p className="font-serif text-3xl">
              {item.original && <span className="mr-2 text-xl text-[#999999] line-through">{item.original}</span>}
              {item.total}
            </p>
            {item.quantity > 1 && (
              <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#99854e]">
                Số lượng x {item.quantity}
              </p>
            )}
          </div>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="w-full shrink-0 border border-black px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.18em] transition hover:bg-black hover:text-white md:w-auto"
            >
              Chỉnh sửa thời gian thuê
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
