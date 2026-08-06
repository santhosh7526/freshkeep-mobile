import React from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { FoodItem } from '../../backend/models/types';
import { getDaysLeft, getCategoryIcon } from '../../backend/logic/helpers';

interface DraggableItemProps {
  item: FoodItem;
}

function DraggableItem({ item }: DraggableItemProps) {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'FOOD_ITEM',
    item: { id: item.id },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));

  const days = item.expiryDate ? getDaysLeft(item.expiryDate) : null;
  const status = days === null ? 'unknown' : days < 0 ? 'expired' : days <= 7 ? 'expiring-soon' : 'fresh';

  return (
    <div
      ref={drag}
      className={`bg-white dark:bg-gray-800 p-3 mb-3 rounded-xl border ${isDragging ? 'opacity-50 border-emerald-500' : 'opacity-100 border-gray-100 dark:border-gray-700'} shadow-sm cursor-grab active:cursor-grabbing hover:border-gray-200 dark:hover:border-gray-600 transition-colors`}
    >
      <div className="flex justify-between items-start mb-2">
        <h4 className="text-sm font-bold text-gray-900 dark:text-white line-clamp-1">{item.name}</h4>
        {status === 'expired' && <span className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0 mt-1.5" />}
        {status === 'expiring-soon' && <span className="w-2 h-2 rounded-full bg-amber-500 flex-shrink-0 mt-1.5" />}
        {status === 'fresh' && <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0 mt-1.5" />}
      </div>
      <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">
        Exp: {item.expiryDate || 'Unknown'}
      </div>
    </div>
  );
}

interface CategoryColumnProps {
  category: string;
  items: FoodItem[];
  onDropItem: (itemId: string, newCategory: string) => void;
}

function CategoryColumn({ category, items, onDropItem }: CategoryColumnProps) {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: 'FOOD_ITEM',
    drop: (item: { id: string }) => onDropItem(item.id, category),
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
    }),
  }));

  return (
    <div 
      ref={drop}
      className={`flex-1 min-w-[250px] bg-gray-50/50 dark:bg-gray-800/30 rounded-2xl p-4 flex flex-col border-2 ${isOver ? 'border-emerald-400 bg-emerald-50/30 dark:bg-emerald-900/10' : 'border-transparent'} transition-colors`}
    >
      <div className="flex items-center gap-2 mb-4 px-1">
        <span className="text-lg">{getCategoryIcon(category)}</span>
        <h3 className="font-bold text-gray-700 dark:text-gray-300 capitalize">{category}</h3>
        <span className="ml-auto bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs font-bold px-2 py-0.5 rounded-full">
          {items.length}
        </span>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {items.map(item => (
          <DraggableItem key={item.id} item={item} />
        ))}
        {items.length === 0 && !isOver && (
          <div className="h-24 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl flex items-center justify-center">
            <span className="text-xs text-gray-400 font-medium">Drop items here</span>
          </div>
        )}
      </div>
    </div>
  );
}

interface BoardViewProps {
  items: FoodItem[];
  onUpdateItemCategory: (id: string, newCategory: string) => void;
}

export function BoardView({ items, onUpdateItemCategory }: BoardViewProps) {
  const categories = ['dairy', 'meat', 'vegetables', 'pantry', 'canned'];

  return (
    <div className="w-full h-full flex overflow-x-auto pb-4 gap-4 hide-scrollbar">
      {categories.map(category => (
        <CategoryColumn 
          key={category} 
          category={category} 
          items={items.filter(i => i.category === category)} 
          onDropItem={onUpdateItemCategory} 
        />
      ))}
    </div>
  );
}
