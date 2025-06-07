import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import axios from "../api/axios";

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await axios.post("/auth/login", { email, password });
      login(res.data.access_token, res.data.user);
      navigate("/");
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
        err.message ||
        "Login failed"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950">
      <form
        onSubmit={handleSubmit}
        className="bg-gray-900 rounded-2xl shadow-xl p-8 max-w-sm w-full"
      >
        <div className="text-center mb-6">
          <div className="text-3xl font-bold mb-2">FBR POS</div>
          <div className="text-gray-400">Sign in to your account</div>
        </div>
        {error && <div className="mb-4 text-red-400">{error}</div>}
        <div className="mb-4">
          <input
            type="email"
            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-white"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            autoFocus
          />
        </div>
        <div className="mb-6">
          <input
            type="password"
            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-white"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
        </div>
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded-xl hover:bg-blue-700 transition"
          disabled={loading}
        >
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>
    </div>
  );
}