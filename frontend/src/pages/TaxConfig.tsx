import { useEffect, useState } from "react";
import axios from "../api/axios";
import { useAuth } from "../context/AuthContext";

type TaxRule = {
  id: string;
  province: string;
  percentage: number;
  isActive: boolean;
};

export default function TaxConfig() {
  const { user } = useAuth();
  const [taxes, setTaxes] = useState<TaxRule[]>([]);
  const [province, setProvince] = useState("");
  const [percentage, setPercentage] = useState<number>(0);
  const [isActive, setIsActive] = useState(true);
  const [editing, setEditing] = useState<TaxRule | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  // Check if user can perform CRUD operations (not VIEWER)
  const canModify = user?.role !== 'VIEWER';

  const fetchTaxes = () => {
    setLoading(true);
    axios.get("/taxes").then(res => {
      setTaxes(res.data);
      setLoading(false);
    }).catch(err => {
      console.error("Failed to fetch taxes:", err);
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchTaxes();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canModify) return;
    
    setError("");
    try {
      if (editing) {
        await axios.put(`/taxes/${editing.id}`, { province, percentage, isActive });
      } else {
        await axios.post("/taxes", { province, percentage, isActive });
      }
      setProvince("");
      setPercentage(0);
      setIsActive(true);
      setEditing(null);
      fetchTaxes();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to save tax rule");
    }
  };

  const handleEdit = (tax: TaxRule) => {
    if (!canModify) return;
    setEditing(tax);
    setProvince(tax.province);
    setPercentage(tax.percentage);
    setIsActive(tax.isActive);
  };

  const handleDelete = async (id: string) => {
    if (!canModify) return;
    if (!window.confirm("Delete this tax rule?")) return;
    try {
      await axios.delete(`/taxes/${id}`);
      fetchTaxes();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to delete tax rule");
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Tax Configuration</h1>
        <div className="flex items-center space-x-2">
          <button className="p-2 text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Add/Edit Form - Only show for users who can modify */}
      {canModify && (
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="p-6">
            <h2 className="text-black text-lg font-semibold mb-4">{editing ? "Edit Tax Rule" : "Add Tax Rule"}</h2>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Province/Region</label>
                <input
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={province}
                  onChange={e => setProvince(e.target.value)}
                  placeholder="e.g., Federal, Punjab, Sindh"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tax Rate (%)</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  step={0.01}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={percentage}
                  onChange={e => setPercentage(Number(e.target.value))}
                  placeholder="10.00"
                  required
                />
              </div>
              <div className="flex items-center">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={e => setIsActive(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Active</span>
                </label>
              </div>
              <div className="flex space-x-2">
                <button
                  type="submit"
                  className="bg-blue-600 text-black px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {editing ? "Update" : "Add Tax Rule"}
                </button>
                {editing && (
                  <button
                    type="button"
                    className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
                    onClick={() => {
                      setEditing(null);
                      setProvince("");
                      setPercentage(0);
                      setIsActive(true);
                    }}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
            {error && (
              <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                {error}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tax Rules Table */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Configured Tax Rules</h2>
        </div>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-6 text-center text-gray-500">Loading tax rules...</div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Province/Region</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tax Rate</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {taxes.map(tax => (
                  <tr key={tax.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {tax.province}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {tax.percentage}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        tax.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {tax.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      {canModify ? (
                        <>
                          <button
                            className="text-blue-600 hover:text-blue-900"
                            onClick={() => handleEdit(tax)}
                          >
                            Edit
                          </button>
                          <button
                            className="text-red-600 hover:text-red-900"
                            onClick={() => handleDelete(tax.id)}
                          >
                            Delete
                          </button>
                        </>
                      ) : (
                        <span className="text-gray-500 text-sm">View Only</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          
          {!loading && taxes.length === 0 && (
            <div className="p-6 text-center text-gray-500">
              No tax rules configured. Add your first tax rule above.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}