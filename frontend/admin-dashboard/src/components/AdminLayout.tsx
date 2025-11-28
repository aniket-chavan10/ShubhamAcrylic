import { FC, ReactNode } from "react";
import Sidebar from "./Sidebar";

const AdminLayout: FC<{ children: ReactNode }> = ({ children }) => {
  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/login";
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        {/* Simple Header - No search, about, or contact */}
        <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10 px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-800">Admin Dashboard</h1>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition font-semibold"
            >
              Logout
            </button>
          </div>
        </header>
        <main className="flex-1 p-8">{children}</main>
      </div>
    </div>
  );
};

export default AdminLayout;
