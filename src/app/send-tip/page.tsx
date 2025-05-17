// src/app/send-tip/page.tsx
"use client";

import { useState, useCallback, ChangeEvent, useEffect } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { SystemProgram, Transaction, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { MemoProgram } from '@solana/spl-memo';
import Link from 'next/link';
import { ArrowPathIcon, PaperAirplaneIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import type { Tip } from '../types'; // Assuming types.ts is in src/app/

export default function SendTipPage() {
  const { connection } = useConnection();
  const { publicKey, sendTransaction, connected } = useWallet();
  const [hasMounted, setHasMounted] = useState(false);

  const [recipient, setRecipient] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [message, setMessage] = useState<string>("");

  const [txSignature, setTxSignature] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string>("");

  useEffect(() => { setHasMounted(true); }, []);

  const handleRecipientChange = (e: ChangeEvent<HTMLInputElement>) => setRecipient(e.target.value);
  const handleAmountChange = (e: ChangeEvent<HTMLInputElement>) => setAmount(e.target.value);
  const handleMessageChange = (e: ChangeEvent<HTMLTextAreaElement>) => setMessage(e.target.value);

  const handleSendTip = useCallback(async () => {
    if (!connected || !publicKey) { setError("Please connect your wallet to send a tip."); return; }
    if (!recipient.trim() || !amount.trim()) { setError("Recipient address and amount are required."); return; }
    setLoading(true); setError(""); setSuccessMessage(""); setTxSignature("");

    try {
      const recipientPubKey = new PublicKey(recipient.trim());
      const amountInLamports = parseFloat(amount.trim()) * LAMPORTS_PER_SOL;

      if (isNaN(amountInLamports) || amountInLamports <= 0) {
        setError("Invalid tip amount. Amount must be a number greater than 0.");
        setLoading(false); return;
      }

      const transaction = new Transaction().add(
        SystemProgram.transfer({ fromPubkey: publicKey, toPubkey: recipientPubKey, lamports: amountInLamports })
      );

      if (message.trim()) {
        transaction.add(MemoProgram.write(publicKey, message.trim()));
      }

      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash; transaction.feePayer = publicKey;

      const signature = await sendTransaction(transaction, connection);
      await connection.confirmTransaction({ signature, blockhash, lastValidBlockHeight }, 'processed');

      setTxSignature(signature);
      setSuccessMessage(`Successfully tipped ${amount.trim()} SOL to ${recipient.trim().substring(0,6)}...! ${message.trim() ? "Your message was included." : ""}`);

      const newTip: Tip = {
        handle: `User (${recipient.trim().substring(0, 4)}...)`, // Generic handle for direct tips
        address: recipient.trim(),
        amount: amount.trim(),
        sig: signature,
        date: new Date().toLocaleString(),
        message: message.trim() || undefined,
      };

      // Update user's sent tips in localStorage
      const userTipsKey = 'solanaTipJarRecentTips';
      const userTips: Tip[] = JSON.parse(localStorage.getItem(userTipsKey) || '[]');
      userTips.unshift(newTip);
      localStorage.setItem(userTipsKey, JSON.stringify(userTips.slice(0, 10)));

      // Update global leaderboard data in localStorage
      const globalTipsKey = 'solanaTipJarGlobalLeaderboard';
      const globalTips: Tip[] = JSON.parse(localStorage.getItem(globalTipsKey) || '[]');
      globalTips.unshift(newTip);
      localStorage.setItem(globalTipsKey, JSON.stringify(globalTips.slice(0, 50)));
      window.dispatchEvent(new StorageEvent('storage', { key: globalTipsKey })); // Notify other components

      // Clear form on success
      setRecipient(""); setAmount(""); setMessage("");

    } catch (err: any) {
      let errMsg = "Transaction failed.";
      if (err.message?.includes("Invalid public key")) errMsg = "Invalid recipient SOL address.";
      else if (err.message?.toLowerCase().includes("user rejected")) errMsg = "Transaction rejected by user.";
      else if (err.message?.includes("Transaction memo too large")) errMsg = "Your message is too long (max ~200 chars). Please shorten it.";
      else errMsg = err.message || errMsg;
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  }, [connected, publicKey, connection, sendTransaction, recipient, amount, message]);

  if (!hasMounted) {
    return <div className="min-h-screen bg-gray-900 flex items-center justify-center text-xl text-gray-400 animate-pulse">Initializing Send Tip Page...</div>;
  }

  return (
    <main className="min-h-screen bg-gray-900 text-gray-100 flex flex-col items-center p-4 sm:p-6 md:p-8">
      <div className="w-full max-w-lg space-y-8">
        <header className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <Link href="/" className="flex items-center gap-3 group">
            <svg className="h-8 w-8 text-purple-400 group-hover:text-purple-300 transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"> <path d="M12 2L2 7l10 5 10-5-10-5z"></path><path d="M2 17l10 5 10-5"></path><path d="M2 12l10 5 10-5"></path> </svg>
            <h1 className="text-2xl sm:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-400 to-red-400 group-hover:opacity-80 transition-opacity tracking-tight">
              Send a Direct Tip
            </h1>
          </Link>
          <WalletMultiButton />
        </header>

        {!connected && (
            <div className="text-center py-8 bg-gray-800/50 rounded-lg shadow-xl animate-fadeIn">
                <InformationCircleIcon className="h-12 w-12 text-indigo-400 mx-auto mb-4" />
                <p className="text-gray-300 max-w-md mx-auto">Please connect your wallet to send a direct tip.</p>
            </div>
        )}

        {error && <p className="app-message-error animate-fadeIn">{error}</p>}
        {successMessage && <p className="app-message-success animate-fadeIn">{successMessage}</p>}
        {txSignature && !error && (
          <div className="my-2 p-3 bg-blue-700/30 text-blue-300 border border-blue-600 rounded-md text-sm animate-fadeIn">
            <p className="font-semibold">Transaction Confirmed!</p>
            <a href={`https://explorer.solana.com/tx/${txSignature}?cluster=devnet`} target="_blank" rel="noopener noreferrer" className="underline break-all text-xs hover:text-blue-200">
              View on Explorer: {txSignature.substring(0,15)}...
            </a>
          </div>
        )}

        {connected && (
            <div className="bg-gray-800 p-6 sm:p-8 rounded-xl shadow-2xl ring-1 ring-gray-700/50 animate-fadeIn">
            <p className="text-gray-300 mb-6 text-sm">
                Directly send SOL to any Solana address with an optional on-chain message.
            </p>
            <div className="space-y-5">
                <div>
                <label htmlFor="recipient" className="app-label">Recipient's SOL Address</label>
                <input type="text" id="recipient" value={recipient} onChange={handleRecipientChange} placeholder="Enter SOL address (e.g., 5oxo...)" className="mt-1 app-input"/>
                </div>
                <div>
                <label htmlFor="amount" className="app-label">Amount (SOL)</label>
                <input type="number" id="amount" value={amount} onChange={handleAmountChange} step="0.001" min="0.000000001" placeholder="0.1" className="mt-1 app-input"/>
                </div>
                <div>
                <label htmlFor="directTipMessage" className="app-label">Optional Message (publicly visible on-chain)</label>
                <textarea id="directTipMessage" value={message} onChange={handleMessageChange} rows={3} maxLength={200} placeholder="Say thanks or leave a note! (max ~200 chars)" className="mt-1 app-input text-sm !py-2"/>
                <p className="text-xs text-gray-500 mt-1 text-right">{message.length}/200</p>
                </div>
                <button onClick={handleSendTip} disabled={loading || !recipient || !amount} className="w-full app-button-indigo !font-bold !py-3 disabled:opacity-60">
                {loading ? ( <ArrowPathIcon className="animate-spin h-5 w-5 mx-auto"/> ) : <><PaperAirplaneIcon className="h-5 w-5 mr-2" />Send Tip</>}
                </button>
            </div>
            </div>
        )}
        <div className="text-center mt-8">
            <Link href="/app" className="app-button-gray !font-normal !py-2 !px-6">
                Back to App Hub
            </Link>
        </div>
      </div>
    </main>
  );
}