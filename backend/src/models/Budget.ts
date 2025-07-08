import mongoose, { Document, Schema } from 'mongoose';

export interface IBudgetCategory {
  name: string;
  plannedAmount: number;
  actualAmount: number;
  type: 'income' | 'expense';
}

export interface IBudget extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  month: number;
  year: number;
  categories: IBudgetCategory[];
  totalIncome: number;
  totalExpenses: number;
  netIncome: number;
  isActive: boolean;
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
  }
});

const BudgetSchema = new Schema<IBudget>({
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
  month: {
    type: Number,
    required: true,
    min: 1,
    max: 12
  },
  year: {
    type: Number,
    required: true,
    min: 2020
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
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Calculate totals before saving
BudgetSchema.pre('save', function(next) {
  this.totalIncome = this.categories
    .filter(cat => cat.type === 'income')
    .reduce((sum, cat) => sum + cat.plannedAmount, 0);
    
  this.totalExpenses = this.categories
    .filter(cat => cat.type === 'expense')
    .reduce((sum, cat) => sum + cat.plannedAmount, 0);
    
  this.netIncome = this.totalIncome - this.totalExpenses;
  next();
});

export default mongoose.model<IBudget>('Budget', BudgetSchema);