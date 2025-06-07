import { useEffect, useState } from "react";
import axios from "../api/axios";
import { useNavigate } from "react-router-dom";

type Client = {
  id: string;
  name: string;
  branches: { id: string; name: string; city: string; province: string }[];
};

type Item = {
  description: string;
  quantity: number;
  unitPrice: number;
};

export default function CreateInvoice() {
  const [clients, setClients] = useState<Client[]>([]);
  const [clientId, setClientId] = useState("");
  const [branchId, setBranchId] = useState("");
  const [items, setItems] = useState<Item[]>([
    { description: "", quantity: 1, unitPrice: 0 },
  ]);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    axios.get("/clients").then((res) => setClients(res.data));
  }, []);

  const branches = clients.find((c) => c.id === clientId)?.branches || [];

  const handleItemChange = (idx: number, field: keyof Item, value: any) => {
    setItems((prev) =>
      prev.map((item, i) =>
        i === idx ? { ...item, [field]: value } : item
      )
    );
  };

  const addItem = () => setItems([...items, { description: "", quantity: 1, unitPrice: 0 }]);
  const removeItem = (idx: number) => setItems(items.filter((_, i) => i !== idx));

  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await axios.post("/invoices", {
        clientId,
        branchId,
        items,
        notes,
      });
      navigate("/invoices");
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to create invoice");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Create New Invoice</h1>
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow space-y-4">
        {error && <div className="text-red-600">{error}</div>}
        <div>
          <label className="block mb-1 font-medium">Client</label>
          <select
            className="w-full border px-3 py-2 rounded"
            value={clientId}
            onChange={e => {
              setClientId(e.target.value);
              setBranchId(""); // reset branch when client changes
            }}
            required
          >
            <option value="">Select client</option>
            {clients.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block mb-1 font-medium">Branch</label>
          <select
            className="w-full border px-3 py-2 rounded"
            value={branchId}
            onChange={e => setBranchId(e.target.value)}
            required
            disabled={!clientId}
          >
            <option value="">Select branch</option>
            {branches.map(b => (
              <option key={b.id} value={b.id}>
                {b.name} ({b.city}, {b.province})
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block mb-1 font-medium">Items</label>
          {items.map((item, idx) => (
            <div key={idx} className="flex gap-2 mb-2">
              <input
                type="text"
                placeholder="Description"
                className="flex-1 border px-2 py-1 rounded"
                value={item.description}
                onChange={e => handleItemChange(idx, "description", e.target.value)}
                required
              />
              <input
                type="number"
                min={1}
                className="w-20 border px-2 py-1 rounded"
                value={item.quantity}
                onChange={e => handleItemChange(idx, "quantity", Number(e.target.value))}
                required
              />
              <input
                type="number"
                min={0}
                className="w-28 border px-2 py-1 rounded"
                value={item.unitPrice}
                onChange={e => handleItemChange(idx, "unitPrice", Number(e.target.value))}
                required
              />
              <button
                type="button"
                className="text-red-600 font-bold px-2"
                onClick={() => removeItem(idx)}
                disabled={items.length === 1}
                title="Remove item"
              >
                &times;
              </button>
            </div>
          ))}
          <button
            type="button"
            className="mt-2 bg-gray-200 px-3 py-1 rounded"
            onClick={addItem}
          >
            + Add Item
          </button>
        </div>
        <div>
          <label className="block mb-1 font-medium">Notes</label>
          <textarea
            className="w-full border px-3 py-2 rounded"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={2}
          />
        </div>
        <div className="flex justify-between items-center font-bold">
          <span>Subtotal:</span>
          <span>Rs {subtotal.toLocaleString()}</span>
        </div>
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
          disabled={submitting}
        >
          {submitting ? "Creating..." : "Create Invoice"}
        </button>
      </form>
    </div>
  );
}