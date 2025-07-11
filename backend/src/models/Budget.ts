import mongoose, { Document, Schema } from 'mongoose';

export interface IBudgetCategory {
  name: string;
  plannedAmount: number;
  actualAmount: number;
  type: 'income' | 'expense';
  frequency: 'monthly' | 'fortnightly' | 'weekly' | 'yearly' | 'once';
  description?: string;
  categoryId?: mongoose.Types.ObjectId; // Reference to the Category model
}

export interface IBudget extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  categories: IBudgetCategory[];
  totalIncome: number;
  totalExpenses: number;
  netIncome: number;
  createdAt: Date;
  updatedAt: Date;
}

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
  },
  frequency: {
    type: String,
    enum: ['monthly', 'fortnightly', 'weekly', 'yearly', 'once'],
    default: 'monthly',
    required: true
  },
  description: {
    type: String,
    trim: true
  },
  categoryId: {
    type: Schema.Types.ObjectId,
    ref: 'Category'
  }
});

const BudgetSchema = new Schema<IBudget>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
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
  categories: [BudgetCategorySchema],
  totalIncome: {
    type: Number,
    default: 0
  },
  totalExpenses: {
    type: Number,
    default: 0
  },
  netIncome: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Calculate totals before saving
BudgetSchema.pre<IBudget>('save', function(next) {
  const budget = this as IBudget;

  budget.totalIncome = budget.categories
    .filter(cat => cat.type === 'income')
    .reduce((sum, cat) => sum + cat.plannedAmount, 0);

  budget.totalExpenses = budget.categories
    .filter(cat => cat.type === 'expense')
    .reduce((sum, cat) => sum + cat.plannedAmount, 0);

  budget.netIncome = budget.totalIncome - budget.totalExpenses;
  next();
});

export default mongoose.model<IBudget>('Budget', BudgetSchema);