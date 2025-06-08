import api from './axios';

export type ClientType = 'CLIENT' | 'VENDOR';

export interface Branch {
  id: string;
  name: string;
  city: string;
  province: string;
}

export interface Client {
  id: string;
  name: string;
  type: ClientType;
  contact: string;
  branches: Branch[];
}

export interface CreateClientData {
  name: string;
  type: ClientType;
  contact: string;
}

export interface CreateBranchData {
  name: string;
  city: string;
  province: string;
  clientId: string;
}

export const clientsApi = {
  // Client CRUD
  create: (data: CreateClientData) => 
    api.post<Client>('/clients', data),

  getAll: () => 
    api.get<Client[]>('/clients'),

  getById: (id: string) => 
    api.get<Client>(`/clients/${id}`),

  update: (id: string, data: Partial<CreateClientData>) => 
    api.put<Client>(`/clients/${id}`, data),

  delete: (id: string) => 
    api.delete(`/clients/${id}`),

  // Branch CRUD
  createBranch: (clientId: string, data: Omit<CreateBranchData, 'clientId'>) =>
    api.post<Branch>(`/clients/${clientId}/branches`, data),

  getBranches: (clientId: string) =>
    api.get<Branch[]>(`/clients/${clientId}/branches`),

  updateBranch: (clientId: string, branchId: string, data: Partial<Omit<CreateBranchData, 'clientId'>>) =>
    api.put<Branch>(`/clients/${clientId}/branches/${branchId}`, data),

  deleteBranch: (clientId: string, branchId: string) =>
    api.delete(`/clients/${clientId}/branches/${branchId}`),
};

// Helper functions
export const getClientTypeLabel = (type: ClientType): string => {
  return type === 'CLIENT' ? 'Client' : 'Vendor';
};

export const getClientTypeColor = (type: ClientType): string => {
  return type === 'CLIENT' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800';
}; 