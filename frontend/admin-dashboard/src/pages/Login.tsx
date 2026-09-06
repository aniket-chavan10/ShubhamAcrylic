import { useState } from "react";
import { API_URL } from "../utils/apiUtils";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 via-white to-blue-200">
      <div className="w-full max-w-md rounded-3xl shadow-2xl bg-white p-9 flex flex-col items-center">
        {/* Brand/Logo Accent */}
        <div className="flex flex-col items-center mb-7">
          <div className="bg-blue-600 w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-2xl mb-2 shadow">
            A
          </div>
          <h2 className="text-3xl font-bold text-blue-800 mb-0 tracking-tight">Admin Login</h2>
          <div className="text-sm text-gray-400 mt-1">Sign in to your dashboard</div>
        </div>
        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6 w-full">
          <div>
            <label className="block mb-2 font-semibold text-gray-700">Email</label>
            <input
              type="email"
              autoComplete="username"
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 transition text-sm bg-gray-50"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              placeholder="you@email.com"
            />
          </div>
          <div>
            <label className="block mb-2 font-semibold text-gray-700">Password</label>
            <input
              type="password"
              autoComplete="current-password"
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 transition text-sm bg-gray-50"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              placeholder="••••••••"
            />
          </div>
          {error && (
            <div className="text-red-500 text-center rounded bg-red-50 py-2 mt-1">{error}</div>
          )}
          <button
            type="submit"
            className="w-full py-2 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition shadow"
            disabled={loading}
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
        {/* Optional: Footer */}
        <div className="mt-6 text-xs text-gray-400 text-center opacity-70">© 2025 Acrylia Admin Panel</div>
      </div>
    </div>
  );
};

export default Login;
