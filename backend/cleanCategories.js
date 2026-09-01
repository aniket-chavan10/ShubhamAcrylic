const mongoose = require('mongoose');
require('dotenv').config();
const Category = require('./models/Category');

const validCategories = [
    'Oversized Tees',
    'Graphic Tees',
    'Polo T-Shirts',
    'Solid & Basic Tees',
    'Custom Printed Tees'
];

const cleanCategories = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const result = await Category.deleteMany({ name: { $nin: validCategories } });
        console.log(`Deleted ${result.deletedCount} old non-tshirt categories.`);

        process.exit(0);
    } catch (error) {
        console.error('Error cleaning categories:', error);
        process.exit(1);
    }
};

cleanCategories();
