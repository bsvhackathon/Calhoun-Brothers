import mongoose, { Document, Schema } from 'mongoose';

// Define the interface for an Identity document
export interface IIdentity extends Document {
  identityKey: string;
  publicKey: string;
  createdAt: Date;
  updatedAt: Date;
}

// Create the schema
const IdentitySchema = new Schema<IIdentity>(
  {
    identityKey: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    publicKey: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Create and export the model
export const Identity = mongoose.model<IIdentity>('Identity', IdentitySchema);