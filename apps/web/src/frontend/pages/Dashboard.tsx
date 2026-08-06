import { useState, useEffect, useMemo } from 'react';
import { Leaf, Plus, ScanLine, ListChecks, Trash2, ArrowRight, Package, AlertTriangle, CheckCircle2, ChevronRight, Activity, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { FoodItem } from '../../backend/models/types';
import { calculateFreshnessScore, getDaysLeft, getCategoryIcon } from '../../backend/logic/helpers';
import { useAuth } from '@freshkeep/shared';
import { usePantry } from '@freshkeep/shared';

export default function Dashboard() {
  const { user } = useAuth();
  const { items } = usePantry();
  const navigate = useNavigate();
  
  const [totalInventoryValue, setTotalInventoryValue] = useState(0);
  const [moneySaved, setMoneySaved] = useState(0);
  const [recentlyScanned, setRecentlyScanned] = useState<FoodItem[]>([]);
  const [itemsWithFreshness, setItemsWithFreshness] = useState<FoodItem[]>([]);

  useEffect(() => {
    const freshItems = items.map(item => ({
      ...item,
      freshnessScore: calculateFreshnessScore(item),
    }));
    
    // Sort by addedDate for recently scanned
    const sorted = [...freshItems].sort((a, b) => new Date(b.addedDate).getTime() - new Date(a.addedDate).getTime());
    setRecentlyScanned(sorted.slice(0, 5));
    
    setItemsWithFreshness(freshItems);

    // Stats
    let inventorySum = 0;
    items.forEach(item => {
      const price = Number(item.price) || 50;
      const qty = Number(item.quantity) || 1;
      inventorySum += (isNaN(price) ? 50 : price) * (isNaN(qty) ? 1 : qty);
    });
    setTotalInventoryValue(isNaN(inventorySum) ? 0 : Math.round(inventorySum));
    
    // Fake waste saved metric for now based on items remaining
    const saved = items.filter(item => getDaysLeft(item.expiryDate) > 0).length * 150;
    setMoneySaved(isNaN(saved) ? 0 : Math.round(saved));
  }, [items]);

  // Expiry risk classification
  const expiredItems = useMemo(() => itemsWithFreshness.filter(i => i.expiryDate && getDaysLeft(i.expiryDate) < 0), [itemsWithFreshness]);
  const expiringSoonItems = useMemo(() => itemsWithFreshness.filter(i => i.expiryDate && getDaysLeft(i.expiryDate) >= 0 && getDaysLeft(i.expiryDate) <= 7), [itemsWithFreshness]);
  const freshItems = useMemo(() => itemsWithFreshness.filter(i => i.expiryDate && getDaysLeft(i.expiryDate) > 7), [itemsWithFreshness]);
  const unknownExpiryItems = useMemo(() => itemsWithFreshness.filter(i => !i.expiryDate), [itemsWithFreshness]);

  // Category breakdown
  const categoryStats = useMemo(() => {
    return (['dairy', 'meat', 'vegetables', 'pantry', 'canned'] as const).map(cat => {
      const catItems = itemsWithFreshness.filter(i => i.category === cat);
      return {
        category: cat,
        count: catItems.length,
        percentage: itemsWithFreshness.length > 0 ? Math.round((catItems.length / itemsWithFreshness.length) * 100) : 0,
      };
    });
  }, [itemsWithFreshness]);

  const CATEGORY_COLORS: Record<string, string> = {
    dairy: '#3b82f6',
    meat: '#ef4444',
    vegetables: '#22c55e',
    pantry: '#eab308',
    canned: '#8b5cf6',
  };

  const getStatusBadge = (days: number) => {
    if (days < 0) {
      return (
        <div className="px-2.5 py-1 bg-red-100 rounded-full">
          <span className="text-[10px] font-bold text-red-700">Expired</span>
        </div>
      );
    }
    if (days <= 7) {
      return (
        <div className="px-2.5 py-1 bg-amber-100 rounded-full">
          <span className="text-[10px] font-bold text-amber-700">Expiring Soon</span>
        </div>
      );
    }
    return (
      <div className="px-2.5 py-1 bg-emerald-100 rounded-full">
        <span className="text-[10px] font-bold text-emerald-700">Fresh</span>
      </div>
    );
  };

  return (
    <div className="w-full h-full bg-white dark:bg-gray-900 md:bg-gray-50 md:dark:bg-gray-900 pb-24 md:pb-8">
      <div className="max-w-[1400px] w-full mx-auto p-4 md:p-8">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <span className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
              Good morning, {user?.givenName || user?.name || 'Santhosh'} 👋
            </span>
            <span className="block text-sm text-gray-500 dark:text-gray-400 font-medium mt-1">
              Here's what's happening with your pantry today.
            </span>
          </div>
          <div className="flex flex-row gap-3">
            <button 
              onClick={() => navigate('/pantry')} 
              className="px-5 py-2.5 bg-white border border-gray-200 rounded-xl flex flex-row items-center gap-2 shadow-sm"
            >
              <Plus color="#374151" size={16} />
              <span className="text-gray-700 font-bold text-sm">Add Manually</span>
            </button>
            <button 
              onClick={() => navigate('/')} 
              className="px-5 py-2.5 bg-[#86A789] rounded-xl flex flex-row items-center gap-2 shadow-sm"
            >
              <ScanLine color="#ffffff" size={16} />
              <span className="text-white font-bold text-sm">Scan Product</span>
            </button>
          </div>
        </div>

        {/* 4-Column Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col justify-between">
            <div className="flex flex-row items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                <Package color="#2563eb" size={20} />
              </div>
              <span className="text-sm font-bold text-gray-500">TOTAL ITEMS</span>
            </div>
            <div>
              <span className="text-3xl font-black text-gray-900">{items.length}</span>
              <span className="text-xs font-semibold text-gray-400 mt-1">Items in pantry</span>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col justify-between">
            <div className="flex flex-row items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                <AlertTriangle color="#d97706" size={20} />
              </div>
              <span className="text-sm font-bold text-gray-500">EXPIRING SOON</span>
            </div>
            <div>
              <span className="text-3xl font-black text-gray-900">{expiringSoonItems.length}</span>
              <span className="text-xs font-semibold text-gray-400 mt-1">Within 7 days</span>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col justify-between">
            <div className="flex flex-row items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
                <Calendar color="#dc2626" size={20} />
              </div>
              <span className="text-sm font-bold text-gray-500">EXPIRED</span>
            </div>
            <div>
              <span className="text-3xl font-black text-gray-900">{expiredItems.length}</span>
              <span className="text-xs font-semibold text-gray-400 mt-1">Need attention</span>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col justify-between">
            <div className="flex flex-row items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                <Leaf color="#059669" size={20} />
              </div>
              <span className="text-sm font-bold text-gray-500">WASTE SAVED</span>
            </div>
            <div>
              <span className="text-3xl font-black text-gray-900">₹{moneySaved}</span>
              <span className="text-xs font-semibold text-gray-400 mt-1">Estimated value</span>
            </div>
          </div>
        </div>

        {/* Mid Section: Expiry Overview & Quick Actions */}
        <div className="flex flex-col lg:flex-row gap-6 mb-8">
          
          {/* Expiry Overview Progress (2 cols) */}
          <div className="flex-1 lg:flex-[2] bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-6">
            <span className="text-lg font-extrabold text-gray-900 dark:text-white mb-6 block">Expiry Overview</span>
            
            {items.length === 0 ? (
              <div className="py-8 flex flex-col items-center justify-center text-center">
                <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-3">
                  <Package color="#9ca3af" size={24} />
                </div>
                <span className="text-sm font-bold text-gray-700">No pantry items yet</span>
                <span className="text-xs text-gray-500 mt-1 max-w-[250px]">Scan a product and FreshKeep will automatically track its expiry date.</span>
              </div>
            ) : (
              <div className="space-y-6">
                <div>
                  <div className="flex flex-row justify-between text-sm font-bold mb-2">
                    <span className="text-emerald-700">Fresh</span>
                    <span className="text-gray-900">{freshItems.length} items</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                    <div className="bg-emerald-500 h-2.5 rounded-full" style={{ width: `${(freshItems.length / items.length) * 100}%` }} />
                  </div>
                </div>
                
                <div>
                  <div className="flex flex-row justify-between text-sm font-bold mb-2">
                    <span className="text-amber-700">Expiring Soon</span>
                    <span className="text-gray-900">{expiringSoonItems.length} items</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                    <div className="bg-amber-500 h-2.5 rounded-full" style={{ width: `${(expiringSoonItems.length / items.length) * 100}%` }} />
                  </div>
                </div>

                <div>
                  <div className="flex flex-row justify-between text-sm font-bold mb-2">
                    <span className="text-red-700">Expired</span>
                    <span className="text-gray-900">{expiredItems.length} items</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                    <div className="bg-red-500 h-2.5 rounded-full" style={{ width: `${(expiredItems.length / items.length) * 100}%` }} />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Quick Actions (1 col) */}
          <div className="flex-1 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-6">
            <span className="text-lg font-extrabold text-gray-900 dark:text-white mb-6 block">Quick Actions</span>
            <div className="space-y-3">
              <button onClick={() => navigate('/')} className="w-full flex flex-row items-center justify-between p-3.5 rounded-xl border border-gray-100">
                <div className="flex flex-row items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                    <ScanLine color="#059669" size={16} />
                  </div>
                  <span className="text-sm font-bold text-gray-700">Scan Product</span>
                </div>
                <ChevronRight color="#9ca3af" size={16} />
              </button>

              <button onClick={() => navigate('/pantry')} className="w-full flex flex-row items-center justify-between p-3.5 rounded-xl border border-gray-100">
                <div className="flex flex-row items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                    <ListChecks color="#2563eb" size={16} />
                  </div>
                  <span className="text-sm font-bold text-gray-700">Add Pantry Item</span>
                </div>
                <ChevronRight color="#9ca3af" size={16} />
              </button>
              
              <button onClick={() => navigate('/shopping-list')} className="w-full flex flex-row items-center justify-between p-3.5 rounded-xl border border-gray-100">
                <div className="flex flex-row items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
                    <ListChecks color="#4f46e5" size={16} />
                  </div>
                  <span className="text-sm font-bold text-gray-700">Shopping List</span>
                </div>
                <ChevronRight color="#9ca3af" size={16} />
              </button>
              
              <button onClick={() => navigate('/waste-log')} className="w-full flex flex-row items-center justify-between p-3.5 rounded-xl border border-gray-100">
                <div className="flex flex-row items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-rose-100 flex items-center justify-center">
                    <Trash2 color="#e11d48" size={16} />
                  </div>
                  <span className="text-sm font-bold text-gray-700">Waste Log</span>
                </div>
                <ChevronRight color="#9ca3af" size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Section: Recently Scanned & Freshness */}
        <div className="flex flex-col xl:flex-row gap-6">
          
          {/* Recently Scanned List (2 cols) */}
          <div className="flex-1 lg:flex-[2] bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-50 dark:border-gray-700/50 flex flex-row items-center justify-between">
              <div className="flex flex-col">
                <span className="text-lg font-extrabold text-gray-900 dark:text-white">Recently Scanned</span>
                <span className="text-xs text-gray-500 font-medium mt-1">Your latest scanned products</span>
              </div>
              <button onClick={() => navigate('/pantry')} className="flex flex-row items-center gap-1">
                <span className="text-sm font-bold text-[#86A789]">View All</span>
                <ArrowRight color="#86A789" size={16} />
              </button>
            </div>
            
            <div className="p-4">
              {recentlyScanned.length === 0 ? (
                <div className="py-12 flex flex-col items-center justify-center text-center">
                  <ScanLine color="#d1d5db" size={32} />
                  <span className="text-sm font-bold text-gray-700 mt-2">No recently scanned items</span>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentlyScanned.map(item => {
                    const days = item.expiryDate ? getDaysLeft(item.expiryDate) : null;
                    return (
                      <div key={item.id} className="flex flex-row items-center justify-between p-3 border border-gray-100 rounded-xl">
                        <div className="flex-1">
                          <span className="text-sm font-bold text-gray-900">{item.name}</span>
                          <div className="flex flex-row items-center gap-2 mt-1">
                            <span className="text-xs text-gray-400 capitalize">{item.category}</span>
                            <span className="text-xs text-gray-400">•</span>
                            <span className="text-xs text-gray-500">Conf: {item.confidence}%</span>
                          </div>
                        </div>
                        
                        <div className="flex flex-row items-center gap-4">
                          <div className="items-end">
                            <span className="text-xs text-gray-600 font-semibold">
                              {item.expiryDate ? `Exp: ${item.expiryDate}` : 'No Expiry'}
                            </span>
                            <div className="mt-1">
                              {days === null ? (
                                <div className="px-2 py-0.5 bg-gray-100 rounded-full">
                                  <span className="text-[9px] font-bold text-gray-600">Unknown</span>
                                </div>
                              ) : days < 0 ? (
                                <div className="px-2 py-0.5 bg-red-100 rounded-full">
                                  <span className="text-[9px] font-bold text-red-600">Expired</span>
                                </div>
                              ) : days <= 7 ? (
                                <div className="px-2 py-0.5 bg-orange-100 rounded-full">
                                  <span className="text-[9px] font-bold text-orange-600">Expiring</span>
                                </div>
                              ) : (
                                <div className="px-2 py-0.5 bg-emerald-100 rounded-full">
                                  <span className="text-[9px] font-bold text-emerald-600">Fresh</span>
                                </div>
                              )}
                            </div>
                          </div>
                          <button onClick={() => navigate('/pantry')} className="p-1">
                            <ChevronRight color="#9ca3af" size={20} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Pantry By Category & Freshness (1 col) */}
          <div className="flex-1 space-y-6">
            {/* Category Breakdown */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-6">
              <span className="text-lg font-extrabold text-gray-900 dark:text-white mb-6 block">Pantry by Category</span>
              {items.length === 0 ? (
                <div className="py-4 text-center">
                  <span className="text-sm font-bold text-gray-500">No data available</span>
                </div>
              ) : (
                <div className="flex flex-col">
                  <div className="h-[200px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={categoryStats.filter(s => s.count > 0)}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="count"
                        >
                          {categoryStats.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[entry.category] || '#94a3b8'} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                          formatter={(value: any, name: string, props: any) => [`${value} items`, props.payload.category.charAt(0).toUpperCase() + props.payload.category.slice(1)]}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mt-4">
                    {categoryStats.filter(s => s.count > 0).map(stat => (
                      <div key={stat.category} className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[stat.category] }} />
                        <span className="text-xs font-bold text-gray-700 dark:text-gray-300 capitalize truncate">{stat.category}</span>
                        <span className="text-xs text-gray-500 ml-auto">{stat.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Freshness Analysis */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-6 flex flex-col h-[320px]">
              <span className="text-lg font-extrabold text-gray-900 dark:text-white mb-1 block">Freshness Analysis</span>
              <span className="text-xs text-gray-500 font-medium mb-6 block">Monitor the condition of your pantry</span>
              
              {items.length === 0 ? (
                <div className="py-6 flex flex-col items-center justify-center text-center border-2 border-dashed border-gray-100 rounded-xl">
                  <Activity color="#34d399" size={24} />
                  <span className="text-sm font-bold text-gray-700 mt-2">Your pantry is empty</span>
                  <button onClick={() => navigate('/')} className="mt-3 px-4 py-2 bg-emerald-50 rounded-lg">
                    <span className="text-emerald-700 text-xs font-bold">Scan Your First Product</span>
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <div className="w-32 h-32 rounded-full border-[12px] border-emerald-500 flex items-center justify-center mb-4">
                    <div className="items-center">
                      <span className="text-3xl font-black text-gray-900">
                        {itemsWithFreshness.length > 0 
                          ? (Math.round(itemsWithFreshness.reduce((acc, curr) => acc + (isNaN(curr.freshnessScore) ? 50 : curr.freshnessScore), 0) / itemsWithFreshness.length) || 0)
                          : 0}
                      </span>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Score</span>
                    </div>
                  </div>
                  <div className="flex flex-row w-full gap-2 text-center mt-2">
                    <div className="flex-1 bg-emerald-50 p-2 rounded-lg items-center">
                      <span className="text-base font-bold text-emerald-700">{freshItems.length}</span>
                      <span className="text-[9px] font-bold text-emerald-600 uppercase">Fresh</span>
                    </div>
                    <div className="flex-1 bg-amber-50 p-2 rounded-lg items-center">
                      <span className="text-base font-bold text-amber-700">{expiringSoonItems.length}</span>
                      <span className="text-[9px] font-bold text-amber-600 uppercase">Soon</span>
                    </div>
                    <div className="flex-1 bg-red-50 p-2 rounded-lg items-center">
                      <span className="text-base font-bold text-red-700">{expiredItems.length}</span>
                      <span className="text-[9px] font-bold text-red-600 uppercase">Expired</span>
                    </div>
                    <div className="flex-1 bg-gray-50 p-2 rounded-lg items-center">
                      <span className="text-base font-bold text-gray-700">{unknownExpiryItems.length}</span>
                      <span className="text-[9px] font-bold text-gray-600 uppercase">Unknown</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
