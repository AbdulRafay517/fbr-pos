import { useEffect, useState } from "react";
import axios from "../api/axios";

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
};

export default function Users() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("EMPLOYEE");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);

  // Session configuration state
  const [sessionConfig, setSessionConfig] = useState(() => {
    const stored = localStorage.getItem("sessionConfig");
    const defaultConfig = {
      timeoutMinutes: 30,
      warningMinutes: 5,
      logoutOnTabClose: false,
    };
    return stored ? { ...defaultConfig, ...JSON.parse(stored) } : defaultConfig;
  });

  const fetchUsers = () => {
    setLoading(true);
    axios.get("/users").then(res => {
      setUsers(res.data);
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleAddOrEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      if (editing) {
        await axios.put(`/users/${editing.id}`, {
          name,
          email,
          role,
          password: password || undefined, // Only send password if changed
        });
      } else {
        await axios.post("/users", { name, email, role, password });
      }
      setName("");
      setEmail("");
      setRole("EMPLOYEE");
      setPassword("");
      setEditing(null);
      fetchUsers();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to save user");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (user: User) => {
    setEditing(user);
    setName(user.name);
    setEmail(user.email);
    setRole(user.role);
    setPassword("");
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this user?")) return;
    try {
      await axios.delete(`/users/${id}`);
      fetchUsers();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to delete user");
    }
  };

  const handleCancelEdit = () => {
    setEditing(null);
    setName("");
    setEmail("");
    setRole("EMPLOYEE");
    setPassword("");
  };

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Users & Employees</h1>
      <form onSubmit={handleAddOrEditUser} className="mb-6 bg-white p-4 rounded shadow flex flex-wrap gap-4 items-end">
        <div>
          <label className="block mb-1 font-medium">Name</label>
          <input
            className="border px-2 py-1 rounded"
            value={name}
            onChange={e => setName(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block mb-1 font-medium">Email</label>
          <input
            type="email"
            className="border px-2 py-1 rounded"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            disabled={!!editing}
          />
        </div>
        <div>
          <label className="block mb-1 font-medium">Role</label>
          <select
            className="border px-2 py-1 rounded"
            value={role}
            onChange={e => setRole(e.target.value)}
          >
            <option value="ADMIN">Admin</option>
            <option value="EMPLOYEE">Employee</option>
            <option value="VIEWER">Viewer</option>
          </select>
        </div>
        <div>
          <label className="block mb-1 font-medium">
            {editing ? "New Password" : "Password"}
          </label>
          <input
            type="password"
            className="border px-2 py-1 rounded"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required={!editing}
            placeholder={editing ? "Leave blank to keep current" : ""}
          />
        </div>
        <button
          type="submit"
          className="bg-blue-600 text-black px-4 py-2 rounded hover:bg-blue-700"
          disabled={submitting}
        >
          {submitting ? (editing ? "Saving..." : "Adding...") : (editing ? "Save" : "Add User")}
        </button>
        {editing && (
          <button
            type="button"
            className="bg-gray-300 px-4 py-2 rounded"
            onClick={handleCancelEdit}
          >
            Cancel
          </button>
        )}
        {error && <div className="text-red-600 ml-4">{error}</div>}
      </form>
      <table className="w-full border">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2 text-left">Name</th>
            <th className="p-2 text-left">Email</th>
            <th className="p-2 text-left">Role</th>
            <th className="p-2 text-left">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map(user => (
            <tr key={user.id} className="border-t">
              <td className="p-2">{user.name}</td>
              <td className="p-2">{user.email}</td>
              <td className="p-2">{user.role}</td>
              <td className="p-2">
                <button
                  className="text-blue-600 hover:underline mr-2"
                  onClick={() => handleEdit(user)}
                >
                  Edit
                </button>
                <button
                  className="text-red-600 hover:underline"
                  onClick={() => handleDelete(user.id)}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Session Configuration Section */}
      <div className="mt-8 bg-white p-6 rounded shadow">
        <h2 className="text-xl font-bold mb-4">Session Configuration</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block mb-2 font-medium">Session Timeout (minutes)</label>
            <input
              type="number"
              min="5"
              max="480"
              className="border px-3 py-2 rounded w-full"
              value={(() => {
                const stored = localStorage.getItem("sessionConfig");
                const config = stored ? JSON.parse(stored) : { timeoutMinutes: 30 };
                return config.timeoutMinutes;
              })()}
              onChange={(e) => {
                const stored = localStorage.getItem("sessionConfig");
                const currentConfig = stored ? JSON.parse(stored) : { timeoutMinutes: 30, warningMinutes: 5, logoutOnTabClose: false };
                const newConfig = { ...currentConfig, timeoutMinutes: parseInt(e.target.value) };
                localStorage.setItem("sessionConfig", JSON.stringify(newConfig));
              }}
            />
            <p className="text-sm text-gray-600 mt-1">Time before automatic logout due to inactivity</p>
          </div>
          
          <div>
            <label className="block mb-2 font-medium">Warning Time (minutes)</label>
            <input
              type="number"
              min="1"
              max="30"
              className="border px-3 py-2 rounded w-full"
              value={(() => {
                const stored = localStorage.getItem("sessionConfig");
                const config = stored ? JSON.parse(stored) : { warningMinutes: 5 };
                return config.warningMinutes;
              })()}
              onChange={(e) => {
                const stored = localStorage.getItem("sessionConfig");
                const currentConfig = stored ? JSON.parse(stored) : { timeoutMinutes: 30, warningMinutes: 5, logoutOnTabClose: false };
                const newConfig = { ...currentConfig, warningMinutes: parseInt(e.target.value) };
                localStorage.setItem("sessionConfig", JSON.stringify(newConfig));
              }}
            />
            <p className="text-sm text-gray-600 mt-1">Time before timeout to show warning</p>
          </div>
          
          <div>
            <label className="block mb-2 font-medium">Logout on Tab Close</label>
            <div className="flex items-center space-x-2 mt-2">
              <input
                type="checkbox"
                id="logoutOnTabClose"
                className="rounded"
                checked={(() => {
                  const stored = localStorage.getItem("sessionConfig");
                  const config = stored ? JSON.parse(stored) : { logoutOnTabClose: false };
                  return config.logoutOnTabClose;
                })()}
                onChange={(e) => {
                  const stored = localStorage.getItem("sessionConfig");
                  const currentConfig = stored ? JSON.parse(stored) : { timeoutMinutes: 30, warningMinutes: 5, logoutOnTabClose: false };
                  const newConfig = { ...currentConfig, logoutOnTabClose: e.target.checked };
                  localStorage.setItem("sessionConfig", JSON.stringify(newConfig));
                }}
              />
              <label htmlFor="logoutOnTabClose" className="text-sm">
                Automatically logout when browser tab is closed
              </label>
            </div>
            <p className="text-sm text-gray-600 mt-1">Forces re-authentication on new sessions</p>
          </div>
        </div>
        
        <div className="mt-4 p-4 bg-blue-50 rounded">
          <h3 className="font-medium text-blue-900 mb-2">Current Session Status</h3>
          <div className="text-sm text-blue-800">
            <p>Session timeout: {(() => {
              const stored = localStorage.getItem("sessionConfig");
              const config = stored ? JSON.parse(stored) : { timeoutMinutes: 30 };
              return config.timeoutMinutes;
            })()} minutes</p>
            <p>Warning appears: {(() => {
              const stored = localStorage.getItem("sessionConfig");
              const config = stored ? JSON.parse(stored) : { warningMinutes: 5 };
              return config.warningMinutes;
            })()} minutes before timeout</p>
            <p>Logout on tab close: {(() => {
              const stored = localStorage.getItem("sessionConfig");
              const config = stored ? JSON.parse(stored) : { logoutOnTabClose: false };
              return config.logoutOnTabClose ? "Enabled" : "Disabled";
            })()}</p>
          </div>
        </div>
      </div>
    </div>
  );
}