import React, { useState } from 'react';
import type { InvoiceStatus, UpdateInvoiceStatusData } from '../api/invoices';
import { getStatusLabel } from '../api/invoices';

interface InvoiceStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (data: UpdateInvoiceStatusData) => Promise<void>;
  currentStatus: InvoiceStatus;
  invoiceNumber: string;
}

const InvoiceStatusModal: React.FC<InvoiceStatusModalProps> = ({
  isOpen,
  onClose,
  onUpdate,
  currentStatus,
  invoiceNumber,
}) => {
  const [status, setStatus] = useState<InvoiceStatus>(currentStatus);
  const [reason, setReason] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const statusOptions: InvoiceStatus[] = ['UNPAID', 'PAID', 'DUE_SOON', 'OVERDUE'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status === currentStatus) {
      onClose();
      return;
    }

    setIsLoading(true);
    try {
      await onUpdate({ status, reason: reason.trim() || undefined });
      onClose();
      setReason('');
    } catch (error) {
      console.error('Failed to update status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setStatus(currentStatus);
    setReason('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900">
            Update Invoice Status
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Invoice: {invoiceNumber}
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as InvoiceStatus)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              {statusOptions.map((option) => (
                <option key={option} value={option}>
                  {getStatusLabel(option)}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reason (Optional)
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Enter reason for status change..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          <div className="flex justify-end space-x-4">
            {/* Cancel Button */}
            <button
              type="button"
              onClick={handleCancel}
              className="inline-flex items-center px-6 py-2.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              disabled={isLoading}
            >
              <svg className="-ml-1 mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Cancel
            </button>

            {/* Update Status Button */}
            <button
              type="submit"
              disabled={isLoading || status === currentStatus}
              className="inline-flex items-center px-6 py-2.5 border-2 border-blue-600 text-sm font-semibold rounded-md shadow-lg text-white bg-blue-600 hover:bg-blue-700 hover:border-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-400 disabled:border-gray-400 transition-all duration-200 transform hover:scale-105"
            >
              {isLoading ? (
                <>
                  <svg className="-ml-1 mr-2 h-4 w-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span className="text-white font-semibold">Updating...</span>
                </>
              ) : (
                <>
                  <svg className="-ml-1 mr-2 h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  <span className="text-black font-semibold">Update Status</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InvoiceStatusModal; 