import { ArrowRight } from 'lucide-react';

const CATEGORIES = [
    { id: 1, name: 'Acrylic Sheets', image: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&q=80&w=400', count: 'Premium Quality' },
    { id: 2, name: 'Furniture', image: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&q=80&w=400', count: 'Modern Design' },
    { id: 3, name: 'Decor', image: 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto=format&fit=crop&q=80&w=400', count: 'Home Accents' },
    { id: 4, name: 'Custom Orders', image: 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&q=80&w=400', count: 'Made for You' },
];

const CategorySection = () => {
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
                    {CATEGORIES.map((cat) => (
                        <div key={cat.id} className="group relative overflow-hidden rounded-2xl cursor-pointer shadow-sm hover:shadow-xl transition-all duration-300 h-80">
                            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors z-10" />
                            <img
                                src={cat.image}
                                alt={cat.name}
                                className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
                            />
                            <div className="absolute bottom-0 left-0 p-6 z-20 w-full">
                                <h3 className="text-white text-xl font-bold mb-1">{cat.name}</h3>
                                <p className="text-white/80 text-sm flex items-center justify-between">
                                    {cat.count}
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
