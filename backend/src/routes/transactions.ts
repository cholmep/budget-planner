import express from 'express';
import Joi from 'joi';
import Transaction from '../models/Transaction';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();

const transactionSchema = Joi.object({
  amount: Joi.number().required(),
  description: Joi.string().required(),
  category: Joi.string().required(),
  type: Joi.string().valid('income', 'expense').required(),
  date: Joi.date().default(Date.now),
  budgetId: Joi.string().optional()
});

// Get transactions
router.get('/', authMiddleware, async (req: any, res: any) => {
  try {
    const { budgetId, startDate, endDate } = req.query;
    const filter: any = { userId: req.userId };
    
    if (budgetId) filter.budgetId = budgetId;
    if (startDate && endDate) {
      filter.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }

    const transactions = await Transaction.find(filter)
      .sort({ date: -1 })
      .populate('budgetId', 'name');
      
    res.json(transactions);
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create transaction
router.post('/', authMiddleware, async (req: any, res: any) => {
  try {
    const { error } = transactionSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const transaction = new Transaction({
      ...req.body,
      userId: req.userId
    });

    await transaction.save();
    res.status(201).json(transaction);
  } catch (error) {
    console.error('Create transaction error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;