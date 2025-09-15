import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Package, Tag, Users, RefreshCw, Settings, Receipt,
} from 'lucide-react';

type SidebarProps = {
  onNavigate?: () => void; // lets us close the drawer on mobile after clicking
};

const nav = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/orders', label: 'Orders', icon: Receipt },
  { to: '/admin/products', label: 'Products', icon: Package },
  { to: '/admin/categories', label: 'Categories', icon: Tag },
  { to: '/admin/customers', label: 'Customers', icon: Users },
  { to: '/admin/returns', label: 'Returns', icon: RefreshCw },
  { to: '/admin/settings', label: 'Settings', icon: Settings },
];

const Sidebar: React.FC<SidebarProps> = ({ onNavigate }) => {
  return (
    <nav className="h-full overflow-y-auto">
      <div className="px-4 py-4 border-b">
        <h2 className="text-lg font-bold text-gray-900">Admin</h2>
        <p className="text-xs text-gray-500">Control panel</p>
      </div>
      <ul className="p-2">
        {nav.map(({ to, label, icon: Icon, end }) => (
          <li key={to}>
            <NavLink
              to={to}
              end={end as boolean | undefined}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition
                 ${isActive
                   ? 'bg-gray-100 text-gray-900 font-medium'
                   : 'text-gray-700 hover:bg-gray-50'}`
              }
              onClick={onNavigate}
            >
              <Icon className="h-4 w-4" />
              <span>{label}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
};

export default Sidebar;
