import { FC, ReactNode } from "react";
import { Loader2, LucideIcon, X } from "lucide-react";

/** The one loading indicator used across the admin */
export const Spinner: FC<{ className?: string }> = ({ className = "h-6 w-6" }) => (
  <Loader2 className={`animate-spin text-muted ${className}`} />
);

/** Centred spinner for a page or card that is still loading */
export const PageLoader: FC<{ className?: string }> = ({ className = "h-64" }) => (
  <div className={`grid place-items-center ${className}`}><Spinner /></div>
);

export const EmptyState: FC<{ icon: LucideIcon; title: string; text?: string; children?: ReactNode }> = ({ icon: Icon, title, text, children }) => (
  <div className="px-4 py-16 text-center">
    <Icon className="mx-auto h-10 w-10 text-muted" strokeWidth={1.25} />
    <p className="mt-3 font-semibold">{title}</p>
    {text && <p className="mx-auto max-w-sm text-sm text-muted">{text}</p>}
    {children && <div className="mt-4 flex justify-center gap-2">{children}</div>}
  </div>
);

/**
 * Modal that becomes a bottom sheet on phones. Content scrolls inside; put
 * buttons in `footer` so they stay visible.
 */
export const Modal: FC<{
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  size?: "md" | "lg" | "xl";
}> = ({ title, onClose, children, footer, size = "md" }) => {
  const width = size === "xl" ? "sm:max-w-4xl" : size === "lg" ? "sm:max-w-2xl" : "sm:max-w-lg";
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/50 backdrop-blur-sm sm:items-center sm:p-4" onClick={onClose}>
      <div
        className={`flex max-h-[92vh] w-full flex-col rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl ${width}`}
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="flex items-center justify-between gap-4 border-b border-line px-5 py-4 sm:px-6">
          <h2 className="font-display text-lg font-bold">{title}</h2>
          <button onClick={onClose} className="a-icon-btn -mr-2" aria-label="Close"><X className="h-5 w-5" /></button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-6">{children}</div>
        {footer && <div className="flex flex-wrap justify-end gap-2 border-t border-line px-5 py-4 sm:px-6">{footer}</div>}
      </div>
    </div>
  );
};

/** On/off switch in the brand style */
export const Toggle: FC<{ checked: boolean; onChange: (v: boolean) => void; label?: string }> = ({ checked, onChange, label }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    aria-label={label}
    onClick={() => onChange(!checked)}
    className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition ${checked ? "bg-ink" : "bg-line"}`}
  >
    <span className={`inline-block h-5 w-5 rounded-full bg-white shadow transition ${checked ? "translate-x-5.5" : "translate-x-0.5"}`} />
  </button>
);
