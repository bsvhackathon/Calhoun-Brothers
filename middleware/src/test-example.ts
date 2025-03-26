import { connectToDatabase, Identity, Transaction } from 'mongo-tools';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

console.log('Starting database operations test...');

async function testDatabaseOperations() {
  // Get MongoDB connection string from environment variables
  const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/your-database';
  
  try {
    // Connect to the database
    await connectToDatabase(mongoURI);
    console.log('Connected to MongoDB successfully!');
    
    // ------ IDENTITY OPERATIONS ------
    
    // 1. Insert a new identity
    const identityKey = `test-identity-${Date.now()}`;
    console.log(`Creating new identity with key: ${identityKey}`);
    
    const newIdentity = new Identity({
      identityKey: identityKey
    });
    
    const savedIdentity = await newIdentity.save();
    console.log('Created new identity:', savedIdentity);
    
    // 2. Upsert an identity (create if not exists, update if exists)
    const upsertIdentityKey = 'permanent-test-identity';
    console.log(`Upserting identity with key: ${upsertIdentityKey}`);
    
    const upsertedIdentity = await Identity.findOneAndUpdate(
      { identityKey: upsertIdentityKey },
      { identityKey: upsertIdentityKey },
      { new: true, upsert: true }
    );
    
    console.log('Upserted identity:', upsertedIdentity);
    
    // ------ TRANSACTION OPERATIONS ------
    
    // 3. Insert a new transaction linked to the identity
    const txId = `test-tx-${Date.now()}`;
    console.log(`Creating new transaction with ID: ${txId}`);
    
    const newTransaction = new Transaction({
      tx: txId,
      satoshisPaid: 1000,
      accepted: true,
      identity: savedIdentity._id,
      gameStarted: false,
      gameOver: false,
      gameScore: 0
    });
    
    const savedTransaction = await newTransaction.save();
    console.log('Created new transaction:', savedTransaction);
    
    // 4. Upsert a transaction (update game status)
    console.log(`Updating transaction: ${txId}`);
    
    const updatedTransaction = await Transaction.findOneAndUpdate(
      { tx: txId },
      { 
        gameStarted: true,
        gameScore: 100
      },
      { new: true }
    );
    
    console.log('Updated transaction:', updatedTransaction);
    
    // 5. Find all identities and transactions to verify operations
    const identities = await Identity.find({});
    console.log('All identities after operations:', identities);
    
    const transactions = await Transaction.find({}).populate('identity');
    console.log('All transactions after operations (with populated identity):', transactions);
    
    console.log('Test completed successfully');
  } catch (error) {
    console.error('Test failed with error:', error);
  }
}

// Run the test
testDatabaseOperations().catch(console.error); 