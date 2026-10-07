import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight, ArrowUpRight, BadgeCheck, Droplets, Layers, Palette, Shirt, Sparkles, Truck, Upload, Users,
} from 'lucide-react';
import ProductCard from '../components/ProductCard';
import EnquiryForm from '../components/EnquiryForm';
import { getBanners, getGarments, getProducts } from '../services/api';
import { useSiteSettings } from '../context/SiteSettingsContext';
import type { Garment, Product } from '../types';
import { inr } from '../utils/format';
import { getImageUrl } from '../utils/imageUtils';

interface Banner {
  id: number;
  title?: string;
  subtitle?: string;
  imageUrl: string;
  link?: string;
}

const MARQUEE = ['Custom Hoodies', 'Oversized Tees', 'Polo T-Shirts', 'Team & College Merch', 'Corporate Uniforms', 'Event T-Shirts', 'Bulk Orders'];

const STEPS = [
  { icon: Shirt, title: 'Pick your garment', text: 'Hoodie, oversized tee or polo — in the colour you love.' },
  { icon: Upload, title: 'Add your print', text: 'Upload artwork or type text on the chest, front or back. Move and resize it live.' },
  { icon: BadgeCheck, title: 'Verify & order', text: 'Confirm with a quick email code. We print, pack and ship it to your door.' },
];

export default function HomePage() {
  const { settings } = useSiteSettings();
  const [garments, setGarments] = useState<Garment[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);

  useEffect(() => {
    getGarments().then(setGarments).catch(() => setGarments([]));
    getProducts().then(d => setProducts((Array.isArray(d) ? d : d.products || []).slice(0, 8))).catch(() => setProducts([]));
    getBanners().then(d => setBanners(Array.isArray(d) ? d : [])).catch(() => setBanners([]));
  }, []);

  const hoodie = garments.find(g => g.style === 'hoodie');
  const showcase = garments[0];
  // Hero uses a real photo (first banner, else the brand-story image) — the
  // design-studio drawings stay in the studio, they are heavy to render.
  const heroImage = banners[0]?.imageUrl || settings?.aboutImage1 || '';
  const examplePrints = showcase ? [
    showcase.placements.find(p => p.enabled && p.view === 'front' && p.w * p.h > 0.05) ?? showcase.placements.find(p => p.enabled && p.view === 'front'),
    showcase.placements.find(p => p.enabled && p.view === 'back'),
  ].filter((p): p is NonNullable<typeof p> => !!p) : [];
  const exampleTotal = (Number(showcase?.basePrice) || 0) + examplePrints.reduce((s, p) => s + (Number(p.price) || 0), 0);
  const features = [
    { icon: Layers, title: settings?.feature1Title || 'Heavyweight cotton', text: settings?.feature1Desc || '180 to 350 GSM pre-shrunk combed cotton for maximum durability.' },
    { icon: Droplets, title: settings?.feature2Title || 'Precision printing', text: settings?.feature2Desc || 'Vibrant, crack-resistant prints with high detail.' },
    { icon: Sparkles, title: settings?.feature3Title || 'Bio-washed & pre-shrunk', text: settings?.feature3Desc || 'Ultra-soft feel with no fading or shrinkage.' },
    { icon: Users, title: settings?.feature4Title || 'Bulk & team orders', text: settings?.feature4Desc || 'Custom apparel for colleges, events and companies.' },
  ];

  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div className="container-x grid items-center gap-10 pb-16 pt-10 sm:pt-14 lg:grid-cols-12 lg:pb-24">
          <div className="animate-fade-up lg:col-span-6">
            <p className="eyebrow"><span className="h-1.5 w-1.5 rounded-full bg-accent" /> Custom apparel studio</p>
            <h1 className="mt-5 font-display text-[clamp(2.75rem,8vw,5.75rem)] font-extrabold leading-[0.95] tracking-tight">
              Wear what<br />you <span className="relative inline-block text-accent">imagine.
                <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 300 12" fill="none" aria-hidden="true"><path d="M2 9c60-6 180-8 296-3" stroke="currentColor" strokeWidth="4" strokeLinecap="round" /></svg>
              </span>
            </h1>
            <p className="mt-7 max-w-lg text-base leading-relaxed text-muted sm:text-lg">
              Premium hoodies, oversized tees and polos printed with your artwork. Design it live in our studio and see the exact price before you order.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link to="/customize" className="btn-accent px-8 py-4 text-base">Start designing <ArrowRight className="h-4 w-4" /></Link>
              <Link to="/shop" className="btn-outline px-8 py-4 text-base">Shop collection</Link>
            </div>
            <ul className="mt-10 grid max-w-lg grid-cols-3 gap-4 border-t border-line pt-6 text-sm">
              <li><p className="font-display text-2xl font-bold">{garments.length || 3}</p><p className="text-muted">garment styles</p></li>
              <li><p className="font-display text-2xl font-bold">{Math.max(...garments.map(g => g.colors.length), 6)}+</p><p className="text-muted">base colours</p></li>
              <li><p className="font-display text-2xl font-bold">1–500</p><p className="text-muted">pieces / order</p></li>
            </ul>
          </div>

          <div className="relative lg:col-span-6">
            <div className="absolute inset-x-6 bottom-0 top-10 overflow-hidden rounded-[2.5rem] bg-paper-deep sm:inset-x-10">
              <div className="absolute -right-10 -top-10 h-64 w-64 rounded-full bg-accent/50 blur-3xl" />
              <div className="absolute -bottom-16 -left-10 h-56 w-56 rounded-full bg-[#b9a7d6]/50 blur-3xl" />
            </div>
            <div className="relative px-6 pt-6 sm:px-10">
              <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem] bg-paper-deep shadow-2xl shadow-ink/10 sm:aspect-[5/5] lg:aspect-[4/5]">
                {heroImage ? (
                  <img src={getImageUrl(heroImage)} alt={banners[0]?.title || 'Custom printed apparel'} decoding="async" className="h-full w-full object-cover" />
                ) : (
                  <div className="grid h-full place-items-center bg-ink">
                    <img src="/brand-logo.jpg" alt="" className="h-40 w-40 rounded-3xl object-contain" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-ink/40 via-transparent to-transparent" />
              </div>
            </div>
            <div className="absolute left-2 top-10 z-20 rounded-2xl bg-white px-4 py-3 shadow-xl ring-1 ring-line sm:left-4">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">Live pricing</p>
              <p className="mt-1 text-sm">Hoodie {inr(hoodie?.basePrice ?? 500)} <span className="text-muted">+ back print</span></p>
            </div>
            <div className="absolute bottom-6 right-4 z-20 flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm font-semibold shadow-xl ring-1 ring-line sm:right-10">
              <Palette className="h-4 w-4 text-accent" /> {hoodie?.colors.length ?? 6}+ colours
            </div>
          </div>
        </div>
      </section>

      {/* ── Marquee ──────────────────────────────────────────────────────── */}
      <div className="overflow-hidden border-y border-ink bg-ink py-4 text-white">
        <div className="flex w-max animate-marquee">
          {[0, 1].map(k => (
            <div key={k} className="flex shrink-0 items-center" aria-hidden={k === 1}>
              {MARQUEE.map(t => (
                <span key={t} className="flex items-center whitespace-nowrap px-6 font-display text-xl font-bold uppercase tracking-tight sm:text-2xl">
                  {t}<span className="ml-12 text-accent">✦</span>
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* ── Garments ─────────────────────────────────────────────────────── */}
      {garments.length > 0 && (
        <section className="container-x py-20 sm:py-28">
          <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
            <div>
              <p className="eyebrow">Choose your canvas</p>
              <h2 className="mt-3 max-w-xl font-display text-4xl font-bold tracking-tight sm:text-5xl">Blanks built to carry your design.</h2>
            </div>
            <Link to="/customize" className="group inline-flex items-center gap-2 text-sm font-semibold">
              Open design studio <ArrowUpRight className="h-4 w-4 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </Link>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {garments.map((g, i) => (
              <Link key={g.id} to={`/customize/${g.key}`} className="group card flex flex-col overflow-hidden transition hover:-translate-y-1 hover:shadow-xl hover:shadow-ink/5">
                <div className={`relative flex aspect-[4/3] flex-col justify-between p-6 sm:p-8 ${['bg-paper-deep', 'bg-[#e7e4f0]', 'bg-[#e3ebe5]'][i % 3]}`}>
                  <div className="flex items-start justify-between">
                    <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white/80"><Shirt className="h-6 w-6" /></span>
                    {g.fabric && <span className="rounded-full bg-white/80 px-3 py-1 text-xs font-semibold">{g.fabric}</span>}
                  </div>
                  <div>
                    <div className="flex -space-x-3">
                      {g.colors.slice(0, 7).map(c => (
                        <span key={c.hex} className="h-12 w-12 rounded-full shadow-sm ring-4 ring-white/80 transition duration-300 group-hover:translate-x-1 sm:h-14 sm:w-14" style={{ backgroundColor: c.hex }} title={c.name} />
                      ))}
                    </div>
                    <p className="mt-3 text-xs font-semibold text-ink/60">{g.colors.length} colours · {g.sizes.length} sizes · {g.placements.filter(p => p.enabled).length} print spots</p>
                  </div>
                </div>
                <div className="flex flex-1 items-end justify-between gap-4 p-6">
                  <div>
                    <h3 className="font-display text-2xl font-bold">{g.name}</h3>
                    <p className="mt-1 text-sm text-muted">{g.tagline}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-xs text-muted">from</p>
                    <p className="font-display text-xl font-bold">{inr(g.basePrice)}</p>
                  </div>
                </div>
                <p className="flex items-center gap-1.5 border-t border-line px-6 py-4 text-sm font-semibold">
                  Customise <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── How it works ─────────────────────────────────────────────────── */}
      <section className="bg-white py-20 sm:py-28">
        <div className="container-x">
          <p className="eyebrow">How it works</p>
          <h2 className="mt-3 max-w-2xl font-display text-4xl font-bold tracking-tight sm:text-5xl">From idea to doorstep in three steps.</h2>
          <div className="mt-14 grid gap-px overflow-hidden rounded-3xl bg-line md:grid-cols-3">
            {STEPS.map(({ icon: Icon, title, text }, i) => (
              <div key={title} className="bg-white p-8 sm:p-10">
                <div className="flex items-center justify-between">
                  <span className="grid h-12 w-12 place-items-center rounded-2xl bg-paper"><Icon className="h-5 w-5" /></span>
                  <span className="font-display text-6xl font-extrabold text-paper-deep">0{i + 1}</span>
                </div>
                <h3 className="mt-8 font-display text-xl font-bold">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Print placements ─────────────────────────────────────────────── */}
      {showcase && (
        <section className="overflow-hidden bg-ink py-20 text-white sm:py-28">
          <div className="container-x grid items-center gap-14 lg:grid-cols-2">
            <div>
              <p className="eyebrow text-white/50">Transparent pricing</p>
              <h2 className="mt-3 font-display text-4xl font-bold tracking-tight sm:text-5xl">Choose where it prints. Pay only for what you add.</h2>
              <p className="mt-5 max-w-md text-white/60">Every garment has a base price. Each print spot adds a fixed amount — the total updates instantly in the studio.</p>
              <ul className="mt-10 divide-y divide-white/10 border-y border-white/10">
                <li className="flex items-center justify-between py-4">
                  <span>{showcase.name} <span className="text-white/50">(base)</span></span>
                  <span className="font-display text-lg font-bold">{inr(showcase.basePrice)}</span>
                </li>
                {showcase.placements.filter(p => p.enabled).map(p => (
                  <li key={p.key} className="flex items-center justify-between py-4">
                    <span className="flex items-center gap-3"><span className="h-2 w-2 rounded-full bg-accent" />{p.label}</span>
                    <span className="font-display text-lg font-bold text-accent">+{inr(p.price)}</span>
                  </li>
                ))}
              </ul>
              <Link to={`/customize/${showcase.key}`} className="btn-accent mt-10 px-8 py-4">Try it in the studio</Link>
            </div>
            <div className="relative mx-auto w-full max-w-md">
              <div className="absolute -inset-6 rounded-[2.5rem] bg-accent/20 blur-3xl" />
              <div className="relative rounded-3xl bg-white p-6 text-ink shadow-2xl sm:p-8">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted">Example order</p>
                  <span className="flex -space-x-1.5">
                    {showcase.colors.slice(0, 4).map(c => <span key={c.hex} className="h-5 w-5 rounded-full ring-2 ring-white" style={{ backgroundColor: c.hex }} />)}
                  </span>
                </div>
                <p className="mt-2 font-display text-2xl font-bold">{showcase.name}</p>
                <ul className="mt-6 space-y-3 text-sm">
                  <li className="flex justify-between"><span className="text-muted">Base price</span><span className="font-semibold">{inr(showcase.basePrice)}</span></li>
                  {examplePrints.map(p => (
                    <li key={p.key} className="flex justify-between"><span className="text-muted">+ {p.label}</span><span className="font-semibold">{inr(p.price)}</span></li>
                  ))}
                </ul>
                <div className="mt-5 flex items-baseline justify-between border-t border-dashed border-line pt-5">
                  <span className="text-sm font-semibold">Per piece</span>
                  <span className="font-display text-4xl font-bold text-accent">{inr(exampleTotal)}</span>
                </div>
                <p className="mt-3 text-xs text-muted">Add more print spots or bigger sizes and the total updates instantly in the studio.</p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── Products ─────────────────────────────────────────────────────── */}
      {products.length > 0 && (
        <section className="container-x py-20 sm:py-28">
          <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
            <div>
              <p className="eyebrow">Ready to wear</p>
              <h2 className="mt-3 font-display text-4xl font-bold tracking-tight sm:text-5xl">Fresh from the press.</h2>
            </div>
            <Link to="/shop" className="btn-outline">View all products</Link>
          </div>
          <div className="mt-12 grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 lg:grid-cols-4">
            {products.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
      )}

      {/* ── Lookbook (admin banners) ─────────────────────────────────────── */}
      {banners.length > 0 && (
        <section className="pb-20 sm:pb-28">
          <div className="container-x"><p className="eyebrow">Lookbook</p></div>
          <div className="no-scrollbar mt-6 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 sm:px-6 lg:px-8 xl:px-[max(2rem,calc((100vw_-_80rem)/2_+_2rem))]">
            {banners.map(b => {
              const inner = (
                <div className="group relative h-[420px] w-[78vw] shrink-0 snap-start overflow-hidden rounded-3xl sm:w-[460px]">
                  <img src={getImageUrl(b.imageUrl)} alt={b.title || ''} loading="lazy" className="h-full w-full object-cover transition duration-700 group-hover:scale-105" />
                  {(b.title || b.subtitle) && (
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent p-6 text-white">
                      {b.title && <h3 className="font-display text-2xl font-bold">{b.title}</h3>}
                      {b.subtitle && <p className="mt-1 text-sm text-white/75">{b.subtitle}</p>}
                    </div>
                  )}
                </div>
              );
              return b.link
                ? <a key={b.id} href={b.link} className="contents">{inner}</a>
                : <div key={b.id} className="contents">{inner}</div>;
            })}
          </div>
        </section>
      )}

      {/* ── Why us ───────────────────────────────────────────────────────── */}
      <section className="border-t border-line bg-white py-20 sm:py-28">
        <div className="container-x">
          <div className="grid gap-12 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <p className="eyebrow">{settings?.aboutSubtitle || 'Why choose us'}</p>
              <h2 className="mt-3 font-display text-4xl font-bold tracking-tight">{settings?.aboutTitle || 'Quality you can feel, prints that last.'}</h2>
              <Link to="/about" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold hover:text-accent">Our story <ArrowRight className="h-4 w-4" /></Link>
            </div>
            <div className="grid gap-8 sm:grid-cols-2 lg:col-span-8">
              {features.map(({ icon: Icon, title, text }) => (
                <div key={title} className="flex gap-5">
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-accent-soft text-accent"><Icon className="h-5 w-5" /></span>
                  <div>
                    <h3 className="font-semibold">{title}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-muted">{text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Bulk orders ──────────────────────────────────────────────────── */}
      <section className="container-x py-20 sm:py-28">
        <div className="grid gap-10 rounded-[2rem] bg-paper-deep p-6 sm:p-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <p className="eyebrow">Bulk & corporate</p>
            <h2 className="mt-3 font-display text-4xl font-bold tracking-tight sm:text-5xl">Ordering for a team, event or brand?</h2>
            <p className="mt-5 max-w-md text-muted">Tell us the quantity, garments and artwork you have in mind and we'll get back with a quote for your bulk order.</p>
            <ul className="mt-8 space-y-3 text-sm">
              {['Quotes for bulk quantities', 'Help with artwork & mock-ups', 'Mixed sizes and colours in one order'].map(t => (
                <li key={t} className="flex items-center gap-3"><Truck className="h-4 w-4 text-accent" />{t}</li>
              ))}
            </ul>
          </div>
          <EnquiryForm compact />
        </div>
      </section>
    </>
  );
}
