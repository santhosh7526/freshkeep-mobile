import { useState, useEffect, useMemo } from 'react';
import { Trash2, AlertCircle, DollarSign, TrendingUp, Calendar, Trash } from 'lucide-react';
import { usePantry } from '@freshkeep/shared';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';
import { WasteLogEntry } from '../../backend/models/types';
import { getCategoryIcon } from '../../backend/logic/helpers';

export default function WasteLog() {
  const { wasteLog } = usePantry();
  const [wasteItems, setWasteItems] = useState<WasteLogEntry[]>([]);
  const [totalValue, setTotalValue] = useState(0);
  const [mostWasted, setMostWasted] = useState<string>('None');

  useEffect(() => {
    // Sort descending by date
    const sorted = [...wasteLog].sort((a, b) => new Date(b.wastedDate).getTime() - new Date(a.wastedDate).getTime());
    setWasteItems(sorted);
    
    const total = sorted.reduce((acc, curr) => acc + curr.estimatedValue, 0);
    setTotalValue(total);

    const categories: Record<string, number> = {};
    sorted.forEach(item => {
      categories[item.category] = (categories[item.category] || 0) + 1;
    });

    let maxCat = 'None';
    let maxVal = 0;
    for (const [cat, val] of Object.entries(categories)) {
      if (val > maxVal) {
        maxCat = cat;
        maxVal = val;
      }
    }
    setMostWasted(maxCat);
  }, [wasteLog]);

  const CATEGORY_COLORS: Record<string, string> = {
    dairy: '#3b82f6',
    meat: '#ef4444',
    vegetables: '#22c55e',
    pantry: '#eab308',
    canned: '#8b5cf6',
  };

  const chartData = useMemo(() => {
    const categories: Record<string, number> = {};
    wasteItems.forEach(item => {
      categories[item.category] = (categories[item.category] || 0) + item.estimatedValue;
    });
    return Object.entries(categories).map(([name, value]) => ({
      name,
      value,
    })).sort((a, b) => b.value - a.value);
  }, [wasteItems]);

  return (
    <div className="w-full h-full bg-white dark:bg-gray-900 md:bg-gray-50 md:dark:bg-gray-900 flex justify-center pb-24 md:pb-8">
      <div className="max-w-[1400px] w-full mx-auto p-4 md:p-8">
        
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 bg-rose-100 rounded-2xl flex items-center justify-center text-rose-600">
            <Trash2 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">Waste Log</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mt-1">
              Track and reduce your food waste impact.
            </p>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Items Wasted</p>
              <p className="text-2xl font-black text-gray-900 dark:text-white">{wasteItems.length}</p>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Value Lost</p>
              <p className="text-2xl font-black text-rose-600">₹{totalValue}</p>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Most Wasted</p>
              <p className="text-2xl font-black text-gray-900 dark:text-white capitalize">{mostWasted}</p>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        {chartData.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-6 mb-8">
            <h2 className="text-lg font-extrabold text-gray-900 dark:text-white mb-6">Value Lost by Category</h2>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#9ca3af', fontSize: 12, fontWeight: 600 }}
                    style={{ textTransform: 'capitalize' }}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#9ca3af', fontSize: 12, fontWeight: 600 }}
                    tickFormatter={(val) => `₹${val}`}
                  />
                  <Tooltip
                    cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    formatter={(value: any) => [`₹${value}`, 'Value Lost']}
                  />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[entry.name] || '#94a3b8'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Table/List Section */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-50 dark:border-gray-700/50 flex items-center justify-between">
            <h2 className="text-lg font-extrabold text-gray-900 dark:text-white">Waste History</h2>
          </div>

          {wasteItems.length === 0 ? (
            <div className="py-16 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                <Trash className="w-8 h-8 text-gray-300" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Great job!</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-[250px]">You haven't logged any wasted food yet. Keep up the good work!</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="bg-gray-50/50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-700">
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Product</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Category</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Reason</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Value</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Date Logged</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {wasteItems.map(item => (
                    <tr key={item.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/50 transition-colors">
                      <td className="px-6 py-4">
                        <span className="text-sm font-bold text-gray-900 dark:text-white">{item.itemName}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-400">{getCategoryIcon(item.category as any)}</span>
                          <span className="text-xs font-semibold text-gray-600 capitalize">{item.category}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 text-[10px] font-bold rounded-full uppercase ${
                          item.reason === 'expired' ? 'bg-red-100 text-red-700' : 
                          item.reason === 'spoiled' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-700'
                        }`}>
                          {item.reason}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-bold text-rose-600">₹{item.estimatedValue}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1 text-sm font-semibold text-gray-500">
                          <Calendar className="w-4 h-4" />
                          {item.wastedDate}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
