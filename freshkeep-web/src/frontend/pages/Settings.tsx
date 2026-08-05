import { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Bell, Shield, LogOut, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { store } from '../../backend/storage/store';
import { NotificationSettings } from '../../backend/models/types';

export default function Settings() {
  const { user, signOut } = useAuth();
  
  const [activeTab, setActiveTab] = useState<'notifications' | 'account'>('notifications');
  const [settings, setSettings] = useState<NotificationSettings>({
    enabled: true,
    leadTimes: {
      dairy: 2,
      meat: 1,
      vegetables: 3,
      pantry: 7,
      canned: 30,
    }
  });
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    const saved = store.getSettings();
    if (saved) {
      setSettings(saved);
    }
  }, []);

  const handleSave = () => {
    store.setSettings(settings);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="w-full h-full bg-white md:bg-gray-50 flex justify-center pb-24 md:pb-8">
      <div className="max-w-5xl w-full mx-auto p-4 md:p-8">
        
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center text-gray-700">
            <SettingsIcon className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Settings</h1>
            <p className="text-sm text-gray-500 font-medium mt-1">
              Manage your preferences and account settings.
            </p>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-8">
          
          {/* Settings Sidebar */}
          <div className="w-full md:w-64 space-y-2 shrink-0">
            <button
              onClick={() => setActiveTab('notifications')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${
                activeTab === 'notifications' 
                  ? 'bg-[#86A789] text-white shadow-sm' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Bell className="w-4 h-4" />
              Notifications
            </button>
            <button
              onClick={() => setActiveTab('account')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${
                activeTab === 'account' 
                  ? 'bg-[#86A789] text-white shadow-sm' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Shield className="w-4 h-4" />
              Account & Security
            </button>
          </div>

          {/* Settings Content Pane */}
          <div className="flex-1 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            
            {activeTab === 'notifications' && (
              <div className="p-6 md:p-8">
                <div className="flex items-center justify-between mb-8 pb-6 border-b border-gray-100">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Push Notifications</h2>
                    <p className="text-sm text-gray-500 mt-1">Receive alerts before your food expires.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer"
                      checked={settings.enabled}
                      onChange={(e) => setSettings({...settings, enabled: e.target.checked})}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#86A789]"></div>
                  </label>
                </div>

                <div className={`space-y-6 transition-opacity ${!settings.enabled ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
                  <div>
                    <h3 className="text-sm font-bold text-gray-900 mb-4">Advance Warning Lead Times</h3>
                    <p className="text-xs text-gray-500 mb-6">How many days in advance should we notify you for different categories?</p>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      {Object.entries(settings.leadTimes).map(([category, days]) => (
                        <div key={category} className="space-y-2">
                          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex justify-between">
                            <span className="capitalize">{category}</span>
                            <span>{days} days</span>
                          </label>
                          <input
                            type="range"
                            min="1"
                            max="30"
                            value={days}
                            onChange={(e) => setSettings({
                              ...settings,
                              leadTimes: {
                                ...settings.leadTimes,
                                [category]: parseInt(e.target.value)
                              }
                            })}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#86A789]"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-gray-100 flex items-center justify-between">
                  {savedSuccess ? (
                    <div className="flex items-center gap-2 text-emerald-600">
                      <CheckCircle2 className="w-5 h-5" />
                      <span className="text-sm font-bold">Preferences saved</span>
                    </div>
                  ) : <div></div>}
                  <button 
                    onClick={handleSave}
                    className="px-6 py-2.5 bg-[#86A789] hover:bg-[#729275] text-white rounded-xl font-bold text-sm shadow-sm transition-all"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'account' && (
              <div className="p-6 md:p-8">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Account Profile</h2>
                
                <div className="flex items-center gap-4 mb-8 p-4 bg-gray-50 rounded-xl border border-gray-100">
                  {user?.photoUrl ? (
                    <img src={user.photoUrl} alt="Profile" className="w-16 h-16 rounded-full shadow-sm object-cover" />
                  ) : (
                    <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center text-xl font-bold">
                      {user?.givenName?.charAt(0) || user?.name?.charAt(0) || 'U'}
                    </div>
                  )}
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{user?.name || 'FreshKeep User'}</h3>
                    <p className="text-sm text-gray-500 font-medium">{user?.email || 'No email provided'}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-gray-900 mb-2">Danger Zone</h3>
                  <button
                    onClick={() => {
                      if (confirm('Are you sure you want to sign out?')) {
                        signOut();
                      }
                    }}
                    className="w-full sm:w-auto px-6 py-3 bg-red-50 hover:bg-red-100 text-red-700 rounded-xl font-bold text-sm transition-colors border border-red-100 flex items-center justify-center gap-2"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              </div>
            )}
            
          </div>
        </div>

      </div>
    </div>
  );
}
