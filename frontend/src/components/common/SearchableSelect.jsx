import { useState, useRef, useEffect, useMemo } from 'react';

export default function SearchableSelect({
  options = [],
  value,
  onChange,
  placeholder = 'Chọn một tùy chọn...',
  disabled = false,
  className = '',
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const wrapperRef = useRef(null);
  const inputRef = useRef(null);

  const selectedOption = useMemo(() => 
    options.find(opt => String(opt.value) === String(value)),
  [options, value]);

  const filteredOptions = useMemo(() => {
    if (!searchTerm) return options;
    const lowerSearch = searchTerm.toLowerCase();
    return options.filter(opt => 
      opt.label.toLowerCase().includes(lowerSearch) || 
      String(opt.value).toLowerCase().includes(lowerSearch)
    );
  }, [options, searchTerm]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchTerm(''); // Reset search term when closed without selection
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (option) => {
    onChange(option.value);
    setSearchTerm('');
    setIsOpen(false);
  };

  const handleInputClick = () => {
    if (!disabled) {
      setIsOpen(true);
    }
  };

  const displayValue = isOpen 
    ? searchTerm 
    : (selectedOption ? selectedOption.label : '');

  return (
    <div className={`relative w-full ${className}`} ref={wrapperRef}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={displayValue}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onClick={handleInputClick}
          disabled={disabled}
          placeholder={selectedOption ? '' : placeholder}
          className="w-full border border-[#cfc4c5] bg-white px-4 py-3 text-sm focus:border-black focus:outline-none disabled:bg-gray-100 disabled:cursor-not-allowed cursor-pointer"
        />
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-500">
          <span className="material-symbols-outlined text-xl">
            {isOpen ? 'expand_less' : 'expand_more'}
          </span>
        </div>
      </div>

      {isOpen && !disabled && (
        <ul className="absolute z-50 w-full bg-white border border-[#cfc4c5] mt-1 max-h-60 overflow-y-auto shadow-lg shadow-black/5">
          {filteredOptions.length === 0 ? (
            <li className="px-4 py-3 text-sm text-gray-500 italic text-center">
              Không tìm thấy kết quả
            </li>
          ) : (
            filteredOptions.map((opt, idx) => (
              <li
                key={opt.value || idx}
                onClick={() => handleSelect(opt)}
                className={`px-4 py-2.5 text-sm cursor-pointer transition-colors ${
                  String(opt.value) === String(value)
                    ? 'bg-[#f9f9f9] text-[#7f7041] font-medium'
                    : 'text-black hover:bg-[#f9f9f9] hover:text-[#7f7041]'
                }`}
              >
                {opt.label}
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
