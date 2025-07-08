import mongoose, { Document, Schema } from 'mongoose';
import { IBudgetCategory } from './Budget';

export interface IScenarioProjection {
  month: number;
  year: number;
  totalIncome: number;
  totalExpenses: number;
  netIncome: number;
  cumulativeNet: number;
}

export interface IScenario extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  baseBudgetId?: mongoose.Types.ObjectId;
  categories: IBudgetCategory[];
  projectionMonths: number;
  projections: IScenarioProjection[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ScenarioProjectionSchema = new Schema<IScenarioProjection>({
  month: {
    type: Number,
    required: true,
    min: 1,
    max: 12
  },
  year: {
    type: Number,
    required: true
  },
  totalIncome: {
    type: Number,
    required: true
  },
  totalExpenses: {
    type: Number,
    required: true
  },
  netIncome: {
    type: Number,
    required: true
  },
  cumulativeNet: {
    type: Number,
    required: true
  }
});

const BudgetCategorySchema = new Schema<IBudgetCategory>({
  name: {
    type: String,
    required: true,
    trim: true
  },
  plannedAmount: {
    type: Number,
    required: true,
    default: 0
  },
  actualAmount: {
    type: Number,
    default: 0
  },
  type: {
    type: String,
    enum: ['income', 'expense'],
    required: true
  }
});

const ScenarioSchema = new Schema<IScenario>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  baseBudgetId: {
    type: Schema.Types.ObjectId,
    ref: 'Budget'
  },
  categories: [BudgetCategorySchema],
  projectionMonths: {
    type: Number,
    required: true,
    min: 1,
    max: 120,
    default: 12
  },
  projections: [ScenarioProjectionSchema],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Generate projections before saving
ScenarioSchema.pre('save', function(next) {
  if (this.isModified('categories') || this.isModified('projectionMonths')) {
    this.generateProjections();
  }
  next();
});

// Method to generate future projections
ScenarioSchema.methods.generateProjections = function() {
  const projections: IScenarioProjection[] = [];
  const totalIncome = this.categories
    .filter((cat: IBudgetCategory) => cat.type === 'income')
    .reduce((sum: number, cat: IBudgetCategory) => sum + cat.plannedAmount, 0);
    
  const totalExpenses = this.categories
    .filter((cat: IBudgetCategory) => cat.type === 'expense')
    .reduce((sum: number, cat: IBudgetCategory) => sum + cat.plannedAmount, 0);
    
  const netIncome = totalIncome - totalExpenses;
  let cumulativeNet = 0;
  
  const startDate = new Date();
  for (let i = 0; i < this.projectionMonths; i++) {
    const projectionDate = new Date(startDate.getFullYear(), startDate.getMonth() + i, 1);
    cumulativeNet += netIncome;
    
    projections.push({
      month: projectionDate.getMonth() + 1,
      year: projectionDate.getFullYear(),
      totalIncome,
      totalExpenses,
      netIncome,
      cumulativeNet
    });
  }
  
  this.projections = projections;
};

export default mongoose.model<IScenario>('Scenario', ScenarioSchema);