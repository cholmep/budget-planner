import React from 'react';
import { Plus, Filter, Download } from 'lucide-react';

const Transactions: React.FC = () => {
  const transactions = [
    { id: 1, date: '2024-01-15', description: 'Salary Deposit', category: 'Salary', amount: 2500, type: 'income' },
    { id: 2, date: '2024-01-14', description: 'Grocery Shopping', category: 'Groceries', amount: -150, type: 'expense' },
    { id: 3, date: '2024-01-13', description: 'Gas Station', category: 'Transportation', amount: -60, type: 'expense' },
    { id: 4, date: '2024-01-12', description: 'Freelance Work', category: 'Freelance', amount: 800, type: 'income' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Transactions</h1>
          <p className="text-gray-600">Track and manage your financial transactions</p>
        </div>
        <div className="flex items-center space-x-3">
          <button className="btn btn-secondary flex items-center space-x-2">
            <Filter className="h-4 w-4" />
            <span>Filter</span>
          </button>
          <button className="btn btn-secondary flex items-center space-x-2">
            <Download className="h-4 w-4" />
            <span>Export</span>
          </button>
          <button className="btn btn-primary flex items-center space-x-2">
            <Plus className="h-4 w-4" />
            <span>Add Transaction</span>
          </button>
        </div>
      </div>

      <div className="card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-900">Date</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Description</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Category</th>
                <th className="text-right py-3 px-4 font-medium text-gray-900">Amount</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((transaction) => (
                <tr key={transaction.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 text-sm text-gray-600">{transaction.date}</td>
                  <td className="py-3 px-4 text-sm font-medium text-gray-900">{transaction.description}</td>
                  <td className="py-3 px-4 text-sm text-gray-600">{transaction.category}</td>
                  <td className={`py-3 px-4 text-sm font-semibold text-right ${
                    transaction.amount > 0 ? 'text-success-600' : 'text-danger-600'
                  }`}>
                    {transaction.amount > 0 ? '+' : ''}${Math.abs(transaction.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Transactions;