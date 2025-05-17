// src/app/tipping-page/page.tsx
"use client";

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { SystemProgram, Transaction, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import Link from 'next/link';
import Image from 'next/image';
import type { Tip } from '../types';

function TippingPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { connection } = useConnection();
  const { publicKey, sendTransaction, connected } = useWallet();

  const [creatorHandle, setCreatorHandle] = useState<string | null>(null);
  const [recipientAddress, setRecipientAddress] = useState<string | null>(null);
  const [tipAmountFromLink, setTipAmountFromLink] = useState<string | null>(null);
  const [customAmount, setCustomAmount] = useState<string>("");
  const [creatorPfpFromLink, setCreatorPfpFromLink] = useState<string | null>(null);
  const [tipMessage, setTipMessage] = useState<string>("");

  const [txSignature, setTxSignature] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string>("");

  useEffect(() => {
    if (searchParams) {
      const creator = searchParams.get('creator');
      const address = searchParams.get('address');
      const amount = searchParams.get('amount');
      const pfp = searchParams.get('pfp');
      if (creator && address && amount) {
        try {
            new PublicKey(address);
            setCreatorHandle(creator); setRecipientAddress(address);
            setTipAmountFromLink(amount); setCustomAmount(amount);
            if (pfp) setCreatorPfpFromLink(pfp);
            setError("");
        } catch (e) { setError("Invalid creator address in the link."); }
      } else { setError("Tip information missing or invalid in the link."); }
    }
  }, [searchParams]);

  const handleTipFromLink = useCallback(async () => {
    if (!connected || !publicKey) { setError("Please connect your wallet."); return; }
    if (!recipientAddress || !customAmount || !creatorHandle) { setError("Creator/amount info missing."); return; }
    setLoading(true); setError(""); setSuccessMessage(""); setTxSignature("");

    try {
      const recipientPubKey = new PublicKey(recipientAddress);
      const amountInLamports = parseFloat(customAmount) * LAMPORTS_PER_SOL;
      if (isNaN(amountInLamports) || amountInLamports <= 0) { setError("Invalid tip amount."); setLoading(false); return; }

      const transaction = new Transaction().add(
        SystemProgram.transfer({ fromPubkey: publicKey, toPubkey: recipientPubKey, lamports: amountInLamports })
      );

      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash; transaction.feePayer = publicKey;
      const signature = await sendTransaction(transaction, connection);
      await connection.confirmTransaction({ signature, blockhash, lastValidBlockHeight }, 'processed');

      setTxSignature(signature);
      setSuccessMessage(`Successfully tipped ${customAmount} SOL to ${creatorHandle}! ${tipMessage.trim() ? "Your message has been sent." : ""}`);

      const newTip: Tip = {
        handle: creatorHandle, address: recipientAddress, amount: customAmount,
        sig: signature, date: new Date().toLocaleString(),
        message: tipMessage.trim() || undefined,
      };
      const S_USER_TIPS = 'solanaTipJarRecentTips';
      const userTips: Tip[] = JSON.parse(localStorage.getItem(S_USER_TIPS) || '[]');
      userTips.unshift(newTip); localStorage.setItem(S_USER_TIPS, JSON.stringify(userTips.slice(0, 10)));
      const S_GLOBAL_TIPS = 'solanaTipJarGlobalLeaderboard';
      const globalTips: Tip[] = JSON.parse(localStorage.getItem(S_GLOBAL_TIPS) || '[]');
      globalTips.unshift(newTip); localStorage.setItem(S_GLOBAL_TIPS, JSON.stringify(globalTips.slice(0, 50)));
      window.dispatchEvent(new StorageEvent('storage', { key: S_GLOBAL_TIPS }));
      setTipMessage("");

    } catch (err: any) {
      let message = "Transaction failed.";
      if (err.message?.includes("Invalid public key")) message = "Creator's SOL address in link is invalid.";
      else if (err.message?.toLowerCase().includes("user rejected")) message = "Transaction rejected by user.";
      else if (err.message?.includes("Transaction memo too large")) message = "Your message is too long. Please keep it under 200 characters.";
      else message = err.message || message;
      setError(message);
    } finally { setLoading(false); }
  }, [publicKey, connection, sendTransaction, recipientAddress, customAmount, creatorHandle, connected, tipMessage]);

  const isLoadingOrErrorState = (!creatorHandle || !recipientAddress || !tipAmountFromLink) && !successMessage;
  if (isLoadingOrErrorState && error) {
  }
  if (isLoadingOrErrorState && !error) {
  }


  return (
    <main className="min-h-screen bg-gray-900 text-white flex flex-col items-center p-4 sm:p-6 md:p-8">
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <Link href="/" className="text-3xl font-bold text-center sm:text-left text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-red-400 hover:opacity-80 transition-opacity">
            Solana Tip Jar
          </Link>
          <WalletMultiButton className="!bg-indigo-600 hover:!bg-indigo-500 !font-semibold" />
        </div>

        {error && !successMessage && <p className="app-message-error animate-fadeIn">{error}</p>}
        {successMessage && <p className="app-message-success animate-fadeIn">{successMessage}</p>}
        {txSignature && !error && (
          <div className="my-2 p-3 bg-blue-700/30 text-blue-300 border border-blue-600 rounded-md text-sm animate-fadeIn">
            <p className="font-semibold">Transaction Confirmed!</p>
            <a href={`https://explorer.solana.com/tx/${txSignature}?cluster=devnet`} target="_blank" rel="noopener noreferrer" className="underline break-all text-xs hover:text-blue-200">{txSignature}</a>
          </div>
        )}

        {!successMessage && creatorHandle && recipientAddress && (
          <div className="bg-gray-800 p-6 sm:p-8 rounded-lg shadow-xl text-center space-y-5 animate-fadeIn">
            {creatorPfpFromLink && (
              <Image src={creatorPfpFromLink} alt={creatorHandle} width={100} height={100} className="rounded-full object-cover mx-auto border-2 border-indigo-500 shadow-lg" onError={() => console.warn("PFP load error")}/>
            )}
            <h2 className="text-2xl sm:text-3xl font-semibold pt-2">You are tipping: <br className="sm:hidden"/><span className="text-indigo-400">{creatorHandle}</span></h2>
            <p className="text-xs text-gray-400 break-all -mt-3">SOL Address: {recipientAddress}</p>
            
            <div className="space-y-4 pt-2">
              <div>
                <label htmlFor="customAmount" className="app-label mb-1.5">Amount (SOL)</label>
                <input type="number" id="customAmount" value={customAmount} onChange={(e) => setCustomAmount(e.target.value)} placeholder={tipAmountFromLink || "0.05"} step="0.000000001" min="0.000000001" className="app-input text-center text-lg !py-3"/>
              </div>

              <div>
                <label htmlFor="tipMessage" className="app-label mb-1.5">Optional Message (publicly visible on-chain)</label>
                <textarea
                  id="tipMessage"
                  value={tipMessage}
                  onChange={(e) => setTipMessage(e.target.value)}
                  rows={3}
                  maxLength={200}
                  placeholder="Say thanks or leave a note!"
                  className="app-input text-sm !py-2"
                />
                <p className="text-xs text-gray-500 mt-1 text-right">{tipMessage.length}/200 characters</p>
              </div>

              <button onClick={handleTipFromLink} disabled={!connected || loading || !customAmount || parseFloat(customAmount) <= 0} className="w-full app-button-indigo !text-base !font-bold !py-3 disabled:opacity-60">
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Sending...
                  </span>
                ) : `Tip ${customAmount || '0'} SOL`}
              </button>
            </div>
          </div>
        )}
        {(successMessage || (error && isLoadingOrErrorState)) && (
          <Link href="/" className="text-indigo-400 hover:text-indigo-300 text-center block mt-4">
            ← Back to App
          </Link>
        )}
      </div>
      <style jsx global>{`
        .app-label { @apply block text-sm font-medium text-gray-300; }
        .app-input { @apply block w-full px-3.5 py-2.5 bg-gray-700 border border-gray-600 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent sm:text-sm text-white transition-colors duration-150; }
        .app-button-indigo { @apply inline-flex items-center justify-center py-2.5 px-5 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-indigo-500 transition-all duration-150 ease-in-out; }
        .app-message-error { @apply my-2 p-3 bg-red-700/30 text-red-300 border border-red-600 rounded-md text-sm; }
        .app-message-success { @apply my-2 p-3 bg-green-700/30 text-green-300 border border-green-600 rounded-md text-sm; }
      `}</style>
    </main>
  );
}

export default function TippingPage() {
  return ( <Suspense fallback={ <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4 text-center"> <Link href="/" className="text-3xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 hover:opacity-80 transition-opacity">Solana Tip Jar</Link> <p className="text-xl text-gray-400 animate-pulse">Loading Tip Page...</p> </div> }> <TippingPageContent /> </Suspense> );
}