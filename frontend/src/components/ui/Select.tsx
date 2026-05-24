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
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
}

export function Select({ label, value, onChange, options, className, error, size = 'md', disabled }: SelectProps) {
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

  const sizeStyles = {
    sm: { button: 'gap-2 px-2.5 py-1.5 text-xs', icon: 'w-3.5 h-3.5', chevron: 'w-3 h-3', option: 'px-3 py-2 text-xs', optionIcon: 'w-3.5 h-3.5', label: 'text-xs font-medium' },
    md: { button: 'gap-3 px-4 py-2.5 text-sm', icon: 'w-5 h-5', chevron: 'w-4 h-4', option: 'px-4 py-3 text-sm', optionIcon: 'w-5 h-5', label: 'text-sm font-medium' },
    lg: { button: 'gap-3 px-5 py-3 text-base', icon: 'w-5 h-5', chevron: 'w-4 h-4', option: 'px-4 py-3.5 text-sm', optionIcon: 'w-5 h-5', label: 'text-sm font-medium' },
  };

  const s = sizeStyles[size];

  return (
    <div className={cn('relative', size === 'sm' ? 'inline-block' : 'w-full')} ref={ref}>
      {label && (
        <label className={cn('block text-white/70 mb-1.5', size === 'sm' ? 'text-[10px] font-medium uppercase tracking-wider' : 'text-sm font-medium')}>{label}</label>
      )}
      <button
        type="button"
        onClick={() => !disabled && setOpen(!open)}
        className={cn(
          'flex items-center border rounded-lg text-white text-left',
          'focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30',
          'transition-all duration-200',
          disabled
            ? 'bg-white/[0.02] border-white/5 text-white/30 cursor-not-allowed'
            : 'bg-white/5 border-white/10 hover:bg-white/[0.07] hover:border-white/20 cursor-pointer',
          open && !disabled && 'border-primary/50 ring-1 ring-primary/30',
          error && 'border-red-500/50',
          s.button,
          className
        )}
      >
        {selected?.icon && (
          <span className={cn('flex-shrink-0', s.icon, 'text-primary')}>{selected.icon}</span>
        )}
        <span className={cn('flex-1', !selected && 'text-white/30')}>
          {selected?.label || 'Select...'}
        </span>
        <ChevronDown className={cn(
          s.chevron, 'text-white/40 transition-transform duration-200 flex-shrink-0',
          open && 'rotate-180'
        )} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
            className="relative z-50"
          >
            <div
              className={cn(
                'absolute top-1 left-0 right-0 mt-1 overflow-hidden',
                'bg-surface-50/80 backdrop-blur-2xl',
                'border border-white/[0.08]',
                'rounded-xl',
                'shadow-2xl shadow-black/60',
                size === 'sm' ? 'min-w-[180px]' : 'min-w-[240px]'
              )}
            >
              {/* Glass shine overlay */}
              <div className="absolute inset-0 bg-gradient-to-b from-white/[0.04] to-transparent pointer-events-none" />

              <div className="relative">
                {options.map((option, idx) => (
                  <motion.button
                    key={option.value}
                    type="button"
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.18, delay: idx * 0.03, ease: 'easeOut' }}
                    onClick={() => { onChange(option.value); setOpen(false); }}
                    className={cn(
                      'w-full flex items-center text-left transition-all duration-150',
                      'hover:bg-white/[0.08] hover:backdrop-blur-sm',
                      'active:scale-[0.98]',
                      option.value === value && 'bg-primary/[0.10] text-primary',
                      s.option,
                      idx > 0 && 'border-t border-white/[0.03]'
                    )}
                  >
                    {option.icon && (
                      <span className={cn(
                        'flex-shrink-0',
                        s.optionIcon,
                        option.value === value ? 'text-primary' : 'text-white/40',
                        'transition-colors duration-200'
                      )}>
                        {option.icon}
                      </span>
                    )}
                    <div className="flex-1 min-w-0">
                      <span className={cn(
                        'block',
                        s.label,
                        option.value === value ? 'text-primary' : 'text-white/90',
                        'transition-colors duration-200'
                      )}>
                        {option.label}
                      </span>
                      {option.description && (
                        <span className={cn(
                          'text-white/40 mt-0.5 block',
                          size === 'sm' ? 'text-[10px]' : 'text-xs'
                        )}>
                          {option.description}
                        </span>
                      )}
                    </div>
                    {option.value === value && (
                      <motion.div
                        layoutId="selectCheck"
                        className={cn(
                          'rounded-full bg-primary flex-shrink-0',
                          size === 'sm' ? 'w-1.5 h-1.5' : 'w-2 h-2'
                        )}
                      />
                    )}
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {error && <p className="mt-1 text-sm text-red-400">{error}</p>}
    </div>
  );
}
