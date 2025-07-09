import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Plus, Trash2, Save } from 'lucide-react';

interface Category {
  _id?: string;
  name: string;
  plannedAmount: number;
  type: 'income' | 'expense';
  frequency: 'monthly' | 'fortnightly' | 'weekly' | 'yearly' | 'once';
}

interface Budget {
  _id?: string;
  name: string;
  description?: string;
  categories: Category[];
}

const BudgetPage: React.FC = () => {
  const [budget, setBudget] = useState<Budget | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Fetch on mount
  useEffect(() => {
    const fetchBudget = async () => {
      try {
        setLoading(true);
        const { data } = await axios.get('/api/budget');
        setBudget(data);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load budget');
      } finally {
        setLoading(false);
      }
    };
    fetchBudget();
  }, []);

  const addCategory = (type: 'income' | 'expense') => {
    if (!budget) return;
    const newCategory: Category = {
      _id: undefined,
      name: '',
      plannedAmount: 0,
      type,
      frequency: 'monthly'
    };
    setBudget({ ...budget, categories: [...budget.categories, newCategory] });
  };

  const updateCategory = (index: number, field: keyof Category, value: any) => {
    if (!budget) return;
    const updated = [...budget.categories];
    (updated[index] as any)[field] = value;
    setBudget({ ...budget, categories: updated });
  };

  const removeCategory = (index: number) => {
    if (!budget) return;
    const updated = budget.categories.filter((_, i) => i !== index);
    setBudget({ ...budget, categories: updated });
  };

  const handleSave = async () => {
    if (!budget) return;
    setSaving(true);
    setError('');
    try {
      const { data } = await axios.put('/api/budget', budget);
      setBudget(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save budget');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !budget) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900">My Budget</h1>

      {error && (
        <div className="bg-danger-50 border border-danger-200 text-danger-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Categories</h2>
        <div className="space-y-4">
          {budget.categories.map((cat, idx) => (
            <div key={idx} className="flex items-center space-x-3">
              <select
                className="input w-32"
                value={cat.type}
                onChange={(e) => updateCategory(idx, 'type', e.target.value as any)}
              >
                <option value="income">Income</option>
                <option value="expense">Expense</option>
              </select>
              <select
                className="input w-32"
                value={cat.frequency}
                onChange={(e) => updateCategory(idx, 'frequency', e.target.value as any)}
              >
                <option value="monthly">Monthly</option>
                <option value="weekly">Weekly</option>
                <option value="yearly">Yearly</option>
                <option value="once">Once</option>
                <option value="fortnightly">Fortnightly</option>
              </select>
              <input
                type="text"
                className="input flex-1"
                placeholder="Name"
                value={cat.name}
                onChange={(e) => updateCategory(idx, 'name', e.target.value)}
              />
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-gray-500">$</span>
                <input
                  type="number"
                  className="input w-36 pl-8"
                  value={cat.plannedAmount}
                  onChange={(e) => updateCategory(idx, 'plannedAmount', parseFloat(e.target.value) || 0)}
                />
              </div>
              <button
                type="button"
                className="p-2 text-gray-400 hover:text-red-600"
                onClick={() => removeCategory(idx)}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
        <div className="flex items-center space-x-4 mt-6">
          <button
            className="btn btn-success flex items-center space-x-2"
            onClick={() => addCategory('income')}
          >
            <Plus className="h-4 w-4" /> <span>Add Income</span>
          </button>
          <button
            className="btn btn-danger flex items-center space-x-2"
            onClick={() => addCategory('expense')}
          >
            <Plus className="h-4 w-4" /> <span>Add Expense</span>
          </button>
        </div>
      </div>

      <button
        className="btn btn-primary flex items-center space-x-2"
        onClick={handleSave}
        disabled={saving}
      >
        <Save className="h-4 w-4" />
        <span>{saving ? 'Saving…' : 'Save Budget'}</span>
      </button>
    </div>
  );
};

export default BudgetPage;