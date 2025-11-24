// components/DashboardCharts.tsx
import { FC } from "react";

// Static mock data for category distribution
const categoryStats = [
  { category: "Wardrobe", count: 58, color: "bg-blue-400" },
  { category: "Accessories", count: 31, color: "bg-green-400" },
  { category: "Shelves", count: 25, color: "bg-purple-400" },
];

const DashboardCharts: FC = () => (
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <h2 className="text-lg font-semibold mb-4 text-gray-600">Products By Category</h2>
      <ul>
        {categoryStats.map((cat) => (
          <li key={cat.category} className="flex items-center justify-between mb-4 last:mb-0">
            <div className="flex items-center gap-3">
              <span className={`w-4 h-4 ${cat.color} rounded-full inline-block`} />
              <span className="text-gray-700 font-semibold">{cat.category}</span>
            </div>
            <span className="font-bold text-gray-800">{cat.count}</span>
          </li>
        ))}
      </ul>
    </div>
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <h2 className="text-lg font-semibold mb-4 text-gray-600">Review Sentiment</h2>
      <div className="flex flex-col  py-6">
        <div className="flex  gap-4">
          <span className="w-6 h-6 bg-green-400 rounded-full" />
          <span className="text-gray-700">Positive</span>
          <span className="font-bold text-green-700 ml-1">1436</span>
        </div>
        <div className="flex items-center gap-4 mt-3">
          <span className="w-6 h-6 bg-red-400 rounded-full" />
          <span className="text-gray-700">Negative</span>
          <span className="font-bold text-red-700 ml-1">110</span>
        </div>
      </div>
    </div>
  </div>
);

export default DashboardCharts;
