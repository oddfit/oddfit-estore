import React, { useEffect, useMemo, useState } from 'react';
import { PlusCircle, RefreshCcw, Pencil, Trash2 } from 'lucide-react';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import { AdminCustomersService } from '../services/firestore';

type Customer = {
  id: string;
  name?: string;
  phone?: string;
  email?: string;
  isAdmin?: boolean;
  role?: 'user' | 'admin';
  createdAt?: any;  // Firestore Timestamp | Date
  updatedAt?: any;
};

function toJsDate(v: any): Date | null {
  if (!v) return null;
  if (v?.toDate) return v.toDate(); // Firestore Timestamp
  if (v instanceof Date) return v;
  return null;
}

const AdminCustomers: React.FC = () => {
  const [rows, setRows] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchErr, setFetchErr] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  // Add form
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<'user' | 'admin'>('user');
  const [newIsAdmin, setNewIsAdmin] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Edit form
  const [editing, setEditing] = useState<Customer | null>(null);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editRole, setEditRole] = useState<'user' | 'admin'>('user');
  const [editIsAdmin, setEditIsAdmin] = useState(false);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      setFetchErr('');
      const list = await AdminCustomersService.getAll();
      setRows(
        list.map((r: any) => ({
          id: r.id,
          name: r.name ?? '',
          phone: r.phone ?? '',
          email: r.email ?? '',
          isAdmin: !!r.isAdmin,
          role: (r.role as 'user' | 'admin') ?? (r.isAdmin ? 'admin' : 'user'),
          createdAt: r.createdAt,
          updatedAt: r.updatedAt,
        }))
      );
    } catch (e: any) {
      console.error('Fetch users failed:', e);
      setFetchErr(e?.message || 'Failed to load customers.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  /* --------------------------- Add --------------------------- */
  const openAdd = () => {
    setNewName('');
    setNewPhone('');
    setNewEmail('');
    setNewRole('user');
    setNewIsAdmin(false);
    setAddOpen(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return alert('Name is required.');
    if (!newPhone.trim()) return alert('Phone is required.');

    try {
      setSubmitting(true);
      await AdminCustomersService.create({
        name: newName.trim(),
        phone: newPhone.trim(),
        email: newEmail.trim() || null,
        role: newRole,
        isAdmin: newRole === 'admin' || newIsAdmin,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      setAddOpen(false);
      await fetchCustomers();
    } catch (e: any) {
      console.error('Create user failed:', e);
      alert(e?.message || 'Failed to add customer.');
    } finally {
      setSubmitting(false);
    }
  };

  /* --------------------------- Edit -------------------------- */
  const openEdit = (c: Customer) => {
    setEditing(c);
    setEditName(c.name || '');
    setEditPhone(c.phone || '');
    setEditEmail(c.email || '');
    const role = c.role ?? (c.isAdmin ? 'admin' : 'user');
    setEditRole(role);
    setEditIsAdmin(!!c.isAdmin);
    setEditOpen(true);
  };

  const handleUpdate = async () => {
    if (!editing) return;
    if (!editName.trim()) return alert('Name is required.');
    if (!editPhone.trim()) return alert('Phone is required.');

    try {
      setSubmitting(true);
      await AdminCustomersService.update(editing.id, {
        name: editName.trim(),
        phone: editPhone.trim(),
        email: editEmail.trim() || null,
        role: editRole,
        isAdmin: editRole === 'admin' || editIsAdmin,
        updatedAt: new Date(),
      });
      setEditOpen(false);
      setEditing(null);
      await fetchCustomers();
    } catch (e: any) {
      console.error('Update user failed:', e);
      alert(e?.message || 'Update failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!editing) return;
    if (!confirm('Delete this customer?')) return;
    try {
      await AdminCustomersService.delete(editing.id);
      setEditOpen(false);
      setEditing(null);
      await fetchCustomers();
    } catch (e: any) {
      console.error('Delete user failed:', e);
      alert(e?.message || 'Delete failed.');
    }
  };

  /* --------------------------- UI --------------------------- */
  const sorted = useMemo(
    () =>
      [...rows].sort((a, b) => {
        const ad = toJsDate(a.createdAt)?.getTime() ?? 0;
        const bd = toJsDate(b.createdAt)?.getTime() ?? 0;
        return bd - ad;
      }),
    [rows]
  );

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Customers</h1>
        <div className="flex gap-3">
          <Button variant="outline" onClick={fetchCustomers}>
            <RefreshCcw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={openAdd}>
            <PlusCircle className="h-4 w-4 mr-2" />
            Add Customer
          </Button>
        </div>
      </div>

      {fetchErr && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
          {fetchErr}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm p-4 overflow-x-auto">
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600" />
            Loading…
          </div>
        ) : sorted.length === 0 ? (
          <div className="text-sm text-gray-500 p-4">No customers yet.</div>
        ) : (
          <table className="min-w-[700px] text-sm">
            <thead>
              <tr className="text-left border-b">
                <th className="py-2 pr-4">Name</th>
                <th className="py-2 pr-4">Phone</th>
                <th className="py-2 pr-4">Email</th>
                <th className="py-2 pr-4">Role</th>
                <th className="py-2 pr-4">Created</th>
                <th className="py-2 pr-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((c) => (
                <tr key={c.id} className="border-b last:border-0">
                  <td className="py-2 pr-4">{c.name || '—'}</td>
                  <td className="py-2 pr-4">{c.phone || '—'}</td>
                  <td className="py-2 pr-4">{c.email || '—'}</td>
                  <td className="py-2 pr-4">
                    <span
                      className={`px-2 py-0.5 rounded text-xs ${
                        c.role === 'admin' || c.isAdmin
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {(c.role ?? (c.isAdmin ? 'admin' : 'user')).toUpperCase()}
                    </span>
                  </td>
                  <td className="py-2 pr-4">
                    {toJsDate(c.createdAt)?.toLocaleDateString() || '—'}
                  </td>
                  <td className="py-2 pr-4">
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => openEdit(c)}>
                        <Pencil className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add Customer */}
      <Modal isOpen={addOpen} onClose={() => setAddOpen(false)} title="Add Customer">
        <form onSubmit={handleCreate} className="space-y-4">
          <Input label="Name" value={newName} onChange={(e) => setNewName(e.target.value)} required />
          <Input label="Phone" value={newPhone} onChange={(e) => setNewPhone(e.target.value)} required />
          <Input label="Email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <select
              value={newRole}
              onChange={(e) => setNewRole(e.target.value as 'user' | 'admin')}
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
            <label className="inline-flex items-center gap-2 mt-3">
              <input
                type="checkbox"
                checked={newIsAdmin}
                onChange={(e) => setNewIsAdmin(e.target.checked)}
              />
              <span className="text-sm text-gray-700">Also set <b>isAdmin</b></span>
            </label>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit" loading={submitting}>
              <PlusCircle className="h-4 w-4 mr-2" />
              Create
            </Button>
            <Button type="button" variant="outline" onClick={() => setAddOpen(false)} disabled={submitting}>
              Cancel
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Customer */}
      <Modal
        isOpen={editOpen}
        onClose={() => {
          setEditOpen(false);
          setEditing(null);
        }}
        title="Edit Customer"
      >
        {!editing ? null : (
          <div className="space-y-4">
            <Input label="Name" value={editName} onChange={(e) => setEditName(e.target.value)} required />
            <Input label="Phone" value={editPhone} onChange={(e) => setEditPhone(e.target.value)} required />
            <Input label="Email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
              <select
                value={editRole}
                onChange={(e) => setEditRole(e.target.value as 'user' | 'admin')}
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
              <label className="inline-flex items-center gap-2 mt-3">
                <input
                  type="checkbox"
                  checked={editIsAdmin}
                  onChange={(e) => setEditIsAdmin(e.target.checked)}
                />
                <span className="text-sm text-gray-700">Also set <b>isAdmin</b></span>
              </label>
            </div>

            <div className="flex gap-3 pt-2">
              <Button onClick={handleUpdate} loading={submitting}>Save Changes</Button>
              <Button variant="danger" onClick={handleDelete} disabled={submitting}>
                <Trash2 className="h-4 w-4 mr-1" />
                Delete
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setEditOpen(false);
                  setEditing(null);
                }}
                disabled={submitting}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AdminCustomers;
