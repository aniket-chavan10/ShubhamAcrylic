export const inr = (value: number | string | undefined | null, decimals = false): string => {
  const n = Number(value) || 0;
  return `₹${n.toLocaleString('en-IN', { minimumFractionDigits: decimals ? 2 : 0, maximumFractionDigits: 2 })}`;
};

export const formatDate = (value?: string | null): string =>
  value ? new Date(value).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

export const formatDateTime = (value?: string | null): string =>
  value ? new Date(value).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: 'numeric', minute: '2-digit' }) : '—';

export const waNumber = (raw?: string | null): string => {
  const digits = String(raw || '').replace(/\D/g, '');
  return digits.length === 10 ? `91${digits}` : digits;
};
