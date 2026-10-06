import { FormEvent, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Loader2, Palette, RotateCcw, ShieldCheck, Shirt, Star, Truck } from 'lucide-react';
import api, { createProductEnquiry, errorMessage } from '../services/api';
import type { Product, ProductImage } from '../types';
import ProductCard from '../components/ProductCard';
import { WhatsAppIcon } from '../components/WhatsAppButton';
import { useSiteSettings } from '../context/SiteSettingsContext';
import { getImageUrl } from '../utils/imageUtils';
import { inr, waLink } from '../utils/format';

interface Review {
    id: number;
    customerName: string;
    rating: number;
    comment: string;
    createdAt: string;
}

const Stars = ({ value, size = 'h-4 w-4' }: { value: number; size?: string }) => (
    <span className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map(i => (
            <Star key={i} className={`${size} ${i <= Math.round(value) ? 'fill-accent text-accent' : 'text-line'}`} />
        ))}
    </span>
);

const ProductDetails = () => {
    const { id } = useParams<{ id: string }>();
    const { settings } = useSiteSettings();
    const [product, setProduct] = useState<Product | null>(null);
    const [related, setRelated] = useState<Product[]>([]);
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeImage, setActiveImage] = useState(0);
    const [size, setSize] = useState('');

    const [reviewForm, setReviewForm] = useState({ customerName: '', rating: 5, comment: '' });
    const [reviewState, setReviewState] = useState<'idle' | 'sending' | 'sent'>('idle');

    const [enquiry, setEnquiry] = useState({ name: '', email: '', mobileNo: '', message: '' });
    const [enquiryState, setEnquiryState] = useState<'idle' | 'sending' | 'sent'>('idle');
    const [enquiryError, setEnquiryError] = useState('');

    useEffect(() => {
        let alive = true;
        setLoading(true);
        setActiveImage(0);
        (async () => {
            try {
                const { data } = await api.get<Product>(`/products/${id}`);
                if (!alive) return;
                setProduct(data);
                setSize(data.availableSizes?.[0] || '');
                const [rel, rev] = await Promise.all([
                    api.get(`/products/advanced-search?category=${data.category?.id || ''}`).catch(() => ({ data: [] })),
                    api.get(`/reviews/product/${id}`).catch(() => ({ data: [] })),
                ]);
                if (!alive) return;
                const list: Product[] = Array.isArray(rel.data) ? rel.data : rel.data.products || [];
                setRelated(list.filter(p => p.id !== data.id).slice(0, 4));
                setReviews(Array.isArray(rev.data) ? rev.data : []);
            } catch {
                if (alive) setError('This product could not be found.');
            } finally {
                if (alive) setLoading(false);
            }
        })();
        return () => { alive = false; };
    }, [id]);

    const submitReview = async (e: FormEvent) => {
        e.preventDefault();
        if (!reviewForm.customerName.trim() || !reviewForm.comment.trim()) return;
        setReviewState('sending');
        try {
            const { data } = await api.post('/reviews', { productId: id, ...reviewForm });
            setReviews(r => [data, ...r]);
            setReviewForm({ customerName: '', rating: 5, comment: '' });
            setReviewState('sent');
        } catch {
            setReviewState('idle');
        }
    };

    const submitEnquiry = async (e: FormEvent) => {
        e.preventDefault();
        if (!product) return;
        if (!enquiry.name.trim() || !enquiry.email.trim() || enquiry.mobileNo.replace(/\D/g, '').length < 10) {
            setEnquiryError('Please enter your name, email and a valid mobile number.');
            return;
        }
        setEnquiryError('');
        setEnquiryState('sending');
        try {
            await createProductEnquiry({
                ...enquiry,
                message: enquiry.message || `Interested in ${product.name}${size ? ` (size ${size})` : ''}.`,
                productId: product.id,
                productCode: product.productCode,
                productName: product.name,
            });
            setEnquiryState('sent');
        } catch (err) {
            setEnquiryError(errorMessage(err));
            setEnquiryState('idle');
        }
    };

    if (loading) {
        return <div className="grid min-h-[70vh] place-items-center"><Loader2 className="h-8 w-8 animate-spin text-accent" /></div>;
    }

    if (error || !product) {
        return (
            <div className="container-x grid min-h-[60vh] place-items-center text-center">
                <div>
                    <Shirt className="mx-auto h-12 w-12 text-muted" strokeWidth={1} />
                    <h1 className="mt-4 font-display text-2xl font-bold">{error || 'Product not found'}</h1>
                    <Link to="/shop" className="btn-primary mt-6">Back to shop</Link>
                </div>
            </div>
        );
    }

    const images: ProductImage[] = product.images?.length
        ? product.images
        : product.imageUrl ? [{ id: 0, imageUrl: product.imageUrl, imageOrder: 0, isMain: true }] : [];
    const avg = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;
    const whatsapp = settings?.whatsappNumber
        ? waLink(settings.whatsappNumber, `Hi! I'd like to order *${product.name}* (Code: ${product.productCode})${size ? `, size *${size}*` : ''}. Price shown: ${inr(product.price)}. Please share availability.`)
        : '';
    const specs = [
        ['Fabric', product.fabric],
        ['Fit', product.fitType],
        ['For', product.gender],
        ['Colour', product.color],
        ['Code', product.productCode],
    ].filter(([, v]) => v);

    return (
        <>
            <section className="container-x py-8 sm:py-12">
                <Link to="/shop" className="inline-flex items-center gap-2 text-sm font-medium text-muted hover:text-ink">
                    <ArrowLeft className="h-4 w-4" /> Back to shop
                </Link>

                <div className="mt-6 grid gap-10 lg:grid-cols-2 lg:gap-16">
                    {/* Gallery */}
                    <div className="lg:sticky lg:top-24 lg:self-start">
                        <div className="aspect-[4/5] overflow-hidden rounded-[2rem] bg-paper-deep">
                            {images[activeImage] ? (
                                <img src={getImageUrl(images[activeImage].imageUrl)} alt={product.name} className="h-full w-full object-cover" />
                            ) : (
                                <div className="grid h-full place-items-center text-muted"><Shirt className="h-16 w-16" strokeWidth={1} /></div>
                            )}
                        </div>
                        {images.length > 1 && (
                            <div className="no-scrollbar mt-4 flex gap-3 overflow-x-auto">
                                {images.map((img, i) => (
                                    <button key={img.id} onClick={() => setActiveImage(i)}
                                        className={`h-20 w-16 shrink-0 overflow-hidden rounded-xl ring-2 transition ${i === activeImage ? 'ring-ink' : 'ring-transparent opacity-70 hover:opacity-100'}`}>
                                        <img src={getImageUrl(img.imageUrl)} alt="" className="h-full w-full object-cover" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Info */}
                    <div>
                        {product.category && <p className="eyebrow">{product.category.name}</p>}
                        <h1 className="mt-3 font-display text-4xl font-bold tracking-tight sm:text-5xl">{product.name}</h1>
                        {reviews.length > 0 && (
                            <a href="#reviews" className="mt-3 flex items-center gap-2 text-sm text-muted">
                                <Stars value={avg} /> {avg.toFixed(1)} · {reviews.length} review{reviews.length > 1 ? 's' : ''}
                            </a>
                        )}
                        <p className="mt-6 font-display text-4xl font-bold">{inr(product.price)}</p>

                        {product.description && <p className="mt-6 whitespace-pre-line leading-relaxed text-muted">{product.description}</p>}

                        {!!product.availableSizes?.length && (
                            <div className="mt-8">
                                <p className="label">Size</p>
                                <div className="flex flex-wrap gap-2">
                                    {(product.availableSizes ?? []).map(s => (
                                        <button key={s} onClick={() => setSize(s)}
                                            className={`min-w-14 rounded-xl border px-4 py-2.5 text-sm font-semibold transition ${size === s ? 'border-ink bg-ink text-white' : 'border-line bg-white hover:border-ink'}`}>
                                            {s}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                            {whatsapp && (
                                <a href={whatsapp} target="_blank" rel="noreferrer" className="btn flex-1 bg-[#25D366] py-4 text-white hover:bg-[#1ebe5a]">
                                    <WhatsAppIcon className="h-5 w-5" /> Order on WhatsApp
                                </a>
                            )}
                            <a href="#enquire" className="btn-outline flex-1 py-4">Send an enquiry</a>
                        </div>
                        {product.isCustomizable && (
                            <Link to="/customize" className="mt-3 flex items-center justify-center gap-2 rounded-full bg-accent-soft py-3 text-sm font-semibold text-accent-dark hover:bg-accent hover:text-white">
                                <Palette className="h-4 w-4" /> Want your own print? Open the design studio
                            </Link>
                        )}

                        {specs.length > 0 && (
                            <dl className="mt-10 divide-y divide-line border-y border-line text-sm">
                                {specs.map(([k, v]) => (
                                    <div key={k} className="flex justify-between py-3"><dt className="text-muted">{k}</dt><dd className="font-medium">{v}</dd></div>
                                ))}
                            </dl>
                        )}

                        <div className="mt-8 grid grid-cols-3 gap-3 text-center text-xs text-muted">
                            {[{ icon: ShieldCheck, t: 'Quality checked' }, { icon: Truck, t: 'Shipped across India' }, { icon: RotateCcw, t: 'Easy support' }].map(({ icon: Icon, t }) => (
                                <div key={t} className="rounded-2xl bg-white p-4 ring-1 ring-line"><Icon className="mx-auto mb-2 h-5 w-5 text-ink" />{t}</div>
                            ))}
                        </div>

                        {/* Enquiry */}
                        <div id="enquire" className="mt-10 scroll-mt-28 rounded-3xl bg-white p-6 ring-1 ring-line">
                            <h2 className="font-display text-xl font-bold">Enquire about this product</h2>
                            {enquiryState === 'sent' ? (
                                <p className="mt-3 rounded-xl bg-green-50 px-4 py-3 text-sm text-green-800">Thanks! We've received your enquiry and will contact you shortly.</p>
                            ) : (
                                <form onSubmit={submitEnquiry} className="mt-4 grid gap-3 sm:grid-cols-2">
                                    <input className="field" placeholder="Name" value={enquiry.name} onChange={e => setEnquiry(f => ({ ...f, name: e.target.value }))} />
                                    <input className="field" placeholder="Mobile" type="tel" value={enquiry.mobileNo} onChange={e => setEnquiry(f => ({ ...f, mobileNo: e.target.value }))} />
                                    <input className="field sm:col-span-2" placeholder="Email" type="email" value={enquiry.email} onChange={e => setEnquiry(f => ({ ...f, email: e.target.value }))} />
                                    <textarea className="field resize-none sm:col-span-2" rows={3} placeholder="Quantity, sizes, questions…" value={enquiry.message} onChange={e => setEnquiry(f => ({ ...f, message: e.target.value }))} />
                                    {enquiryError && <p className="text-sm text-red-600 sm:col-span-2">{enquiryError}</p>}
                                    <button type="submit" disabled={enquiryState === 'sending'} className="btn-primary sm:col-span-2">
                                        {enquiryState === 'sending' && <Loader2 className="h-4 w-4 animate-spin" />} Send enquiry
                                    </button>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            {/* Reviews */}
            <section id="reviews" className="scroll-mt-24 border-t border-line bg-white py-16">
                <div className="container-x grid gap-12 lg:grid-cols-3">
                    <div>
                        <p className="eyebrow">Reviews</p>
                        <h2 className="mt-3 font-display text-3xl font-bold">What customers say</h2>
                        {reviews.length > 0 && (
                            <div className="mt-4 flex items-center gap-3"><span className="font-display text-5xl font-bold">{avg.toFixed(1)}</span><Stars value={avg} size="h-5 w-5" /></div>
                        )}
                        {reviewState === 'sent' ? (
                            <p className="mt-6 rounded-xl bg-green-50 px-4 py-3 text-sm text-green-800">Thanks for your review!</p>
                        ) : (
                            <form onSubmit={submitReview} className="mt-8 space-y-3">
                                <div className="flex gap-1" role="radiogroup" aria-label="Rating">
                                    {[1, 2, 3, 4, 5].map(r => (
                                        <button type="button" key={r} onClick={() => setReviewForm(f => ({ ...f, rating: r }))} aria-label={`${r} star`}>
                                            <Star className={`h-7 w-7 ${r <= reviewForm.rating ? 'fill-accent text-accent' : 'text-line'}`} />
                                        </button>
                                    ))}
                                </div>
                                <input className="field" placeholder="Your name" value={reviewForm.customerName} onChange={e => setReviewForm(f => ({ ...f, customerName: e.target.value }))} />
                                <textarea className="field resize-none" rows={3} placeholder="Share your experience" value={reviewForm.comment} onChange={e => setReviewForm(f => ({ ...f, comment: e.target.value }))} />
                                <button disabled={reviewState === 'sending'} className="btn-primary">Post review</button>
                            </form>
                        )}
                    </div>
                    <div className="space-y-4 lg:col-span-2">
                        {reviews.length === 0 && <p className="rounded-2xl border border-dashed border-line p-10 text-center text-sm text-muted">No reviews yet — be the first to review this product.</p>}
                        {reviews.slice(0, 8).map(r => (
                            <article key={r.id} className="rounded-2xl bg-paper p-6">
                                <div className="flex items-center justify-between">
                                    <p className="font-semibold">{r.customerName}</p>
                                    <Stars value={r.rating} />
                                </div>
                                <p className="mt-3 text-sm leading-relaxed text-muted">{r.comment}</p>
                                <p className="mt-3 text-xs text-muted/70">{new Date(r.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                            </article>
                        ))}
                    </div>
                </div>
            </section>

            {related.length > 0 && (
                <section className="container-x py-16">
                    <h2 className="font-display text-3xl font-bold">You may also like</h2>
                    <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 lg:grid-cols-4">
                        {related.map(p => <ProductCard key={p.id} product={p} />)}
                    </div>
                </section>
            )}
        </>
    );
};

export default ProductDetails;
