import { useState, useEffect } from 'react';
import { Trash2, Star, Package } from 'lucide-react';
import * as reviewService from '../services/reviewService';
import AdminLayout from '../components/AdminLayout';

interface Review {
    _id: string;
    productId: {
        _id: string;
        name: string;
        imageUrl: string;
    };
    customerName: string;
    rating: number;
    comment: string;
    createdAt: string;
}

const ReviewManagement = () => {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchReviews();
    }, []);

    const fetchReviews = async () => {
        try {
            console.log('Fetching reviews...');
            const response = await reviewService.getAllReviews();
            console.log('Review response:', response);

            // Handle different response formats
            const reviewsData = response.data || response || [];
            console.log('Reviews data:', reviewsData);

            setReviews(Array.isArray(reviewsData) ? reviewsData : []);
            setLoading(false);
        } catch (err: any) {
            console.error('Review fetch error:', err);
            setError(`Failed to load reviews: ${err.message}`);
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this review?')) return;

        try {
            await reviewService.deleteReview(id);
            setReviews(reviews.filter(review => review._id !== id));
        } catch (err) {
            alert('Failed to delete review');
        }
    };

    if (loading) return (
        <AdminLayout>
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        </AdminLayout>
    );

    if (error) return (
        <AdminLayout>
            <div className="text-red-500 text-center">{error}</div>
        </AdminLayout>
    );

    return (
        <AdminLayout>
            <div className="p-6">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-gray-900">Review Management</h1>
                    <p className="text-gray-600 mt-2">Manage customer reviews for all products</p>
                </div>

                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-gray-900">
                                All Reviews ({reviews.length})
                            </h2>
                        </div>
                    </div>

                    {reviews.length === 0 ? (
                        <div className="p-12 text-center text-gray-500">
                            <Star className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                            <p>No reviews yet</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-200">
                            {reviews.map((review) => (
                                <div key={review._id} className="p-6 hover:bg-gray-50 transition-colors">
                                    <div className="flex gap-4">
                                        <div className="flex-shrink-0">
                                            <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
                                                {review.productId ? (
                                                    <img
                                                        src={review.productId.imageUrl || 'https://via.placeholder.com/80'}
                                                        alt={review.productId.name}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <Package className="w-8 h-8 text-gray-400" />
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex-1">
                                            <div className="flex items-start justify-between mb-2">
                                                <div>
                                                    <h3 className="font-semibold text-gray-900">
                                                        {review.productId ? review.productId.name : 'Product Deleted'}
                                                    </h3>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <div className="flex text-yellow-400">
                                                            {[...Array(5)].map((_, i) => (
                                                                <Star
                                                                    key={i}
                                                                    size={16}
                                                                    fill={i < review.rating ? "currentColor" : "none"}
                                                                    className={i < review.rating ? "text-yellow-400" : "text-gray-300"}
                                                                />
                                                            ))}
                                                        </div>
                                                        <span className="text-sm text-gray-600">
                                                            by <strong>{review.customerName}</strong>
                                                        </span>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => handleDelete(review._id)}
                                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Delete review"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>

                                            <p className="text-gray-700 mb-2">{review.comment}</p>

                                            <p className="text-sm text-gray-500">
                                                {new Date(review.createdAt).toLocaleDateString('en-US', {
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
};

export default ReviewManagement;
