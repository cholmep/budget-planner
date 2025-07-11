import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { format, parseISO } from 'date-fns';
import { PlusCircle, Edit2, Trash2, RefreshCw } from 'lucide-react';
import axios from 'axios';

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

interface CategorySummary {
  _id: {
    category: string;
    type: string;
  };
  total: number;
  count: number;
}

interface MonthlyData {
  transactions: Transaction[];
  summary: CategorySummary[];
  recurringTransactions: Transaction[];
  period: {
    month: number;
    year: number;
  };
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
      
      // Fetch both bank aggregates and manual transactions
      const [bankData, manualData] = await Promise.all([
        axios.get('/api/bank/monthly-aggregates'),
        axios.get(`/api/transactions/monthly?month=${month}&year=${year}`).catch(() => ({ data: { transactions: [] } }))
      ]);

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

  const updateTransaction = useMutation(
    async (transaction: Transaction) => {
      const { data } = await axios.put(`/api/transactions/${transaction._id}`, transaction);
      return data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['monthlyTransactions']);
        setEditingTransaction(null);
        setApiError(null);
      },
      onError: (error: any) => {
        setApiError(error.response?.data?.message || 'Failed to update transaction');
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
      alert('Please enter a valid amount');
      return;
    }

    // Prepare transaction data
    const transactionData = {
      amount,
      description: formData.description.trim(),
      category: formData.category.trim(),
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
      recurring: transaction.recurring,
      frequency: transaction.frequency || 'monthly'
    });
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
      <div className="mb-8">
        <input
          type="month"
          value={format(selectedMonth, 'yyyy-MM')}
          onChange={(e) => setSelectedMonth(new Date(e.target.value))}
          className="border rounded-lg px-4 py-2"
        />
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

      {/* Transaction Form */}
      {(isAddingTransaction || editingTransaction) && (
        <form onSubmit={handleSubmit} className="mb-8 bg-white p-6 rounded-lg shadow">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Amount</label>
              <input
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
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
            <div className="flex items-center mt-6">
              <button
                type="submit"
                className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
              >
                {editingTransaction ? 'Update' : 'Add'} Transaction
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsAddingTransaction(false);
                  setEditingTransaction(null);
                }}
                className="ml-4 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
            </div>
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