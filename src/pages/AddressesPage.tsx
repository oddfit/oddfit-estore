// src/pages/AddressesPage.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, PlusCircle, Pencil, Trash2, Star } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import type { Address } from '../types';
import {
  getAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
} from '../services/addresses';

type AddressForm = Omit<Address, 'id'>;

const emptyForm: AddressForm = {
  type: 'home',
  name: '',
  phone: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  state: '',
  zipCode: '',
  country: 'India',
  isDefault: false,
};

const AddressesPage: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const isLoggedIn = !!currentUser && !currentUser.isAnonymous;

  const [rows, setRows] = useState<Address[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchErr, setFetchErr] = useState('');

  // Add modal
  const [addOpen, setAddOpen] = useState(false);
  const [newForm, setNewForm] = useState<AddressForm>(emptyForm);

  // Edit modal
  const [editOpen, setEditOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<AddressForm>(emptyForm);

  // Redirect to login if needed
  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/login?redirect=/profile/addresses', { replace: true });
    }
  }, [isLoggedIn, navigate]);

  // Fetch addresses for this user
  useEffect(() => {
    const load = async () => {
      if (!currentUser) return;
      try {
        setLoading(true);
        setFetchErr('');
        const list = await getAddresses(currentUser.uid);
        // Default first
        const sorted = [...list].sort((a, b) => Number(b.isDefault) - Number(a.isDefault));
        setRows(sorted);
      } catch (e: any) {
        console.error('Failed to load addresses:', e);
        setFetchErr(e?.message || 'Failed to load addresses.');
      } finally {
        setLoading(false);
      }
    };
    if (currentUser) load();
  }, [currentUser]);

  // Don’t render the page content until after hooks if not logged in
  if (!isLoggedIn) return <div />;

  const defaultAddress = useMemo(() => rows.find((r) => r.isDefault), [rows]);

  /* ---------------------- Add ---------------------- */
  const openAdd = () => {
    setNewForm({ ...emptyForm, isDefault: rows.length === 0 }); // first one defaults
    setAddOpen(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    if (
      !newForm.name ||
      !newForm.phone ||
      !newForm.addressLine1 ||
      !newForm.city ||
      !newForm.state ||
      !newForm.zipCode
    ) {
      alert('Please fill all required fields.');
      return;
    }
    try {
      await createAddress(currentUser.uid, newForm);
      setAddOpen(false);
      setNewForm(emptyForm);
      // refetch
      const list = await getAddresses(currentUser.uid);
      const sorted = [...list].sort((a, b) => Number(b.isDefault) - Number(a.isDefault));
      setRows(sorted);
    } catch (e: any) {
      console.error('Create address failed:', e);
      alert(e?.message || 'Failed to add address.');
    }
  };

  /* ---------------------- Edit --------------------- */
  const openEdit = (a: Address) => {
    const { id, ...rest } = a;
    setEditingId(id);
    setEditForm(rest);
    setEditOpen(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !editingId) return;
    if (
      !editForm.name ||
      !editForm.phone ||
      !editForm.addressLine1 ||
      !editForm.city ||
      !editForm.state ||
      !editForm.zipCode
    ) {
      alert('Please fill all required fields.');
      return;
    }
    try {
      await updateAddress(currentUser.uid, editingId, editForm);
      setEditOpen(false);
      setEditingId(null);
      // refetch
      const list = await getAddresses(currentUser.uid);
      const sorted = [...list].sort((a, b) => Number(b.isDefault) - Number(a.isDefault));
      setRows(sorted);
    } catch (e: any) {
      console.error('Update address failed:', e);
      alert(e?.message || 'Failed to update address.');
    }
  };

  /* ------------------- Set Default ------------------ */
  const handleSetDefault = async (id: string) => {
    if (!currentUser) return;
    try {
      await setDefaultAddress(currentUser.uid, id);
      // refetch
      const list = await getAddresses(currentUser.uid);
      const sorted = [...list].sort((a, b) => Number(b.isDefault) - Number(a.isDefault));
      setRows(sorted);
    } catch (e: any) {
      console.error('Set default failed:', e);
      alert(e?.message || 'Failed to set default address.');
    }
  };

  /* ---------------------- Delete ------------------- */
  const handleDelete = async (id: string) => {
    if (!currentUser) return;
    if (!confirm('Delete this address?')) return;
    try {
      await deleteAddress(currentUser.uid, id);
      // refetch
      const list = await getAddresses(currentUser.uid);
      const sorted = [...list].sort((a, b) => Number(b.isDefault) - Number(a.isDefault));
      setRows(sorted);
    } catch (e: any) {
      console.error('Delete address failed:', e);
      alert(e?.message || 'Failed to delete address.');
    }
  };

  /* ------------------------ UI --------------------- */
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold">My Addresses</h1>
          <Button onClick={openAdd}>
            <PlusCircle className="h-4 w-4 mr-2" />
            Add Address
          </Button>
        </div>

        {fetchErr && (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
            {fetchErr}
          </div>
        )}

        <div className="bg-white rounded-lg shadow-sm p-4">
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600" />
              Loading…
            </div>
          ) : rows.length === 0 ? (
            <div className="text-sm text-gray-600 p-4">No addresses yet. Add your first address.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {rows.map((a) => (
                <div
                  key={a.id}
                  className="rounded-lg border border-gray-200 bg-white p-4 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="inline-flex items-center gap-2 text-sm font-medium text-gray-900">
                        <MapPin className="h-4 w-4 text-gray-500" />
                        {a.name}
                      </div>
                      {a.isDefault ? (
                        <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded bg-green-100 text-green-700">
                          <Star className="h-3.5 w-3.5 fill-green-600" />
                          Default
                        </span>
                      ) : null}
                    </div>

                    <div className="text-sm text-gray-700 space-y-1">
                      <div>{a.phone}</div>
                      <div>{a.addressLine1}</div>
                      {a.addressLine2 && <div>{a.addressLine2}</div>}
                      <div>
                        {a.city}, {a.state} {a.zipCode}
                      </div>
                      <div>{a.country}</div>
                      <div className="text-xs text-gray-500 mt-1 capitalize">Type: {a.type}</div>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => openEdit(a)}>
                        <Pencil className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button size="sm" variant="danger" onClick={() => handleDelete(a.id)}>
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                    {!a.isDefault && (
                      <Button size="sm" onClick={() => handleSetDefault(a.id)}>
                        Set Default
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add Address Modal */}
      <Modal isOpen={addOpen} onClose={() => setAddOpen(false)} title="Add Address">
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select
                value={newForm.type}
                onChange={(e) => setNewForm((f) => ({ ...f, type: e.target.value as AddressForm['type'] }))}
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="home">home</option>
                <option value="work">work</option>
                <option value="other">other</option>
              </select>
            </div>
            <Input
              label="Full Name"
              value={newForm.name}
              onChange={(e) => setNewForm((f) => ({ ...f, name: e.target.value }))}
              required
            />
          </div>

          <Input
            label="Phone Number"
            value={newForm.phone}
            onChange={(e) => setNewForm((f) => ({ ...f, phone: e.target.value }))}
            required
          />
          <Input
            label="Address Line 1"
            value={newForm.addressLine1}
            onChange={(e) => setNewForm((f) => ({ ...f, addressLine1: e.target.value }))}
            required
          />
          <Input
            label="Address Line 2 (Optional)"
            value={newForm.addressLine2 || ''}
            onChange={(e) => setNewForm((f) => ({ ...f, addressLine2: e.target.value }))}
          />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input
              label="City"
              value={newForm.city}
              onChange={(e) => setNewForm((f) => ({ ...f, city: e.target.value }))}
              required
            />
            <Input
              label="State"
              value={newForm.state}
              onChange={(e) => setNewForm((f) => ({ ...f, state: e.target.value }))}
              required
            />
            <Input
              label="ZIP Code"
              value={newForm.zipCode}
              onChange={(e) => setNewForm((f) => ({ ...f, zipCode: e.target.value }))}
              required
            />
          </div>

          <Input
            label="Country"
            value={newForm.country}
            onChange={(e) => setNewForm((f) => ({ ...f, country: e.target.value }))}
            required
          />

          <label className="inline-flex items-center gap-2">
            <input
              type="checkbox"
              checked={newForm.isDefault}
              onChange={(e) => setNewForm((f) => ({ ...f, isDefault: e.target.checked }))}
            />
            <span className="text-sm text-gray-700">Make this my default address</span>
          </label>

          <div className="flex gap-3 pt-2">
            <Button type="submit">
              <PlusCircle className="h-4 w-4 mr-2" />
              Save Address
            </Button>
            <Button type="button" variant="outline" onClick={() => setAddOpen(false)}>
              Cancel
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Address Modal */}
      <Modal
        isOpen={editOpen}
        onClose={() => {
          setEditOpen(false);
          setEditingId(null);
        }}
        title="Edit Address"
      >
        <form onSubmit={handleUpdate} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select
                value={editForm.type}
                onChange={(e) => setEditForm((f) => ({ ...f, type: e.target.value as AddressForm['type'] }))}
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="home">home</option>
                <option value="work">work</option>
                <option value="other">other</option>
              </select>
            </div>
            <Input
              label="Full Name"
              value={editForm.name}
              onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
              required
            />
          </div>

          <Input
            label="Phone Number"
            value={editForm.phone}
            onChange={(e) => setEditForm((f) => ({ ...f, phone: e.target.value }))}
            required
          />
          <Input
            label="Address Line 1"
            value={editForm.addressLine1}
            onChange={(e) => setEditForm((f) => ({ ...f, addressLine1: e.target.value }))}
            required
          />
          <Input
            label="Address Line 2 (Optional)"
            value={editForm.addressLine2 || ''}
            onChange={(e) => setEditForm((f) => ({ ...f, addressLine2: e.target.value }))}
          />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input
              label="City"
              value={editForm.city}
              onChange={(e) => setEditForm((f) => ({ ...f, city: e.target.value }))}
              required
            />
            <Input
              label="State"
              value={editForm.state}
              onChange={(e) => setEditForm((f) => ({ ...f, state: e.target.value }))}
              required
            />
            <Input
              label="ZIP Code"
              value={editForm.zipCode}
              onChange={(e) => setEditForm((f) => ({ ...f, zipCode: e.target.value }))}
              required
            />
          </div>

          <Input
            label="Country"
            value={editForm.country}
            onChange={(e) => setEditForm((f) => ({ ...f, country: e.target.value }))}
            required
          />

          <label className="inline-flex items-center gap-2">
            <input
              type="checkbox"
              checked={editForm.isDefault}
              onChange={(e) => setEditForm((f) => ({ ...f, isDefault: e.target.checked }))}
            />
            <span className="text-sm text-gray-700">Set as default</span>
          </label>

          <div className="flex gap-3 pt-2">
            <Button type="submit">Save Changes</Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setEditOpen(false);
                setEditingId(null);
              }}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AddressesPage;
