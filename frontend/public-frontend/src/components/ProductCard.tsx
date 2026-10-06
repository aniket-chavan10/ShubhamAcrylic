import { Link } from 'react-router-dom';
import { ArrowUpRight, Shirt } from 'lucide-react';
import type { Product } from '../types';
import { getImageUrl } from '../utils/imageUtils';
import { inr } from '../utils/format';

const ProductCard = ({ product }: { product: Product }) => {
    const main = product.imageUrl || product.images?.[0]?.imageUrl;
    const hover = product.images?.[1]?.imageUrl;

    return (
        <Link to={`/product/${product.id}`} className="group block">
            <div className="relative aspect-[4/5] overflow-hidden rounded-3xl bg-paper-deep">
                {main ? (
                    <>
                        <img
                            src={getImageUrl(main)}
                            alt={product.name}
                            loading="lazy"
                            className={`h-full w-full object-cover transition duration-700 group-hover:scale-105 ${hover ? 'group-hover:opacity-0' : ''}`}
                        />
                        {hover && (
                            <img src={getImageUrl(hover)} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover opacity-0 transition duration-700 group-hover:opacity-100" />
                        )}
                    </>
                ) : (
                    <div className="grid h-full w-full place-items-center text-muted"><Shirt className="h-12 w-12" strokeWidth={1} /></div>
                )}
                {product.category && (
                    <span className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider backdrop-blur">
                        {product.category.name}
                    </span>
                )}
                <span className="absolute bottom-3 right-3 grid h-11 w-11 translate-y-2 place-items-center rounded-full bg-ink text-white opacity-0 transition group-hover:translate-y-0 group-hover:opacity-100">
                    <ArrowUpRight className="h-5 w-5" />
                </span>
            </div>
            <div className="mt-4 flex items-start justify-between gap-3 px-1">
                <div className="min-w-0">
                    <h3 className="truncate font-semibold">{product.name}</h3>
                    <p className="mt-0.5 truncate text-sm text-muted">{product.fabric || product.productCode}</p>
                </div>
                <p className="shrink-0 font-display text-lg font-bold">{inr(product.price)}</p>
            </div>
        </Link>
    );
};

export default ProductCard;
