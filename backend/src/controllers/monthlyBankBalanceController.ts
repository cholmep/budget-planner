import { Request, Response } from 'express';
import Transaction from '../models/Transaction';
import MonthlyBankBalance from '../models/MonthlyBankBalance';

interface AuthenticatedRequest extends Request {
  userId: string;
}

const getAllForUser = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId;
    const balances = await MonthlyBankBalance.find({ userId }).sort({ year: 1, month: 1 });
    res.json(balances);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

const getForUserByMonth = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { year, month } = req.params;
    const balance = await MonthlyBankBalance.findOne({ userId, year: Number(year), month: Number(month) });
    if (!balance) {
      return res.status(404).json({ message: 'Balance not found' });
    }
    res.json(balance);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

const upsertForUser = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { year, month, balance } = req.body;
    if (!year || !month || typeof balance !== 'number') {
      return res.status(400).json({ message: 'year, month, and balance are required' });
    }
    const updated = await MonthlyBankBalance.findOneAndUpdate(
      { userId, year, month },
      { balance },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

const getMonthlyAggregates = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId;
    console.log('Getting monthly aggregates for user:', userId);
    
    // Aggregate transactions by year and month
    const aggregates = await Transaction.aggregate([
      { $match: { userId: new (require('mongoose').Types.ObjectId)(userId) } },
      {
        $group: {
          _id: { year: { $year: '$date' }, month: { $month: '$date' } },
          income: {
            $sum: {
              $cond: [{ $eq: ['$type', 'income'] }, '$amount', 0]
            }
          },
          expenses: {
            $sum: {
              $cond: [{ $eq: ['$type', 'expense'] }, '$amount', 0]
            }
          }
        }
      },
      {
        $project: {
          year: '$_id.year',
          month: '$_id.month',
          income: 1,
          expenses: 1,
          _id: 0
        }
      },
      { $sort: { year: 1, month: 1 } }
    ]);

    console.log('Transaction aggregates:', aggregates);

    // Get manual balances for all months
    const balances = await MonthlyBankBalance.find({ userId });
    console.log('Monthly balances:', balances);

    const balanceMap = new Map();
    balances.forEach(b => {
      const key = `${b.year}-${String(b.month).padStart(2, '0')}`;
      balanceMap.set(key, b.balance);
      console.log(`Setting balance for ${key}:`, b.balance);
    });

    // Merge aggregates and balances
    const result = aggregates.map(a => {
      const period = `${a.year}-${String(a.month).padStart(2, '0')}`;
      const balance = balanceMap.get(period);
      console.log(`Processing period ${period}:`, {
        income: a.income,
        expenses: a.expenses,
        balance: balance
      });
      
      return {
        period,
        income: a.income,
        expenses: a.expenses,
        balance: balance ?? null
      };
    });

    console.log('Final result:', result);
    res.json(result);
  } catch (error) {
    console.error('Monthly aggregates error:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};

export default {
  getAllForUser,
  getForUserByMonth,
  upsertForUser,
  getMonthlyAggregates
}; 