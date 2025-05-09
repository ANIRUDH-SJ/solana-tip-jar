// src/app/page.tsx
"use client";

import { Suspense } from 'react';
// import 
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { SystemProgram, Transaction, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { useState, useCallback, ChangeEvent, useEffect } from 'react';
import Link from 'next/link'; // For explorer links
import { Reem_Kufi } from 'next/font/google';

// DEFINING THE TIP INTERFACE:
interface Tip {
  handle: string;
  address: string;
  amount: string;
  sig: string;
  date: string;
}
export default function HomePage() {
  const { connection } = useConnection();
  const { publicKey, sendTransaction, connected } = useWallet();

  //STATE FOR DIRECT TIPPING:
  const [recipient, setRecipient] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  
  //STATE FOR LINK GENERATION:
  const [creatorHandle, setCreatorHandle] = useState<string>("");
  const [linkRecipientAddress, setLinkRecipientAddress] = useState<string>("");
  const [defaultTipAmount, setDefaultTipAmount] = useState<string>("0.05")
  const [generatedLink, setGeneratedLink] = useState<string>("");

  //COMMON STATE:
  const [txSignature, setTxSignature] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [recentTips, setRecentTips] = useState<Tip[]>([]);

  // HANDLER FOR DIRECT TIPPING:
  const handleRecipientChange = (e: ChangeEvent<HTMLInputElement>) => {
    setRecipient(e.target.value);
  };

  // HANDLER FOR AMOUNT CHANGE:
  const handleAmountChange = (e: ChangeEvent<HTMLInputElement>) => {
    setAmount(e.target.value);
  };

  // EVENT HANDLERS FOR LINK GENERATION:
  const handleCreatorHandleChange = (e: ChangeEvent<HTMLInputElement>) => setCreatorHandle(e.target.value);
  
  const handleLinkRecipientAddressChange = (e: ChangeEvent<HTMLInputElement>) => setLinkRecipientAddress(e.target.value);

  const handleDefaultTipAmountChange = (e: ChangeEvent<HTMLInputElement>) => setDefaultTipAmount(e.target.value);

// TO LOAD RECENT TIPS:
  useEffect(() => {
    const storedTips = localStorage.getItem('recentTips');
    if (storedTips){
      try{
        const parsedTips = JSON.parse(storedTips);
        setRecentTips(parsedTips);
      }catch (e){
        console.error("Failed to parse recent tips from localStorage", e);
        localStorage.removeItem('recentTips');
      }
    }
  },[txSignature])

  const handleTip = useCallback(async () => {
    if (!connected || !publicKey) {
      setError("Please connect your wallet.");
      return;
    }
    if (!recipient || !amount) {
      setError("Please enter a recipient address and an amount.");
      return;
    }
    setError("");
    setTxSignature("");
    setLoading(true);

    try {
      const recipientPubKey = new PublicKey(recipient);
      const amountInLamports = parseFloat(amount) * LAMPORTS_PER_SOL;

      if(isNaN(amountInLamports) || amountInLamports <= 0) {
        setError("Invalid amount.Amount must be greater than 0.");
        setLoading(false);
        return;
      }

      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: recipientPubKey,
          lamports: amountInLamports,
        })
      );

      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = publicKey;

      const signature = await sendTransaction(transaction, connection);
      await connection.confirmTransaction({ signature, blockhash, lastValidBlockHeight }, 'processed');

      setTxSignature(signature);

      const newTip: Tip = {
        handle : 'Direct Tip',
        address: recipient,
        amount: amount,
        sig: signature,
        date: new Date().toLocaleString(),
      };
      const currentRecentTips: Tip[] = JSON.parse(localStorage.getItem('recentTips') || '[]');
      currentRecentTips.unshift(newTip);
      const updatedTips = currentRecentTips.slice(0, 10); // Keep only the last 10 tips
      localStorage.setItem('recentTips',JSON.stringify(updatedTips));
      setRecentTips(updatedTips);
    }catch(error: any){
      console.error("Transaction error:",error);
      let message = "Transactin failed.";
      if(error.message){
        if(error.message.includes("Invalid public key input")){
          message = "Invalid recipient Solana address.";
        }else if(error.message.toLowerCase().includes("user rejected the request")){
          message = "Transaction rejected by user.";
        }else{
          message = error.message
        }
      }
      setError(message);
    }finally{
      setLoading(false);
    }
    },[publicKey, connection, sendTransaction, recipient, amount, connected]);

  const generateLink = () => {
    if (!creatorHandle || !linkRecipientAddress || !defaultTipAmount) {
      alert("Please fill in Creator's Handle, SOL Address, and Default Amount for the link.");
      return;
    }
    try {
        new PublicKey(linkRecipientAddress); 
    } catch (e) {
        alert("Invalid Creator's SOL Address for the link.");
        return;
    }
    if (parseFloat(defaultTipAmount) <= 0) {
        alert("Default tip amount must be greater than 0.");
        return;
    }

    const params = new URLSearchParams({
      creator: creatorHandle,
      address: linkRecipientAddress,
      amount: defaultTipAmount,
    });
    const link = `${window.location.origin}/tipping-page?${params.toString()}`;
    setGeneratedLink(link);
  };

  return (
    <main className="min-h-screen bg-gray-900 text-white flex flex-col items-center p-4 sm:p-8">
      <div className="w-full max-w-md">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
          <h1 className="text-3xl font-bold text-center sm:text-left">Solana Tip Jar</h1>
          <WalletMultiButton style={{ backgroundColor: '#6366f1', minWidth: '150px' }} />
        </div>

        {connected && publicKey && (
          <div className="mb-6 p-4 bg-gray-800 rounded-lg">
            <p className="text-sm text-gray-400">Your Wallet:</p>
            <p className="text-lg break-all">{publicKey.toBase58()}</p>
          </div>
        )}

        <div className="bg-gray-800 p-6 rounded-lg shadow-xl mb-8">
          <h2 className="text-2xl font-semibold mb-4">Send a Direct Tip</h2>
          <div className="space-y-4">
            <div>
              <label htmlFor="recipient" className="block text-sm font-medium text-gray-300">
                Recipient's SOL Address
              </label>
              <input
                type="text"
                id="recipient"
                value={recipient}
                onChange={handleRecipientChange}
                placeholder="Enter recipient's Solana address"
                className="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-white"
              />
            </div>
            <div>
              <label htmlFor="amount" className="block text-sm font-medium text-gray-300">
                Amount (SOL)
              </label>
              <input
                type="number"
                id="amount"
                value={amount}
                onChange={handleAmountChange}
                placeholder="0.1"
                step="0.000000001"
                min="0"
                className="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-white"
              />
            </div>
            <button
              onClick={handleTip}
              disabled={!connected || loading || !recipient || !amount}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Sending...' : 'Send Tip'}
            </button>
          </div>
          {error && <p className="text-red-500 mt-2 text-sm">{error}</p>}
          {txSignature && (
            <div className="mt-4 text-green-400 text-sm">
              <p>Success! Transaction Signature:</p>
              <a
                href={`https://explorer.solana.com/tx/${txSignature}?cluster=devnet`}
                target="_blank"
                rel="noopener noreferrer"
                className="underline break-all"
              >
                {txSignature}
              </a>
            </div>
          )}
        </div>

        <div className="bg-gray-800 p-6 rounded-lg shadow-xl">
          <h2 className="text-2xl font-semibold mb-4">Create a Tip Link</h2>
          <p className="text-gray-400">Feature coming soon!</p>
        </div>
      </div>
    </main>
  );
}