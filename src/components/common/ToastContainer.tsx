import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from 'lucide-react';
import { useLagrange } from '../../context/LagrangeContext';
import type { ToastItem } from '../../types/lagrange';

const TONE_ICON: Record<ToastItem['tone'], React.ReactNode> = {
  success: <CheckCircle2 className="w-4 h-4 text-[#2F855A] shrink-0" />,
  warning: <AlertTriangle className="w-4 h-4 text-[#C07A28] shrink-0" />,
  info: <Info className="w-4 h-4 text-[#D97757] shrink-0" />,
  danger: <XCircle className="w-4 h-4 text-[#C54B38] shrink-0" />,
};

export const ToastContainer: React.FC = () => {
  const { toasts, dismissToast } = useLagrange();

  return (
    <div className="fixed top-20 right-5 z-50 flex flex-col gap-2.5 w-80 max-w-[calc(100vw-2.5rem)] pointer-events-none">
      <AnimatePresence initial={false}>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            layout
            initial={{ opacity: 0, y: -10, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.2 }}
            className="glass-panel rounded-2xl px-4 py-3 pointer-events-auto flex items-start gap-3"
          >
            <div className="mt-0.5">{TONE_ICON[toast.tone]}</div>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-medium text-[#1C1B18] leading-snug">
                {toast.title}
              </p>
              {toast.description && (
                <p className="text-xs text-[#5F5C55] mt-0.5 leading-relaxed">
                  {toast.description}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={() => dismissToast(toast.id)}
              className="text-[#8C887F] hover:text-[#1C1B18] p-0.5 rounded-lg transition-colors"
              aria-label="关闭通知"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
