import express, { Response, Request, NextFunction } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import Transaction from '../models/Transaction';
import MonthlyBankBalance from '../models/MonthlyBankBalance';

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

// GET /api/timeline - Get timeline data with specified granularity
router.get('/', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { granularity = 'month', startDate, endDate } = req.query;
  
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

  // Fetch bank balances if available
  let bankBalances = [];
  try {
    bankBalances = await MonthlyBankBalance.find(dateFilter)
      .sort({ date: 1 })
      .select('balance date');
  } catch (error) {
    console.warn('Bank balance fetch failed:', error);
    // Continue without bank balances
  }

  // Group transactions by period
  const groupedTransactions = groupTransactionsByPeriod(transactions, granularity as string);

  // Format response
  const timelineData = Object.entries(groupedTransactions).map(([period, data]) => ({
    period,
    ...data,
    // Find the closest bank balance for this period if available
    balance: bankBalances.find(b => 
      new Date(b.date).toISOString().split('T')[0] === period
    )?.balance || null
  }));

  // Sort by period
  timelineData.sort((a, b) => a.period.localeCompare(b.period));

  res.json({
    granularity,
    data: timelineData
  });
}));

export default router; 