import mongoose, { Document, Schema } from 'mongoose';

export interface Transaction extends Document {
  userId: mongoose.Types.ObjectId;
  amount: number;
  description: string;
  category: string;
  type: 'income' | 'expense';
  date: Date;
  source: 'manual' | 'plaid' | 'csv_import';
  isAutomated: boolean;
  recurring: boolean;
  frequency?: 'weekly' | 'fortnightly' | 'monthly' | 'yearly' | 'once';
  paymentType: 'debit' | 'credit' | 'cash';
  createdAt: Date;
  updatedAt: Date;
}

const TransactionSchema = new Schema<Transaction>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    amount: {
      type: Number,
      required: true
    },
    description: {
      type: String,
      required: true
    },
    category: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: ['income', 'expense'],
      required: true
    },
    date: {
      type: Date,
      required: true
    },
    source: {
      type: String,
      enum: ['manual', 'plaid', 'csv_import'],
      required: true
    },
    isAutomated: {
      type: Boolean,
      default: false
    },
    recurring: {
      type: Boolean,
      default: false
    },
    frequency: {
      type: String,
      enum: ['weekly', 'fortnightly', 'monthly', 'yearly', 'once'],
      required: false
    },
    paymentType: {
      type: String,
      enum: ['debit', 'credit', 'cash'],
      default: 'debit'
    }
  },
  { timestamps: true }
);

export default mongoose.model<Transaction>('Transaction', TransactionSchema);