import { useEffect, useState } from "react";
import axios from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";

type Invoice = {
  id: string;
  invoiceNumber: string;
  date: string;
  client: { name: string };
  branch: { name: string };
  totalAmount: number;
};

export default function Invoices() {
  const { token } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios
      .get("/invoices")
      .then((res) => setInvoices(res.data.data))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Invoices</h1>
      <Link
        to="/invoices/new"
        className="mb-4 inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        + New Invoice
      </Link>
      <Link
  to="/clients"
  className="mt-4 inline-block bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
>
  View Clients
</Link>
      <table className="w-full border mt-4">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2 text-left">#</th>
            <th className="p-2 text-left">Date</th>
            <th className="p-2 text-left">Client</th>
            <th className="p-2 text-left">Branch</th>
            <th className="p-2 text-left">Total</th>
            <th className="p-2 text-left">Actions</th>
          </tr>
        </thead>
        <tbody>
          {invoices.map((inv) => (
            <tr key={inv.id} className="border-t">
              <td className="p-2">{inv.invoiceNumber}</td>
              <td className="p-2">{new Date(inv.date).toLocaleDateString()}</td>
              <td className="p-2">{inv.client?.name}</td>
              <td className="p-2">{inv.branch?.name}</td>
              <td className="p-2">Rs {inv.totalAmount.toLocaleString()}</td>
              <td className="p-2">
                <Link
                  to={`/invoices/${inv.id}`}
                  className="text-blue-600 hover:underline"
                >
                  View
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}