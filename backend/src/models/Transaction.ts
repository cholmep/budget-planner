import mongoose, { Document, Schema } from 'mongoose';

export interface ITransaction extends Document {
  userId: mongoose.Types.ObjectId;
  budgetId?: mongoose.Types.ObjectId;
  amount: number;
  description: string;
  category: string;
  type: 'income' | 'expense';
  date: Date;
  source: 'manual' | 'bank' | 'recurring';
  isAutomated: boolean;
  bankAccountId?: string;
  plaidTransactionId?: string;
  recurring?: boolean;
  frequency?: 'weekly' | 'monthly' | 'yearly';
  nextRecurrence?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const TransactionSchema = new Schema<ITransaction>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  budgetId: {
    type: Schema.Types.ObjectId,
    ref: 'Budget'
  },
  amount: {
    type: Number,
    required: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['income', 'expense'],
    required: true
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  source: {
    type: String,
    enum: ['manual', 'bank', 'recurring'],
    required: true,
    default: 'manual'
  },
  isAutomated: {
    type: Boolean,
    default: false
  },
  bankAccountId: {
    type: String,
    trim: true
  },
  plaidTransactionId: {
    type: String,
    trim: true,
    unique: true,
    sparse: true
  },
  recurring: {
    type: Boolean,
    default: false
  },
  frequency: {
    type: String,
    enum: ['weekly', 'monthly', 'yearly'],
    required: function(this: ITransaction) { return this.recurring; }
  },
  nextRecurrence: {
    type: Date,
    required: function(this: ITransaction) { return this.recurring; }
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
TransactionSchema.index({ userId: 1, date: -1 });
TransactionSchema.index({ budgetId: 1 });
TransactionSchema.index({ plaidTransactionId: 1 });
TransactionSchema.index({ userId: 1, category: 1, date: -1 });
TransactionSchema.index({ userId: 1, type: 1, date: -1 });
TransactionSchema.index({ recurring: 1, nextRecurrence: 1 }, { sparse: true });

// Pre-save middleware to set nextRecurrence for recurring transactions
TransactionSchema.pre('save', function(next) {
  if (this.recurring && !this.nextRecurrence) {
    const date = new Date(this.date);
    switch (this.frequency) {
      case 'weekly':
        date.setDate(date.getDate() + 7);
        break;
      case 'monthly':
        date.setMonth(date.getMonth() + 1);
        break;
      case 'yearly':
        date.setFullYear(date.getFullYear() + 1);
        break;
    }
    this.nextRecurrence = date;
  }
  next();
});

export default mongoose.model<ITransaction>('Transaction', TransactionSchema);