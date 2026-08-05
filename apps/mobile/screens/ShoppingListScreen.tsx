import React, { useState } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, Alert } from 'react-native';
import { usePantry, ShoppingListItem } from '@freshkeep/shared';
import { CheckSquare, Square, Plus, Trash2, ShieldAlert } from 'lucide-react-native';
import tw from 'twrnc';

export default function ShoppingListScreen() {
  const { shoppingList, addShoppingItem, updateShoppingItem, removeShoppingItem } = usePantry();
  const [newItemName, setNewItemName] = useState('');
  const [priority, setPriority] = useState<'low' | 'normal' | 'high'>('normal');

  const handleAddItem = async () => {
    if (!newItemName.trim()) return;
    try {
      await addShoppingItem({
        name: newItemName.trim(),
        addedDate: new Date().toISOString().split('T')[0],
        completed: false,
        priority,
      });
      setNewItemName('');
      setPriority('normal');
    } catch (err: any) {
      Alert.alert('Error', 'Failed to add item.');
    }
  };

  const handleToggleCompleted = async (item: ShoppingListItem) => {
    try {
      await updateShoppingItem(item.id, { completed: !item.completed });
    } catch (err) {
      Alert.alert('Error', 'Failed to update item.');
    }
  };

  const getPriorityColor = (p: string) => {
    switch (p) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'low': return 'text-gray-500 bg-gray-50 border-gray-200';
      default: return 'text-blue-600 bg-blue-50 border-blue-200';
    }
  };

  return (
    <View style={tw`flex-1 bg-gray-50`}>
      {/* Add Item form */}
      <View style={tw`p-4 bg-white border-b border-gray-100 shadow-xs space-y-3`}>
        <View style={tw`flex flex-row items-center bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5`}>
          <TextInput
            value={newItemName}
            onChangeText={setNewItemName}
            placeholder="Add item name..."
            style={tw`flex-1 text-sm text-gray-900`}
          />
          <TouchableOpacity onPress={handleAddItem} style={tw`bg-[#86A789] px-4 py-1.5 rounded-lg ml-2`}>
            <Text style={tw`text-white font-bold text-xs`}>Add</Text>
          </TouchableOpacity>
        </View>
        
        {/* Priority select */}
        <View style={tw`flex flex-row items-center`}>
          <Text style={tw`text-xs text-gray-400 font-bold mr-3`}>Priority:</Text>
          {['low', 'normal', 'high'].map(p => (
            <TouchableOpacity
              key={p}
              onPress={() => setPriority(p as any)}
              style={tw`px-3 py-1 rounded-full mr-2 border ${
                priority === p ? 'bg-[#86A789] border-[#86A789]' : 'bg-white border-gray-200'
              }`}
            >
              <Text style={tw`text-[10px] font-bold capitalize ${priority === p ? 'text-white' : 'text-gray-500'}`}>
                {p}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Shopping List Items */}
      <ScrollView contentContainerStyle={tw`p-4 pb-10`}>
        {shoppingList.length === 0 ? (
          <View style={tw`py-16 items-center`}>
            <CheckSquare color="#d1d5db" size={48} />
            <Text style={tw`text-sm font-bold text-gray-700 mt-3`}>Shopping list is empty</Text>
            <Text style={tw`text-xs text-gray-400 mt-1`}>Add items that you need to buy next.</Text>
          </View>
        ) : (
          <View style={tw`space-y-3`}>
            {shoppingList.map(item => (
              <View key={item.id} style={tw`bg-white p-4 rounded-xl border border-gray-100 flex flex-row items-center justify-between shadow-xs`}>
                <TouchableOpacity onPress={() => handleToggleCompleted(item)} style={tw`flex-row items-center gap-3 flex-1`}>
                  {item.completed ? (
                    <CheckSquare color="#86A789" size={20} />
                  ) : (
                    <Square color="#9ca3af" size={20} />
                  )}
                  <View style={tw`flex-1`}>
                    <Text style={tw`text-sm font-bold text-gray-900 ${item.completed ? 'line-through text-gray-450' : ''}`}>
                      {item.name}
                    </Text>
                    <View style={tw`flex flex-row items-center gap-2 mt-1`}>
                      <View style={tw`px-2 py-0.5 rounded-full border ${getPriorityColor(item.priority)}`}>
                        <Text style={tw`text-[8px] font-black uppercase`}>{item.priority}</Text>
                      </View>
                      <Text style={tw`text-[9px] text-gray-400`}>Added: {item.addedDate}</Text>
                    </View>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => removeShoppingItem(item.id)} style={tw`p-2`}>
                  <Trash2 color="#dc2626" size={16} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
