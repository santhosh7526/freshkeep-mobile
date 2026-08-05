import { useState, useEffect, useMemo } from 'react';
import { Leaf, Plus, ScanLine, ListChecks, Trash2, ArrowRight, Package, AlertTriangle, CheckCircle2, ChevronRight, Activity, Calendar } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { FoodItem } from '../../backend/models/types';
import { calculateFreshnessScore, getDaysLeft, getCategoryIcon } from '../../backend/logic/helpers';
import { useAuth } from '../context/AuthContext';
import { usePantry } from '../context/PantryContext';

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

  const getStatusBadge = (days: number) => {
    if (days < 0) return <span className="px-2.5 py-1 text-[10px] font-bold bg-red-100 text-red-700 rounded-full">Expired</span>;
    if (days <= 7) return <span className="px-2.5 py-1 text-[10px] font-bold bg-amber-100 text-amber-700 rounded-full">Expiring Soon</span>;
    return <span className="px-2.5 py-1 text-[10px] font-bold bg-emerald-100 text-emerald-700 rounded-full">Fresh</span>;
  };

  return (
    <div className="w-full h-full bg-white md:bg-gray-50 flex justify-center pb-24 md:pb-8">
      <div className="max-w-[1400px] w-full mx-auto p-4 md:p-8">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
              Good morning, {user?.givenName || user?.name || 'Santhosh'} 👋
            </h1>
            <p className="text-sm text-gray-500 font-medium mt-1">
              Here's what's happening with your pantry today.
            </p>
          </div>
          <div className="flex gap-3">
            <Link to="/pantry" className="px-5 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl font-bold text-sm shadow-sm hover:bg-gray-50 transition-all flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Add Manually
            </Link>
            <Link to="/" className="px-5 py-2.5 bg-[#86A789] hover:bg-[#729275] text-white rounded-xl font-bold text-sm shadow-sm transition-all flex items-center gap-2">
              <ScanLine className="w-4 h-4" />
              Scan Product
            </Link>
          </div>
        </div>

        {/* 4-Column Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                <Package className="w-5 h-5 text-blue-600" />
              </div>
              <span className="text-sm font-bold text-gray-500">TOTAL ITEMS</span>
            </div>
            <div>
              <p className="text-3xl font-black text-gray-900">{items.length}</p>
              <p className="text-xs font-semibold text-gray-400 mt-1">Items in pantry</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
              </div>
              <span className="text-sm font-bold text-gray-500">EXPIRING SOON</span>
            </div>
            <div>
              <p className="text-3xl font-black text-gray-900">{expiringSoonItems.length}</p>
              <p className="text-xs font-semibold text-gray-400 mt-1">Within 7 days</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-red-600" />
              </div>
              <span className="text-sm font-bold text-gray-500">EXPIRED</span>
            </div>
            <div>
              <p className="text-3xl font-black text-gray-900">{expiredItems.length}</p>
              <p className="text-xs font-semibold text-gray-400 mt-1">Need attention</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                <Leaf className="w-5 h-5 text-emerald-600" />
              </div>
              <span className="text-sm font-bold text-gray-500">WASTE SAVED</span>
            </div>
            <div>
              <p className="text-3xl font-black text-gray-900">₹{moneySaved}</p>
              <p className="text-xs font-semibold text-gray-400 mt-1">Estimated value</p>
            </div>
          </div>
        </div>

        {/* Mid Section: Expiry Overview & Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          
          {/* Expiry Overview Chart/Progress (2 cols) */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-lg font-extrabold text-gray-900 mb-6">Expiry Overview</h2>
            
            {items.length === 0 ? (
              <div className="py-8 flex flex-col items-center justify-center text-center">
                <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-3">
                  <Package className="w-6 h-6 text-gray-400" />
                </div>
                <p className="text-sm font-bold text-gray-700">No pantry items yet</p>
                <p className="text-xs text-gray-500 mt-1 max-w-[250px]">Scan a product and FreshKeep will automatically track its expiry date.</p>
              </div>
            ) : (
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between text-sm font-bold mb-2">
                    <span className="text-emerald-700">Fresh</span>
                    <span className="text-gray-900">{freshItems.length} items</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                    <div className="bg-emerald-500 h-2.5 rounded-full" style={{ width: `${(freshItems.length / items.length) * 100}%` }}></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between text-sm font-bold mb-2">
                    <span className="text-amber-700">Expiring Soon</span>
                    <span className="text-gray-900">{expiringSoonItems.length} items</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                    <div className="bg-amber-500 h-2.5 rounded-full" style={{ width: `${(expiringSoonItems.length / items.length) * 100}%` }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm font-bold mb-2">
                    <span className="text-red-700">Expired</span>
                    <span className="text-gray-900">{expiredItems.length} items</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                    <div className="bg-red-500 h-2.5 rounded-full" style={{ width: `${(expiredItems.length / items.length) * 100}%` }}></div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Quick Actions (1 col) */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-lg font-extrabold text-gray-900 mb-6">Quick Actions</h2>
            <div className="space-y-3">
              <Link to="/" className="w-full flex items-center justify-between p-3.5 rounded-xl border border-gray-100 hover:border-[#86A789] hover:bg-emerald-50/50 transition-all group">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600">
                    <ScanLine className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-bold text-gray-700 group-hover:text-emerald-800">Scan Product</span>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-emerald-600" />
              </Link>

              <Link to="/pantry" className="w-full flex items-center justify-between p-3.5 rounded-xl border border-gray-100 hover:border-blue-300 hover:bg-blue-50/50 transition-all group">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                    <ListChecks className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-bold text-gray-700 group-hover:text-blue-800">Add Pantry Item</span>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600" />
              </Link>
              
              <Link to="/shopping-list" className="w-full flex items-center justify-between p-3.5 rounded-xl border border-gray-100 hover:border-indigo-300 hover:bg-indigo-50/50 transition-all group">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600">
                    <ListChecks className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-bold text-gray-700 group-hover:text-indigo-800">Shopping List</span>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-indigo-600" />
              </Link>
              
              <Link to="/waste-log" className="w-full flex items-center justify-between p-3.5 rounded-xl border border-gray-100 hover:border-rose-300 hover:bg-rose-50/50 transition-all group">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-rose-100 flex items-center justify-center text-rose-600">
                    <Trash2 className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-bold text-gray-700 group-hover:text-rose-800">Waste Log</span>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-rose-600" />
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom Section: Recently Scanned & Freshness */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          
          {/* Recently Scanned List (2 cols) */}
          <div className="xl:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-50 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-extrabold text-gray-900">Recently Scanned</h2>
                <p className="text-xs text-gray-500 font-medium mt-1">Your latest scanned products</p>
              </div>
              <Link to="/pantry" className="text-sm font-bold text-[#86A789] hover:text-[#729275] flex items-center gap-1">
                View All <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            
            <div className="flex-1 overflow-x-auto">
              {recentlyScanned.length === 0 ? (
                <div className="py-12 flex flex-col items-center justify-center text-center px-4">
                  <ScanLine className="w-8 h-8 text-gray-300 mb-3" />
                  <p className="text-sm font-bold text-gray-700">No recently scanned items</p>
                </div>
              ) : (
                <table className="w-full text-left border-collapse min-w-[700px]">
                  <thead>
                    <tr className="bg-gray-50/50 border-b border-gray-100">
                      <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Product</th>
                      <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Category</th>
                      <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Manufactured</th>
                      <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Expiry</th>
                      <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Confidence</th>
                      <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {recentlyScanned.map(item => {
                      return (
                        <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-6 py-4">
                            <span className="text-sm font-bold text-gray-900">{item.name}</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-xs font-semibold text-gray-500 capitalize">{item.category}</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-xs font-semibold text-gray-700">{item.manufacturingDate || '-'}</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-xs font-semibold text-gray-700">
                              {item.expiryDate ? (
                                <>
                                  <Calendar className="w-3.5 h-3.5 inline mr-1" />
                                  {item.expiryDate}
                                </>
                              ) : (
                                <>
                                  <AlertTriangle className="w-3.5 h-3.5 inline mr-1" />
                                  Unknown
                                </>
                              )}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider
                              ${!item.expiryDate ? 'bg-gray-100 text-gray-600' :
                                getDaysLeft(item.expiryDate) < 0 ? 'bg-red-100 text-red-600' : 
                                getDaysLeft(item.expiryDate) <= 7 ? 'bg-orange-100 text-orange-600' : 
                                'bg-emerald-100 text-emerald-600'}`
                            }>
                              {!item.expiryDate ? 'Unknown' :
                                getDaysLeft(item.expiryDate) < 0 ? 'Expired' : 
                                getDaysLeft(item.expiryDate) <= 7 ? 'Expiring' : 'Fresh'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-xs font-bold text-gray-700">{item.confidence}%</span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button onClick={() => navigate('/pantry')} className="text-xs font-bold text-[#86A789] hover:underline">View</button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Pantry By Category & Freshness (1 col) */}
          <div className="space-y-6">
            {/* Category Breakdown */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="text-lg font-extrabold text-gray-900 mb-6">Pantry by Category</h2>
              {items.length === 0 ? (
                <div className="py-4 text-center">
                  <p className="text-sm font-bold text-gray-500">No data available</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {categoryStats.map(stat => (
                    <div key={stat.category} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-500">
                          {getCategoryIcon(stat.category)}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900 capitalize">{stat.category}</p>
                          <p className="text-xs text-gray-400">{stat.count} items</p>
                        </div>
                      </div>
                      <span className="text-sm font-bold text-gray-700">{stat.percentage}%</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Freshness Analysis */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="text-lg font-extrabold text-gray-900 mb-1">Freshness Analysis</h2>
              <p className="text-xs text-gray-500 font-medium mb-6">Monitor the condition of your pantry</p>
              
              {items.length === 0 ? (
                <div className="py-6 flex flex-col items-center justify-center text-center border-2 border-dashed border-gray-100 rounded-xl">
                  <Activity className="w-6 h-6 text-emerald-400 mb-2" />
                  <p className="text-sm font-bold text-gray-700">Your pantry is empty</p>
                  <Link to="/" className="mt-3 px-4 py-2 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-lg hover:bg-emerald-100 transition-colors">
                    Scan Your First Product
                  </Link>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <div className="w-32 h-32 rounded-full border-[12px] border-emerald-500 flex items-center justify-center mb-4">
                    <div className="text-center">
                      <span className="text-3xl font-black text-gray-900">
                        {itemsWithFreshness.length > 0 
                          ? (Math.round(itemsWithFreshness.reduce((acc, curr) => acc + (isNaN(curr.freshnessScore) ? 50 : curr.freshnessScore), 0) / itemsWithFreshness.length) || 0)
                          : 0}
                      </span>
                      <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Score</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 w-full gap-2 text-center mt-2">
                    <div className="bg-emerald-50 p-2 rounded-lg">
                      <p className="text-lg font-bold text-emerald-700">{freshItems.length}</p>
                      <p className="text-[10px] font-bold text-emerald-600 uppercase">Fresh</p>
                    </div>
                    <div className="bg-amber-50 p-2 rounded-lg">
                      <p className="text-lg font-bold text-amber-700">{expiringSoonItems.length}</p>
                      <p className="text-[10px] font-bold text-amber-600 uppercase">Soon</p>
                    </div>
                    <div className="bg-red-50 p-2 rounded-lg">
                      <p className="text-lg font-bold text-red-700">{expiredItems.length}</p>
                      <p className="text-[10px] font-bold text-red-600 uppercase">Expired</p>
                    </div>
                    <div className="bg-gray-50 p-2 rounded-lg">
                      <p className="text-lg font-bold text-gray-700">{unknownExpiryItems.length}</p>
                      <p className="text-[10px] font-bold text-gray-600 uppercase">Unknown</p>
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
