import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Star, Truck, ShieldCheck, RotateCcw } from 'lucide-react';
import api from '../services/api';
import { Product } from '../types';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const ProductDetails = () => {
    const { id } = useParams<{ id: string }>();
    const [product, setProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                const response = await api.get(`/products/${id}`);
                setProduct(response.data);
            } catch (err) {
                setError('Failed to load product details.');
            } finally {
                setLoading(false);
            }
        };
        fetchProduct();
    }, [id]);

    if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
    if (error || !product) return <div className="min-h-screen flex items-center justify-center text-red-500">{error || 'Product not found'}</div>;

    return (
        <div className="min-h-screen bg-white font-sans">
            <Navbar />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex flex-col md:flex-row gap-8">
                    {/* Left: Image Gallery */}
                    <div className="md:w-2/5">
                        <div className="sticky top-24">
                            <div className="border border-gray-200 rounded-lg overflow-hidden bg-gray-50 flex items-center justify-center h-[500px]">
                                <img
                                    src={product.imageUrl || 'https://via.placeholder.com/500'}
                                    alt={product.name}
                                    className="max-h-full max-w-full object-contain mix-blend-multiply"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Middle: Product Info */}
                    <div className="md:w-2/5 space-y-4">
                        <h1 className="text-3xl font-medium text-gray-900">{product.name}</h1>
                        <div className="flex items-center gap-2">
                            <div className="flex text-yellow-400">
                                {[...Array(5)].map((_, i) => (
                                    <Star key={i} size={18} fill={i < 4 ? "currentColor" : "none"} />
                                ))}
                            </div>
                            <span className="text-blue-600 hover:underline cursor-pointer">128 ratings</span>
                        </div>

                        <div className="border-t border-b border-gray-200 py-4 space-y-2">
                            <div className="flex items-baseline gap-2">
                                <span className="text-red-600 text-xl font-light">-17%</span>
                                <span className="text-3xl font-medium text-gray-900">₹{product.price}</span>
                            </div>
                            <p className="text-gray-500 text-sm">M.R.P.: <span className="line-through">₹{Math.round(product.price * 1.2)}</span></p>
                            <p className="text-sm text-gray-700">Inclusive of all taxes</p>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center gap-4 text-sm">
                                <div className="flex flex-col items-center text-center w-20">
                                    <div className="bg-gray-100 p-3 rounded-full mb-2"><RotateCcw size={20} className="text-blue-600" /></div>
                                    <span className="text-blue-600">7 days Replacement</span>
                                </div>
                                <div className="flex flex-col items-center text-center w-20">
                                    <div className="bg-gray-100 p-3 rounded-full mb-2"><Truck size={20} className="text-blue-600" /></div>
                                    <span className="text-blue-600">Free Delivery</span>
                                </div>
                                <div className="flex flex-col items-center text-center w-20">
                                    <div className="bg-gray-100 p-3 rounded-full mb-2"><ShieldCheck size={20} className="text-blue-600" /></div>
                                    <span className="text-blue-600">1 Year Warranty</span>
                                </div>
                            </div>

                            <div className="border-t border-gray-200 pt-4">
                                <h3 className="font-bold text-lg mb-2">About this item</h3>
                                <p className="text-gray-700 leading-relaxed">{product.description}</p>
                                <ul className="list-disc pl-5 mt-4 space-y-1 text-gray-700">
                                    <li><strong>Material:</strong> {product.materialType || 'Premium Acrylic'}</li>
                                    <li><strong>Size:</strong> {product.size || 'Standard'}</li>
                                    <li><strong>Color:</strong> {product.color || 'Clear'}</li>
                                    <li><strong>Weight:</strong> {product.weight ? `${product.weight} kg` : 'N/A'}</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* Right: Buy Box */}
                    <div className="md:w-1/5">
                        <div className="border border-gray-200 rounded-lg p-4 shadow-sm sticky top-24">
                            <div className="text-2xl font-medium text-gray-900 mb-2">₹{product.price}</div>
                            <div className="text-sm text-gray-600 mb-4">
                                FREE delivery <span className="font-bold text-gray-900">Monday, Dec 2</span>.
                            </div>
                            <div className="text-xl text-green-600 font-medium mb-4">In Stock</div>

                            <div className="space-y-3">
                                <button className="w-full bg-yellow-400 hover:bg-yellow-500 text-slate-900 py-2 rounded-full shadow-sm text-sm font-medium transition-colors">
                                    Add to Cart
                                </button>
                                <button className="w-full bg-orange-400 hover:bg-orange-500 text-slate-900 py-2 rounded-full shadow-sm text-sm font-medium transition-colors">
                                    Buy Now
                                </button>
                            </div>

                            <div className="mt-4 text-xs text-gray-500 space-y-1">
                                <div className="flex justify-between"><span>Ships from</span> <span>Shubham Acrylic</span></div>
                                <div className="flex justify-between"><span>Sold by</span> <span>Shubham Acrylic</span></div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default ProductDetails;
