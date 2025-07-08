import express from 'express';
import Joi from 'joi';
import Budget from '../models/Budget';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();

// Validation schema
const budgetSchema = Joi.object({
  name: Joi.string().required(),
  description: Joi.string().optional(),
  month: Joi.number().min(1).max(12).required(),
  year: Joi.number().min(2020).required(),
  categories: Joi.array().items(
    Joi.object({
      name: Joi.string().required(),
      plannedAmount: Joi.number().min(0).required(),
      actualAmount: Joi.number().min(0).default(0),
      type: Joi.string().valid('income', 'expense').required()
    })
  )
});

// Get all budgets for user
router.get('/', authMiddleware, async (req: any, res: any) => {
  try {
    const budgets = await Budget.find({ userId: req.userId, isActive: true })
      .sort({ year: -1, month: -1 });
    res.json(budgets);
  } catch (error) {
    console.error('Get budgets error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get budget by ID
router.get('/:id', authMiddleware, async (req: any, res: any) => {
  try {
    const budget = await Budget.findOne({ 
      _id: req.params.id, 
      userId: req.userId 
    });
    
    if (!budget) {
      return res.status(404).json({ message: 'Budget not found' });
    }
    
    res.json(budget);
  } catch (error) {
    console.error('Get budget error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create budget
router.post('/', authMiddleware, async (req: any, res: any) => {
  try {
    const { error } = budgetSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const budget = new Budget({
      ...req.body,
      userId: req.userId
    });

    await budget.save();
    res.status(201).json(budget);
  } catch (error) {
    console.error('Create budget error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update budget
router.put('/:id', authMiddleware, async (req: any, res: any) => {
  try {
    const { error } = budgetSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const budget = await Budget.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      req.body,
      { new: true }
    );

    if (!budget) {
      return res.status(404).json({ message: 'Budget not found' });
    }

    res.json(budget);
  } catch (error) {
    console.error('Update budget error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete budget
router.delete('/:id', authMiddleware, async (req: any, res: any) => {
  try {
    const budget = await Budget.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { isActive: false },
      { new: true }
    );

    if (!budget) {
      return res.status(404).json({ message: 'Budget not found' });
    }

    res.json({ message: 'Budget deleted successfully' });
  } catch (error) {
    console.error('Delete budget error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;