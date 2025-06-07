import { useEffect, useState } from "react";
import { invoicesApi, formatDate } from "../api/invoices";
import type { InvoiceStatusStats, Invoice } from "../api/invoices";
import InvoiceStatusBadge from "../components/InvoiceStatusBadge";

export default function Dashboard() {
  const [stats, setStats] = useState<InvoiceStatusStats>({ UNPAID: 0, PAID: 0, DUE_SOON: 0, OVERDUE: 0 });
  const [recent, setRecent] = useState<Invoice[]>([]);
  const [urgentInvoices, setUrgentInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [statsRes, recentRes, urgentRes] = await Promise.all([
          invoicesApi.getStatusStats(),
          invoicesApi.getAll({ limit: 5, sortBy: "date", sortOrder: "desc" }),
          invoicesApi.getUrgentInvoices(),
        ]);

        setStats(statsRes.data);
        setRecent(recentRes.data.data);
        setUrgentInvoices(urgentRes.data);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const totalInvoices = stats.UNPAID + stats.PAID + stats.DUE_SOON + stats.OVERDUE;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-500 mb-1">Total Invoices</div>
          <div className="text-3xl font-bold text-gray-900">{totalInvoices}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-500 mb-1">Unpaid Invoices</div>
          <div className="text-3xl font-bold text-blue-600">{stats.UNPAID}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-500 mb-1">Due Soon</div>
          <div className="text-3xl font-bold text-yellow-600">{stats.DUE_SOON}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-500 mb-1">Overdue</div>
          <div className="text-3xl font-bold text-red-600">{stats.OVERDUE}</div>
        </div>
      </div>

      {/* Urgent Invoices Alert */}
      {urgentInvoices.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                Attention Required
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                You have {urgentInvoices.length} invoice(s) that are due soon or overdue.
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Invoices */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Recent Invoices</h2>
          </div>
          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-6 text-center text-gray-500">Loading...</div>
            ) : recent.length === 0 ? (
              <div className="p-6 text-center text-gray-500">No invoices yet. Create your first invoice!</div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {recent.map(invoice => (
                    <tr key={invoice.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {invoice.invoiceNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {invoice.client.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(invoice.date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <InvoiceStatusBadge status={invoice.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Urgent Invoices */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Urgent Invoices</h2>
          </div>
          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-6 text-center text-gray-500">Loading...</div>
            ) : urgentInvoices.length === 0 ? (
              <div className="p-6 text-center text-gray-500">No urgent invoices. Great job!</div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {urgentInvoices.map(invoice => (
                    <tr key={invoice.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {invoice.invoiceNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {invoice.client.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {invoice.dueDate ? formatDate(invoice.dueDate) : 'No due date'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <InvoiceStatusBadge status={invoice.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}