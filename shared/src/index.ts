import mongoose from 'mongoose';

// Re-export everything from models
export * from './models';

// Export a connect function that can be used by both backend and middleware
export const connectToDatabase = async (connectionString: string): Promise<typeof mongoose> => {
  try {
    await mongoose.connect(connectionString);
    console.log('Connected to MongoDB successfully!');
    return mongoose;
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    throw error;
  }
}; 