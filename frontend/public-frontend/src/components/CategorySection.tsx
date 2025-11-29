import { ArrowRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getCategories } from '../services/api';

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

    // Placeholder images mapping based on category name (or random)
    const getCategoryImage = (name: string) => {
        const lowerName = name.toLowerCase();
        if (lowerName.includes('sheet')) return 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&q=80&w=400';
        if (lowerName.includes('furniture')) return 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&q=80&w=400';
        if (lowerName.includes('decor')) return 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto=format&fit=crop&q=80&w=400';
        return 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&q=80&w=400';
    };

    if (loading) return null;

    return (
        <section className="py-20 bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-end mb-12">
                    <div>
                        <h2 className="text-3xl font-bold text-gray-900 mb-2">Shop by Category</h2>
                        <p className="text-gray-500">Explore our wide range of premium collections</p>
                    </div>
                    <a href="#products" className="hidden md:flex items-center text-indigo-600 font-semibold hover:text-indigo-700">
                        View All <ArrowRight size={16} className="ml-1" />
                    </a>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {categories.map((cat) => (
                        <div key={cat._id} className="group relative overflow-hidden rounded-2xl cursor-pointer shadow-sm hover:shadow-xl transition-all duration-300 h-80">
                            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors z-10" />
                            <img
                                src={getCategoryImage(cat.name)}
                                alt={cat.name}
                                className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
                            />
                            <div className="absolute bottom-0 left-0 p-6 z-20 w-full">
                                <h3 className="text-white text-xl font-bold mb-1">{cat.name}</h3>
                                <p className="text-white/80 text-sm flex items-center justify-between">
                                    {cat.description || 'Premium Collection'}
                                    <span className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center group-hover:bg-white group-hover:text-black transition-colors">
                                        <ArrowRight size={14} />
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
