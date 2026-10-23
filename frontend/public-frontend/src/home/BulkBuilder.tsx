import { useMemo, useState } from 'react';
import { ArrowRight, MessageCircle, Package } from 'lucide-react';
import type { Garment } from '../types';
import { inr, waLink } from '../utils/format';
import { shade } from '../customizer/mockups';
import { Spools } from './HangerRack';

const PER_BOX = 50;
const MIN_QTY = 10;
const MAX_QTY = 500;

/** Slider position (0–100) → a round quantity, finer at the low end */
const qtyFor = (v: number) => {
  const raw = MIN_QTY * Math.pow(MAX_QTY / MIN_QTY, v / 100);
  const stepBy = raw < 50 ? 5 : raw < 200 ? 10 : 25;
  return Math.min(MAX_QTY, Math.max(MIN_QTY, Math.round(raw / stepBy) * stepBy));
};
const sliderFor = (q: number) => (100 * Math.log(q / MIN_QTY)) / Math.log(MAX_QTY / MIN_QTY);

/** A folded garment seen from the front of the stack */
const Folded = ({ hex }: { hex: string }) => (
  <div className="relative h-[9px] w-full rounded-[3px]" style={{ backgroundColor: hex, boxShadow: `inset 0 -2px 0 ${shade(hex, -0.25)}` }}>
    <span className="absolute left-1/2 top-0 h-1 w-5 -translate-x-1/2 rounded-b-full" style={{ backgroundColor: shade(hex, -0.35) }} />
  </div>
);

function Carton({ count, hex, open }: { count: number; hex: string; open: boolean }) {
  const layers = Math.max(1, Math.ceil((count / PER_BOX) * 10));
  return (
    <div className={`carton-in relative w-[104px] sm:w-[120px] ${open ? 'h-[180px]' : 'h-[96px]'}`}>
      {/* Stack rising out of the open box */}
      {open && (
        <div className="absolute inset-x-3 bottom-[62px] flex flex-col-reverse gap-px">
          {Array.from({ length: layers }, (_, i) => <Folded key={i} hex={hex} />)}
        </div>
      )}
      {/* Flaps */}
      {open ? (
        <>
          <div className="absolute bottom-[76px] left-0 h-5 w-1/2 origin-bottom-right -skew-y-[20deg] rounded-tl bg-[#b98d57]" />
          <div className="absolute bottom-[76px] right-0 h-5 w-1/2 origin-bottom-left skew-y-[20deg] rounded-tr bg-[#b98d57]" />
        </>
      ) : (
        <div className="absolute inset-x-0 bottom-[76px] h-4 rounded-t-md bg-[#c99d66]">
          <span className="absolute inset-y-0 left-1/2 w-5 -translate-x-1/2 bg-[#e8d6b4]/80" />
        </div>
      )}
      {/* Front face */}
      <div className="absolute inset-x-0 bottom-0 h-[78px] rounded-b-md rounded-t-sm bg-gradient-to-b from-[#d4aa72] to-[#bf9159] shadow-md">
        {!open && <span className="absolute inset-y-0 left-1/2 w-5 -translate-x-1/2 bg-[#e8d6b4]/70" />}
        <span className="absolute bottom-2.5 left-2.5 rounded-sm bg-white/90 px-1.5 py-1 text-[10px] font-bold leading-none text-ink">{count} pcs</span>
        <span className="absolute right-2.5 top-2.5 h-3 w-3 rounded-full" style={{ backgroundColor: hex, boxShadow: '0 0 0 2px rgba(255,255,255,.8)' }} />
      </div>
    </div>
  );
}

/** "How many do you need?": quantity slider that packs cartons, with a listed-price estimate */
export default function BulkBuilder({ garments, whatsappNumber, brand, onQuote }: {
  garments: Garment[];
  whatsappNumber?: string;
  brand: string;
  onQuote: (message: string) => void;
}) {
  const [garmentKey, setGarmentKey] = useState(garments[0]?.key ?? '');
  const garment = garments.find(g => g.key === garmentKey) ?? garments[0];
  const [hex, setHex] = useState('');
  const colour = garment?.colors.find(c => c.hex === hex) ?? garment?.colors[0];
  const [slider, setSlider] = useState(sliderFor(100));
  const qty = qtyFor(slider);

  const boxes = useMemo(() => {
    const full = Math.floor(qty / PER_BOX);
    const rest = qty - full * PER_BOX;
    return [...Array(full).fill(PER_BOX), ...(rest ? [rest] : [])] as number[];
  }, [qty]);

  if (!garment || !colour) return null;
  const frontPrint = [...garment.placements].filter(p => p.enabled && p.view === 'front').sort((a, b) => b.w * b.h - a.w * a.h)[0];
  const unit = (Number(garment.basePrice) || 0) + (Number(frontPrint?.price) || 0);
  const message = `Bulk order enquiry: ${qty} × ${garment.name} in ${colour.name}${frontPrint ? `, with a ${frontPrint.label.toLowerCase()} print` : ''}. Sizes: (mixed / tell us). My design: (attach or describe).`;
  const wa = whatsappNumber ? waLink(whatsappNumber, `Hi ${brand}, ${message}`) : '';

  return (
    <div className="grid gap-10 rounded-[2rem] bg-white p-6 ring-1 ring-line sm:p-10 lg:grid-cols-12 lg:gap-12">
      <div className="lg:col-span-5">
        <p className="eyebrow">Bulk order builder</p>
        <h2 className="mt-3 font-display text-4xl font-bold tracking-tight sm:text-5xl">How many do you need?</h2>

        <div className="mt-8 flex flex-wrap gap-2">
          {garments.map(g => (
            <button
              key={g.key}
              onClick={() => { setGarmentKey(g.key); setHex(''); }}
              className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${g.key === garment.key ? 'border-ink bg-ink text-white' : 'border-line hover:border-ink'}`}
            >
              {g.name}
            </button>
          ))}
        </div>
        <div className="mt-5">
          <Spools colors={garment.colors} value={colour.hex} onPick={setHex} />
        </div>

        <div className="mt-8">
          <div className="flex items-baseline justify-between">
            <label htmlFor="bulk-qty" className="text-sm font-semibold">Quantity</label>
            <p className="font-display text-5xl font-extrabold tabular-nums tracking-tight">{qty}<span className="ml-1.5 text-base font-semibold text-muted">pcs</span></p>
          </div>
          <input
            id="bulk-qty"
            type="range"
            min={0}
            max={100}
            step={0.5}
            value={slider}
            onChange={e => setSlider(Number(e.target.value))}
            className="mt-3 w-full accent-[#ff5a1f]"
            aria-valuetext={`${qty} pieces`}
          />
          <div className="mt-1 flex justify-between text-xs text-muted"><span>{MIN_QTY}</span><span>100</span><span>{MAX_QTY}+</span></div>
        </div>

        <div className="mt-8 rounded-2xl bg-paper p-5">
          <div className="flex items-baseline justify-between text-sm">
            <span className="text-muted">Listed price per piece{frontPrint ? ` (with ${frontPrint.label.toLowerCase()})` : ''}</span>
            <span className="font-semibold">{inr(unit)}</span>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-sm text-muted">{qty} pieces at listed price</span>
            <span className="font-display text-2xl font-bold">{inr(unit * qty)}</span>
          </div>
          <p className="mt-3 border-t border-dashed border-line pt-3 text-xs text-muted">Bulk orders get special pricing. Ask for a quote and we'll send the exact price for your quantity.</p>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button onClick={() => onQuote(message)} className="btn-accent px-6 py-3.5">Quote for {qty} pcs <ArrowRight className="h-4 w-4" /></button>
          {wa && (
            <a href={wa} target="_blank" rel="noreferrer" className="btn bg-[#25D366] px-6 py-3.5 text-white hover:bg-[#1ebe5a]">
              <MessageCircle className="h-4 w-4" /> WhatsApp
            </a>
          )}
        </div>
      </div>

      {/* Packing floor */}
      <div className="relative flex min-h-[380px] flex-col overflow-hidden rounded-3xl bg-[linear-gradient(180deg,#f2eee6_0%,#f2eee6_78%,#e4ded2_78%,#ddd6c8_100%)] p-6 lg:col-span-7">
        <div className="flex items-start justify-between gap-4">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted"><Package className="h-4 w-4" /> Packed and ready</p>
          <p className="text-right text-xs text-muted"><span className="font-display text-2xl font-bold text-ink">{boxes.length}</span> {boxes.length === 1 ? 'box' : 'boxes'}<br />1 box ≈ {PER_BOX} pcs</p>
        </div>
        {/* Boxes fill the floor first, then stack upwards */}
        <div className="flex flex-1 flex-wrap-reverse content-start items-start justify-center gap-x-2 gap-y-1 pb-4 pt-8">
          {boxes.map((count, i) => (
            <Carton key={i} count={count} hex={colour.hex} open={i === boxes.length - 1 && count < PER_BOX} />
          ))}
        </div>
      </div>
    </div>
  );
}
