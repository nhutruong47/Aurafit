// The chi tiet mot mon do trong gio thue, gom size, so luong va tong tien.
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
}) {
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
        <img
          className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
          src={item.image}
          alt={item.name}
        />
        <div className="absolute left-3 top-3 z-10 bg-[#99854e] px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-white">
          {item.badge}
        </div>
      </div>

      <div className={`flex h-full flex-1 flex-col justify-between py-2${showCheckbox ? ' md:ml-10' : ''}`}>
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-6">
            <div className="flex-1">
              <h3 className="font-serif text-3xl font-normal uppercase tracking-tight">{item.name}</h3>
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
              <p className="mt-1 italic">{item.period}</p>
            </div>
            <div>
              <p className="text-[12px] font-semibold uppercase tracking-[0.15em] text-[#999999]">
                {item.detailLabel}
              </p>
              <p className="mt-1">{item.detail}</p>
            </div>
          </div>
        </div>

        <div className="mt-8 flex items-end justify-between border-t border-[#cfc4c5] pt-8">
          <div className="space-y-1">
            <p className="text-[12px] font-semibold uppercase tracking-[0.15em] text-[#999999]">Thành tiền</p>
            <p className="font-serif text-3xl">
              <span className="mr-2 text-xl text-[#999999] line-through">{item.original}</span>
              {item.total}
            </p>
            {item.quantity > 1 && (
              <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#99854e]">
                Số lượng x {item.quantity}
              </p>
            )}
          </div>
          <button className="border border-black px-4 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] transition hover:bg-black hover:text-white">
            Chỉnh sửa thời gian thuê
          </button>
        </div>
      </div>
    </article>
  );
}
