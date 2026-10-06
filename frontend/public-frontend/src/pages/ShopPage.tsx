import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Search, Shirt } from 'lucide-react';
import ProductCard from '../components/ProductCard';
import { getCategories, getProducts } from '../services/api';
import type { Category, Product } from '../types';

type Sort = 'new' | 'price-asc' | 'price-desc';

export default function ShopPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<number | 'all'>('all');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<Sort>('new');

  useEffect(() => {
    Promise.all([
      getProducts().then(d => setProducts(Array.isArray(d) ? d : d.products || [])),
      getCategories().then(d => setCategories(Array.isArray(d) ? d : [])),
    ]).catch(() => undefined).finally(() => setLoading(false));
  }, []);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = products.filter(p =>
      (category === 'all' || p.category?.id === category) &&
      (!q || [p.name, p.productCode, p.description, p.category?.name, ...(p.tags || [])].some(v => v?.toLowerCase().includes(q))),
    );
    if (sort === 'price-asc') list.sort((a, b) => Number(a.price) - Number(b.price));
    if (sort === 'price-desc') list.sort((a, b) => Number(b.price) - Number(a.price));
    return list;
  }, [products, category, query, sort]);

  const usedCategories = categories.filter(c => products.some(p => p.category?.id === c.id));

  return (
    <>
      <section className="border-b border-line bg-white">
        <div className="container-x py-12 sm:py-16">
          <p className="eyebrow">The collection</p>
          <h1 className="mt-3 font-display text-5xl font-extrabold tracking-tight sm:text-6xl">Shop</h1>
          <p className="mt-3 max-w-lg text-muted">Ready-made designs, printed to order. Want something one-of-a-kind? Make it in the design studio.</p>
        </div>
      </section>

      <section className="container-x py-10">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
            {[{ id: 'all' as const, name: 'All' }, ...usedCategories].map(c => (
              <button
                key={c.id}
                onClick={() => setCategory(c.id)}
                className={`shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition ${category === c.id ? 'border-ink bg-ink text-white' : 'border-line bg-white hover:border-ink'}`}
              >
                {c.name}
              </button>
            ))}
          </div>
          <div className="flex gap-3">
            <label className="relative flex-1 lg:w-72">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search products" className="field rounded-full pl-11" />
            </label>
            <select value={sort} onChange={e => setSort(e.target.value as Sort)} className="field w-auto rounded-full pr-8" aria-label="Sort products">
              <option value="new">Newest</option>
              <option value="price-asc">Price: low to high</option>
              <option value="price-desc">Price: high to low</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="mt-10 grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-[4/5] rounded-3xl bg-paper-deep" />
                <div className="mt-4 h-4 w-2/3 rounded bg-paper-deep" />
              </div>
            ))}
          </div>
        ) : visible.length > 0 ? (
          <div className="mt-10 grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 lg:grid-cols-4">
            {visible.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        ) : (
          <div className="mt-10 rounded-3xl border border-dashed border-line py-20 text-center">
            <Shirt className="mx-auto h-10 w-10 text-muted" strokeWidth={1.25} />
            <p className="mt-4 font-semibold">No products found</p>
            <p className="mt-1 text-sm text-muted">Try another category or search term.</p>
          </div>
        )}

        <Link to="/customize" className="group mt-20 flex flex-col justify-between gap-6 rounded-[2rem] bg-ink p-8 text-white sm:flex-row sm:items-center sm:p-12">
          <div>
            <p className="eyebrow text-white/50">Design studio</p>
            <h2 className="mt-2 font-display text-3xl font-bold sm:text-4xl">Didn't find it? <span className="text-accent">Design it.</span></h2>
          </div>
          <span className="btn-accent self-start sm:self-auto">Start designing <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" /></span>
        </Link>
      </section>
    </>
  );
}
