// src/pages/ProductsPage.tsx
import { useEffect, useMemo, useState } from 'react';
import { getProducts, getCategories } from '../services/api';
import ProductCard from '../components/ProductCard';
import { Product } from '../types';

const BRAND = {
  magenta: '#a83a7f',
  teal: '#36b2a5',
};

const ProductsPage = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('All');
  const [filters, setFilters] = useState<string[]>(['All']);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productsData, categoriesData] = await Promise.all([
          getProducts(),
          getCategories(),
        ]);

        if (Array.isArray(productsData)) {
          setProducts(productsData);
        } else if (
          productsData &&
          Array.isArray((productsData as any).products)
        ) {
          setProducts((productsData as any).products);
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

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const catName =
        typeof p.category === 'object' ? (p.category as any).name : p.category;

      const matchCategory = filter === 'All' ? true : catName === filter;

      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        String(catName).toLowerCase().includes(q);

      return matchCategory && matchSearch;
    });
  }, [products, filter, search]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="relative h-16 w-16">
          <div className="absolute inset-0 rounded-full border-4 border-pink-100 animate-ping" />
          <div className="absolute inset-0 rounded-full border-4 border-pink-600 border-t-transparent animate-spin" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-lg" style={{ color: '#dc2626' }}>
          {error}
        </p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Page hero bar */}
      <section className="border-b border-slate-200 bg-white/70 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-10 sm:px-6 lg:px-8 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p
              className="text-[11px] font-semibold uppercase tracking-[0.24em]"
              style={{ color: BRAND.teal }}
            >
              Product catalogue
            </p>
            <h1 className="mt-1 text-3xl font-semibold text-slate-900 md:text-4xl">
              Explore our acrylic range
            </h1>
            <p className="mt-2 max-w-xl text-sm text-slate-600 md:text-base">
              Filter by application and quickly find the right sinks, shutters,
              dots and drawer fronts for your project.
            </p>
          </div>

          {/* Search moves into hero on larger screens */}
          <div className="w-full max-w-md">
            <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              Search products
            </label>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Type product name, code or category..."
              className="w-full rounded-full border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-[color:#a83a7f] focus:ring-1 focus:ring-[color:#a83a7f]"
            />
          </div>
        </div>
      </section>

      {/* Filters + grid area */}
      <section className="mx-auto max-w-7xl px-4 pb-16 pt-8 sm:px-6 lg:px-8">
        {/* Category filter pills in their own bar */}
        <div className="mb-6 overflow-x-auto">
          <div className="flex min-w-max gap-2 rounded-full bg-slate-100/70 p-1">
            {filters.map((name) => {
              const active = filter === name;
              return (
                <button
                  key={name}
                  type="button"
                  onClick={() => setFilter(name)}
                  className="whitespace-nowrap rounded-full px-4 py-1.5 text-xs md:text-sm font-semibold transition-all duration-200"
                  style={
                    active
                      ? {
                          backgroundColor: '#ffffff',
                          color: BRAND.magenta,
                          boxShadow: '0 6px 18px rgba(15,23,42,0.12)',
                        }
                      : {
                          backgroundColor: 'transparent',
                          color: '#0f172a',
                        }
                  }
                >
                  {name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Grid */}
        <div className="rounded-2xl border border-slate-100 bg-white/90 p-4 shadow-sm sm:p-6 lg:p-8">
          <div className="mb-4 flex items-center justify-between text-xs text-slate-500">
            <span>
              Showing <span className="font-semibold">{filteredProducts.length}</span>{' '}
              products
            </span>
          </div>

          {filteredProducts.length === 0 ? (
            <div className="py-12 text-center text-sm text-slate-500">
              No products match this category or search.
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredProducts.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
};

export default ProductsPage;
