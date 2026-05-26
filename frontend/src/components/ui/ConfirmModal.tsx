'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  variant?: 'danger' | 'warning' | 'info';
  loading?: boolean;
}

const variantStyles = {
  danger: {
    icon: 'text-red-400 bg-red-500/10 border-red-500/20',
    button: 'bg-red-500 hover:bg-red-600 text-white',
    glow: 'shadow-red-500/25',
  },
  warning: {
    icon: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
    button: 'bg-yellow-500 hover:bg-yellow-600 text-white',
    glow: 'shadow-yellow-500/25',
  },
  info: {
    icon: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    button: 'bg-primary hover:bg-primary-600 text-white',
    glow: 'shadow-primary/25',
  },
};

export function ConfirmModal({
  open, onClose, onConfirm, title, message,
  confirmLabel = 'Confirm', variant = 'danger', loading,
}: ConfirmModalProps) {
  const styles = variantStyles[variant];

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-sm"
          >
            <div className="bg-card border border-card-border rounded-xl overflow-hidden">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${styles.icon}`}>
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <button
                    onClick={onClose}
                    className="p-1 rounded-lg hover:bg-white/5 text-white/30 hover:text-white/50 transition-all"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
                <p className="text-sm text-white/60 leading-relaxed">{message}</p>
              </div>
              <div className="px-6 pb-6 flex gap-3">
                <button
                  onClick={onClose}
                  disabled={loading}
                  className="flex-1 py-2.5 rounded-lg text-sm font-semibold bg-white/5 border border-white/10 text-white/50 hover:text-white/70 transition-all disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={onConfirm}
                  disabled={loading}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg ${styles.glow} ${styles.button}`}
                >
                  {loading && (
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  )}
                  {confirmLabel}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
