import { FormEvent, useEffect, useRef, useState } from 'react';
import { ArrowLeft, Loader2, Lock, MailCheck, ShieldCheck, X } from 'lucide-react';
import { errorMessage, placeOrder, sendEmailOtp, verifyEmailOtp } from '../services/api';
import type { PlacedOrder } from '../types';
import { inr } from '../utils/format';

export interface CustomerDetails {
  customerName: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  pincode: string;
  notes: string;
}

interface Props {
  summary: { title: string; subtitle: string; total: number };
  buildOrderForm: (customer: CustomerDetails) => Promise<FormData>;
  onClose: () => void;
  onPlaced: (order: PlacedOrder) => void;
}

type Step = 'details' | 'otp' | 'placing';

const STORAGE_KEY = 'ac_checkout_details';
const EMPTY: CustomerDetails = { customerName: '', phone: '', email: '', address: '', city: '', pincode: '', notes: '' };

const loadSaved = (): CustomerDetails => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...EMPTY, ...JSON.parse(raw), notes: '' } : EMPTY;
  } catch {
    return EMPTY;
  }
};

export default function CheckoutModal({ summary, buildOrderForm, onClose, onPlaced }: Props) {
  const [step, setStep] = useState<Step>('details');
  const [form, setForm] = useState<CustomerDetails>(loadSaved);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const codeRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && step !== 'placing') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose, step]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  useEffect(() => {
    if (step === 'otp') codeRef.current?.focus();
  }, [step]);

  const update = (key: keyof CustomerDetails) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm(f => ({ ...f, [key]: e.target.value }));

  const validate = (): string => {
    if (form.customerName.trim().length < 2) return 'Please enter your full name.';
    if (form.phone.replace(/\D/g, '').length < 10) return 'Please enter a valid 10-digit mobile number.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email.trim())) return 'Please enter a valid email address.';
    if (form.address.trim().length < 8) return 'Please enter your complete delivery address.';
    if (form.pincode && !/^\d{6}$/.test(form.pincode.trim())) return 'Pincode should be 6 digits.';
    return '';
  };

  const requestCode = async (e?: FormEvent) => {
    e?.preventDefault();
    const problem = validate();
    if (problem) { setError(problem); return; }
    setError('');
    setBusy(true);
    try {
      await sendEmailOtp(form.email.trim());
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...form, notes: '' })); } catch { /* ignore */ }
      setStep('otp');
      setCode('');
      setCooldown(60);
    } catch (err) {
      setError(errorMessage(err, 'Could not send the verification code.'));
    } finally {
      setBusy(false);
    }
  };

  const verifyAndPlace = async (e?: FormEvent) => {
    e?.preventDefault();
    if (!/^\d{6}$/.test(code)) { setError('Enter the 6-digit code from your email.'); return; }
    setError('');
    setBusy(true);
    let token = '';
    try {
      token = (await verifyEmailOtp(form.email.trim(), code)).verificationToken;
    } catch (err) {
      setError(errorMessage(err, 'Verification failed.'));
      setBusy(false);
      return;
    }
    setStep('placing');
    try {
      const orderForm = await buildOrderForm({ ...form, email: form.email.trim() });
      const order = await placeOrder(orderForm, token);
      onPlaced(order);
    } catch (err) {
      setError(errorMessage(err, 'We could not place your order. Please try again.'));
      setStep('otp');
      setCode('');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-ink/60 backdrop-blur-sm sm:items-center sm:p-6" role="dialog" aria-modal="true">
      <div className="max-h-[94vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-line bg-white/95 px-6 py-4 backdrop-blur">
          <div className="flex items-center gap-2">
            {step === 'otp' && (
              <button onClick={() => { setStep('details'); setError(''); }} className="-ml-2 rounded-full p-2 hover:bg-paper" aria-label="Back">
                <ArrowLeft className="h-4 w-4" />
              </button>
            )}
            <div>
              <p className="eyebrow">{step === 'details' ? 'Step 1 of 2' : 'Step 2 of 2'}</p>
              <h2 className="font-display text-xl font-bold">{step === 'details' ? 'Delivery details' : 'Verify your email'}</h2>
            </div>
          </div>
          {step !== 'placing' && (
            <button onClick={onClose} className="rounded-full p-2 hover:bg-paper" aria-label="Close">
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Order summary */}
        <div className="mx-6 mt-5 flex items-center justify-between rounded-2xl bg-paper px-4 py-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{summary.title}</p>
            <p className="truncate text-xs text-muted">{summary.subtitle}</p>
          </div>
          <p className="font-display text-lg font-bold">{inr(summary.total)}</p>
        </div>

        {step === 'details' && (
          <form onSubmit={requestCode} className="space-y-4 px-6 pb-6 pt-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="label" htmlFor="co-name">Full name</label>
                <input id="co-name" className="field" autoComplete="name" value={form.customerName} onChange={update('customerName')} />
              </div>
              <div>
                <label className="label" htmlFor="co-phone">Mobile (WhatsApp)</label>
                <input id="co-phone" className="field" type="tel" inputMode="tel" autoComplete="tel" value={form.phone} onChange={update('phone')} placeholder="98765 43210" />
              </div>
              <div>
                <label className="label" htmlFor="co-email">Email</label>
                <input id="co-email" className="field" type="email" autoComplete="email" value={form.email} onChange={update('email')} placeholder="you@email.com" />
              </div>
              <div className="sm:col-span-2">
                <label className="label" htmlFor="co-address">Delivery address</label>
                <textarea id="co-address" rows={2} className="field resize-none" autoComplete="street-address" value={form.address} onChange={update('address')} placeholder="House / flat, street, area" />
              </div>
              <div>
                <label className="label" htmlFor="co-city">City</label>
                <input id="co-city" className="field" autoComplete="address-level2" value={form.city} onChange={update('city')} />
              </div>
              <div>
                <label className="label" htmlFor="co-pin">Pincode</label>
                <input id="co-pin" className="field" inputMode="numeric" autoComplete="postal-code" maxLength={6} value={form.pincode} onChange={update('pincode')} />
              </div>
              <div className="sm:col-span-2">
                <label className="label" htmlFor="co-notes">Notes for our team (optional)</label>
                <textarea id="co-notes" rows={2} className="field resize-none" value={form.notes} onChange={update('notes')} placeholder="e.g. print colours, delivery date, team names…" />
              </div>
            </div>

            {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

            <button type="submit" disabled={busy} className="btn-primary w-full py-3.5">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <MailCheck className="h-4 w-4" />}
              Send verification code
            </button>
            <p className="flex items-center justify-center gap-1.5 text-center text-xs text-muted">
              <Lock className="h-3.5 w-3.5" /> We verify every order by email to keep out fake requests.
            </p>
          </form>
        )}

        {(step === 'otp' || step === 'placing') && (
          <form onSubmit={verifyAndPlace} className="space-y-5 px-6 pb-6 pt-5">
            <p className="text-sm leading-relaxed text-muted">
              We sent a 6-digit code to <span className="font-semibold text-ink">{form.email}</span>. It may take a minute — check your spam folder too.
            </p>
            <input
              ref={codeRef}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="••••••"
              disabled={step === 'placing'}
              className="field text-center font-display text-3xl font-bold tracking-[0.6em]"
              aria-label="Verification code"
            />

            {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

            <button type="submit" disabled={busy || code.length !== 6} className="btn-accent w-full py-3.5">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
              {step === 'placing' ? 'Placing your order…' : `Verify & place order · ${inr(summary.total)}`}
            </button>

            <div className="flex items-center justify-between text-sm">
              <button type="button" className="text-muted underline-offset-4 hover:text-ink hover:underline" onClick={() => { setStep('details'); setError(''); }} disabled={step === 'placing'}>
                Change email
              </button>
              <button type="button" disabled={cooldown > 0 || busy} onClick={() => requestCode()} className="font-semibold text-accent disabled:text-muted">
                {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
