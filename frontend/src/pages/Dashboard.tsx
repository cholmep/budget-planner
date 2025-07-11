import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from 'react-query';
import axios from 'axios';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Target,
  Plus,
  ArrowRight
} from 'lucide-react';

interface Transaction {
  _id: string;
  description: string;
  amount: number;
  category: string;
  type: 'income' | 'expense';
  date: string;
}

const Dashboard: React.FC = () => {
  // Mock data - in real app, this would come from API
  const stats = {
    totalIncome: 5000,
    totalExpenses: 3750,
    netIncome: 1250,
    budgetCount: 3,
    scenarioCount: 2
  };

  const budgets = [
    { id: 1, name: 'Monthly Budget', month: 'January', year: 2024, netIncome: 1250 },
    { id: 2, name: 'Holiday Budget', month: 'December', year: 2023, netIncome: 800 },
  ];

  // Fetch current month's transactions
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1; // JavaScript months are 0-based
  const currentYear = currentDate.getFullYear();

  const { data: monthlyData, isLoading: isLoadingTransactions } = useQuery(
    ['monthlyTransactions', currentMonth, currentYear],
    async () => {
      const { data } = await axios.get(`/api/transactions/monthly?month=${currentMonth}&year=${currentYear}`);
      return data;
    }
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Track your financial health and progress</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="h-12 w-12 bg-success-100 rounded-full flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-success-600" />
            </div>
          </div>
          <h3 className="text-sm font-medium text-gray-600">Total Income</h3>
          <p className="text-2xl font-bold text-gray-900">${stats.totalIncome}</p>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="h-12 w-12 bg-danger-100 rounded-full flex items-center justify-center">
              <TrendingDown className="h-6 w-6 text-danger-600" />
            </div>
          </div>
          <h3 className="text-sm font-medium text-gray-600">Total Expenses</h3>
          <p className="text-2xl font-bold text-gray-900">${stats.totalExpenses}</p>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="h-12 w-12 bg-primary-100 rounded-full flex items-center justify-center">
              <DollarSign className="h-6 w-6 text-primary-600" />
            </div>
          </div>
          <h3 className="text-sm font-medium text-gray-600">Net Income</h3>
          <p className="text-2xl font-bold text-gray-900">${stats.netIncome}</p>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="h-12 w-12 bg-warning-100 rounded-full flex items-center justify-center">
              <Target className="h-6 w-6 text-warning-600" />
            </div>
          </div>
          <h3 className="text-sm font-medium text-gray-600">Active Scenarios</h3>
          <p className="text-2xl font-bold text-gray-900">{stats.scenarioCount}</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Link
            to="/budget/new"
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Plus className="h-8 w-8 text-primary-600 mr-3" />
            <div>
              <h3 className="font-medium text-gray-900">New Budget</h3>
              <p className="text-sm text-gray-600">Create a new budget plan</p>
            </div>
          </Link>

          <Link
            to="/scenarios/new"
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Target className="h-8 w-8 text-success-600 mr-3" />
            <div>
              <h3 className="font-medium text-gray-900">New Scenario</h3>
              <p className="text-sm text-gray-600">Model future scenarios</p>
            </div>
          </Link>

          <Link
            to="/bank-accounts"
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <DollarSign className="h-8 w-8 text-warning-600 mr-3" />
            <div>
              <h3 className="font-medium text-gray-900">Connect Bank</h3>
              <p className="text-sm text-gray-600">Link your bank accounts</p>
            </div>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Current Month Transactions */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Current Month</h2>
            <Link
              to="/monthly-expenses"
              className="text-primary-600 hover:text-primary-700 flex items-center text-sm"
            >
              View all
              <ArrowRight className="h-4 w-4 ml-1" />
            </Link>
          </div>
          <div className="space-y-3">
            {isLoadingTransactions ? (
              <div className="flex justify-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              </div>
            ) : monthlyData?.transactions?.length > 0 ? (
              monthlyData.transactions.slice(0, 5).map((transaction: Transaction) => (
                <div key={transaction._id} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{transaction.description}</p>
                    <p className="text-sm text-gray-600">{transaction.category}</p>
                  </div>
                  <p className={`font-semibold ${
                    transaction.type === 'income' ? 'text-success-600' : 'text-danger-600'
                  }`}>
                    {transaction.type === 'income' ? '+' : '-'}${Math.abs(transaction.amount)}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">No transactions this month</p>
            )}
          </div>
        </div>

        {/* Active Budgets */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Active Budgets</h2>
            <Link
              to="/budgets"
              className="text-primary-600 hover:text-primary-700 flex items-center text-sm"
            >
              View all
              <ArrowRight className="h-4 w-4 ml-1" />
            </Link>
          </div>
          <div className="space-y-3">
            {budgets.map((budget) => (
              <div key={budget.id} className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">{budget.name}</p>
                  <p className="text-sm text-gray-600">{budget.month} {budget.year}</p>
                </div>
                <p className="font-semibold text-success-600">
                  ${budget.netIncome}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;