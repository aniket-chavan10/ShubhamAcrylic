import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight, ArrowUpRight, BadgeCheck, Briefcase, CalendarDays, Droplets, Gift, GraduationCap, Layers, MessageCircle,
  MousePointerClick, Palette, Shirt, Sparkles, Store, Trophy, Truck, Upload, Users,
} from 'lucide-react';
import ProductCard from '../components/ProductCard';
import EnquiryForm from '../components/EnquiryForm';
import SmoothImage from '../components/SmoothImage';
import { getBanners, getGarments, getProducts } from '../services/api';
import { useSiteSettings } from '../context/SiteSettingsContext';
import type { Garment, Product } from '../types';
import { inr, waLink } from '../utils/format';
import { getImageUrl } from '../utils/imageUtils';

interface Banner {
  id: number;
  title?: string;
  subtitle?: string;
  imageUrl: string;
  link?: string;
}

const MARQUEE = ['T-Shirt Printing', 'Hoodie Printing', 'Oversized Tees', 'Polo T-Shirts', 'Team & College Merch', 'Corporate Uniforms', 'Event T-Shirts', 'Bulk Orders'];

const USES = [
  { icon: Briefcase, title: 'Corporate & uniforms', text: 'Logo polos and tees for staff, offices and company events.' },
  { icon: GraduationCap, title: 'Colleges & fests', text: 'Batch hoodies, club tees and fest merch in every size.' },
  { icon: Trophy, title: 'Sports teams', text: 'Team tees with names and numbers on the back.' },
  { icon: CalendarDays, title: 'Events & campaigns', text: 'Matching tees for marathons, launches, weddings and drives.' },
  { icon: Store, title: 'Brands & merch', text: 'Print your own clothing line or creator merch, small runs welcome.' },
  { icon: Gift, title: 'Personal & gifts', text: 'A single custom tee or hoodie with your photo, name or quote.' },
];

// Last banner list, so a returning visitor sees the hero photo instantly
const BANNER_CACHE = 'home-banners';
const cachedBanners = (): Banner[] => {
  try { return JSON.parse(localStorage.getItem(BANNER_CACHE) || '[]'); } catch { return []; }
};

/** The admin's banner photos, cross-fading. A soft placeholder shows until the first one loads. */
function HeroSlideshow({ banners }: { banners: Banner[] }) {
  const [index, setIndex] = useState(0);
  const [loaded, setLoaded] = useState<Record<number, boolean>>({});
  const slides = banners.slice(0, 5);

  useEffect(() => {
    if (slides.length < 2) return;
    const t = setInterval(() => setIndex(i => (i + 1) % slides.length), 5000);
    return () => clearInterval(t);
  }, [slides.length]);

  return (
    <>
      <div className={`absolute inset-0 bg-paper-deep ${loaded[slides[0]?.id] ? '' : 'animate-pulse'}`} />
      {slides.map((b, i) => (
        <img
          key={b.id}
          src={getImageUrl(b.imageUrl)}
          alt={b.title || 'Custom printed apparel'}
          loading={i === 0 ? 'eager' : 'lazy'}
          decoding="async"
          onLoad={() => setLoaded(l => ({ ...l, [b.id]: true }))}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ease-out ${i === index && loaded[b.id] ? 'opacity-100' : 'opacity-0'}`}
        />
      ))}
    </>
  );
}

const STEPS = [
  { icon: Upload, title: 'Share your design', text: 'Send your logo, artwork or text on WhatsApp or the quote form, with the garment, colours and quantity.' },
  { icon: BadgeCheck, title: 'Approve mock-up & price', text: 'We send a preview and a clear quote. Nothing is printed until you say yes.' },
  { icon: Truck, title: 'We print & deliver', text: 'Printed on premium cotton, checked, packed and shipped to your door.' },
];

export default function HomePage() {
  const { settings } = useSiteSettings();
  const [garments, setGarments] = useState<Garment[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [banners, setBanners] = useState<Banner[]>(cachedBanners);
  const [catalogue, setCatalogue] = useState<Product[]>([]);

  useEffect(() => {
    getGarments().then(setGarments).catch(() => setGarments([]));
    getProducts().then(d => {
      const list: Product[] = Array.isArray(d) ? d : d.products || [];
      setCatalogue(list);
      setProducts(list.slice(0, 8));
    }).catch(() => setProducts([]));
    getBanners().then(d => {
      const list: Banner[] = Array.isArray(d) ? d : [];
      setBanners(list);
      try { localStorage.setItem(BANNER_CACHE, JSON.stringify(list.slice(0, 5))); } catch { /* storage unavailable */ }
    }).catch(() => undefined);
  }, []);

  const showcase = garments[0];
  // Card photo: the one uploaded for the garment in the admin, else one of our own product photos
  const cardPhotos = useMemo(() => {
    const photos = catalogue
      .map(p => ({ name: p.name.toLowerCase(), url: p.imageUrl || p.images?.find(i => i.isMain)?.imageUrl || p.images?.[0]?.imageUrl }))
      .filter((p): p is { name: string; url: string } => !!p.url);
    const used = new Set<string>();
    return garments.map((g, i) => {
      if (g.coverImage) return getImageUrl(g.coverImage);
      const word = g.style === 'oversized-tee' ? 'oversized' : g.style;
      const pick = photos.find(p => p.name.includes(word) && !used.has(p.url)) ?? photos.filter(p => !used.has(p.url))[i] ?? photos[0];
      if (!pick) return '';
      used.add(pick.url);
      return getImageUrl(pick.url);
    });
  }, [garments, catalogue]);
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

  const quoteWa = settings?.whatsappNumber
    ? waLink(settings.whatsappNumber, `Hi ${settings.companyName || 'Astitva Creations'}, I'd like a quote for custom printing.\n\nGarment (tee / hoodie / polo): \nQuantity: \nPrint on (front / back): \n\nI'll share my design here.`)
    : '';
  const colourCount = Math.max(...garments.map(g => g.colors.length), 6);

  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div className="container-x grid items-center gap-10 pb-16 pt-10 sm:pt-14 lg:grid-cols-12 lg:pb-24">
          <div className="animate-fade-up lg:col-span-6">
            <p className="eyebrow"><span className="h-1.5 w-1.5 rounded-full bg-accent" /> Custom t-shirt & hoodie printing</p>
            <h1 className="mt-5 font-display text-[clamp(2.6rem,7.5vw,5.5rem)] font-extrabold leading-[0.95] tracking-tight">
              Your design,<br /><span className="relative inline-block text-accent">printed
                <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 300 12" fill="none" aria-hidden="true"><path d="M2 9c60-6 180-8 296-3" stroke="currentColor" strokeWidth="4" strokeLinecap="round" /></svg>
              </span> to last.
            </h1>
            <p className="mt-7 max-w-lg text-base leading-relaxed text-muted sm:text-lg">
              We print your logo, artwork or text on premium t-shirts, hoodies, oversized tees and polos. For teams, colleges, events and brands, from a single piece to bulk orders.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <a href="#quote" className="btn-accent px-8 py-4 text-base">Get a printing quote <ArrowRight className="h-4 w-4" /></a>
              <Link to="/shop" className="btn-outline px-8 py-4 text-base">Shop printed apparel</Link>
            </div>
            <p className="mt-5 text-sm text-muted">
              Want to see it first?{' '}
              <Link to="/customize" className="font-semibold text-ink underline decoration-accent decoration-2 underline-offset-4 hover:text-accent">Try your design online</Link>
            </p>
            <ul className="mt-10 grid max-w-lg grid-cols-3 gap-4 border-t border-line pt-6 text-sm">
              <li><p className="font-display text-2xl font-bold">1–500+</p><p className="text-muted">pieces / order</p></li>
              <li><p className="font-display text-2xl font-bold">{garments.length || 3}</p><p className="text-muted">garment styles</p></li>
              <li><p className="font-display text-2xl font-bold">{colourCount}+</p><p className="text-muted">base colours</p></li>
            </ul>
          </div>

          <div className="relative lg:col-span-6">
            <div className="absolute inset-x-6 bottom-0 top-10 overflow-hidden rounded-[2.5rem] bg-paper-deep sm:inset-x-10">
              <div className="absolute -right-10 -top-10 h-64 w-64 rounded-full bg-accent/50 blur-3xl" />
              <div className="absolute -bottom-16 -left-10 h-56 w-56 rounded-full bg-[#b9a7d6]/50 blur-3xl" />
            </div>
            <div className="relative px-6 pt-6 sm:px-10">
              <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem] bg-paper-deep shadow-2xl shadow-ink/10 sm:aspect-square lg:aspect-[4/5]">
                <HeroSlideshow banners={banners} />
                <div className="absolute inset-0 bg-gradient-to-t from-ink/40 via-transparent to-transparent" />
              </div>
            </div>
            <div className="absolute left-2 top-10 z-20 rounded-2xl bg-white px-4 py-3 shadow-xl ring-1 ring-line sm:left-4">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">Bulk orders welcome</p>
              <p className="mt-1 text-sm">Teams · colleges · events</p>
            </div>
            <div className="absolute bottom-6 right-4 z-20 flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm font-semibold shadow-xl ring-1 ring-line sm:right-10">
              <Palette className="h-4 w-4 text-accent" /> {colourCount}+ colours
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

      {/* ── What we print ────────────────────────────────────────────────── */}
      <section className="container-x py-20 sm:py-28">
        <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
          <div>
            <p className="eyebrow">What we print</p>
            <h2 className="mt-3 max-w-2xl font-display text-4xl font-bold tracking-tight sm:text-5xl">Custom printing for every occasion.</h2>
          </div>
          <a href="#quote" className="group inline-flex items-center gap-2 text-sm font-semibold">
            Ask for a quote <ArrowUpRight className="h-4 w-4 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </a>
        </div>
        <div className="mt-12 grid gap-px overflow-hidden rounded-3xl bg-line sm:grid-cols-2 lg:grid-cols-3">
          {USES.map(({ icon: Icon, title, text }) => (
            <div key={title} className="flex gap-5 bg-white p-6 sm:p-8">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-accent-soft text-accent"><Icon className="h-5 w-5" /></span>
              <div>
                <h3 className="font-display text-lg font-bold">{title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Products ─────────────────────────────────────────────────────── */}
      {products.length > 0 && (
        <section className="container-x pb-20 sm:pb-28">
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

      {/* ── Garments ─────────────────────────────────────────────────────── */}
      {garments.length > 0 && (
        <section className="bg-white py-20 sm:py-28">
          <div className="container-x">
            <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
              <div>
                <p className="eyebrow">What we print on</p>
                <h2 className="mt-3 max-w-xl font-display text-4xl font-bold tracking-tight sm:text-5xl">Premium blanks, printed your way.</h2>
              </div>
              <a href="#quote" className="group inline-flex items-center gap-2 text-sm font-semibold">
                Need a bulk price? <ArrowUpRight className="h-4 w-4 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </a>
            </div>
            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {garments.map((g, i) => (
                <Link key={g.id} to={`/customize/${g.key}`} className="group card flex flex-col overflow-hidden transition hover:-translate-y-1 hover:shadow-xl hover:shadow-ink/5">
                  <div className={`relative aspect-[4/3] overflow-hidden ${['bg-paper-deep', 'bg-[#e7e4f0]', 'bg-[#e3ebe5]'][i % 3]}`}>
                    {cardPhotos[i] && (
                      <div className="h-full w-full transition duration-700 ease-out group-hover:scale-105">
                        <SmoothImage src={cardPhotos[i]} alt={g.name} loading="lazy" decoding="async" className="h-full w-full object-cover" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-ink/55 via-transparent to-transparent" />
                    {g.fabric && <span className="absolute right-4 top-4 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold backdrop-blur">{g.fabric}</span>}
                    <div className="absolute inset-x-4 bottom-4 flex items-center justify-between gap-3">
                      <div className="flex -space-x-2">
                        {g.colors.slice(0, 6).map(c => (
                          <span key={c.hex} className="h-7 w-7 rounded-full ring-2 ring-white" style={{ backgroundColor: c.hex }} title={c.name} />
                        ))}
                      </div>
                      <span className="text-xs font-semibold text-white/90">{g.colors.length} colours · {g.sizes.length} sizes</span>
                    </div>
                  </div>
                  <div className="flex flex-1 items-end justify-between gap-4 p-6">
                    <div>
                      <h3 className="font-display text-2xl font-bold">{g.name} printing</h3>
                      <p className="mt-1 text-sm text-muted">{g.tagline}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-xs text-muted">from</p>
                      <p className="font-display text-xl font-bold">{inr(g.basePrice)}</p>
                    </div>
                  </div>
                  <p className="flex items-center gap-1.5 border-t border-line px-6 py-4 text-sm font-semibold">
                    Order with your print <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── How it works ─────────────────────────────────────────────────── */}
      <section className="py-20 sm:py-28">
        <div className="container-x">
          <p className="eyebrow">How it works</p>
          <h2 className="mt-3 max-w-2xl font-display text-4xl font-bold tracking-tight sm:text-5xl">From your idea to a printed tee in three steps.</h2>
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
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            {quoteWa && (
              <a href={quoteWa} target="_blank" rel="noreferrer" className="btn bg-[#25D366] px-6 py-3.5 text-white hover:bg-[#1ebe5a]">
                <MessageCircle className="h-4 w-4" /> Send your design on WhatsApp
              </a>
            )}
            <a href="#quote" className="btn-outline px-6 py-3.5">Fill the quote form</a>
          </div>
        </div>
      </section>

      {/* ── Feature: online design studio ────────────────────────────────── */}
      {showcase && (
        <section className="overflow-hidden bg-ink py-20 text-white sm:py-28">
          <div className="container-x grid items-center gap-14 lg:grid-cols-2">
            <div>
              <p className="eyebrow text-white/50">Online design studio</p>
              <h2 className="mt-3 font-display text-4xl font-bold tracking-tight sm:text-5xl">Want to see it before we print it?</h2>
              <p className="mt-5 max-w-md text-white/60">
                Upload your artwork or type your text, place it on the chest, front or back, and see the garment with your print and its exact price. Order straight from there and we'll print it.
              </p>
              <ul className="mt-8 space-y-3 text-sm text-white/80">
                {[
                  { icon: Shirt, text: 'Pick the garment, colour and size' },
                  { icon: MousePointerClick, text: 'Drag, resize and rotate your print live, in 3D too' },
                  { icon: BadgeCheck, text: 'Price updates as you add print spots' },
                ].map(({ icon: Icon, text }) => (
                  <li key={text} className="flex items-center gap-3"><Icon className="h-4 w-4 text-accent" />{text}</li>
                ))}
              </ul>
              <Link to={`/customize/${showcase.key}`} className="btn-accent mt-10 px-8 py-4">Try the design studio <ArrowRight className="h-4 w-4" /></Link>
            </div>
            <div className="relative mx-auto w-full max-w-md">
              <div className="absolute -inset-6 rounded-[2.5rem] bg-accent/20 blur-3xl" />
              <div className="relative rounded-3xl bg-white p-6 text-ink shadow-2xl sm:p-8">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted">Example price</p>
                  <span className="flex -space-x-1.5">
                    {showcase.colors.slice(0, 4).map(c => <span key={c.hex} className="h-5 w-5 rounded-full ring-2 ring-white" style={{ backgroundColor: c.hex }} />)}
                  </span>
                </div>
                <p className="mt-2 font-display text-2xl font-bold">{showcase.name}</p>
                <ul className="mt-6 space-y-3 text-sm">
                  <li className="flex justify-between"><span className="text-muted">Garment</span><span className="font-semibold">{inr(showcase.basePrice)}</span></li>
                  {examplePrints.map(p => (
                    <li key={p.key} className="flex justify-between"><span className="text-muted">+ {p.label}</span><span className="font-semibold">{inr(p.price)}</span></li>
                  ))}
                </ul>
                <div className="mt-5 flex items-baseline justify-between border-t border-dashed border-line pt-5">
                  <span className="text-sm font-semibold">Per piece</span>
                  <span className="font-display text-4xl font-bold text-accent">{inr(exampleTotal)}</span>
                </div>
                <p className="mt-3 text-xs text-muted">Ordering in bulk? <a href="#quote" className="font-semibold text-ink underline underline-offset-2">Ask us for a quote</a>.</p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── Lookbook (admin banners) ─────────────────────────────────────── */}
      {banners.length > 0 && (
        <section className="py-20 sm:py-28">
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

      {/* ── Quote / bulk orders ──────────────────────────────────────────── */}
      <section id="quote" className="container-x scroll-mt-24 py-20 sm:py-28">
        <div className="grid gap-10 rounded-[2rem] bg-paper-deep p-6 sm:p-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <p className="eyebrow">Get a quote</p>
            <h2 className="mt-3 font-display text-4xl font-bold tracking-tight sm:text-5xl">Tell us what you'd like printed.</h2>
            <p className="mt-5 max-w-md text-muted">Share the garment, quantity and your artwork idea, and we'll get back with a mock-up and price. Bulk, team and one-off orders all welcome.</p>
            <ul className="mt-8 space-y-3 text-sm">
              {['Special pricing for bulk quantities', 'Help with artwork & mock-ups', 'Mixed sizes and colours in one order'].map(t => (
                <li key={t} className="flex items-center gap-3"><BadgeCheck className="h-4 w-4 text-accent" />{t}</li>
              ))}
            </ul>
            {quoteWa && (
              <a href={quoteWa} target="_blank" rel="noreferrer" className="btn mt-8 bg-[#25D366] px-6 py-3.5 text-white hover:bg-[#1ebe5a]">
                <MessageCircle className="h-4 w-4" /> Chat on WhatsApp
              </a>
            )}
          </div>
          <EnquiryForm compact />
        </div>
      </section>
    </>
  );
}
