const Review = require('../models/Review');
const Product = require('../models/Product');


// Get reviews for a product
exports.getProductReviews = async (req, res) => {
  try {
    const reviews = await Review.findAll({
      where: { productId: req.params.productId },
      order: [['createdAt', 'DESC']],
    });
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching reviews', error: error.message });
  }
};

// Create a review
exports.createReview = async (req, res) => {
  try {
    const { productId, customerName, rating, comment } = req.body;
    const review = await Review.create({ productId, customerName, rating, comment });
    res.status(201).json(review);
  } catch (error) {
    res.status(400).json({ message: 'Error creating review', error: error.message });
  }
};

// Get all reviews (admin only)
exports.getAllReviews = async (req, res) => {
  try {
    const reviews = await Review.findAll({
      include: [{ model: Product, attributes: ['id', 'name'] }],
      order: [['createdAt', 'DESC']],
    });
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching reviews', error: error.message });
  }
};

// Delete a review (admin only)
exports.deleteReview = async (req, res) => {
  try {
    const review = await Review.findByPk(req.params.id);
    if (!review) return res.status(404).json({ message: 'Review not found' });
    await review.destroy();
    res.json({ message: 'Review deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting review', error: error.message });
  }
};
