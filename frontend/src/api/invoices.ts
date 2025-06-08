import api from './axios';

export type InvoiceStatus = 'UNPAID' | 'PAID' | 'DUE_SOON' | 'OVERDUE';

export interface Invoice {
  id: string;
  invoiceNumber: string;
  date: string;
  dueDate?: string;
  status: InvoiceStatus;
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  notes?: string;
  client: {
    id: string;
    name: string;
    contact: string;
  };
  branch: {
    id: string;
    name: string;
    city: string;
    province: string;
  };
  createdBy: {
    id: string;
    name: string;
    email: string;
  };
  items: InvoiceItem[];
  statusHistory?: InvoiceStatusHistory[];
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface InvoiceStatusHistory {
  id: string;
  status: InvoiceStatus;
  changedBy?: string;
  reason?: string;
  createdAt: string;
}

export interface CreateInvoiceData {
  clientId: string;
  branchId: string;
  taxRuleId?: string;
  date?: string;
  dueDate?: string;
  items: {
    description: string;
    quantity: number;
    unitPrice: number;
  }[];
  notes?: string;
}

export interface UpdateInvoiceStatusData {
  status: InvoiceStatus;
  reason?: string;
}

export interface InvoiceStatusStats {
  UNPAID: number;
  PAID: number;
  DUE_SOON: number;
  OVERDUE: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface QueryParams {
  page?: number;
  limit?: number;
  search?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Invoice CRUD operations
export const invoicesApi = {
  // Basic CRUD
  create: (data: CreateInvoiceData) => 
    api.post<Invoice>('/invoices', data),

  getAll: (params?: QueryParams) => 
    api.get<PaginatedResponse<Invoice>>('/invoices', { params }),

  getById: (id: string) => 
    api.get<Invoice>(`/invoices/${id}`),

  update: (id: string, data: Partial<CreateInvoiceData> & { taxRuleId?: string }) => 
    api.put<Invoice>(`/invoices/${id}`, data),

  delete: (id: string) => 
    api.delete(`/invoices/${id}`),

  // PDF generation
  downloadPdf: (id: string) => 
    api.get(`/invoices/${id}/pdf`, { responseType: 'blob' }),

  // Status Management
  getStatusStats: () => 
    api.get<InvoiceStatusStats>('/invoices/status/stats'),

  getUrgentInvoices: () => 
    api.get<Invoice[]>('/invoices/status/urgent'),

  getInvoicesByStatus: (status: InvoiceStatus, page?: number, limit?: number) => 
    api.get<PaginatedResponse<Invoice>>(`/invoices/status/${status}`, {
      params: { page, limit }
    }),

  updateStatus: (id: string, data: UpdateInvoiceStatusData) => 
    api.put<Invoice>(`/invoices/${id}/status`, data),

  markAsPaid: (id: string, reason?: string) => 
    api.put<Invoice>(`/invoices/${id}/mark-paid`, { reason }),

  markAsUnpaid: (id: string, reason?: string) => 
    api.put<Invoice>(`/invoices/${id}/mark-unpaid`, { reason }),

  getStatusHistory: (id: string) => 
    api.get<InvoiceStatusHistory[]>(`/invoices/${id}/status-history`),

  // Configuration
  getDueSoonThreshold: () => 
    api.get<number>('/invoices/config/due-soon-threshold'),

  setDueSoonThreshold: (days: number) => 
    api.put('/invoices/config/due-soon-threshold', { days }),

  triggerStatusUpdate: () => 
    api.post('/invoices/status/update-all'),

  // Filter by client/branch
  getByClient: (clientId: string, params?: QueryParams) => 
    api.get<PaginatedResponse<Invoice>>(`/invoices/client/${clientId}`, { params }),

  getByBranch: (branchId: string, params?: QueryParams) => 
    api.get<PaginatedResponse<Invoice>>(`/invoices/branch/${branchId}`, { params }),
};

// Helper functions
export const getStatusColor = (status: InvoiceStatus): string => {
  switch (status) {
    case 'PAID':
      return 'text-green-600 bg-green-50';
    case 'UNPAID':
      return 'text-blue-600 bg-blue-50';
    case 'DUE_SOON':
      return 'text-yellow-600 bg-yellow-50';
    case 'OVERDUE':
      return 'text-red-600 bg-red-50';
    default:
      return 'text-gray-600 bg-gray-50';
  }
};

export const getStatusLabel = (status: InvoiceStatus): string => {
  switch (status) {
    case 'PAID':
      return 'Paid';
    case 'UNPAID':
      return 'Unpaid';
    case 'DUE_SOON':
      return 'Due Soon';
    case 'OVERDUE':
      return 'Overdue';
    default:
      return status;
  }
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
  }).format(amount);
};

export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-PK', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}; 