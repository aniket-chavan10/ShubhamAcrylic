import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ManageProducts from './pages/ManageProducts';
import EnquiryManagement from './pages/EnquiryManagement';
import ManageBanners from './pages/ManageBanners';
import ReviewManagement from './pages/ReviewManagement';
import CategoryManagement from './pages/CategoryManagement';
import SiteSettings from './pages/SiteSettings';
import ProfilePage from './pages/ProfilePage';

function App() {
        return (
                <BrowserRouter>
                        <Routes>
                                <Route path="/login" element={<Login />} />
                                <Route path="/" element={<Dashboard />} />
                                <Route path="/products" element={<ManageProducts />} />
                                <Route path="/categories" element={<CategoryManagement />} />
                                <Route path="/enquiry-management" element={<EnquiryManagement />} />
                                <Route path="/banners" element={<ManageBanners />} />
                                <Route path="/reviews" element={<ReviewManagement />} />
                                <Route path="/site-settings" element={<SiteSettings />} />
                                <Route path="/profile" element={<ProfilePage />} />
                        </Routes>
                </BrowserRouter>
        );
}

export default App;
