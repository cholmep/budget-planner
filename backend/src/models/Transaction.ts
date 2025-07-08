import mongoose, { Document, Schema } from 'mongoose';

export interface ITransaction extends Document {
  userId: mongoose.Types.ObjectId;
  budgetId?: mongoose.Types.ObjectId;
  amount: number;
  description: string;
  category: string;
  type: 'income' | 'expense';
  date: Date;
  isAutomated: boolean;
  bankAccountId?: string;
  plaidTransactionId?: string;
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
  }
}, {
  timestamps: true
});

// Index for efficient queries
TransactionSchema.index({ userId: 1, date: -1 });
TransactionSchema.index({ budgetId: 1 });
TransactionSchema.index({ plaidTransactionId: 1 });

export default mongoose.model<ITransaction>('Transaction', TransactionSchema);