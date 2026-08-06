import { Link, useLocation } from 'react-router-dom';
import { ScanLine, LayoutDashboard, ListChecks, Settings, Leaf, ShoppingCart, Trash2 } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';

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
    <aside className="hidden md:flex flex-col w-64 h-full bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800 flex-shrink-0 z-40">
      <div className="flex items-center gap-3 p-6 border-b border-gray-100/50 dark:border-gray-800/50">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#86A789] to-emerald-600 flex items-center justify-center text-white shadow-sm">
          <Leaf className="w-4 h-4" />
        </div>
        <span className="font-extrabold text-gray-900 dark:text-white tracking-tight text-xl">FreshKeep</span>
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
                  ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-emerald-600' : 'text-gray-400'}`} />
              {label}
            </Link>
          );
        })}
      </div>
      
      <div className="p-4 border-t border-gray-100/50 dark:border-gray-800/50">
        <ThemeToggle />
      </div>
    </aside>
  );
}
