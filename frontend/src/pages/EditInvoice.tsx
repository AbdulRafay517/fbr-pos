import { useEffect, useState } from "react";
import { invoicesApi } from "../api/invoices";
import type { CreateInvoiceData, Invoice } from "../api/invoices";
import axios from "../api/axios";
import { useNavigate, useParams } from "react-router-dom";

type Client = {
  id: string;
  name: string;
  branches: { id: string; name: string; city: string; province: string }[];
};

type TaxRule = {
  id: string;
  province: string;
  percentage: number;
  isActive: boolean;
};

type Item = {
  description: string;
  quantity: number;
  unitPrice: number;
};

export default function EditInvoice() {
  const { id } = useParams();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [taxRules, setTaxRules] = useState<TaxRule[]>([]);
  const [clientId, setClientId] = useState("");
  const [branchId, setBranchId] = useState("");
  const [selectedTaxRuleId, setSelectedTaxRuleId] = useState("");
  const [issueDate, setIssueDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [items, setItems] = useState<Item[]>([
    { description: "", quantity: 1, unitPrice: 0 },
  ]);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch invoice data and related data
    Promise.all([
      invoicesApi.getById(id!),
      axios.get("/clients"),
      axios.get("/taxes")
    ]).then(([invoiceRes, clientsRes, taxesRes]) => {
      const invoiceData = invoiceRes.data;
      setInvoice(invoiceData);
      
      // Pre-populate form with existing invoice data
      setClientId(invoiceData.client.id);
      setBranchId(invoiceData.branch.id);
      setIssueDate(invoiceData.date.split('T')[0]); // Convert to YYYY-MM-DD format
      setDueDate(invoiceData.dueDate ? invoiceData.dueDate.split('T')[0] : "");
      setItems(invoiceData.items.map((item: any) => ({
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice
      })));
      setNotes(invoiceData.notes || "");
      
      setClients(clientsRes.data);
      const activeTaxRules = taxesRes.data.filter((rule: TaxRule) => rule.isActive);
      setTaxRules(activeTaxRules);
      
      // Find and set the current tax rule based on the invoice's tax percentage and branch province
      const currentTaxPercentage = invoiceData.taxAmount > 0 ? 
        (invoiceData.taxAmount / invoiceData.subtotal) * 100 : 0;
      
      const matchingTaxRule = activeTaxRules.find((rule: TaxRule) => 
        rule.province.toLowerCase() === invoiceData.branch.province.toLowerCase() ||
        Math.abs(rule.percentage - currentTaxPercentage) < 0.01 // Allow small floating point differences
      );
      
      if (matchingTaxRule) {
        setSelectedTaxRuleId(matchingTaxRule.id);
      } else if (activeTaxRules.length > 0) {
        // Fallback to first available tax rule if no exact match
        setSelectedTaxRuleId(activeTaxRules[0].id);
      }
      
      setLoading(false);
    }).catch(err => {
      console.error("Failed to fetch data:", err);
      setError("Failed to load invoice data. Please try again.");
      setLoading(false);
    });
  }, [id]);

  const branches = clients.find((c) => c.id === clientId)?.branches || [];
  const selectedBranch = branches.find(b => b.id === branchId);
  const selectedTaxRule = taxRules.find(rule => rule.id === selectedTaxRuleId);

  // Auto-select tax rule based on branch province (only if no tax rule is currently selected)
  useEffect(() => {
    if (selectedBranch && taxRules.length > 0 && !selectedTaxRuleId) {
      const matchingTaxRule = taxRules.find(rule => 
        rule.province.toLowerCase() === selectedBranch.province.toLowerCase()
      );
      if (matchingTaxRule) {
        setSelectedTaxRuleId(matchingTaxRule.id);
      }
    }
  }, [selectedBranch, taxRules, selectedTaxRuleId]);

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
  const taxPercentage = selectedTaxRule ? selectedTaxRule.percentage : 0;
  const taxAmount = subtotal * (taxPercentage / 100);
  const totalAmount = subtotal + taxAmount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const invoiceData: Partial<CreateInvoiceData> & { taxRuleId?: string } = {
        clientId,
        branchId,
        taxRuleId: selectedTaxRuleId || undefined,
        date: issueDate,
        dueDate: dueDate || undefined,
        items,
        notes: notes || undefined,
      };
      
      await invoicesApi.update(id!, invoiceData);
      navigate("/invoices");
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to update invoice");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-6">Loading...</div>;
  if (!invoice) return <div className="p-6 text-red-600">Invoice not found.</div>;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Edit Invoice</h1>
        <nav className="text-sm text-gray-500">
          <span>Edit Invoice #{invoice.invoiceNumber}</span>
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
                    setBranchId(""); 
                    setSelectedTaxRuleId(""); 
                  }}
                  required
                >
                  <option value="">Select Client</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Branch</label>
                <select
                  className="w-full border border-gray-300 rounded-md px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={branchId}
                  onChange={e => setBranchId(e.target.value)}
                  required
                  disabled={!clientId}
                >
                  <option value="">Select Branch</option>
                  {branches.map(b => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.city}, {b.province})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Tax Rule Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tax Rule</label>
                <div className="flex gap-2">
                  <select
                    className="flex-1 border border-gray-300 rounded-md px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={selectedTaxRuleId}
                    onChange={e => setSelectedTaxRuleId(e.target.value)}
                    required
                  >
                    <option value="">Select Tax Rule</option>
                    {taxRules.map(rule => (
                      <option key={rule.id} value={rule.id}>
                        {rule.province} - {rule.percentage}%
                      </option>
                    ))}
                  </select>
                  {selectedBranch && selectedTaxRule && selectedTaxRule.province.toLowerCase() !== selectedBranch.province.toLowerCase() && (
                    <button
                      type="button"
                      className="px-3 py-2 text-xs bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 whitespace-nowrap"
                      onClick={() => {
                        const recommendedRule = taxRules.find(r => 
                          r.province.toLowerCase() === selectedBranch.province.toLowerCase()
                        );
                        if (recommendedRule) {
                          setSelectedTaxRuleId(recommendedRule.id);
                        }
                      }}
                      title="Use recommended tax rule for this province"
                    >
                      Use Recommended
                    </button>
                  )}
                </div>
                {selectedBranch && (
                  <p className="text-xs text-gray-500 mt-1">
                    {taxRules.find(r => r.province.toLowerCase() === selectedBranch.province.toLowerCase()) ? 
                      `Recommended for ${selectedBranch.province}` : 
                      `No matching tax rule found for ${selectedBranch.province}`
                    }
                    {selectedTaxRule && selectedTaxRule.province.toLowerCase() !== selectedBranch.province.toLowerCase() && (
                      <span className="text-orange-600 ml-1">
                        (Manual override)
                      </span>
                    )}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tax Amount</label>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-50"
                  value={selectedTaxRule ? 
                    `Rs ${taxAmount.toLocaleString()} (${taxPercentage}%)` : 
                    'Select tax rule'
                  }
                  readOnly
                />
              </div>
            </div>

            {/* Dates and Total */}
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
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Total Amount</label>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-50 font-semibold"
                  value={`Rs ${totalAmount.toLocaleString()}`}
                  readOnly
                />
              </div>
            </div>

            {/* Items Table */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Invoice Items</h3>
                <div className="text-sm text-gray-500">
                  {items.length > 1 ? (
                    <span>{items.length} items • Click "Remove" to delete individual items</span>
                  ) : (
                    <span>1 item • At least one item is required</span>
                  )}
                </div>
              </div>
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
                            placeholder="Enter item description"
                            className="w-full border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            value={item.description}
                            onChange={e => handleItemChange(idx, "description", e.target.value)}
                            required
                          />
                        </td>
                        <td className="px-6 py-4">
                          <input
                            type="number"
                            min={1}
                            className="w-full border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            value={item.quantity}
                            onChange={e => handleItemChange(idx, "quantity", Number(e.target.value))}
                            required
                          />
                        </td>
                        <td className="px-6 py-4">
                          <input
                            type="number"
                            min={0}
                            step={0.01}
                            className="w-full border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            value={item.unitPrice}
                            onChange={e => handleItemChange(idx, "unitPrice", Number(e.target.value))}
                            required
                          />
                        </td>
                        <td className="px-6 py-4 text-gray-900 font-medium">
                          Rs {(item.quantity * item.unitPrice).toLocaleString()}
                        </td>
                        <td className="px-6 py-4">
                          <button
                            type="button"
                            className="inline-flex items-center px-3 py-1 text-sm text-red-600 hover:text-red-900 hover:bg-red-50 rounded-md transition-colors disabled:text-gray-400 disabled:hover:bg-transparent"
                            onClick={() => {
                              if (items.length > 1) {
                                if (item.description && (item.quantity > 0 || item.unitPrice > 0)) {
                                  if (window.confirm('Are you sure you want to remove this item?')) {
                                    removeItem(idx);
                                  }
                                } else {
                                  removeItem(idx);
                                }
                              }
                            }}
                            disabled={items.length === 1}
                            title={items.length === 1 ? "At least one item is required" : "Remove this item"}
                          >
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
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
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  onClick={addItem}
                >
                  <svg className="-ml-0.5 mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Add Item
                </button>
              </div>
            </div>

            {/* Totals Summary */}
            <div className="flex justify-end">
              <div className="w-80 bg-gray-50 p-4 rounded-lg">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal</span>
                    <span>Rs {subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Tax ({taxPercentage}%)</span>
                    <span>Rs {taxAmount.toLocaleString()}</span>
                  </div>
                  <div className="border-t pt-2">
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total Amount</span>
                      <span>Rs {totalAmount.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Notes (Optional)</label>
              <textarea
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={3}
                placeholder="Additional notes or terms..."
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
                className="px-6 py-2 bg-blue-600 text-black rounded-md hover:bg-blue-700 disabled:opacity-50"
                disabled={submitting}
              >
                {submitting ? "Updating..." : "Update Invoice"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 