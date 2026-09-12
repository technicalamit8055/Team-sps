import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Check, ChevronDown } from 'lucide-react';
import { filterLocalityOptions, LOCALITY_OPTIONS } from '@/lib/localityOptions';

interface LocalityComboboxProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
}

/**
 * Mohalla / Tola picker: a dropdown of known localities that also accepts free
 * text, so custom addresses and existing records keep working.
 */
export const LocalityCombobox: React.FC<LocalityComboboxProps> = ({
  value,
  onChange,
  className = '',
  placeholder = 'चुनें या टाइप करें…',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // While closed the list shows everything, so the chevron always reveals the full set.
  const options = useMemo(
    () => (isOpen ? filterLocalityOptions(value) : LOCALITY_OPTIONS),
    [isOpen, value]
  );

  // Close on outside click.
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen]);

  // Keep the highlighted row in view.
  useEffect(() => {
    if (activeIndex < 0 || !listRef.current) return;
    const el = listRef.current.querySelector<HTMLElement>(`[data-index="${activeIndex}"]`);
    el?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  const select = (option: string) => {
    onChange(option);
    setIsOpen(false);
    setActiveIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
        setActiveIndex(0);
        return;
      }
      if (options.length === 0) return;
      const delta = e.key === 'ArrowDown' ? 1 : -1;
      setActiveIndex(prev => (prev + delta + options.length) % options.length);
    } else if (e.key === 'Enter') {
      if (isOpen && activeIndex >= 0 && options[activeIndex]) {
        e.preventDefault();
        select(options[activeIndex]);
      }
    } else if (e.key === 'Escape') {
      if (isOpen) {
        e.preventDefault();
        e.stopPropagation();
        setIsOpen(false);
        setActiveIndex(-1);
      }
    }
  };

  const isKnown = LOCALITY_OPTIONS.some(o => o === value);

  return (
    <div ref={wrapperRef} className="relative">
      <Input
        value={value}
        placeholder={placeholder}
        onChange={e => {
          onChange(e.target.value);
          setIsOpen(true);
          setActiveIndex(-1);
        }}
        onFocus={() => setIsOpen(true)}
        onKeyDown={handleKeyDown}
        role="combobox"
        aria-expanded={isOpen}
        aria-autocomplete="list"
        className={`pr-8 ${className}`}
      />
      <button
        type="button"
        tabIndex={-1}
        aria-label="मोहल्ला सूची खोलें"
        onClick={() => setIsOpen(prev => !prev)}
        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-amber-600 transition-colors"
      >
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div
          ref={listRef}
          role="listbox"
          className="absolute z-50 mt-1 w-full max-h-56 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-lg py-1"
        >
          {options.length === 0 ? (
            <div className="px-3 py-2 text-[10px] text-slate-400 font-medium">
              कोई मिलान नहीं — टाइप किया हुआ मान ही सहेजा जाएगा
            </div>
          ) : (
            options.map((option, index) => {
              const isSelected = option === value;
              return (
                <button
                  key={option}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  data-index={index}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => select(option)}
                  className={`w-full flex items-center justify-between gap-2 px-3 py-1.5 text-left text-xs font-medium transition-colors ${
                    index === activeIndex ? 'bg-amber-50 text-amber-900' : 'text-slate-700'
                  }`}
                >
                  <span>{option}</span>
                  {isSelected && <Check className="w-3.5 h-3.5 text-amber-600 shrink-0" />}
                </button>
              );
            })
          )}
          {value.trim() && !isKnown && (
            <div className="px-3 py-1.5 mt-1 border-t border-slate-100 text-[10px] text-slate-500 font-medium">
              कस्टम मान: <span className="font-bold text-slate-700">{value.trim()}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
