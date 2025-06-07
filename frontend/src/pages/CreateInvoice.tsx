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
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState("");
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
  const taxAmount = subtotal * 0.1; // Assuming 10% tax
  const totalAmount = subtotal + taxAmount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await axios.post("/invoices", {
        clientId,
        branchId,
        date: issueDate,
        dueDate,
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
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Create Invoice</h1>
        <nav className="text-sm text-gray-500">
          <span>Create Invoice</span>
        </nav>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                {error}
              </div>
            )}

            {/* Client and Branch Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Client</label>
                <select
                  className="w-full border border-gray-300 rounded-md px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={clientId}
                  onChange={e => {
                    setClientId(e.target.value);
                    setBranchId(""); // reset branch when client changes
                  }}
                  required
                >
                  <option value="">Client</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Client Branch</label>
                <select
                  className="w-full border border-gray-300 rounded-md px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={branchId}
                  onChange={e => setBranchId(e.target.value)}
                  required
                  disabled={!clientId}
                >
                  <option value="">Client Branch</option>
                  {branches.map(b => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.city}, {b.province})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Dates and Amount */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Issue Date</label>
                <input
                  type="date"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={issueDate}
                  onChange={e => setIssueDate(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Due Date</label>
                <input
                  type="date"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={dueDate}
                  onChange={e => setDueDate(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Amount</label>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-50"
                  value={`Rs ${totalAmount.toLocaleString()}`}
                  readOnly
                />
              </div>
            </div>

            {/* Items Table */}
            <div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit Price</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {items.map((item, idx) => (
                      <tr key={idx}>
                        <td className="px-6 py-4">
                          <input
                            type="text"
                            placeholder="Description"
                            className="w-full border-0 p-0 focus:outline-none focus:ring-0"
                            value={item.description}
                            onChange={e => handleItemChange(idx, "description", e.target.value)}
                            required
                          />
                        </td>
                        <td className="px-6 py-4">
                          <input
                            type="number"
                            min={1}
                            className="w-full border-0 p-0 focus:outline-none focus:ring-0"
                            value={item.quantity}
                            onChange={e => handleItemChange(idx, "quantity", Number(e.target.value))}
                            required
                          />
                        </td>
                        <td className="px-6 py-4">
                          <input
                            type="number"
                            min={0}
                            className="w-full border-0 p-0 focus:outline-none focus:ring-0"
                            value={item.unitPrice}
                            onChange={e => handleItemChange(idx, "unitPrice", Number(e.target.value))}
                            required
                          />
                        </td>
                        <td className="px-6 py-4 text-gray-900">
                          Rs {(item.quantity * item.unitPrice).toLocaleString()}
                        </td>
                        <td className="px-6 py-4">
                          <button
                            type="button"
                            className="text-red-600 hover:text-red-900"
                            onClick={() => removeItem(idx)}
                            disabled={items.length === 1}
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-4">
                <button
                  type="button"
                  className="text-blue-600 hover:text-blue-800"
                  onClick={addItem}
                >
                  + Add Item
                </button>
              </div>
            </div>

            {/* Totals */}
            <div className="flex justify-end">
              <div className="w-64 space-y-2">
                <div className="flex justify-between">
                  <span>Total</span>
                  <span>Rs {subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax</span>
                  <span>Rs {taxAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-bold text-lg border-t pt-2">
                  <span>Total Amount</span>
                  <span>Rs {totalAmount.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
              <textarea
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={3}
                placeholder="Additional notes..."
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                onClick={() => navigate("/invoices")}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                disabled={submitting}
              >
                {submitting ? "Creating..." : "Save"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}