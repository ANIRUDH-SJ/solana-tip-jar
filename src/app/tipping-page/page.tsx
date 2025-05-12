// src/app/tipping-page/page.tsx
"use client";

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation'; // To read URL query params
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { SystemProgram, Transaction, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import Link from 'next/link';

// Define the Tip interface (can be shared if moved to a types file)
interface Tip {
  handle: string;
  address: string;
  amount: string;
  sig: string;
  date: string;
}

// It's good practice to wrap components that use useSearchParams in Suspense
function TippingPageContent() {
  const searchParams = useSearchParams();
  const { connection } = useConnection();
  const { publicKey, sendTransaction, connected } = useWallet();

  const [creatorHandle, setCreatorHandle] = useState<string | null>(null);
  const [recipientAddress, setRecipientAddress] = useState<string | null>(null);
  const [tipAmountFromLink, setTipAmountFromLink] = useState<string | null>(null); // Renamed for clarity
  const [customAmount, setCustomAmount] = useState<string>(""); // For user to override default

  const [txSignature, setTxSignature] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string>("");

  useEffect(() => {
    if (searchParams) {
      const creator = searchParams.get('creator');
      const address = searchParams.get('address');
      const amount = searchParams.get('amount');

      if (creator && address && amount) {
        setCreatorHandle(creator);
        setRecipientAddress(address);
        setTipAmountFromLink(amount);
        setCustomAmount(amount); // Initialize custom amount with default from link
      } else {
        setError("Tip information missing or invalid in the link.");
      }
    }
  }, [searchParams]);

  const handleTipFromLink = useCallback(async () => {
    if (!connected || !publicKey) {
      setError("Please connect your wallet to send a tip.");
      setSuccessMessage("");
      return;
    }
    if (!recipientAddress || !customAmount || !creatorHandle) {
      setError("Creator information or amount is missing.");
      setSuccessMessage("");
      return;
    }
    setError("");
    setSuccessMessage("");
    setTxSignature("");
    setLoading(true);

    try {
      const recipientPubKey = new PublicKey(recipientAddress);
      const amountInLamports = parseFloat(customAmount) * LAMPORTS_PER_SOL;

      if (isNaN(amountInLamports) || amountInLamports <= 0) {
        setError("Invalid tip amount. Amount must be a number greater than 0.");
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
      setSuccessMessage(`Successfully tipped ${customAmount} SOL to ${creatorHandle}!`);

      // Save this tip to the tipper's local storage ("Recent Tips Sent By You" on main page)
      const newTip: Tip = {
        handle: creatorHandle!,
        address: recipientAddress!,
        amount: customAmount,
        sig: signature,
        date: new Date().toLocaleString(),
      };
      const currentRecentTips: Tip[] = JSON.parse(localStorage.getItem('solanaTipJarRecentTips') || '[]');
      currentRecentTips.unshift(newTip);
      const updatedTips = currentRecentTips.slice(0, 5);
      localStorage.setItem('solanaTipJarRecentTips', JSON.stringify(updatedTips));

      const globalTips: Tip[] = JSON.parse(localStorage.getItem('solanaTipJarGlobalLeaderboard') || '[]');
      globalTips.unshift(newTip);
      const updatedGlobalTips = globalTips.slice(0, 50);
      localStorage.setItem('solanaTipJarGlobalLeaderboard', JSON.stringify(updatedGlobalTips));

    } catch (err: unknown) { // Changed 'any' to 'unknown'
      console.error("Transaction error:", err);
      let message = "Transaction failed.";
      if (err instanceof Error) { // Type check for Error
        if (err.message.includes("Invalid public key input")) {
          message = "The creator's SOL address in the link is invalid.";
        } else if (err.message.toLowerCase().includes("user rejected the request")) {
          message = "Transaction rejected by user.";
        } else {
          message = err.message;
        }
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [publicKey, connection, sendTransaction, recipientAddress, customAmount, creatorHandle, connected]);

  if (!creatorHandle || !recipientAddress || !tipAmountFromLink) {
    // This shows if URL params are missing or during initial load before useEffect runs
    return (
      <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4">
        <h1 className="text-3xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-red-500">Solana Tip Jar</h1>
        {error ? (
            <p className="my-4 p-3 bg-red-500/20 text-red-400 border border-red-500 rounded-md text-sm">{error}</p>
        ) : (
            <p className="text-xl text-gray-400">Loading tip information...</p>
        )}
        <Link href="/" className="mt-8 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-md text-white font-medium transition-colors">
            Back to Home
        </Link>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-900 text-white flex flex-col items-center p-4 sm:p-8">
      <div className="w-full max-w-md">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
          <h1 className="text-3xl font-bold text-center sm:text-left text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-red-500">Tip Creator</h1>
          <WalletMultiButton style={{ backgroundColor: '#6366f1', minWidth: '150px' }} />
        </div>

        {connected && publicKey && (
          <div className="mb-6 p-4 bg-gray-800 rounded-lg shadow-md">
            <p className="text-sm text-gray-400">Your Wallet:</p>
            <p className="text-lg break-all font-mono">{publicKey.toBase58()}</p>
          </div>
        )}

        {/* Universal messages for this page */}
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

        {!successMessage && ( // Hide form after successful tip to prevent accidental re-tipping
          <div className="bg-gray-800 p-6 rounded-lg shadow-xl">
            <h2 className="text-2xl font-semibold mb-1">You are tipping:</h2>
            <p className="text-xl text-indigo-400 font-bold mb-1">{creatorHandle}</p>
            <p className="text-xs text-gray-400 mb-4 break-all">SOL Address: {recipientAddress}</p>

            <div className="space-y-4">
              <div>
                <label htmlFor="customAmount" className="block text-sm font-medium text-gray-300">
                  Amount (SOL)
                </label>
                <input
                  type="number"
                  id="customAmount"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  placeholder={tipAmountFromLink} // Show default amount from link as placeholder
                  step="0.000000001"
                  min="0.000000001"
                  className="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-white placeholder-gray-500"
                />
              </div>
              <button
                onClick={handleTipFromLink}
                disabled={!connected || loading || !customAmount || parseFloat(customAmount) <= 0}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Sending Tip...' : `Tip ${customAmount || '0'} SOL`}
              </button>
            </div>
          </div>
        )}

        <Link href="/" className="mt-8 block text-center px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-md text-white font-medium transition-colors">
            Back to Home
        </Link>
      </div>
    </main>
  );
}

// Wrap the main content with Suspense for useSearchParams
export default function TippingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-900 text-white flex items-center justify-center text-xl">Loading Tip Page...</div>}>
      <TippingPageContent />
    </Suspense>
  );
}