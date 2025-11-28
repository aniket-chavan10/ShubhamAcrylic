const Review = require('../models/Review');

// Get reviews for a product
exports.getProductReviews = async (req, res) => {
    try {
        const reviews = await Review.find({ productId: req.params.productId })
            .sort({ createdAt: -1 });
        res.json(reviews);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching reviews', error: error.message });
    }
};

// Create a review
exports.createReview = async (req, res) => {
    try {
        const { productId, customerName, rating, comment } = req.body;

        const review = new Review({
            productId,
            customerName,
            rating,
            comment
        });

        await review.save();
        res.status(201).json(review);
    } catch (error) {
        res.status(400).json({ message: 'Error creating review', error: error.message });
    }
};

// Get all reviews (admin only)
exports.getAllReviews = async (req, res) => {
    try {
        const reviews = await Review.find()
            .populate('productId', 'name imageUrl')
            .sort({ createdAt: -1 });
        res.json(reviews);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching reviews', error: error.message });
    }
};

// Delete a review (admin only)
exports.deleteReview = async (req, res) => {
    try {
        const review = await Review.findByIdAndDelete(req.params.id);
        if (!review) {
            return res.status(404).json({ message: 'Review not found' });
        }
        res.json({ message: 'Review deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting review', error: error.message });
    }
};
