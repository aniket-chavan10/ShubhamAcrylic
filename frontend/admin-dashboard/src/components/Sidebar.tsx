import { FC, useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { getSiteSettings } from "../services/siteSettingsService";
import { getImageUrl } from "../utils/imageUtils";

const menu = [
  { label: "Dashboard", to: "/" },
  { label: "Product Management", to: "/products" },
  { label: "Category Management", to: "/categories" },
  { label: "Review Management", to: "/reviews" },
  { label: "Enquiry Management", to: "/enquiry-management" },
  { label: "Banner Management", to: "/banners" },
  { label: "Site Settings", to: "/site-settings" },
  { label: "My Profile", to: "/profile" },
];

const Sidebar: FC = () => {
  const location = useLocation();
  const [companyName, setCompanyName] = useState("Astitva Creations");
  const [logoUrl, setLogoUrl] = useState("");

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const data = await getSiteSettings();
        if (data.companyName) setCompanyName(data.companyName);
        if (data.logoUrl) setLogoUrl(getImageUrl(data.logoUrl));
      } catch (err) {
        console.error("Sidebar settings error:", err);
      }
    };
    fetchSettings();
  }, []);

  return (
    <aside className="w-64 min-h-screen sticky left-0 top-0 flex flex-col bg-white/80 backdrop-blur-xl shadow-xl rounded-r-3xl py-8 px-2">
      {/* Branding */}
      <div className="flex items-center gap-3 mb-8 px-4">
        {logoUrl ? (
          <img
            src={logoUrl}
            alt="Logo"
            className="w-10 h-10 rounded-xl object-contain shadow-md border border-gray-100 p-0.5"
          />
        ) : (
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold shadow-lg text-xl shrink-0">
            {companyName.charAt(0)}
          </div>
        )}
        <span className="text-base font-extrabold tracking-wide text-gray-800 uppercase leading-tight line-clamp-2">
          {companyName}
        </span>
      </div>
      {/* Menu */}
      <nav className="flex-1">
        <ul className="space-y-1">
          {menu.map((item) => (
            <li key={item.to}>
              <Link
                to={item.to}
                className={`flex items-center gap-4 px-6 py-3 rounded-xl transition-all duration-150 
                  ${location.pathname === item.to
                    ? "bg-indigo-600 text-white shadow-lg font-semibold scale-105"
                    : "text-gray-700 hover:bg-indigo-100 hover:text-indigo-700"
                  }
                `}
              >
                <span>{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      {/* Footer */}
      <div className="mt-10 px-6">
        <div className="text-xs text-gray-400 text-center opacity-70">© 2026 {companyName}</div>
      </div>
    </aside>
  );
};

export default Sidebar;
