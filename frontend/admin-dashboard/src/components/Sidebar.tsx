import { FC, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import BrandLogo from "./BrandLogo";
import {
  FolderTree, Image, LayoutDashboard, LucideIcon, Mail, Package, Receipt, Settings, Shirt, ShoppingBag, Star, User, X,
} from "lucide-react";

interface MenuItem { label: string; to: string; icon: LucideIcon; match?: string }

const groups: { title: string; items: MenuItem[] }[] = [
  {
    title: "Overview",
    items: [{ label: "Dashboard", to: "/", icon: LayoutDashboard }],
  },
  {
    title: "Sales",
    items: [
      { label: "Website Orders", to: "/orders", icon: ShoppingBag },
      { label: "Invoices", to: "/invoices", icon: Receipt },
      { label: "Enquiries", to: "/enquiry-management", icon: Mail },
    ],
  },
  {
    title: "Catalogue",
    items: [
      { label: "Design Studio Pricing", to: "/garments", icon: Shirt },
      { label: "Products", to: "/products", icon: Package },
      { label: "Categories", to: "/categories", icon: FolderTree },
      { label: "Reviews", to: "/reviews", icon: Star },
      { label: "Banners", to: "/banners", icon: Image },
    ],
  },
  {
    title: "Account",
    items: [
      { label: "Site Settings", to: "/site-settings", icon: Settings },
      { label: "My Profile", to: "/profile", icon: User },
    ],
  },
];

interface SidebarProps {
  companyName: string;
  open: boolean;
  onClose: () => void;
}

const Sidebar: FC<SidebarProps> = ({ companyName, open, onClose }) => {
  const { pathname } = useLocation();
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = prev; window.removeEventListener("keydown", onKey); };
  }, [open, onClose]);

  const isActive = (to: string) => (to === "/" ? pathname === "/" : pathname === to || pathname.startsWith(`${to}/`));

  return (
    <>
      {open && <div className="fixed inset-0 z-40 bg-ink/50 backdrop-blur-sm lg:hidden" onClick={onClose} />}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex max-w-[85vw] flex-col bg-ink text-white transition-transform duration-300 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}
        style={{ width: 272 }}
      >
        <div className="flex items-center justify-between gap-3 px-5 py-6">
          <Link to="/" className="flex min-w-0 items-center gap-3" onClick={onClose}>
            <BrandLogo className="h-10 w-10 rounded-xl p-0.5" />
            <span className="min-w-0">
              <span className="block truncate font-display text-[15px] font-extrabold uppercase tracking-tight">{companyName}</span>
              <span className="block text-[11px] text-white/40">Admin dashboard</span>
            </span>
          </Link>
          <button onClick={onClose} className="rounded-lg p-1.5 text-white/60 hover:bg-white/10 lg:hidden" aria-label="Close menu">
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-6 overflow-y-auto px-3 pb-6">
          {groups.map(group => (
            <div key={group.title}>
              <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/30">{group.title}</p>
              <ul className="space-y-0.5">
                {group.items.map(({ label, to, icon: Icon }) => {
                  const active = isActive(to);
                  return (
                    <li key={to}>
                      <Link
                        to={to}
                        onClick={onClose}
                        className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${active ? "bg-white text-ink" : "text-white/65 hover:bg-white/[0.07] hover:text-white"}`}
                      >
                        <Icon className={`h-[18px] w-[18px] ${active ? "text-accent" : ""}`} />
                        {label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className="border-t border-white/10 px-5 py-4 text-[11px] text-white/30">© {new Date().getFullYear()} {companyName}</div>
      </aside>
    </>
  );
};

export default Sidebar;
