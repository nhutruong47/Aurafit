// Hero chi tiet san pham voi gia, thong tin va hanh dong them vao gio.
import { formatCurrency } from '../../utils/formatCurrency';
import { fallbackProductImage, toCartItem } from '../../utils/productMapper';
import { adminContact } from '../../utils/shopMock';

export default function ProductHero({ product, isAdmin, isLoading = false, isAddingToCart = false, onAddToCart, onNavigate }) {
  if (!product) return null;

  const handleAddToCart = () => {
    if (isAddingToCart) return;
    onAddToCart?.(toCartItem(product));
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
              alt={adminContact.name}
              className="h-14 w-14 rounded-full border border-[#cfc4c5]/50 object-cover"
            />
            <div>
              <h4 className="font-serif text-lg font-bold">{adminContact.name}</h4>
              <div className="mt-1 flex items-center gap-2 text-xs text-[#5f5e5e]">
                <span className="flex items-center text-[#99854e]">
                  <span className="material-symbols-outlined text-xs" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                  {adminContact.rating}
                </span>
                <span>•</span>
                <span>{adminContact.address.split(',').slice(-2).join(', ').trim()}</span>
              </div>
            </div>
          </div>
          <button
            onClick={() => onNavigate?.('chat', product)}
            className="border border-black px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.15em] text-black transition-all duration-300 hover:bg-black hover:text-white"
          >
            Liên hệ Admin
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
              {product.available ? 'Tình trạng: Còn hàng' : 'Tình trạng: Hết hàng'}
            </span>
          </div>

          {isAdmin ? (
            <div className="border border-[#d7d2c8] bg-[#fdfdfb] p-4 text-xs font-semibold uppercase tracking-wider leading-relaxed text-[#7f7041]">
              Tài khoản Admin chỉ hỗ trợ quản trị và theo dõi số liệu, không có tính năng đặt thuê đồ.
            </div>
          ) : (
            <>
              <button
                disabled={!product.available || isLoading || isAddingToCart}
                onClick={handleAddToCart}
                className={`mb-4 w-full py-5 text-[13px] font-semibold uppercase tracking-[0.2em] transition-all duration-300 ${
                  product.available && !isLoading && !isAddingToCart
                    ? 'bg-black text-white hover:bg-[#99854e]'
                    : 'cursor-not-allowed bg-[#eeeeee] text-[#999999]'
                }`}
              >
                {isAddingToCart ? 'Đang thêm...' : isLoading ? 'Đang tải...' : product.available ? 'Thêm vào giỏ hàng' : 'Tạm hết hàng'}
              </button>
              <button
                onClick={() => onNavigate?.('chat', product)}
                className="w-full border border-black py-5 text-[13px] font-semibold uppercase tracking-[0.2em] text-black transition-all duration-300 hover:bg-black hover:text-white"
              >
                Liên hệ Admin
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
