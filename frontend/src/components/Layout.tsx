import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const navItems = [
  { label: "Dashboard", path: "/" },
  { label: "Invoices", path: "/invoices" },
  { label: "Clients", path: "/clients" },
  { label: "Users", path: "/users", adminOnly: true },
  { label: "Tax Config", path: "/taxes", adminOnly: true },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { user, logout } = useAuth();

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-gray-900">FBR POS</h1>
        </div>
        <nav className="flex-1 px-4 space-y-2">
          {navItems
            .filter(item => !item.adminOnly || user?.role === "ADMIN")
            .map(item => (
              <Link
                key={item.path}
                to={item.path}
                className={`block px-4 py-3 rounded-lg text-sm font-medium transition-colors
                  ${location.pathname === item.path 
                    ? "bg-blue-50 text-blue-700 border-r-2 border-blue-700" 
                    : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"}`}
              >
                {item.label}
              </Link>
            ))}
        </nav>
        <div className="p-4 border-t border-gray-200">
          <div className="mb-2 text-sm text-gray-600">{user?.email}</div>
          <button
            onClick={logout}
            className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            Logout
          </button>
        </div>
      </aside>
      
      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}