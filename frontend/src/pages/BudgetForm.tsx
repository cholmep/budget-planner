import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Plus, Trash2, Save } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  plannedAmount: number;
  type: 'income' | 'expense';
  description?: string;
}

const BudgetForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = Boolean(id);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear()
  });

  const [categories, setCategories] = useState<Category[]>([
    { id: '1', name: 'Salary', plannedAmount: 5000, type: 'income' },
    { id: '2', name: 'Groceries', plannedAmount: 500, type: 'expense' },
    { id: '3', name: 'Rent', plannedAmount: 1200, type: 'expense' }
  ]);

  const addCategory = (type: 'income' | 'expense') => {
    const newCategory: Category = {
      id: Date.now().toString(),
      name: '',
      plannedAmount: 0,
      type,
      description: ''
    };
    setCategories([...categories, newCategory]);
  };

  const updateCategory = (id: string, field: keyof Category, value: string | number) => {
    setCategories(categories.map(cat => 
      cat.id === id ? { ...cat, [field]: value } : cat
    ));
  };

  const removeCategory = (id: string) => {
    setCategories(categories.filter(cat => cat.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In real app, submit to API
    console.log('Saving budget:', { formData, categories });
    navigate('/budgets');
  };

  const incomeCategories = categories.filter(cat => cat.type === 'income');
  const expenseCategories = categories.filter(cat => cat.type === 'expense');
  const totalIncome = incomeCategories.reduce((sum, cat) => sum + cat.plannedAmount, 0);
  const totalExpenses = expenseCategories.reduce((sum, cat) => sum + cat.plannedAmount, 0);
  const netIncome = totalIncome - totalExpenses;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          {isEditing ? 'Edit Budget' : 'Create New Budget'}
        </h1>
        <p className="text-gray-600">
          {isEditing ? 'Update your budget details' : 'Set up your monthly budget with income and expense categories'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Info */}
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Budget Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Budget Name</label>
              <input
                type="text"
                className="input"
                placeholder="e.g., January 2024 Budget"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                required
              />
            </div>
            <div>
              <label className="label">Description (Optional)</label>
              <input
                type="text"
                className="input"
                placeholder="Brief description"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
              />
            </div>
            <div>
              <label className="label">Month</label>
              <select
                className="input"
                value={formData.month}
                onChange={(e) => setFormData({...formData, month: parseInt(e.target.value)})}
              >
                {Array.from({length: 12}, (_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {new Date(2024, i).toLocaleDateString('en-US', { month: 'long' })}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Year</label>
              <input
                type="number"
                className="input"
                min="2020"
                max="2030"
                value={formData.year}
                onChange={(e) => setFormData({...formData, year: parseInt(e.target.value)})}
                required
              />
            </div>
          </div>
        </div>

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
          <div className="space-y-3">
            {incomeCategories.map((category) => (
              <div key={category.id} className="space-y-3">
                <div className="flex items-center space-x-3">
                  <input
                    type="text"
                    className="input flex-1"
                    placeholder="Income source"
                    value={category.name}
                    onChange={(e) => updateCategory(category.id, 'name', e.target.value)}
                  />
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-gray-500">$</span>
                    <input
                      type="number"
                      className="input w-32 pl-8"
                      placeholder="0.00"
                      value={category.plannedAmount}
                      onChange={(e) => updateCategory(category.id, 'plannedAmount', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeCategory(category.id)}
                    className="p-2 text-gray-400 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <input
                  type="text"
                  className="input w-full text-sm"
                  placeholder="Description (e.g., Monthly salary from Company X)"
                  value={category.description || ''}
                  onChange={(e) => updateCategory(category.id, 'description', e.target.value)}
                />
              </div>
            ))}
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
          <div className="space-y-3">
            {expenseCategories.map((category) => (
              <div key={category.id} className="space-y-3">
                <div className="flex items-center space-x-3">
                  <input
                    type="text"
                    className="input flex-1"
                    placeholder="Expense category"
                    value={category.name}
                    onChange={(e) => updateCategory(category.id, 'name', e.target.value)}
                  />
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-gray-500">$</span>
                    <input
                      type="number"
                      className="input w-32 pl-8"
                      placeholder="0.00"
                      value={category.plannedAmount}
                      onChange={(e) => updateCategory(category.id, 'plannedAmount', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeCategory(category.id)}
                    className="p-2 text-gray-400 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <input
                  type="text"
                  className="input w-full text-sm"
                  placeholder="Description (e.g., Monthly train pass for commuting)"
                  value={category.description || ''}
                  onChange={(e) => updateCategory(category.id, 'description', e.target.value)}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Summary */}
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Budget Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-success-50 rounded-lg">
              <p className="text-sm text-success-600 font-medium">Total Income</p>
              <p className="text-2xl font-bold text-success-700">${totalIncome.toLocaleString()}</p>
            </div>
            <div className="text-center p-4 bg-danger-50 rounded-lg">
              <p className="text-sm text-danger-600 font-medium">Total Expenses</p>
              <p className="text-2xl font-bold text-danger-700">${totalExpenses.toLocaleString()}</p>
            </div>
            <div className="text-center p-4 bg-primary-50 rounded-lg">
              <p className="text-sm text-primary-600 font-medium">Net Income</p>
              <p className={`text-2xl font-bold ${netIncome >= 0 ? 'text-success-700' : 'text-danger-700'}`}>
                {netIncome >= 0 ? '+' : ''}${netIncome.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate('/budgets')}
            className="btn btn-secondary"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary flex items-center space-x-2"
          >
            <Save className="h-4 w-4" />
            <span>{isEditing ? 'Update Budget' : 'Create Budget'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default BudgetForm;