import mongoose, { Document, Schema } from 'mongoose';

// Define the interface for a Transaction document
export interface ITransaction extends Document {
  tx: string;
  sessionId: string;
  satoshisPaid: number;
  accepted: Boolean;
  identity: Schema.Types.ObjectId;
  gameStarted: Boolean;
  gameOver: Boolean;
  gameScore: number;
  createdAt: Date;
  updatedAt: Date;
}

const TransactionSchema = new Schema<ITransaction>(
  {
    tx: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    sessionId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    satoshisPaid: {
      type: Number,
      required: true,
      min: 0,
    },
    accepted: {
      type: Boolean,
      required: true,
      default: false,
    },
    identity: {
      type: Schema.Types.ObjectId,
      ref: 'Identity',
      required: true,
    },
    gameStarted: {
      type: Boolean,
      default: false,
    },
    gameOver: {
      type: Boolean,
      default: false,
    },
    gameScore: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Create and export the model
export const Transaction = mongoose.model<ITransaction>('Transaction', TransactionSchema);