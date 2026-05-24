'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

export interface SelectOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
  description?: string;
}

interface SelectProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  className?: string;
  error?: string;
}

export function Select({ label, value, onChange, options, className, error }: SelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="w-full" ref={ref}>
      {label && (
        <label className="block text-sm font-medium text-white/70 mb-1.5">{label}</label>
      )}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          'w-full flex items-center gap-3 bg-white/5 border rounded-lg px-4 py-2.5 text-white text-left',
          'focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30',
          'transition-all duration-200 hover:bg-white/[0.07] hover:border-white/20',
          open && 'border-primary/50 ring-1 ring-primary/30',
          error && 'border-red-500/50',
          className
        )}
      >
        {selected?.icon && (
          <span className="flex-shrink-0 w-5 h-5 text-primary">{selected.icon}</span>
        )}
        <span className={cn('flex-1 text-sm', !selected && 'text-white/30')}>
          {selected?.label || 'Select...'}
        </span>
        <ChevronDown className={cn(
          'w-4 h-4 text-white/40 transition-transform duration-200',
          open && 'rotate-180'
        )} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="relative z-50"
          >
            <div className="absolute top-1 left-0 right-0 mt-1 bg-surface-50 border border-white/10 rounded-xl overflow-hidden shadow-2xl shadow-black/50 backdrop-blur-xl">
              {options.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => { onChange(option.value); setOpen(false); }}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-3 text-left transition-all duration-150',
                    'hover:bg-white/[0.06]',
                    option.value === value && 'bg-primary/[0.08] text-primary'
                  )}
                >
                  {option.icon && (
                    <span className={cn(
                      'flex-shrink-0 w-5 h-5',
                      option.value === value ? 'text-primary' : 'text-white/40'
                    )}>
                      {option.icon}
                    </span>
                  )}
                  <div className="flex-1 min-w-0">
                    <span className={cn(
                      'text-sm font-medium block',
                      option.value === value ? 'text-primary' : 'text-white'
                    )}>
                      {option.label}
                    </span>
                    {option.description && (
                      <span className="text-xs text-white/40 mt-0.5 block">
                        {option.description}
                      </span>
                    )}
                  </div>
                  {option.value === value && (
                    <motion.div
                      layoutId="selectCheck"
                      className="w-2 h-2 rounded-full bg-primary flex-shrink-0"
                    />
                  )}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {error && <p className="mt-1 text-sm text-red-400">{error}</p>}
    </div>
  );
}
