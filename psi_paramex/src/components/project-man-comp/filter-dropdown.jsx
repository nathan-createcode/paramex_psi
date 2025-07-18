import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export default function FilterDropdown({
  label,
  options,
  value,
  onChange,
  placeholder = 'Select option'
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (option) => {
    onChange(option);
    setIsOpen(false);
  };

  const displayValue = value === 'all' ? placeholder : value;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`bg-white shadow-md/5 flex items-center justify-between px-4 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 hover:shadow-lg hover:border-gray-300 transition-all duration-200 min-w-[140px] ${
          isOpen ? 'bg-gray-50 shadow-lg border-gray-300' : ''
        }`}
      >
        <span className="text-sm text-gray-600 truncate transition-colors duration-200">{displayValue}</span>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-all duration-300 ${
          isOpen ? 'rotate-180 text-blue-500' : ''
        }`} />
      </button>

      {isOpen && (
        <div 
          className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-xl z-[70] py-2 transition-all duration-200 ease-out"
          style={{
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            animation: 'dropIn 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)'
          }}
        >
          <style>{`
            @keyframes dropIn {
              0% {
                opacity: 0;
                transform: translateY(-8px) scale(0.95);
              }
              100% {
                opacity: 1;
                transform: translateY(0) scale(1);
              }
            }
            
            @keyframes slideIn {
              0% {
                opacity: 0;
                transform: translateX(-8px);
              }
              100% {
                opacity: 1;
                transform: translateX(0);
              }
            }
          `}</style>

          {options.map((option, index) => {
            const isSelected = option === value;
            
            return (
              <button
                key={option}
                onClick={() => handleSelect(option)}
                className={`w-full px-4 py-2 text-left text-sm transition-all duration-200 flex items-center justify-between group ${
                  isSelected 
                    ? 'bg-blue-50 text-blue-900 font-medium border-l-2 border-blue-500' 
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                }`}
                style={{
                  animation: `slideIn 0.3s ease-out ${index * 50}ms both`
                }}
              >
                <span className="transition-transform duration-200 group-hover:translate-x-1">
                  {option === 'all' ? placeholder : option}
                </span>
                <div className="flex-shrink-0 ml-2">
                  {isSelected && (
                    <Check className="w-4 h-4 text-blue-600" />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
