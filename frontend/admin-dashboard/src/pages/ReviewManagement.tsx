import { useState, useEffect } from 'react';
import { Package, Star, Trash2 } from 'lucide-react';
import * as reviewService from '../services/reviewService';
import AdminLayout from '../components/AdminLayout';
import { EmptyState, PageLoader } from '../components/ui';
import { formatDateTime } from '../utils/format';

// Shape returned by GET /reviews/all (Sequelize, Product included)
interface Review {
    id: number;
    productId: number;
    Product?: { id: number; name: string } | null;
    customerName: string;
    rating: number;
    comment: string;
    createdAt: string;
}

const Stars = ({ rating }: { rating: number }) => (
    <span className="flex" aria-label={`${rating} out of 5`}>
        {[...Array(5)].map((_, i) => (
            <Star key={i} className={`h-4 w-4 ${i < rating ? 'fill-accent text-accent' : 'text-line'}`} />
        ))}
    </span>
);

const ReviewManagement = () => {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        reviewService.getAllReviews()
            .then((response) => {
                const data = response?.data ?? response ?? [];
                setReviews(Array.isArray(data) ? data : []);
            })
            .catch((err) => setError(`Failed to load reviews: ${err.message}`))
            .finally(() => setLoading(false));
    }, []);

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this review?')) return;
        try {
            await reviewService.deleteReview(String(id));
            setReviews(list => list.filter(review => review.id !== id));
        } catch {
            alert('Failed to delete review');
        }
    };

    const average = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;

    return (
        <AdminLayout title="Reviews">
            <div className="mb-5 grid grid-cols-2 gap-3 sm:max-w-md sm:gap-4">
                <div className="a-card p-4 sm:p-5"><p className="a-label">Total reviews</p><p className="font-display text-2xl font-bold sm:text-3xl">{reviews.length}</p></div>
                <div className="a-card p-4 sm:p-5"><p className="a-label">Average rating</p><p className="font-display text-2xl font-bold sm:text-3xl">{average ? average.toFixed(1) : '—'}<span className="text-base text-muted"> / 5</span></p></div>
            </div>

            <div className="a-card overflow-hidden">
                {loading ? (
                    <PageLoader />
                ) : error ? (
                    <p className="p-6 text-center text-sm text-red-600">{error}</p>
                ) : reviews.length === 0 ? (
                    <EmptyState icon={Star} title="No reviews yet" text="Customer reviews from product pages will appear here." />
                ) : (
                    <ul className="divide-y divide-line">
                        {reviews.map((review) => (
                            <li key={review.id} className="flex gap-3 p-4 sm:gap-4 sm:p-5">
                                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-paper text-muted"><Package className="h-5 w-5" /></span>
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="min-w-0">
                                            <p className="truncate font-semibold">{review.Product?.name ?? 'Product deleted'}</p>
                                            <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted">
                                                <Stars rating={review.rating} />
                                                <span>by <b className="font-semibold text-ink">{review.customerName}</b></span>
                                            </div>
                                        </div>
                                        <button onClick={() => handleDelete(review.id)} className="a-icon-btn-danger -mr-2" title="Delete review"><Trash2 className="h-4 w-4" /></button>
                                    </div>
                                    {review.comment && <p className="mt-2 text-sm">{review.comment}</p>}
                                    <p className="mt-1.5 text-xs text-muted">{formatDateTime(review.createdAt)}</p>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </AdminLayout>
    );
};

export default ReviewManagement;
