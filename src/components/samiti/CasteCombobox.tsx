import React, { useEffect, useRef, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Check, ChevronDown } from 'lucide-react';
import { CASTE_OPTIONS } from '@/lib/casteOptions';

interface CasteComboboxProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
}

/**
 * Caste / Samaj picker: a dropdown of known castes. Selection-only — typing is
 * disabled so the stored value always matches one of the listed options.
 */
export const CasteCombobox: React.FC<CasteComboboxProps> = ({
  value,
  onChange,
  className = '',
  placeholder = 'चुनें…',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const flatOptions = CASTE_OPTIONS;

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
      if (flatOptions.length === 0) return;
      const delta = e.key === 'ArrowDown' ? 1 : -1;
      setActiveIndex(prev => (prev + delta + flatOptions.length) % flatOptions.length);
    } else if (e.key === 'Enter') {
      if (isOpen && activeIndex >= 0 && flatOptions[activeIndex]) {
        e.preventDefault();
        select(flatOptions[activeIndex].value);
      } else if (!isOpen) {
        setIsOpen(true);
        setActiveIndex(0);
      }
    } else if (e.key === 'Escape') {
      if (isOpen) {
        e.preventDefault();
        e.stopPropagation();
        setIsOpen(false);
        setActiveIndex(-1);
      }
    } else if (e.key.length === 1) {
      // Block manual character entry — this field is selection-only.
      e.preventDefault();
    }
  };

  return (
    <div ref={wrapperRef} className="relative">
      <Input
        value={value}
        placeholder={placeholder}
        onChange={() => {
          // No-op: typing is disabled, value only changes via selection.
        }}
        onKeyDown={handleKeyDown}
        onClick={() => setIsOpen(prev => !prev)}
        readOnly
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        className={`pr-8 cursor-pointer caret-transparent ${className}`}
      />
      <button
        type="button"
        tabIndex={-1}
        aria-label="जाति सूची खोलें"
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
          {flatOptions.map((option, index) => {
            const isSelected = option.value === value;
            return (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={isSelected}
                data-index={index}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => select(option.value)}
                className={`w-full flex items-center justify-between gap-2 px-3 py-1.5 text-left text-xs font-medium transition-colors ${
                  index === activeIndex ? 'bg-amber-50 text-amber-900' : 'text-slate-700'
                }`}
              >
                <span>{option.value}</span>
                {isSelected && <Check className="w-3.5 h-3.5 text-amber-600 shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
