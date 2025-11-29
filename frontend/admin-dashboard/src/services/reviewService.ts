import { fetchWithAuth } from "../utils/apiUtils";

export const getAllReviews = async () => {
    const res = await fetchWithAuth('/reviews/all');
    if (!res.ok) {
        throw new Error('Failed to fetch reviews');
    }
    return await res.json();
};

export const deleteReview = async (reviewId: string) => {
    const res = await fetchWithAuth(`/reviews/${reviewId}`, {
        method: 'DELETE'
    });
    if (!res.ok) {
        throw new Error('Failed to delete review');
    }
    return await res.json();
};
