import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import { Plus, Trash2, DollarSign } from 'lucide-react';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';

interface AssetBalance {
  amount: number;
  date: Date;
}

interface Asset {
  _id: string;
  name: string;
  type: 'savings' | 'investment' | 'property' | 'other';
  description?: string;
  institution?: string;
  accountNumber?: string;
  balanceHistory: AssetBalance[];
  currentBalance: number;
  lastUpdated: Date;
}

const Assets: React.FC = () => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [isAddingAsset, setIsAddingAsset] = useState(false);
  const [isAddingBalance, setIsAddingBalance] = useState(false);
  const [newAsset, setNewAsset] = useState({
    name: '',
    type: 'savings' as const,
    description: '',
    institution: '',
    accountNumber: '',
    amount: 0
  });
  const [newBalance, setNewBalance] = useState({
    amount: 0,
    date: format(new Date(), 'yyyy-MM-dd')
  });

  useEffect(() => {
    fetchAssets();
  }, []);

  const fetchAssets = async () => {
    try {
      const response = await axios.get('/api/assets');
      setAssets(response.data);
    } catch (error) {
      toast.error('Failed to fetch assets');
    }
  };

  const handleAddAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post('/api/assets', newAsset);
      setIsAddingAsset(false);
      setNewAsset({
        name: '',
        type: 'savings',
        description: '',
        institution: '',
        accountNumber: '',
        amount: 0
      });
      fetchAssets();
      toast.success('Asset added successfully');
    } catch (error) {
      toast.error('Failed to add asset');
    }
  };

  const handleAddBalance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAsset) return;

    try {
      await axios.post(`/api/assets/${selectedAsset._id}/balances`, {
        amount: Number(newBalance.amount),
        date: new Date(newBalance.date)
      });
      setIsAddingBalance(false);
      setNewBalance({ amount: 0, date: format(new Date(), 'yyyy-MM-dd') });
      fetchAssets();
      toast.success('Balance updated successfully');
    } catch (error) {
      toast.error('Failed to update balance');
    }
  };

  const handleDeleteAsset = async (assetId: string) => {
    if (!window.confirm('Are you sure you want to delete this asset?')) return;

    try {
      await axios.delete(`/api/assets/${assetId}`);
      fetchAssets();
      toast.success('Asset deleted successfully');
    } catch (error) {
      toast.error('Failed to delete asset');
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'savings': return 'bg-blue-100 text-blue-800';
      case 'investment': return 'bg-green-100 text-green-800';
      case 'property': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Assets</h1>
        <button
          onClick={() => setIsAddingAsset(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          <Plus size={16} /> Add Asset
        </button>
      </div>

      {/* Asset List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {assets.map(asset => (
          <div key={asset._id} className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold">{asset.name}</h3>
                <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium mt-1 ${getTypeColor(asset.type)}`}>
                  {asset.type.charAt(0).toUpperCase() + asset.type.slice(1)}
                </span>
              </div>
              <div className="flex gap-2">
                <Link
                  to={`/assets/${asset._id}/history`}
                  className="p-2 text-gray-600 hover:text-blue-600"
                  title="View History"
                >
                  History
                </Link>
                <button
                  onClick={() => {
                    setSelectedAsset(asset);
                    setIsAddingBalance(true);
                  }}
                  className="p-2 text-gray-600 hover:text-blue-600"
                  title="Update Balance"
                >
                  <DollarSign size={16} />
                </button>
                <button
                  onClick={() => handleDeleteAsset(asset._id)}
                  className="p-2 text-gray-600 hover:text-red-600"
                  title="Delete Asset"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            {asset.institution && (
              <p className="text-sm text-gray-600 mb-2">
                {asset.institution}
                {asset.accountNumber && ` - ${asset.accountNumber}`}
              </p>
            )}
            
            {asset.description && (
              <p className="text-sm text-gray-600 mb-4">{asset.description}</p>
            )}

            <div className="border-t pt-4">
              <div className="flex justify-between items-baseline">
                <span className="text-sm text-gray-600">Current Balance</span>
                <span className="text-xl font-semibold">
                  ${asset.currentBalance.toLocaleString()}
                </span>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Last updated: {format(new Date(asset.lastUpdated), 'MMM d, yyyy')}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Asset Modal */}
      {isAddingAsset && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-semibold mb-4">Add New Asset</h2>
            <form onSubmit={handleAddAsset}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Name</label>
                  <input
                    type="text"
                    value={newAsset.name}
                    onChange={e => setNewAsset({ ...newAsset, name: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Type</label>
                  <select
                    value={newAsset.type}
                    onChange={e => setNewAsset({ ...newAsset, type: e.target.value as any })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="savings">Savings</option>
                    <option value="investment">Investment</option>
                    <option value="property">Property</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Institution (Optional)</label>
                  <input
                    type="text"
                    value={newAsset.institution}
                    onChange={e => setNewAsset({ ...newAsset, institution: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Account Number (Optional)</label>
                  <input
                    type="text"
                    value={newAsset.accountNumber}
                    onChange={e => setNewAsset({ ...newAsset, accountNumber: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Description (Optional)</label>
                  <textarea
                    value={newAsset.description}
                    onChange={e => setNewAsset({ ...newAsset, description: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Initial Balance</label>
                  <input
                    type="number"
                    value={newAsset.amount}
                    onChange={e => setNewAsset({ ...newAsset, amount: Number(e.target.value) })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddingAsset(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                >
                  Add Asset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Balance Modal */}
      {isAddingBalance && selectedAsset && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-semibold mb-4">Update Balance for {selectedAsset.name}</h2>
            <form onSubmit={handleAddBalance}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Amount</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newBalance.amount}
                    onChange={e => setNewBalance({ ...newBalance, amount: parseFloat(e.target.value) })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Date</label>
                  <input
                    type="date"
                    value={newBalance.date}
                    onChange={e => setNewBalance({ ...newBalance, date: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingBalance(false);
                    setSelectedAsset(null);
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                >
                  Update Balance
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Assets; 