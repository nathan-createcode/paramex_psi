import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export default function Dropdown({
  value,
  onChange,
  options,
  placeholder = 'Select option',
  className = '',
  disabled = false,
  variant = 'default' // 'default' atau 'form'
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

  const handleSelect = (optionValue) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  const getDisplayValue = () => {
    if (!value) return placeholder;
    
    // Handle object options (for more complex data)
    if (options.length > 0 && typeof options[0] === 'object') {
      const selectedOption = options.find(opt => opt.value === value);
      return selectedOption ? selectedOption.label : placeholder;
    }
    
    // Handle simple string options
    return value;
  };

  const getOptionValue = (option) => {
    return typeof option === 'object' ? option.value : option;
  };

  const getOptionLabel = (option) => {
    return typeof option === 'object' ? option.label : option;
  };

  // Define button styles based on variant
  const getButtonStyles = () => {
    if (variant === 'form') {
      return `bg-white flex items-center justify-between px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 w-full text-left ${
        disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-gray-400 hover:shadow-md'
      } ${isOpen ? 'ring-2 ring-blue-500 border-blue-500 shadow-lg' : ''}`;
    }
    
    // Default variant (for settings, dashboard, etc.)
    return `bg-white shadow-md/5 flex items-center justify-between px-4 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all duration-200 w-full text-left ${
      disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:shadow-lg hover:border-gray-300'
    } ${isOpen ? 'bg-gray-50 shadow-lg border-gray-300' : ''}`;
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={getButtonStyles()}
      >
        <span className={`text-sm truncate transition-colors duration-200 ${variant === 'form' ? 'text-gray-900' : 'text-gray-600'}`}>
          {getDisplayValue()}
        </span>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-all duration-300 flex-shrink-0 ml-2 ${
          isOpen ? 'rotate-180 text-blue-500' : ''
        }`} />
      </button>

      {isOpen && !disabled && (
        <div 
          className={`absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-xl z-50 py-2 transition-all duration-200 ease-out ${
            isOpen ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 -translate-y-2'
          }`}
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
            const optionValue = getOptionValue(option);
            const optionLabel = getOptionLabel(option);
            const isSelected = optionValue === value;
            
            return (
              <button
                key={index}
                onClick={() => handleSelect(optionValue)}
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
                  {optionLabel}
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