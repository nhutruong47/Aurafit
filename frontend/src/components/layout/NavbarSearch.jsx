import { useEffect, useRef, useState } from 'react';
import { fetchCostumes } from '../../services/costumeService';

export default function NavbarSearch({ isOpen, onClose, onNavigate }) {
  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedTerm, setDebouncedTerm] = useState('');
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setSearchTerm('');
      setDebouncedTerm('');
    }
  }, [isOpen]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedTerm(searchTerm);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  useEffect(() => {
    const fetchSearchResults = async () => {
      if (debouncedTerm.trim()) {
        setIsLoading(true);
        try {
          const res = await fetchCostumes({ keyword: debouncedTerm.trim(), pageSize: 5 });
          // Robust check for Spring Boot paginated objects or wrapped data
          const items = res?.data?.content || res?.content || res?.data || res || [];
          setResults(Array.isArray(items) ? items.slice(0, 5) : []);
        } catch (err) {
          console.error("Search API Error:", err);
          setResults([]);
        } finally {
          setIsLoading(false);
        }
      } else {
        setResults([]);
      }
    };
    fetchSearchResults();
  }, [debouncedTerm]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      onClose();
      onNavigate?.('catalog'); 
    }
  };
  
  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        // Prevent closing if they clicked the search icon to toggle it
        if (!e.target.closest('button[aria-label="Tìm kiếm"]')) {
          onClose();
        }
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  return (
    <div 
      ref={containerRef}
      className={`absolute left-0 top-full w-full bg-white shadow-xl transition-all duration-300 ease-in-out border-b border-[#e4ddd2] z-40 overflow-hidden ${
        isOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0 pointer-events-none'
      }`}
    >
      <div className="mx-auto max-w-[1440px] px-5 md:px-20 py-6">
        <form onSubmit={handleSubmit} className="relative">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#99854e] text-2xl">search</span>
          <input
            ref={inputRef}
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-full border border-gray-200 bg-[#f9f9f9] py-4 pl-14 pr-12 text-lg text-black outline-none placeholder:text-gray-400 transition-colors focus:border-[#99854e] focus:bg-white"
            placeholder="Bạn đang tìm trang phục gì?"
          />
          {searchTerm && (
            <button 
              type="button" 
              onClick={() => setSearchTerm('')} 
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black transition-colors"
              aria-label="Xóa từ khóa"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          )}
        </form>

        {isOpen && (debouncedTerm.trim() !== '') && (
          <div className="mt-6">
            <h3 className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-[#5f5e5e]">
              {isLoading ? 'Đang tìm kiếm...' : results.length > 0 ? 'Kết quả tìm kiếm' : 'Không tìm thấy kết quả'}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {!isLoading && results.map(product => (
                <div 
                  key={product.id} 
                  className="group cursor-pointer rounded-lg border border-gray-100 bg-white p-3 hover:border-[#cfc4c5] hover:shadow-md transition-all flex items-center gap-3" 
                  onClick={() => { onClose(); window.location.href = `/products/${product.id}`; }}
                >
                  <div className="h-14 w-10 shrink-0 overflow-hidden rounded bg-gray-100">
                    <img 
                      src={product.imageUrl || 'https://via.placeholder.com/150?text=No+Image'} 
                      alt={product.name} 
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" 
                      onError={(e) => { e.target.src = 'https://via.placeholder.com/150?text=No+Image'; }}
                    />
                  </div>
                  <div>
                    <h4 className="text-[13px] font-semibold text-gray-900 group-hover:text-[#99854e] line-clamp-1">{product.name}</h4>
                    <p className="mt-0.5 text-[11px] text-gray-500">
                      {typeof product.rentalPrice === 'number' ? product.rentalPrice.toLocaleString('vi-VN') : 'Liên hệ'}đ
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
