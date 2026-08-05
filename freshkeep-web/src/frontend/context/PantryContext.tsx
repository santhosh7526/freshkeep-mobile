import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { FoodItem, ShoppingListItem, WasteLogEntry } from '../../backend/models/types';
import {
  subscribeToPantryItems,
  savePantryItem,
  updatePantryItem,
  deletePantryItem,
  subscribeToShoppingList,
  saveShoppingItem,
  updateShoppingItem,
  deleteShoppingItem,
  subscribeToWasteLog,
  saveWasteEntry,
} from '../lib/firestoreService';

interface PantryContextType {
  // Pantry
  items: FoodItem[];
  addItem: (item: Omit<FoodItem, 'id'>) => Promise<void>;
  updateItem: (id: string, updates: Partial<FoodItem>) => Promise<void>;
  removeItem: (id: string) => Promise<void>;

  // Shopping List
  shoppingList: ShoppingListItem[];
  addShoppingItem: (item: Omit<ShoppingListItem, 'id'>) => Promise<void>;
  updateShoppingItem: (id: string, updates: Partial<ShoppingListItem>) => Promise<void>;
  removeShoppingItem: (id: string) => Promise<void>;

  // Waste Log
  wasteLog: WasteLogEntry[];
  addWasteEntry: (entry: Omit<WasteLogEntry, 'id'>) => Promise<void>;
}

const PantryContext = createContext<PantryContextType | undefined>(undefined);

export const PantryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  
  const [items, setItems] = useState<FoodItem[]>([]);
  const [shoppingList, setShoppingList] = useState<ShoppingListItem[]>([]);
  const [wasteLog, setWasteLog] = useState<WasteLogEntry[]>([]);

  useEffect(() => {
    // If no user is logged in, clear state and don't attach listeners
    if (!user) {
      setItems([]);
      setShoppingList([]);
      setWasteLog([]);
      return;
    }

    // Attach real-time listeners for the authenticated user
    const unsubscribePantry = subscribeToPantryItems((newItems) => {
      setItems(newItems);
    });

    const unsubscribeShoppingList = subscribeToShoppingList((newShoppingItems) => {
      setShoppingList(newShoppingItems);
    });

    const unsubscribeWasteLog = subscribeToWasteLog((newWasteEntries) => {
      setWasteLog(newWasteEntries);
    });

    // Cleanup listeners on unmount or user change
    return () => {
      unsubscribePantry();
      unsubscribeShoppingList();
      unsubscribeWasteLog();
    };
  }, [user]);

  // PANTRY ACTIONS
  const handleAddItem = async (item: Omit<FoodItem, 'id'>) => {
    // Check for duplicates
    const existing = items.find(i => (i.name || '').toLowerCase() === (item.name || '').toLowerCase());
    if (existing) {
      const currentQty = existing.quantity || 1;
      const newQty = item.quantity || 1;
      await updatePantryItem(existing.id, { 
        quantity: currentQty + newQty,
        // Optionally update other fields like expiry if they scanned a newer batch
        expiryDate: item.expiryDate 
      });
    } else {
      await savePantryItem(item);
    }
  };

  const handleUpdateItem = async (id: string, updates: Partial<FoodItem>) => {
    await updatePantryItem(id, updates);
  };

  const handleRemoveItem = async (id: string) => {
    const targetItem = items.find(i => i.id === id);
    await deletePantryItem(id, targetItem?.imageUrl);
  };

  // SHOPPING LIST ACTIONS
  const handleAddShoppingItem = async (item: Omit<ShoppingListItem, 'id'>) => {
    await saveShoppingItem(item);
  };

  const handleUpdateShoppingItem = async (id: string, updates: Partial<ShoppingListItem>) => {
    await updateShoppingItem(id, updates);
  };

  const handleRemoveShoppingItem = async (id: string) => {
    await deleteShoppingItem(id);
  };

  // WASTE LOG ACTIONS
  const handleAddWasteEntry = async (entry: Omit<WasteLogEntry, 'id'>) => {
    await saveWasteEntry(entry);
  };

  return (
    <PantryContext.Provider
      value={{
        items,
        addItem: handleAddItem,
        updateItem: handleUpdateItem,
        removeItem: handleRemoveItem,
        
        shoppingList,
        addShoppingItem: handleAddShoppingItem,
        updateShoppingItem: handleUpdateShoppingItem,
        removeShoppingItem: handleRemoveShoppingItem,

        wasteLog,
        addWasteEntry: handleAddWasteEntry,
      }}
    >
      {children}
    </PantryContext.Provider>
  );
};

export const usePantry = () => {
  const context = useContext(PantryContext);
  if (!context) {
    throw new Error('usePantry must be used within a PantryProvider');
  }
  return context;
};
