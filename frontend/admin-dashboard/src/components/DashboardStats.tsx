import { useEffect, useState } from "react";
import { fetchProductStats } from "../services/productService";



const DashboardStats = () => {
  const [productTotal, setProductTotal] = useState<number | null>(null);
  const [error, setError] = useState<string>("");


useEffect(() => {
  fetchProductStats()
    .then(data => {
      console.log("Product stats received:", data); // Log the data
      setProductTotal(data.total);
    })
    .catch(err => {
      console.error("Error fetching product stats:", err); // Log the error
      setError(err.message);
    });
}, []);


  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
      <div className="bg-white rounded-2xl shadow-lg p-6 flex flex-col items-start">
        <div className="text-gray-400 mb-1 text-sm">Total Products</div>
        <div className="text-3xl font-bold text-blue-600">
          {error ? (
            <span className="text-red-500 text-base">Error</span>
          ) : productTotal === null ? (
            <span className="text-gray-400">...</span>
          ) : (
            productTotal
          )}
        </div>
      </div>
      <div className="bg-white rounded-2xl shadow-lg p-6 flex flex-col items-start">
        <div className="text-gray-400 mb-1 text-sm">Total Reviews</div>
        <div className="text-3xl font-bold text-blue-600">1,546</div>
      </div>
      <div className="bg-white rounded-2xl shadow-lg p-6 flex flex-col items-start">
        <div className="text-gray-400 mb-1 text-sm">Avg. Rating</div>
        <div className="text-3xl font-bold text-blue-600">4.8</div>
      </div>
    </div>
  );
};

export default DashboardStats;
