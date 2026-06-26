// Danh sach san pham de nguoi dung chon ngu can tu van trong chat.
const fallbackProductImage = 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=900&q=85';

export default function ChatProductSelector({ products, activeProduct, onSelectProduct }) {
  if (!products.length) return null;

  return (
    <div className="border-b border-[#cfc4c5] bg-white px-6 py-4 md:px-8">
      <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.15em] text-[#99854e]">
        Sản phẩm cần Admin tư vấn
      </p>
      <div className="flex gap-4 overflow-x-auto pb-2">
        {products.map((product) => {
          const isSelected = activeProduct?.name === product.name;
          return (
            <button
              key={product.name}
              onClick={() => onSelectProduct(product.name)}
              className={`flex shrink-0 items-center gap-3 border px-4 py-3 text-left transition ${
                isSelected ? 'border-[#99854e] bg-[#99854e]/5 ring-1 ring-[#99854e]' : 'border-[#cfc4c5]'
              }`}
            >
              <div className="h-12 w-10 flex-shrink-0 overflow-hidden bg-[#eeeeee]">
                <img
                  src={product.image}
                  alt={product.name}
                  onError={(event) => {
                    event.currentTarget.src = fallbackProductImage;
                  }}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="min-w-0">
                <h4 className="w-40 truncate text-xs font-bold">{product.name}</h4>
                <p className="mt-0.5 text-[10px] text-[#5f5e5e]">{product.price}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
