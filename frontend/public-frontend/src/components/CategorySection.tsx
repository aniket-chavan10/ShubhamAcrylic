import { ArrowRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getCategories } from '../services/api';
import { getImageUrl } from '../utils/imageUtils';

const CategorySection = () => {
    const [categories, setCategories] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const data = await getCategories();
                setCategories(data);
            } catch (error) {
                console.error("Failed to fetch categories", error);
            } finally {
                setLoading(false);
            }
        };
        fetchCategories();
    }, []);

    // Placeholder images mapping based on T-Shirt & Apparel category name
    const getCategoryImage = (cat: any) => {
        if (cat.imageUrl) return getImageUrl(cat.imageUrl);

        const lowerName = (cat.name || '').toLowerCase();
        if (lowerName.includes('hoodie') || lowerName.includes('sweatshirt')) return 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&q=80&w=600';
        if (lowerName.includes('graphic') || lowerName.includes('vintage')) return 'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?auto=format&fit=crop&q=80&w=600';
        if (lowerName.includes('oversized')) return 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&q=80&w=600';
        if (lowerName.includes('polo')) return 'https://images.unsplash.com/photo-1625910513413-562725e6488a?auto=format&fit=crop&q=80&w=600';
        if (lowerName.includes('solid') || lowerName.includes('basic')) return 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&q=80&w=600';
        if (lowerName.includes('corporate') || lowerName.includes('event') || lowerName.includes('custom')) return 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&q=80&w=600';
        return 'https://images.unsplash.com/photo-1529374255404-311a2a4f1fd9?auto=format&fit=crop&q=80&w=600';
    };

    const handleCategoryClick = (categoryName: string) => {
        window.dispatchEvent(new CustomEvent('selectCategory', { detail: categoryName }));
        document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' });
    };

    if (loading) return null;

    return (
        <section className="py-8 sm:py-16 bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-end mb-6 sm:mb-10">
                    <div>
                        <h2 className="text-xl sm:text-3xl font-bold text-gray-900 mb-1">Shop by Category</h2>
                        <p className="text-xs sm:text-sm text-gray-500">Explore our premium t-shirts, hoodies, and apparel</p>
                    </div>
                    <a href="#products" className="flex items-center text-xs sm:text-sm text-indigo-600 font-semibold hover:text-indigo-700">
                        View All <ArrowRight size={14} className="ml-1" />
                    </a>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-5">
                    {categories.map((cat) => (
                        <div
                            key={cat.id || cat._id}
                            onClick={() => handleCategoryClick(cat.name)}
                            className="group relative overflow-hidden rounded-xl sm:rounded-2xl cursor-pointer shadow-sm hover:shadow-xl transition-all duration-300 h-44 sm:h-56 md:h-64"
                        >
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent group-hover:from-black/90 transition-colors z-10" />
                            <img
                                src={getCategoryImage(cat)}
                                alt={cat.name}
                                className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
                            />
                            <div className="absolute bottom-0 left-0 p-3 sm:p-5 z-20 w-full">
                                <h3 className="text-white text-sm sm:text-base md:text-lg font-bold mb-1 leading-snug drop-shadow-md">{cat.name}</h3>
                                <p className="text-white/80 text-[11px] sm:text-xs hidden sm:flex items-center justify-between">
                                    <span className="line-clamp-1">{cat.description || 'Explore Collection'}</span>
                                    <span className="w-6 h-6 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center group-hover:bg-white group-hover:text-black transition-colors shrink-0 ml-1">
                                        <ArrowRight size={12} />
                                    </span>
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default CategorySection;
