import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Star, Truck, ShieldCheck, RotateCcw, MessageCircle, Package, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../services/api';
import { Product, ProductImage } from '../types';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import WhatsAppButton from '../components/WhatsAppButton';
import ProductCard from '../components/ProductCard';
import EnquiryForm from '../components/EnquiryForm';
import { useSiteSettings } from '../context/SiteSettingsContext';
import { getImageUrl } from '../utils/imageUtils';

interface Review {
    id: number;
    customerName: string;
    rating: number;
    comment: string;
    createdAt: string;
}

const ProductDetails = () => {
    const { id } = useParams<{ id: string }>();
    const [product, setProduct] = useState<Product | null>(null);
    const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
    const [reviews, setReviews] = useState<Review[]>([]);
    const [showAllReviews, setShowAllReviews] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Use shared site settings from context
    const { settings } = useSiteSettings();

    // Image gallery state
    const [activeImageIndex, setActiveImageIndex] = useState(0);

    // Review form state
    const [reviewForm, setReviewForm] = useState({ customerName: '', rating: 5, comment: '' });
    const [submitting, setSubmitting] = useState(false);
    const [submitSuccess, setSubmitSuccess] = useState(false);

    useEffect(() => {
        const fetchAll = async () => {
            try {
                const productRes = await api.get(`/products/${id}`);
                setProduct(productRes.data);

                const currentCategoryId = productRes.data.category && typeof productRes.data.category === 'object'
                    ? productRes.data.category.id
                    : productRes.data.category;

                // Fetch related products (same category) using advanced-search
                const productsRes = await api.get(`/products/advanced-search?category=${currentCategoryId || ''}`);
                const allProducts: Product[] = Array.isArray(productsRes.data)
                    ? productsRes.data
                    : productsRes.data.products || [];

                const related = allProducts
                    .filter((p) => p.id !== productRes.data.id)
                    .slice(0, 4);
                setRelatedProducts(related);

                // Fetch reviews
                const reviewsRes = await api.get(`/reviews/product/${id}`);
                setReviews(reviewsRes.data);
            } catch (err) {
                setError('Failed to load product details.');
            } finally {
                setLoading(false);
            }
        };
        fetchAll();
    }, [id]);

    const handleReviewSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const response = await api.post('/reviews', { productId: id, ...reviewForm });
            setReviews([response.data, ...reviews]);
            setReviewForm({ customerName: '', rating: 5, comment: '' });
            setSubmitSuccess(true);
            setTimeout(() => setSubmitSuccess(false), 3000);
        } catch (err) {
            console.error('Error submitting review:', err);
        } finally {
            setSubmitting(false);
        }
    };

    // ── WhatsApp redirect ────────────────────────────────────────────────────
    const handleWhatsApp = () => {
        if (!product || !settings?.whatsappNumber) return;
        const phone = settings.whatsappNumber.replace(/\D/g, '');
        const msg = encodeURIComponent(
            `Hi! I'm interested in *${product.name}* (Product Code: *${product.productCode}*). Could you please share pricing and availability? Thank you!`
        );
        window.open(`https://wa.me/${phone}?text=${msg}`, '_blank');
    };

    // ── Image gallery helpers ────────────────────────────────────────────────
    const images: ProductImage[] = product?.images?.length
        ? product.images
        : product?.imageUrl
        ? [{ id: 0, imageUrl: product.imageUrl, imageOrder: 0, isMain: true }]
        : [];

    if (loading) return (
        <div className="min-h-screen w-full flex items-center justify-center">
            <div className="relative w-20 h-20">
                <div className="absolute inset-0 border-4 border-blue-200 rounded-full animate-ping" />
                <div className="absolute inset-0 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
        </div>
    );

    if (error || !product) return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
                <div className="text-red-500 text-xl mb-4">{error || 'Product not found'}</div>
                <a href="/" className="text-blue-600 hover:underline">Return to Home</a>
            </div>
        </div>
    );

    const avgRating = reviews.length > 0
        ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
        : 0;

    return (
        <div className="min-h-screen bg-white font-sans">
            <Navbar />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
                {/* ── Product Detail ─────────────────────────────────────── */}
                <div className="flex flex-col md:flex-row gap-6 sm:gap-8 mb-10 sm:mb-16">

                    {/* ── Image Gallery ───────────────────────────────────── */}
                    <div className="w-full md:w-2/5">
                        <div className="md:sticky md:top-24">
                            {/* Main image */}
                            <div className="relative border-2 border-gray-200 rounded-2xl overflow-hidden bg-gray-50 flex items-center justify-center h-72 sm:h-[400px] md:h-[480px] mb-3 group">
                                <img
                                    src={getImageUrl(images[activeImageIndex]?.imageUrl) || 'https://via.placeholder.com/500'}
                                    alt={`${product.name} - Image ${activeImageIndex + 1}`}
                                    className="max-h-full max-w-full object-contain p-4 sm:p-6 transition-opacity duration-300"
                                />
                                {/* Arrows (only when multiple images) */}
                                {images.length > 1 && (
                                    <>
                                        <button
                                            onClick={() => setActiveImageIndex(i => Math.max(0, i - 1))}
                                            disabled={activeImageIndex === 0}
                                            className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white border border-gray-200 rounded-full p-2 shadow transition disabled:opacity-30 min-w-[36px] min-h-[36px] flex items-center justify-center"
                                        >
                                            <ChevronLeft size={18} />
                                        </button>
                                        <button
                                            onClick={() => setActiveImageIndex(i => Math.min(images.length - 1, i + 1))}
                                            disabled={activeImageIndex === images.length - 1}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white border border-gray-200 rounded-full p-2 shadow transition disabled:opacity-30 min-w-[36px] min-h-[36px] flex items-center justify-center"
                                        >
                                            <ChevronRight size={18} />
                                        </button>
                                    </>
                                )}
                                {/* Image counter */}
                                {images.length > 1 && (
                                    <span className="absolute bottom-3 right-3 bg-black/50 text-white text-xs px-2 py-1 rounded-full">
                                        {activeImageIndex + 1} / {images.length}
                                    </span>
                                )}
                            </div>

                            {/* Thumbnail strip */}
                            {images.length > 1 && (
                                <div className="flex gap-2 overflow-x-auto pb-1">
                                    {images.map((img, index) => (
                                        <button
                                            key={img.id}
                                            onClick={() => setActiveImageIndex(index)}
                                            className={`flex-shrink-0 w-14 h-14 sm:w-16 sm:h-16 rounded-lg overflow-hidden border-2 transition ${
                                                index === activeImageIndex
                                                    ? 'border-blue-600 shadow-md'
                                                    : 'border-gray-200 hover:border-gray-400'
                                            }`}
                                        >
                                            <img
                                                src={getImageUrl(img.imageUrl)}
                                                alt={`Thumbnail ${index + 1}`}
                                                className="w-full h-full object-cover"
                                            />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ── Product Info ────────────────────────────────────── */}
                    <div className="w-full md:w-3/5 space-y-4 sm:space-y-5">
                        {/* Category + Product Code */}
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm text-blue-600 font-semibold uppercase">
                                {typeof product.category === 'object' ? product.category.name : product.category}
                            </span>
                            <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-600 text-xs font-bold px-2.5 py-1 rounded-full border border-gray-200">
                                <Package size={11} /> {product.productCode}
                            </span>
                        </div>

                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{product.name}</h1>

                        {/* Rating */}
                        <div className="flex items-center gap-3">
                            <div className="flex text-yellow-400">
                                {[...Array(5)].map((_, i) => (
                                    <Star key={i} size={18} fill={i < Math.round(Number(avgRating)) ? 'currentColor' : 'none'} />
                                ))}
                            </div>
                            <span className="text-gray-500 text-sm">{avgRating} ({reviews.length} reviews)</span>
                        </div>

                        {/* Price */}
                        <div className="border-t border-b border-gray-200 py-4 sm:py-5">
                            <div className="text-3xl sm:text-4xl font-bold text-gray-900">₹{product.price}</div>
                            <p className="text-gray-500 text-sm mt-1">Inclusive of all taxes</p>
                        </div>

                        {/* Product Details */}
                        <div className="bg-gray-50 rounded-xl p-4 sm:p-5 space-y-3">
                            <h3 className="font-bold text-base text-gray-900">Product Details</h3>
                            <p className="text-gray-700 text-sm leading-relaxed">{product.description}</p>
                            <div className="grid grid-cols-2 gap-2 sm:gap-3 text-sm mt-3">
                                {product.materialType && <div><span className="font-semibold">Material:</span> {product.materialType}</div>}
                                {product.size && <div><span className="font-semibold">Size:</span> {product.size}</div>}
                                {product.color && <div><span className="font-semibold">Color:</span> {product.color}</div>}
                                {product.weight && <div><span className="font-semibold">Weight:</span> {product.weight} kg</div>}
                            </div>
                            {product.tags && product.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 mt-2">
                                    {product.tags.map(tag => (
                                        <span key={tag} className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full font-medium">
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Shipping info */}
                        <div className="flex flex-wrap gap-3 sm:gap-4 text-sm bg-blue-50 rounded-xl p-3 sm:p-4">
                            <div className="flex items-center gap-2"><Truck size={16} className="text-blue-600" /> Free Delivery</div>
                            <div className="flex items-center gap-2"><RotateCcw size={16} className="text-blue-600" /> 7 Days Return</div>
                            <div className="flex items-center gap-2"><ShieldCheck size={16} className="text-blue-600" /> 1 Year Warranty</div>
                        </div>

                        {/* ── Action Buttons ──────────────────────────────── */}
                        <div className="flex flex-col sm:flex-row gap-3 pt-2">
                            {/* WhatsApp CTA */}
                            {settings?.whatsappNumber && (
                                <button
                                    onClick={handleWhatsApp}
                                    className="flex-1 flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 active:scale-95 text-white font-bold py-3.5 px-6 rounded-xl transition-all shadow-lg shadow-green-200 min-h-[48px]"
                                >
                                    <MessageCircle size={20} fill="white" />
                                    WhatsApp Enquiry
                                </button>
                            )}
                            {/* Scroll to enquiry form */}
                            <a
                                href="#product-enquiry"
                                className="flex-1 flex items-center justify-center gap-2 border-2 border-blue-600 text-blue-600 hover:bg-blue-50 font-bold py-3.5 px-6 rounded-xl transition-all min-h-[48px]"
                            >
                                Send Enquiry
                            </a>
                        </div>
                    </div>
                </div>

                {/* ── Product Enquiry Form ────────────────────────────────── */}
                <div className="mb-10 sm:mb-16 bg-gray-50 rounded-2xl p-4 sm:p-6 md:p-8 border border-gray-200">
                    <EnquiryForm
                        productId={product.id}
                        productCode={product.productCode}
                        productName={product.name}
                        compact={true}
                    />
                </div>

                {/* ── Write Review ────────────────────────────────────────── */}
                <div className="mb-10 sm:mb-16 bg-gray-50 rounded-xl p-4 sm:p-8">
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">Write a Review</h2>
                    {submitSuccess && (
                        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
                            Thank you! Your review has been submitted successfully.
                        </div>
                    )}
                    <form onSubmit={handleReviewSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Your Name</label>
                                <input
                                    type="text"
                                    required
                                    value={reviewForm.customerName}
                                    onChange={(e) => setReviewForm({ ...reviewForm, customerName: e.target.value })}
                                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-600 focus:outline-none text-base sm:text-sm"
                                    placeholder="Enter your name"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Rating</label>
                                <select
                                    value={reviewForm.rating}
                                    onChange={(e) => setReviewForm({ ...reviewForm, rating: Number(e.target.value) })}
                                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-600 focus:outline-none text-base sm:text-sm"
                                >
                                    {[5, 4, 3, 2, 1].map(num => (
                                        <option key={num} value={num}>{num} Star{num > 1 ? 's' : ''}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Your Review</label>
                            <textarea
                                required
                                value={reviewForm.comment}
                                onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                                rows={4}
                                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-600 focus:outline-none text-base sm:text-sm"
                                placeholder="Share your experience with this product..."
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 min-h-[44px]"
                        >
                            {submitting ? 'Submitting...' : 'Submit Review'}
                        </button>
                    </form>
                </div>

                {/* ── Customer Reviews ────────────────────────────────────── */}
                {reviews.length > 0 && (
                    <div className="mb-10 sm:mb-16">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
                            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Customer Reviews ({reviews.length})</h2>
                            <button
                                onClick={() => setShowAllReviews(!showAllReviews)}
                                className="px-6 py-2 border-2 border-blue-600 text-blue-600 hover:bg-blue-50 font-semibold rounded-lg transition-colors text-sm min-h-[44px]"
                            >
                                {showAllReviews ? 'Show Less' : 'Show All Reviews'}
                            </button>
                        </div>
                        <div className="space-y-4">
                            {(showAllReviews ? reviews : reviews.slice(0, 3)).map((review) => (
                                <div key={review.id} className="bg-white border-2 border-gray-200 rounded-xl p-4 sm:p-6">
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <div className="font-bold text-gray-900">{review.customerName}</div>
                                            <div className="flex text-yellow-400 mt-1">
                                                {[...Array(5)].map((_, i) => (
                                                    <Star key={i} size={14} fill={i < review.rating ? 'currentColor' : 'none'} />
                                                ))}
                                            </div>
                                        </div>
                                        <span className="text-sm text-gray-500">{new Date(review.createdAt).toLocaleDateString()}</span>
                                    </div>
                                    <p className="text-gray-700 text-sm">{review.comment}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ── Related Products ────────────────────────────────────── */}
                {relatedProducts.length > 0 && (
                    <div>
                        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6">Related Products</h2>
                        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
                            {relatedProducts.map((rp) => (
                                <ProductCard key={rp.id} product={rp} />
                            ))}
                        </div>
                    </div>
                )}
            </main>

            <Footer />

            {/* WhatsApp floating button on product page too */}
            {settings?.whatsappNumber && (
                <WhatsAppButton
                    phone={settings.whatsappNumber}
                    message={`Hi, I'm interested in ${product.name} (${product.productCode}). Please share details.`}
                />
            )}
        </div>
    );
};

export default ProductDetails;
