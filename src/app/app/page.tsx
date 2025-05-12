// src/app/page.tsx
"use client";

import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { SystemProgram, Transaction, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { useState, useCallback, ChangeEvent, useEffect } from 'react';
import Leaderboard from '../components/Leaderboard'; // Ensure this path is correct

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

  const [recipient, setRecipient] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [creatorHandle, setCreatorHandle] = useState<string>("");
  const [linkRecipientAddress, setLinkRecipientAddress] = useState<string>("");
  const [defaultTipAmount, setDefaultTipAmount] = useState<string>("0.05");
  const [generatedLink, setGeneratedLink] = useState<string>("");

  const [txSignature, setTxSignature] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string>("");
  const [recentTips, setRecentTips] = useState<Tip[]>([]);

  const handleRecipientChange = (e: ChangeEvent<HTMLInputElement>) => setRecipient(e.target.value);
  const handleAmountChange = (e: ChangeEvent<HTMLInputElement>) => setAmount(e.target.value);
  const handleCreatorHandleChange = (e: ChangeEvent<HTMLInputElement>) => setCreatorHandle(e.target.value);
  const handleLinkRecipientAddressChange = (e: ChangeEvent<HTMLInputElement>) => setLinkRecipientAddress(e.target.value);
  const handleDefaultTipAmountChange = (e: ChangeEvent<HTMLInputElement>) => setDefaultTipAmount(e.target.value);

  useEffect(() => {
    const storedUserTips = localStorage.getItem('solanaTipJarRecentTips');
    if (storedUserTips) {
      try {
        setRecentTips(JSON.parse(storedUserTips));
      } catch (e) {
        console.error("Failed to parse user recent tips from localStorage", e);
        localStorage.removeItem('solanaTipJarRecentTips');
      }
    }
    // This effect is for user's own recent tips. Leaderboard has its own useEffect.
  }, []);

  const commonTipLogic = useCallback(async (
    toAddress: string,
    tipAmountSOL: string,
    creatorDisplayName: string
  ) => {
    if (!connected || !publicKey) {
      setError("Please connect your wallet.");
      setSuccessMessage("");
      return false;
    }
    setError("");
    setSuccessMessage("");
    setTxSignature("");
    setLoading(true);

    try {
      const recipientPubKey = new PublicKey(toAddress);
      const amountInLamports = parseFloat(tipAmountSOL) * LAMPORTS_PER_SOL;

      if (isNaN(amountInLamports) || amountInLamports <= 0) {
        setError("Invalid amount. Amount must be a number greater than 0.");
        setLoading(false);
        return false;
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
      setSuccessMessage(`Successfully tipped ${tipAmountSOL} SOL to ${creatorDisplayName || toAddress}!`);

      const newTip: Tip = {
        handle: creatorDisplayName,
        address: toAddress,
        amount: tipAmountSOL,
        sig: signature,
        date: new Date().toLocaleString(),
      };

      // 1. Update "Recent Tips Sent By You" (user-specific)
      const currentUserRecentTips: Tip[] = JSON.parse(localStorage.getItem('solanaTipJarRecentTips') || '[]');
      currentUserRecentTips.unshift(newTip);
      const updatedUserTips = currentUserRecentTips.slice(0, 5);
      localStorage.setItem('solanaTipJarRecentTips', JSON.stringify(updatedUserTips));
      setRecentTips(updatedUserTips);

      // 2. Update "Global Leaderboard" data
      const globalTips: Tip[] = JSON.parse(localStorage.getItem('solanaTipJarGlobalLeaderboard') || '[]');
      globalTips.unshift(newTip);
      const updatedGlobalTips = globalTips.slice(0, 50);
      localStorage.setItem('solanaTipJarGlobalLeaderboard', JSON.stringify(updatedGlobalTips));
      
      // Dispatch a storage event so Leaderboard component can update if it's listening
      // This is a more robust way to trigger updates across components than relying on txSignature change.
      window.dispatchEvent(new StorageEvent('storage', { key: 'solanaTipJarGlobalLeaderboard' }));

      return true;

    } catch (err: unknown) { // Changed 'any' to 'unknown'
      console.error("Transaction error:", err);
      let message = "Transaction failed.";
      if (err instanceof Error) { // Type check for Error
        if (err.message.includes("Invalid public key input")) {
          message = "Invalid recipient Solana address.";
        } else if (err.message.toLowerCase().includes("user rejected the request")) {
          message = "Transaction rejected by user.";
        } else {
          message = err.message;
        }
      }
      setError(message);
      return false;
    } finally {
      setLoading(false);
    }
  }, [connected, publicKey, connection, sendTransaction, setError, setSuccessMessage, setTxSignature, setLoading, setRecentTips]);

  const handleDirectTip = useCallback(async () => {
    if (!recipient || !amount) {
      setError("Please enter a recipient address and an amount for direct tip.");
      setSuccessMessage("");
      return;
    }
    const success = await commonTipLogic(recipient, amount, "Direct Tip");
    if (success) {
      setRecipient("");
      setAmount("");
    }
  }, [commonTipLogic, recipient, amount]);

  const generateLink = () => {
    setError("");
    setSuccessMessage("");
    setGeneratedLink("");

    if (!creatorHandle || !linkRecipientAddress || !defaultTipAmount) {
      setError("Please fill in Creator's Handle/Name, their SOL Address, and Default Tip Amount for the link.");
      return;
    }
    try {
      new PublicKey(linkRecipientAddress);
    } catch { // Removed unused 'e' variable
      setError("Invalid Creator's SOL Address for the link. Please enter a valid Solana public key.");
      return;
    }
    if (isNaN(parseFloat(defaultTipAmount)) || parseFloat(defaultTipAmount) <= 0) {
      setError("Default tip amount must be a number greater than 0.");
      return;
    }

    const params = new URLSearchParams({
      creator: creatorHandle,
      address: linkRecipientAddress,
      amount: defaultTipAmount,
    });
    const link = `${window.location.origin}/tipping-page?${params.toString()}`;
    setGeneratedLink(link);
    setSuccessMessage("Tip link generated successfully!");
  };

  const copyToClipboard = () => {
    if (generatedLink) {
      navigator.clipboard.writeText(generatedLink)
        .then(() => {
          setSuccessMessage("Link copied to clipboard!");
          setError("");
        })
        .catch(err => { // Removed unused 'e' variable, err is conventional
          console.error('Failed to copy: ', err);
          setError("Failed to copy link.");
          setSuccessMessage("");
        });
    }
  };

  // --- START OF THE RETURN STATEMENT ---
  return (
    <main className="min-h-screen bg-gray-900 text-white flex flex-col items-center p-4 sm:p-8">
      <div className="w-full max-w-2xl"> {/* Container for all content */}
        
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
          <h1 className="text-4xl font-bold text-center sm:text-left bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-500 to-red-500">
            Solana Tip Jar
          </h1>
          <WalletMultiButton style={{ backgroundColor: '#6366f1', minWidth: '150px' }} />
        </div>

        {/* Connected Wallet Information */}
        {connected && publicKey && (
          <div className="mb-6 p-4 bg-gray-800 rounded-lg shadow-md">
            <p className="text-sm text-gray-400">Your Wallet:</p>
            <p className="text-lg break-all font-mono">{publicKey.toBase58()}</p>
          </div>
        )}

        {/* Universal Messages: Error, Success, Transaction Signature */}
        {error && <p className="my-4 p-3 bg-red-500/20 text-red-400 border border-red-500 rounded-md text-sm animate-fadeIn">{error}</p>}
        {successMessage && <p className="my-4 p-3 bg-green-500/20 text-green-400 border border-green-500 rounded-md text-sm animate-fadeIn">{successMessage}</p>}
        {txSignature && !error && (
          <div className="my-4 p-3 bg-blue-500/20 text-blue-300 border border-blue-500 rounded-md text-sm animate-fadeIn">
            <p>Transaction Confirmed! Signature:</p>
            <a
              href={`https://explorer.solana.com/tx/${txSignature}?cluster=devnet`}
              target="_blank"
              rel="noopener noreferrer"
              className="underline break-all hover:text-blue-200"
            >
              {txSignature}
            </a>
          </div>
        )}

        {/* Forms Section: Direct Tip & Create Tip Link */}
        <div className="grid md:grid-cols-2 gap-8 mb-8">
          {/* Direct Tipping Form */}
          <div className="bg-gray-800 p-6 rounded-lg shadow-xl">
            <h2 className="text-2xl font-semibold mb-4">Send a Direct Tip</h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="recipient" className="block text-sm font-medium text-gray-300">
                  Recipient&apos;s SOL Address
                </label>
                <input
                  type="text"
                  id="recipient"
                  value={recipient}
                  onChange={handleRecipientChange}
                  placeholder="Enter recipient's Solana address"
                  className="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-white placeholder-gray-500"
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
                  min="0.000000001"
                  className="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-white placeholder-gray-500"
                />
              </div>
              <button
                onClick={handleDirectTip}
                disabled={!connected || loading || !recipient || !amount}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Sending...' : 'Send Tip'}
              </button>
            </div>
          </div>

          {/* Create Tip Link Form */}
          <div className="bg-gray-800 p-6 rounded-lg shadow-xl">
            <h2 className="text-2xl font-semibold mb-4">Create a Tip Link</h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="creatorHandle" className="block text-sm font-medium text-gray-300">
                  Creator&apos;s Handle/Name (e.g., @username)
                </label>
                <input
                  type="text"
                  id="creatorHandle"
                  value={creatorHandle}
                  onChange={handleCreatorHandleChange}
                  placeholder="@elonmusk or Elon Musk"
                  className="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-white placeholder-gray-500"
                />
              </div>
              <div>
                <label htmlFor="linkRecipientAddress" className="block text-sm font-medium text-gray-300">
                  Creator&apos;s SOL Address
                </label>
                <input
                  type="text"
                  id="linkRecipientAddress"
                  value={linkRecipientAddress}
                  onChange={handleLinkRecipientAddressChange}
                  placeholder="Creator's Solana wallet address"
                  className="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-white placeholder-gray-500"
                />
              </div>
              <div>
                <label htmlFor="defaultTipAmount" className="block text-sm font-medium text-gray-300">
                  Default Tip Amount (SOL)
                </label>
                <input
                  type="number"
                  id="defaultTipAmount"
                  value={defaultTipAmount}
                  onChange={handleDefaultTipAmountChange}
                  placeholder="0.05"
                  step="0.000000001"
                  min="0.000000001"
                  className="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-white placeholder-gray-500"
                />
              </div>
              <button
                onClick={generateLink}
                disabled={loading || !linkRecipientAddress || !creatorHandle || !defaultTipAmount}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Generate Tip Link
              </button>
              {generatedLink && (
                <div className="mt-4 p-3 bg-gray-700 rounded-md">
                  <p className="text-sm text-gray-300 mb-1">Your generated tip link:</p>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={generatedLink}
                      className="flex-grow p-2 bg-gray-600 text-white rounded-md text-xs break-all"
                      onClick={(e) => (e.target as HTMLInputElement).select()}
                    />
                    <button
                      onClick={copyToClipboard}
                      className="px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white text-xs font-medium rounded-md transition-colors"
                      title="Copy to Clipboard"
                    >
                      Copy
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div> {/* End of Forms Grid */}

        {/* Leaderboard Section */}
        <div className="bg-gray-800 p-6 rounded-lg shadow-xl mt-12">
          <h2 className="text-3xl font-semibold mb-6 text-center">
            <span role="img" aria-label="trophy" className="mr-2">🏆</span>
            Top Tipped Creators
            <span role="img" aria-label="trophy" className="ml-2">🏆</span>
          </h2>
          <Leaderboard /> {/* The Leaderboard component is rendered here */}
        </div>

        {/* Recent Tips Sent By You Section */}
        <div className="bg-gray-800 p-6 rounded-lg shadow-xl mt-8 mb-8"> {/* Added mb-8 for spacing at bottom */}
          <h2 className="text-2xl font-semibold mb-4">Recent Tips Sent By You</h2>
          {recentTips.length > 0 ? (
            <ul className="space-y-3">
              {recentTips.map((tip, index) => (
                <li key={tip.sig + index} className="p-3 bg-gray-700 rounded-md text-sm shadow">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold">
                        To: <span className="font-normal text-indigo-300">{tip.handle === 'Direct Tip' ? 'Direct Address' : tip.handle}</span>
                      </p>
                      {tip.handle !== 'Direct Tip' && <p className="text-xs text-gray-400">({tip.address})</p>}
                    </div>
                    <p className="text-lg font-bold text-green-400">{tip.amount} SOL</p>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Date: {tip.date}</p>
                  <p className="text-xs text-gray-500 mt-1 truncate">
                    Signature: {' '}
                    <a
                      href={`https://explorer.solana.com/tx/${tip.sig}?cluster=devnet`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 underline"
                    >
                      View on Explorer
                    </a>
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-400">No tips sent from this browser yet. Send one to see it here!</p>
          )}
        </div>

      </div> {/* End of w-full max-w-2xl container */}
    </main>
  );
  // --- END OF THE RETURN STATEMENT ---
}