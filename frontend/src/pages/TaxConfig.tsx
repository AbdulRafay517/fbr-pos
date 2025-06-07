import { useEffect, useState } from "react";
import axios from "../api/axios";

type TaxRule = {
  id: string;
  province: string;
  percentage: number;
  isActive: boolean;
};

export default function TaxConfig() {
  const [taxes, setTaxes] = useState<TaxRule[]>([]);
  const [province, setProvince] = useState("");
  const [percentage, setPercentage] = useState<number>(0);
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
    setEditing(tax);
    setProvince(tax.province);
    setPercentage(tax.percentage);
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
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Tax Configuration</h1>
      <form onSubmit={handleSubmit} className="mb-6 bg-white p-4 rounded shadow flex flex-wrap gap-4 items-end">
        <div>
          <label className="block mb-1 font-medium">Province</label>
          <input
            className="border px-2 py-1 rounded"
            value={province}
            onChange={e => setProvince(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block mb-1 font-medium">Percentage</label>
          <input
            type="number"
            min={0}
            max={100}
            className="border px-2 py-1 rounded"
            value={percentage}
            onChange={e => setPercentage(Number(e.target.value))}
            required
          />
        </div>
        <div>
          <label className="block mb-1 font-medium">Active</label>
          <input
            type="checkbox"
            checked={isActive}
            onChange={e => setIsActive(e.target.checked)}
            className="ml-2"
          />
        </div>
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          {editing ? "Update" : "Add"}
        </button>
        {editing && (
          <button
            type="button"
            className="bg-gray-300 px-4 py-2 rounded"
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
        {error && <div className="text-red-600 ml-4">{error}</div>}
      </form>
      {loading ? (
        <div>Loading...</div>
      ) : (
        <table className="w-full border">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2 text-left">Province</th>
              <th className="p-2 text-left">Percentage</th>
              <th className="p-2 text-left">Active</th>
              <th className="p-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {taxes.map(tax => (
              <tr key={tax.id} className="border-t">
                <td className="p-2">{tax.province}</td>
                <td className="p-2">{tax.percentage}%</td>
                <td className="p-2">{tax.isActive ? "Yes" : "No"}</td>
                <td className="p-2">
                  <button
                    className="text-blue-600 hover:underline mr-2"
                    onClick={() => handleEdit(tax)}
                  >
                    Edit
                  </button>
                  <button
                    className="text-red-600 hover:underline"
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
    </div>
  );
}