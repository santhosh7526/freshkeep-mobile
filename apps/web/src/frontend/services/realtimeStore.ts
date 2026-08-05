/**
 * realtimeStore.ts
 * Local store + Firestore sync manager.
 *
 * Write path: Scanner → addItem() → localStorage (instant) + Firestore (async)
 * Read path:  Components → subscribe() → get live updates from both
 */

import { store } from '../../backend/storage/store';
import { FoodItem, WasteLogEntry } from '../../backend/models/types';
import { savePantryItem, deletePantryItem, subscribeToPantryItems } from '../lib/firestoreService';

export type RealtimeSyncStatus = 'connected' | 'syncing' | 'offline';

type RealtimeListener = () => void;

// Cross-tab broadcast channel for local real-time sync
export const realtimeBroadcastChannel =
  typeof window !== 'undefined' && 'BroadcastChannel' in window
    ? new BroadcastChannel('freshkeep_realtime_sync')
    : null;

class RealtimeStoreManager {
  private listeners: Set<RealtimeListener> = new Set();
  private status: RealtimeSyncStatus = 'connected';
  private firestoreUnsubscribe: (() => void) | null = null;

  constructor() {
    this.initBroadcastChannel();
  }

  private initBroadcastChannel() {
    if (realtimeBroadcastChannel) {
      realtimeBroadcastChannel.onmessage = (event) => {
        if (event.data?.type === 'FRESHKEEP_DATA_UPDATED') {
          this.notifyListeners();
        }
      };
    }
  }

  public subscribe(listener: RealtimeListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners() {
    this.listeners.forEach(l => l());
  }

  public broadcastUpdate(action: string, payload?: any) {
    this.notifyListeners();
    if (realtimeBroadcastChannel) {
      realtimeBroadcastChannel.postMessage({
        type: 'FRESHKEEP_DATA_UPDATED',
        action,
        payload,
        timestamp: Date.now(),
      });
    }
  }

  public resetStore() {
    store.setItems([]);
    store.clearShoppingList();
    store.clearWasteLog();
    this.notifyListeners();
  }

  public addItem(item: FoodItem) {
    store.addItem(item);
    this.broadcastUpdate('ADD_ITEM', item);
    savePantryItem(item).catch(err => {
      console.warn('[Store] Firestore sync failed for item:', err.message);
    });
  }

  public removeItem(id: string) {
    store.removeItem(id);
    this.broadcastUpdate('REMOVE_ITEM', { id });
    deletePantryItem(id);
  }

  public updateItem(id: string, updates: Partial<FoodItem>) {
    store.updateItem(id, updates);
    this.broadcastUpdate('UPDATE_ITEM', { id, updates });
  }

  public addWasteEntry(entry: WasteLogEntry) {
    store.addWasteEntry(entry);
    this.broadcastUpdate('ADD_WASTE', entry);
  }

  public addToShoppingList(item: string) {
    store.addToShoppingList(item);
    this.broadcastUpdate('ADD_SHOPPING', item);
  }

  public removeFromShoppingList(item: string) {
    store.removeFromShoppingList(item);
    this.broadcastUpdate('REMOVE_SHOPPING', item);
  }

  public getStatus(): RealtimeSyncStatus {
    return this.status;
  }

  public destroy() {
    if (this.firestoreUnsubscribe) {
      this.firestoreUnsubscribe();
    }
  }
}

export const realtimeStore = new RealtimeStoreManager();
