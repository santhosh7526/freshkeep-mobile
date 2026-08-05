import React, { useState } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, Alert } from 'react-native';
import { usePantry } from '@freshkeep/shared';
import { Trash2, AlertTriangle, ShieldAlert } from 'lucide-react-native';
import tw from 'twrnc';

export default function WasteLogScreen() {
  const { wasteLog, addWasteEntry } = usePantry();
  const [newItemName, setNewItemName] = useState('');
  const [value, setValue] = useState('');
  const [reason, setReason] = useState<'expired' | 'spoiled' | 'other'>('expired');

  const handleAddWaste = async () => {
    if (!newItemName.trim() || !value.trim()) return;
    try {
      await addWasteEntry({
        itemName: newItemName.trim(),
        category: 'other',
        wastedDate: new Date().toISOString().split('T')[0],
        estimatedValue: parseFloat(value) || 0,
        reason,
      });
      setNewItemName('');
      setValue('');
      setReason('expired');
    } catch (err) {
      Alert.alert('Error', 'Failed to add waste log.');
    }
  };

  const totalWastedVal = wasteLog.reduce((acc, curr) => acc + (curr.estimatedValue || 0), 0);

  return (
    <View style={tw`flex-1 bg-gray-50`}>
      {/* Waste Stats */}
      <View style={tw`p-5 bg-white border-b border-gray-150 flex-row justify-between items-center shadow-xs`}>
        <View>
          <Text style={tw`text-xs font-bold text-gray-400 uppercase`}>Total Food Wasted Value</Text>
          <Text style={tw`text-2xl font-black text-red-600 mt-1`}>₹{Math.round(totalWastedVal)}</Text>
        </View>
        <View style={tw`w-10 h-10 bg-red-50 rounded-xl items-center justify-center`}>
          <Trash2 color="#dc2626" size={20} />
        </View>
      </View>

      {/* Add Log Form */}
      <View style={tw`p-4 bg-white border-b border-gray-100 shadow-xs space-y-3`}>
        <Text style={tw`text-xs font-bold text-gray-400 uppercase`}>Log Wasted Product</Text>
        <View style={tw`flex flex-row gap-3`}>
          <TextInput
            value={newItemName}
            onChangeText={setNewItemName}
            placeholder="Product Name..."
            style={tw`flex-[2] bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-900`}
          />
          <TextInput
            value={value}
            onChangeText={setValue}
            keyboardType="numeric"
            placeholder="Val (₹)..."
            style={tw`flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-900`}
          />
        </View>
        
        <View style={tw`flex flex-row items-center justify-between`}>
          <View style={tw`flex flex-row items-center`}>
            {['expired', 'spoiled', 'other'].map(r => (
              <TouchableOpacity
                key={r}
                onPress={() => setReason(r as any)}
                style={tw`px-3 py-1 rounded-full mr-2 border ${
                  reason === r ? 'bg-red-500 border-red-500' : 'bg-white border-gray-200'
                }`}
              >
                <Text style={tw`text-[10px] font-bold capitalize ${reason === r ? 'text-white' : 'text-gray-500'}`}>
                  {r}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity onPress={handleAddWaste} style={tw`bg-red-500 px-4 py-2 rounded-xl`}>
            <Text style={tw`text-white font-bold text-xs`}>Log</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Waste Listings */}
      <ScrollView contentContainerStyle={tw`p-4 pb-10`}>
        {wasteLog.length === 0 ? (
          <View style={tw`py-16 items-center`}>
            <AlertTriangle color="#d1d5db" size={48} />
            <Text style={tw`text-sm font-bold text-gray-700 mt-3`}>Waste log is empty</Text>
            <Text style={tw`text-xs text-gray-400 mt-1`}>Wasted items will appear here.</Text>
          </View>
        ) : (
          <View style={tw`space-y-3`}>
            {wasteLog.map(item => (
              <View key={item.id} style={tw`bg-white p-4 rounded-xl border border-gray-100 flex flex-row items-center justify-between shadow-xs`}>
                <View style={tw`flex-1`}>
                  <Text style={tw`text-sm font-bold text-gray-900`}>{item.itemName}</Text>
                  <View style={tw`flex flex-row items-center gap-2 mt-1`}>
                    <View style={tw`px-2 py-0.5 rounded-full bg-red-50`}>
                      <Text style={tw`text-[8px] font-bold text-red-700 uppercase`}>{item.reason}</Text>
                    </View>
                    <Text style={tw`text-[9px] text-gray-400`}>Logged: {item.wastedDate}</Text>
                  </View>
                </View>
                <Text style={tw`text-sm font-black text-red-600`}>₹{item.estimatedValue}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
