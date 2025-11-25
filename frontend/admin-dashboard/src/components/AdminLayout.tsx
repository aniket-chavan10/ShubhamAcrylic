import { FC, ReactNode, useEffect, useState } from "react";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import { fetchPendingEnquiryCount } from "../services/enquiryService";

const AdminLayout: FC<{ children: ReactNode }> = ({ children }) => {
  const [pendingCount, setPendingCount] = useState<number>(0);

  useEffect(() => {
    const loadPendingCount = async () => {
      try {
        const data = await fetchPendingEnquiryCount();
        setPendingCount(data.pendingCount || 0);
      } catch (err) {
        console.error("Failed to fetch pending enquiry count:", err);
      }
    };

    loadPendingCount();

    // Optionally, refresh count every X seconds/minutes
    // const interval = setInterval(loadPendingCount, 60000);
    // return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Navbar pendingCount={pendingCount} />
        <main className="flex-1 p-8">{children}</main>
      </div>
    </div>
  );
};

export default AdminLayout;
