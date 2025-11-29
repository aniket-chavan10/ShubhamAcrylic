import { useEffect, useState } from 'react';
import { getProducts, getCategories } from '../services/api';
import ProductCard from './ProductCard';
import { Product } from '../types';

const ProductGrid = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filter, setFilter] = useState('All');
    const [filters, setFilters] = useState<string[]>(['All']);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [productsData, categoriesData] = await Promise.all([
                    getProducts(),
                    getCategories()
                ]);

                if (Array.isArray(productsData)) {
                    setProducts(productsData);
                } else if (productsData && Array.isArray(productsData.products)) {
                    setProducts(productsData.products);
                } else {
                    setProducts([]);
                }

                if (Array.isArray(categoriesData)) {
                    setFilters(['All', ...categoriesData.map((c: any) => c.name)]);
                }
            } catch (err) {
                setError('Failed to load products.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const filteredProducts = filter === 'All'
        ? products
        : products.filter(p => {
            const catName = typeof p.category === 'object' ? p.category.name : p.category;
            return catName === filter;
        });

    if (loading) return (
        <div className="flex justify-center items-center h-64">
            <div className="relative w-16 h-16">
                <div className="absolute top-0 left-0 w-full h-full border-4 border-blue-200 rounded-full animate-ping"></div>
                <div className="absolute top-0 left-0 w-full h-full border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
        </div>
    );

    if (error) return <div className="text-center text-red-500 py-10 text-lg">{error}</div>;

    return (
        <section className="py-16 bg-gray-50" id="products">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-12">
                    <h2 className="text-4xl font-bold text-gray-900 mb-3">Our Products</h2>
                    <p className="text-gray-600 text-lg mb-8">Explore our premium acrylic product collection</p>
                    <div className="flex flex-wrap justify-center gap-3">
                        {filters.map(f => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`px-6 py-3 rounded-lg text-sm font-semibold transition-all duration-200 focus:outline-none ${filter === f
                                    ? 'bg-blue-600 !text-white shadow-lg hover:bg-blue-700 active:bg-blue-800 focus:ring-2 focus:ring-blue-500'
                                    : 'bg-white !text-gray-900 hover:bg-gray-100 border-2 border-gray-300 active:bg-gray-200 active:border-gray-400 focus:ring-2 focus:ring-gray-400'
                                    }`}
                            >
                                {f}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredProducts.map((product) => (
                        <ProductCard key={product._id} product={product} />
                    ))}
                </div>

                {filteredProducts.length === 0 && (
                    <div className="text-center py-12 text-gray-500">No products found in this category.</div>
                )}
            </div>
        </section>
    );
};

export default ProductGrid;
