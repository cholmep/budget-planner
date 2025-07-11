import mongoose, { Document, Schema } from 'mongoose';

export interface IMonthlyBankBalance extends Document {
  userId: mongoose.Types.ObjectId;
  year: number;
  month: number; // 1-12
  balance: number;
  createdAt: Date;
  updatedAt: Date;
}

const MonthlyBankBalanceSchema = new Schema<IMonthlyBankBalance>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  year: {
    type: Number,
    required: true
  },
  month: {
    type: Number,
    required: true,
    min: 1,
    max: 12
  },
  balance: {
    type: Number,
    required: true
  }
}, {
  timestamps: true
});

MonthlyBankBalanceSchema.index({ userId: 1, year: 1, month: 1 }, { unique: true });

export default mongoose.model<IMonthlyBankBalance>('MonthlyBankBalance', MonthlyBankBalanceSchema); 