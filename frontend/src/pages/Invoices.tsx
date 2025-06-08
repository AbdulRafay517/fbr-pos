import { useEffect, useState } from "react";
import { invoicesApi, formatDate, formatCurrency } from "../api/invoices";
import type { Invoice, InvoiceStatus, UpdateInvoiceStatusData } from "../api/invoices";
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";
import InvoiceStatusBadge from "../components/InvoiceStatusBadge";
import InvoiceStatusModal from "../components/InvoiceStatusModal";

export default function Invoices() {
  const { token, user } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | "">("");
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Check if user can perform CRUD operations (not VIEWER)
  const canModify = user?.role !== 'VIEWER';

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const params: any = { page, limit: 10 };
      
      if (statusFilter) {
        const response = await invoicesApi.getInvoicesByStatus(statusFilter, page, 10);
        setInvoices(response.data.data);
        setTotalPages(response.data.meta.totalPages);
      } else {
        const response = await invoicesApi.getAll(params);
        setInvoices(response.data.data);
        setTotalPages(response.data.meta.totalPages);
      }
    } catch (error) {
      console.error('Failed to fetch invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [token, page, statusFilter]);

  const handleStatusUpdate = async (data: UpdateInvoiceStatusData) => {
    if (!selectedInvoice || !canModify) return;

    try {
      await invoicesApi.updateStatus(selectedInvoice.id, data);
      await fetchInvoices(); // Refresh the list
    } catch (error) {
      console.error('Failed to update status:', error);
      throw error;
    }
  };

  const handleQuickStatusUpdate = async (invoice: Invoice, status: InvoiceStatus) => {
    if (!canModify) return;
    
    try {
      await invoicesApi.updateStatus(invoice.id, { status });
      await fetchInvoices(); // Refresh the list
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const openStatusModal = (invoice: Invoice) => {
    if (!canModify) return;
    setSelectedInvoice(invoice);
    setIsStatusModalOpen(true);
  };

  const closeStatusModal = () => {
    setSelectedInvoice(null);
    setIsStatusModalOpen(false);
  };

  const handleDownloadPdf = async (invoiceId: string, invoiceNumber: string) => {
    try {
      const response = await invoicesApi.downloadPdf(invoiceId);
      
      // Create blob from response
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      
      // Create download link
      const link = document.createElement('a');
      link.href = url;
      link.download = `invoice-${invoiceNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download PDF:', error);
      alert('Failed to download PDF. Please try again.');
    }
  };

  const handleDeleteInvoice = async (invoiceId: string, invoiceNumber: string) => {
    if (!canModify) {
      alert('You do not have permission to delete invoices.');
      return;
    }
    
    if (!confirm(`Are you sure you want to delete invoice ${invoiceNumber}? This action cannot be undone.`)) {
      return;
    }
    
    try {
      console.log(`Attempting to delete invoice ${invoiceId}...`);
      console.log('User role:', user?.role);
      console.log('Can modify:', canModify);
      
      const response = await invoicesApi.delete(invoiceId);
      console.log('Delete response:', response);
      
      // Show success message
      alert(`Invoice ${invoiceNumber} has been deleted successfully.`);
      
      // Refresh the list
      await fetchInvoices();
    } catch (error: any) {
      console.error('Failed to delete invoice:', error);
      
      // Show detailed error message
      let errorMessage = 'Failed to delete invoice.';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.status === 403) {
        errorMessage = 'You do not have permission to delete this invoice.';
      } else if (error.response?.status === 404) {
        errorMessage = 'Invoice not found.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      alert(`Error: ${errorMessage}`);
    }
  };

  if (loading && page === 1) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Invoices</h1>
        <div className="flex items-center space-x-2">
          <button className="p-2 text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        {/* Filters */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex space-x-4">
            <div>
              <select
                className="border border-gray-300 rounded-md px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={dateFilter}
                onChange={e => setDateFilter(e.target.value)}
              >
                <option value="">Filter by Date</option>
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
              </select>
            </div>
            <div>
              <select
                className="border border-gray-300 rounded-md px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value as InvoiceStatus | "")}
              >
                <option value="">All Statuses</option>
                <option value="UNPAID">Unpaid</option>
                <option value="PAID">Paid</option>
                <option value="DUE_SOON">Due Soon</option>
                <option value="OVERDUE">Overdue</option>
              </select>
            </div>
            {canModify && (
              <Link
                to="/invoices/new"
                className="ml-auto bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                + New Invoice
              </Link>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice #</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {invoices.map((invoice) => (
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
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {invoice.dueDate ? formatDate(invoice.dueDate) : 'No due date'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatCurrency(invoice.totalAmount)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <InvoiceStatusBadge status={invoice.status} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <Link
                        to={`/invoices/${invoice.id}`}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        View
                      </Link>
                      <button
                        onClick={() => handleDownloadPdf(invoice.id, invoice.invoiceNumber)}
                        className="text-purple-600 hover:text-purple-900"
                        title="Download PDF"
                      >
                        PDF
                      </button>
                      {canModify && (
                        <>
                          <Link
                            to={`/invoices/${invoice.id}/edit`}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            Edit
                          </Link>
                          <button
                            onClick={() => handleDeleteInvoice(invoice.id, invoice.invoiceNumber)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Delete
                          </button>
                          <button
                            onClick={() => openStatusModal(invoice)}
                            className="text-gray-600 hover:text-gray-900"
                          >
                            Status
                          </button>
                          {invoice.status === 'UNPAID' && (
                            <button
                              onClick={() => handleQuickStatusUpdate(invoice, 'PAID')}
                              className="text-green-600 hover:text-green-900"
                            >
                              Mark Paid
                            </button>
                          )}
                          {invoice.status === 'PAID' && (
                            <button
                              onClick={() => handleQuickStatusUpdate(invoice, 'UNPAID')}
                              className="text-yellow-600 hover:text-yellow-900"
                            >
                              Mark Unpaid
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Page {page} of {totalPages}
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(page + 1)}
                disabled={page === totalPages}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {invoices.length === 0 && !loading && (
          <div className="p-6 text-center text-gray-500">
            {statusFilter ? `No ${statusFilter.toLowerCase()} invoices found.` : 'No invoices found.'}
            {canModify && (
              <>
                {' '}
                <Link to="/invoices/new" className="text-blue-600 hover:underline">Create your first invoice</Link>
              </>
            )}
          </div>
        )}
      </div>

      {/* Status Update Modal - Only show for users who can modify */}
      {selectedInvoice && canModify && (
        <InvoiceStatusModal
          isOpen={isStatusModalOpen}
          onClose={closeStatusModal}
          onUpdate={handleStatusUpdate}
          currentStatus={selectedInvoice.status}
          invoiceNumber={selectedInvoice.invoiceNumber}
        />
      )}
    </div>
  );
}