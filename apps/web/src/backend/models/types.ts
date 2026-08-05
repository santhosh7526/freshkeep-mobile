export interface FoodItem {
  id: string;
  name: string;
  category: 'dairy' | 'meat' | 'seafood' | 'vegetables' | 'fruits' | 'bakery' | 'pantry' | 'canned' | 'frozen' | 'beverages' | 'snacks' | 'spices';
  expiryDate: string | null;
  manufacturingDate: string | null; // YYYY-MM-DD
  batchNumber?: string | null;
  addedDate: string;
  freshnessScore: number; // 0-100
  confidence: number; // OCR confidence 0-100
  price: number; // Price in rupees
  quantity: number; // Quantity
  unit: string; // Unit (kg, L, pieces, etc)
  barcode?: string; // Barcode for product identification
  imageUrl?: string;
  storageLocation?: string;
  scanMethod?: 'camera' | 'gallery' | 'manual';
  scannedAt?: string;
  updatedAt?: string;
  source?: 'gemini_scan' | 'manual_entry';
}

export interface WasteLogEntry {
  id: string;
  itemName: string;
  category: string;
  wastedDate: string;
  estimatedValue: number; // in rupees
  reason: 'expired' | 'spoiled' | 'other';
}

export interface ShoppingListItem {
  id: string;
  name: string;
  addedDate: string;
  completed: boolean;
  priority: 'low' | 'normal' | 'high';
}

export interface NotificationSettings {
  enabled: boolean;
  leadTimes: Record<FoodItem['category'], number>;
}

export interface Recipe {
  id: string;
  name: string;
  ingredients: string[];
  cookTime: string;
  difficulty: 'easy' | 'medium' | 'hard';
}
