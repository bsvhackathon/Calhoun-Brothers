// Example of how to import shared models in middleware
import { connectToDatabase, Identity, Transaction } from 'mongo-tools';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Example function that uses the shared models
async function exampleUsage() {
  // Get MongoDB connection string from environment variables
  const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/your-database';
  
  try {
    // Connect to the database
    await connectToDatabase(mongoURI);
    
    // Now you can use the shared models
    console.log('Identity model:', Identity);
    console.log('Transaction model:', Transaction);
    
    // Example: Find all identities
    const identities = await Identity.find({});
    console.log('Found identities:', identities);
    
    // Example: Find all transactions
    const transactions = await Transaction.find({});
    console.log('Found transactions:', transactions);
    
  } catch (error) {
    console.error('Error in example usage:', error);
  }
}

// Call the example function
// exampleUsage().catch(console.error);

export { exampleUsage }; 