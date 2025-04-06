import { Lottery as ScryptLottery } from './src/contracts/lottery'
import {
    bsv,
    TestWallet,
    DefaultProvider,
    toByteString,
    FixedArray,
    PubKey,
    sha256,
    int2ByteString,
    findSig,
    MethodCallOptions,
} from 'scrypt-ts'
import { randomPrivateKey, getDefaultSigner, sleep } from './tests/utils/txHelper'
import * as dotenv from 'dotenv'
import { hash, randomBytes } from 'crypto'
import { Transaction, Lottery, connectToDatabase } from 'mongo-tools'

// Load the .env file
dotenv.config()

// Read the private key from the .env file.
// The default private key inside the .env file is meant to be used for the Bitcoin testnet.
// See https://scrypt.io/docs/bitcoin-basics/bsv/#private-keys
// const privateKey = bsv.PrivateKey.fromWIF(process.env.PRIVATE_KEY || '')
// const [ownerPrivKey, ownerPubKey, ,] = randomPrivateKey()
// const [player1PrivKey, player1PubKey, ,] = randomPrivateKey()
// const [player2PrivKey, player2PubKey, ,] = randomPrivateKey()
let owner: bsv.PrivateKey = bsv.PrivateKey.fromWIF('L12nzYZNo1k1TwSWzkwT899kpSyAwtSEMfXxaM9P3znw3RAnamcw');
let player1: bsv.PrivateKey = bsv.PrivateKey.fromWIF('L4pXiHEfG2B3byWenBWqDDGozv6EZoxNrLnGavDFg6Jd3fomjZYR');
let player2: bsv.PrivateKey = bsv.PrivateKey.fromWIF('L219Rmzqe9JuuN1xx7eHxHXB6KaeBn789tYwJzf6njX6wHQQpUBG');

// Prepare signer.
// See https://scrypt.io/docs/how-to-deploy-and-call-a-contract/#prepare-a-signer-and-provider
const signer = getDefaultSigner(owner)

function generateRandomNonce(): bigint {
    const randomData = randomBytes(32)
    return BigInt('0x' + randomData.toString('hex'))
}

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/bsv-app';
(async () => {
    try {
      await connectToDatabase(MONGODB_URI);
      console.log('Backend connected to MongoDB successfully!');
    } catch (error) {
      console.error('Backend failed to connect to MongoDB:', error);
      process.exit(1); // Exit with error if database connection fails
    }
  })();
// async function main() {
//     await ScryptLottery.loadArtifact()

//     let instance: ScryptLottery

//     let nonce1: bigint = generateRandomNonce()
//     let nonce2: bigint = generateRandomNonce()

//     instance = new ScryptLottery(
//         PubKey(owner.publicKey.toString()),
//         [PubKey(player1.publicKey.toString()), PubKey(player2.publicKey.toString())],
//         [sha256(int2ByteString(nonce1)), sha256(int2ByteString(nonce2))]
//     )

//     console.log(await signer.getBalance())

//     // Connect to a signer.
//     await instance.connect(signer)

//     // Contract deployment.
//     const amount = 1
//     const deployTx = await instance.deploy(amount)
//     console.log('Lottery contract deployed: ', deployTx.id)

//     const newInstance = ScryptLottery.fromTx(deployTx, 0)
//     await newInstance.connect(signer)

//     const nextInstance = newInstance.next()
//     nextInstance.totalAmount = 10n

//     const { tx: fundTx, next } = await newInstance.methods.fund(
//         (sigReps) => findSig(sigReps, owner.publicKey),
//         10n,
//         {
//             pubKeyOrAddrToSign: owner.publicKey,
//             next: {
//                 instance: nextInstance,
//                 balance: Number(nextInstance.totalAmount),
//             },
//         } as MethodCallOptions<ScryptLottery>
//     )

//     console.log('Fund tx: ', fundTx.id)

//     await sleep(5)

//     const latestInstance = ScryptLottery.fromTx(fundTx, 0)
//     await latestInstance.connect(signer)
//     latestInstance.bindTxBuilder('draw', ScryptLottery.drawTxBuilder)
//     const next2Instance = latestInstance.next()
//     const nonce: FixedArray<bigint, 2> = [nonce1, nonce2]
//     const { tx: drawTx, next: next2 } = await latestInstance.methods.draw(
//         nonce,
//         (sigReps) => findSig(sigReps, owner.publicKey),
//         {
//             pubKeyOrAddrToSign: owner.publicKey,
//             next: {
//                 instance: next2Instance,
//                 balance: 0,
//             },
//         } as MethodCallOptions<ScryptLottery>
//     )
//     console.log('Draw tx: ', drawTx.id)
// }
// main()


// Modified deployLottery function
async function deployLottery(
    pubKeys: PubKey[],          // Array of public keys (owner + players)
    nonces: bigint[],          // Array of nonces
    ownerPubKey: PubKey        // Owner's public key
): Promise<{
    deployTxId: string,
    fundTxId: string,
    drawTxId: string
}> {
    await ScryptLottery.loadArtifact()
    let owner: bsv.PrivateKey = bsv.PrivateKey.fromWIF('L12nzYZNo1k1TwSWzkwT899kpSyAwtSEMfXxaM9P3znw3RAnamcw');
    const signer = getDefaultSigner(owner)

    const hashedNonces = nonces.map(nonce => sha256(int2ByteString(nonce)))
    const instance = new ScryptLottery(
        ownerPubKey,
        [PubKey(pubKeys[0].toString()), PubKey(pubKeys[1].toString()), PubKey(pubKeys[2].toString()), PubKey(pubKeys[3].toString()), PubKey(pubKeys[4].toString())], // Assuming first is owner, next two are players
        [hashedNonces[0], hashedNonces[1], hashedNonces[2], hashedNonces[3], hashedNonces[4]]
    )

    await instance.connect(signer)
    const amount = 1
    // console.log(instance)
    const deployTx = await instance.deploy(amount)
    const deployTxId = deployTx.id
    console.log('Lottery contract deployed: ', deployTxId)

    const newInstance = ScryptLottery.fromTx(deployTx, 0)
    await newInstance.connect(signer)
    const nextInstance = newInstance.next()
    nextInstance.totalAmount = 10n

    const { tx: fundTx } = await newInstance.methods.fund(
        (sigReps) => findSig(sigReps, bsv.PublicKey.fromString(ownerPubKey.toString())),
        10n,
        {
            pubKeyOrAddrToSign: bsv.PublicKey.fromString(ownerPubKey.toString()),
            next: { instance: nextInstance, balance: Number(nextInstance.totalAmount) },
        } as MethodCallOptions<ScryptLottery>
    )
    const fundTxId = fundTx.id
    console.log('Fund tx: ', fundTxId)

    await sleep(5)
    const latestInstance = ScryptLottery.fromTx(fundTx, 0)
    await latestInstance.connect(signer)
    latestInstance.bindTxBuilder('draw', ScryptLottery.drawTxBuilder)
    const next2Instance = latestInstance.next()
    const nonceArray: FixedArray<bigint, 5> = [nonces[0], nonces[1], nonces[2], nonces[3], nonces[4]]

    const { tx: drawTx } = await latestInstance.methods.draw(
        nonceArray,
        (sigReps) => findSig(sigReps, bsv.PublicKey.fromString(ownerPubKey.toString())),
        {
            pubKeyOrAddrToSign: bsv.PublicKey.fromString(ownerPubKey.toString()),
            next: { instance: next2Instance, balance: 0 },
        } as MethodCallOptions<ScryptLottery>
    )
    const drawTxId = drawTx.id
    console.log('Draw tx: ', drawTxId)

    return { deployTxId, fundTxId, drawTxId }
}

async function assignTransactionsToLotteries() {
    try {
        const unassignedTransactions = await Transaction.find({ lottery: null })
            .populate('identity')
            .exec();

        if (unassignedTransactions.length === 0) {
            console.log('No transactions without a lottery found.');
            return;
        }

        console.log(`Found ${unassignedTransactions.length} unassigned transactions.`);
        const batchSize = 5;
        let processedCount = 0;

        for (let i = 0; i < unassignedTransactions.length; i += batchSize) {
            const batch = unassignedTransactions.slice(i, i + batchSize);
            if (batch.length < batchSize) {
                console.log(`Leaving ${batch.length} transactions in the queue (less than 5).`);
                break;
            }

            const lotteryId = `LOTTERY_${Date.now()}_${processedCount}`;
            const lottery = await Lottery.create({ lotteryId });
            const transactionIds = batch.map(tx => tx._id);
            await Transaction.updateMany(
                { _id: { $in: transactionIds } },
                { lottery: lottery._id }
            );

            processedCount += batch.length;
            console.log(`Assigned ${batch.length} transactions to ${lotteryId}`);
        }

        const leftovers = unassignedTransactions.length - processedCount;
        console.log(leftovers > 0 
            ? `${leftovers} transactions remain in the queue.` 
            : 'All transactions have been assigned to lotteries.');
    } catch (error) {
        console.error('Error assigning transactions to lotteries:', error);
    }
}

async function getUndrawnLotteriesDetails() {
    try {
        const undrawnLotteries = await Lottery.find({ winningIdentityKey: null }).exec();

        if (undrawnLotteries.length === 0) {
            console.log('No undrawn lotteries found.');
            return;
        }

        console.log(`Found ${undrawnLotteries.length} undrawn lotteries.`);

        // Define owner public key (you might want to get this from config or database)
        const ownerPrivKey = bsv.PrivateKey.fromWIF('L12nzYZNo1k1TwSWzkwT899kpSyAwtSEMfXxaM9P3znw3RAnamcw');
        const ownerPubKey = PubKey(ownerPrivKey.publicKey.toString());

        for (const lottery of undrawnLotteries) {
            const transactions = await Transaction.find({ lottery: lottery._id })
            .populate<{ identity: { publicKey: string; identityKey: string } }>('identity', 'publicKey identityKey')
            .exec();

            if (transactions.length === 0) {
                console.log(`Lottery ${lottery.lotteryId}: No transactions found.`);
                continue;
            }

            // Extract data for deployLottery
            const pubKeys: PubKey[] = [
                ...transactions.map(tx => 
                    PubKey(tx.identity?.publicKey || 'Unknown')
                )
            ];
            
            const identityKeys: PubKey[] = [
                ...transactions.map(tx => 
                    PubKey(tx.identity?.identityKey || 'Unknown')
                )
            ];

            // console.log(identityKeys)

            const nonces: bigint[] = transactions.map(tx => 
                BigInt(tx.nonce || '0') // Convert nonce to bigint, default to 0 if missing
            );

            // Calculate the winner before deploying
            let sum = 0n;
            for (let i = 0; i < nonces.length; i++) {
                sum += nonces[i];
            }
            const winnerIndex = Number(sum % BigInt(5));
            const winnerPubKey = pubKeys[winnerIndex];
            const winnerIdentityKey = identityKeys[winnerIndex];
            console.log(`\nPredicted winner for lottery ${lottery.lotteryId}:`);
            console.log(`  Winner index: ${winnerIndex}`);
            console.log(`  Winner public key: ${winnerPubKey.toString()}`);
            console.log(`  Winner identity key: ${winnerIdentityKey.toString()}`);

            const details = transactions.map(tx => ({
                nonce: tx.nonce || 'N/A',
                identityKey: tx.identity?.publicKey || 'Unknown',
            }));

            // console.log(`\nLottery ${lottery.lotteryId}:`);
            // details.forEach((detail, index) => {
            //     console.log(`  ${index + 1}. Nonce: ${detail.nonce}, IdentityKey: ${detail.identityKey}`);
            // });

            // Call deployLottery with the extracted data
            try {
                // console.log(ownerPubKey);
                const result = await deployLottery(pubKeys, nonces, ownerPubKey);
                console.log(`Lottery ${lottery.lotteryId} processed on blockchain:`, result);

                // Optionally update lottery with winningIdentityKey or transaction IDs
                await Lottery.updateOne(
                    { _id: lottery._id },
                    { 
                        winningIdentityKey: winnerIdentityKey.toString(), // Convert PubKey to string
                        deployTxId: result.deployTxId,
                        fundTxId: result.fundTxId,
                        drawTxId: result.drawTxId
                    }
                );
            } catch (deployError) {
                console.error(`Error deploying lottery ${lottery.lotteryId}:`, deployError);
            }
        }
    } catch (error) {
        console.error('Error retrieving undrawn lotteries:', error);
    }
}

const intervalTime = 5000;

const run = async () => {
    console.log('Running lottery processing...');
    try {
        await assignTransactionsToLotteries();
        await getUndrawnLotteriesDetails();
    } catch (err) {
        console.error('Error:', err);
    } finally {
        setTimeout(run, intervalTime);
    }
};

run();
