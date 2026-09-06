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
import ProtectedRoute from './components/ProtectedRoute';

function App() {
        return (
                <BrowserRouter>
                        <Routes>
                                <Route path="/login" element={<Login />} />
                                <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                                <Route path="/products" element={<ProtectedRoute><ManageProducts /></ProtectedRoute>} />
                                <Route path="/categories" element={<ProtectedRoute><CategoryManagement /></ProtectedRoute>} />
                                <Route path="/enquiry-management" element={<ProtectedRoute><EnquiryManagement /></ProtectedRoute>} />
                                <Route path="/banners" element={<ProtectedRoute><ManageBanners /></ProtectedRoute>} />
                                <Route path="/reviews" element={<ProtectedRoute><ReviewManagement /></ProtectedRoute>} />
                                <Route path="/site-settings" element={<ProtectedRoute><SiteSettings /></ProtectedRoute>} />
                                <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
                        </Routes>
                </BrowserRouter>
        );
}

export default App;
