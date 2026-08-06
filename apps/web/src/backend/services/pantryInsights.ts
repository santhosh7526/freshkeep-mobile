import { GoogleGenerativeAI } from '@google/generative-ai';
import { FoodItem } from '../models/types';
import { getDaysLeft } from '../logic/helpers';

export async function generatePantryInsight(items: FoodItem[]): Promise<string> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey || apiKey === 'YOUR_GEMINI_API_KEY_HERE') {
    return 'Add your API key to get personalized chef recommendations for your pantry.';
  }

  // Filter items that are expiring within the next 7 days, excluding already expired items
  const expiringSoon = items
    .filter(i => {
      const days = getDaysLeft(i.expiryDate);
      return days >= 0 && days <= 7;
    })
    .map(i => `${i.name} (${getDaysLeft(i.expiryDate)} days left)`);

  if (expiringSoon.length === 0) {
    return "Your pantry is looking fresh! No items are expiring in the next week. Great job reducing waste!";
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' });

    const prompt = `
You are an expert chef and zero-waste advocate. 
The user has the following items expiring soon in their pantry:
${expiringSoon.join(', ')}

Provide a creative, practical 2-sentence tip or recipe idea to help them use these specific ingredients before they go bad.
DO NOT mention "AI", "Gemini", or artificial intelligence. Speak directly as a helpful chef.
Keep it extremely concise, max 2 sentences.
`;

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    
    return text || "Try combining your expiring ingredients into a hearty soup or a quick stir-fry to avoid waste!";
  } catch (error) {
    console.error('[Pantry Insights] Failed to generate insight:', error);
    return "Try combining your expiring ingredients into a hearty soup or a quick stir-fry to avoid waste!";
  }
}
