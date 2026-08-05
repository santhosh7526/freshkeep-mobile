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
  setDoc,
} from 'firebase/firestore';
import { ref, uploadString, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, auth, storage } from './firebase';
import { FoodItem, WasteLogEntry, ShoppingListItem } from '../../backend/models/types';

// Collection definitions
const USERS_COLLECTION = 'users';
const PANTRY_SUBCOLLECTION = 'pantry';
const WASTE_LOG_SUBCOLLECTION = 'wasteLog';
const SHOPPING_LIST_SUBCOLLECTION = 'shoppingList';

/**
 * Get the current user's UID for scoping Firestore documents.
 */
function getUserId(): string | null {
  return auth.currentUser?.uid || null;
}

/**
 * Compress base64 image on an HTML Canvas (max 400px width, 0.6 quality)
 */
export async function compressBase64Image(dataUrl: string, maxWidth = 400, quality = 0.6): Promise<string> {
  return new Promise((resolve) => {
    if (!dataUrl || !dataUrl.startsWith('data:image/')) return resolve(dataUrl);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      } else {
        resolve(dataUrl);
      }
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

/**
 * Upload image to Firebase Storage at users/{userId}/pantry_images/{imageId}.jpg
 */
export async function uploadPantryImage(userId: string, imageDataUrl: string): Promise<string> {
  try {
    const compressed = await compressBase64Image(imageDataUrl);
    const imageId = `${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const storageRef = ref(storage, `users/${userId}/pantry_images/${imageId}.jpg`);
    
    // Wrap the upload in a 3-second timeout so it doesn't hang forever if bucket is misconfigured
    await Promise.race([
      uploadString(storageRef, compressed, 'data_url'),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Storage upload timed out')), 3000))
    ]);

    return await getDownloadURL(storageRef);
  } catch (err: any) {
    console.warn('[Storage] Firebase Storage upload fallback to compressed thumbnail:', err.message);
    return await compressBase64Image(imageDataUrl, 300, 0.5);
  }
}

// ---------------------------------------------------------
// PANTRY ITEMS
// ---------------------------------------------------------

export async function savePantryItem(item: Omit<FoodItem, 'id'>): Promise<string> {
  const userId = getUserId();
  if (!userId) throw new Error('User not authenticated');
  
  let finalImageUrl = item.imageUrl;
  if (item.imageUrl && item.imageUrl.startsWith('data:image/')) {
    finalImageUrl = await uploadPantryImage(userId, item.imageUrl);
  }

  try {
    // Firestore throws error on undefined values
    const cleanItem = Object.fromEntries(Object.entries(item).filter(([_, v]) => v !== undefined));
    const docRef = await addDoc(collection(db, USERS_COLLECTION, userId, PANTRY_SUBCOLLECTION), {
      ...cleanItem,
      imageUrl: finalImageUrl || null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (err: any) {
    console.error('[Firestore] Save pantry item failed:', err.message);
    throw new Error('Failed to save to Firestore. Check permissions or network.');
  }
}

export async function updatePantryItem(itemId: string, updates: Partial<FoodItem>): Promise<void> {
  try {
    const userId = getUserId();
    if (!userId) return;

    const cleanUpdates = Object.fromEntries(Object.entries(updates).filter(([_, v]) => v !== undefined));

    await updateDoc(doc(db, USERS_COLLECTION, userId, PANTRY_SUBCOLLECTION, itemId), {
      ...cleanUpdates,
      updatedAt: serverTimestamp(),
    });
  } catch (err: any) {
    console.error('[Firestore] Update pantry item failed:', err.message);
  }
}

export async function deletePantryItem(itemId: string, imageUrl?: string | null): Promise<void> {
  try {
    const userId = getUserId();
    if (!userId) return;

    if (imageUrl && imageUrl.includes('firebasestorage.googleapis.com')) {
      try {
        const imageRef = ref(storage, imageUrl);
        await deleteObject(imageRef);
      } catch (e) {
        console.warn('[Storage] Could not delete image from Firebase Storage:', e);
      }
    }

    await deleteDoc(doc(db, USERS_COLLECTION, userId, PANTRY_SUBCOLLECTION, itemId));
  } catch (err: any) {
    console.error('[Firestore] Delete pantry item failed:', err.message);
  }
}

export function subscribeToPantryItems(onChange: (items: FoodItem[]) => void): () => void {
  try {
    const userId = getUserId();
    if (!userId) return () => {};

    const q = query(
      collection(db, USERS_COLLECTION, userId, PANTRY_SUBCOLLECTION),
      orderBy('createdAt', 'desc')
    );

    return onSnapshot(q, (snapshot) => {
      const items: FoodItem[] = snapshot.docs.map(d => {
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
        } as FoodItem;
      });
      onChange(items);
    }, (err) => {
      console.error('[Firestore] Pantry listener error:', err.message);
    });
  } catch (err: any) {
    console.error('[Firestore] Subscribe to pantry failed:', err.message);
    return () => {};
  }
}


// ---------------------------------------------------------
// SHOPPING LIST
// ---------------------------------------------------------

export async function saveShoppingItem(item: Omit<ShoppingListItem, 'id'>): Promise<string | null> {
  try {
    const userId = getUserId();
    if (!userId) throw new Error('User not authenticated');
    
    const docRef = await addDoc(collection(db, USERS_COLLECTION, userId, SHOPPING_LIST_SUBCOLLECTION), {
      ...item,
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (err: any) {
    console.error('[Firestore] Save shopping item failed:', err.message);
    return null;
  }
}

export async function updateShoppingItem(itemId: string, updates: Partial<ShoppingListItem>): Promise<void> {
  try {
    const userId = getUserId();
    if (!userId) return;
    await updateDoc(doc(db, USERS_COLLECTION, userId, SHOPPING_LIST_SUBCOLLECTION, itemId), updates);
  } catch (err: any) {
    console.error('[Firestore] Update shopping item failed:', err.message);
  }
}

export async function deleteShoppingItem(itemId: string): Promise<void> {
  try {
    const userId = getUserId();
    if (!userId) return;
    await deleteDoc(doc(db, USERS_COLLECTION, userId, SHOPPING_LIST_SUBCOLLECTION, itemId));
  } catch (err: any) {
    console.error('[Firestore] Delete shopping item failed:', err.message);
  }
}

export function subscribeToShoppingList(onChange: (items: ShoppingListItem[]) => void): () => void {
  try {
    const userId = getUserId();
    if (!userId) return () => {};

    const q = query(
      collection(db, USERS_COLLECTION, userId, SHOPPING_LIST_SUBCOLLECTION),
      orderBy('createdAt', 'asc')
    );

    return onSnapshot(q, (snapshot) => {
      const items: ShoppingListItem[] = snapshot.docs.map(d => {
        const data = d.data();
        return {
          id: d.id,
          name: data.name,
          addedDate: data.addedDate,
          completed: data.completed ?? false,
          priority: data.priority ?? 'normal',
        } as ShoppingListItem;
      });
      onChange(items);
    }, (err) => {
      console.error('[Firestore] Shopping list listener error:', err.message);
    });
  } catch (err: any) {
    console.error('[Firestore] Subscribe to shopping list failed:', err.message);
    return () => {};
  }
}

// ---------------------------------------------------------
// WASTE LOG
// ---------------------------------------------------------

export async function saveWasteEntry(entry: Omit<WasteLogEntry, 'id'>): Promise<string | null> {
  try {
    const userId = getUserId();
    if (!userId) throw new Error('User not authenticated');
    
    const docRef = await addDoc(collection(db, USERS_COLLECTION, userId, WASTE_LOG_SUBCOLLECTION), {
      ...entry,
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (err: any) {
    console.error('[Firestore] Save waste entry failed:', err.message);
    return null;
  }
}

export function subscribeToWasteLog(onChange: (items: WasteLogEntry[]) => void): () => void {
  try {
    const userId = getUserId();
    if (!userId) return () => {};

    const q = query(
      collection(db, USERS_COLLECTION, userId, WASTE_LOG_SUBCOLLECTION),
      orderBy('createdAt', 'desc')
    );

    return onSnapshot(q, (snapshot) => {
      const items: WasteLogEntry[] = snapshot.docs.map(d => {
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
      onChange(items);
    }, (err) => {
      console.error('[Firestore] Waste log listener error:', err.message);
    });
  } catch (err: any) {
    console.error('[Firestore] Subscribe to waste log failed:', err.message);
    return () => {};
  }
}
