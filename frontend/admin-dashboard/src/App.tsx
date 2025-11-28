import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ManageProducts from './pages/ManageProducts';
import EnquiryManagement from './pages/EnquiryManagement';
import ManageBanners from './pages/ManageBanners';
import ReviewManagement from './pages/ReviewManagement';

function App() {
        return (
                <BrowserRouter>
                        <Routes>
                                <Route path="/login" element={<Login />} />
                                <Route path="/" element={<Dashboard />} />
                                <Route path="/products" element={<ManageProducts />} />
                                <Route path="/enquiry-management" element={<EnquiryManagement />} />
                                <Route path="/banners" element={<ManageBanners />} />
                                <Route path="/reviews" element={<ReviewManagement />} />
                        </Routes>
                </BrowserRouter>
        );
}

export default App;
