import mongoose, { Document, Schema } from 'mongoose';

// Define the interface for a Transaction document
export interface ITransaction extends Document {
  tx: string;
  sessionId: string;
  nonce: string;
  satoshisPaid: number;
  accepted: Boolean;
  identity: Schema.Types.ObjectId;
  gameStarted: Boolean;
  gameOver: Boolean;
  gameScore: number;
  createdAt: Date;
  updatedAt: Date;
  lottery: Schema.Types.ObjectId;
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
    nonce: {
      type: String,
      required: true,
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
    lottery: {
      type: Schema.Types.ObjectId,
      ref: 'Lottery',
    },
  },
  {
    timestamps: true,
  }
);


// Pre-save middleware to enforce the 5-transaction limit per lottery
TransactionSchema.pre('save', async function (next) {
  // Skip validation if lottery field is not set
  if (!this.lottery) {
    return next();
  }

  try {
    // Count existing transactions with the same lottery ID
    const count = await mongoose.model('Transaction').countDocuments({
      lottery: this.lottery,
      _id: { $ne: this._id }, // Exclude the current document if it's an update
    });

    // Check if adding this transaction would exceed the limit
    if (count >= 5) {
      throw new Error('Cannot add more than 5 transactions to the same lottery');
    }

    next();
  } catch (error) {
    console.log(error);
  }
});

// Create and export the model
export const Transaction = mongoose.model<ITransaction>('Transaction', TransactionSchema);