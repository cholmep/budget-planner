import express, { Response } from 'express';
import Joi from 'joi';
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
        actualAmount: Joi.number().min(0).optional(),
        type: Joi.string().valid('income', 'expense').required(),
        frequency: Joi.string().valid('monthly','fortnightly','weekly','yearly','once').default('monthly'),
        description: Joi.string().allow('').optional(),
        _id: Joi.string().optional()
      })
    ).min(1).required()
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
  const { error } = budgetSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }

  const updated = await Budget.findOneAndUpdate(
    { userId: req.user._id },
    req.body,
    { new: true, upsert: true, runValidators: true }
  );

  res.json(updated);
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