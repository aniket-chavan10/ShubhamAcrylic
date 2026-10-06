export const inr = (value: number | string | undefined | null): string => {
  const n = Number(value) || 0;
  return `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
};

/** Normalise a phone number for wa.me (adds India's 91 to bare 10-digit numbers) */
export const waNumber = (raw?: string | null): string => {
  const digits = String(raw || '').replace(/\D/g, '');
  return digits.length === 10 ? `91${digits}` : digits;
};

export const waLink = (number: string | null | undefined, text: string): string => {
  const n = waNumber(number);
  return `https://wa.me/${n}?text=${encodeURIComponent(text)}`;
};
