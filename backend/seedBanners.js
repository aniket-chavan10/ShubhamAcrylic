const mongoose = require('mongoose');
require('dotenv').config({ path: './backend/.env' });
const Banner = require('./models/Banner');

const seedBanners = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const dummyBanners = [
            {
                title: 'Premium Acrylic Sheets',
                subtitle: 'High quality, durable and crystal clear',
                imageUrl: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&q=80&w=1200',
                link: '/products',
                isActive: true,
                order: 1
            },
            {
                title: 'Modern Furniture Collection',
                subtitle: 'Transform your space with elegant acrylic furniture',
                imageUrl: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&q=80&w=1200',
                link: '/products',
                isActive: true,
                order: 2
            },
            {
                title: 'Custom Decor Solutions',
                subtitle: 'Bespoke designs for your unique needs',
                imageUrl: 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto=format&fit=crop&q=80&w=1200',
                link: '/enquiry',
                isActive: true,
                order: 3
            }
        ];

        // Clear existing banners
        await Banner.deleteMany({});
        console.log('Cleared existing banners');

        // Insert new banners
        await Banner.insertMany(dummyBanners);
        console.log('Added dummy banners');

        process.exit(0);
    } catch (error) {
        console.error('Error seeding banners:', error);
        process.exit(1);
    }
};

seedBanners();
