import { FoodItem, Recipe } from '../models/types';

export function getDaysLeft(expiryDate: string | null): number {
  if (!expiryDate) return -999;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let expiry: Date;
  if (expiryDate.includes('-')) {
    // Treat YYYY-MM-DD as local time to avoid UTC shift
    const [year, month, day] = expiryDate.split('-');
    expiry = new Date(Number(year), Number(month) - 1, Number(day));
  } else {
    expiry = new Date(expiryDate);
  }
  
  if (isNaN(expiry.getTime())) return -999;
  expiry.setHours(0, 0, 0, 0);

  const diff = expiry.getTime() - today.getTime();
  const days = Math.round(diff / (1000 * 60 * 60 * 24));
  return days;
}

export function getUrgencyColor(daysLeft: number): string {
  if (daysLeft < 2) return 'text-red-500';
  if (daysLeft < 5) return 'text-yellow-500';
  return 'text-green-500';
}

export function getUrgencyBg(daysLeft: number): string {
  if (daysLeft < 2) return 'bg-red-500/10';
  if (daysLeft < 5) return 'bg-yellow-500/10';
  return 'bg-green-500/10';
}

export function getFreshnessState(score: number): string {
  const safeScore = isNaN(score) ? 50 : score;
  if (safeScore >= 85) return 'Perfect for Eating';
  if (safeScore >= 70) return 'Good Quality';
  if (safeScore >= 50) return 'Use Soon';
  if (safeScore >= 30) return 'Cook Today';
  return 'Past Prime';
}

export function calculateFreshnessScore(item: FoodItem): number {
  if (!item || !item.expiryDate) return 50; // Neutral score for unknown
  
  const daysLeft = getDaysLeft(item.expiryDate);
  if (daysLeft === -999 || isNaN(daysLeft)) return 50;

  const expiryTime = new Date(item.expiryDate).getTime();
  const addedTime = item.addedDate ? new Date(item.addedDate).getTime() : Date.now();
  if (isNaN(expiryTime) || isNaN(addedTime)) return 50;

  const totalDays = Math.ceil((expiryTime - addedTime) / (1000 * 60 * 60 * 24));

  if (daysLeft <= 0) return 0;
  if (totalDays <= 0 || isNaN(totalDays)) return 100;

  const scoreByDate = (daysLeft / totalDays) * 100;
  const finalScore = Math.min(100, Math.max(0, scoreByDate));
  return isNaN(finalScore) ? 50 : Math.round(finalScore);
}

export function getRecipeSuggestions(items: FoodItem[]): Recipe[] {
  const expiringItems = items
    .filter(item => item.expiryDate && getDaysLeft(item.expiryDate) >= 0 && getDaysLeft(item.expiryDate) <= 3)
    .map(item => item.name.toLowerCase());

  const allRecipes: Recipe[] = [
    {
      id: '1',
      name: 'Banana Pancakes',
      ingredients: ['banana', 'eggs', 'milk', 'flour'],
      cookTime: '15 min',
      difficulty: 'easy',
    },
    {
      id: '2',
      name: 'Quick Veggie Stir Fry',
      ingredients: ['vegetables', 'soy sauce', 'garlic', 'rice'],
      cookTime: '20 min',
      difficulty: 'easy',
    },
    {
      id: '3',
      name: 'Creamy Pasta',
      ingredients: ['milk', 'cheese', 'pasta', 'butter'],
      cookTime: '25 min',
      difficulty: 'medium',
    },
    {
      id: '4',
      name: 'Fruit Smoothie',
      ingredients: ['banana', 'milk', 'berries', 'yogurt'],
      cookTime: '5 min',
      difficulty: 'easy',
    },
    {
      id: '5',
      name: 'Chicken Curry',
      ingredients: ['chicken', 'curry paste', 'coconut milk', 'vegetables'],
      cookTime: '35 min',
      difficulty: 'medium',
    },
    {
      id: '6',
      name: 'Tomato Soup',
      ingredients: ['tomatoes', 'onion', 'garlic', 'cream'],
      cookTime: '30 min',
      difficulty: 'easy',
    },
  ];

  // Filter recipes that use expiring ingredients
  return allRecipes
    .filter(recipe =>
      recipe.ingredients.some(ingredient =>
        expiringItems.some(item => item.includes(ingredient) || ingredient.includes(item))
      )
    )
    .slice(0, 3);
}

export function getCategoryIcon(category: FoodItem['category']): string {
  switch (category) {
    case 'dairy':
      return '🥛';
    case 'meat':
      return '🥩';
    case 'vegetables':
      return '🥬';
    case 'pantry':
      return '🍞';
    case 'canned':
      return '🥫';
    default:
      return '🍽️';
  }
}
