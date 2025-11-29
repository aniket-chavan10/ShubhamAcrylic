import { Product } from '../types';
import { Link } from 'react-router-dom';

interface ProductCardProps {
    product: Product;
}

const ProductCard = ({ product }: ProductCardProps) => {
    return (
        <div className="group bg-white rounded-xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-300 h-full flex flex-col border border-gray-200">
            <Link to={`/product/${product._id}`} className="relative h-64 overflow-hidden bg-gray-50">
                <img
                    src={product.imageUrl || 'https://via.placeholder.com/300'}
                    alt={product.name}
                    className="w-full h-full object-contain p-4 transform group-hover:scale-110 transition-transform duration-500"
                />
            </Link>

            <div className="p-5 flex flex-col flex-1">
                <span className="text-xs text-blue-600 font-semibold uppercase tracking-wide mb-2">
                    {typeof product.category === 'object' ? product.category.name : product.category}
                </span>
                <Link to={`/product/${product._id}`}>
                    <h3 className="font-bold text-gray-900 text-lg mb-2 group-hover:text-blue-600 transition-colors line-clamp-2">{product.name}</h3>
                </Link>
                <p className="text-gray-600 text-sm mb-4 flex-1 line-clamp-2">{product.description}</p>

                <div className="mt-auto space-y-3">
                    <div className="flex items-baseline gap-2">
                        <span className="text-gray-900 font-bold text-2xl">₹{product.price}</span>
                    </div>
                    <Link
                        to={`/product/${product._id}`}
                        className="w-full block text-center bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors"
                    >
                        View Details
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default ProductCard;
