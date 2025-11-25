import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ManageProducts from './pages/ManageProducts';
// import ManageReviews from './pages/ManageReviews';
import EnquiryManagement from "./pages/EnquiryManagement";

function App() {
  // Use AuthContext/provider for guarding routes
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Dashboard />} />
         <Route path="/products" element={<ManageProducts />} />
        {/* <Route path="/products" element={<ManageProducts />} />
        <Route path="/reviews" element={<ManageReviews />} /> */}
         <Route path="/enquiry-management" element={<EnquiryManagement />} />
        {/* Add more pages/routes as needed */}
      </Routes>
    </BrowserRouter>
  );
}
export default App;
