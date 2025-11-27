import { Product } from '../types';
import { Star, ShoppingCart } from 'lucide-react';
import { Link } from 'react-router-dom';

interface ProductCardProps {
    product: Product;
}

const ProductCard = ({ product }: ProductCardProps) => {
    return (
        <div className="bg-white rounded-lg shadow-sm hover:shadow-lg transition-shadow duration-300 overflow-hidden border border-gray-100 flex flex-col h-full">
            <Link to={`/product/${product._id}`} className="relative pt-[100%] bg-gray-50 group">
                <img
                    src={product.imageUrl || 'https://via.placeholder.com/300'}
                    alt={product.name}
                    className="absolute top-0 left-0 w-full h-full object-contain p-4 mix-blend-multiply group-hover:scale-105 transition-transform duration-300"
                />
            </Link>

            <div className="p-4 flex flex-col flex-1">
                <Link to={`/product/${product._id}`} className="hover:text-yellow-600">
                    <h3 className="text-lg font-medium text-gray-900 line-clamp-2 mb-1">
                        {product.name}
                    </h3>
                </Link>

                <div className="flex items-center mb-2">
                    <div className="flex text-yellow-400">
                        {[...Array(5)].map((_, i) => (
                            <Star key={i} size={16} fill={i < 4 ? "currentColor" : "none"} />
                        ))}
                    </div>
                    <span className="text-sm text-blue-600 ml-2 hover:underline cursor-pointer">128 ratings</span>
                </div>

                <div className="mt-auto">
                    <div className="flex items-baseline gap-2">
                        <span className="text-xs align-top">₹</span>
                        <span className="text-2xl font-bold text-gray-900">{product.price}</span>
                        <span className="text-sm text-gray-500 line-through">₹{Math.round(product.price * 1.2)}</span>
                    </div>

                    <p className="text-sm text-gray-600 mt-1">
                        Get it by <span className="font-bold text-gray-800">Tomorrow, Nov 29</span>
                    </p>
                    <p className="text-sm text-gray-600">FREE Delivery by Shubham Acrylic</p>

                    <button className="w-full mt-3 bg-yellow-400 hover:bg-yellow-500 text-slate-900 font-medium py-2 rounded-full transition-colors flex items-center justify-center gap-2">
                        <ShoppingCart size={18} /> Add to Cart
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProductCard;
