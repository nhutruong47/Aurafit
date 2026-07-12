import React, { useState, useRef, useEffect } from 'react';

export default function SearchableSelect({
  options,
  value,
  onChange,
  name,
  placeholder = "Chọn...",
  className = ""
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const wrapperRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getOptionValue = (opt) => opt.id !== undefined ? String(opt.id) : String(opt.value || '');
  const getOptionLabel = (opt) => opt.displayName || opt.name || opt.label || '';
  // Search against the raw name (without dashes) and the displayName
  const getSearchableText = (opt) => ((opt.name || opt.label || '') + ' ' + getOptionLabel(opt)).toLowerCase();

  const filteredOptions = options.filter(option =>
    getSearchableText(option).includes(searchTerm.toLowerCase())
  );

  const selectedOption = options.find(opt => getOptionValue(opt) === String(value || ''));

  const handleSelect = (option) => {
    onChange({
      target: {
        name: name,
        value: getOptionValue(option)
      }
    });
    setIsOpen(false);
    setSearchTerm('');
  };

  return (
    <div className={`relative ${className}`} ref={wrapperRef}>
      <div
        className="w-full border border-[#d7d2c8] bg-[#fafaf8] px-3 py-3 text-sm outline-none focus-within:border-[#7f7041] cursor-pointer flex justify-between items-center"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className={selectedOption ? 'text-black truncate pr-4' : 'text-[#999999] truncate pr-4'}>
          {selectedOption ? getOptionLabel(selectedOption) : placeholder}
        </span>
        <span className="material-symbols-outlined text-[18px] text-[#999999] flex-shrink-0">
          {isOpen ? 'expand_less' : 'expand_more'}
        </span>
      </div>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full border border-[#d7d2c8] bg-white shadow-xl">
          <div className="p-2 border-b border-[#ebe7df] bg-[#fafaf8]">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-[16px] text-[#999999]">
                search
              </span>
              <input
                type="text"
                className="w-full border border-[#d7d2c8] bg-white py-2 pl-8 pr-3 text-sm outline-none focus:border-[#7f7041]"
                placeholder="Tìm kiếm..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                autoFocus
              />
            </div>
          </div>
          <ul className="max-h-60 overflow-y-auto py-1">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option, idx) => {
                const optValue = getOptionValue(option);
                const isSelected = optValue === String(value || '');
                return (
                  <li
                    key={optValue + '-' + idx}
                    className={`cursor-pointer px-4 py-2 text-sm hover:bg-[#f5f2eb] ${isSelected ? 'bg-[#f5f2eb] font-medium text-black' : 'text-[#5f5e5e]'} truncate`}
                    onClick={() => handleSelect(option)}
                  >
                    {getOptionLabel(option)}
                  </li>
                );
              })
            ) : (
              <li className="px-4 py-3 text-sm text-[#999999] text-center">Không tìm thấy kết quả</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
