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
        <div className="group bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 h-full flex flex-col border border-gray-100">
            <Link to={`/product/${product.id}`} className="relative h-44 sm:h-60 overflow-hidden bg-gray-50 block">
                <img
                    src={imageUrl}
                    alt={product.name}
                    className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
                />
                {/* Multiple images indicator */}
                {product.images && product.images.length > 1 && (
                    <span className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-sm text-white text-[10px] px-2 py-0.5 rounded-full font-medium">
                        +{product.images.length - 1} photos
                    </span>
                )}
            </Link>

            <div className="p-3 sm:p-5 flex flex-col flex-1">
                <div className="flex items-center justify-between gap-1 mb-1.5">
                    <span className="text-[10px] sm:text-xs text-indigo-600 font-bold uppercase tracking-wider line-clamp-1">
                        {typeof product.category === 'object' ? product.category?.name : product.category}
                    </span>
                    {product.productCode && (
                        <span className="inline-flex items-center gap-1 text-[9px] sm:text-[10px] font-semibold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200 shrink-0">
                            <Package size={9} /> {product.productCode}
                        </span>
                    )}
                </div>

                <Link to={`/product/${product.id}`}>
                    <h3 className="font-bold text-gray-900 text-sm sm:text-base mb-1 group-hover:text-indigo-600 transition-colors line-clamp-2 leading-snug">{product.name}</h3>
                </Link>
                <p className="text-gray-500 text-xs sm:text-sm mb-3 flex-1 line-clamp-2 hidden sm:block">{product.description}</p>

                <div className="mt-auto pt-2 border-t border-gray-100 flex items-center justify-between gap-2">
                    <div>
                        <span className="text-gray-900 font-extrabold text-base sm:text-xl">₹{product.price}</span>
                    </div>
                    <Link
                        to={`/product/${product.id}`}
                        className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs sm:text-sm py-1.5 px-3 sm:py-2.5 sm:px-4 rounded-lg transition-colors shadow-sm"
                    >
                        View
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default ProductCard;
