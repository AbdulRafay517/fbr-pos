import { useEffect, useState } from "react";
import axios from "../api/axios";

type TaxRule = {
  id: string;
  province: string;
  percentage: number;
  isActive: boolean;
  name?: string;
};

export default function TaxConfig() {
  const [taxes, setTaxes] = useState<TaxRule[]>([]);
  const [province, setProvince] = useState("");
  const [percentage, setPercentage] = useState<number>(0);
  const [taxName, setTaxName] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [editing, setEditing] = useState<TaxRule | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchTaxes = () => {
    setLoading(true);
    axios.get("/taxes").then(res => {
      setTaxes(res.data);
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchTaxes();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      if (editing) {
        await axios.put(`/taxes/${editing.id}`, { province, percentage, name: taxName, isActive });
      } else {
        await axios.post("/taxes", { province, percentage, name: taxName, isActive });
      }
      setProvince("");
      setPercentage(0);
      setTaxName("");
      setIsActive(true);
      setEditing(null);
      fetchTaxes();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to save tax rule");
    }
  };

  const handleEdit = (tax: TaxRule) => {
    setEditing(tax);
    setProvince(tax.province);
    setPercentage(tax.percentage);
    setTaxName(tax.name || "");
    setIsActive(tax.isActive);
  };

  const handleDelete = async (id: string) => {
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

      {/* Add/Edit Form */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="p-6">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Province</label>
              <input
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={province}
                onChange={e => setProvince(e.target.value)}
                placeholder="e.g., Federal"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tax Name</label>
              <input
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={taxName}
                onChange={e => setTaxName(e.target.value)}
                placeholder="e.g., Sales Tax"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Rate (%)</label>
              <input
                type="number"
                min={0}
                max={100}
                step={0.01}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={percentage}
                onChange={e => setPercentage(Number(e.target.value))}
                placeholder="10"
                required
              />
            </div>
            <div>
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
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                {editing ? "Update" : "Add"}
              </button>
              {editing && (
                <button
                  type="button"
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
                  onClick={() => {
                    setEditing(null);
                    setProvince("");
                    setPercentage(0);
                    setTaxName("");
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

      {/* Tax Rules Table */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Tax Rules</h2>
        </div>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-6 text-center text-gray-500">Loading...</div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Province</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tax Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rate</th>
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
                      {tax.name || 'Tax'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {tax.percentage}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        className="text-blue-600 hover:text-blue-900 mr-4"
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