import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Star, Truck, ShieldCheck, RotateCcw } from 'lucide-react';
import api from '../services/api';
import { Product } from '../types';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ProductCard from '../components/ProductCard';

interface Review {
    _id: string;
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

    // Review form state
    const [reviewForm, setReviewForm] = useState({
        customerName: '',
        rating: 5,
        comment: ''
    });
    const [submitting, setSubmitting] = useState(false);
    const [submitSuccess, setSubmitSuccess] = useState(false);

    useEffect(() => {
        const fetchProductAndReviews = async () => {
            try {
                // Fetch product details
                const productRes = await api.get(`/products/${id}`);
                setProduct(productRes.data);

                // Fetch related products (same category)
                const productsRes = await api.get('/products');
                const allProducts = Array.isArray(productsRes.data) ? productsRes.data : productsRes.data.products;
                const currentCategoryName = typeof productRes.data.category === 'object' ? productRes.data.category.name : productRes.data.category;
                const related = allProducts
                    .filter((p: Product) => {
                        const pCategoryName = typeof p.category === 'object' ? (p.category as any).name : p.category;
                        return pCategoryName === currentCategoryName && p._id !== id;
                    })
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
        fetchProductAndReviews();
    }, [id]);

    const handleReviewSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            const response = await api.post('/reviews', {
                productId: id,
                ...reviewForm
            });
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

    if (loading) return (
        <div className="min-h-screen w-full flex items-center justify-center">
            <div className="relative w-20 h-20">
                <div className="absolute top-0 left-0 w-full h-full border-4 border-blue-200 rounded-full animate-ping"></div>
                <div className="absolute top-0 left-0 w-full h-full border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
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

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Product Details */}
                <div className="flex flex-col md:flex-row gap-8 mb-16">
                    {/* Image */}
                    <div className="md:w-2/5">
                        <div className="sticky top-24 border-2 border-gray-200 rounded-xl overflow-hidden bg-gray-50 flex items-center justify-center h-[500px]">
                            <img
                                src={product.imageUrl || 'https://via.placeholder.com/500'}
                                alt={product.name}
                                className="max-h-full max-w-full object-contain p-8"
                            />
                        </div>
                    </div>

                    {/* Info */}
                    <div className="md:w-3/5 space-y-6">
                        <div>
                            <span className="text-sm text-blue-600 font-semibold uppercase">
                                {typeof product.category === 'object' ? (product.category as any).name : product.category}
                            </span>
                            <h1 className="text-4xl font-bold text-gray-900 mt-2">{product.name}</h1>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="flex text-yellow-400">
                                {[...Array(5)].map((_, i) => (
                                    <Star key={i} size={20} fill={i < Math.round(Number(avgRating)) ? "currentColor" : "none"} />
                                ))}
                            </div>
                            <span className="text-gray-600">{avgRating} ({reviews.length} reviews)</span>
                        </div>

                        <div className="border-t border-b border-gray-200 py-6">
                            <div className="text-4xl font-bold text-gray-900">₹{product.price}</div>
                            <p className="text-gray-500 mt-1">Inclusive of all taxes</p>
                        </div>

                        <div className="bg-gray-50 rounded-xl p-6 space-y-4">
                            <h3 className="font-bold text-lg">Product Details</h3>
                            <p className="text-gray-700 leading-relaxed">{product.description}</p>
                            <div className="grid grid-cols-2 gap-4 mt-4">
                                {product.materialType && <div><span className="font-semibold">Material:</span> {product.materialType}</div>}
                                {product.size && <div><span className="font-semibold">Size:</span> {product.size}</div>}
                                {product.color && <div><span className="font-semibold">Color:</span> {product.color}</div>}
                                {product.weight && <div><span className="font-semibold">Weight:</span> {product.weight} kg</div>}
                            </div>
                        </div>

                        <div className="flex gap-4 text-sm bg-blue-50 rounded-xl p-4">
                            <div className="flex items-center gap-2"><Truck size={18} className="text-blue-600" /> Free Delivery</div>
                            <div className="flex items-center gap-2"><RotateCcw size={18} className="text-blue-600" /> 7 Days Return</div>
                            <div className="flex items-center gap-2"><ShieldCheck size={18} className="text-blue-600" /> 1 Year Warranty</div>
                        </div>
                    </div>
                </div>

                {/* Write Review Section */}
                <div className="mb-16 bg-gray-50 rounded-xl p-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Write a Review</h2>
                    {submitSuccess && (
                        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
                            Thank you! Your review has been submitted successfully.
                        </div>
                    )}
                    <form onSubmit={handleReviewSubmit} className="space-y-4">
                        <div className="grid md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Your Name</label>
                                <input
                                    type="text"
                                    required
                                    value={reviewForm.customerName}
                                    onChange={(e) => setReviewForm({ ...reviewForm, customerName: e.target.value })}
                                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-600 focus:outline-none"
                                    placeholder="Enter your name"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Rating</label>
                                <select
                                    value={reviewForm.rating}
                                    onChange={(e) => setReviewForm({ ...reviewForm, rating: Number(e.target.value) })}
                                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-600 focus:outline-none"
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
                                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-600 focus:outline-none"
                                placeholder="Share your experience with this product..."
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50"
                        >
                            {submitting ? 'Submitting...' : 'Submit Review'}
                        </button>
                    </form>
                </div>

                {/* Reviews Section */}
                {reviews.length > 0 && (
                    <div className="mb-16">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-gray-900">Customer Reviews ({reviews.length})</h2>
                            <button
                                onClick={() => setShowAllReviews(!showAllReviews)}
                                className="px-6 py-2 border-2 border-blue-600 text-blue-600 hover:bg-blue-50 font-semibold rounded-lg transition-colors"
                            >
                                {showAllReviews ? 'Show Less' : 'Show All Reviews'}
                            </button>
                        </div>
                        <div className="space-y-4">
                            {(showAllReviews ? reviews : reviews.slice(0, 3)).map((review) => (
                                <div key={review._id} className="bg-white border-2 border-gray-200 rounded-xl p-6">
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <div className="font-bold text-gray-900">{review.customerName}</div>
                                            <div className="flex text-yellow-400 mt-1">
                                                {[...Array(5)].map((_, i) => (
                                                    <Star key={i} size={14} fill={i < review.rating ? "currentColor" : "none"} />
                                                ))}
                                            </div>
                                        </div>
                                        <span className="text-sm text-gray-500">{new Date(review.createdAt).toLocaleDateString()}</span>
                                    </div>
                                    <p className="text-gray-700">{review.comment}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Related Products */}
                {relatedProducts.length > 0 && (
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-6">Related Products</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {relatedProducts.map((relatedProduct) => (
                                <ProductCard key={relatedProduct._id} product={relatedProduct} />
                            ))}
                        </div>
                    </div>
                )}
            </main>

            <Footer />
        </div>
    );
};

export default ProductDetails;
