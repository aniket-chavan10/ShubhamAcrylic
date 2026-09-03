import { Product } from '../types';
import { Link } from 'react-router-dom';
import { Package } from 'lucide-react';
import { getImageUrl } from '../utils/imageUtils';

interface ProductCardProps {
    product: Product;
}

const ProductCard = ({ product }: ProductCardProps) => {
    const rawUrl = product.imageUrl
        || product.images?.[0]?.imageUrl
        || '';
    const imageUrl = getImageUrl(rawUrl) || 'https://via.placeholder.com/300';

    return (
        <div className="group bg-white rounded-xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-300 h-full flex flex-col border border-gray-200">
            <Link to={`/product/${product.id}`} className="relative h-64 overflow-hidden bg-gray-50 block">
                <img
                    src={imageUrl}
                    alt={product.name}
                    className="w-full h-full object-contain p-4 transform group-hover:scale-110 transition-transform duration-500"
                />
                {/* Multiple images indicator */}
                {product.images && product.images.length > 1 && (
                    <span className="absolute bottom-2 right-2 bg-black/50 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                        +{product.images.length - 1} more
                    </span>
                )}
            </Link>

            <div className="p-5 flex flex-col flex-1">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-blue-600 font-semibold uppercase tracking-wide">
                        {typeof product.category === 'object' ? product.category.name : product.category}
                    </span>
                    {product.productCode && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full border border-gray-200">
                            <Package size={9} /> {product.productCode}
                        </span>
                    )}
                </div>

                <Link to={`/product/${product.id}`}>
                    <h3 className="font-bold text-gray-900 text-lg mb-2 group-hover:text-blue-600 transition-colors line-clamp-2">{product.name}</h3>
                </Link>
                <p className="text-gray-600 text-sm mb-4 flex-1 line-clamp-2">{product.description}</p>

                <div className="mt-auto space-y-3">
                    <div className="flex items-baseline gap-2">
                        <span className="text-gray-900 font-bold text-2xl">₹{product.price}</span>
                    </div>
                    <Link
                        to={`/product/${product.id}`}
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
