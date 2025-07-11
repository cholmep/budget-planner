import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Plus, Trash2, Save, RefreshCw } from 'lucide-react';

interface Category {
  _id?: string;
  name: string;
  plannedAmount: number;
  type: 'income' | 'expense';
  frequency: 'monthly' | 'fortnightly' | 'weekly' | 'yearly' | 'once';
  description?: string;
}

interface Budget {
  _id?: string;
  name: string;
  description?: string;
  categories: Category[];
}

interface CategoryOption {
  _id: string;
  name: string;
  type: 'income' | 'expense';
  isDefault: boolean;
}

const BudgetPage: React.FC = () => {
  const [budget, setBudget] = useState<Budget | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [initializingCategories, setInitializingCategories] = useState(false);

  // Initialize categories if they don't exist
  const initializeCategories = async () => {
    try {
      setInitializingCategories(true);
      const { data } = await axios.post('/api/categories/initialize');
      setCategories(data);
    } catch (err: any) {
      if (err.response?.status === 400) {
        // Categories already exist, just fetch them
        await fetchCategories();
      } else {
        setError(err.response?.data?.message || 'Failed to initialize categories');
      }
    } finally {
      setInitializingCategories(false);
    }
  };

  // Fetch categories
  const fetchCategories = async () => {
    try {
      const { data } = await axios.get('/api/categories');
      if (data.length === 0) {
        // If no categories exist, initialize them
        await initializeCategories();
      } else {
        setCategories(data);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load categories');
    }
  };

  // Fetch on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        await Promise.all([
          fetchCategories(),
          axios.get('/api/budget').then(({ data }) => setBudget(data))
        ]);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load budget');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
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

  const incomeCategories = categories.filter(cat => cat.type === 'income');
  const expenseCategories = categories.filter(cat => cat.type === 'expense');

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">My Budget</h1>
        {categories.length === 0 && (
          <button
            onClick={initializeCategories}
            disabled={initializingCategories}
            className="btn btn-primary flex items-center space-x-2"
          >
            <RefreshCw className="h-4 w-4" />
            <span>{initializingCategories ? 'Initializing...' : 'Initialize Categories'}</span>
          </button>
        )}
      </div>

      {error && (
        <div className="bg-danger-50 border border-danger-200 text-danger-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="space-y-6">
        {/* Income Categories */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Income Categories</h2>
            <button
              type="button"
              onClick={() => addCategory('income')}
              className="btn btn-success flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>Add Income</span>
            </button>
          </div>
          <div className="space-y-4">
            {budget.categories
              .filter(cat => cat.type === 'income')
              .map((cat, idx) => {
                const categoryIndex = budget.categories.indexOf(cat);
                return (
                  <div key={idx} className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <select
                        className="input w-48"
                        value={cat.name}
                        onChange={(e) => updateCategory(categoryIndex, 'name', e.target.value)}
                      >
                        <option value="">Select Category</option>
                        {categories
                          .filter(c => c.type === 'income')
                          .map(c => (
                            <option key={c._id} value={c.name}>{c.name}</option>
                          ))
                        }
                      </select>
                      <select
                        className="input w-36"
                        value={cat.frequency}
                        onChange={(e) => updateCategory(categoryIndex, 'frequency', e.target.value)}
                      >
                        <option value="monthly">Monthly</option>
                        <option value="fortnightly">Fortnightly</option>
                        <option value="weekly">Weekly</option>
                        <option value="yearly">Yearly</option>
                        <option value="once">Once</option>
                      </select>
                      <div className="relative">
                        <span className="absolute left-3 top-2.5 text-gray-500">$</span>
                        <input
                          type="number"
                          className="input w-32 pl-8"
                          placeholder="0.00"
                          value={cat.plannedAmount}
                          onChange={(e) => updateCategory(categoryIndex, 'plannedAmount', parseFloat(e.target.value) || 0)}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeCategory(categoryIndex)}
                        className="p-2 text-gray-400 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <input
                      type="text"
                      className="input w-full text-sm"
                      placeholder="Description (e.g., Monthly salary from Company X)"
                      value={cat.description || ''}
                      onChange={(e) => updateCategory(categoryIndex, 'description', e.target.value)}
                    />
                  </div>
                );
              })}
          </div>
        </div>

        {/* Expense Categories */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Expense Categories</h2>
            <button
              type="button"
              onClick={() => addCategory('expense')}
              className="btn btn-danger flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>Add Expense</span>
            </button>
          </div>
          <div className="space-y-4">
            {budget.categories
              .filter(cat => cat.type === 'expense')
              .map((cat, idx) => {
                const categoryIndex = budget.categories.indexOf(cat);
                return (
                  <div key={idx} className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <select
                        className="input w-48"
                        value={cat.name}
                        onChange={(e) => updateCategory(categoryIndex, 'name', e.target.value)}
                      >
                        <option value="">Select Category</option>
                        {categories
                          .filter(c => c.type === 'expense')
                          .map(c => (
                            <option key={c._id} value={c.name}>{c.name}</option>
                          ))
                        }
                      </select>
                      <select
                        className="input w-36"
                        value={cat.frequency}
                        onChange={(e) => updateCategory(categoryIndex, 'frequency', e.target.value)}
                      >
                        <option value="monthly">Monthly</option>
                        <option value="fortnightly">Fortnightly</option>
                        <option value="weekly">Weekly</option>
                        <option value="yearly">Yearly</option>
                        <option value="once">Once</option>
                      </select>
                      <div className="relative">
                        <span className="absolute left-3 top-2.5 text-gray-500">$</span>
                        <input
                          type="number"
                          className="input w-32 pl-8"
                          placeholder="0.00"
                          value={cat.plannedAmount}
                          onChange={(e) => updateCategory(categoryIndex, 'plannedAmount', parseFloat(e.target.value) || 0)}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeCategory(categoryIndex)}
                        className="p-2 text-gray-400 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <input
                      type="text"
                      className="input w-full text-sm"
                      placeholder="Description (e.g., Monthly train pass for commuting)"
                      value={cat.description || ''}
                      onChange={(e) => updateCategory(categoryIndex, 'description', e.target.value)}
                    />
                  </div>
                );
              })}
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn btn-primary flex items-center space-x-2"
          >
            <Save className="h-4 w-4" />
            <span>{saving ? 'Saving...' : 'Save Budget'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default BudgetPage;