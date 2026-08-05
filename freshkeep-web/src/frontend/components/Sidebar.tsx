import { Link, useLocation } from 'react-router-dom';
import { ScanLine, LayoutDashboard, ListChecks, Settings, Leaf, ShoppingCart, Trash2 } from 'lucide-react';

export function Sidebar() {
  const location = useLocation();

  const navItems = [
    { path: '/', icon: ScanLine, label: 'Scan Product' },
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/pantry', icon: ListChecks, label: 'Pantry' },
    { path: '/shopping-list', icon: ShoppingCart, label: 'Shopping List' },
    { path: '/waste-log', icon: Trash2, label: 'Waste Log' },
    { path: '/settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 h-full bg-white border-r border-gray-100 flex-shrink-0 z-40">
      <div className="flex items-center gap-3 p-6 border-b border-gray-100/50">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#86A789] to-emerald-600 flex items-center justify-center text-white shadow-sm">
          <Leaf className="w-4 h-4" />
        </div>
        <span className="font-extrabold text-gray-900 tracking-tight text-xl">FreshKeep</span>
      </div>
      
      <div className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
        {navItems.map(({ path, icon: Icon, label }) => {
          const isActive = location.pathname === path;
          return (
            <Link
              key={path}
              to={path}
              className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-200 font-medium ${
                isActive
                  ? 'bg-emerald-50 text-emerald-700 shadow-sm'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-emerald-600' : 'text-gray-400'}`} />
              {label}
            </Link>
          );
        })}
      </div>
    </aside>
  );
}
