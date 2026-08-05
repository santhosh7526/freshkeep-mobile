import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useAuth } from '@freshkeep/shared';
import { usePantry } from '@freshkeep/shared';
import { Package, AlertTriangle, Calendar, Leaf, ScanLine, ListChecks, ShoppingCart, Trash2, ChevronRight, Activity, ArrowRight } from 'lucide-react-native';
import tw from 'twrnc';

// Expiry helpers
function getDaysLeft(expiryDate: string | null): number {
  if (!expiryDate) return -999;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(expiryDate);
  if (isNaN(expiry.getTime())) return -999;
  expiry.setHours(0, 0, 0, 0);
  return Math.round((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function calculateFreshnessScore(expiryDate: string | null, addedDate: string): number {
  if (!expiryDate) return 50;
  const daysLeft = getDaysLeft(expiryDate);
  const expiryTime = new Date(expiryDate).getTime();
  const addedTime = new Date(addedDate).getTime();
  if (isNaN(expiryTime) || isNaN(addedTime)) return 50;
  const totalDays = Math.ceil((expiryTime - addedTime) / (1000 * 60 * 60 * 24));
  if (daysLeft <= 0) return 0;
  if (totalDays <= 0) return 100;
  return Math.min(100, Math.max(0, Math.round((daysLeft / totalDays) * 100)));
}

export default function DashboardScreen({ navigation }: any) {
  const { user } = useAuth();
  const { items } = usePantry();
  
  const [totalInventoryValue, setTotalInventoryValue] = useState(0);
  const [moneySaved, setMoneySaved] = useState(0);
  const [recentlyScanned, setRecentlyScanned] = useState<any[]>([]);

  useEffect(() => {
    const sorted = [...items].sort((a, b) => new Date(b.addedDate).getTime() - new Date(a.addedDate).getTime());
    setRecentlyScanned(sorted.slice(0, 3));

    let inventorySum = 0;
    items.forEach(item => {
      const price = Number(item.price) || 50;
      const qty = Number(item.quantity) || 1;
      inventorySum += price * qty;
    });
    setTotalInventoryValue(Math.round(inventorySum));
    
    const saved = items.filter(item => getDaysLeft(item.expiryDate) > 0).length * 150;
    setMoneySaved(Math.round(saved));
  }, [items]);

  const expiredItems = useMemo(() => items.filter(i => i.expiryDate && getDaysLeft(i.expiryDate) < 0), [items]);
  const expiringSoonItems = useMemo(() => items.filter(i => i.expiryDate && getDaysLeft(i.expiryDate) >= 0 && getDaysLeft(i.expiryDate) <= 7), [items]);
  const freshItems = useMemo(() => items.filter(i => i.expiryDate && getDaysLeft(i.expiryDate) > 7), [items]);
  const unknownExpiryItems = useMemo(() => items.filter(i => !i.expiryDate), [items]);

  const avgFreshness = useMemo(() => {
    if (items.length === 0) return 0;
    const sum = items.reduce((acc, curr) => acc + calculateFreshnessScore(curr.expiryDate, curr.addedDate), 0);
    return Math.round(sum / items.length);
  }, [items]);

  return (
    <ScrollView style={tw`flex-1 bg-gray-50`} contentContainerStyle={tw`p-5 pb-10`}>
      {/* Header */}
      <View style={tw`mb-6`}>
        <Text style={tw`text-2xl font-black text-gray-900`}>Hi, {user?.givenName || 'there'} 👋</Text>
        <Text style={tw`text-sm text-gray-500 font-medium mt-1`}>Here is your pantry health overview today.</Text>
      </View>

      {/* Grid Stats */}
      <View style={tw`flex flex-row flex-wrap justify-between mb-6`}>
        <View style={tw`w-[48%] bg-white p-4 rounded-2xl border border-gray-100 shadow-sm mb-4`}>
          <View style={tw`w-8 h-8 rounded-xl bg-blue-50 items-center justify-center mb-2`}>
            <Package color="#2563eb" size={18} />
          </View>
          <Text style={tw`text-[10px] font-bold text-gray-400 uppercase`}>Total Items</Text>
          <Text style={tw`text-2xl font-black text-gray-900 mt-1`}>{items.length}</Text>
        </View>

        <View style={tw`w-[48%] bg-white p-4 rounded-2xl border border-gray-100 shadow-sm mb-4`}>
          <View style={tw`w-8 h-8 rounded-xl bg-amber-50 items-center justify-center mb-2`}>
            <AlertTriangle color="#d97706" size={18} />
          </View>
          <Text style={tw`text-[10px] font-bold text-gray-400 uppercase`}>Expiring Soon</Text>
          <Text style={tw`text-2xl font-black text-gray-900 mt-1`}>{expiringSoonItems.length}</Text>
        </View>

        <View style={tw`w-[48%] bg-white p-4 rounded-2xl border border-gray-100 shadow-sm mb-4`}>
          <View style={tw`w-8 h-8 rounded-xl bg-red-50 items-center justify-center mb-2`}>
            <Calendar color="#dc2626" size={18} />
          </View>
          <Text style={tw`text-[10px] font-bold text-gray-400 uppercase`}>Expired</Text>
          <Text style={tw`text-2xl font-black text-gray-900 mt-1`}>{expiredItems.length}</Text>
        </View>

        <View style={tw`w-[48%] bg-white p-4 rounded-2xl border border-gray-100 shadow-sm mb-4`}>
          <View style={tw`w-8 h-8 rounded-xl bg-emerald-50 items-center justify-center mb-2`}>
            <Leaf color="#059669" size={18} />
          </View>
          <Text style={tw`text-[10px] font-bold text-gray-400 uppercase`}>Waste Saved</Text>
          <Text style={tw`text-2xl font-black text-gray-900 mt-1`}>₹{moneySaved}</Text>
        </View>
      </View>

      {/* Freshness Gauge */}
      <View style={tw`bg-white rounded-2xl border border-gray-100 p-5 shadow-sm items-center mb-6`}>
        <Text style={tw`text-base font-bold text-gray-800 self-start mb-4`}>Pantry Freshness Index</Text>
        <View style={tw`w-28 h-28 rounded-full border-[10px] border-[#86A789] items-center justify-center mb-2`}>
          <Text style={tw`text-3xl font-black text-gray-950`}>{avgFreshness}</Text>
          <Text style={tw`text-[8px] font-bold text-gray-400 uppercase tracking-widest`}>Score</Text>
        </View>
        <View style={tw`flex flex-row justify-around w-full mt-4`}>
          <View style={tw`items-center`}>
            <Text style={tw`text-sm font-bold text-emerald-700`}>{freshItems.length}</Text>
            <Text style={tw`text-[9px] font-bold text-gray-400 uppercase`}>Fresh</Text>
          </View>
          <View style={tw`items-center`}>
            <Text style={tw`text-sm font-bold text-amber-700`}>{expiringSoonItems.length}</Text>
            <Text style={tw`text-[9px] font-bold text-gray-400 uppercase`}>Soon</Text>
          </View>
          <View style={tw`items-center`}>
            <Text style={tw`text-sm font-bold text-red-700`}>{expiredItems.length}</Text>
            <Text style={tw`text-[9px] font-bold text-gray-400 uppercase`}>Expired</Text>
          </View>
        </View>
      </View>

      {/* Recently Scanned List */}
      <View style={tw`bg-white rounded-2xl border border-gray-100 p-5 shadow-sm mb-6`}>
        <View style={tw`flex flex-row items-center justify-between mb-4`}>
          <Text style={tw`text-base font-bold text-gray-800`}>Recently Scanned</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Pantry')} style={tw`flex flex-row items-center`}>
            <Text style={tw`text-xs font-bold text-[#86A789] mr-1`}>View All</Text>
            <ArrowRight color="#86A789" size={12} />
          </TouchableOpacity>
        </View>

        {recentlyScanned.length === 0 ? (
          <View style={tw`py-8 items-center`}>
            <ScanLine color="#d1d5db" size={28} />
            <Text style={tw`text-xs text-gray-400 mt-2 font-medium`}>No items scanned yet.</Text>
          </View>
        ) : (
          <View style={tw`space-y-3`}>
            {recentlyScanned.map(item => (
              <View key={item.id} style={tw`flex flex-row items-center justify-between p-3 border border-gray-100 rounded-xl`}>
                <View style={tw`flex-1`}>
                  <Text style={tw`text-sm font-bold text-gray-800 line-clamp-1`}>{item.name}</Text>
                  <Text style={tw`text-[10px] text-gray-400 capitalize mt-0.5`}>{item.category}</Text>
                </View>
                <View style={tw`items-end`}>
                  <Text style={tw`text-xs font-bold text-gray-700`}>{item.expiryDate || 'No Expiry'}</Text>
                  <Text style={tw`text-[9px] text-gray-400 capitalize mt-0.5`}>Qty: {item.quantity}</Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Quick Navigation Cards */}
      <View style={tw`space-y-3`}>
        <TouchableOpacity onPress={() => navigation.navigate('Scan')} style={tw`w-full bg-white p-4 rounded-xl border border-gray-100 flex flex-row items-center justify-between shadow-sm`}>
          <View style={tw`flex flex-row items-center gap-3`}>
            <View style={tw`w-8 h-8 rounded-lg bg-emerald-50 items-center justify-center`}>
              <ScanLine color="#059669" size={16} />
            </View>
            <Text style={tw`text-sm font-bold text-gray-700`}>Launch Camera Scanner</Text>
          </View>
          <ChevronRight color="#9ca3af" size={16} />
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('ShoppingList')} style={tw`w-full bg-white p-4 rounded-xl border border-gray-100 flex flex-row items-center justify-between shadow-sm`}>
          <View style={tw`flex flex-row items-center gap-3`}>
            <View style={tw`w-8 h-8 rounded-lg bg-indigo-50 items-center justify-center`}>
              <ShoppingCart color="#4f46e5" size={16} />
            </View>
            <Text style={tw`text-sm font-bold text-gray-700`}>Smart Shopping List</Text>
          </View>
          <ChevronRight color="#9ca3af" size={16} />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
