import React, { useState } from 'react';
import axios from 'axios';
import { Plus, Trash2, Save, RefreshCw, Edit2, X, ChevronDown, ChevronUp } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from 'react-query';

interface Category {
  _id: string;
  name: string;
  type: 'income' | 'expense';
  isDefault: boolean;
  sortOrder: number;
}

interface BudgetItem {
  _id?: string;
  categoryId: string;
  name: string;
  plannedAmount: number;
  type: 'income' | 'expense';
  frequency: 'monthly' | 'fortnightly' | 'weekly' | 'yearly' | 'once';
  description?: string;
  actualAmount: number; // Added actualAmount
}

interface FormData {
  categoryId: string;
  name: string;
  plannedAmount: string;
  type: 'income' | 'expense';
  frequency: 'monthly' | 'fortnightly' | 'weekly' | 'yearly' | 'once';
  description: string;
}

interface CategorySummary {
  name: string;
  monthlyAmount: number;
  annualAmount: number;
  items: BudgetItem[];
}

const calculateMonthlyAmount = (item: BudgetItem): number => {
  switch (item.frequency) {
    case 'monthly':
      return item.plannedAmount;
    case 'fortnightly':
      return (item.plannedAmount * 26) / 12;
    case 'weekly':
      return (item.plannedAmount * 52) / 12;
    case 'yearly':
      return item.plannedAmount / 12;
    case 'once':
      return item.plannedAmount / 12;
    default:
      return 0;
  }
};

const calculateAnnualAmount = (item: BudgetItem): number => {
  switch (item.frequency) {
    case 'monthly':
      return item.plannedAmount * 12;
    case 'fortnightly':
      return item.plannedAmount * 26;
    case 'weekly':
      return item.plannedAmount * 52;
    case 'yearly':
      return item.plannedAmount;
    case 'once':
      return item.plannedAmount;
    default:
      return 0;
  }
};

const BudgetSummary: React.FC<{ budgetItems: BudgetItem[], categories: Category[] | undefined }> = ({ budgetItems, categories }) => {
  const [showDetails, setShowDetails] = useState(false);

  // Group items by category and calculate totals
  const categorySummaries = categories?.reduce((acc: { [key: string]: CategorySummary }, category) => {
    const items = budgetItems.filter(item => item.categoryId === category._id);
    if (items.length === 0) return acc;

    const monthlyAmount = items.reduce((sum, item) => sum + calculateMonthlyAmount(item), 0);
    const annualAmount = items.reduce((sum, item) => sum + calculateAnnualAmount(item), 0);

    acc[category._id] = {
      name: category.name,
      monthlyAmount,
      annualAmount,
      items
    };
    return acc;
  }, {}) || {};

  const incomeSummaries = Object.values(categorySummaries).filter(
    summary => budgetItems.find(item => item.name === summary.name)?.type === 'income'
  );
  const expenseSummaries = Object.values(categorySummaries).filter(
    summary => budgetItems.find(item => item.name === summary.name)?.type === 'expense'
  );

  const totalMonthlyIncome = incomeSummaries.reduce((sum, cat) => sum + cat.monthlyAmount, 0);
  const totalMonthlyExpenses = expenseSummaries.reduce((sum, cat) => sum + cat.monthlyAmount, 0);
  const totalAnnualIncome = incomeSummaries.reduce((sum, cat) => sum + cat.annualAmount, 0);
  const totalAnnualExpenses = expenseSummaries.reduce((sum, cat) => sum + cat.annualAmount, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Budget Summary</h2>
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="flex items-center text-sm text-gray-600 hover:text-gray-900"
        >
          {showDetails ? (
            <>
              <ChevronUp className="h-4 w-4 mr-1" />
              Hide Details
            </>
          ) : (
            <>
              <ChevronDown className="h-4 w-4 mr-1" />
              Show Details
            </>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Monthly Summary */}
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Monthly Summary</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center text-success-600">
              <span>Total Income</span>
              <span className="font-bold">${totalMonthlyIncome.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center text-danger-600">
              <span>Total Expenses</span>
              <span className="font-bold">${totalMonthlyExpenses.toLocaleString()}</span>
            </div>
            <div className="border-t pt-2">
              <div className="flex justify-between items-center font-bold">
                <span>Net Monthly</span>
                <span className={totalMonthlyIncome - totalMonthlyExpenses >= 0 ? 'text-success-600' : 'text-danger-600'}>
                  ${(totalMonthlyIncome - totalMonthlyExpenses).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Annual Summary */}
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Annual Summary</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center text-success-600">
              <span>Total Income</span>
              <span className="font-bold">${totalAnnualIncome.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center text-danger-600">
              <span>Total Expenses</span>
              <span className="font-bold">${totalAnnualExpenses.toLocaleString()}</span>
            </div>
            <div className="border-t pt-2">
              <div className="flex justify-between items-center font-bold">
                <span>Net Annual</span>
                <span className={totalAnnualIncome - totalAnnualExpenses >= 0 ? 'text-success-600' : 'text-danger-600'}>
                  ${(totalAnnualIncome - totalAnnualExpenses).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Category Breakdown */}
      {showDetails && (
        <div className="space-y-6 mt-6">
          {/* Income Categories */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Income by Category</h3>
            <div className="space-y-3">
              {incomeSummaries.map(summary => (
                <div key={summary.name} className="card">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{summary.name}</span>
                    <div className="text-right">
                      <div className="text-success-600">
                        Monthly: ${summary.monthlyAmount.toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-500">
                        Annual: ${summary.annualAmount.toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Expense Categories */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Expenses by Category</h3>
            <div className="space-y-3">
              {expenseSummaries.map(summary => (
                <div key={summary.name} className="card">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{summary.name}</span>
                    <div className="text-right">
                      <div className="text-danger-600">
                        Monthly: ${summary.monthlyAmount.toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-500">
                        Annual: ${summary.annualAmount.toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const BudgetPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [editingItem, setEditingItem] = useState<BudgetItem | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState<FormData>({
    categoryId: '',
    name: '',
    plannedAmount: '',
    type: 'expense',
    frequency: 'monthly',
    description: ''
  });

  // Clear error when form state changes
  React.useEffect(() => {
    setError(null);
  }, [formData]);

  // Fetch categories
  const { data: categories } = useQuery<Category[]>(
    'categories',
    async () => {
      const { data } = await axios.get('/api/categories');
      return data;
    }
  );

  // Fetch budget
  const { data: budget, isLoading } = useQuery(
    'budget',
    async () => {
      const { data } = await axios.get('/api/budget');
      return data;
    }
  );

  // Mutations for budget items
  const updateBudget = useMutation(
    async (updatedBudget: any) => {
      // Ensure all required fields are present and properly formatted
      const payload = {
        name: budget?.name || 'My Budget',
        description: budget?.description || '',
        categories: updatedBudget.categories.map((cat: BudgetItem) => {
          console.log('Processing category for update:', {
            name: cat.name,
            categoryId: cat.categoryId,
            _id: cat._id
          });

          if (!cat.categoryId) {
            // Try to find the matching category
            const matchingCategory = categories?.find(c => c.name === cat.name && c.type === cat.type);
            if (!matchingCategory) {
              console.error('Cannot find matching category for:', cat.name);
              throw new Error(`Cannot find matching category for "${cat.name}"`);
            }
            cat.categoryId = matchingCategory._id;
          }

          const formattedCategory: BudgetItem = {
            categoryId: cat.categoryId,
            name: cat.name,
            plannedAmount: Number(cat.plannedAmount),
            actualAmount: Number(cat.actualAmount || 0),
            type: cat.type,
            frequency: cat.frequency,
            description: cat.description || ''
          };

          if (cat._id) {
            formattedCategory._id = cat._id;
          }

          return formattedCategory;
        })
      };

      console.log('Final payload:', JSON.stringify(payload, null, 2));

      const { data } = await axios.put('/api/budget', payload);
      return data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('budget');
        setIsAddingItem(false);
        setEditingItem(null);
        setFormData({
          categoryId: '',
          name: '',
          plannedAmount: '',
          type: 'expense',
          frequency: 'monthly',
          description: ''
        });
        setError(null);
      },
      onError: (error: any) => {
        console.error('Update error details:', {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status,
          requestPayload: error.config?.data ? JSON.parse(error.config.data) : undefined
        });
        if (error.response?.data?.details) {
          console.error('Validation details:', error.response.data.details);
        }
        setError(error.response?.data?.message || error.message || 'Failed to update budget');
      }
    }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate amount is a number
    const plannedAmount = parseFloat(formData.plannedAmount);
    if (isNaN(plannedAmount)) {
      setError('Please enter a valid amount');
      return;
    }

    // Validate category is selected
    if (!formData.categoryId) {
      setError('Please select a category');
      return;
    }

    // Find the selected category
    const selectedCategory = categories?.find(cat => cat._id === formData.categoryId);
    if (!selectedCategory) {
      setError('Invalid category selected');
      return;
    }

    console.log('Selected category:', {
      _id: selectedCategory._id,
      name: selectedCategory.name,
      type: selectedCategory.type
    });

    // Prepare item data
    const itemData: BudgetItem = {
      categoryId: selectedCategory._id, // Use the category's _id as categoryId
      name: selectedCategory.name,
      plannedAmount,
      type: selectedCategory.type,
      frequency: formData.frequency,
      description: formData.description.trim(),
      actualAmount: 0
    };

    if (editingItem?._id) {
      itemData._id = editingItem._id;
    }

    console.log('New/Updated item data:', itemData);

    // Get existing categories and ensure they have all required fields
    const existingCategories = (budget?.categories || []).map((cat: BudgetItem) => {
      // Find the corresponding category for this budget item
      const category = categories?.find(c => c.name === cat.name && c.type === cat.type);
      
      console.log('Mapping existing category:', {
        name: cat.name,
        type: cat.type,
        foundCategory: category ? { id: category._id, name: category.name } : 'not found'
      });

      // Ensure we preserve the existing categoryId or set it from the category if missing
      const mappedCategory: BudgetItem = {
        categoryId: cat.categoryId || (category ? category._id : ''), // Use existing or find matching category
        name: cat.name,
        plannedAmount: Number(cat.plannedAmount),
        actualAmount: Number(cat.actualAmount || 0),
        type: cat.type,
        frequency: cat.frequency,
        description: cat.description || ''
      };

      if (cat._id) {
        mappedCategory._id = cat._id;
      }

      console.log('Mapped category:', mappedCategory);
      return mappedCategory;
    });

    // Update the budget with the new/updated item
    const updatedCategories = editingItem
      ? existingCategories.map((cat: BudgetItem) => 
          cat._id === editingItem._id ? itemData : cat
        )
      : [...existingCategories, itemData];

    console.log('All categories after update:', updatedCategories.map((cat: BudgetItem) => ({
      name: cat.name,
      categoryId: cat.categoryId,
      _id: cat._id
    })));

    updateBudget.mutate({
      categories: updatedCategories
    });
  };

  const handleEdit = (item: BudgetItem) => {
    setEditingItem(item);
    setFormData({
      categoryId: item.categoryId,
      name: item.name,
      plannedAmount: item.plannedAmount.toString(),
      type: item.type,
      frequency: item.frequency,
      description: item.description || ''
    });
    setIsAddingItem(true);
  };

  const handleDelete = (itemToDelete: BudgetItem) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;

    const updatedCategories = budget.categories.filter(
      (item: BudgetItem) => item._id !== itemToDelete._id
    );

    updateBudget.mutate({
      ...budget,
      categories: updatedCategories
    });
  };

  const handleCancel = () => {
    setIsAddingItem(false);
    setEditingItem(null);
    setFormData({
      categoryId: '',
      name: '',
      plannedAmount: '',
      type: 'expense',
      frequency: 'monthly',
      description: ''
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const budgetItems = budget?.categories || [];
  const incomeItems = budgetItems.filter((item: BudgetItem) => item.type === 'income');
  const expenseItems = budgetItems.filter((item: BudgetItem) => item.type === 'expense');
  const totalIncome = incomeItems.reduce((sum: number, item: BudgetItem) => sum + item.plannedAmount, 0);
  const totalExpenses = expenseItems.reduce((sum: number, item: BudgetItem) => sum + item.plannedAmount, 0);
  const netIncome = totalIncome - totalExpenses;

  // Filter categories based on selected type
  const availableCategories = categories?.filter(cat => cat.type === formData.type) || [];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Budget</h1>
        {!isAddingItem && (
          <button
            onClick={() => setIsAddingItem(true)}
            className="btn btn-primary flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Add Item</span>
          </button>
        )}
      </div>

      {error && (
        <div className="bg-danger-50 border border-danger-200 text-danger-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Add/Edit Form */}
      {isAddingItem && (
        <form onSubmit={handleSubmit} className="card space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold text-gray-900">
              {editingItem ? 'Edit Budget Item' : 'Add Budget Item'}
            </h2>
            <button
              type="button"
              onClick={handleCancel}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Type</label>
              <select
                className="input w-full"
                value={formData.type}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  type: e.target.value as 'income' | 'expense',
                  categoryId: '' // Reset category when type changes
                }))}
              >
                <option value="income">Income</option>
                <option value="expense">Expense</option>
              </select>
            </div>

            <div>
              <label className="label">Category</label>
              <select
                className="input w-full"
                value={formData.categoryId}
                onChange={(e) => setFormData(prev => ({ ...prev, categoryId: e.target.value }))}
                required
              >
                <option value="">Select a category</option>
                {availableCategories.map(category => (
                  <option key={category._id} value={category._id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Frequency</label>
              <select
                className="input w-full"
                value={formData.frequency}
                onChange={(e) => setFormData(prev => ({ ...prev, frequency: e.target.value as any }))}
              >
                <option value="monthly">Monthly</option>
                <option value="fortnightly">Fortnightly</option>
                <option value="weekly">Weekly</option>
                <option value="yearly">Yearly</option>
                <option value="once">One-time</option>
              </select>
            </div>

            <div>
              <label className="label">Amount</label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-gray-500">$</span>
                <input
                  type="number"
                  className="input w-full pl-8"
                  placeholder="0.00"
                  value={formData.plannedAmount}
                  onChange={(e) => setFormData(prev => ({ ...prev, plannedAmount: e.target.value }))}
                  required
                  step="0.01"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="label">Description (Optional)</label>
            <input
              type="text"
              className="input w-full"
              placeholder="Add any notes or details"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            />
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={handleCancel}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
            >
              {editingItem ? 'Update' : 'Add'} {formData.type === 'income' ? 'Income' : 'Expense'}
            </button>
          </div>
        </form>
      )}

      {/* New Budget Summary Component */}
      <BudgetSummary budgetItems={budgetItems} categories={categories} />

      {/* Budget Items List */}
      <div className="space-y-6">
        {/* Income Items */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Income</h2>
          <div className="space-y-3">
            {incomeItems.map((item: BudgetItem) => (
              <div
                key={item._id}
                className="flex items-center justify-between p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
              >
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <span className="font-medium text-gray-900">{item.name}</span>
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-success-100 text-success-800">
                      {item.frequency}
                    </span>
                  </div>
                  {item.description && (
                    <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                  )}
                </div>
                <div className="flex items-center space-x-4">
                  <span className="font-bold text-success-600">
                    +${item.plannedAmount.toLocaleString()}
                  </span>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleEdit(item)}
                      className="p-1 text-gray-400 hover:text-primary-600"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(item)}
                      className="p-1 text-gray-400 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Expense Items */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Expenses</h2>
          <div className="space-y-3">
            {expenseItems.map((item: BudgetItem) => (
              <div
                key={item._id}
                className="flex items-center justify-between p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
              >
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <span className="font-medium text-gray-900">{item.name}</span>
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-danger-100 text-danger-800">
                      {item.frequency}
                    </span>
                  </div>
                  {item.description && (
                    <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                  )}
                </div>
                <div className="flex items-center space-x-4">
                  <span className="font-bold text-danger-600">
                    -${item.plannedAmount.toLocaleString()}
                  </span>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleEdit(item)}
                      className="p-1 text-gray-400 hover:text-primary-600"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(item)}
                      className="p-1 text-gray-400 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BudgetPage;