// src/pages/ProfilePage.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { User, MapPin, Package, Heart, Settings, LogOut, Edit, Shield } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link, Navigate, useLocation } from 'react-router-dom';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';

const ProfilePage: React.FC = () => {
  const { currentUser, userProfile, logout, loading, isAdmin, updateName } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    name: userProfile?.name || '',
    phone: userProfile?.phone || '',
  });

  // --- Complete Profile (name) prompt state ---
  const dismissKey = useMemo(
    () => (currentUser ? `dismiss_profile_name_${currentUser.uid}` : ''),
    [currentUser]
  );
  const needsName = !!currentUser && (!userProfile?.name || userProfile.name.trim() === '');
  const [showNamePrompt, setShowNamePrompt] = useState(false);
  const [nameInput, setNameInput] = useState('');

  useEffect(() => {
    if (!loading && needsName && currentUser) {
      const dismissed = localStorage.getItem(dismissKey) === '1';
      setShowNamePrompt(!dismissed);
    } else {
      setShowNamePrompt(false);
    }
  }, [loading, needsName, currentUser, dismissKey]);

  const handleSaveName = async () => {
    const n = nameInput.trim();
    if (!n) return;
    try {
      await updateName(n);
      setShowNamePrompt(false);
      localStorage.setItem(dismissKey, '1');
    } catch (e) {
      console.error('Failed to update name:', e);
      // You can show a toast or inline error if you want.
    }
  };

  const handleSkipName = () => {
    setShowNamePrompt(false);
    if (dismissKey) localStorage.setItem(dismissKey, '1');
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname)}`} replace />;
  }

  const menuItems = [
    { icon: Package, label: 'Order History', path: '/orders' },
    { icon: Heart, label: 'Wishlist', path: '/wishlist' },
    { icon: MapPin, label: 'Addresses', path: '/addresses' },
    { icon: Settings, label: 'Settings', path: '/settings' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between gap-6">
            <div className="flex items-center">
              <div className="w-20 h-20 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center">
                <User className="h-10 w-10 text-white" />
              </div>
              <div className="ml-6">
                <h1 className="text-2xl font-bold text-gray-900">
                  {userProfile?.name || currentUser.displayName || 'User'}
                </h1>
                <p className="text-gray-600">{userProfile?.phone || currentUser.phoneNumber}</p>
                <p className="text-sm text-gray-500">
                  Member since{' '}
                  {currentUser.metadata.creationTime
                    ? new Date(currentUser.metadata.creationTime).toLocaleDateString()
                    : 'Recently'}
                </p>
              </div>
            </div>

            <Button variant="outline" onClick={() => setShowEditModal(true)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Profile
            </Button>
          </div>
        </div>

        {/* Complete profile prompt (only when name missing & not dismissed) */}
        {showNamePrompt && (
          <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4">
            <div className="flex items-center justify-between gap-4">
              <div className="text-amber-900">
                <div className="font-medium">Complete your profile</div>
                <div className="text-sm opacity-90">Add your name to personalize your account.</div>
              </div>
              <Button size="sm" onClick={() => setShowNamePrompt(true)}>
                Add Name
              </Button>
            </div>
          </div>
        )}

        {/* Admin access card (only for admins) */}
        {isAdmin && (
          <div className="mb-6 rounded-lg border border-purple-200 bg-purple-50 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Shield className="h-5 w-5 text-purple-700" />
                <div>
                  <div className="font-medium text-purple-900">Admin access</div>
                  <div className="text-sm text-purple-800/80">
                    Manage products, categories, and orders
                  </div>
                </div>
              </div>
              <Link to="/admin">
                <Button size="sm" variant="brand">Open Admin</Button>
              </Link>
            </div>
          </div>
        )}

        {/* Menu Items */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {menuItems.map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow text-left group"
            >
              <div className="flex items-center">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                  <item.icon className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">{item.label}</h3>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Logout */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <Button variant="danger" onClick={handleLogout} className="w-full sm:w-auto">
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>

        {/* Edit Profile Modal (existing) */}
        <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Edit Profile">
          <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
            <Input
              label="Full Name"
              value={editForm.name}
              onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))}
            />
            <Input
              label="Phone Number"
              value={editForm.phone}
              onChange={(e) => setEditForm((prev) => ({ ...prev, phone: e.target.value }))}
              disabled
              helperText="Phone number cannot be changed"
            />
            <div className="flex space-x-4 pt-4">
              <Button type="button" variant="outline" onClick={() => setShowEditModal(false)} className="flex-1">
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1"
                onClick={async () => {
                  const n = editForm.name.trim();
                  if (!n) return;
                  await updateName(n);
                  setShowEditModal(false);
                }}
              >
                Save Changes
              </Button>
            </div>
          </form>
        </Modal>

        {/* Tiny "Add name" modal (only when prompt is shown) */}
        <Modal
          isOpen={showNamePrompt}
          onClose={handleSkipName}
          title="Add your name"
        >
          <div className="space-y-4">
            <Input
              label="Full Name"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              placeholder="e.g., Aisha Khan"
              autoFocus
              required
            />
            <div className="flex gap-3 pt-2">
              <Button className="flex-1" onClick={handleSaveName}>Save</Button>
              <Button className="flex-1" variant="outline" onClick={handleSkipName}>
                Skip for now
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
};

export default ProfilePage;
