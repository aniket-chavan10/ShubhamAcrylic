const mongoose = require('mongoose');
require('dotenv').config();

const Category = require('./models/Category');
const Product = require('./models/Product');

const migrateCategories = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // 1. Get all products
        const products = await Product.find({});
        console.log(`Found ${products.length} products`);

        // 2. Extract unique categories
        const categoryNames = [...new Set(products.map(p => p.category).filter(c => c))];
        console.log(`Found ${categoryNames.length} unique categories:`, categoryNames);

        // 3. Create Category documents
        const categoryMap = {};
        for (const name of categoryNames) {
            let category = await Category.findOne({ name });
            if (!category) {
                category = new Category({
                    name,
                    slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
                    description: `Category for ${name}`,
                    isActive: true
                });
                await category.save();
                console.log(`Created category: ${name}`);
            } else {
                console.log(`Category already exists: ${name}`);
            }
            categoryMap[name] = category._id;
        }

        // 4. Update Products
        // We need to bypass the current schema validation because it expects String
        // So we'll use the native driver collection update
        const productsCollection = mongoose.connection.collection('products');

        for (const product of products) {
            if (product.category && categoryMap[product.category]) {
                const categoryId = categoryMap[product.category];

                await productsCollection.updateOne(
                    { _id: product._id },
                    { $set: { category: categoryId } }
                );
                console.log(`Updated product ${product.name} with category ID ${categoryId}`);
            }
        }

        console.log('Migration completed successfully');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
};

migrateCategories();
