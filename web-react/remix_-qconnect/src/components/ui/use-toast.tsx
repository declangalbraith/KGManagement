import React, { createContext, useContext, useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { cn } from '@/src/lib/utils';

type ToastVariant = 'default' | 'success' | 'destructive' | 'warning';

interface Toast {
  id: string;
  title: string;
  description?: string;
  variant?: ToastVariant;
}

interface ToastContextType {
  toast: (props: Omit<Toast, 'id'>) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback(({ title, description, variant = 'default' }: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, title, description, variant }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 w-full max-w-sm pointer-events-none">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
              className={cn(
                "pointer-events-auto flex w-full items-start gap-3 rounded-xl border p-4 shadow-xl backdrop-blur-md",
                {
                  "bg-background/90 border-border": t.variant === 'default',
                  "bg-green-50/95 border-green-200 text-green-900 dark:bg-green-900/90 dark:border-green-800 dark:text-green-100": t.variant === 'success',
                  "bg-red-50/95 border-red-200 text-red-900 dark:bg-red-900/90 dark:border-red-800 dark:text-red-100": t.variant === 'destructive',
                  "bg-yellow-50/95 border-yellow-200 text-yellow-900 dark:bg-yellow-900/90 dark:border-yellow-800 dark:text-yellow-100": t.variant === 'warning',
                }
              )}
            >
              {t.variant === 'success' && <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 shrink-0" />}
              {t.variant === 'destructive' && <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 shrink-0" />}
              {t.variant === 'warning' && <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 shrink-0" />}
              {t.variant === 'default' && <Info className="h-5 w-5 text-primary shrink-0" />}
              
              <div className="flex-1 flex flex-col gap-1">
                <div className="font-semibold text-sm leading-none tracking-tight">{t.title}</div>
                {t.description && <div className="text-sm opacity-90 leading-snug">{t.description}</div>}
              </div>
              <button onClick={() => removeToast(t.id)} className="shrink-0 opacity-70 hover:opacity-100 transition-opacity">
                <X className="h-4 w-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider');
  return context;
}
