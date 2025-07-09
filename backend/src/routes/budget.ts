import express from 'express';
import Joi from 'joi';
import Budget from '../models/Budget';
import { authMiddleware } from '../middleware/auth';
import { IBudgetCategory } from '../models/Budget';

const router = express.Router();

// Validation schema for the entire budget payload
const budgetSchema = Joi.object({
  name: Joi.string().required(),
  description: Joi.string().allow('').optional(),
  categories: Joi.array()
    .items(
      Joi.object({
        name: Joi.string().required(),
        plannedAmount: Joi.number().min(0).required(),
        type: Joi.string().valid('income', 'expense').required()
      })
    )
    .min(1)
    .required()
});

// GET /api/budget  – fetch the master budget for current user (create if missing)
router.get('/', authMiddleware, async (req: any, res) => {
  try {
    let budget = await Budget.findOne({ userId: req.userId });

    if (!budget) {
      // Create an empty budget on first access
      budget = new Budget({
        userId: req.userId,
        name: 'My Budget',
        categories: [] as IBudgetCategory[]
      });
      await budget.save();
    }

    res.json(budget);
  } catch (error) {
    console.error('Fetch budget error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/budget – replace the entire budget
router.put('/', authMiddleware, async (req: any, res) => {
  try {
    const { error } = budgetSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const updated = await Budget.findOneAndUpdate(
      { userId: req.userId },
      req.body,
      { new: true, upsert: true, runValidators: true }
    );

    res.json(updated);
  } catch (error) {
    console.error('Update budget error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// PATCH /api/budget/:categoryId – update a single category (optional helper)
router.patch('/:categoryId', authMiddleware, async (req: any, res) => {
  try {
    const { categoryId } = req.params;
    const { name, plannedAmount } = req.body;

    const budget = await Budget.findOne({ userId: req.userId });
    if (!budget) return res.status(404).json({ message: 'Budget not found' });

    const category = budget.categories.find((c: any) => String((c as any)._id) === categoryId);
    if (!category) return res.status(404).json({ message: 'Category not found' });

    if (name !== undefined) category.name = name;
    if (plannedAmount !== undefined) category.plannedAmount = plannedAmount;

    await budget.save();

    res.json(budget);
  } catch (error) {
    console.error('Patch budget category error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;