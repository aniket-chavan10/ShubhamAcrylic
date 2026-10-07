import { useState } from "react";
import { Loader2 } from "lucide-react";
import { API_URL } from "../utils/apiUtils";
import BrandLogo from "../components/BrandLogo";
import { useBrand } from "../hooks/useBrand";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { companyName } = useBrand();

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
      className="relative flex min-h-screen items-center justify-center bg-paper px-4 py-10"
      style={{ backgroundImage: 'url("/login-bg.jpg")', backgroundSize: "cover", backgroundPosition: "center" }}
    >
      <div className="absolute inset-0 bg-paper/60 backdrop-blur-sm" />

      <div className="relative z-10 w-full max-w-md rounded-3xl border border-line bg-white p-7 shadow-2xl sm:p-10">
        <div className="mb-8 flex flex-col items-center text-center">
          <BrandLogo className="mb-4 h-20 w-20 rounded-2xl ring-1 ring-line" />
          <h1 className="font-display text-2xl font-extrabold tracking-tight sm:text-3xl">{companyName}</h1>
          <p className="mt-1 text-xs font-semibold uppercase tracking-[0.2em] text-accent-dark">Admin portal</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="a-label">Email address</label>
            <input id="email" type="email" autoComplete="username" className="a-input py-3" value={email} onChange={e => setEmail(e.target.value)} required placeholder="admin@example.com" />
          </div>
          <div>
            <label htmlFor="password" className="a-label">Password</label>
            <input id="password" type="password" autoComplete="current-password" className="a-input py-3" value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••" />
          </div>
          {error && <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-center text-sm font-medium text-red-700">{error}</p>}
          <button type="submit" className="a-btn-primary mt-2 w-full py-3.5 text-base" disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p className="mt-8 text-center text-xs text-muted">© {new Date().getFullYear()} {companyName}. All rights reserved.</p>
      </div>
    </div>
  );
};

export default Login;
