import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import AdminLayout from "../components/AdminLayout";
import { Package, Mail, Star, Image, TrendingUp, Clock, CheckCircle, AlertCircle, Receipt, ShoppingBag, Shirt } from "lucide-react";
import { fetchOrders, fetchOrderStats, Order } from "../services/orderService";
import { fetchInvoices } from "../services/invoiceService";
import { getImageUrl } from "../utils/imageUtils";
import { inr } from "../utils/format";
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

  const StatCard = ({ icon: Icon, title, value, subtitle, color }: any) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-600 font-medium">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
          {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="relative overflow-hidden rounded-2xl bg-ink p-8 text-white">
          <div className="absolute -right-10 -top-16 h-56 w-56 rounded-full bg-accent/40 blur-3xl" />
          <p className="relative text-xs font-semibold uppercase tracking-[0.2em] text-white/40">Dashboard</p>
          <h2 className="relative mt-2 font-display text-3xl font-bold tracking-tight">Welcome back!</h2>
          <p className="relative mt-1 text-white/60">Here's what's happening with your business today.</p>
          <div className="relative mt-6 flex flex-wrap gap-2">
            <Link to="/invoices/new" className="a-btn-accent"><Receipt className="h-4 w-4" /> New invoice</Link>
            <Link to="/orders" className="a-btn border border-white/20 text-white hover:bg-white hover:text-ink"><ShoppingBag className="h-4 w-4" /> View orders</Link>
            <Link to="/garments" className="a-btn border border-white/20 text-white hover:bg-white hover:text-ink"><Shirt className="h-4 w-4" /> Studio pricing</Link>
          </div>
        </div>

        {/* Sales */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Link to="/orders" className="a-card p-5 transition hover:border-ink">
            <p className="a-label">New website orders</p>
            <p className="font-display text-3xl font-bold text-accent">{sales.newOrders}</p>
            <p className="text-xs text-muted">{sales.totalOrders} orders in total</p>
          </Link>
          <div className="a-card p-5">
            <p className="a-label">Website order value</p>
            <p className="font-display text-3xl font-bold">{inr(sales.orderValue)}</p>
            <p className="text-xs text-muted">Excluding cancelled</p>
          </div>
          <Link to="/invoices" className="a-card p-5 transition hover:border-ink">
            <p className="a-label">Invoiced</p>
            <p className="font-display text-3xl font-bold">{inr(sales.billed)}</p>
            <p className="text-xs text-muted">{inr(sales.received)} received</p>
          </Link>
          <Link to="/invoices" className="a-card p-5 transition hover:border-ink">
            <p className="a-label">Outstanding</p>
            <p className="font-display text-3xl font-bold text-red-600">{inr(sales.outstanding)}</p>
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
                <Link key={o.id} to="/orders" className="flex items-center gap-4 p-4 hover:bg-paper/60">
                  {o.previews?.front
                    ? <img src={getImageUrl(o.previews.front)} alt="" className="h-12 w-11 rounded-lg bg-paper object-cover" />
                    : <span className="h-12 w-11 rounded-lg bg-paper" />}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{o.customerName} <span className="font-normal text-muted">· {o.orderNumber}</span></p>
                    <p className="truncate text-xs text-muted">{o.garmentName} × {o.quantity} · {o.colorName} · {o.size}</p>
                  </div>
                  <p className="text-sm font-semibold">{inr(o.total)}</p>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <StatCard
            icon={Package}
            title="Total Products"
            value={stats.totalProducts}
            subtitle={stats.lowStockProducts > 0 ? `${stats.lowStockProducts} low stock` : "All stocked"}
            color="bg-blue-600"
          />
          <StatCard
            icon={Mail}
            title="Total Enquiries"
            value={stats.totalEnquiries}
            subtitle={stats.pendingEnquiries > 0 ? `${stats.pendingEnquiries} pending` : "All resolved"}
            color={stats.pendingEnquiries > 0 ? "bg-yellow-600" : "bg-green-600"}
          />
          <StatCard
            icon={Star}
            title="Customer Reviews"
            value={stats.totalReviews}
            subtitle="Total reviews received"
            color="bg-purple-600"
          />
          <StatCard
            icon={Image}
            title="Active Banners"
            value={stats.activeBanners}
            subtitle="Currently displayed"
            color="bg-indigo-600"
          />
          <StatCard
            icon={TrendingUp}
            title="Low Stock Alert"
            value={stats.lowStockProducts}
            subtitle="Products need restock"
            color={stats.lowStockProducts > 5 ? "bg-red-600" : "bg-orange-600"}
          />
          <StatCard
            icon={CheckCircle}
            title="Resolved Enquiries"
            value={stats.totalEnquiries - stats.pendingEnquiries}
            subtitle="All time resolved"
            color="bg-green-600"
          />
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Enquiries */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Recent Enquiries</h3>
            </div>
            <div className="divide-y divide-gray-100">
              {recentEnquiries.length === 0 ? (
                <p className="p-6 text-center text-gray-500">No enquiries yet</p>
              ) : (
                recentEnquiries.map((enquiry) => (
                  <div key={enquiry._id} className="p-4 hover:bg-gray-50 transition">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">{enquiry.name}</p>
                        <p className="text-sm text-gray-600 truncate mt-1">{enquiry.message}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(enquiry.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        {enquiry.status === "pending" ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">
                            <Clock className="w-3 h-3" />
                            Pending
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                            <CheckCircle className="w-3 h-3" />
                            Resolved
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <a
                href="/products"
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-blue-50 transition border border-gray-200"
              >
                <Package className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="font-medium text-gray-900">Manage Products</p>
                  <p className="text-sm text-gray-600">Add, edit, or remove products</p>
                </div>
              </a>
              <a
                href="/enquiry-management"
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-green-50 transition border border-gray-200"
              >
                <Mail className="w-5 h-5 text-green-600" />
                <div>
                  <p className="font-medium text-gray-900">View Enquiries</p>
                  <p className="text-sm text-gray-600">Respond to customer enquiries</p>
                </div>
              </a>
              <a
                href="/reviews"
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-purple-50 transition border border-gray-200"
              >
                <Star className="w-5 h-5 text-purple-600" />
                <div>
                  <p className="font-medium text-gray-900">Manage Reviews</p>
                  <p className="text-sm text-gray-600">Monitor customer feedback</p>
                </div>
              </a>
              <a
                href="/banners"
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-indigo-50 transition border border-gray-200"
              >
                <Image className="w-5 h-5 text-indigo-600" />
                <div>
                  <p className="font-medium text-gray-900">Update Banners</p>
                  <p className="text-sm text-gray-600">Manage homepage carousel</p>
                </div>
              </a>
            </div>
          </div>
        </div>

        {/* Alerts */}
        {(stats.pendingEnquiries > 0 || stats.lowStockProducts > 0) && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div>
                <h4 className="font-semibold text-yellow-900">Attention Required</h4>
                <ul className="mt-2 space-y-1 text-sm text-yellow-800">
                  {stats.pendingEnquiries > 0 && (
                    <li>• You have {stats.pendingEnquiries} pending enquiries to review</li>
                  )}
                  {stats.lowStockProducts > 0 && (
                    <li>• {stats.lowStockProducts} products are running low on stock</li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default Dashboard;
