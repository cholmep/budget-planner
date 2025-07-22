import express, { Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import Transaction from '../models/Transaction';
import Joi from 'joi';

const router = express.Router();

// Validation schema
const transactionSchema = Joi.object({
  amount: Joi.number().required(),
  description: Joi.string().required(),
  category: Joi.string().required(),
  type: Joi.string().valid('income', 'expense').required(),
  date: Joi.date().required(),
  recurring: Joi.boolean().default(false),
  frequency: Joi.string().valid('weekly', 'monthly', 'yearly').when('recurring', {
    is: true,
    then: Joi.required(),
    otherwise: Joi.optional()
  })
});

// Helper function to wrap async handlers
const asyncHandler = (fn: (req: AuthRequest, res: Response) => Promise<any>) => {
  return (req: express.Request, res: Response) => {
    Promise.resolve(fn(req as AuthRequest, res)).catch((error) => {
      console.error('Route error:', error);
      res.status(500).json({ message: 'Server error' });
    });
  };
};

// Get monthly transactions
router.get('/monthly', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { month, year } = req.query;
  
  if (!month || !year) {
    return res.status(400).json({ message: 'Month and year are required' });
  }

  try {
    // Convert month/year to date range with timezone handling
    const startDate = new Date(Date.UTC(Number(year), Number(month) - 1, 1, 0, 0, 0));
    const endDate = new Date(Date.UTC(Number(year), Number(month), 0, 23, 59, 59, 999));

    console.log('Fetching transactions with params:', {
      userId: req.user?._id,
      startDate,
      endDate,
      month,
      year
    });

    const transactions = await Transaction.find({
      userId: req.user._id,
      date: {
        $gte: startDate,
        $lte: endDate
      }
    }).sort({ date: -1 });

    console.log('Found transactions:', transactions);

    res.json({ transactions });
  } catch (error: any) {
    console.error('Error fetching monthly transactions:', error);
    res.status(500).json({ message: 'Error fetching transactions', error: error.message });
  }
}));

// Create transaction
router.post('/', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { error } = transactionSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }

  const transaction = new Transaction({
    ...req.body,
    userId: req.user._id
  });

  await transaction.save();
  res.status(201).json(transaction);
}));

// Update transaction
router.put('/:id', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { error } = transactionSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }

  const transaction = await Transaction.findOneAndUpdate(
    { _id: req.params.id, userId: req.user._id },
    req.body,
    { new: true, runValidators: true }
  );

  if (!transaction) {
    return res.status(404).json({ message: 'Transaction not found' });
  }

  res.json(transaction);
}));

// Delete transaction
router.delete('/:id', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
  const transaction = await Transaction.findOneAndDelete({
    _id: req.params.id,
    userId: req.user._id
  });

  if (!transaction) {
    return res.status(404).json({ message: 'Transaction not found' });
  }

  res.json({ message: 'Transaction deleted successfully' });
}));

export default router; 