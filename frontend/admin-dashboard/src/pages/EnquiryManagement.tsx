import React, { useState, useEffect } from "react";
import AdminLayout from "../components/AdminLayout";
import { fetchEnquiries, markEnquiryResolved, deleteEnquiry } from "../services/enquiryService";
import { Calendar, CheckCircle, Clock, Mail, MessageCircle, Package, Phone, Search, Trash2, User } from "lucide-react";
import { EmptyState, Modal, PageLoader } from "../components/ui";
import { formatDate, formatDateTime, waNumber } from "../utils/format";

const isDesktop = () => window.matchMedia("(min-width: 1024px)").matches;

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
  const [sheetOpen, setSheetOpen] = useState(false);

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
      if (isDesktop()) setSelectedEnquiry(data.enquiries?.[0] || null);
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
      setSheetOpen(false);
    } catch (err: any) {
      alert("Failed to delete: " + err.message);
    }
  };

  const pendingCount = enquiries.filter((e) => e.status === "pending").length;
  const productEnquiryCount = enquiries.filter((e) => e.enquiryType === "product").length;

  const StatusBadge = ({ status }: { status: Enquiry["status"] }) => (status === "pending"
    ? <span className="a-badge bg-amber-50 text-amber-700"><Clock className="h-3 w-3" /> Pending</span>
    : <span className="a-badge bg-emerald-50 text-emerald-700"><CheckCircle className="h-3 w-3" /> Resolved</span>);

  const open = (enquiry: Enquiry) => {
    setSelectedEnquiry(enquiry);
    if (!isDesktop()) setSheetOpen(true);
  };

  const details = (e: Enquiry) => (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        {e.enquiryType === "product" && <span className="a-badge bg-accent-soft text-accent-dark"><Package className="h-3 w-3" /> Product enquiry</span>}
        <StatusBadge status={e.status} />
      </div>

      {e.enquiryType === "product" && e.productCode && (
        <div className="rounded-xl border border-line bg-paper/60 p-4">
          <p className="a-label">Product</p>
          <p className="font-semibold">{e.productName}</p>
          <p className="mt-0.5 font-mono text-xs text-muted">{e.productCode}</p>
        </div>
      )}

      <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {[
          { icon: User, label: "Name", value: e.name },
          { icon: Mail, label: "Email", value: e.email, href: e.email ? `mailto:${e.email}` : "" },
          { icon: Phone, label: "Mobile", value: e.mobileNo || "—", href: e.mobileNo ? `tel:${e.mobileNo}` : "" },
          { icon: Calendar, label: "Received on", value: formatDateTime(e.createdAt) },
        ].map(({ icon: Icon, label, value, href }) => (
          <div key={label} className="min-w-0">
            <dt className="a-label flex items-center gap-1.5"><Icon className="h-3.5 w-3.5" /> {label}</dt>
            <dd className="break-words font-medium">{href ? <a href={href} className="hover:underline">{value}</a> : value}</dd>
          </div>
        ))}
      </dl>

      <div>
        <p className="a-label">Message</p>
        <p className="whitespace-pre-wrap rounded-xl border border-line bg-paper/60 p-4 text-sm">{e.message}</p>
      </div>
    </div>
  );

  const actions = (e: Enquiry) => (
    <>
      {e.mobileNo && (
        <a href={`https://wa.me/${waNumber(e.mobileNo)}`} target="_blank" rel="noreferrer" className="a-btn bg-[#25D366] text-white hover:bg-[#1ebe5a]">
          <MessageCircle className="h-4 w-4" /> WhatsApp
        </a>
      )}
      {e.status === "pending" && (
        <button onClick={() => handleMarkResolved(e.id)} className="a-btn-primary"><CheckCircle className="h-4 w-4" /> Mark resolved</button>
      )}
      <button onClick={() => handleDelete(e.id)} className="a-btn-outline text-red-600 hover:border-red-600"><Trash2 className="h-4 w-4" /> Delete</button>
    </>
  );

  return (
    <AdminLayout title="Enquiries">
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-3 sm:gap-4">
          <div className="a-card p-4 sm:p-5"><p className="a-label">Total</p><p className="font-display text-2xl font-bold sm:text-3xl">{enquiries.length}</p></div>
          <div className="a-card p-4 sm:p-5"><p className="a-label">Pending</p><p className="font-display text-2xl font-bold text-accent sm:text-3xl">{pendingCount}</p></div>
          <div className="a-card p-4 sm:p-5"><p className="a-label">Product</p><p className="font-display text-2xl font-bold sm:text-3xl">{productEnquiryCount}</p></div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-5 lg:gap-3">
          <label className="relative sm:col-span-2">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input type="text" placeholder="Search name, email, phone, product…" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="a-input pl-10" />
          </label>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)} className="a-select" aria-label="Status">
            <option value="all">All statuses</option>
            <option value="pending">Pending</option>
            <option value="resolved">Resolved</option>
          </select>
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as any)} className="a-select" aria-label="Type">
            <option value="all">All types</option>
            <option value="general">General</option>
            <option value="product">Product</option>
          </select>
          <select value={dateFilter} onChange={(e) => setDateFilter(e.target.value as any)} className="a-select" aria-label="Date">
            <option value="all">All time</option>
            <option value="today">Today</option>
            <option value="week">Last 7 days</option>
            <option value="month">Last 30 days</option>
          </select>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-6">
          {/* List */}
          <div className="a-card overflow-hidden lg:col-span-1">
            <div className="border-b border-line px-4 py-3 text-sm font-semibold">
              {filteredEnquiries.length} {filteredEnquiries.length === 1 ? "enquiry" : "enquiries"}
            </div>
            <div className="divide-y divide-line lg:max-h-[calc(100vh-360px)] lg:overflow-y-auto">
              {loading && <PageLoader className="h-40" />}
              {error && <p className="p-6 text-center text-sm text-red-600">{error}</p>}
              {!loading && !error && filteredEnquiries.length === 0 && <p className="p-8 text-center text-sm text-muted">No enquiries found.</p>}
              {filteredEnquiries.map((enquiry) => {
                const isSelected = selectedEnquiry?.id === enquiry.id;
                return (
                  <button
                    key={enquiry.id}
                    onClick={() => open(enquiry)}
                    className={`block w-full border-l-[3px] p-4 text-left transition ${isSelected ? "border-l-accent bg-paper" : "border-l-transparent hover:bg-paper/60"}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold">{enquiry.name}</p>
                        {enquiry.productCode && <p className="truncate text-xs font-semibold text-accent-dark">{enquiry.productCode} · {enquiry.productName}</p>}
                        <p className="truncate text-sm text-muted">{enquiry.email}</p>
                        <p className="mt-0.5 text-xs text-muted">{formatDate(enquiry.createdAt)}</p>
                      </div>
                      <StatusBadge status={enquiry.status} />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Details (desktop) */}
          <div className="a-card hidden p-6 lg:col-span-2 lg:block">
            {selectedEnquiry ? (
              <>
                <h3 className="mb-5 font-display text-xl font-bold">Enquiry details</h3>
                {details(selectedEnquiry)}
                <div className="mt-6 flex flex-wrap gap-2 border-t border-line pt-5">{actions(selectedEnquiry)}</div>
              </>
            ) : (
              <EmptyState icon={Mail} title="Select an enquiry" text="Pick one from the list to see the full message." />
            )}
          </div>
        </div>
      </div>

      {/* Details (phones & tablets) */}
      {sheetOpen && selectedEnquiry && (
        <Modal title="Enquiry details" onClose={() => setSheetOpen(false)} footer={actions(selectedEnquiry)}>
          {details(selectedEnquiry)}
        </Modal>
      )}
    </AdminLayout>
  );
};

export default EnquiryManagement;
