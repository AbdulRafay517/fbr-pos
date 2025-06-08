import { useEffect, useState } from "react";
import axios from "../api/axios";

type Branch = {
  id: string;
  name: string;
  city: string;
  province: string;
};

type Client = {
  id: string;
  name: string;
  type: string;
  contact: string;
  branches: Branch[];
};

export default function Clients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [type, setType] = useState("CLIENT");
  const [contact, setContact] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = () => {
    setLoading(true);
    axios.get("/clients").then(res => {
      setClients(res.data);
      setLoading(false);
    });
  };

  const handleAddClient = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await axios.post("/clients", { name, type, contact });
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

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Clients & Vendors</h1>
      <form onSubmit={handleAddClient} className="mb-6 bg-white p-4 rounded shadow flex flex-wrap gap-4 items-end">
        <div>
          <label className="block mb-1 font-medium">Name</label>
          <input
            className="border px-2 py-1 rounded"
            value={name}
            onChange={e => setName(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block mb-1 font-medium">Type</label>
          <select
            className="border px-2 py-1 rounded"
            value={type}
            onChange={e => setType(e.target.value)}
          >
            <option value="CLIENT">Client</option>
            <option value="VENDOR">Vendor</option>
          </select>
        </div>
        <div>
          <label className="block mb-1 font-medium">Contact</label>
          <input
            className="border px-2 py-1 rounded"
            value={contact}
            onChange={e => setContact(e.target.value)}
            required
          />
        </div>
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          disabled={submitting}
        >
          {submitting ? "Adding..." : "Add Client"}
        </button>
        {error && <div className="text-red-600 ml-4">{error}</div>}
      </form>
      <table className="w-full border">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2 text-left">Name</th>
            <th className="p-2 text-left">Type</th>
            <th className="p-2 text-left">Contact</th>
            <th className="p-2 text-left">Branches</th>
            <th className="p-2 text-left">Add Branch</th>
          </tr>
        </thead>
        <tbody>
          {clients.map(client => (
            <ClientRow key={client.id} client={client} onBranchAdded={fetchClients} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

// --- Helper component for branch form per client ---
function ClientRow({ client, onBranchAdded }: { client: Client; onBranchAdded: () => void }) {
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [province, setProvince] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleAddBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await axios.post(`/clients/${client.id}/branches`, {
        name,
        city,
        province,
        clientId: client.id,
      });
      setName("");
      setCity("");
      setProvince("");
      setShowForm(false);
      onBranchAdded();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to add branch");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <tr className="border-t">
      <td className="p-2">{client.name}</td>
      <td className="p-2 capitalize">{client.type}</td>
      <td className="p-2">{client.contact}</td>
      <td className="p-2">
        {client.branches.map(b => (
          <div key={b.id}>
            {b.name} ({b.city}, {b.province})
          </div>
        ))}
      </td>
      <td className="p-2">
        {showForm ? (
          <form onSubmit={handleAddBranch} className="space-y-1">
            <input
              className="border px-2 py-1 rounded mb-1 w-full"
              placeholder="Branch Name"
              value={name}
              onChange={e => setName(e.target.value)}
              required
            />
            <input
              className="border px-2 py-1 rounded mb-1 w-full"
              placeholder="City"
              value={city}
              onChange={e => setCity(e.target.value)}
              required
            />
            <input
              className="border px-2 py-1 rounded mb-1 w-full"
              placeholder="Province"
              value={province}
              onChange={e => setProvince(e.target.value)}
              required
            />
            <div className="flex gap-2">
              <button
                type="submit"
                className="bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700"
                disabled={submitting}
              >
                {submitting ? "Adding..." : "Add"}
              </button>
              <button
                type="button"
                className="bg-gray-300 px-2 py-1 rounded"
                onClick={() => setShowForm(false)}
              >
                Cancel
              </button>
            </div>
            {error && <div className="text-red-600">{error}</div>}
          </form>
        ) : (
          <button
            className="bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700"
            onClick={() => setShowForm(true)}
          >
            + Branch
          </button>
        )}
      </td>
    </tr>
  );
}