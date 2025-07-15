import mongoose, { Schema, Document } from 'mongoose';

export interface IAssetBalance {
  _id?: mongoose.Types.ObjectId;
  amount: number;
  date: Date;
}

export interface IAsset extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  type: 'savings' | 'investment' | 'property' | 'other';
  description?: string;
  institution?: string;
  accountNumber?: string;
  balanceHistory: IAssetBalance[];
  currentBalance: number;
  lastUpdated: Date;
  createdAt: Date;
  updatedAt: Date;
}

const AssetBalanceSchema = new Schema({
  amount: { type: Number, required: true },
  date: { type: Date, required: true }
}, { _id: true });

const AssetSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  type: { 
    type: String, 
    required: true,
    enum: ['savings', 'investment', 'property', 'other']
  },
  description: { type: String },
  institution: { type: String },
  accountNumber: { type: String },
  balanceHistory: [AssetBalanceSchema],
  currentBalance: { type: Number, required: true },
  lastUpdated: { type: Date, required: true, default: Date.now }
}, {
  timestamps: true
});

// Update currentBalance and lastUpdated when balance history changes
AssetSchema.pre('save', function(next) {
  if (this.balanceHistory.length > 0) {
    // Sort by date descending to get the latest balance
    const latestBalance = [...this.balanceHistory]
      .sort((a, b) => b.date.getTime() - a.date.getTime())[0];
    
    this.currentBalance = latestBalance.amount;
    this.lastUpdated = latestBalance.date;
  }
  next();
});

export default mongoose.model<IAsset>('Asset', AssetSchema); 