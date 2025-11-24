// pages/Dashboard.tsx
import AdminLayout from "../components/AdminLayout";
import DashboardStats from "../components/DashboardStats";
import DashboardCharts from "../components/DashboardCharts";


const Dashboard = () => (
  
  <AdminLayout>
    <div className="flex items-center gap-3 mb-8">
      <span className="inline-block w-1 h-8 rounded-full bg-blue-600"></span>
      <h2 className="text-3xl font-bold text-blue-900 tracking-tight">Dashboard</h2>
    </div>
    <DashboardStats />
    <DashboardCharts />
    {/* Add more dashboard sections or tables here if desired */}
  </AdminLayout >
);

export default Dashboard;
