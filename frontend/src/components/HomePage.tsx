import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './HomePage.css';
import { Beef, CreateActionInput, PublicKey, SignActionArgs, Transaction, WalletClient } from '@bsv/sdk';
import getBeefForTxid from '../utils/getBeefForTxId';
import Importer from '../utils/Importer';

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [address, setAddress] = useState<string>('');
  const [wallet, setWallet] = useState<WalletClient | null>(null);
  const [balance, setBalance] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isImporting, setIsImporting] = useState<boolean>(false);

  const handlePlayGame = () => {
    navigate('/game');
  };

  const handleLeaderboard = () => {
    navigate('/leaderboard');
  };

  const handleLottery = () => {
    navigate('/lottery');
  };

  const handleAddressReveal = async () => {
    setIsLoading(true);
    try {
      const newWallet = await new WalletClient('auto');
      setWallet(newWallet);
      const publicKey = await newWallet.getPublicKey({ counterparty: 'anyone', protocolID: [0, 'chainarcade'], keyID: '1' })
      const newAddress = PublicKey.fromString(publicKey.publicKey).toAddress('mainnet');
      setAddress(newAddress);
    } catch (error) {
      console.error('Error getting address:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch BSV balance for a given address
  const fetchBSVBalance = async (address: string): Promise<number> => {
    const balanceResponse = await fetch(
      `https://api.whatsonchain.com/v1/bsv/${'main'}/address/${address}/balance`
    );
    console.log(balanceResponse);
    const balanceJSON = await balanceResponse.json();
    return (balanceJSON.confirmed + balanceJSON.unconfirmed) / 100000000;
  };

  const handleHelloLog = async () => {
    let reference: string;
    setIsImporting(true);
    try {
      const wocNet = 'main';
      const UTXOResponse = await fetch(
        `https://api.whatsonchain.com/v1/bsv/${wocNet}/address/${address}/unspent`
      );
      const UTXOJson = await UTXOResponse.json();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const outpoints: string[] = UTXOJson.map((x: any) => `${x.tx_hash}.${x.tx_pos}`)
      const inputs: CreateActionInput[] = outpoints.map(outpoint => ({
        outpoint,
        inputDescription: 'Redeem from the chainarcade',
        unlockingScriptLength: 108,
      }));

      // Merge BEEF for the inputs (placeholder)
      const inputBEEF = new Beef();
      for (let i = 0; i < inputs.length; i++) {
        const txid = inputs[i].outpoint.split('.')[0];
        if (!inputBEEF.findTxid(txid)) {
          const beef = await getBeefForTxid(txid, 'main')
          inputBEEF.mergeBeef(beef);
        }
      }

      // Create the action for spending from these inputs
      const { signableTransaction } = await wallet!.createAction({
        inputBEEF: inputBEEF.toBinary(),
        inputs,
        description: 'Import from the chainarcade',
      });

      console.log(signableTransaction);
      // debugger;

      reference = signableTransaction!.reference;

      // Convert BEEF to a Transaction object
      const tx = Transaction.fromAtomicBEEF(signableTransaction!.tx);
      const importer = new Importer();
      const unlocker = importer.unlock(wallet!);

      const signActionArgs: SignActionArgs = {
        reference,
        spends: {},
        options: {
          acceptDelayedBroadcast: false
        }
      };

      // Sign each input
      for (let i = 0; i < inputs.length; i++) {
        const script = await unlocker.sign(tx, i);
        signActionArgs.spends[i] = {
          unlockingScript: script.toHex(),
        };
      }

      // Broadcast signatures back to the wallet
      try {
        const res = await wallet?.signAction(signActionArgs);
        // debugger
        console.log(res);
      } catch (e) {
        // debugger
        console.log(e);
      }

      // Reset the local balance after successful import
      setBalance(0);
      alert('Funds successfully imported to your real wallet!');
    } catch (e) {
      console.error(e)
      const message = `Import failed: ${(e as any).message || 'unknown error'}`;
      alert(message);
    } finally {
      setIsImporting(false);
    }
  };

  const handleBalanceCheck = async () => {
    if (!address) return;
    setIsLoading(true);
    try {
      const balance = await fetchBSVBalance(address);
      setBalance(balance);
    } catch (error) {
      console.error('Error fetching balance:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="arcade-container">
      <div className="arcade-screen">
        <h1 className="arcade-title">ChainArcade</h1>
        <div className="arcade-content">
          <p className="arcade-text">Welcome to the Arcade!</p>
          <div className="button-container">
            <button 
              className="arcade-button"
              onClick={handlePlayGame}
            >
              PLAY NOW
            </button>
            <button 
              className="arcade-button"
              onClick={handleLeaderboard}
            >
              LEADERBOARD
            </button>
            <button 
              className="arcade-button"
              onClick={handleLottery}
            >
              LOTTERY
            </button>
          </div>
          <div className="small-button-container">
            <button 
              className="small-button"
              onClick={handleAddressReveal}
              disabled={isLoading}
            >
              {isLoading ? 'Loading...' : 'Reveal Address'}
            </button>
            <button 
              className="small-button"
              onClick={handleBalanceCheck}
              disabled={isLoading || !address}
            >
              {isLoading ? 'Loading...' : 'Check Balance'}
            </button>
            <button 
              className="small-button"
              onClick={handleHelloLog}
              disabled={isImporting}
            >
              {isImporting ? 'Importing...' : 'Import Money'}
            </button>
          </div>
          {address && (
            <div className="address-display">
              {address}
            </div>
          )}
          {balance > 0 && (
            <div className="balance-display">
              Balance: {balance} BSV
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HomePage; 