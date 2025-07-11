import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { format } from 'date-fns';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Plus, ArrowLeft, Trash2 } from 'lucide-react';
import { toast } from 'react-toastify';

interface AssetBalance {
  _id?: string;
  amount: number;
  date: string;
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

const AssetHistory: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [asset, setAsset] = useState<Asset | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAddingBalance, setIsAddingBalance] = useState(false);
  const [newBalance, setNewBalance] = useState({
    amount: 0,
    date: format(new Date(), 'yyyy-MM-dd')
  });

  useEffect(() => {
    fetchAsset();
  }, [id]);

  const fetchAsset = async () => {
    try {
      const response = await axios.get(`/api/assets/${id}`);
      setAsset(response.data);
    } catch (error) {
      toast.error('Failed to fetch asset details');
    } finally {
      setLoading(false);
    }
  };

  const handleAddBalance = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post(`/api/assets/${id}/balances`, newBalance);
      setIsAddingBalance(false);
      setNewBalance({ amount: 0, date: format(new Date(), 'yyyy-MM-dd') });
      fetchAsset();
      toast.success('Balance updated successfully');
    } catch (error) {
      toast.error('Failed to update balance');
    }
  };

  const handleDeleteBalance = async (balanceId: string) => {
    if (!window.confirm('Are you sure you want to delete this balance record?')) return;

    try {
      await axios.delete(`/api/assets/${id}/balances/${balanceId}`);
      fetchAsset();
      toast.success('Balance record deleted successfully');
    } catch (error) {
      toast.error('Failed to delete balance record');
    }
  };

  if (loading || !asset) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const chartData = [...asset.balanceHistory]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map(balance => ({
      date: format(new Date(balance.date), 'MMM d, yyyy'),
      amount: balance.amount
    }));

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/assets')}
            className="p-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{asset.name}</h1>
            <p className="text-gray-600">
              {asset.institution && `${asset.institution} - `}
              Balance History
            </p>
          </div>
        </div>
        <button
          onClick={() => setIsAddingBalance(true)}
          className="btn btn-primary flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Update Balance</span>
        </button>
      </div>

      {/* Chart */}
      <div className="card p-4 h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip
              formatter={(value: number) => [`$${value.toLocaleString()}`, 'Balance']}
            />
            <Line
              type="monotone"
              dataKey="amount"
              stroke="#2563eb"
              strokeWidth={2}
              dot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Balance History Table */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Balance History</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Balance
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Change
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {[...asset.balanceHistory]
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .map((balance, index, array) => {
                  const change = index === array.length - 1
                    ? balance.amount
                    : balance.amount - array[index + 1].amount;
                  return (
                    <tr key={balance._id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {format(new Date(balance.date), 'MMM d, yyyy')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ${balance.amount.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={change >= 0 ? 'text-success-600' : 'text-danger-600'}>
                          {change >= 0 ? '+' : ''}{change.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                        <button
                          onClick={() => balance._id && handleDeleteBalance(balance._id)}
                          className="text-gray-400 hover:text-danger-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Balance Modal */}
      {isAddingBalance && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-semibold mb-4">Update Balance</h2>
            <form onSubmit={handleAddBalance}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Amount</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-gray-500">$</span>
                    <input
                      type="number"
                      step="0.01"
                      value={newBalance.amount}
                      onChange={e => setNewBalance({ ...newBalance, amount: parseFloat(e.target.value) })}
                      className="mt-1 block w-full rounded-md border-gray-300 pl-8 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Date</label>
                  <input
                    type="date"
                    value={newBalance.date}
                    onChange={e => setNewBalance({ ...newBalance, date: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                    required
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsAddingBalance(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssetHistory; 