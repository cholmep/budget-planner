import React from 'react';
import { Link } from 'react-router-dom';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Target,
  Plus,
  ArrowRight
} from 'lucide-react';

const Dashboard: React.FC = () => {
  // Mock data - in real app, this would come from API
  const stats = {
    totalIncome: 5000,
    totalExpenses: 3750,
    netIncome: 1250,
    budgetCount: 3,
    scenarioCount: 2
  };

  const recentTransactions = [
    { id: 1, description: 'Salary Deposit', amount: 2500, type: 'income', date: '2024-01-15' },
    { id: 2, description: 'Grocery Shopping', amount: -150, type: 'expense', date: '2024-01-14' },
    { id: 3, description: 'Gas Station', amount: -60, type: 'expense', date: '2024-01-13' },
    { id: 4, description: 'Freelance Work', amount: 800, type: 'income', date: '2024-01-12' },
  ];

  const budgets = [
    { id: 1, name: 'Monthly Budget', month: 'January', year: 2024, netIncome: 1250 },
    { id: 2, name: 'Holiday Budget', month: 'December', year: 2023, netIncome: 800 },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Welcome back! Here's your financial overview.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-success-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-success-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Income</p>
              <p className="text-2xl font-semibold text-gray-900">
                ${stats.totalIncome.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-danger-100 rounded-lg">
              <TrendingDown className="h-6 w-6 text-danger-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Expenses</p>
              <p className="text-2xl font-semibold text-gray-900">
                ${stats.totalExpenses.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-primary-100 rounded-lg">
              <DollarSign className="h-6 w-6 text-primary-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Net Income</p>
              <p className="text-2xl font-semibold text-gray-900">
                ${stats.netIncome.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-warning-100 rounded-lg">
              <Target className="h-6 w-6 text-warning-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Budgets</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.budgetCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            to="/budget"
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Plus className="h-8 w-8 text-primary-600 mr-3" />
            <div>
              <h3 className="font-medium text-gray-900">Create Budget</h3>
              <p className="text-sm text-gray-600">Set up a new monthly budget</p>
            </div>
          </Link>

          <Link
            to="/scenarios/new"
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Target className="h-8 w-8 text-success-600 mr-3" />
            <div>
              <h3 className="font-medium text-gray-900">Model Scenario</h3>
              <p className="text-sm text-gray-600">Create future projections</p>
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

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Transactions */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Recent Transactions</h2>
            <Link
              to="/transactions"
              className="text-primary-600 hover:text-primary-700 flex items-center text-sm"
            >
              View all
              <ArrowRight className="h-4 w-4 ml-1" />
            </Link>
          </div>
          <div className="space-y-3">
            {recentTransactions.map((transaction) => (
              <div key={transaction.id} className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">{transaction.description}</p>
                  <p className="text-sm text-gray-600">{transaction.date}</p>
                </div>
                <p className={`font-semibold ${
                  transaction.amount > 0 ? 'text-success-600' : 'text-danger-600'
                }`}>
                  {transaction.amount > 0 ? '+' : ''}${Math.abs(transaction.amount)}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Active Budgets */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Active Budgets</h2>
            <Link
              to="/budget"
              className="text-primary-600 hover:text-primary-700 flex items-center text-sm"
            >
              View all
              <ArrowRight className="h-4 w-4 ml-1" />
            </Link>
          </div>
          <div className="space-y-3">
            {budgets.map((budget) => (
              <div key={budget.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900">{budget.name}</h3>
                    <p className="text-sm text-gray-600">{budget.month} {budget.year}</p>
                  </div>
                  <p className="text-lg font-semibold text-success-600">
                    +${budget.netIncome}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;