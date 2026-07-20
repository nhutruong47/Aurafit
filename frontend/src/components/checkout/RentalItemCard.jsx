// Rental Item Card — Luxury Editorial horizontal layout with inline qty controls.
// "Chỉnh sửa" link opens the CartItemEditModal for full variant/date editing.
import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { updateCartQuantity } from '../../store/cartSlice';
import { useToastStore } from '../../store/useToastStore';
import CartItemEditModal from './CartItemEditModal';

export default function RentalItemCard({
  item,
  delay,
  showCheckbox = false,
  isChecked = false,
  isProblematic = false,
  onToggleCheck,
  onRemoveFromCart,
}) {
  const dispatch = useDispatch();
  const addToast = useToastStore((s) => s.addToast);
  const cartItems = useSelector((state) => state.cart.items);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const productLink = item.costumeId && item.costumeId !== 'undefined' ? '/products/' + item.costumeId : '#';

  // ── Stock validation for inline quantity ──
  const availableStock = item.availableStock || 0;
  const inCartQtyOthers = cartItems
    .filter((ci) => {
      if (ci.cartId === item.cartId) return false;
      return ci.costumeId === item.costumeId &&
        (ci.size || '') === (item.size || '') &&
        (ci.color || '') === (item.color || '');
    })
    .reduce((sum, ci) => sum + (ci.quantity || 1), 0);
  const effectiveStock = Math.max(0, availableStock - inCartQtyOthers);

  const handleQtyChange = (delta) => {
    const currentQty = item.quantity || 1;
    const newQty = currentQty + delta;
    if (newQty < 1) return;
    if (delta > 0 && newQty > effectiveStock && effectiveStock > 0) {
      addToast('Vượt quá số lượng tồn kho khả dụng', 'error');
      return;
    }
    dispatch(updateCartQuantity({ cartId: item.cartId, quantity: newQty }));
  };

  const imageElement = (
    <img
      className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
      src={item.image}
      alt={item.name}
    />
  );

  return (
    <>
      <article
        className={`group relative flex flex-row items-start gap-5 border-b border-[#e8e4e3] py-5 transition-colors ${
          isProblematic ? 'bg-red-50' : 'bg-transparent'
        }`}
        style={{ animation: `fadeIn 0.5s ease-out ${delay * 0.1}s both` }}
      >
        {showCheckbox && (
          <div className="absolute left-2 top-7 z-10 flex h-6 w-6 items-center justify-center border border-[#e8e4e3] bg-white">
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
        <div className="relative h-28 w-20 flex-shrink-0 overflow-hidden border border-[#e8e4e3] bg-[#f5f4f3] md:h-32 md:w-24">
          {productLink !== '#' ? (
            <Link to={productLink} className="block h-full w-full">{imageElement}</Link>
          ) : (
            imageElement
          )}
          {item.badge && (
            <div className="absolute bottom-1 left-1 bg-[#99854e] px-1.5 py-0.5 text-[9px] font-semibold uppercase text-white">
              {item.badge}
            </div>
          )}
        </div>

        {/* Middle: Content */}
        <div className="flex min-w-0 flex-1 flex-col gap-1 py-0.5">
          {/* Title */}
          {productLink !== '#' ? (
            <Link to={productLink} className="truncate transition-colors hover:text-[#99854e]">
              <h3 className="truncate font-serif text-base uppercase tracking-wide text-black md:text-lg">{item.name}</h3>
            </Link>
          ) : (
            <h3 className="truncate font-serif text-base uppercase tracking-wide text-black md:text-lg">{item.name}</h3>
          )}

          {/* Variant */}
          <p className="truncate text-xs text-[#777]">
            {item.size ? `Size ${item.size}` : 'Freesize'}
            {item.color ? ` · ${item.color}` : ''}
          </p>

          {/* Inline Quantity Control */}
          <div className="mt-2 flex items-center gap-3">
            <div className="flex h-8 items-center border border-[#cfc4c5]">
              <button
                onClick={() => setIsEditModalOpen(true)}
                className="flex h-full w-8 items-center justify-center text-black hover:bg-[#f9f9f9] transition"
              >
                <span className="material-symbols-outlined text-[14px]">remove</span>
              </button>
              <span 
                className="flex h-full w-9 items-center justify-center border-x border-[#cfc4c5] text-xs font-medium cursor-pointer hover:bg-gray-50"
                onClick={() => setIsEditModalOpen(true)}
                title="Sửa số lượng"
              >
                {item.quantity || 1}
              </span>
              <button
                onClick={() => setIsEditModalOpen(true)}
                className="flex h-full w-8 items-center justify-center text-black hover:bg-[#f9f9f9] transition"
              >
                <span className="material-symbols-outlined text-[14px]">add</span>
              </button>
            </div>

            {effectiveStock > 0 && (
              <span className="text-[10px] text-[#999]">Tối đa: {effectiveStock}</span>
            )}
          </div>

          {/* Rental Time + Edit link */}
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-[#777]">
            <span className="material-symbols-outlined text-[14px] text-[#ccc]">calendar_month</span>
            {item.period ? (
              <span>{item.period}</span>
            ) : (
              <span className="text-[10px] italic text-red-500">Vui lòng chọn ngày thuê</span>
            )}
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="ml-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-[#99854e] underline transition hover:text-black"
            >
              Chỉnh sửa
            </button>
          </div>

          {item.multiplier && item.multiplier > 1 && (
            <p className="ml-5 mt-0.5 text-[10px] text-[#999]">
              Hệ số thuê: {item.multiplier.toFixed(1)}x ({item.rentalDays} ngày)
            </p>
          )}
        </div>

        {/* Right: Pricing & Actions */}
        <div className="flex min-w-[110px] flex-col items-end justify-between self-stretch py-0.5">
          {/* Delete button */}
          <button
            onClick={() => onRemoveFromCart?.(item.id)}
            className="text-[#ccc] transition-colors hover:text-black"
            aria-label="Xóa sản phẩm"
          >
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>

          <div className="flex-1" />

          {/* Price Breakdown */}
          <div className="mb-1 flex flex-col items-end gap-0.5 text-[10px] uppercase tracking-wider text-[#999]">
            <div className="flex w-full min-w-[100px] justify-between gap-2">
              <span>Thuê:</span>
              <span>{item.rentalFeeFormatted || item.total}</span>
            </div>
            <div className="flex w-full min-w-[100px] justify-between gap-2">
              <span>Cọc:</span>
              <span>{item.depositFormatted || '—'}</span>
            </div>
          </div>

          {/* Total Price */}
          <div className="mt-1 font-serif text-base font-medium text-black">
            {item.total}
          </div>
        </div>
      </article>

      {/* Edit Modal */}
      <CartItemEditModal
        item={item}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSaved={() => {}}
      />
    </>
  );
}
