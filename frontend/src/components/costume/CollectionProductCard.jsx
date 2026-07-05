// The san pham dung chung cho cac bo suu tap costume.
import {
  fallbackCostumeImage,
  getCostumeDisplayCategory,
  getCostumeDisplayMeta,
  getCostumeImage,
  getCostumePrice,
  getCostumeSubcategory,
  toCartItemFromCostume,
} from '../../utils/costumeUtils';

export default function CollectionProductCard({
  product,
  index,
  onAddToCart,
  onNavigate,
  buttonInsetClassName = 'inset-x-5 bottom-5',
}) {
  return (
    <article className="group" style={{ animation: `fadeIn 0.7s ease-out ${index * 0.06}s both` }}>
      <div
        className="relative mb-5 aspect-[4/5] cursor-pointer overflow-hidden bg-[#eeeeee]"
        onClick={() => onNavigate?.('productDetail', product)}
      >
        <img
          src={getCostumeImage(product)}
          alt={product.name}
          onError={(event) => {
            event.currentTarget.src = fallbackCostumeImage;
          }}
          className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
        />
        <button
          onClick={(event) => {
            event.stopPropagation();
            onAddToCart?.(toCartItemFromCostume(product));
          }}
          className={`absolute ${buttonInsetClassName} bg-white px-5 py-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-black opacity-0 transition duration-300 hover:bg-[#99854e] hover:text-white group-hover:opacity-100`}
        >
          Thêm vào giỏ
        </button>
      </div>
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#99854e]">
        {getCostumeSubcategory(product) || getCostumeDisplayCategory(product)}
      </p>
      <p className="mb-2 text-xs italic text-[#777777]">{getCostumeDisplayMeta(product)}</p>
      <h3
        className="cursor-pointer text-[12px] font-semibold uppercase tracking-[0.18em] transition group-hover:text-[#99854e]"
        onClick={() => onNavigate?.('productDetail', product)}
      >
        {product.name}
      </h3>
      <p className="mt-3 font-serif text-2xl">{getCostumePrice(product)}</p>
    </article>
  );
}
