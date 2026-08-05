import React, { useState } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, Alert } from 'react-native';
import { usePantry, FoodItem } from '@freshkeep/shared';
import { Search, Plus, Trash2, Edit2, ShieldAlert } from 'lucide-react-native';
import tw from 'twrnc';

function getDaysLeft(expiryDate: string | null): number {
  if (!expiryDate) return -999;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(expiryDate);
  if (isNaN(expiry.getTime())) return -999;
  expiry.setHours(0, 0, 0, 0);
  return Math.round((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function getCategoryIcon(category: string): string {
  switch (category) {
    case 'dairy': return '🥛';
    case 'meat': return '🥩';
    case 'seafood': return '🐟';
    case 'vegetables': return '🥦';
    case 'fruits': return '🍎';
    case 'bakery': return '🍞';
    case 'beverages': return '🧃';
    case 'frozen': return '🧊';
    case 'snacks': return '🍿';
    case 'canned': return '🥫';
    case 'spices': return '🌶️';
    default: return '🧂';
  }
}

export default function PantryScreen({ navigation }: any) {
  const { items, removeItem } = usePantry();
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const handleDelete = (id: string, name: string) => {
    Alert.alert(
      'Remove Item',
      `Are you sure you want to remove "${name}" from your pantry?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => removeItem(id) }
      ]
    );
  };

  const getStatusBadge = (expiryDate: string | null) => {
    const days = getDaysLeft(expiryDate);
    if (days === -999) {
      return (
        <View style={tw`px-2 py-0.5 bg-gray-100 rounded-full`}>
          <Text style={tw`text-[9px] font-bold text-gray-500`}>Unknown</Text>
        </View>
      );
    }
    if (days < 0) {
      return (
        <View style={tw`px-2 py-0.5 bg-red-100 rounded-full`}>
          <Text style={tw`text-[9px] font-bold text-red-600`}>Expired</Text>
        </View>
      );
    }
    if (days <= 7) {
      return (
        <View style={tw`px-2 py-0.5 bg-amber-100 rounded-full`}>
          <Text style={tw`text-[9px] font-bold text-amber-700`}>{days}d remaining</Text>
        </View>
      );
    }
    return (
      <View style={tw`px-2 py-0.5 bg-emerald-100 rounded-full`}>
        <Text style={tw`text-[9px] font-bold text-emerald-700`}>Fresh</Text>
      </View>
    );
  };

  const filteredItems = items.filter(item => {
    const matchesSearch = (item.name || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <View style={tw`flex-1 bg-gray-50`}>
      {/* Search and Filters */}
      <View style={tw`p-4 bg-white border-b border-gray-100 shadow-xs space-y-3`}>
        <View style={tw`flex flex-row items-center bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5`}>
          <Search color="#9ca3af" size={16} style={tw`mr-2`} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search products..."
            style={tw`flex-1 text-sm text-gray-900`}
          />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={tw`flex-row mt-2`}>
          {['all', 'dairy', 'meat', 'vegetables', 'fruits', 'pantry', 'spices'].map(cat => (
            <TouchableOpacity
              key={cat}
              onPress={() => setCategoryFilter(cat)}
              style={tw`px-4 py-2 rounded-full mr-2 border ${
                categoryFilter === cat ? 'bg-[#86A789] border-[#86A789]' : 'bg-white border-gray-200'
              }`}
            >
              <Text style={tw`text-xs font-bold capitalize ${categoryFilter === cat ? 'text-white' : 'text-gray-600'}`}>
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Cards List */}
      <ScrollView contentContainerStyle={tw`p-4 pb-10`}>
        {filteredItems.length === 0 ? (
          <View style={tw`py-16 items-center`}>
            <ShieldAlert color="#d1d5db" size={48} />
            <Text style={tw`text-sm font-bold text-gray-700 mt-3`}>No items found</Text>
            <Text style={tw`text-xs text-gray-400 mt-1`}>Add items manually or use the camera scanner.</Text>
          </View>
        ) : (
          <View style={tw`space-y-4`}>
            {filteredItems.map(item => (
              <View key={item.id} style={tw`bg-white rounded-2xl border border-gray-100 shadow-sm p-4 relative flex flex-col`}>
                <View style={tw`flex flex-row items-start justify-between mb-3`}>
                  <View style={tw`flex flex-row items-center gap-2.5 flex-1`}>
                    <View style={tw`w-10 h-10 bg-gray-50 rounded-xl items-center justify-center`}>
                      <Text style={tw`text-lg`}>{getCategoryIcon(item.category)}</Text>
                    </View>
                    <View style={tw`flex-1`}>
                      <Text style={tw`text-sm font-extrabold text-gray-900 line-clamp-1`}>{item.name}</Text>
                      <Text style={tw`text-xs text-gray-400 capitalize`}>{item.category} • Qty: {item.quantity}</Text>
                    </View>
                  </View>
                  {getStatusBadge(item.expiryDate)}
                </View>

                {/* Expiry / Mfg row */}
                <View style={tw`bg-gray-50 rounded-xl p-3 mb-3 space-y-1.5`}>
                  <View style={tw`flex flex-row justify-between`}>
                    <Text style={tw`text-[10px] font-semibold text-gray-400`}>Expiry Date</Text>
                    <Text style={tw`text-[10px] font-bold text-gray-800`}>{item.expiryDate || 'N/A'}</Text>
                  </View>
                  {item.manufacturingDate && (
                    <View style={tw`flex flex-row justify-between`}>
                      <Text style={tw`text-[10px] font-semibold text-gray-400`}>Mfg Date</Text>
                      <Text style={tw`text-[10px] font-bold text-gray-800`}>{item.manufacturingDate}</Text>
                    </View>
                  )}
                  {item.batchNumber && (
                    <View style={tw`flex flex-row justify-between`}>
                      <Text style={tw`text-[10px] font-semibold text-gray-400`}>Batch</Text>
                      <Text style={tw`text-[10px] font-bold text-gray-800`}>{item.batchNumber}</Text>
                    </View>
                  )}
                </View>

                <View style={tw`flex flex-row justify-end gap-2`}>
                  <TouchableOpacity
                    onPress={() => handleDelete(item.id, item.name)}
                    style={tw`p-2 bg-red-50 rounded-lg flex-row items-center gap-1.5`}
                  >
                    <Trash2 color="#dc2626" size={14} />
                    <Text style={tw`text-[10px] font-bold text-red-600`}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
