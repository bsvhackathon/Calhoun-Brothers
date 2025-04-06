import mongoose, { Document, Schema } from 'mongoose';

// Define the interface for a Lottery document
export interface ILottery extends Document {
  lotteryId: string;
  winningIdentityKey: Schema.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// Define the Lottery schema
const LotterySchema = new Schema<ILottery>(
  {
    lotteryId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    winningIdentityKey: {
      type: String,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt fields
  }
);

// Create and export the model
export const Lottery = mongoose.model<ILottery>('Lottery', LotterySchema);