import mongoose, { Document, Schema } from 'mongoose';

export interface ICategory extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  type: 'income' | 'expense';
  isDefault: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

const CategorySchema = new Schema<ICategory>({
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
  type: {
    type: String,
    enum: ['income', 'expense'],
    required: true
  },
  isDefault: {
    type: Boolean,
    default: false
  },
  sortOrder: {
    type: Number,
    required: true
  }
}, {
  timestamps: true
});

// Ensure unique categories per user
CategorySchema.index({ userId: 1, name: 1 }, { unique: true });

export const DEFAULT_EXPENSE_CATEGORIES = [
  { name: 'Groceries', sortOrder: 1 },
  { name: 'Shopping', sortOrder: 2 },
  { name: 'Entertainment', sortOrder: 3 },
  { name: 'Clothing and Footwear', sortOrder: 4 },
  { name: 'Insurance and Financial services', sortOrder: 5 },
  { name: 'Transport', sortOrder: 6 },
  { name: 'Food and Drink', sortOrder: 7 },
  { name: 'Rates and Utilities', sortOrder: 8 },
  { name: 'Investment costs', sortOrder: 9 },
  { name: 'Holiday', sortOrder: 10 }
];

export const DEFAULT_INCOME_CATEGORIES = [
  { name: 'Salary', sortOrder: 1 },
  { name: 'Rent', sortOrder: 2 }
];

export default mongoose.model<ICategory>('Category', CategorySchema); 