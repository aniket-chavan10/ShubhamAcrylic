import { FC, ReactNode, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, ExternalLink, LogOut, Menu, Settings, User } from "lucide-react";
import Sidebar from "./Sidebar";
import { getSiteSettings } from "../services/siteSettingsService";
import { getImageUrl } from "../utils/imageUtils";
import { fetchWithAuth } from "../utils/apiUtils";

const PUBLIC_SITE_URL = import.meta.env.VITE_PUBLIC_SITE_URL || "https://astitvacreations.shop";

const AdminLayout: FC<{ children: ReactNode; title?: string; actions?: ReactNode }> = ({ children, title, actions }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [companyName, setCompanyName] = useState("Astitva Creations");
  const [logoUrl, setLogoUrl] = useState("");
  const [me, setMe] = useState<{ username?: string; email?: string }>({});
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleLogout = () => {
    sessionStorage.removeItem("token");
    window.location.href = "/login";
  };

  // Inactivity Auto-Logout Timer (15 minutes threshold)
  useEffect(() => {
    const INACTIVITY_TIMEOUT = 15 * 60 * 1000;
    let timeoutId: ReturnType<typeof setTimeout>;

    const resetTimer = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        alert("Your admin session has expired due to 15 minutes of inactivity. Please log in again.");
        sessionStorage.removeItem("token");
        window.location.href = "/login?reason=inactivity";
      }, INACTIVITY_TIMEOUT);
    };

    const events = ["mousemove", "keydown", "click", "scroll", "touchstart"];
    events.forEach(event => window.addEventListener(event, resetTimer));
    resetTimer();

    return () => {
      clearTimeout(timeoutId);
      events.forEach(event => window.removeEventListener(event, resetTimer));
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) setIsDropdownOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    getSiteSettings()
      .then(data => {
        if (data.companyName) setCompanyName(data.companyName);
        if (data.logoUrl) setLogoUrl(getImageUrl(data.logoUrl));
      })
      .catch(err => console.error("AdminLayout settings error:", err));
    fetchWithAuth("/auth/me")
      .then(r => (r.ok ? r.json() : {}))
      .then(setMe)
      .catch(() => undefined);
  }, []);

  const initial = (me.username || "A").charAt(0).toUpperCase();

  return (
    <div className="flex min-h-screen bg-paper">
      <Sidebar companyName={companyName} logoUrl={logoUrl} open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="no-print sticky top-0 z-30 border-b border-line bg-paper/85 px-4 py-3 backdrop-blur-md sm:px-8">
          <div className="flex items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <button onClick={() => setSidebarOpen(true)} className="rounded-lg p-2 hover:bg-ink/5 lg:hidden" aria-label="Open menu">
                <Menu className="h-5 w-5" />
              </button>
              <h1 className="truncate font-display text-lg font-bold tracking-tight sm:text-xl">{title || `${companyName} Admin`}</h1>
            </div>

            <div className="flex items-center gap-2">
              {actions}
              <a href={PUBLIC_SITE_URL} target="_blank" rel="noreferrer" className="hidden items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium text-muted hover:bg-ink/5 hover:text-ink md:inline-flex">
                View site <ExternalLink className="h-3.5 w-3.5" />
              </a>
              <div className="relative" ref={dropdownRef}>
                <button onClick={() => setIsDropdownOpen(!isDropdownOpen)} className="flex items-center gap-1.5 rounded-full p-0.5 pr-2 hover:bg-ink/5">
                  <span className="grid h-9 w-9 place-items-center rounded-full bg-ink font-semibold text-white">{initial}</span>
                  <ChevronDown className={`h-4 w-4 text-muted transition-transform ${isDropdownOpen ? "rotate-180" : ""}`} />
                </button>

                {isDropdownOpen && (
                  <div className="absolute right-0 z-50 mt-2 w-60 rounded-2xl border border-line bg-white py-2 shadow-xl">
                    <div className="border-b border-line px-4 py-3">
                      <p className="text-sm font-semibold">{me.username || "Admin"}</p>
                      <p className="truncate text-xs text-muted">{me.email || ""}</p>
                    </div>
                    <Link to="/profile" className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-paper" onClick={() => setIsDropdownOpen(false)}>
                      <User className="h-4 w-4 text-muted" /> My profile
                    </Link>
                    <Link to="/site-settings" className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-paper" onClick={() => setIsDropdownOpen(false)}>
                      <Settings className="h-4 w-4 text-muted" /> Site settings
                    </Link>
                    <div className="my-1 border-t border-line" />
                    <button onClick={handleLogout} className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm font-medium text-red-600 hover:bg-red-50">
                      <LogOut className="h-4 w-4" /> Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>
        <main className="flex-1 p-4 sm:p-8">{children}</main>
      </div>
    </div>
  );
};

export default AdminLayout;
