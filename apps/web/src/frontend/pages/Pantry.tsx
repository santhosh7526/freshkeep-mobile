import { useState, useEffect } from 'react';
import { Package, Search, Plus, Filter, Trash2, Edit2, AlertTriangle, ArrowUpRight, ArrowDownRight, Clock, Box, LayoutGrid, List } from 'lucide-react';
import { Link } from 'react-router-dom';
import { FoodItem } from '../../backend/models/types';
import { getDaysLeft, getCategoryIcon } from '../../backend/logic/helpers';
import { usePantry } from '@freshkeep/shared';
import { BoardView } from '../components/BoardView';

export default function Pantry() {
  const { items, removeItem, updateItem } = usePantry();
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'table' | 'board'>('table');

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to remove this item?')) {
      removeItem(id);
    }
  };

  const getStatus = (expiryDate: string) => {
    const days = getDaysLeft(expiryDate);
    if (days < 0) return 'expired';
    if (days <= 7) return 'expiring-soon';
    return 'fresh';
  };

  const getStatusBadge = (status: string, days: number) => {
    if (status === 'expired') {
      return <span className="px-2.5 py-1 text-[10px] font-bold bg-red-100 text-red-700 rounded-full">Expired</span>;
    }
    if (status === 'expiring-soon') {
      return <span className="px-2.5 py-1 text-[10px] font-bold bg-amber-100 text-amber-700 rounded-full">{days} days left</span>;
    }
    return <span className="px-2.5 py-1 text-[10px] font-bold bg-emerald-100 text-emerald-700 rounded-full">Fresh</span>;
  };

  const filteredItems = items.filter(item => {
    const matchesSearch = (item.name || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
    const matchesStatus = statusFilter === 'all' || getStatus(item.expiryDate || '') === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  return (
    <div className="w-full h-full bg-white dark:bg-gray-900 md:bg-gray-50 md:dark:bg-gray-900 flex justify-center pb-24 md:pb-8">
      <div className="max-w-[1400px] w-full mx-auto p-4 md:p-8 flex flex-col h-full">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">My Pantry</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mt-1">
              Track your food inventory and freshness.
            </p>
          </div>
          <Link to="/" className="px-5 py-2.5 bg-[#86A789] hover:bg-[#729275] text-white rounded-xl font-bold text-sm shadow-sm transition-all flex items-center justify-center gap-2">
            <Plus className="w-4 h-4" />
            Add Item
          </Link>
        </div>

        {/* Filters and Search */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col lg:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl pl-11 pr-4 py-2.5 text-sm font-semibold text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#86A789]"
            />
          </div>
          <div className="flex gap-4">
            <div className="hidden lg:flex bg-gray-100 dark:bg-gray-900 p-1 rounded-xl">
              <button 
                onClick={() => setViewMode('table')}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-2 text-sm font-bold transition-colors ${viewMode === 'table' ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}
              >
                <List className="w-4 h-4" /> Table
              </button>
              <button 
                onClick={() => setViewMode('board')}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-2 text-sm font-bold transition-colors ${viewMode === 'board' ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}
              >
                <LayoutGrid className="w-4 h-4" /> Board
              </button>
            </div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#86A789]"
            >
              <option value="all">All Categories</option>
              <option value="dairy">Dairy</option>
              <option value="meat">Meat</option>
              <option value="vegetables">Vegetables</option>
              <option value="pantry">Pantry</option>
              <option value="canned">Canned</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-[#86A789]"
            >
              <option value="all">All Statuses</option>
              <option value="fresh">Fresh</option>
              <option value="expiring-soon">Expiring Soon</option>
              <option value="expired">Expired</option>
            </select>
          </div>
        </div>

        {/* Desktop Views */}
        <div className="hidden lg:flex flex-col flex-1 min-h-0">
          {viewMode === 'board' ? (
            <div className="flex-1 overflow-hidden">
              <BoardView 
                items={filteredItems} 
                onUpdateItemCategory={(id, category) => {
                  updateItem(id, { category: category as any });
                }} 
              />
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden flex-1">
              {filteredItems.length === 0 ? (
            <div className="py-20 flex flex-col items-center justify-center text-center">
              <Box className="w-12 h-12 text-gray-300 mb-4" />
              <h3 className="text-lg font-bold text-gray-900">No items found</h3>
              <p className="text-sm text-gray-500 mt-1 max-w-[300px]">
                {items.length === 0 ? "Your pantry is empty. Scan a product to get started!" : "No items match your current filters."}
              </p>
            </div>
          ) : (
              <div className="overflow-x-auto h-full">
                <table className="w-full text-left border-collapse min-w-[900px]">
                  <thead className="sticky top-0 bg-gray-50/90 dark:bg-gray-800/90 backdrop-blur-sm z-10">
                    <tr className="border-b border-gray-100 dark:border-gray-700">
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Product</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Category</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Mfg Date</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Expiry Date</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Batch</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {filteredItems.map(item => {
                    const days = item.expiryDate ? getDaysLeft(item.expiryDate) : null;
                    const status = getStatus(item.expiryDate || '');
                    return (
                      <tr key={item.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/50 transition-colors group">
                          <td className="px-6 py-4">
                            <span className="text-sm font-bold text-gray-900 dark:text-white block">{item.name}</span>
                            <span className="text-[10px] font-semibold text-gray-400">Added {item.addedDate}</span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <span className="text-gray-400">{getCategoryIcon(item.category)}</span>
                              <span className="text-sm font-semibold text-gray-600 dark:text-gray-300 capitalize">{item.category}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-sm font-semibold text-gray-700 dark:text-gray-400">{item.manufacturingDate || '-'}</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-sm font-bold text-gray-900 dark:text-white">{item.expiryDate || 'Unknown'}</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-sm font-mono text-gray-500">{item.batchNumber || '-'}</span>
                          </td>
                        <td className="px-6 py-4">
                          {getStatusBadge(status, days || 0)}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg transition-colors">
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleDelete(item.id)} className="p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              </div>
            )}
            </div>
          )}
        </div>

        {/* Mobile/Tablet Card View */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:hidden mt-4">
          {filteredItems.map(item => {
            const days = getDaysLeft(item.expiryDate || '');
            const status = getStatus(item.expiryDate || '');
            return (
              <div key={item.id} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-5 relative overflow-hidden flex flex-col">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-gray-700 flex items-center justify-center text-gray-500">
                      {getCategoryIcon(item.category)}
                    </div>
                    <div>
                      <h3 className="text-sm font-extrabold text-gray-900 dark:text-white line-clamp-1">{item.name}</h3>
                      <p className="text-xs font-semibold text-gray-400 capitalize">{item.category}</p>
                    </div>
                  </div>
                  {getStatusBadge(status, days || 0)}
                </div>

                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3 mb-4 space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-gray-500 dark:text-gray-400">Expiry Date</span>
                    <span className="font-bold text-gray-900 dark:text-white">{item.expiryDate}</span>
                  </div>
                  {item.manufacturingDate && (
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-gray-500">Mfg Date</span>
                      <span className="font-bold text-gray-700">{item.manufacturingDate}</span>
                    </div>
                  )}
                  {item.batchNumber && (
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-gray-500">Batch</span>
                      <span className="font-mono font-bold text-gray-700">{item.batchNumber}</span>
                    </div>
                  )}
                </div>

                <div className="mt-auto flex gap-2">
                  <button className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-2">
                    <Edit2 className="w-3.5 h-3.5" /> Edit
                  </button>
                  <button onClick={() => handleDelete(item.id)} className="flex-1 py-2 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-2">
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                </div>
              </div>
            );
          })}

          {filteredItems.length === 0 && (
            <div className="col-span-full py-12 flex flex-col items-center justify-center text-center bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
              <Box className="w-10 h-10 text-gray-300 dark:text-gray-600 mb-3" />
              <p className="text-sm font-bold text-gray-700 dark:text-gray-300">No items found</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
