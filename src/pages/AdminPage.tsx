import React, { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Menu } from 'lucide-react';
import Button from '../components/ui/Button';
import Sidebar from '../components/admin/Sidebar'; // <-- add this file below

const AdminPage: React.FC = () => {
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Close the mobile drawer when viewport becomes desktop
  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 768) setDrawerOpen(false);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Desktop sidebar */}
      <aside className="hidden md:block w-56 shrink-0 border-r bg-white">
        <Sidebar />
      </aside>

      {/* Mobile top bar */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-30 bg-[#d25c4d] text-white">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={() => setDrawerOpen(true)}
            className="inline-flex items-center gap-2"
            aria-label="Open menu"
          >
            <Menu className="h-6 w-6" />
            <span className="font-semibold">Menu</span>
          </button>
          <span className="font-bold tracking-wide">Admin</span>
          <span className="w-6" />
        </div>
      </header>

      {/* Mobile drawer */}
      <div
        className={`md:hidden fixed inset-0 z-40 transition ${drawerOpen ? '' : 'pointer-events-none'}`}
        aria-hidden={!drawerOpen}
      >
        {/* scrim */}
        <div
          className={`absolute inset-0 bg-black/40 transition-opacity ${drawerOpen ? 'opacity-100' : 'opacity-0'}`}
          onClick={() => setDrawerOpen(false)}
        />
        {/* panel */}
        <div
          className={`absolute inset-y-0 left-0 w-64 bg-white shadow-xl transform transition-transform
            ${drawerOpen ? 'translate-x-0' : '-translate-x-full'}`}
          role="dialog"
          aria-modal="true"
        >
          <div className="flex justify-end p-2">
            <Button variant="outline" size="sm" onClick={() => setDrawerOpen(false)}>
              Close
            </Button>
          </div>
          <Sidebar onNavigate={() => setDrawerOpen(false)} />
        </div>
      </div>

      {/* Main content (pad top under fixed mobile header) */}
      <main className="flex-1 w-full p-4 md:p-6 pt-16 md:pt-6">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminPage;
