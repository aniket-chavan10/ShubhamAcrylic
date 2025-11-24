import { FC, ReactNode } from "react";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

const AdminLayout: FC<{ children: ReactNode }> = ({ children }) => (
  <div className="flex min-h-screen bg-gray-50">
    <Sidebar />
    <div className="flex-1 flex flex-col">
      <Navbar />
      <main className="flex-1 p-8">{children}</main>
    </div>
  </div>
);

export default AdminLayout;
