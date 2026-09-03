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

    const fetchData = async () => {
        setLoading(true);
        setError('');
        try {
            const [productsData, categoriesData] = await Promise.allSettled([
                getProducts(),
                getCategories()
            ]);

            let loadedProducts: Product[] = [];
            if (productsData.status === 'fulfilled') {
                const pData = productsData.value;
                if (Array.isArray(pData)) {
                    loadedProducts = pData;
                } else if (pData && Array.isArray(pData.products)) {
                    loadedProducts = pData.products;
                }
            } else {
                console.error("Failed to load products:", productsData.reason);
            }

            if (categoriesData.status === 'fulfilled' && Array.isArray(categoriesData.value)) {
                const catNames = categoriesData.value.map((c: any) => c.name);
                setFilters(['All', ...catNames]);
            }

            setProducts(loadedProducts);
            if (productsData.status === 'rejected' && loadedProducts.length === 0) {
                setError('Failed to connect to product server. Retrying...');
            }
        } catch (err: any) {
            console.error("Fetch error:", err);
            setError('Failed to load products. Check server connection.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
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
                <div className="absolute top-0 left-0 w-full h-full border-4 border-indigo-200 rounded-full animate-ping"></div>
                <div className="absolute top-0 left-0 w-full h-full border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
        </div>
    );

    if (error && products.length === 0) return (
        <div className="text-center py-12">
            <p className="text-red-500 text-lg mb-4">{error}</p>
            <button
                onClick={fetchData}
                className="px-6 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors"
            >
                Retry Loading
            </button>
        </div>
    );

    return (
        <section className="py-16 bg-gray-50" id="products">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-12">
                    <h2 className="text-4xl font-bold text-gray-900 mb-3">Our T-Shirt Collection</h2>
                    <p className="text-gray-600 text-lg mb-8">Explore our premium selection of oversized, graphic, and basic tees</p>
                    <div className="flex flex-wrap justify-center gap-3">
                        {filters.map(f => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`px-6 py-3 rounded-lg text-sm font-semibold transition-all duration-200 focus:outline-none ${filter === f
                                    ? 'bg-indigo-600 !text-white shadow-lg hover:bg-indigo-700 active:bg-indigo-800 focus:ring-2 focus:ring-indigo-500'
                                    : 'bg-white !text-gray-900 hover:bg-gray-100 border-2 border-gray-300 active:bg-gray-200 active:border-gray-400 focus:ring-2 focus:ring-gray-400'
                                    }`}
                            >
                                {f}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
                    {filteredProducts.map((product) => (
                        <ProductCard key={product.id || (product as any)._id} product={product} />
                    ))}
                </div>

                {filteredProducts.length === 0 && (
                    <div className="text-center py-12 text-gray-500">No t-shirts found in this category.</div>
                )}
            </div>
        </section>
    );
};

export default ProductGrid;
