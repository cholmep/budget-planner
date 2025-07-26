import express, { Response, Request, RequestHandler } from 'express';
import { protect } from '../middleware/auth';
import Category, { 
  DEFAULT_EXPENSE_CATEGORIES, 
  DEFAULT_INCOME_CATEGORIES
} from '../models/Category';
import Joi from 'joi';

// Extend Request type to include user
interface AuthenticatedRequest extends Request {
  user: {
    _id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
}

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

router.use(protect);

// Get all categories for the current user
router.get('/', (async (req: AuthenticatedRequest, res: Response) => {
  try {
    const categories = await Category.find({ userId: req.user._id })
      .sort({ type: 1, sortOrder: 1, name: 1 });
    res.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ message: 'Server error' });
  }
}) as RequestHandler);

// Create a new custom category
router.post('/', (async (req: AuthenticatedRequest, res: Response) => {
  try {
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
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({ message: 'Server error' });
  }
}) as RequestHandler);

// Update a custom category
router.put('/:id', (async (req: AuthenticatedRequest, res: Response) => {
  try {
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
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({ message: 'Server error' });
  }
}) as RequestHandler);

// Delete a custom category
router.delete('/:id', (async (req: AuthenticatedRequest, res: Response) => {
  try {
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
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ message: 'Server error' });
  }
}) as RequestHandler);

// Initialize categories for existing user
router.post('/initialize', (async (req: AuthenticatedRequest, res: Response) => {
  try {
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
  } catch (error) {
    console.error('Error initializing categories:', error);
    res.status(500).json({ message: 'Server error' });
  }
}) as RequestHandler);

export default router; 