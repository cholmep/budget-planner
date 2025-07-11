import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  BarChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

type Granularity = 'week' | 'month' | 'year';

interface TimelineData {
  period: string;
  income: number;
  expenses: number;
  balance: number | null;
}

interface TimelineResponse {
  granularity: Granularity;
  data: TimelineData[];
}

const Timeline: React.FC = () => {
  const [data, setData] = useState<TimelineData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [granularity, setGranularity] = useState<Granularity>('month');
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0], // Start of current year
    endDate: new Date().toISOString().split('T')[0] // Today
  });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const queryParams = new URLSearchParams({
          granularity,
          startDate: dateRange.startDate,
          endDate: dateRange.endDate
        });

        const { data: result } = await axios.get<TimelineResponse>(`/api/timeline?${queryParams}`);
        setData(result.data);
      } catch (err: any) {
        console.error('Timeline fetch error:', err);
        setError(err.response?.data?.message || err.message || 'Failed to fetch timeline data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [granularity, dateRange]);

  const handleGranularityChange = (newGranularity: Granularity) => {
    setGranularity(newGranularity);
  };

  const handleDateRangeChange = (type: 'start' | 'end', value: string) => {
    setDateRange(prev => ({
      ...prev,
      [type === 'start' ? 'startDate' : 'endDate']: value
    }));
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Timeline</h1>
        
        <div className="flex gap-4 items-center">
          <div className="flex gap-2">
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => handleDateRangeChange('start', e.target.value)}
              className="border rounded px-2 py-1"
            />
            <span className="text-gray-500">to</span>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => handleDateRangeChange('end', e.target.value)}
              className="border rounded px-2 py-1"
            />
          </div>
          
          <div className="flex rounded-md shadow-sm" role="group">
            {(['week', 'month', 'year'] as const).map((g) => (
              <button
                key={g}
                onClick={() => handleGranularityChange(g)}
                className={`
                  px-4 py-2 text-sm font-medium border
                  ${granularity === g
                    ? 'bg-blue-500 text-white border-blue-500'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }
                  ${g === 'week' ? 'rounded-l-md' : ''}
                  ${g === 'year' ? 'rounded-r-md' : ''}
                `}
              >
                {g.charAt(0).toUpperCase() + g.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
        {loading ? (
          <div className="text-center text-gray-500 py-20">Loading chart...</div>
        ) : error ? (
          <div className="text-center text-red-500 py-20">{error}</div>
        ) : data.length === 0 ? (
          <div className="text-center text-gray-400 py-20">No data available for the selected period.</div>
        ) : (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="period" 
                tick={{ fontSize: 12 }}
                interval="preserveStartEnd"
              />
              <YAxis />
              <Tooltip 
                formatter={(value: number) => new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: 'USD'
                }).format(value)}
              />
              <Legend />
              <Bar dataKey="income" fill="#4ade80" name="Income" />
              <Bar dataKey="expenses" fill="#f87171" name="Expenses" />
              {data.some(d => d.balance !== null) && (
                <Line 
                  type="monotone" 
                  dataKey="balance" 
                  stroke="#2563eb" 
                  name="Balance" 
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
              )}
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Summary</h2>
        {!loading && !error && data.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-green-50 rounded-lg">
              <h3 className="text-sm font-medium text-green-800">Total Income</h3>
              <p className="text-2xl font-bold text-green-600">
                {new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: 'USD'
                }).format(data.reduce((sum, item) => sum + item.income, 0))}
              </p>
            </div>
            <div className="p-4 bg-red-50 rounded-lg">
              <h3 className="text-sm font-medium text-red-800">Total Expenses</h3>
              <p className="text-2xl font-bold text-red-600">
                {new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: 'USD'
                }).format(data.reduce((sum, item) => sum + item.expenses, 0))}
              </p>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg">
              <h3 className="text-sm font-medium text-blue-800">Net Savings</h3>
              <p className="text-2xl font-bold text-blue-600">
                {new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: 'USD'
                }).format(data.reduce((sum, item) => sum + (item.income - item.expenses), 0))}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Timeline; 