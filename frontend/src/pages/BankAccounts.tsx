import React from 'react';
import { Building2, Plus, Link as LinkIcon } from 'lucide-react';

const BankAccounts: React.FC = () => {
  const accounts = [
    { id: 1, name: 'Chase Checking', type: 'Checking', balance: 2500.50, connected: true },
    { id: 2, name: 'Wells Fargo Savings', type: 'Savings', balance: 10000.00, connected: true }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Bank Accounts</h1>
          <p className="text-gray-600">Connect and manage your bank accounts</p>
        </div>
        <button className="btn btn-primary flex items-center space-x-2">
          <Plus className="h-4 w-4" />
          <span>Connect Account</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {accounts.map((account) => (
          <div key={account.id} className="card">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <Building2 className="h-8 w-8 text-primary-600" />
                <div>
                  <h3 className="font-semibold text-gray-900">{account.name}</h3>
                  <p className="text-sm text-gray-600">{account.type}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <LinkIcon className="h-4 w-4 text-success-600" />
                <span className="text-sm text-success-600">Connected</span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-gray-900">${account.balance.toLocaleString()}</p>
              <p className="text-sm text-gray-600">Current Balance</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BankAccounts;