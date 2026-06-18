// The goi y san pham bo sung trong checkout.
export default function CheckoutSuggestionCard({ item, onAddToCart }) {
  return (
    <article className="group cursor-pointer">
      <div className="relative mb-4 aspect-[3/4] overflow-hidden bg-[#f7f7f7]">
        <img
          className="h-full w-full object-cover transition duration-700 group-hover:scale-110"
          src={item.image}
          alt={item.name}
        />
        <div className="absolute left-3 top-3 z-10 bg-[#99854e] px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-white">
          {item.badge}
        </div>
        <div className="absolute bottom-4 right-4 opacity-0 transition group-hover:opacity-100">
          <button
            onClick={() => onAddToCart?.(item.originalItem || item)}
            className="flex items-center justify-center bg-white p-2 text-black"
            aria-label={`Add ${item.name}`}
          >
            <span className="material-symbols-outlined">add</span>
          </button>
        </div>
      </div>
      <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#999999]">{item.category}</p>
      <h3 className="uppercase transition group-hover:text-[#99854e]">{item.name}</h3>
      <p className="mt-1">{item.price}</p>
    </article>
  );
}
