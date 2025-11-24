import { FC } from "react";
import { Link, useLocation } from "react-router-dom";
// import { FiGrid, FiBox, FiStar, FiFileText, FiTruck, FiBarChart2 } from "react-icons/fi";

const menu = [
  // { label: "Dashboard", to: "/", icon: <FiGrid /> },
  // { label: "Product Management", to: "/products", icon: <FiBox /> },
  // { label: "Review Management", to: "/reviews", icon: <FiStar /> },
  // { label: "Content Management", to: "/content", icon: <FiFileText /> },
  // { label: "Order Tracking", to: "/orders", icon: <FiTruck /> },
  // { label: "Analytics", to: "/analytics", icon: <FiBarChart2 /> },
  { label: "Dashboard", to: "/" },
  { label: "Product Management", to: "/products" },
  { label: "Review Management", to: "/reviews" },
  { label: "Content Management", to: "/content" },
  { label: "Order Tracking", to: "/orders" },
  { label: "Analytics", to: "/analytics" },
];

const Sidebar: FC = () => {
  const location = useLocation();
  return (
    <aside className="w-64 min-h-screen sticky left-0 top-0 flex flex-col bg-white/80 backdrop-blur-xl shadow-xl rounded-r-3xl py-8 px-2">
      {/* Branding */}
      <div className="flex items-center gap-2 mb-8 px-6">
        <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold shadow-lg text-2xl">
          A
        </div>
        <span className="text-2xl font-extrabold tracking-wide text-gray-800">ACRYLIA</span>
      </div>
      {/* Menu */}
      <nav className="flex-1">
        <ul className="space-y-1">
          {menu.map((item) => (
            <li key={item.to}>
              <Link
                to={item.to}
                className={`flex items-center gap-4 px-6 py-3 rounded-xl transition-all duration-150 
                  ${
                    location.pathname === item.to
                      ? "bg-blue-500/90 text-white shadow-lg font-semibold scale-105"
                      : "text-gray-700 hover:bg-blue-100 hover:text-blue-700"
                  }
                `}
              >
                {/* <span className="text-xl">{item.icon}</span> */}
                <span>{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      {/* Footer */}
      <div className="mt-10 px-6">
        <div className="text-xs text-gray-400 text-center opacity-70">© 2025 Acrylia</div>
      </div>
    </aside>
  );
};

export default Sidebar;
