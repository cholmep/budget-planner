import express, { Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import Category, { DEFAULT_EXPENSE_CATEGORIES, DEFAULT_INCOME_CATEGORIES } from '../models/Category';
import Joi from 'joi';

const router = express.Router();

// Validation schema
const categorySchema = Joi.object({
  name: Joi.string().required(),
  type: Joi.string().valid('income', 'expense').required(),
  sortOrder: Joi.number().required()
});

// Initialize default categories for a new user
export const initializeDefaultCategories = async (userId: string) => {
  const categories = [
    ...DEFAULT_EXPENSE_CATEGORIES.map(cat => ({
      ...cat,
      type: 'expense',
      userId,
      isDefault: true
    })),
    ...DEFAULT_INCOME_CATEGORIES.map(cat => ({
      ...cat,
      type: 'income',
      userId,
      isDefault: true
    }))
  ];

  await Category.insertMany(categories);
};

// Helper function to wrap async handlers
const asyncHandler = (fn: (req: AuthRequest, res: Response) => Promise<any>) => {
  return (req: express.Request, res: Response) => {
    Promise.resolve(fn(req as AuthRequest, res)).catch((error) => {
      console.error('Route error:', error);
      res.status(500).json({ message: 'Server error' });
    });
  };
};

// Get all categories for the current user
router.get('/', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
  const categories = await Category.find({ userId: req.user._id })
    .sort({ type: 1, sortOrder: 1, name: 1 });
  res.json(categories);
}));

// Create a new custom category
router.post('/', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { error } = categorySchema.validate(req.body);
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }

  const { name, type, sortOrder } = req.body;

  // Check if category already exists for this user
  const existingCategory = await Category.findOne({
    userId: req.user._id,
    name: { $regex: new RegExp(`^${name}$`, 'i') } // Case-insensitive match
  });

  if (existingCategory) {
    return res.status(400).json({ message: 'Category already exists' });
  }

  const category = new Category({
    name,
    type,
    sortOrder,
    userId: req.user._id,
    isDefault: false
  });

  await category.save();
  res.status(201).json(category);
}));

// Update a custom category
router.put('/:id', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { error } = categorySchema.validate(req.body);
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }

  const category = await Category.findOne({
    _id: req.params.id,
    userId: req.user._id
  });

  if (!category) {
    return res.status(404).json({ message: 'Category not found' });
  }

  if (category.isDefault) {
    return res.status(403).json({ message: 'Cannot modify default categories' });
  }

  const { name, type, sortOrder } = req.body;

  // Check if new name conflicts with existing category
  const existingCategory = await Category.findOne({
    userId: req.user._id,
    name: { $regex: new RegExp(`^${name}$`, 'i') },
    _id: { $ne: req.params.id }
  });

  if (existingCategory) {
    return res.status(400).json({ message: 'Category name already exists' });
  }

  category.name = name;
  category.type = type;
  category.sortOrder = sortOrder;

  await category.save();
  res.json(category);
}));

// Delete a custom category
router.delete('/:id', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
  const category = await Category.findOne({
    _id: req.params.id,
    userId: req.user._id
  });

  if (!category) {
    return res.status(404).json({ message: 'Category not found' });
  }

  if (category.isDefault) {
    return res.status(403).json({ message: 'Cannot delete default categories' });
  }

  await category.deleteOne();
  res.json({ message: 'Category deleted successfully' });
}));

// Initialize categories for existing user
router.post('/initialize', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
  // Check if user already has categories
  const existingCategories = await Category.find({ userId: req.user._id });
  
  if (existingCategories.length > 0) {
    return res.status(400).json({ 
      message: 'Categories already initialized',
      categories: existingCategories 
    });
  }

  // Initialize default categories
  await initializeDefaultCategories(req.user._id.toString());

  // Return the newly created categories
  const categories = await Category.find({ userId: req.user._id })
    .sort({ type: 1, sortOrder: 1, name: 1 });
  
  res.status(201).json(categories);
}));

export default router; 