import React, { useEffect } from 'react';
import { X, type LucideIcon } from 'lucide-react';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: React.ReactNode;
  subtitle?: string;
  icon?: LucideIcon;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl';
  closeOnOverlayClick?: boolean;
}

const maxWidthMap: Record<string, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  '3xl': 'max-w-3xl',
  '4xl': 'max-w-4xl',
  '5xl': 'max-w-5xl',
};

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  icon: Icon,
  children,
  footer,
  maxWidth = 'lg',
  closeOnOverlayClick = true,
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={closeOnOverlayClick ? onClose : undefined}
      role="dialog"
      aria-modal="true"
    >
      <div
        className={`w-full ${maxWidthMap[maxWidth] || 'max-w-lg'} overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl animate-in zoom-in-95 duration-150`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-start justify-between border-b border-slate-100 px-6 py-4.5 bg-slate-50/50">
          <div className="flex items-center gap-3 min-w-0">
            {Icon && (
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-forest/10 text-forest">
                <Icon size={20} strokeWidth={2.2} />
              </div>
            )}
            <div className="min-w-0">
              <h2 className="font-display text-base font-bold text-ink truncate">{title}</h2>
              {subtitle && <p className="mt-0.5 text-xs text-slate-500 truncate">{subtitle}</p>}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
            aria-label="Đóng hộp thoại"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="max-h-[calc(85vh-130px)] overflow-y-auto px-6 py-5">
          {children}
        </div>

        {/* Optional Modal Footer */}
        {footer && (
          <div className="flex items-center justify-end gap-3 border-t border-slate-100 bg-slate-50/60 px-6 py-3.5">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
