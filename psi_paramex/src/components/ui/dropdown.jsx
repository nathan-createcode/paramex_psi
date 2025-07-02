import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
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
  const [dropdownPosition, setDropdownPosition] = useState('bottom');
  const [dropdownCoords, setDropdownCoords] = useState({ top: 0, left: 0, width: 0 });
  const [isAnimating, setIsAnimating] = useState(false);
  const dropdownRef = useRef(null);
  const isSelectingRef = useRef(false);
  const dropdownId = useRef(`dropdown-${Math.random().toString(36).substr(2, 9)}`);

  useEffect(() => {
    const handleClickOutside = (event) => {
      // Don't close if we're in the middle of selecting
      if (isSelectingRef.current) return;
      
      // Check if click is inside the dropdown container or the dropdown menu
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        // Also check if click is inside the dropdown menu (portal)
        const dropdownMenu = document.querySelector(`[data-dropdown-id="${dropdownId.current}"]`);
        if (!dropdownMenu || !dropdownMenu.contains(event.target)) {
          setIsAnimating(false);
          setTimeout(() => {
            setIsOpen(false);
          }, 200);
        }
      }
    };

    const handleScrollOrResize = () => {
      if (isOpen && dropdownRef.current) {
        const rect = dropdownRef.current.getBoundingClientRect();
        const windowHeight = window.innerHeight;
        const spaceBelow = windowHeight - rect.bottom;
        const spaceAbove = rect.top;
        
        // Estimate dropdown height (40px per option + padding)
        const estimatedHeight = Math.min(options.length * 40 + 16, 200);
        
        // If not enough space below but enough space above, flip to top
        if (spaceBelow < estimatedHeight && spaceAbove > estimatedHeight) {
          setDropdownPosition('top');
          setDropdownCoords({
            top: rect.top - estimatedHeight - 8,
            left: rect.left,
            width: rect.width
          });
        } else {
          setDropdownPosition('bottom');
          setDropdownCoords({
            top: rect.bottom + 8,
            left: rect.left,
            width: rect.width
          });
        }
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      window.addEventListener('scroll', handleScrollOrResize, true);
      window.addEventListener('resize', handleScrollOrResize);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
    };
  }, [isOpen, options.length]);

  // Reset animation state when dropdown closes
  useEffect(() => {
    if (!isOpen) {
      setIsAnimating(false);
    }
  }, [isOpen]);

  const handleSelect = useCallback((optionValue) => {
    isSelectingRef.current = true;
    onChange(optionValue);
    setIsAnimating(false);
    setTimeout(() => {
      setIsOpen(false);
      isSelectingRef.current = false;
    }, 200);
  }, [onChange]);



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
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          if (!disabled) {
            if (!isOpen) {
              // Calculate position and open
              if (dropdownRef.current) {
                const rect = dropdownRef.current.getBoundingClientRect();
                const windowHeight = window.innerHeight;
                const spaceBelow = windowHeight - rect.bottom;
                const spaceAbove = rect.top;
                
                // Estimate dropdown height (40px per option + padding)
                const estimatedHeight = Math.min(options.length * 40 + 16, 200);
                
                // If not enough space below but enough space above, flip to top
                if (spaceBelow < estimatedHeight && spaceAbove > estimatedHeight) {
                  setDropdownPosition('top');
                  setDropdownCoords({
                    top: rect.top - estimatedHeight - 8,
                    left: rect.left,
                    width: rect.width
                  });
                } else {
                  setDropdownPosition('bottom');
                  setDropdownCoords({
                    top: rect.bottom + 8,
                    left: rect.left,
                    width: rect.width
                  });
                }
              }
              setIsOpen(true);
              setTimeout(() => {
                setIsAnimating(true);
              }, 10);
            } else {
              setIsAnimating(false);
              setTimeout(() => {
                setIsOpen(false);
              }, 200);
            }
          }
        }}
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

      {isOpen && !disabled && createPortal(
        <div 
          data-dropdown-id={dropdownId.current}
          onMouseDown={(e) => {
            e.stopPropagation();
          }}
          className={`bg-white border border-gray-200 rounded-xl shadow-xl z-[9999] py-2 transition-all duration-200 ease-out ${
            isAnimating ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 -translate-y-2'
          }`}
          style={{
            position: 'fixed',
            top: dropdownCoords.top,
            left: dropdownCoords.left,
            width: dropdownCoords.width,
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            maxHeight: '200px',
            overflowY: 'auto'
          }}
        >

          
          {options.map((option, index) => {
            const optionValue = getOptionValue(option);
            const optionLabel = getOptionLabel(option);
            const isSelected = optionValue === value;
            
            return (
              <button
                type="button"
                key={index}
                onClick={(e) => {
                  e.stopPropagation();
                  handleSelect(optionValue);
                }}
                className={`w-full px-4 py-2 text-left text-sm transition-all duration-200 flex items-center justify-between group ${
                  isSelected 
                    ? 'bg-blue-50 text-blue-900 font-medium border-l-2 border-blue-500' 
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                }`}
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
        </div>,
        document.body
      )}
    </div>
  );
} 