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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-lg font-semibold mb-4">
          Update Status - {invoiceNumber}
        </h2>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as InvoiceStatus)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || status === currentStatus}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Updating...' : 'Update Status'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InvoiceStatusModal; 