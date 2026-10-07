import { ChangeEvent, lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  AlertTriangle, Check, Crosshair, ImagePlus, Info, Loader2, MessageCircle, Minus, Move, Plus, RefreshCw, Rotate3d, Trash2, Type,
} from 'lucide-react';
import DesignCanvas from '../customizer/DesignCanvas';
import CheckoutModal, { CustomerDetails } from '../customizer/CheckoutModal';
import OrderSuccess from '../customizer/OrderSuccess';
import {
  composeView, DEFAULT_TRANSFORM, fitScale, newId, prepareImageArtwork, renderTextArtwork, TEXT_COLORS, TEXT_FONTS,
} from '../customizer/artwork';
import { loadImage } from '../customizer/mockups';
import { errorMessage, getGarments } from '../services/api';
import { useSiteSettings } from '../context/SiteSettingsContext';
import type { Garment, PlacedOrder, Placement, PrintDesign, PrintTransform, View } from '../types';
import { inr, waLink } from '../utils/format';

// three.js is only downloaded when the customer opens the 3D view
const Garment3D = lazy(() => import('../customizer/Garment3D'));

const MAX_QTY = 500;

interface TextDraft {
  text: string;
  font: string;
  color: string;
}

const extFor = (type: string) => (type === 'image/jpeg' ? 'jpg' : type === 'image/webp' ? 'webp' : 'png');

export default function CustomizePage() {
  const { garmentKey } = useParams<{ garmentKey?: string }>();
  const navigate = useNavigate();
  const { settings } = useSiteSettings();
  const brand = settings?.companyName || 'Astitva Creations';

  const [garments, setGarments] = useState<Garment[]>([]);
  const [loadError, setLoadError] = useState('');
  const [loading, setLoading] = useState(true);

  const [colorHex, setColorHex] = useState('');
  const [size, setSize] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [view, setView] = useState<View>('front');
  const [show3d, setShow3d] = useState(false);
  const [designs, setDesigns] = useState<Record<string, PrintDesign>>({});
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [textDraft, setTextDraft] = useState<TextDraft>({ text: '', font: TEXT_FONTS[0].id, color: '#ffffff' });
  const [textEditorFor, setTextEditorFor] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ type: 'error' | 'info'; text: string } | null>(null);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [placedOrder, setPlacedOrder] = useState<PlacedOrder | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadTargetRef = useRef<string | null>(null);

  useEffect(() => {
    getGarments()
      .then(setGarments)
      .catch(err => setLoadError(errorMessage(err, 'Could not load the design studio.')))
      .finally(() => setLoading(false));
  }, []);

  const garment = useMemo(
    () => garments.find(g => g.key === garmentKey) ?? garments[0],
    [garments, garmentKey],
  );
  const placements = useMemo(() => garment?.placements.filter(p => p.enabled) ?? [], [garment]);

  // Keep colour / size / prints valid when the garment changes
  useEffect(() => {
    if (!garment) return;
    setColorHex(c => (garment.colors.some(x => x.hex === c) ? c : garment.colors[0]?.hex ?? '#ffffff'));
    setSize(s => (garment.sizes.some(x => x.label === s) ? s
      : garment.sizes.find(x => x.label === 'M')?.label ?? garment.sizes[0]?.label ?? ''));
    setDesigns(d => {
      const keys = new Set(garment.placements.filter(p => p.enabled).map(p => p.key));
      return Object.fromEntries(Object.entries(d).filter(([k]) => keys.has(k)));
    });
    setActiveKey(k => (k && garment.placements.some(p => p.key === k && p.enabled) ? k : null));
  }, [garment]);

  // Default text colour contrasts with the garment
  useEffect(() => {
    if (!colorHex) return;
    const dark = parseInt(colorHex.slice(1, 3), 16) * 0.299 + parseInt(colorHex.slice(3, 5), 16) * 0.587 + parseInt(colorHex.slice(5, 7), 16) * 0.114 < 140;
    setTextDraft(t => (t.text ? t : { ...t, color: dark ? '#ffffff' : '#141414' }));
  }, [colorHex]);

  // ── Pricing ─────────────────────────────────────────────────────────────
  const pricing = useMemo(() => {
    if (!garment) return { base: 0, prints: [] as Placement[], printsTotal: 0, sizeExtra: 0, unit: 0, total: 0 };
    const base = Number(garment.basePrice) || 0;
    const prints = placements.filter(p => designs[p.key]);
    const printsTotal = prints.reduce((s, p) => s + (Number(p.price) || 0), 0);
    const sizeExtra = Number(garment.sizes.find(s => s.label === size)?.extra) || 0;
    const unit = base + printsTotal + sizeExtra;
    return { base, prints, printsTotal, sizeExtra, unit, total: unit * quantity };
  }, [garment, placements, designs, size, quantity]);

  const colorName = garment?.colors.find(c => c.hex === colorHex)?.name ?? '';

  // ── Print actions ───────────────────────────────────────────────────────
  const focusPlacement = (p: Placement) => {
    setActiveKey(p.key);
    setView(p.view);
  };

  const setDesign = (key: string, design: PrintDesign | null) =>
    setDesigns(d => {
      const next = { ...d };
      if (design) next[key] = design; else delete next[key];
      return next;
    });

  const openUpload = (p: Placement) => {
    focusPlacement(p);
    uploadTargetRef.current = p.key;
    fileInputRef.current?.click();
  };

  const onFileChosen = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    const key = uploadTargetRef.current;
    const placement = placements.find(p => p.key === key);
    if (!file || !placement) return;
    setBusyKey(placement.key);
    setNotice(null);
    try {
      const { src, lowRes } = await prepareImageArtwork(file);
      const img = await loadImage(src, false);
      setDesign(placement.key, {
        id: newId(),
        kind: 'image',
        src,
        file,
        fileName: `${placement.key}.${extFor(file.type)}`,
        transform: { ...DEFAULT_TRANSFORM, scale: fitScale(img.width, img.height, placement) },
      });
      setTextEditorFor(null);
      if (lowRes) setNotice({ type: 'info', text: 'Heads up: this image is quite small and may look blurry when printed. A larger PNG works best.' });
    } catch (err) {
      setNotice({ type: 'error', text: err instanceof Error ? err.message : 'Could not use that image.' });
    } finally {
      setBusyKey(null);
    }
  };

  const openTextEditor = (p: Placement) => {
    focusPlacement(p);
    const existing = designs[p.key];
    if (existing?.kind === 'text') {
      setTextDraft({ text: existing.text ?? '', font: existing.font ?? TEXT_FONTS[0].id, color: existing.color ?? '#ffffff' });
    } else {
      setTextDraft(t => ({ ...t, text: '' }));
    }
    setTextEditorFor(p.key);
  };

  const applyText = async (p: Placement) => {
    const text = textDraft.text.trim();
    if (!text) { setNotice({ type: 'error', text: 'Type some text first.' }); return; }
    setBusyKey(p.key);
    setNotice(null);
    try {
      const { src, blob } = await renderTextArtwork(text, textDraft.font, textDraft.color);
      const img = await loadImage(src, false);
      const prev = designs[p.key];
      setDesign(p.key, {
        id: newId(),
        kind: 'text',
        src,
        file: blob,
        fileName: `${p.key}-text.png`,
        text,
        font: textDraft.font,
        color: textDraft.color,
        transform: prev?.kind === 'text'
          ? { ...prev.transform, scale: fitScale(img.width, img.height, p) }
          : { ...DEFAULT_TRANSFORM, scale: fitScale(img.width, img.height, p) },
      });
      setTextEditorFor(null);
    } finally {
      setBusyKey(null);
    }
  };

  const recenter = (p: Placement) => {
    const d = designs[p.key];
    if (!d) return;
    loadImage(d.src, false).then(img => {
      setDesign(p.key, { ...d, id: newId(), transform: { ...DEFAULT_TRANSFORM, scale: fitScale(img.width, img.height, p) } });
    });
  };

  const onTransform = useCallback((key: string, t: PrintTransform) => {
    setDesigns(d => (d[key] ? { ...d, [key]: { ...d[key], transform: t } } : d));
  }, []);

  const onCanvasSelect = useCallback((key: string) => setActiveKey(key), []);

  // ── Checkout ────────────────────────────────────────────────────────────
  const buildOrderForm = async (customer: CustomerDetails) => {
    if (!garment) throw new Error('No product selected');
    const form = new FormData();
    const prints = pricing.prints.map(p => {
      const d = designs[p.key];
      return { key: p.key, kind: d.kind, text: d.text, font: d.font, color: d.color, transform: d.transform };
    });
    form.append('data', JSON.stringify({ ...customer, garmentId: garment.id, colorHex, size, quantity, prints }));
    pricing.prints.forEach(p => {
      const d = designs[p.key];
      form.append(`artwork_${p.key}`, d.file, d.fileName);
    });
    const views: View[] = ['front', ...(pricing.prints.some(p => p.view === 'back') ? ['back' as View] : [])];
    for (const v of views) {
      const blob = await composeView(garment, v, colorHex, designs);
      form.append(`preview_${v}`, blob, `preview-${v}.jpg`);
    }
    return form;
  };

  const startCheckout = () => {
    if (pricing.prints.length === 0) {
      setNotice({ type: 'error', text: 'Add at least one print (image or text) before ordering.' });
      return;
    }
    if (!size) {
      setNotice({ type: 'error', text: 'Please choose a size.' });
      return;
    }
    setCheckoutOpen(true);
  };

  const resetDesign = () => {
    setPlacedOrder(null);
    setDesigns({});
    setActiveKey(null);
    setQuantity(1);
    window.scrollTo({ top: 0 });
  };

  const whatsappQuestion = garment && settings?.whatsappNumber
    ? waLink(settings.whatsappNumber, `Hi ${brand}! I'm designing a custom ${garment.name} (${colorName}, size ${size || '-'}) on your website and have a question.`)
    : '';

  // ── Render ──────────────────────────────────────────────────────────────
  if (placedOrder) {
    return <OrderSuccess order={placedOrder} brand={brand} whatsappNumber={settings?.whatsappNumber} onDesignAnother={resetDesign} />;
  }

  if (loading) {
    return (
      <div className="grid min-h-[70vh] place-items-center">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  if (loadError || !garment) {
    return (
      <div className="container-x grid min-h-[60vh] place-items-center text-center">
        <div>
          <h1 className="font-display text-2xl font-bold">Design studio unavailable</h1>
          <p className="mt-2 text-muted">{loadError || 'No customisable products are available right now.'}</p>
          <Link to="/" className="btn-primary mt-6">Back to home</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-28 lg:pb-16">
      <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={onFileChosen} />

      {/* Heading */}
      <section className="border-b border-line bg-white">
        <div className="container-x flex flex-col gap-5 py-6 sm:py-8 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="eyebrow"><span className="h-1.5 w-1.5 rounded-full bg-accent" /> Design studio</p>
            <h1 className="mt-2 font-display text-3xl font-bold tracking-tight sm:text-4xl">Make it yours.</h1>
            <p className="mt-1 text-sm text-muted">Pick a garment, add your artwork or text, and see the price update live.</p>
          </div>
          <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
            {garments.map(g => (
              <button
                key={g.key}
                onClick={() => navigate(`/customize/${g.key}`, { replace: true })}
                className={`shrink-0 rounded-full border px-5 py-2.5 text-sm font-semibold transition ${g.key === garment.key ? 'border-ink bg-ink text-white' : 'border-line bg-white hover:border-ink'}`}
              >
                {g.name}
                <span className={`ml-2 text-xs font-medium ${g.key === garment.key ? 'text-white/60' : 'text-muted'}`}>from {inr(g.basePrice)}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      <div className="container-x mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-10">
        {/* ── Canvas ─────────────────────────────────────────────────── */}
        <div className="min-w-0 lg:col-span-7">
          <div className="lg:sticky lg:top-24">
            <div className="card relative overflow-hidden bg-[radial-gradient(circle_at_50%_35%,#ffffff_0%,#efece5_75%)] p-3 sm:p-6">
              <div className="absolute left-4 top-4 z-10 flex rounded-full bg-white p-1 shadow-sm ring-1 ring-line">
                {(['front', 'back'] as View[]).map(v => (
                  <button
                    key={v}
                    onClick={() => { setView(v); setShow3d(false); }}
                    className={`rounded-full px-4 py-1.5 text-xs font-semibold capitalize transition ${!show3d && view === v ? 'bg-ink text-white' : 'text-muted hover:text-ink'}`}
                  >
                    {v}
                  </button>
                ))}
                <button
                  onClick={() => setShow3d(true)}
                  className={`inline-flex items-center gap-1 rounded-full px-4 py-1.5 text-xs font-semibold transition ${show3d ? 'bg-ink text-white' : 'text-muted hover:text-ink'}`}
                >
                  <Rotate3d className="h-3.5 w-3.5" /> 3D
                </button>
              </div>
              <div className="absolute right-4 top-4 z-10 rounded-full bg-white/90 px-3 py-1.5 text-xs font-medium text-muted shadow-sm ring-1 ring-line">
                {colorName}
              </div>
              <div className="mx-auto max-w-[560px] pt-8 sm:pt-4">
                {/* Kept mounted while in 3D so switching back is instant */}
                <div className={show3d ? 'hidden' : ''}>
                  <DesignCanvas
                    garment={garment}
                    view={view}
                    colorHex={colorHex}
                    designs={designs}
                    activeKey={activeKey}
                    onSelect={onCanvasSelect}
                    onTransform={onTransform}
                  />
                </div>
                {show3d && (
                  <Suspense fallback={<div className="grid w-full place-items-center" style={{ aspectRatio: '1000 / 1150' }}><Loader2 className="h-8 w-8 animate-spin text-accent" /></div>}>
                    <Garment3D garment={garment} colorHex={colorHex} designs={designs} facing={view} />
                  </Suspense>
                )}
              </div>
            </div>
            <p className="mt-3 flex items-center justify-center gap-2 text-center text-xs text-muted">
              {show3d
                ? <><Rotate3d className="h-3.5 w-3.5" /> Drag to rotate · pinch or Ctrl + scroll to zoom · switch to Front / Back to move your prints</>
                : <><Move className="h-3.5 w-3.5" /> Drag to move · pull a corner to resize or rotate · dashed boxes are the print areas</>}
            </p>
          </div>
        </div>

        {/* ── Options ────────────────────────────────────────────────── */}
        <div className="min-w-0 space-y-5 lg:col-span-5">
          <div className="card p-5 sm:p-6">
            <h2 className="font-display text-xl font-bold">{garment.name}</h2>
            {garment.tagline && <p className="mt-0.5 text-sm text-muted">{garment.tagline}</p>}
            {garment.fabric && <p className="mt-3 inline-flex rounded-full bg-paper px-3 py-1 text-xs font-medium">{garment.fabric}</p>}
          </div>

          {/* Colour */}
          <div className="card p-5 sm:p-6">
            <div className="flex items-baseline justify-between">
              <h3 className="text-sm font-semibold">1. Base colour</h3>
              <span className="text-xs text-muted">{colorName}</span>
            </div>
            <div className="mt-4 flex flex-wrap gap-3">
              {garment.colors.map(c => (
                <button
                  key={c.hex}
                  title={c.name}
                  aria-label={c.name}
                  onClick={() => setColorHex(c.hex)}
                  className={`relative h-10 w-10 rounded-full ring-1 ring-black/10 transition hover:scale-110 ${c.hex === colorHex ? 'ring-2 ring-ink ring-offset-2' : ''}`}
                  style={{ backgroundColor: c.hex }}
                >
                  {c.hex === colorHex && (
                    <Check className={`absolute inset-0 m-auto h-4 w-4 ${parseInt(c.hex.slice(1, 3), 16) > 160 ? 'text-ink' : 'text-white'}`} />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Prints */}
          <div className="card p-5 sm:p-6">
            <h3 className="text-sm font-semibold">2. Add your prints</h3>
            <p className="mt-1 text-xs text-muted">Choose where you want a print. Each placement is priced separately.</p>
            <div className="mt-4 space-y-3">
              {placements.map(p => {
                const d = designs[p.key];
                const active = activeKey === p.key;
                const editingText = textEditorFor === p.key;
                return (
                  <div
                    key={p.key}
                    className={`rounded-2xl border p-4 transition ${active ? 'border-ink bg-paper/60' : 'border-line hover:border-ink/40'}`}
                  >
                    <button className="flex w-full items-center gap-3 text-left" onClick={() => focusPlacement(p)}>
                      <div className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-xl bg-paper ring-1 ring-line"
                        style={d ? { backgroundColor: colorHex } : undefined}>
                        {d ? <img src={d.src} alt="" className="max-h-10 max-w-10 object-contain" />
                          : <Crosshair className="h-5 w-5 text-muted" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">{p.label}</p>
                        <p className="text-xs capitalize text-muted">{p.view} · {d ? (d.kind === 'text' ? `“${d.text}”` : 'Image added') : 'Not added'}</p>
                      </div>
                      <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${d ? 'bg-ink text-white' : 'bg-paper text-ink'}`}>
                        +{inr(p.price)}
                      </span>
                    </button>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <button onClick={() => openUpload(p)} disabled={busyKey === p.key} className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-3.5 py-2 text-xs font-semibold hover:border-ink">
                        {busyKey === p.key ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ImagePlus className="h-3.5 w-3.5" />}
                        {d?.kind === 'image' ? 'Replace image' : 'Upload image'}
                      </button>
                      <button onClick={() => openTextEditor(p)} className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-3.5 py-2 text-xs font-semibold hover:border-ink">
                        <Type className="h-3.5 w-3.5" /> {d?.kind === 'text' ? 'Edit text' : 'Add text'}
                      </button>
                      {d && (
                        <>
                          <button onClick={() => recenter(p)} className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-semibold text-muted hover:text-ink" title="Re-centre">
                            <RefreshCw className="h-3.5 w-3.5" /> Reset
                          </button>
                          <button onClick={() => setDesign(p.key, null)} className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50" title="Remove print">
                            <Trash2 className="h-3.5 w-3.5" /> Remove
                          </button>
                        </>
                      )}
                    </div>

                    {editingText && (
                      <div className="mt-4 space-y-3 rounded-xl bg-white p-4 ring-1 ring-line">
                        <textarea
                          autoFocus
                          rows={2}
                          maxLength={120}
                          value={textDraft.text}
                          onChange={(e) => setTextDraft(t => ({ ...t, text: e.target.value }))}
                          placeholder="Your text (Enter for a new line)"
                          className="field resize-none"
                        />
                        <div className="no-scrollbar flex gap-2 overflow-x-auto">
                          {TEXT_FONTS.map(f => (
                            <button
                              key={f.id}
                              onClick={() => setTextDraft(t => ({ ...t, font: f.id }))}
                              className={`shrink-0 rounded-lg border px-3 py-1.5 text-sm ${textDraft.font === f.id ? 'border-ink bg-ink text-white' : 'border-line'}`}
                              style={{ fontFamily: f.family, fontWeight: f.weight, fontStyle: f.style ?? 'normal' }}
                            >
                              {f.label}
                            </button>
                          ))}
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          {TEXT_COLORS.map(c => (
                            <button
                              key={c}
                              aria-label={`Text colour ${c}`}
                              onClick={() => setTextDraft(t => ({ ...t, color: c }))}
                              className={`h-7 w-7 rounded-full ring-1 ring-black/15 ${textDraft.color === c ? 'ring-2 ring-ink ring-offset-2' : ''}`}
                              style={{ backgroundColor: c }}
                            />
                          ))}
                          <label className="relative h-7 w-7 cursor-pointer overflow-hidden rounded-full bg-[conic-gradient(red,yellow,lime,cyan,blue,magenta,red)] ring-1 ring-black/15" title="Custom colour">
                            <input type="color" value={textDraft.color} onChange={(e) => setTextDraft(t => ({ ...t, color: e.target.value }))} className="absolute inset-0 cursor-pointer opacity-0" />
                          </label>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => applyText(p)} disabled={busyKey === p.key} className="btn-primary px-5 py-2">
                            {busyKey === p.key && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Apply text
                          </button>
                          <button onClick={() => setTextEditorFor(null)} className="btn px-4 py-2 text-muted hover:text-ink">Cancel</button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            {notice && (
              <p className={`mt-4 flex items-start gap-2 rounded-xl px-4 py-3 text-sm ${notice.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-800'}`}>
                {notice.type === 'error' ? <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> : <Info className="mt-0.5 h-4 w-4 shrink-0" />}
                {notice.text}
              </p>
            )}
          </div>

          {/* Size & quantity */}
          <div className="card p-5 sm:p-6">
            <h3 className="text-sm font-semibold">3. Size &amp; quantity</h3>
            <div className="mt-4 flex flex-wrap gap-2">
              {garment.sizes.map(s => (
                <button
                  key={s.label}
                  onClick={() => setSize(s.label)}
                  className={`min-w-14 rounded-xl border px-3 py-2.5 text-sm font-semibold transition ${size === s.label ? 'border-ink bg-ink text-white' : 'border-line bg-white hover:border-ink'}`}
                >
                  {s.label}
                  {Number(s.extra) > 0 && <span className={`block text-[10px] font-medium ${size === s.label ? 'text-white/60' : 'text-muted'}`}>+{inr(s.extra)}</span>}
                </button>
              ))}
            </div>
            <div className="mt-5 flex items-center justify-between">
              <span className="text-sm text-muted">Quantity</span>
              <div className="flex items-center rounded-full border border-line bg-white">
                <button onClick={() => setQuantity(q => Math.max(1, q - 1))} className="grid h-10 w-10 place-items-center rounded-full hover:bg-paper" aria-label="Decrease quantity"><Minus className="h-4 w-4" /></button>
                <input
                  value={quantity}
                  onChange={(e) => setQuantity(Math.min(MAX_QTY, Math.max(1, parseInt(e.target.value.replace(/\D/g, '')) || 1)))}
                  inputMode="numeric"
                  className="w-12 bg-transparent text-center text-sm font-semibold outline-none"
                  aria-label="Quantity"
                />
                <button onClick={() => setQuantity(q => Math.min(MAX_QTY, q + 1))} className="grid h-10 w-10 place-items-center rounded-full hover:bg-paper" aria-label="Increase quantity"><Plus className="h-4 w-4" /></button>
              </div>
            </div>
          </div>

          {/* Price */}
          <div className="card overflow-hidden">
            <div className="space-y-2.5 p-5 text-sm sm:p-6">
              <div className="flex justify-between"><span className="text-muted">{garment.name} ({colorName})</span><span>{inr(pricing.base)}</span></div>
              {pricing.prints.map(p => (
                <div key={p.key} className="flex justify-between"><span className="text-muted">{p.label}</span><span>+{inr(p.price)}</span></div>
              ))}
              {pricing.sizeExtra > 0 && <div className="flex justify-between"><span className="text-muted">Size {size}</span><span>+{inr(pricing.sizeExtra)}</span></div>}
              <div className="flex justify-between border-t border-dashed border-line pt-2.5 font-medium"><span>Per piece</span><span>{inr(pricing.unit)}</span></div>
              {quantity > 1 && <div className="flex justify-between text-muted"><span>× {quantity} pieces</span><span /></div>}
            </div>
            <div className="flex items-center justify-between bg-ink px-5 py-5 text-white sm:px-6">
              <div>
                <p className="text-xs uppercase tracking-wider text-white/50">Total</p>
                <p className="font-display text-3xl font-bold">{inr(pricing.total)}</p>
              </div>
              <button onClick={startCheckout} className="btn-accent hidden px-7 py-3.5 lg:inline-flex">Place order</button>
            </div>
          </div>

          {whatsappQuestion && (
            <a href={whatsappQuestion} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 text-sm font-semibold text-muted hover:text-ink">
              <MessageCircle className="h-4 w-4" /> Questions? Chat with us on WhatsApp
            </a>
          )}
        </div>
      </div>

      {/* Mobile sticky checkout bar */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white/95 px-4 py-3 backdrop-blur lg:hidden">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-[11px] uppercase tracking-wider text-muted">{quantity} × {inr(pricing.unit)}</p>
            <p className="font-display text-xl font-bold">{inr(pricing.total)}</p>
          </div>
          <button onClick={startCheckout} className="btn-accent px-7">Place order</button>
        </div>
      </div>

      {checkoutOpen && (
        <CheckoutModal
          summary={{
            title: `${garment.name} · ${colorName} · ${size}`,
            subtitle: `${pricing.prints.map(p => p.label).join(', ')} · Qty ${quantity}`,
            total: pricing.total,
          }}
          buildOrderForm={buildOrderForm}
          onClose={() => setCheckoutOpen(false)}
          onPlaced={(order) => { setCheckoutOpen(false); setPlacedOrder(order); window.scrollTo({ top: 0 }); }}
        />
      )}
    </div>
  );
}
