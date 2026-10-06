import { FormEvent, useState } from 'react';
import { CheckCircle2, Loader2, Send } from 'lucide-react';
import { createEnquiry, errorMessage } from '../services/api';

const EMPTY = { name: '', email: '', mobileNo: '', message: '' };

/** General enquiry / bulk order form (Contact page and home page) */
const EnquiryForm = ({ compact = false }: { compact?: boolean }) => {
    const [form, setForm] = useState(EMPTY);
    const [status, setStatus] = useState<'idle' | 'sending' | 'sent'>('idle');
    const [error, setError] = useState('');

    const update = (key: keyof typeof EMPTY) =>
        (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm(f => ({ ...f, [key]: e.target.value }));

    const submit = async (e: FormEvent) => {
        e.preventDefault();
        if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
            setError('Please fill in your name, email and message.');
            return;
        }
        if (form.mobileNo.replace(/\D/g, '').length < 10) {
            setError('Please enter a valid mobile number.');
            return;
        }
        setError('');
        setStatus('sending');
        try {
            await createEnquiry(form);
            setStatus('sent');
            setForm(EMPTY);
        } catch (err) {
            setError(errorMessage(err));
            setStatus('idle');
        }
    };

    if (status === 'sent') {
        return (
            <div className="flex flex-col items-center rounded-3xl bg-white p-10 text-center ring-1 ring-line">
                <CheckCircle2 className="h-12 w-12 text-success" strokeWidth={1.5} />
                <h3 className="mt-4 font-display text-2xl font-bold">Message received!</h3>
                <p className="mt-2 max-w-sm text-sm text-muted">Thanks for reaching out. Our team will get back to you within one working day.</p>
                <button onClick={() => setStatus('idle')} className="btn-outline mt-6">Send another message</button>
            </div>
        );
    }

    return (
        <form onSubmit={submit} className="space-y-4 rounded-3xl bg-white p-6 ring-1 ring-line sm:p-8">
            <div className={`grid gap-4 ${compact ? '' : 'sm:grid-cols-2'}`}>
                <div>
                    <label className="label" htmlFor="enq-name">Name</label>
                    <input id="enq-name" className="field" autoComplete="name" value={form.name} onChange={update('name')} />
                </div>
                <div>
                    <label className="label" htmlFor="enq-phone">Mobile</label>
                    <input id="enq-phone" className="field" type="tel" autoComplete="tel" value={form.mobileNo} onChange={update('mobileNo')} />
                </div>
                <div className={compact ? '' : 'sm:col-span-2'}>
                    <label className="label" htmlFor="enq-email">Email</label>
                    <input id="enq-email" className="field" type="email" autoComplete="email" value={form.email} onChange={update('email')} />
                </div>
                <div className={compact ? '' : 'sm:col-span-2'}>
                    <label className="label" htmlFor="enq-msg">What are you looking for?</label>
                    <textarea id="enq-msg" rows={4} className="field resize-none" value={form.message} onChange={update('message')}
                        placeholder="e.g. 60 black hoodies with our college logo on the back, needed by 20th…" />
                </div>
            </div>
            {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
            <button type="submit" disabled={status === 'sending'} className="btn-primary w-full sm:w-auto">
                {status === 'sending' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Send enquiry
            </button>
        </form>
    );
};

export default EnquiryForm;
