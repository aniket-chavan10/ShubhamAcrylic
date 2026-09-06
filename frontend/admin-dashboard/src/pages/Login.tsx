import { useState, useEffect } from "react";
import { API_URL } from "../utils/apiUtils";
import { getSiteSettings } from "../services/siteSettingsService";
import { getImageUrl } from "../utils/imageUtils";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [companyName, setCompanyName] = useState("Astitva Creations");
  const [logoUrl, setLogoUrl] = useState("");

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const data = await getSiteSettings();
        if (data.companyName) setCompanyName(data.companyName);
        if (data.logoUrl) setLogoUrl(getImageUrl(data.logoUrl));
      } catch (err) {
        console.error("Login settings error:", err);
      }
    };
    fetchSettings();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Login failed");

      sessionStorage.setItem("token", data.token);
      window.location.href = "/";
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center relative bg-slate-100"
      style={{
        backgroundImage: 'url("/login-bg.jpg")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      
      {/* Decorative Overlay to ensure text readability */}
      <div className="absolute inset-0 bg-white/40 backdrop-blur-sm"></div>

      <div className="w-full max-w-md rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.12)] bg-white/90 backdrop-blur-xl border border-white/50 p-10 flex flex-col items-center relative z-10">
        {/* Brand/Logo Accent */}
        <div className="flex flex-col items-center mb-8">
          {logoUrl ? (
            <img
              src={logoUrl}
              alt="Logo"
              className="h-16 w-auto object-contain mb-4 drop-shadow-md"
            />
          ) : (
            <div className="bg-gradient-to-tr from-indigo-600 to-blue-500 w-16 h-16 rounded-2xl flex items-center justify-center text-white font-extrabold text-3xl mb-4 shadow-lg shadow-indigo-500/30 ring-4 ring-white">
              {companyName.charAt(0)}
            </div>
          )}
          <h2 className="text-3xl font-extrabold text-gray-900 mb-1 tracking-tight text-center">{companyName}</h2>
          <div className="text-sm text-indigo-600 font-bold tracking-widest uppercase">Admin Portal</div>
        </div>
        
        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5 w-full">
          <div>
            <label className="block mb-1.5 text-sm font-bold text-gray-700">Email Address</label>
            <input
              type="email"
              autoComplete="username"
              className="w-full px-5 py-3.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500 transition text-sm bg-white text-gray-900 placeholder-gray-400 font-medium"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              placeholder="admin@example.com"
            />
          </div>
          <div>
            <label className="block mb-1.5 text-sm font-bold text-gray-700">Password</label>
            <input
              type="password"
              autoComplete="current-password"
              className="w-full px-5 py-3.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500 transition text-sm bg-white text-gray-900 placeholder-gray-400 font-medium"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              placeholder="••••••••"
            />
          </div>
          {error && (
            <div className="text-red-600 text-center text-sm rounded-lg bg-red-50 border border-red-200 py-3 mt-2 font-medium">
              {error}
            </div>
          )}
          <button
            type="submit"
            className="w-full py-3.5 mt-4 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-xl font-bold text-base hover:from-indigo-700 hover:to-blue-700 transition-all shadow-lg shadow-indigo-200 active:scale-[0.98]"
            disabled={loading}
          >
            {loading ? "Authenticating..." : "Sign In"}
          </button>
        </form>
        
        {/* Footer */}
        <div className="mt-8 text-xs text-gray-400 text-center font-medium">
          © {new Date().getFullYear()} {companyName}. All rights reserved.
        </div>
      </div>
    </div>
  );
};

export default Login;
