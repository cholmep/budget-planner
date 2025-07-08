import React from 'react';
import { Link } from 'react-router-dom';
import { Plus, Edit, Trash2, Calendar, DollarSign } from 'lucide-react';

const Budgets: React.FC = () => {
  // Mock data - in real app, this would come from API
  const budgets = [
    {
      id: 1,
      name: 'January 2024 Budget',
      month: 1,
      year: 2024,
      totalIncome: 5000,
      totalExpenses: 3750,
      netIncome: 1250,
      isActive: true
    },
    {
      id: 2,
      name: 'December 2023 Budget',
      month: 12,
      year: 2023,
      totalIncome: 4800,
      totalExpenses: 4200,
      netIncome: 600,
      isActive: true
    }
  ];

  const formatMonth = (month: number, year: number) => {
    const date = new Date(year, month - 1);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Budgets</h1>
          <p className="text-gray-600">Manage your monthly budgets and track spending</p>
        </div>
        <Link
          to="/budgets/new"
          className="btn btn-primary flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Create Budget</span>
        </Link>
      </div>

      {/* Budget Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {budgets.map((budget) => (
          <div key={budget.id} className="card hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">{budget.name}</h3>
              <div className="flex items-center space-x-2">
                <Link
                  to={`/budgets/${budget.id}/edit`}
                  className="p-1 text-gray-400 hover:text-gray-600"
                >
                  <Edit className="h-4 w-4" />
                </Link>
                <button className="p-1 text-gray-400 hover:text-red-600">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center text-sm text-gray-600">
                <Calendar className="h-4 w-4 mr-2" />
                {formatMonth(budget.month, budget.year)}
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Income</span>
                  <span className="font-medium text-success-600">
                    +${budget.totalIncome.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Expenses</span>
                  <span className="font-medium text-danger-600">
                    -${budget.totalExpenses.toLocaleString()}
                  </span>
                </div>
                <hr className="my-2" />
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-900">Net Income</span>
                  <span className={`font-bold ${
                    budget.netIncome >= 0 ? 'text-success-600' : 'text-danger-600'
                  }`}>
                    {budget.netIncome >= 0 ? '+' : ''}${budget.netIncome.toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="pt-3 border-t">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Status</span>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    budget.isActive
                      ? 'bg-success-100 text-success-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {budget.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Add New Budget Card */}
        <Link
          to="/budgets/new"
          className="card border-2 border-dashed border-gray-300 hover:border-primary-500 transition-colors flex items-center justify-center min-h-[300px]"
        >
          <div className="text-center">
            <Plus className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Create New Budget</h3>
            <p className="text-gray-600">Start planning your finances</p>
          </div>
        </Link>
      </div>
    </div>
  );
};

export default Budgets;