import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "../api/axios";

type Invoice = {
  id: string;
  invoiceNumber: string;
  date: string;
  client: { name: string };
  branch: { name: string; city: string; province: string };
  items: { description: string; quantity: number; unitPrice: number; total: number }[];
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  notes?: string;
};

export default function InvoiceDetails() {
  const { id } = useParams();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`/invoices/${id}`).then(res => {
      setInvoice(res.data);
      setLoading(false);
    });
  }, [id]);

  if (loading) return <div className="p-8">Loading...</div>;
  if (!invoice) return <div className="p-8 text-red-600">Invoice not found.</div>;

  return (
    <div className="p-8 max-w-2xl mx-auto bg-white rounded shadow">
      <h1 className="text-2xl font-bold mb-2">Invoice #{invoice.invoiceNumber}</h1>
      <div className="mb-2 text-gray-600">Date: {new Date(invoice.date).toLocaleDateString()}</div>
      <div className="mb-2">Client: <b>{invoice.client.name}</b></div>
      <div className="mb-2">Branch: <b>{invoice.branch.name}</b> ({invoice.branch.city}, {invoice.branch.province})</div>
      <div className="mb-4">Notes: {invoice.notes || <span className="text-gray-400">None</span>}</div>
      <table className="w-full border mb-4">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2 text-left">Description</th>
            <th className="p-2 text-right">Qty</th>
            <th className="p-2 text-right">Unit Price</th>
            <th className="p-2 text-right">Total</th>
          </tr>
        </thead>
        <tbody>
          {invoice.items.map((item, idx) => (
            <tr key={idx} className="border-t">
              <td className="p-2">{item.description}</td>
              <td className="p-2 text-right">{item.quantity}</td>
              <td className="p-2 text-right">Rs {item.unitPrice.toLocaleString()}</td>
              <td className="p-2 text-right">Rs {item.total.toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex justify-end gap-8 mb-2">
        <div>Subtotal:</div>
        <div>Rs {invoice.subtotal.toLocaleString()}</div>
      </div>
      <div className="flex justify-end gap-8 mb-2">
        <div>Tax:</div>
        <div>Rs {invoice.taxAmount.toLocaleString()}</div>
      </div>
      <div className="flex justify-end gap-8 font-bold text-lg">
        <div>Total:</div>
        <div>Rs {invoice.totalAmount.toLocaleString()}</div>
      </div>
      <div className="mt-6">
        <Link to="/invoices" className="text-blue-600 hover:underline">← Back to Invoices</Link>
      </div>
    </div>
  );
}