import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, MessageCircle, RotateCcw } from 'lucide-react';
import type { PlacedOrder } from '../types';
import { inr, waLink } from '../utils/format';
import { getImageUrl } from '../utils/imageUtils';

interface Props {
  order: PlacedOrder;
  brand: string;
  whatsappNumber?: string;
  onDesignAnother: () => void;
}

const REDIRECT_SECONDS = 6;

/** Order confirmation + hand-off to WhatsApp with all order details pre-filled */
export default function OrderSuccess({ order, brand, whatsappNumber, onDesignAnother }: Props) {
  const [countdown, setCountdown] = useState<number | null>(whatsappNumber ? REDIRECT_SECONDS : null);

  const message = useMemo(() => {
    const lines = [
      `Hi ${brand}! 👋`,
      `I just placed an order on your website.`,
      ``,
      `🧾 *Order:* ${order.orderNumber}`,
      `👕 *Product:* ${order.garmentName} – ${order.colorName}, Size ${order.size}`,
      `🎨 *Prints:* ${order.prints.map(p => p.label).join(', ')}`,
      `🔢 *Quantity:* ${order.quantity}`,
      `💰 *Total:* ${inr(order.total)}`,
      ``,
      `*Name:* ${order.customerName}`,
      `*Phone:* ${order.phone}`,
      `*Email:* ${order.email}`,
      `*Address:* ${[order.address, order.city, order.pincode].filter(Boolean).join(', ')}`,
    ];
    if (order.previews.front) lines.push('', `Front preview: ${getImageUrl(order.previews.front)}`);
    if (order.previews.back) lines.push(`Back preview: ${getImageUrl(order.previews.back)}`);
    return lines.join('\n');
  }, [order, brand]);

  const href = whatsappNumber ? waLink(whatsappNumber, message) : '';

  useEffect(() => {
    if (countdown === null) return;
    if (countdown <= 0) {
      window.location.href = href;
      return;
    }
    const t = setTimeout(() => setCountdown(c => (c === null ? null : c - 1)), 1000);
    return () => clearTimeout(t);
  }, [countdown, href]);

  return (
    <section className="container-x py-12 sm:py-20">
      <div className="mx-auto max-w-3xl animate-fade-up">
        <div className="card overflow-hidden">
          <div className="bg-ink px-6 py-10 text-center text-white sm:px-10">
            <CheckCircle2 className="mx-auto h-14 w-14 text-accent" strokeWidth={1.5} />
            <p className="eyebrow mt-5 text-white/60">Order placed</p>
            <h1 className="mt-2 font-display text-3xl font-bold sm:text-4xl">Thank you, {order.customerName.split(' ')[0]}!</h1>
            <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-white/70">
              Your order <span className="font-semibold text-white">{order.orderNumber}</span> is confirmed and a copy has been emailed to {order.email}.
            </p>
          </div>

          <div className="grid gap-8 p-6 sm:grid-cols-2 sm:p-10">
            <div className="grid grid-cols-2 gap-3">
              {(['front', 'back'] as const).map(v => order.previews[v] && (
                <figure key={v} className="overflow-hidden rounded-2xl bg-paper">
                  <img src={getImageUrl(order.previews[v])} alt={`${v} preview`} className="aspect-[1000/1150] w-full object-cover" />
                  <figcaption className="py-2 text-center text-xs font-medium capitalize text-muted">{v}</figcaption>
                </figure>
              ))}
            </div>
            <dl className="space-y-3 text-sm">
              {[
                ['Product', order.garmentName],
                ['Colour / Size', `${order.colorName} · ${order.size}`],
                ['Prints', order.prints.map(p => p.label).join(', ')],
                ['Quantity', String(order.quantity)],
                ['Per piece', inr(order.unitPrice)],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4 border-b border-line pb-3">
                  <dt className="text-muted">{k}</dt>
                  <dd className="text-right font-medium">{v}</dd>
                </div>
              ))}
              <div className="flex items-baseline justify-between pt-1">
                <dt className="font-semibold">Total</dt>
                <dd className="font-display text-2xl font-bold">{inr(order.total)}</dd>
              </div>
            </dl>
          </div>

          <div className="border-t border-line bg-paper/60 p-6 sm:p-10">
            {whatsappNumber ? (
              <>
                <h2 className="font-display text-lg font-bold">Send your details on WhatsApp</h2>
                <p className="mt-1 text-sm text-muted">
                  Share the order with our team to confirm payment and get faster updates.
                  {countdown !== null && countdown > 0 && <> Opening WhatsApp in <b className="text-ink">{countdown}s</b>…</>}
                </p>
                <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                  <a href={href} className="btn w-full bg-[#25D366] text-white hover:bg-[#1ebe5a] sm:w-auto" onClick={() => setCountdown(null)}>
                    <MessageCircle className="h-4 w-4" /> Continue on WhatsApp
                  </a>
                  {countdown !== null && (
                    <button className="btn-outline w-full sm:w-auto" onClick={() => setCountdown(null)}>Stay on this page</button>
                  )}
                </div>
              </>
            ) : (
              <p className="text-sm text-muted">Our team will contact you on {order.phone} shortly to confirm your order.</p>
            )}
            <div className="mt-6 flex flex-wrap gap-4 text-sm font-semibold">
              <button onClick={onDesignAnother} className="inline-flex items-center gap-1.5 hover:text-accent">
                <RotateCcw className="h-4 w-4" /> Design another
              </button>
              <Link to="/" className="hover:text-accent">Back to home</Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
