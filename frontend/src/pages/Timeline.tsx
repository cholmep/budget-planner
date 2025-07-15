import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

type Granularity = 'week' | 'month' | 'year';

interface TimelineData {
  period: string;
  income: number;
  expenses: number;
  balance: number | null;  // Maps to totalAssets from the API response
}

interface TimelineResponseData {
  period: string;
  income: number;
  expenses: number;
  totalAssets: number | null;
}

interface TimelineResponse {
  granularity: Granularity;
  data: TimelineResponseData[];
}

interface VisibilityToggles {
  showIncome: boolean;
  showExpenses: boolean;
  showAssets: boolean;
}

const Timeline: React.FC = () => {
  const [data, setData] = useState<TimelineData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [granularity, setGranularity] = useState<Granularity>('month');
  const [visibility, setVisibility] = useState<VisibilityToggles>({
    showIncome: true,
    showExpenses: true,
    showAssets: true
  });

  // Calculate the date range for the current year
  const today = new Date();
  const startOfYear = new Date(today.getFullYear(), 0, 1); // January 1st of current year
  const endOfYear = new Date(today.getFullYear(), 11, 31); // December 31st of current year

  const [dateRange, setDateRange] = useState({
    startDate: startOfYear.toISOString().split('T')[0],
    endDate: endOfYear.toISOString().split('T')[0]
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
        const allPeriods = generateAllPeriods(dateRange.startDate, dateRange.endDate, granularity);
        const filledData = fillMissingPeriods(result.data, allPeriods);
        setData(filledData);
      } catch (err: any) {
        console.error('Timeline fetch error:', err);
        setError(err.response?.data?.message || err.message || 'Failed to fetch timeline data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [granularity, dateRange]);

  const generateAllPeriods = (start: string, end: string, gran: Granularity): string[] => {
    const periods: string[] = [];
    const startDate = new Date(start);
    const endDate = new Date(end);
    
    // Ensure we start at the beginning of the period
    let current = new Date(startDate);
    if (gran === 'month') {
      current.setDate(1);
    } else if (gran === 'week') {
      const day = current.getDay();
      current.setDate(current.getDate() - day + (day === 0 ? -6 : 1)); // Start on Monday
    }
    
    while (current <= endDate) {
      let periodKey: string;
      
      switch (gran) {
        case 'week':
          periodKey = current.toISOString().split('T')[0];
          current.setDate(current.getDate() + 7);
          break;
          
        case 'month':
          periodKey = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`;
          current.setMonth(current.getMonth() + 1);
          break;
          
        case 'year':
          periodKey = current.getFullYear().toString();
          current.setFullYear(current.getFullYear() + 1);
          break;
          
        default:
          periodKey = current.toISOString().split('T')[0];
          current.setDate(current.getDate() + 1);
      }
      
      periods.push(periodKey);
    }
    
    return periods;
  };

  const fillMissingPeriods = (data: TimelineResponseData[], allPeriods: string[]): TimelineData[] => {
    const dataMap = new Map(data.map(item => [item.period, item]));
    
    return allPeriods.map(period => {
      const existingData = dataMap.get(period);
      return {
        period,
        income: existingData?.income || 0,
        expenses: existingData?.expenses || 0,
        balance: existingData?.totalAssets ?? null
      };
    });
  };

  const handleGranularityChange = (newGranularity: Granularity) => {
    setGranularity(newGranularity);
  };

  const handleDateRangeChange = (type: 'start' | 'end', value: string) => {
    setDateRange(prev => ({
      ...prev,
      [type === 'start' ? 'startDate' : 'endDate']: value
    }));
  };

  const handleVisibilityChange = (key: keyof VisibilityToggles) => {
    setVisibility(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const hasAssetData = data.some(d => d.balance !== null);

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

      <div className="bg-white rounded-lg shadow-lg p-6 mb-4">
        <div className="flex gap-4 mb-4">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={visibility.showIncome}
              onChange={() => handleVisibilityChange('showIncome')}
              className="form-checkbox h-4 w-4 text-blue-500"
            />
            <span>Income</span>
          </label>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={visibility.showExpenses}
              onChange={() => handleVisibilityChange('showExpenses')}
              className="form-checkbox h-4 w-4 text-blue-500"
            />
            <span>Expenses</span>
          </label>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={visibility.showAssets}
              onChange={() => handleVisibilityChange('showAssets')}
              className="form-checkbox h-4 w-4 text-blue-500"
            />
            <span>Assets</span>
          </label>
        </div>

        {loading ? (
          <div className="text-center text-gray-500 py-20">Loading chart...</div>
        ) : error ? (
          <div className="text-center text-red-500 py-20">{error}</div>
        ) : data.length === 0 ? (
          <div className="text-center text-gray-400 py-20">No data available for the selected period.</div>
        ) : (
          <ResponsiveContainer width="100%" height={400}>
            <ComposedChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="period" 
                tick={{ fontSize: 12 }}
                interval="preserveStartEnd"
              />
              <YAxis 
                yAxisId="left"
                orientation="left"
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => formatCurrency(value)}
              />
              {visibility.showAssets && hasAssetData && (
                <YAxis 
                  yAxisId="right"
                  orientation="right"
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => formatCurrency(value)}
                  domain={['auto', 'auto']}
                />
              )}
              <Tooltip 
                formatter={(value: number) => formatCurrency(value)} 
                contentStyle={{ backgroundColor: 'white', border: '1px solid #ccc' }}
              />
              <Legend />
              {visibility.showIncome && (
                <Bar yAxisId="left" dataKey="income" fill="#4ade80" name="Income" />
              )}
              {visibility.showExpenses && (
                <Bar yAxisId="left" dataKey="expenses" fill="#f87171" name="Expenses" />
              )}
              {visibility.showAssets && hasAssetData && (
                <Line 
                  yAxisId="right"
                  type="monotone" 
                  dataKey="balance" 
                  stroke="#8b5cf6" 
                  name="Total Assets" 
                  strokeWidth={2}
                  dot={{ r: 4, fill: "#8b5cf6" }}
                  connectNulls={true}
                />
              )}
            </ComposedChart>
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
                {formatCurrency(data.reduce((sum, item) => sum + item.income, 0))}
              </p>
            </div>
            <div className="p-4 bg-red-50 rounded-lg">
              <h3 className="text-sm font-medium text-red-800">Total Expenses</h3>
              <p className="text-2xl font-bold text-red-600">
                {formatCurrency(data.reduce((sum, item) => sum + item.expenses, 0))}
              </p>
            </div>
            {hasAssetData && (
              <div className="p-4 bg-purple-50 rounded-lg">
                <h3 className="text-sm font-medium text-purple-800">Latest Assets</h3>
                <p className="text-2xl font-bold text-purple-600">
                  {formatCurrency(
                    data
                      .filter(item => item.balance !== null)
                      .reduce((latest, item) => Math.max(latest, item.balance || 0), 0)
                  )}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Timeline; 