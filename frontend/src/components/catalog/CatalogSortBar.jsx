export default function CatalogSortBar({ sortBy, sortDir, onSortChange }) {
  const isActive = (checkSortBy, checkSortDir) => sortBy === checkSortBy && sortDir === checkSortDir;

  return (
    <div className="mb-6 flex flex-wrap items-center gap-4 border border-[#cfc4c5] bg-white p-4">
      <span className="text-sm text-[#5f5e5e]">Sắp xếp theo</span>
      
      <button
        onClick={() => onSortChange('id', 'desc')}
        className={`px-4 py-2 text-[12px] font-semibold uppercase tracking-wider transition-colors ${
          isActive('id', 'desc')
            ? 'bg-black text-white'
            : 'bg-white text-black border border-gray-300 hover:bg-gray-50'
        }`}
      >
        Phổ biến
      </button>

      <button
        onClick={() => onSortChange('createdAt', 'desc')}
        className={`px-4 py-2 text-[12px] font-semibold uppercase tracking-wider transition-colors ${
          isActive('createdAt', 'desc')
            ? 'bg-black text-white'
            : 'bg-white text-black border border-gray-300 hover:bg-gray-50'
        }`}
      >
        Mới nhất
      </button>

      <button
        onClick={() => onSortChange('rentalPrice', 'asc')}
        className={`px-4 py-2 text-[12px] font-semibold uppercase tracking-wider transition-colors ${
          isActive('rentalPrice', 'asc')
            ? 'bg-black text-white'
            : 'bg-white text-black border border-gray-300 hover:bg-gray-50'
        }`}
      >
        Giá thấp - cao
      </button>

      <button
        onClick={() => onSortChange('rentalPrice', 'desc')}
        className={`px-4 py-2 text-[12px] font-semibold uppercase tracking-wider transition-colors ${
          isActive('rentalPrice', 'desc')
            ? 'bg-black text-white'
            : 'bg-white text-black border border-gray-300 hover:bg-gray-50'
        }`}
      >
        Giá cao - thấp
      </button>
    </div>
  );
}
