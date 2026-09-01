import React, { useState, useEffect } from "react";
import AdminLayout from "../components/AdminLayout";
import { fetchEnquiries, markEnquiryResolved, deleteEnquiry } from "../services/enquiryService";
import { Search, Filter, Calendar, CheckCircle, Clock, Trash2, Mail, Phone, User, Package, MessageCircle } from "lucide-react";

interface Enquiry {
  id: number;
  name: string;
  mobileNo: string;
  email: string;
  message: string;
  createdAt: string;
  status: "pending" | "resolved";
  enquiryType: "general" | "product";
  productCode?: string;
  productName?: string;
  productId?: number;
}

const EnquiryManagement: React.FC = () => {
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [filteredEnquiries, setFilteredEnquiries] = useState<Enquiry[]>([]);
  const [selectedEnquiry, setSelectedEnquiry] = useState<Enquiry | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "resolved">("all");
  const [typeFilter, setTypeFilter] = useState<"all" | "general" | "product">("all");
  const [dateFilter, setDateFilter] = useState<"all" | "today" | "week" | "month">("all");

  useEffect(() => { loadEnquiries(); }, []);
  useEffect(() => { applyFilters(); }, [enquiries, searchQuery, statusFilter, typeFilter, dateFilter]);

  const loadEnquiries = async () => {
    try {
      setLoading(true);
      const data = await fetchEnquiries();
      setEnquiries(data.enquiries || []);
      setSelectedEnquiry(data.enquiries?.[0] || null);
      setLoading(false);
    } catch (err: any) {
      setError(err.message || "Unknown error");
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...enquiries];

    if (searchQuery) {
      filtered = filtered.filter((e) =>
        e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.mobileNo?.includes(searchQuery) ||
        e.productCode?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.productName?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (statusFilter !== "all") filtered = filtered.filter((e) => e.status === statusFilter);
    if (typeFilter !== "all") filtered = filtered.filter((e) => e.enquiryType === typeFilter);

    if (dateFilter !== "all") {
      const now = new Date();
      filtered = filtered.filter((e) => {
        const diffDays = (now.getTime() - new Date(e.createdAt).getTime()) / (1000 * 60 * 60 * 24);
        if (dateFilter === "today") return diffDays < 1;
        if (dateFilter === "week") return diffDays < 7;
        if (dateFilter === "month") return diffDays < 30;
        return true;
      });
    }

    setFilteredEnquiries(filtered);
  };

  const handleMarkResolved = async (id: number) => {
    try {
      await markEnquiryResolved(String(id));
      setEnquiries((prev) => prev.map((e) => (e.id === id ? { ...e, status: "resolved" } : e)));
      if (selectedEnquiry?.id === id) setSelectedEnquiry({ ...selectedEnquiry, status: "resolved" });
    } catch (err: any) {
      alert("Failed to mark as resolved: " + err.message);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this enquiry?")) return;
    try {
      await deleteEnquiry(String(id));
      setEnquiries((prev) => prev.filter((e) => e.id !== id));
      setSelectedEnquiry(null);
    } catch (err: any) {
      alert("Failed to delete: " + err.message);
    }
  };

  const pendingCount = enquiries.filter((e) => e.status === "pending").length;
  const productEnquiryCount = enquiries.filter((e) => e.enquiryType === "product").length;

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Enquiry Management</h2>
            <p className="text-gray-600 mt-1">
              {filteredEnquiries.length} enquiries • {pendingCount} pending • {productEnquiryCount} product enquiries
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="relative md:col-span-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, email, phone, product code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none appearance-none bg-white">
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="resolved">Resolved</option>
              </select>
            </div>

            <div className="relative">
              <MessageCircle className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as any)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none appearance-none bg-white">
                <option value="all">All Types</option>
                <option value="general">General</option>
                <option value="product">Product</option>
              </select>
            </div>

            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <select value={dateFilter} onChange={(e) => setDateFilter(e.target.value as any)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none appearance-none bg-white">
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">Last 7 Days</option>
                <option value="month">Last 30 Days</option>
              </select>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Enquiry List */}
          <div className="lg:col-span-1 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <h3 className="font-semibold text-gray-900">Enquiries</h3>
            </div>
            <div className="overflow-y-auto max-h-[calc(100vh-350px)]">
              {loading && <p className="p-8 text-center text-gray-500">Loading...</p>}
              {error && <p className="p-8 text-center text-red-600">Error: {error}</p>}
              {!loading && filteredEnquiries.length === 0 && (
                <p className="p-8 text-center text-gray-500">No enquiries found.</p>
              )}
              {filteredEnquiries.map((enquiry) => {
                const isSelected = selectedEnquiry?.id === enquiry.id;
                return (
                  <div
                    key={enquiry.id}
                    onClick={() => setSelectedEnquiry(enquiry)}
                    className={`p-4 border-b border-gray-100 cursor-pointer transition ${
                      isSelected ? "bg-blue-50 border-l-4 border-l-blue-600" : "hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="font-semibold text-gray-900 truncate">{enquiry.name}</p>
                          {enquiry.enquiryType === "product" && (
                            <span className="flex-shrink-0 inline-flex items-center gap-0.5 text-[10px] font-bold bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded-full">
                              <Package size={9} /> Product
                            </span>
                          )}
                        </div>
                        {enquiry.productCode && (
                          <p className="text-xs text-orange-600 font-semibold">{enquiry.productCode} • {enquiry.productName}</p>
                        )}
                        <p className="text-sm text-gray-600 truncate">{enquiry.email}</p>
                        <p className="text-xs text-gray-400 mt-1">{new Date(enquiry.createdAt).toLocaleDateString()}</p>
                      </div>
                      <div className="flex-shrink-0">
                        {enquiry.status === "pending" ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">
                            <Clock className="w-3 h-3" /> Pending
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                            <CheckCircle className="w-3 h-3" /> Resolved
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Enquiry Details */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            {selectedEnquiry ? (
              <div className="space-y-6">
                <div className="flex items-start justify-between flex-wrap gap-3">
                  <h3 className="text-2xl font-bold text-gray-900">Enquiry Details</h3>
                  <div className="flex items-center gap-2">
                    {selectedEnquiry.enquiryType === "product" && (
                      <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-orange-100 text-orange-700 rounded-full text-sm font-medium">
                        <Package className="w-4 h-4" /> Product Enquiry
                      </span>
                    )}
                    {selectedEnquiry.status === "pending" ? (
                      <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-yellow-100 text-yellow-700 rounded-full text-sm font-medium">
                        <Clock className="w-4 h-4" /> Pending
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                        <CheckCircle className="w-4 h-4" /> Resolved
                      </span>
                    )}
                  </div>
                </div>

                {/* Product info (if product enquiry) */}
                {selectedEnquiry.enquiryType === "product" && selectedEnquiry.productCode && (
                  <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
                    <p className="text-xs font-semibold text-orange-600 uppercase tracking-wide mb-1">Product Enquiry</p>
                    <p className="font-bold text-gray-900 text-lg">{selectedEnquiry.productName}</p>
                    <p className="text-sm text-orange-700 font-mono font-bold mt-1">{selectedEnquiry.productCode}</p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <p className="text-sm text-gray-500 flex items-center gap-2"><User className="w-4 h-4" /> Name</p>
                    <p className="font-semibold text-gray-900">{selectedEnquiry.name}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-gray-500 flex items-center gap-2"><Mail className="w-4 h-4" /> Email</p>
                    <p className="font-semibold text-gray-900">{selectedEnquiry.email}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-gray-500 flex items-center gap-2"><Phone className="w-4 h-4" /> Mobile</p>
                    <p className="font-semibold text-gray-900">{selectedEnquiry.mobileNo || "-"}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-gray-500 flex items-center gap-2"><Calendar className="w-4 h-4" /> Received On</p>
                    <p className="font-semibold text-gray-900">{new Date(selectedEnquiry.createdAt).toLocaleString()}</p>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-gray-500 mb-2">Message</p>
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <p className="text-gray-900 whitespace-pre-wrap">{selectedEnquiry.message}</p>
                  </div>
                </div>

                <div className="flex gap-3 pt-4 border-t border-gray-200">
                  {selectedEnquiry.status === "pending" && (
                    <button
                      onClick={() => handleMarkResolved(selectedEnquiry.id)}
                      className="flex-1 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition flex items-center justify-center gap-2"
                    >
                      <CheckCircle className="w-5 h-5" /> Mark as Resolved
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(selectedEnquiry.id)}
                    className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition flex items-center justify-center gap-2"
                  >
                    <Trash2 className="w-5 h-5" /> Delete
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                <Mail className="w-16 h-16 mb-4 text-gray-300" />
                <p>Select an enquiry to view details</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default EnquiryManagement;
