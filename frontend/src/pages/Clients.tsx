import { useEffect, useState } from "react";
import type { Client, ClientType, CreateClientData } from "../api/clients";
import { clientsApi, getClientTypeColor } from "../api/clients";
import { useAuth } from "../context/AuthContext";

interface EditClientData {
  id: string;
  name: string;
  type: ClientType;
  contact: string;
}

export default function Clients() {
  const { user } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [type, setType] = useState<ClientType>("CLIENT");
  const [contact, setContact] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [editingClient, setEditingClient] = useState<EditClientData | null>(null);
  const [filter, setFilter] = useState<"ALL" | "CLIENT" | "VENDOR">("ALL");

  // Check if user can perform CRUD operations (not VIEWER)
  const canModify = user?.role !== 'VIEWER';

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    setLoading(true);
    try {
      const response = await clientsApi.getAll();
      setClients(response.data);
    } catch (err) {
      console.error("Failed to fetch clients:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canModify) return;
    
    setError("");
    setSubmitting(true);
    try {
      await clientsApi.create({ name, type, contact });
      setName("");
      setType("CLIENT");
      setContact("");
      fetchClients();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to add client");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClient || !canModify) return;
    
    setError("");
    setSubmitting(true);
    try {
      await clientsApi.update(editingClient.id, {
        name: editingClient.name,
        type: editingClient.type,
        contact: editingClient.contact
      });
      setEditingClient(null);
      fetchClients();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to update client");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteClient = async (clientId: string) => {
    if (!canModify) return;
    
    if (!confirm("Are you sure you want to delete this client? This will also delete all associated branches.")) {
      return;
    }
    
    try {
      await clientsApi.delete(clientId);
      fetchClients();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to delete client");
    }
  };

  const handleDeleteBranch = async (clientId: string, branchId: string) => {
    if (!canModify) return;
    
    if (!confirm("Are you sure you want to delete this branch?")) {
      return;
    }
    
    try {
      await clientsApi.deleteBranch(clientId, branchId);
      fetchClients();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to delete branch");
    }
  };

  const filteredClients = clients.filter(client => {
    if (filter === "ALL") return true;
    return client.type === filter;
  });

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Clients & Vendors</h1>
        <div className="flex gap-2">
          <select
            className="border border-gray-300 px-3 py-1 rounded-md"
            value={filter}
            onChange={e => setFilter(e.target.value as typeof filter)}
          >
            <option value="ALL">All</option>
            <option value="CLIENT">Clients Only</option>
            <option value="VENDOR">Vendors Only</option>
          </select>
        </div>
      </div>

      {/* Add Client Form - Only show for users who can modify */}
      {canModify && (
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-lg font-semibold mb-4">Add New Client/Vendor</h2>
          <form onSubmit={handleAddClient} className="flex flex-wrap gap-4 items-end">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input
                className="border border-gray-300 px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={name}
                onChange={e => setName(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select
                className="border border-gray-300 px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={type}
                onChange={e => setType(e.target.value as ClientType)}
              >
                <option value="CLIENT">Client</option>
                <option value="VENDOR">Vendor</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contact</label>
              <input
                className="border border-gray-300 px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={contact}
                onChange={e => setContact(e.target.value)}
                required
              />
            </div>
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
              disabled={submitting}
            >
              {submitting ? "Adding..." : "Add"}
            </button>
          </form>
          {error && <div className="text-red-600 mt-2">{error}</div>}
        </div>
      )}

      {/* Edit Client Modal - Only show for users who can modify */}
      {editingClient && canModify && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">Edit Client/Vendor</h2>
            <form onSubmit={handleEditClient} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  className="w-full border border-gray-300 px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={editingClient.name}
                  onChange={e => setEditingClient({...editingClient, name: e.target.value})}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select
                  className="w-full border border-gray-300 px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={editingClient.type}
                  onChange={e => setEditingClient({...editingClient, type: e.target.value as ClientType})}
                >
                  <option value="CLIENT">Client</option>
                  <option value="VENDOR">Vendor</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contact</label>
                <input
                  className="w-full border border-gray-300 px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={editingClient.contact}
                  onChange={e => setEditingClient({...editingClient, contact: e.target.value})}
                  required
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setEditingClient(null)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                  disabled={submitting}
                >
                  {submitting ? "Updating..." : "Update"}
                </button>
              </div>
            </form>
            {error && <div className="text-red-600 mt-2">{error}</div>}
          </div>
        </div>
      )}

      {/* Clients Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Branches</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredClients.map(client => (
              <ClientRow 
                key={client.id} 
                client={client} 
                canModify={canModify}
                onBranchAdded={fetchClients}
                onEdit={() => setEditingClient({
                  id: client.id,
                  name: client.name,
                  type: client.type,
                  contact: client.contact
                })}
                onDelete={() => handleDeleteClient(client.id)}
                onDeleteBranch={handleDeleteBranch}
              />
            ))}
          </tbody>
        </table>
        {filteredClients.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No {filter === "ALL" ? "clients or vendors" : filter.toLowerCase() + "s"} found.
          </div>
        )}
      </div>
    </div>
  );
}

// Enhanced ClientRow component
function ClientRow({ 
  client, 
  canModify,
  onBranchAdded, 
  onEdit, 
  onDelete, 
  onDeleteBranch 
}: { 
  client: Client; 
  canModify: boolean;
  onBranchAdded: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onDeleteBranch: (clientId: string, branchId: string) => void;
}) {
  const [showBranchForm, setShowBranchForm] = useState(false);
  const [expandBranches, setExpandBranches] = useState(false);
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [province, setProvince] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleAddBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canModify) return;
    
    setError("");
    setSubmitting(true);
    try {
      await clientsApi.createBranch(client.id, {
        name,
        city,
        province,
      });
      setName("");
      setCity("");
      setProvince("");
      setShowBranchForm(false);
      onBranchAdded();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to add branch");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <tr className="hover:bg-gray-50">
        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
          {client.name}
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getClientTypeColor(client.type)}`}>
            {client.type}
          </span>
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
          {client.contact}
        </td>
        <td className="px-6 py-4 text-sm text-gray-900">
          <div className="space-y-1">
            {client.branches.slice(0, expandBranches ? undefined : 2).map(branch => (
              <div key={branch.id} className="flex items-center justify-between bg-gray-50 px-2 py-1 rounded">
                <span>
                  {branch.name} ({branch.city}, {branch.province})
                </span>
                {canModify && (
                  <button
                    onClick={() => onDeleteBranch(client.id, branch.id)}
                    className="text-red-600 hover:text-red-800 text-xs ml-2"
                    title="Delete branch"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
            {client.branches.length > 2 && (
              <button
                onClick={() => setExpandBranches(!expandBranches)}
                className="text-blue-600 hover:text-blue-800 text-xs"
              >
                {expandBranches ? 'Show less' : `Show ${client.branches.length - 2} more`}
              </button>
            )}
          </div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
          {canModify ? (
            <>
              <button
                onClick={onEdit}
                className="text-blue-600 hover:text-blue-900"
              >
                Edit
              </button>
              <button
                onClick={onDelete}
                className="text-red-600 hover:text-red-900"
              >
                Delete
              </button>
              <button
                onClick={() => setShowBranchForm(!showBranchForm)}
                className="text-green-600 hover:text-green-900"
              >
                {showBranchForm ? 'Cancel' : '+ Branch'}
              </button>
            </>
          ) : (
            <span className="text-gray-500 text-sm">View Only</span>
          )}
        </td>
      </tr>
      {showBranchForm && canModify && (
        <tr>
          <td colSpan={5} className="px-6 py-4 bg-gray-50">
            <form onSubmit={handleAddBranch} className="flex gap-4 items-end">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Branch Name</label>
                <input
                  className="border border-gray-300 px-2 py-1 rounded text-sm"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">City</label>
                <input
                  className="border border-gray-300 px-2 py-1 rounded text-sm"
                  value={city}
                  onChange={e => setCity(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Province</label>
                <input
                  className="border border-gray-300 px-2 py-1 rounded text-sm"
                  value={province}
                  onChange={e => setProvince(e.target.value)}
                  required
                />
              </div>
              <button
                type="submit"
                className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 disabled:opacity-50"
                disabled={submitting}
              >
                {submitting ? "Adding..." : "Add Branch"}
              </button>
            </form>
            {error && <div className="text-red-600 text-sm mt-2">{error}</div>}
          </td>
        </tr>
      )}
    </>
  );
}