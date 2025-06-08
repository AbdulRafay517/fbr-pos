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
    </div>
  );
}