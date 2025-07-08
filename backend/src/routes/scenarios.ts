import express from 'express';
import Joi from 'joi';
import Scenario from '../models/Scenario';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();

const scenarioSchema = Joi.object({
  name: Joi.string().required(),
  description: Joi.string().optional(),
  baseBudgetId: Joi.string().optional(),
  projectionMonths: Joi.number().min(1).max(120).default(12),
  categories: Joi.array().items(
    Joi.object({
      name: Joi.string().required(),
      plannedAmount: Joi.number().min(0).required(),
      type: Joi.string().valid('income', 'expense').required()
    })
  )
});

// Get scenarios
router.get('/', authMiddleware, async (req: any, res: any) => {
  try {
    const scenarios = await Scenario.find({ userId: req.userId, isActive: true })
      .populate('baseBudgetId', 'name')
      .sort({ createdAt: -1 });
    res.json(scenarios);
  } catch (error) {
    console.error('Get scenarios error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create scenario
router.post('/', authMiddleware, async (req: any, res: any) => {
  try {
    const { error } = scenarioSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const scenario = new Scenario({
      ...req.body,
      userId: req.userId
    });

    await scenario.save();
    res.status(201).json(scenario);
  } catch (error) {
    console.error('Create scenario error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Compare scenarios
router.post('/compare', authMiddleware, async (req: any, res: any) => {
  try {
    const { scenarioIds } = req.body;
    const scenarios = await Scenario.find({
      _id: { $in: scenarioIds },
      userId: req.userId
    });

    const comparison = scenarios.map(scenario => ({
      id: scenario._id,
      name: scenario.name,
      projections: scenario.projections
    }));

    res.json(comparison);
  } catch (error) {
    console.error('Compare scenarios error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;