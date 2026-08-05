import { useState, useEffect, useMemo } from 'react';
import { Leaf, Plus, ScanLine, ListChecks, Trash2, ArrowRight, Package, AlertTriangle, CheckCircle2, ChevronRight, Activity, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import tw from 'twrnc';
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

  const getStatusBadge = (days: number) => {
    if (days < 0) {
      return (
        <View style={tw`px-2.5 py-1 bg-red-100 rounded-full`}>
          <Text style={tw`text-[10px] font-bold text-red-700`}>Expired</Text>
        </View>
      );
    }
    if (days <= 7) {
      return (
        <View style={tw`px-2.5 py-1 bg-amber-100 rounded-full`}>
          <Text style={tw`text-[10px] font-bold text-amber-700`}>Expiring Soon</Text>
        </View>
      );
    }
    return (
      <View style={tw`px-2.5 py-1 bg-emerald-100 rounded-full`}>
        <Text style={tw`text-[10px] font-bold text-emerald-700`}>Fresh</Text>
      </View>
    );
  };

  return (
    <ScrollView style={tw`w-full h-full bg-white md:bg-gray-50`} contentContainerStyle={tw`pb-24 md:pb-8`}>
      <View style={tw`max-w-[1400px] w-full mx-auto p-4 md:p-8`}>
        
        {/* Header Section */}
        <View style={tw`flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8`}>
          <View>
            <Text style={tw`text-3xl font-extrabold text-gray-900 tracking-tight`}>
              Good morning, {user?.givenName || user?.name || 'Santhosh'} 👋
            </Text>
            <Text style={tw`text-sm text-gray-500 font-medium mt-1`}>
              Here's what's happening with your pantry today.
            </Text>
          </View>
          <View style={tw`flex flex-row gap-3`}>
            <TouchableOpacity 
              onPress={() => navigate('/pantry')} 
              style={tw`px-5 py-2.5 bg-white border border-gray-200 rounded-xl flex flex-row items-center gap-2 shadow-sm`}
            >
              <Plus color="#374151" size={16} />
              <Text style={tw`text-gray-700 font-bold text-sm`}>Add Manually</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => navigate('/')} 
              style={tw`px-5 py-2.5 bg-[#86A789] rounded-xl flex flex-row items-center gap-2 shadow-sm`}
            >
              <ScanLine color="#ffffff" size={16} />
              <Text style={tw`text-white font-bold text-sm`}>Scan Product</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 4-Column Stats Grid */}
        <View style={tw`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8`}>
          <View style={tw`bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between`}>
            <View style={tw`flex flex-row items-center gap-3 mb-4`}>
              <View style={tw`w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center`}>
                <Package color="#2563eb" size={20} />
              </View>
              <Text style={tw`text-sm font-bold text-gray-500`}>TOTAL ITEMS</Text>
            </View>
            <View>
              <Text style={tw`text-3xl font-black text-gray-900`}>{items.length}</Text>
              <Text style={tw`text-xs font-semibold text-gray-400 mt-1`}>Items in pantry</Text>
            </View>
          </View>

          <View style={tw`bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between`}>
            <View style={tw`flex flex-row items-center gap-3 mb-4`}>
              <View style={tw`w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center`}>
                <AlertTriangle color="#d97706" size={20} />
              </View>
              <Text style={tw`text-sm font-bold text-gray-500`}>EXPIRING SOON</Text>
            </View>
            <View>
              <Text style={tw`text-3xl font-black text-gray-900`}>{expiringSoonItems.length}</Text>
              <Text style={tw`text-xs font-semibold text-gray-400 mt-1`}>Within 7 days</Text>
            </View>
          </View>

          <View style={tw`bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between`}>
            <View style={tw`flex flex-row items-center gap-3 mb-4`}>
              <View style={tw`w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center`}>
                <Calendar color="#dc2626" size={20} />
              </View>
              <Text style={tw`text-sm font-bold text-gray-500`}>EXPIRED</Text>
            </View>
            <View>
              <Text style={tw`text-3xl font-black text-gray-900`}>{expiredItems.length}</Text>
              <Text style={tw`text-xs font-semibold text-gray-400 mt-1`}>Need attention</Text>
            </View>
          </View>

          <View style={tw`bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between`}>
            <View style={tw`flex flex-row items-center gap-3 mb-4`}>
              <View style={tw`w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center`}>
                <Leaf color="#059669" size={20} />
              </View>
              <Text style={tw`text-sm font-bold text-gray-500`}>WASTE SAVED</Text>
            </View>
            <View>
              <Text style={tw`text-3xl font-black text-gray-900`}>₹{moneySaved}</Text>
              <Text style={tw`text-xs font-semibold text-gray-400 mt-1`}>Estimated value</Text>
            </View>
          </View>
        </View>

        {/* Mid Section: Expiry Overview & Quick Actions */}
        <View style={tw`flex flex-col lg:flex-row gap-6 mb-8`}>
          
          {/* Expiry Overview Progress (2 cols) */}
          <View style={tw`flex-1 lg:flex-[2] bg-white rounded-2xl border border-gray-100 shadow-sm p-6`}>
            <Text style={tw`text-lg font-extrabold text-gray-900 mb-6`}>Expiry Overview</Text>
            
            {items.length === 0 ? (
              <View style={tw`py-8 flex flex-col items-center justify-center text-center`}>
                <View style={tw`w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-3`}>
                  <Package color="#9ca3af" size={24} />
                </View>
                <Text style={tw`text-sm font-bold text-gray-700`}>No pantry items yet</Text>
                <Text style={tw`text-xs text-gray-500 mt-1 max-w-[250px]`}>Scan a product and FreshKeep will automatically track its expiry date.</Text>
              </View>
            ) : (
              <View style={tw`space-y-6`}>
                <View>
                  <View style={tw`flex flex-row justify-between text-sm font-bold mb-2`}>
                    <Text style={tw`text-emerald-700`}>Fresh</Text>
                    <Text style={tw`text-gray-900`}>{freshItems.length} items</Text>
                  </View>
                  <View style={tw`w-full bg-gray-100 rounded-full h-2.5 overflow-hidden`}>
                    <View style={[tw`bg-emerald-500 h-2.5 rounded-full`, { width: `${(freshItems.length / items.length) * 100}%` }]} />
                  </View>
                </View>
                
                <View>
                  <View style={tw`flex flex-row justify-between text-sm font-bold mb-2`}>
                    <Text style={tw`text-amber-700`}>Expiring Soon</Text>
                    <Text style={tw`text-gray-900`}>{expiringSoonItems.length} items</Text>
                  </View>
                  <View style={tw`w-full bg-gray-100 rounded-full h-2.5 overflow-hidden`}>
                    <View style={[tw`bg-amber-500 h-2.5 rounded-full`, { width: `${(expiringSoonItems.length / items.length) * 100}%` }]} />
                  </View>
                </View>

                <View>
                  <View style={tw`flex flex-row justify-between text-sm font-bold mb-2`}>
                    <Text style={tw`text-red-700`}>Expired</Text>
                    <Text style={tw`text-gray-900`}>{expiredItems.length} items</Text>
                  </View>
                  <View style={tw`w-full bg-gray-100 rounded-full h-2.5 overflow-hidden`}>
                    <View style={[tw`bg-red-500 h-2.5 rounded-full`, { width: `${(expiredItems.length / items.length) * 100}%` }]} />
                  </View>
                </View>
              </View>
            )}
          </View>

          {/* Quick Actions (1 col) */}
          <View style={tw`flex-1 bg-white rounded-2xl border border-gray-100 shadow-sm p-6`}>
            <Text style={tw`text-lg font-extrabold text-gray-900 mb-6`}>Quick Actions</Text>
            <View style={tw`space-y-3`}>
              <TouchableOpacity onPress={() => navigate('/')} style={tw`w-full flex flex-row items-center justify-between p-3.5 rounded-xl border border-gray-100`}>
                <View style={tw`flex flex-row items-center gap-3`}>
                  <View style={tw`w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center`}>
                    <ScanLine color="#059669" size={16} />
                  </View>
                  <Text style={tw`text-sm font-bold text-gray-700`}>Scan Product</Text>
                </View>
                <ChevronRight color="#9ca3af" size={16} />
              </TouchableOpacity>

              <TouchableOpacity onPress={() => navigate('/pantry')} style={tw`w-full flex flex-row items-center justify-between p-3.5 rounded-xl border border-gray-100`}>
                <View style={tw`flex flex-row items-center gap-3`}>
                  <View style={tw`w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center`}>
                    <ListChecks color="#2563eb" size={16} />
                  </View>
                  <Text style={tw`text-sm font-bold text-gray-700`}>Add Pantry Item</Text>
                </View>
                <ChevronRight color="#9ca3af" size={16} />
              </TouchableOpacity>
              
              <TouchableOpacity onPress={() => navigate('/shopping-list')} style={tw`w-full flex flex-row items-center justify-between p-3.5 rounded-xl border border-gray-100`}>
                <View style={tw`flex flex-row items-center gap-3`}>
                  <View style={tw`w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center`}>
                    <ListChecks color="#4f46e5" size={16} />
                  </View>
                  <Text style={tw`text-sm font-bold text-gray-700`}>Shopping List</Text>
                </View>
                <ChevronRight color="#9ca3af" size={16} />
              </TouchableOpacity>
              
              <TouchableOpacity onPress={() => navigate('/waste-log')} style={tw`w-full flex flex-row items-center justify-between p-3.5 rounded-xl border border-gray-100`}>
                <View style={tw`flex flex-row items-center gap-3`}>
                  <View style={tw`w-8 h-8 rounded-lg bg-rose-100 flex items-center justify-center`}>
                    <Trash2 color="#e11d48" size={16} />
                  </View>
                  <Text style={tw`text-sm font-bold text-gray-700`}>Waste Log</Text>
                </View>
                <ChevronRight color="#9ca3af" size={16} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Bottom Section: Recently Scanned & Freshness */}
        <View style={tw`flex flex-col xl:flex-row gap-6`}>
          
          {/* Recently Scanned List (2 cols) */}
          <View style={tw`flex-1 lg:flex-[2] bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden`}>
            <View style={tw`p-6 border-b border-gray-50 flex flex-row items-center justify-between`}>
              <View>
                <Text style={tw`text-lg font-extrabold text-gray-900`}>Recently Scanned</Text>
                <Text style={tw`text-xs text-gray-500 font-medium mt-1`}>Your latest scanned products</Text>
              </View>
              <TouchableOpacity onPress={() => navigate('/pantry')} style={tw`flex flex-row items-center gap-1`}>
                <Text style={tw`text-sm font-bold text-[#86A789]`}>View All</Text>
                <ArrowRight color="#86A789" size={16} />
              </TouchableOpacity>
            </View>
            
            <View style={tw`p-4`}>
              {recentlyScanned.length === 0 ? (
                <View style={tw`py-12 flex flex-col items-center justify-center text-center`}>
                  <ScanLine color="#d1d5db" size={32} />
                  <Text style={tw`text-sm font-bold text-gray-700 mt-2`}>No recently scanned items</Text>
                </View>
              ) : (
                <View style={tw`space-y-4`}>
                  {recentlyScanned.map(item => {
                    const days = item.expiryDate ? getDaysLeft(item.expiryDate) : null;
                    return (
                      <View key={item.id} style={tw`flex flex-row items-center justify-between p-3 border border-gray-100 rounded-xl`}>
                        <View style={tw`flex-1`}>
                          <Text style={tw`text-sm font-bold text-gray-900`}>{item.name}</Text>
                          <View style={tw`flex flex-row items-center gap-2 mt-1`}>
                            <Text style={tw`text-xs text-gray-400 capitalize`}>{item.category}</Text>
                            <Text style={tw`text-xs text-gray-400`}>•</Text>
                            <Text style={tw`text-xs text-gray-500`}>Conf: {item.confidence}%</Text>
                          </View>
                        </View>
                        
                        <View style={tw`flex flex-row items-center gap-4`}>
                          <View style={tw`items-end`}>
                            <Text style={tw`text-xs text-gray-600 font-semibold`}>
                              {item.expiryDate ? `Exp: ${item.expiryDate}` : 'No Expiry'}
                            </Text>
                            <View style={tw`mt-1`}>
                              {days === null ? (
                                <View style={tw`px-2 py-0.5 bg-gray-100 rounded-full`}>
                                  <Text style={tw`text-[9px] font-bold text-gray-600`}>Unknown</Text>
                                </View>
                              ) : days < 0 ? (
                                <View style={tw`px-2 py-0.5 bg-red-100 rounded-full`}>
                                  <Text style={tw`text-[9px] font-bold text-red-600`}>Expired</Text>
                                </View>
                              ) : days <= 7 ? (
                                <View style={tw`px-2 py-0.5 bg-orange-100 rounded-full`}>
                                  <Text style={tw`text-[9px] font-bold text-orange-600`}>Expiring</Text>
                                </View>
                              ) : (
                                <View style={tw`px-2 py-0.5 bg-emerald-100 rounded-full`}>
                                  <Text style={tw`text-[9px] font-bold text-emerald-600`}>Fresh</Text>
                                </View>
                              )}
                            </View>
                          </View>
                          <TouchableOpacity onPress={() => navigate('/pantry')} style={tw`p-1`}>
                            <ChevronRight color="#9ca3af" size={20} />
                          </TouchableOpacity>
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}
            </View>
          </View>

          {/* Pantry By Category & Freshness (1 col) */}
          <View style={tw`flex-1 space-y-6`}>
            {/* Category Breakdown */}
            <View style={tw`bg-white rounded-2xl border border-gray-100 shadow-sm p-6`}>
              <Text style={tw`text-lg font-extrabold text-gray-900 mb-6`}>Pantry by Category</Text>
              {items.length === 0 ? (
                <View style={tw`py-4 text-center`}>
                  <Text style={tw`text-sm font-bold text-gray-500`}>No data available</Text>
                </View>
              ) : (
                <View style={tw`space-y-4`}>
                  {categoryStats.map(stat => (
                    <View key={stat.category} style={tw`flex flex-row items-center justify-between`}>
                      <View style={tw`flex flex-row items-center gap-3`}>
                        <View style={tw`w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center`}>
                          <Text style={tw`text-base`}>{getCategoryIcon(stat.category)}</Text>
                        </View>
                        <View>
                          <Text style={tw`text-sm font-bold text-gray-900 capitalize`}>{stat.category}</Text>
                          <Text style={tw`text-xs text-gray-400`}>{stat.count} items</Text>
                        </View>
                      </View>
                      <Text style={tw`text-sm font-bold text-gray-700`}>{stat.percentage}%</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>

            {/* Freshness Analysis */}
            <View style={tw`bg-white rounded-2xl border border-gray-100 shadow-sm p-6`}>
              <Text style={tw`text-lg font-extrabold text-gray-900 mb-1`}>Freshness Analysis</Text>
              <Text style={tw`text-xs text-gray-500 font-medium mb-6`}>Monitor the condition of your pantry</Text>
              
              {items.length === 0 ? (
                <View style={tw`py-6 flex flex-col items-center justify-center text-center border-2 border-dashed border-gray-100 rounded-xl`}>
                  <Activity color="#34d399" size={24} />
                  <Text style={tw`text-sm font-bold text-gray-700 mt-2`}>Your pantry is empty</Text>
                  <TouchableOpacity onPress={() => navigate('/')} style={tw`mt-3 px-4 py-2 bg-emerald-50 rounded-lg`}>
                    <Text style={tw`text-emerald-700 text-xs font-bold`}>Scan Your First Product</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={tw`flex flex-col items-center`}>
                  <View style={tw`w-32 h-32 rounded-full border-[12px] border-emerald-500 flex items-center justify-center mb-4`}>
                    <View style={tw`items-center`}>
                      <Text style={tw`text-3xl font-black text-gray-900`}>
                        {itemsWithFreshness.length > 0 
                          ? (Math.round(itemsWithFreshness.reduce((acc, curr) => acc + (isNaN(curr.freshnessScore) ? 50 : curr.freshnessScore), 0) / itemsWithFreshness.length) || 0)
                          : 0}
                      </Text>
                      <Text style={tw`text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1`}>Score</Text>
                    </View>
                  </View>
                  <View style={tw`flex flex-row w-full gap-2 text-center mt-2`}>
                    <View style={tw`flex-1 bg-emerald-50 p-2 rounded-lg items-center`}>
                      <Text style={tw`text-base font-bold text-emerald-700`}>{freshItems.length}</Text>
                      <Text style={tw`text-[9px] font-bold text-emerald-600 uppercase`}>Fresh</Text>
                    </View>
                    <View style={tw`flex-1 bg-amber-50 p-2 rounded-lg items-center`}>
                      <Text style={tw`text-base font-bold text-amber-700`}>{expiringSoonItems.length}</Text>
                      <Text style={tw`text-[9px] font-bold text-amber-600 uppercase`}>Soon</Text>
                    </View>
                    <View style={tw`flex-1 bg-red-50 p-2 rounded-lg items-center`}>
                      <Text style={tw`text-base font-bold text-red-700`}>{expiredItems.length}</Text>
                      <Text style={tw`text-[9px] font-bold text-red-600 uppercase`}>Expired</Text>
                    </View>
                    <View style={tw`flex-1 bg-gray-50 p-2 rounded-lg items-center`}>
                      <Text style={tw`text-base font-bold text-gray-700`}>{unknownExpiryItems.length}</Text>
                      <Text style={tw`text-[9px] font-bold text-gray-600 uppercase`}>Unknown</Text>
                    </View>
                  </View>
                </View>
              )}
            </View>

          </View>
        </View>

      </View>
    </ScrollView>
  );
}
