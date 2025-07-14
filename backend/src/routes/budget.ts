import express, { Response } from 'express';
import Joi from 'joi';
import mongoose from 'mongoose';
import Budget from '../models/Budget';
import { authMiddleware, AuthRequest } from '../middleware/auth';
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
        actualAmount: Joi.number().min(0).optional().default(0),
        type: Joi.string().valid('income', 'expense').required(),
        frequency: Joi.string().valid('monthly','fortnightly','weekly','yearly','once').default('monthly'),
        description: Joi.string().allow('').optional(),
        categoryId: Joi.alternatives().try(
          Joi.string().pattern(/^[0-9a-fA-F]{24}$/),
          Joi.object().instance(mongoose.Types.ObjectId)
        ).required(),
        _id: Joi.alternatives().try(
          Joi.string().pattern(/^[0-9a-fA-F]{24}$/),
          Joi.object().instance(mongoose.Types.ObjectId)
        ).optional()
      })
    ).optional().default([])
}).unknown(true);

// Helper function to wrap async handlers
const asyncHandler = (fn: (req: AuthRequest, res: Response) => Promise<any>) => {
  return (req: express.Request, res: Response) => {
    Promise.resolve(fn(req as AuthRequest, res)).catch((error) => {
      console.error('Route error:', error);
      res.status(500).json({ message: 'Server error' });
    });
  };
};

// GET /api/budget  – fetch the master budget for current user (create if missing)
router.get('/', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
  let budget = await Budget.findOne({ userId: req.user._id });

  if (!budget) {
    // Create an empty budget on first access
    budget = new Budget({
      userId: req.user._id,
      name: 'My Budget',
      categories: [] as IBudgetCategory[]
    });
    await budget.save();
  }

  res.json(budget);
}));

// PUT /api/budget – replace the entire budget
router.put('/', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
  console.log('Received budget update request:', JSON.stringify(req.body, null, 2));
  
  const { error } = budgetSchema.validate(req.body);
  if (error) {
    console.error('Validation error:', error.details);
    return res.status(400).json({ 
      message: error.details[0].message,
      details: error.details
    });
  }

  // Ensure categories have proper ObjectId references
  const processedBody = {
    ...req.body,
    categories: req.body.categories?.map((cat: any) => ({
      ...cat,
      categoryId: new mongoose.Types.ObjectId(cat.categoryId),
      _id: cat._id ? new mongoose.Types.ObjectId(cat._id) : undefined
    }))
  };

  console.log('Processed budget data:', JSON.stringify(processedBody, null, 2));

  try {
    const updated = await Budget.findOneAndUpdate(
      { userId: req.user._id },
      processedBody,
      { new: true, upsert: true, runValidators: true }
    );

    res.json(updated);
  } catch (err: any) {
    console.error('Database error:', err);
    res.status(500).json({ message: 'Failed to update budget', error: err.message });
  }
}));

// PATCH /api/budget/:categoryId – update a single category (optional helper)
router.patch('/:categoryId', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { categoryId } = req.params;
  const { name, plannedAmount } = req.body;

  const budget = await Budget.findOne({ userId: req.user._id });
  if (!budget) return res.status(404).json({ message: 'Budget not found' });

  const category = budget.categories.find((c: any) => String((c as any)._id) === categoryId);
  if (!category) return res.status(404).json({ message: 'Category not found' });

  if (name !== undefined) category.name = name;
  if (plannedAmount !== undefined) category.plannedAmount = plannedAmount;

  await budget.save();

  res.json(budget);
}));

export default router;