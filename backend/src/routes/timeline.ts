import express, { Response, Request, NextFunction } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import Transaction from '../models/Transaction';
import Asset from '../models/Asset';

const router = express.Router();

// Helper function to wrap async handlers
const asyncHandler = (fn: (req: AuthRequest, res: Response) => Promise<any>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req as AuthRequest, res)).catch(next);
  };
};

// Helper function to group transactions by time period
const groupTransactionsByPeriod = (transactions: any[], granularity: string) => {
  const groups: { [key: string]: { income: number; expenses: number } } = {};

  transactions.forEach(transaction => {
    let periodKey: string;
    const date = new Date(transaction.date);

    switch (granularity) {
      case 'week':
        // Get the Monday of the week as the key
        const monday = new Date(date);
        monday.setDate(date.getDate() - date.getDay() + 1);
        periodKey = monday.toISOString().split('T')[0];
        break;
      case 'month':
        periodKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        break;
      case 'year':
        periodKey = date.getFullYear().toString();
        break;
      default:
        periodKey = date.toISOString().split('T')[0]; // Default to daily
    }

    if (!groups[periodKey]) {
      groups[periodKey] = { income: 0, expenses: 0 };
    }

    if (transaction.type === 'income') {
      groups[periodKey].income += transaction.amount;
    } else {
      groups[periodKey].expenses += transaction.amount;
    }
  });

  return groups;
};

// Helper function to get total assets for each period
const getAssetTotalsByPeriod = async (userId: string, startDate: Date, endDate: Date, granularity: string) => {
  // Fetch all assets with their balance history
  const assets = await Asset.find({ userId }).select('balanceHistory currentBalance createdAt name type');
  console.log('Found assets:', assets.map(a => ({
    name: a.name,
    type: a.type,
    currentBalance: a.currentBalance,
    balanceHistoryCount: a.balanceHistory.length,
    createdAt: a.createdAt
  })));
  
  // If no assets found, return null for all periods
  if (!assets.length) {
    console.log('No assets found for user:', userId);
    return {};
  }

  // Generate all periods between start and end date
  const periods: string[] = [];
  let currentDate = new Date(startDate);
  
  // Ensure we start at the beginning of the period
  if (granularity === 'month') {
    currentDate.setDate(1);
  } else if (granularity === 'week') {
    const day = currentDate.getDay();
    currentDate.setDate(currentDate.getDate() - day + (day === 0 ? -6 : 1)); // Start on Monday
  }

  while (currentDate <= endDate) {
    let periodKey: string;
    
    switch (granularity) {
      case 'week':
        periodKey = currentDate.toISOString().split('T')[0];
        currentDate.setDate(currentDate.getDate() + 7);
        break;
      case 'month':
        periodKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
        currentDate.setMonth(currentDate.getMonth() + 1);
        break;
      case 'year':
        periodKey = currentDate.getFullYear().toString();
        currentDate.setFullYear(currentDate.getFullYear() + 1);
        break;
      default:
        periodKey = currentDate.toISOString().split('T')[0];
        currentDate.setDate(currentDate.getDate() + 1);
    }
    
    periods.push(periodKey);
  }

  console.log('Generated periods:', periods);

  const assetTotals: { [key: string]: number | null } = {};

  // Initialize all periods with null
  periods.forEach(period => {
    assetTotals[period] = null;
  });

  // Calculate total assets for each period
  periods.forEach(period => {
    let total = 0;
    let hasValidBalance = false;
    const periodDate = new Date(period);
    
    // For monthly granularity, ensure we're using the end of the month
    if (granularity === 'month') {
      periodDate.setMonth(periodDate.getMonth() + 1);
      periodDate.setDate(0); // Last day of the month
    }

    let periodDebug: any = { period, periodDate: periodDate.toISOString(), assets: [] };
    
    assets.forEach(asset => {
      // Find the most recent balance before or on this period's date
      const relevantBalance = [...asset.balanceHistory]
        .sort((a, b) => b.date.getTime() - a.date.getTime())
        .find(balance => balance.date <= periodDate);
      
      let assetDebug = {
        name: asset.name,
        hasHistoricalBalance: !!relevantBalance,
        historicalBalance: relevantBalance?.amount,
        useCurrentBalance: !relevantBalance && asset.createdAt <= periodDate,
        currentBalance: asset.currentBalance,
        contributedAmount: 0
      };

      // If no historical balance found for this period, use current balance
      // if the asset was created before or during this period
      if (!relevantBalance && asset.createdAt <= periodDate) {
        total += asset.currentBalance;
        hasValidBalance = true;
        assetDebug.contributedAmount = asset.currentBalance;
      } else if (relevantBalance) {
        total += relevantBalance.amount;
        hasValidBalance = true;
        assetDebug.contributedAmount = relevantBalance.amount;
      }

      periodDebug.assets.push(assetDebug);
    });
    
    if (hasValidBalance) {
      assetTotals[period] = total;
    }
    
    periodDebug.totalAssets = assetTotals[period];
    console.log('Period calculation:', periodDebug);
  });

  console.log('Final asset totals:', assetTotals);
  return assetTotals;
};

// GET /api/timeline - Get timeline data with specified granularity
router.get('/', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { granularity = 'month', startDate, endDate } = req.query;
  
  console.log('Timeline request:', {
    userId: req.user._id,
    granularity,
    startDate,
    endDate
  });

  if (!['week', 'month', 'year'].includes(granularity as string)) {
    return res.status(400).json({ message: 'Invalid granularity. Must be week, month, or year.' });
  }

  // Build date filter
  const dateFilter: any = { userId: req.user._id };
  if (startDate && endDate) {
    dateFilter.date = {
      $gte: new Date(startDate as string),
      $lte: new Date(endDate as string)
    };
  }

  // Fetch transactions
  const transactions = await Transaction.find(dateFilter)
    .sort({ date: 1 })
    .select('amount type date');

  console.log('Found transactions:', transactions.length);

  // Get asset totals for each period
  const assetTotals = await getAssetTotalsByPeriod(
    req.user._id,
    new Date(startDate as string),
    new Date(endDate as string),
    granularity as string
  );

  // Group transactions by period
  const groupedTransactions = groupTransactionsByPeriod(transactions, granularity as string);

  // Format response
  const timelineData = Object.entries(groupedTransactions).map(([period, data]) => ({
    period,
    ...data,
    totalAssets: assetTotals[period] || null
  }));

  // Sort by period
  timelineData.sort((a, b) => a.period.localeCompare(b.period));

  console.log('Final timeline data:', timelineData.map(d => ({
    period: d.period,
    income: d.income,
    expenses: d.expenses,
    totalAssets: d.totalAssets
  })));

  res.json({
    granularity,
    data: timelineData
  });
}));

export default router; 