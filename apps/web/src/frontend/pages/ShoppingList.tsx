import { useState } from 'react';
import { ShoppingCart, Plus, Check, Trash2, Calendar } from 'lucide-react';
import { ShoppingListItem } from '../../backend/models/types';
import { usePantry } from '@freshkeep/shared';

export default function ShoppingList() {
  const { shoppingList: items, addShoppingItem, updateShoppingItem, removeShoppingItem } = usePantry();
  const [newItemName, setNewItemName] = useState('');



  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;
    
    const newItem = {
      id: Math.random().toString(36).substr(2, 9),
      name: newItemName.trim(),
      addedDate: new Date().toISOString().split('T')[0],
      completed: false,
      priority: 'normal'
    };
    
    addShoppingItem(newItem);
    setNewItemName('');
  };

  const handleToggle = (item: ShoppingListItem) => {
    updateShoppingItem(item.id, { completed: !item.completed });
  };

  const handleDelete = (id: string) => {
    removeShoppingItem(id);
  };

  const pendingItems = items.filter(i => !i.completed);
  const completedItems = items.filter(i => i.completed);

  return (
    <div className="w-full h-full bg-white md:bg-gray-50 flex justify-center pb-24 md:pb-8">
      <div className="max-w-4xl w-full mx-auto p-4 md:p-8">
        
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 bg-[#86A789]/10 rounded-2xl flex items-center justify-center text-[#86A789]">
            <ShoppingCart className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Shopping List</h1>
            <p className="text-sm text-gray-500 font-medium mt-1">
              {pendingItems.length} items to buy
            </p>
          </div>
        </div>

        <form onSubmit={handleAddItem} className="mb-8">
          <div className="flex gap-3">
            <input
              type="text"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              placeholder="Add a new item to buy..."
              className="flex-1 bg-white border border-gray-200 rounded-xl px-4 py-3.5 text-sm font-semibold text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#86A789]"
            />
            <button
              type="submit"
              disabled={!newItemName.trim()}
              className="px-6 py-3.5 bg-[#86A789] hover:bg-[#729275] disabled:bg-gray-200 disabled:text-gray-400 text-white rounded-xl font-bold transition-all shadow-sm flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" />
              <span className="hidden sm:inline">Add Item</span>
            </button>
          </div>
        </form>

        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {pendingItems.length === 0 && completedItems.length === 0 ? (
              <div className="p-12 text-center text-gray-500">
                <ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p className="font-bold text-gray-700">Your shopping list is empty.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {pendingItems.map(item => (
                  <div key={item.id} className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors group">
                    <div className="flex items-center gap-4">
                      <button 
                        onClick={() => handleToggle(item)}
                        className="w-6 h-6 rounded-md border-2 border-gray-300 flex items-center justify-center text-transparent hover:border-[#86A789]"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <div>
                        <p className="text-sm font-bold text-gray-900">{item.name}</p>
                        <div className="flex items-center gap-1 text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-wider">
                          <Calendar className="w-3 h-3" />
                          Added {item.addedDate}
                        </div>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleDelete(item.id)}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}

                {completedItems.length > 0 && (
                  <div className="bg-gray-50/50">
                    <div className="px-4 py-3 bg-gray-100/50 border-b border-gray-100">
                      <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Completed</h3>
                    </div>
                    {completedItems.map(item => (
                      <div key={item.id} className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors group">
                        <div className="flex items-center gap-4 opacity-50">
                          <button 
                            onClick={() => handleToggle(item)}
                            className="w-6 h-6 rounded-md border-2 border-[#86A789] bg-[#86A789] flex items-center justify-center text-white"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <div>
                            <p className="text-sm font-bold text-gray-900 line-through">{item.name}</p>
                          </div>
                        </div>
                        <button 
                          onClick={() => handleDelete(item.id)}
                          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
