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
    <div className="min-h-screen flex items-center justify-center bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-900 via-indigo-950 to-black">
      
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-indigo-600/20 blur-[120px]"></div>
        <div className="absolute top-[60%] -right-[10%] w-[40%] h-[60%] rounded-full bg-blue-600/20 blur-[120px]"></div>
      </div>

      <div className="w-full max-w-md rounded-[2rem] shadow-2xl bg-white/10 backdrop-blur-xl border border-white/20 p-10 flex flex-col items-center relative z-10">
        {/* Brand/Logo Accent */}
        <div className="flex flex-col items-center mb-8">
          <div className="bg-gradient-to-tr from-indigo-500 to-blue-400 w-16 h-16 rounded-2xl flex items-center justify-center text-white font-extrabold text-3xl mb-4 shadow-lg shadow-indigo-500/30 ring-4 ring-white/10">
            A
          </div>
          <h2 className="text-3xl font-extrabold text-white mb-1 tracking-tight">Astitva Creations</h2>
          <div className="text-sm text-indigo-200 font-medium tracking-wide uppercase">Admin Portal</div>
        </div>
        
        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5 w-full">
          <div>
            <label className="block mb-1.5 text-sm font-semibold text-indigo-100">Email Address</label>
            <input
              type="email"
              autoComplete="username"
              className="w-full px-5 py-3.5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 transition text-sm bg-white/5 text-white placeholder-white/30"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              placeholder="admin@astitvacreations.com"
            />
          </div>
          <div>
            <label className="block mb-1.5 text-sm font-semibold text-indigo-100">Password</label>
            <input
              type="password"
              autoComplete="current-password"
              className="w-full px-5 py-3.5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 transition text-sm bg-white/5 text-white placeholder-white/30"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              placeholder="••••••••"
            />
          </div>
          {error && (
            <div className="text-red-300 text-center text-sm rounded-lg bg-red-900/40 border border-red-500/30 py-3 mt-2 font-medium">
              {error}
            </div>
          )}
          <button
            type="submit"
            className="w-full py-3.5 mt-4 bg-gradient-to-r from-indigo-500 to-blue-500 text-white rounded-xl font-bold text-base hover:from-indigo-400 hover:to-blue-400 transition-all shadow-lg shadow-indigo-500/25 active:scale-[0.98]"
            disabled={loading}
          >
            {loading ? "Authenticating..." : "Sign In"}
          </button>
        </form>
        
        {/* Footer */}
        <div className="mt-8 text-xs text-indigo-200/60 text-center font-medium">
          © {new Date().getFullYear()} Astitva Creations. All rights reserved.
        </div>
      </div>
    </div>
  );
};

export default Login;
