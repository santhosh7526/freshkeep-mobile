import { useEffect, useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Toaster, toast } from 'sonner';
import { Leaf, LogOut, ShieldCheck, Radio, Sparkles } from 'lucide-react';
import { BottomNav } from '../components/BottomNav';
import { Sidebar } from '../components/Sidebar';
import { ThemeToggle } from '../components/ThemeToggle';
import { checkAndNotifyExpiringItems } from '../../backend/services/notifications';
import { useAuth } from '@freshkeep/shared';
import { usePantry } from '@freshkeep/shared';

const STORAGE_TIPS = [
  "Tip: Store apples in the fridge to keep them crisp for weeks!",
  "Tip: Tomatoes belong on the counter, not in the fridge.",
  "Tip: Wrap celery in aluminum foil before refrigerating to keep it crunchy.",
  "Tip: Store potatoes in a cool, dark place away from onions.",
  "Tip: Keep herbs fresh longer by storing them in a glass of water like flowers.",
  "Tip: Freeze ripe bananas for smoothies or baking later.",
  "Tip: Mushrooms stay freshest in a paper bag in the fridge.",
  "Tip: Don't wash berries until right before you eat them to prevent mold.",
  "Tip: Keep asparagus upright in a glass of water in the fridge.",
  "Tip: Avocado ripening can be sped up by placing it in a brown paper bag."
];

export default function Root() {
  const { user, logout } = useAuth();
  const { items } = usePantry();
  const navigate = useNavigate();
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  // Check expiring items on initial app load and trigger notifications
  useEffect(() => {
    if (items && items.length > 0) {
      checkAndNotifyExpiringItems(items);
    }
  }, [items]);
    
  // Show a random storage tip on mount
  useEffect(() => {
    const randomTip = STORAGE_TIPS[Math.floor(Math.random() * STORAGE_TIPS.length)];
    const timer = setTimeout(() => {
      toast(randomTip, {
        icon: '💡',
        duration: 5000,
      });
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  const handleLogout = () => {
    logout();
    toast.info('Signed out of Gmail Account');
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex overflow-hidden text-gray-900 dark:text-gray-100">
      
      {/* Desktop Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        
        {/* Top Header Bar */}
        <header className="sticky top-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 z-40 px-4 md:px-8 py-3">
          <div className="max-w-[1400px] mx-auto w-full flex items-center justify-between">
            
            {/* Logo for mobile only (desktop logo is in sidebar) */}
            <div className="flex items-center gap-2 md:hidden">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#86A789] to-emerald-600 flex items-center justify-center text-white shadow-sm">
                <Leaf className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-gray-900 dark:text-white text-sm tracking-tight">FreshKeep</span>
              </div>
            </div>
            
            {/* Spacer for desktop header */}
            <div className="hidden md:block flex-1"></div>

            <div className="flex items-center gap-3">
              <div className="md:hidden">
                <ThemeToggle />
              </div>
              
              {/* Authenticated Gmail / Supabase User Profile Pill */}
            {user && (
              <div className="relative">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center gap-2 py-1 px-2.5 rounded-full bg-emerald-50/90 dark:bg-emerald-900/30 hover:bg-emerald-100/90 dark:hover:bg-emerald-800/30 border border-emerald-200/60 dark:border-emerald-700/60 transition-all text-left shadow-2xs"
              >
                <img
                  src={user.picture}
                  alt={user.name}
                  className="w-6 h-6 rounded-full object-cover border border-white shadow-xs"
                />
                <span className="text-xs font-semibold text-gray-800 max-w-[90px] truncate">
                  {user.givenName}
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
              </button>

              {/* Profile Dropdown Menu */}
              {showProfileMenu && (
                <div
                  className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 p-3 z-50 animate-in fade-in zoom-in-95 duration-150"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center gap-2.5 pb-3 border-b border-gray-100">
                    <img
                      src={user.picture}
                      alt={user.name}
                      className="w-10 h-10 rounded-full object-cover border-2 border-emerald-200"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-gray-900 dark:text-white truncate">{user.name}</p>
                      <p className="text-[10px] text-gray-500 truncate">{user.email}</p>
                    </div>
                  </div>

                  <div className="py-2 space-y-1.5">
                    <div className="flex items-center justify-between text-[10px] font-semibold text-emerald-800 bg-emerald-50 p-2 rounded-xl border border-emerald-200/50">
                      <div className="flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Gmail Auth Session</span>
                      </div>
                      <span className="text-[9px] bg-emerald-200 text-emerald-900 px-1.5 py-0.5 rounded-md font-bold">
                        VERIFIED
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-[10px] text-gray-600 px-2 py-1">
                      <Radio className="w-3 h-3 text-emerald-500 animate-pulse" />
                      <span>Sync Engine: <strong className="text-gray-900">{user?.authProvider || 'Firebase Cloud'}</strong></span>
                    </div>
                  </div>

                  <button
                    onClick={handleLogout}
                    className="w-full mt-1 py-2 px-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Sign Out of Gmail Account
                  </button>
                </div>
              )}
            </div>
            )}
            </div>
          </div>
        </header>

        {/* Main Content Scrollable Area */}
        <main className="flex-1 overflow-y-auto pb-24 md:pb-8 w-full" onClick={() => setShowProfileMenu(false)}>
          <Outlet />
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden">
        <BottomNav />
      </div>
      
      <Toaster position="top-center" />
    </div>
  );
}
