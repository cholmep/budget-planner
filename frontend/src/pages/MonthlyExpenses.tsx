import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { format, parseISO, addMonths, subMonths } from 'date-fns';
import { PlusCircle, Edit2, Trash2, RefreshCw, ChevronLeft, ChevronRight, X, TrendingUp, TrendingDown } from 'lucide-react';
import axios from 'axios';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  Cell, ReferenceLine
} from 'recharts';

// Add axios interceptor for auth token
const token = localStorage.getItem('token');
if (token) {
  axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
}

interface Category {
  _id: string;
  name: string;
  type: 'income' | 'expense';
  sortOrder: number;
}

interface Transaction {
  _id: string;
  amount: number;
  description: string;
  category: string;
  type: 'income' | 'expense';
  date: string;
  recurring: boolean;
  frequency?: 'weekly' | 'monthly' | 'yearly';
}

interface FormData {
  amount: string;
  description: string;
  category: string;
  type: 'income' | 'expense';
  date: string;
  recurring: boolean;
  frequency: 'weekly' | 'monthly' | 'yearly';
}

interface CategorySummaryBase {
  name: string;
  total: number;
  count: number;
  budgeted: number;
  variance: number;
}

interface CategorySummaryResponse {
  _id: {
    category: string;
    type: string;
  };
  total: number;
  count: number;
}

interface MonthlyData {
  transactions: Transaction[];
  summary: CategorySummaryResponse[];
  recurringTransactions: Transaction[];
  period: {
    month: number;
    year: number;
  };
}

interface BudgetCategory {
  name: string;
  plannedAmount: number;
  actualAmount: number;
  type: 'income' | 'expense';
  frequency: 'monthly' | 'fortnightly' | 'weekly' | 'yearly' | 'once';
}

interface Budget {
  categories: BudgetCategory[];
  totalIncome: number;
  totalExpenses: number;
  netIncome: number;
}

const MonthlyExpenses: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [isAddingTransaction, setIsAddingTransaction] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    showManual: true,
    showBank: true
  });

  // Form state with proper typing
  const [formData, setFormData] = useState<FormData>({
    amount: '',
    description: '',
    category: '',
    type: 'expense',
    date: format(new Date(), 'yyyy-MM-dd'),
    recurring: false,
    frequency: 'monthly'
  });

  // Clear error when form state changes
  React.useEffect(() => {
    setApiError(null);
  }, [formData]);

  // Fetch monthly data
  const { data: monthlyData, isLoading, error } = useQuery<MonthlyData>(
    ['monthlyTransactions', selectedMonth],
    async () => {
      const month = selectedMonth.getMonth() + 1;
      const year = selectedMonth.getFullYear();
      
      console.log('Fetching monthly data for:', { month, year });

      try {
        // Fetch both bank aggregates and manual transactions
        const [bankData, manualData] = await Promise.all([
          axios.get('/api/bank/monthly-aggregates'),
          axios.get(`/api/transactions/monthly?month=${month}&year=${year}`)
        ]);

        console.log('Received manual transactions:', manualData.data);

        // Find the bank data for the selected month
        const monthBankData = bankData.data.find((m: any) => m.month === month && m.year === year) || {
          income: 0,
          expenses: 0,
          savings: 0,
          balance: 0
        };

        // Combine bank and manual transaction summaries
        const summary = [
          {
            _id: { category: 'Total Income', type: 'income' },
            total: monthBankData.income + manualData.data.transactions
              .filter((t: Transaction) => t.type === 'income')
              .reduce((sum: number, t: Transaction) => sum + t.amount, 0),
            count: manualData.data.transactions.filter((t: Transaction) => t.type === 'income').length + 1
          },
          {
            _id: { category: 'Total Expenses', type: 'expense' },
            total: monthBankData.expenses + manualData.data.transactions
              .filter((t: Transaction) => t.type === 'expense')
              .reduce((sum: number, t: Transaction) => sum + t.amount, 0),
            count: manualData.data.transactions.filter((t: Transaction) => t.type === 'expense').length + 1
          }
        ];

        return {
          transactions: manualData.data.transactions || [],
          summary,
          recurringTransactions: [],
          period: { month, year }
        };
      } catch (error) {
        console.error('Error fetching monthly data:', error);
        throw error;
      }
    }
  );

  // Fetch bank transactions
  const { data: bankTransactionsData } = useQuery(
    ['bankTransactions', selectedMonth],
    async () => {
      const { data } = await axios.get('/api/bank/transactions');
      return data;
    },
    {
      enabled: !!monthlyData
    }
  );

  // Fetch categories
  const { data: categories } = useQuery<Category[]>(
    'categories',
    async () => {
      const { data } = await axios.get('/api/categories');
      return data;
    },
    {
      onError: () => {
        // If categories don't exist, initialize them
        axios.post('/api/categories/initialize').then(() => {
          queryClient.invalidateQueries('categories');
        });
      }
    }
  );

  // Fetch budget data
  const { data: budgetData } = useQuery<Budget>('budget', async () => {
    const { data } = await axios.get<Budget>('/api/budget');
    return data;
  });

  // Mutations for manual transactions
  const createTransaction = useMutation(
    async (transaction: Omit<Transaction, '_id'>) => {
      const { data } = await axios.post('/api/transactions', transaction);
      return data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['monthlyTransactions']);
        setIsAddingTransaction(false);
        setFormData({
          amount: '',
          description: '',
          category: '',
          type: 'expense',
          date: format(new Date(), 'yyyy-MM-dd'),
          recurring: false,
          frequency: 'monthly'
        });
        setApiError(null);
      },
      onError: (error: any) => {
        setApiError(error.response?.data?.message || 'Failed to create transaction');
      }
    }
  );

  // Update the updateTransaction mutation
  const updateTransaction = useMutation(
    async (transaction: Transaction) => {
      console.log('Updating transaction:', transaction);
      const payload = {
        amount: Number(transaction.amount),
        description: transaction.description.trim(),
        category: transaction.category,
        type: transaction.type,
        date: transaction.date,
        recurring: transaction.recurring || false,
        ...(transaction.recurring ? { frequency: transaction.frequency } : {})
      };
      console.log('Update payload:', payload);
      const { data } = await axios.put(`/api/transactions/${transaction._id}`, payload);
      return data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['monthlyTransactions']);
        setEditingTransaction(null);
        setFormData({
          amount: '',
          description: '',
          category: '',
          type: 'expense',
          date: format(new Date(), 'yyyy-MM-dd'),
          recurring: false,
          frequency: 'monthly'
        });
        setApiError(null);
      },
      onError: (error: any) => {
        console.error('Update error:', error.response?.data || error);
        setApiError(error.response?.data?.message || error.message || 'Failed to update transaction');
      }
    }
  );

  const deleteTransaction = useMutation(
    async (id: string) => {
      await axios.delete(`/api/transactions/${id}`);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['monthlyTransactions']);
      }
    }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate amount is a number
    const amount = parseFloat(formData.amount);
    if (isNaN(amount)) {
      setApiError('Please enter a valid amount');
      return;
    }

    // Prepare transaction data
    const transactionData = {
      amount,
      description: formData.description.trim(),
      category: formData.category,
      type: formData.type,
      date: formData.date,
      recurring: formData.recurring,
      ...(formData.recurring ? { frequency: formData.frequency } : {})
    };

    if (editingTransaction) {
      updateTransaction.mutate({
        ...editingTransaction,
        ...transactionData
      });
    } else {
      createTransaction.mutate(transactionData as Omit<Transaction, '_id'>);
    }
  };

  const handleEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setFormData({
      amount: transaction.amount.toString(),
      description: transaction.description,
      category: transaction.category,
      type: transaction.type,
      date: format(parseISO(transaction.date), 'yyyy-MM-dd'),
      recurring: transaction.recurring || false,
      frequency: transaction.frequency || 'monthly'
    });
    setIsAddingTransaction(true);
  };

  // Calculate monthly amount based on frequency
  const calculateMonthlyAmount = (amount: number, frequency: string): number => {
    switch (frequency) {
      case 'weekly':
        return amount * 52 / 12;
      case 'fortnightly':
        return amount * 26 / 12;
      case 'yearly':
        return amount / 12;
      case 'once':
        return amount / 12;
      default:
        return amount;
    }
  };

  // Group transactions by category
  const getCategorySummaries = (transactions: Transaction[], type: 'income' | 'expense'): CategorySummaryBase[] => {
    const summaryMap = new Map<string, CategorySummaryBase>();
    
    // Initialize with budget categories
    budgetData?.categories
      .filter(cat => cat.type === type)
      .forEach(cat => {
        summaryMap.set(cat.name, {
          name: cat.name,
          total: 0,
          count: 0,
          budgeted: calculateMonthlyAmount(cat.plannedAmount, cat.frequency),
          variance: 0
        });
      });

    // Add transaction totals
    transactions
      .filter(t => t.type === type)
      .forEach(t => {
        const existing = summaryMap.get(t.category) || {
          name: t.category,
          total: 0,
          count: 0,
          budgeted: 0,
          variance: 0
        };
        
        existing.total += t.amount;
        existing.count += 1;
        existing.variance = existing.total - existing.budgeted;
        
        summaryMap.set(t.category, existing);
      });

    return Array.from(summaryMap.values())
      .sort((a, b) => b.total - a.total);
  };

  if (isLoading) return <div className="p-4">Loading...</div>;
  if (error) return <div className="p-4 text-red-500">Error loading transactions</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Monthly Expenses</h1>
        <button
          onClick={() => setIsAddingTransaction(true)}
          className="bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <PlusCircle size={20} />
          Add Manual Transaction
        </button>
      </div>

      {/* Error Display */}
      {apiError && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {apiError}
        </div>
      )}

      {/* Filters */}
      <div className="mb-6 flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="showManual"
            checked={filters.showManual}
            onChange={(e) => setFilters(prev => ({ ...prev, showManual: e.target.checked }))}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="showManual" className="text-sm text-gray-700">Show Manual Transactions</label>
        </div>
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="showBank"
            checked={filters.showBank}
            onChange={(e) => setFilters(prev => ({ ...prev, showBank: e.target.checked }))}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="showBank" className="text-sm text-gray-700">Show Bank Transactions</label>
        </div>
      </div>

      {/* Month Selection */}
      <div className="mb-8 flex items-center justify-center space-x-4">
        <button
          onClick={() => setSelectedMonth(prevMonth => subMonths(prevMonth, 1))}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          aria-label="Previous month"
        >
          <ChevronLeft className="h-5 w-5 text-gray-600" />
        </button>
        
        <div className="flex items-center bg-white px-4 py-2 rounded-lg shadow">
          <input
            type="month"
            value={format(selectedMonth, 'yyyy-MM')}
            onChange={(e) => setSelectedMonth(new Date(e.target.value))}
            className="border-none focus:ring-0 text-center font-medium text-gray-700"
          />
        </div>

        <button
          onClick={() => setSelectedMonth(prevMonth => addMonths(prevMonth, 1))}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          aria-label="Next month"
        >
          <ChevronRight className="h-5 w-5 text-gray-600" />
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {monthlyData?.summary.map((item) => (
          <div
            key={`${item._id.category}-${item._id.type}`}
            className={`p-4 rounded-lg ${
              item._id.type === 'income' ? 'bg-green-50' : 'bg-red-50'
            }`}
          >
            <h3 className="text-sm font-medium">{item._id.category}</h3>
            <p className={`text-2xl font-bold ${
              item._id.type === 'income' ? 'text-green-600' : 'text-red-600'
            }`}>
              ${item.total.toFixed(2)}
            </p>
            <p className="text-sm text-gray-500">{item.count} transactions</p>
          </div>
        ))}
      </div>

      {/* Category Summaries */}
      <div className="space-y-6 mb-8">
        {/* Income Categories */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-900">Income by Category</h3>
          <div className="space-y-4">
            {/* Chart */}
            {monthlyData && (
              <div className="h-64 mb-6">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={getCategorySummaries(monthlyData.transactions, 'income')}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 12 }}
                      interval={0}
                      angle={-45}
                      textAnchor="end"
                    />
                    <YAxis
                      tickFormatter={(value) => `$${value.toLocaleString()}`}
                    />
                    <Tooltip
                      formatter={(value: number) => `$${value.toLocaleString()}`}
                      labelStyle={{ color: '#111827' }}
                      contentStyle={{ backgroundColor: 'white', border: '1px solid #E5E7EB' }}
                    />
                    <Legend />
                    <Bar dataKey="total" name="Actual" fill="#4ade80">
                      {getCategorySummaries(monthlyData.transactions, 'income').map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.total >= entry.budgeted ? '#4ade80' : '#f87171'}
                        />
                      ))}
                    </Bar>
                    <Bar dataKey="budgeted" name="Budgeted" fill="#94a3b8" />
                    <ReferenceLine y={0} stroke="#cbd5e1" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
            {/* List View */}
            <div className="mt-6">
              <div className="grid grid-cols-4 gap-4 mb-2 text-sm font-medium text-gray-500">
                <div>Category</div>
                <div className="text-right">Target</div>
                <div className="text-right">Actual</div>
                <div className="text-right">Difference</div>
              </div>
              <div className="space-y-2">
                {monthlyData && getCategorySummaries(monthlyData.transactions, 'income').map(category => (
                  <div key={category.name} className="grid grid-cols-4 gap-4 py-2 border-t border-gray-100">
                    <div>
                      <div className="font-medium text-gray-700">{category.name}</div>
                      <div className="text-xs text-gray-500">{category.count} transactions</div>
                    </div>
                    <div className="text-right font-medium text-gray-600">
                      ${category.budgeted.toLocaleString()}
                    </div>
                    <div className="text-right font-medium text-success-600">
                      ${category.total.toLocaleString()}
                    </div>
                    <div className="text-right">
                      <div className={`font-medium ${category.variance >= 0 ? 'text-success-600' : 'text-danger-600'}`}>
                        <span className="inline-flex items-center">
                          {category.variance >= 0 ? (
                            <TrendingUp className="h-4 w-4 mr-1" />
                          ) : (
                            <TrendingDown className="h-4 w-4 mr-1" />
                          )}
                          ${Math.abs(category.variance).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Expense Categories */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-900">Expenses by Category</h3>
          <div className="space-y-4">
            {/* Chart */}
            {monthlyData && (
              <div className="h-96 mb-12">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={getCategorySummaries(monthlyData.transactions, 'expense')}
                    margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="name" 
                      tick={{ fontSize: 12 }} 
                      interval={0} 
                      angle={-45} 
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis
                      tickFormatter={(value) => `$${value.toLocaleString()}`}
                    />
                    <Tooltip
                      formatter={(value: number) => `$${value.toLocaleString()}`}
                      labelStyle={{ color: '#111827' }}
                      contentStyle={{ backgroundColor: 'white', border: '1px solid #E5E7EB' }}
                    />
                    <Legend verticalAlign="top" height={36} />
                    <Bar dataKey="total" name="Actual" fill="#f87171">
                      {getCategorySummaries(monthlyData.transactions, 'expense').map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.total <= entry.budgeted ? '#4ade80' : '#f87171'}
                        />
                      ))}
                    </Bar>
                    <Bar dataKey="budgeted" name="Budgeted" fill="#94a3b8" />
                    <ReferenceLine y={0} stroke="#cbd5e1" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
            {/* List View */}
            <div className="mt-6">
              <div className="grid grid-cols-4 gap-4 mb-2 text-sm font-medium text-gray-500">
                <div>Category</div>
                <div className="text-right">Target</div>
                <div className="text-right">Actual</div>
                <div className="text-right">Difference</div>
              </div>
              <div className="space-y-2">
                {monthlyData && getCategorySummaries(monthlyData.transactions, 'expense').map(category => (
                  <div key={category.name} className="grid grid-cols-4 gap-4 py-2 border-t border-gray-100">
                    <div>
                      <div className="font-medium text-gray-700">{category.name}</div>
                      <div className="text-xs text-gray-500">{category.count} transactions</div>
                    </div>
                    <div className="text-right font-medium text-gray-600">
                      ${category.budgeted.toLocaleString()}
                    </div>
                    <div className="text-right font-medium text-danger-600">
                      ${category.total.toLocaleString()}
                    </div>
                    <div className="text-right">
                      <div className={`font-medium ${category.variance <= 0 ? 'text-success-600' : 'text-danger-600'}`}>
                        <span className="inline-flex items-center">
                          {category.variance <= 0 ? (
                            <TrendingDown className="h-4 w-4 mr-1" />
                          ) : (
                            <TrendingUp className="h-4 w-4 mr-1" />
                          )}
                          ${Math.abs(category.variance).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Transaction Form */}
      {(isAddingTransaction || editingTransaction) && (
        <form onSubmit={handleSubmit} className="mb-8 bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              {editingTransaction ? 'Edit Transaction' : 'Add New Transaction'}
            </h2>
            <button
              type="button"
              onClick={() => {
                setIsAddingTransaction(false);
                setEditingTransaction(null);
                setFormData({
                  amount: '',
                  description: '',
                  category: '',
                  type: 'expense',
                  date: format(new Date(), 'yyyy-MM-dd'),
                  recurring: false,
                  frequency: 'monthly'
                });
              }}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Amount</label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">$</span>
                </div>
                <input
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="mt-1 block w-full pl-7 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Type</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as 'income' | 'expense', category: '' })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="expense">Expense</option>
                <option value="income">Income</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              >
                <option value="">Select a category</option>
                {categories
                  ?.filter(cat => cat.type === formData.type)
                  .sort((a, b) => a.sortOrder - b.sortOrder)
                  .map(category => (
                    <option key={category._id} value={category.name}>
                      {category.name}
                    </option>
                  ))
                }
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Date</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="recurring"
                  checked={formData.recurring}
                  onChange={(e) => setFormData({ ...formData, recurring: e.target.checked })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="recurring" className="ml-2 block text-sm text-gray-900">
                  Recurring
                </label>
              </div>

              {formData.recurring && (
                <div className="flex-1">
                  <select
                    value={formData.frequency}
                    onChange={(e) => setFormData({ ...formData, frequency: e.target.value as any })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={() => {
                setIsAddingTransaction(false);
                setEditingTransaction(null);
                setFormData({
                  amount: '',
                  description: '',
                  category: '',
                  type: 'expense',
                  date: format(new Date(), 'yyyy-MM-dd'),
                  recurring: false,
                  frequency: 'monthly'
                });
              }}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`px-4 py-2 rounded-md text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                editingTransaction 
                  ? 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500'
                  : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
              }`}
            >
              {editingTransaction ? 'Save Changes' : 'Add Transaction'}
            </button>
          </div>
        </form>
      )}

      {/* Transactions List */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">All Transactions</h2>
        <div className="space-y-4">
          {/* Manual Transactions */}
          {filters.showManual && monthlyData?.transactions.map((transaction) => (
            <div
              key={transaction._id}
              className="bg-white p-4 rounded-lg shadow flex items-center justify-between border-l-4 border-yellow-400"
            >
              <div>
                <p className="font-medium">{transaction.description}</p>
                <p className="text-sm text-gray-500">{format(parseISO(transaction.date), 'MMM d, yyyy')}</p>
                <p className="text-xs text-gray-400">{transaction.category} (Manual Entry)</p>
              </div>
              <div className="flex items-center space-x-4">
                <p className={`font-semibold ${
                  transaction.type === 'expense' ? 'text-red-600' : 'text-green-600'
                }`}>
                  ${transaction.amount.toFixed(2)}
                </p>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEdit(transaction)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm('Are you sure you want to delete this transaction?')) {
                        deleteTransaction.mutate(transaction._id);
                      }
                    }}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {/* Bank Transactions */}
          {filters.showBank && bankTransactionsData?.map((transaction: any) => (
            <div
              key={transaction.transaction_id}
              className="bg-white p-4 rounded-lg shadow flex items-center justify-between border-l-4 border-blue-400"
            >
              <div>
                <p className="font-medium">{transaction.merchant_name}</p>
                <p className="text-sm text-gray-500">{format(new Date(transaction.date), 'MMM d, yyyy')}</p>
                <p className="text-xs text-gray-400">{transaction.category.join(' > ')} (Bank Import)</p>
              </div>
              <div className="flex items-center space-x-4">
                <p className={`font-semibold ${
                  transaction.amount < 0 ? 'text-red-600' : 'text-green-600'
                }`}>
                  ${Math.abs(transaction.amount).toFixed(2)}
                </p>
              </div>
            </div>
          ))}

          {!monthlyData?.transactions.length && !bankTransactionsData?.length && (
            <p className="text-center text-gray-500">No transactions found</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default MonthlyExpenses; 