import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";

export default function Dashboard() {
  const { user, logout } = useAuth();

  

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <Link
  to="/invoices"
  className="mt-4 inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
>
  Go to Invoices
</Link>
<Link
  to="/clients"
  className="mt-4 inline-block bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
>
  View Clients
</Link>
{user?.role === "ADMIN" && (
    <Link
      to="/taxes"
      className="mt-4 inline-block bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
    >
      Tax Configuration
    </Link>
  )}
{user?.role === "ADMIN" && (
  <Link
    to="/users"
    className="mt-4 inline-block bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
  >
    Users Management
  </Link>
)}
      <div className="bg-white p-8 rounded shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold mb-4">Welcome, {user?.name}!</h1>
        <p className="mb-4">Role: <span className="font-mono">{user?.role}</span></p>
        <button
          onClick={logout}
          className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
        >
          Logout
        </button>
      </div>
    </div>
  );
}