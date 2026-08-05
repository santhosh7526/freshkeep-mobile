import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  collection,
  addDoc,
  doc,
  deleteDoc,
  updateDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import { useAuth } from './AuthContext';
import { db, storage } from '../firebase/config';

export interface FoodItem {
  id: string;
  name: string;
  category: 'dairy' | 'meat' | 'seafood' | 'vegetables' | 'fruits' | 'bakery' | 'pantry' | 'canned' | 'frozen' | 'beverages' | 'snacks' | 'spices';
  expiryDate: string | null;
  manufacturingDate: string | null;
  batchNumber?: string | null;
  addedDate: string;
  freshnessScore: number;
  confidence: number;
  price: number;
  quantity: number;
  unit: string;
  imageUrl?: string;
  storageLocation?: string;
}

export interface WasteLogEntry {
  id: string;
  itemName: string;
  category: string;
  wastedDate: string;
  estimatedValue: number;
  reason: 'expired' | 'spoiled' | 'other';
}

export interface ShoppingListItem {
  id: string;
  name: string;
  addedDate: string;
  completed: boolean;
  priority: 'low' | 'normal' | 'high';
}

interface PantryContextType {
  items: FoodItem[];
  addItem: (item: Omit<FoodItem, 'id'>) => Promise<void>;
  updateItem: (id: string, updates: Partial<FoodItem>) => Promise<void>;
  removeItem: (id: string) => Promise<void>;
  
  shoppingList: ShoppingListItem[];
  addShoppingItem: (item: Omit<ShoppingListItem, 'id'>) => Promise<void>;
  updateShoppingItem: (id: string, updates: Partial<ShoppingListItem>) => Promise<void>;
  removeShoppingItem: (id: string) => Promise<void>;

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
    if (!user) {
      setItems([]);
      setShoppingList([]);
      setWasteLog([]);
      return;
    }

    const userId = user.id;

    // Listeners
    const qPantry = query(
      collection(db, 'users', userId, 'pantry'),
      orderBy('createdAt', 'desc')
    );
    const unsubscribePantry = onSnapshot(qPantry, (snapshot) => {
      const list: FoodItem[] = snapshot.docs.map(d => {
        const data = d.data();
        return {
          id: d.id,
          name: data.name || 'Unknown Item',
          category: data.category,
          expiryDate: data.expiryDate || null,
          manufacturingDate: data.manufacturingDate || null,
          batchNumber: data.batchNumber || null,
          addedDate: data.addedDate || new Date().toISOString(),
          freshnessScore: data.freshnessScore ?? 100,
          confidence: data.confidence ?? 95,
          price: data.price ?? 0,
          quantity: data.quantity ?? 1,
          unit: data.unit ?? 'pcs',
          imageUrl: data.imageUrl,
          storageLocation: data.storageLocation || 'pantry',
        } as FoodItem;
      });
      setItems(list);
    });

    const qShopping = query(
      collection(db, 'users', userId, 'shoppingList'),
      orderBy('createdAt', 'asc')
    );
    const unsubscribeShopping = onSnapshot(qShopping, (snapshot) => {
      const list: ShoppingListItem[] = snapshot.docs.map(d => {
        const data = d.data();
        return {
          id: d.id,
          name: data.name,
          addedDate: data.addedDate,
          completed: data.completed ?? false,
          priority: data.priority ?? 'normal',
        } as ShoppingListItem;
      });
      setShoppingList(list);
    });

    const qWaste = query(
      collection(db, 'users', userId, 'wasteLog'),
      orderBy('createdAt', 'desc')
    );
    const unsubscribeWaste = onSnapshot(qWaste, (snapshot) => {
      const list: WasteLogEntry[] = snapshot.docs.map(d => {
        const data = d.data();
        return {
          id: d.id,
          itemName: data.itemName,
          category: data.category,
          wastedDate: data.wastedDate,
          estimatedValue: data.estimatedValue,
          reason: data.reason,
        } as WasteLogEntry;
      });
      setWasteLog(list);
    });

    return () => {
      unsubscribePantry();
      unsubscribeShopping();
      unsubscribeWaste();
    };
  }, [user]);

  // UPLOAD IMAGE HELPER
  const uploadImage = async (userId: string, base64Image: string): Promise<string> => {
    const imageId = `${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const storageRef = ref(storage, `users/${userId}/pantry_images/${imageId}.jpg`);
    await uploadString(storageRef, base64Image, 'data_url');
    return await getDownloadURL(storageRef);
  };

  // PANTRY ACTIONS
  const addItem = async (item: Omit<FoodItem, 'id'>) => {
    if (!user) return;
    
    let finalImageUrl = item.imageUrl;
    if (item.imageUrl && item.imageUrl.startsWith('data:image/')) {
      try {
        finalImageUrl = await uploadImage(user.id, item.imageUrl);
      } catch (err) {
        console.warn('Failed to upload storage image, using local base64 preview:', err);
      }
    }

    const existing = items.find(i => (i.name || '').toLowerCase() === (item.name || '').toLowerCase());
    if (existing) {
      const currentQty = existing.quantity || 1;
      const newQty = item.quantity || 1;
      await updateDoc(doc(db, 'users', user.id, 'pantry', existing.id), { 
        quantity: currentQty + newQty,
        expiryDate: item.expiryDate,
        updatedAt: serverTimestamp(),
      });
    } else {
      const cleanItem = Object.fromEntries(Object.entries(item).filter(([_, v]) => v !== undefined));
      await addDoc(collection(db, 'users', user.id, 'pantry'), {
        ...cleanItem,
        imageUrl: finalImageUrl || null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  };

  const updateItem = async (id: string, updates: Partial<FoodItem>) => {
    if (!user) return;
    const cleanUpdates = Object.fromEntries(Object.entries(updates).filter(([_, v]) => v !== undefined));
    await updateDoc(doc(db, 'users', user.id, 'pantry', id), {
      ...cleanUpdates,
      updatedAt: serverTimestamp(),
    });
  };

  const removeItem = async (id: string) => {
    if (!user) return;
    await deleteDoc(doc(db, 'users', user.id, 'pantry', id));
  };

  // SHOPPING LIST ACTIONS
  const addShoppingItem = async (item: Omit<ShoppingListItem, 'id'>) => {
    if (!user) return;
    await addDoc(collection(db, 'users', user.id, 'shoppingList'), {
      ...item,
      createdAt: serverTimestamp(),
    });
  };

  const updateShoppingItem = async (id: string, updates: Partial<ShoppingListItem>) => {
    if (!user) return;
    await updateDoc(doc(db, 'users', user.id, 'shoppingList', id), updates);
  };

  const removeShoppingItem = async (id: string) => {
    if (!user) return;
    await deleteDoc(doc(db, 'users', user.id, 'shoppingList', id));
  };

  // WASTE LOG ACTIONS
  const addWasteEntry = async (entry: Omit<WasteLogEntry, 'id'>) => {
    if (!user) return;
    await addDoc(collection(db, 'users', user.id, 'wasteLog'), {
      ...entry,
      createdAt: serverTimestamp(),
    });
  };

  return (
    <PantryContext.Provider
      value={{
        items,
        addItem,
        updateItem,
        removeItem,
        
        shoppingList,
        addShoppingItem,
        updateShoppingItem,
        removeShoppingItem,

        wasteLog,
        addWasteEntry,
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
