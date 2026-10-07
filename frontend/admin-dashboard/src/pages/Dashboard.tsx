import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import AdminLayout from "../components/AdminLayout";
import { PageLoader } from "../components/ui";
import { AlertCircle, CheckCircle, ChevronRight, Clock, Image, LucideIcon, Mail, Package, Receipt, ShoppingBag, Shirt, Star, TrendingUp } from "lucide-react";
import { fetchOrders, fetchOrderStats, Order } from "../services/orderService";
import { fetchInvoices } from "../services/invoiceService";
import { getImageUrl } from "../utils/imageUtils";
import { formatDate, inr } from "../utils/format";
import { fetchProducts } from "../services/productService";
import { fetchEnquiries } from "../services/enquiryService";
import * as reviewService from "../services/reviewService";
import { fetchBanners } from "../services/bannerService";

interface Stats {
  totalProducts: number;
  totalEnquiries: number;
  pendingEnquiries: number;
  totalReviews: number;
  activeBanners: number;
  lowStockProducts: number;
}

const Dashboard = () => {
  const [stats, setStats] = useState<Stats>({
    totalProducts: 0,
    totalEnquiries: 0,
    pendingEnquiries: 0,
    totalReviews: 0,
    activeBanners: 0,
    lowStockProducts: 0,
  });
  const [recentEnquiries, setRecentEnquiries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [sales, setSales] = useState({ newOrders: 0, totalOrders: 0, orderValue: 0, billed: 0, received: 0, outstanding: 0 });
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);

  useEffect(() => {
    loadDashboardData();
    Promise.all([
      fetchOrderStats().catch(() => null),
      fetchInvoices({ page: 1 }).catch(() => null),
      fetchOrders({ page: 1 }).catch(() => null),
    ]).then(([orderStats, invoices, orders]) => {
      setSales({
        newOrders: orderStats?.byStatus.new ?? 0,
        totalOrders: orderStats?.total ?? 0,
        orderValue: orderStats?.revenue ?? 0,
        billed: invoices?.summary.billed ?? 0,
        received: invoices?.summary.received ?? 0,
        outstanding: invoices?.summary.outstanding ?? 0,
      });
      setRecentOrders(orders?.orders.slice(0, 5) ?? []);
    });
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch all data
      const [productsData, enquiriesData, reviewsData, bannersData] = await Promise.all([
        fetchProducts().catch(() => ({ products: [] })),
        fetchEnquiries().catch(() => ({ enquiries: [] })),
        reviewService.getAllReviews().catch(() => ({ data: [] })),
        fetchBanners().catch(() => []),
      ]);

      // Process products
      const products = Array.isArray(productsData) ? productsData : productsData.products || [];
      const lowStock = products.filter((p: any) => p.stockQuantity < 5).length;

      // Process enquiries
      const enquiries = enquiriesData.enquiries || [];
      const pending = enquiries.filter((e: any) => e.status === "pending").length;

      // Process reviews
      const reviews = reviewsData.data || reviewsData || [];

      // Process banners
      const banners = Array.isArray(bannersData) ? bannersData : [];
      const active = banners.filter((b: any) => b.isActive).length;

      setStats({
        totalProducts: products.length,
        totalEnquiries: enquiries.length,
        pendingEnquiries: pending,
        totalReviews: Array.isArray(reviews) ? reviews.length : 0,
        activeBanners: active,
        lowStockProducts: lowStock,
      });

      // Get recent 5 enquiries
      setRecentEnquiries(enquiries.slice(0, 5));
      setLoading(false);
    } catch (error) {
      console.error("Error loading dashboard data:", error);
      setLoading(false);
    }
  };

  const StatCard = ({ icon: Icon, title, value, subtitle, to, tone = "" }: { icon: LucideIcon; title: string; value: number; subtitle: string; to: string; tone?: string }) => (
    <Link to={to} className="a-card flex items-start justify-between gap-3 p-5 transition hover:border-ink">
      <div className="min-w-0">
        <p className="a-label">{title}</p>
        <p className={`font-display text-3xl font-bold ${tone}`}>{value}</p>
        <p className="mt-0.5 text-xs text-muted">{subtitle}</p>
      </div>
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-paper text-ink"><Icon className="h-5 w-5" /></span>
    </Link>
  );

  if (loading) {
    return (
      <AdminLayout>
        <PageLoader />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="relative overflow-hidden rounded-2xl bg-ink p-6 text-white sm:p-8">
          <div className="absolute -right-10 -top-16 h-56 w-56 rounded-full bg-accent/40 blur-3xl" />
          <p className="relative text-xs font-semibold uppercase tracking-[0.2em] text-white/40">Dashboard</p>
          <h2 className="relative mt-2 font-display text-2xl font-bold tracking-tight sm:text-3xl">Welcome back!</h2>
          <p className="relative mt-1 text-white/60">Here's what's happening with your business today.</p>
          <div className="relative mt-6 flex flex-wrap gap-2">
            <Link to="/invoices/new" className="a-btn-accent"><Receipt className="h-4 w-4" /> New invoice</Link>
            <Link to="/orders" className="a-btn border border-white/20 text-white hover:bg-white hover:text-ink"><ShoppingBag className="h-4 w-4" /> View orders</Link>
            <Link to="/garments" className="a-btn border border-white/20 text-white hover:bg-white hover:text-ink"><Shirt className="h-4 w-4" /> Studio pricing</Link>
          </div>
        </div>

        {/* Sales */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          <Link to="/orders" className="a-card p-4 transition hover:border-ink sm:p-5">
            <p className="a-label">New website orders</p>
            <p className="truncate font-display text-2xl font-bold text-accent sm:text-3xl">{sales.newOrders}</p>
            <p className="text-xs text-muted">{sales.totalOrders} orders in total</p>
          </Link>
          <div className="a-card p-4 sm:p-5">
            <p className="a-label">Website order value</p>
            <p className="truncate font-display text-2xl font-bold sm:text-3xl">{inr(sales.orderValue)}</p>
            <p className="text-xs text-muted">Excluding cancelled</p>
          </div>
          <Link to="/invoices" className="a-card p-4 transition hover:border-ink sm:p-5">
            <p className="a-label">Invoiced</p>
            <p className="truncate font-display text-2xl font-bold sm:text-3xl">{inr(sales.billed)}</p>
            <p className="text-xs text-muted">{inr(sales.received)} received</p>
          </Link>
          <Link to="/invoices" className="a-card p-4 transition hover:border-ink sm:p-5">
            <p className="a-label">Outstanding</p>
            <p className="truncate font-display text-2xl font-bold text-red-600 sm:text-3xl">{inr(sales.outstanding)}</p>
            <p className="text-xs text-muted">To be collected</p>
          </Link>
        </div>

        {recentOrders.length > 0 && (
          <div className="a-card">
            <div className="flex items-center justify-between border-b border-line p-5">
              <h3 className="font-display text-lg font-bold">Latest website orders</h3>
              <Link to="/orders" className="text-sm font-semibold text-accent-dark hover:underline">View all</Link>
            </div>
            <div className="divide-y divide-line">
              {recentOrders.map(o => (
                <Link key={o.id} to="/orders" className="flex items-center gap-3 p-4 hover:bg-paper/60 sm:gap-4">
                  {o.previews?.front
                    ? <img src={getImageUrl(o.previews.front)} alt="" className="h-12 w-11 rounded-lg bg-paper object-cover" />
                    : <span className="h-12 w-11 rounded-lg bg-paper" />}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{o.customerName} <span className="font-normal text-muted">· {o.orderNumber}</span></p>
                    <p className="truncate text-xs text-muted">{o.garmentName} × {o.quantity} · {o.colorName} · {o.size}</p>
                  </div>
                  <p className="shrink-0 text-sm font-semibold">{inr(o.total)}</p>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Catalogue & enquiries */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
          <StatCard icon={Package} title="Total products" value={stats.totalProducts} to="/products"
            subtitle={stats.lowStockProducts > 0 ? `${stats.lowStockProducts} low on stock` : "All stocked"} />
          <StatCard icon={Mail} title="Enquiries" value={stats.totalEnquiries} to="/enquiry-management"
            subtitle={stats.pendingEnquiries > 0 ? `${stats.pendingEnquiries} pending` : "All resolved"} tone={stats.pendingEnquiries > 0 ? "text-accent" : ""} />
          <StatCard icon={Star} title="Customer reviews" value={stats.totalReviews} to="/reviews" subtitle="Total reviews received" />
          <StatCard icon={Image} title="Active banners" value={stats.activeBanners} to="/banners" subtitle="Showing on the home page" />
          <StatCard icon={TrendingUp} title="Low stock" value={stats.lowStockProducts} to="/products"
            subtitle="Products under 5 in stock" tone={stats.lowStockProducts > 0 ? "text-red-600" : ""} />
          <StatCard icon={CheckCircle} title="Resolved enquiries" value={stats.totalEnquiries - stats.pendingEnquiries} to="/enquiry-management" subtitle="All time" />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Recent enquiries */}
          <div className="a-card">
            <div className="flex items-center justify-between border-b border-line p-5">
              <h3 className="font-display text-lg font-bold">Recent enquiries</h3>
              <Link to="/enquiry-management" className="text-sm font-semibold text-accent-dark hover:underline">View all</Link>
            </div>
            <div className="divide-y divide-line">
              {recentEnquiries.length === 0 ? (
                <p className="p-6 text-center text-sm text-muted">No enquiries yet</p>
              ) : (
                recentEnquiries.map((enquiry) => (
                  <Link key={enquiry.id ?? enquiry._id} to="/enquiry-management" className="flex items-start justify-between gap-3 p-4 transition hover:bg-paper/60">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold">{enquiry.name}</p>
                      <p className="mt-0.5 truncate text-sm text-muted">{enquiry.message}</p>
                      <p className="mt-0.5 text-xs text-muted">{formatDate(enquiry.createdAt)}</p>
                    </div>
                    {enquiry.status === "pending" ? (
                      <span className="a-badge bg-amber-50 text-amber-700"><Clock className="h-3 w-3" /> Pending</span>
                    ) : (
                      <span className="a-badge bg-emerald-50 text-emerald-700"><CheckCircle className="h-3 w-3" /> Resolved</span>
                    )}
                  </Link>
                ))
              )}
            </div>
          </div>

          {/* Quick actions */}
          <div className="a-card p-5">
            <h3 className="mb-4 font-display text-lg font-bold">Quick actions</h3>
            <div className="space-y-2">
              {[
                { to: "/products", icon: Package, title: "Manage products", text: "Add, edit or remove products" },
                { to: "/enquiry-management", icon: Mail, title: "View enquiries", text: "Respond to customer enquiries" },
                { to: "/reviews", icon: Star, title: "Manage reviews", text: "Monitor customer feedback" },
                { to: "/banners", icon: Image, title: "Update banners", text: "Manage the home page carousel" },
              ].map(({ to, icon: Icon, title, text }) => (
                <Link key={to} to={to} className="flex items-center gap-3 rounded-xl border border-line p-3 transition hover:border-ink">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-paper"><Icon className="h-[18px] w-[18px]" /></span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold">{title}</span>
                    <span className="block text-xs text-muted">{text}</span>
                  </span>
                  <ChevronRight className="h-4 w-4 text-muted" />
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Alerts */}
        {(stats.pendingEnquiries > 0 || stats.lowStockProducts > 0) && (
          <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-5">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
            <div>
              <h4 className="font-semibold text-amber-900">Needs your attention</h4>
              <ul className="mt-1 space-y-0.5 text-sm text-amber-800">
                {stats.pendingEnquiries > 0 && <li>• {stats.pendingEnquiries} pending enquiries to review</li>}
                {stats.lowStockProducts > 0 && <li>• {stats.lowStockProducts} products are running low on stock</li>}
              </ul>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default Dashboard;
