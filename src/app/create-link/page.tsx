// src/app/create-link/page.tsx
"use client";

import { useState, useCallback, ChangeEvent, useEffect } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { PublicKey } from '@solana/web3.js';
import Link from 'next/link';
import { ClipboardDocumentIcon, QrCodeIcon as QrCodeOutlineIcon } from '@heroicons/react/24/outline';
import { QRCodeSVG } from 'qrcode.react';
import type { CreatorProfile } from '../types';

export default function CreateLinkPage() {
  const { publicKey, connected } = useWallet();
  const [hasMounted, setHasMounted] = useState(false);

  const [creatorHandle, setCreatorHandle] = useState<string>("");
  const [linkRecipientAddress, setLinkRecipientAddress] = useState<string>("");
  const [defaultTipAmount, setDefaultTipAmount] = useState<string>("0.05");
  const [generatedLink, setGeneratedLink] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string>("");
  const [creatorPfpForQr, setCreatorPfpForQr] = useState<string | undefined>(undefined);

  useEffect(() => { setHasMounted(true); }, []);

  useEffect(() => {
    if (hasMounted && connected && publicKey) {
      if (!linkRecipientAddress) setLinkRecipientAddress(publicKey.toBase58());
      const profileKey = `creatorProfile_${publicKey.toBase58()}`;
      const existingProfileJson = localStorage.getItem(profileKey);
      if (existingProfileJson) {
        try {
          const profile: CreatorProfile = JSON.parse(existingProfileJson);
          if (!creatorHandle.trim()) setCreatorHandle(profile.username || profile.displayName);
          setCreatorPfpForQr(profile.profilePictureUrl);
        } catch (e) { console.error("Error parsing profile", e); }
      } else {
         if (!creatorHandle.trim()) setCreatorHandle(publicKey.toBase58().substring(0,6) + "...");
      }
    }
  }, [hasMounted, connected, publicKey, linkRecipientAddress, creatorHandle]);

  const handleCreatorHandleChange = (e: ChangeEvent<HTMLInputElement>) => setCreatorHandle(e.target.value);
  const handleLinkRecipientAddressChange = (e: ChangeEvent<HTMLInputElement>) => setLinkRecipientAddress(e.target.value);
  const handleDefaultTipAmountChange = (e: ChangeEvent<HTMLInputElement>) => setDefaultTipAmount(e.target.value);

  const generateLinkAction = () => {
    setError(""); setSuccessMessage(""); setGeneratedLink("");
    const handle = creatorHandle.trim();
    const recipientAddr = linkRecipientAddress.trim();
    if (!handle || !recipientAddr || !defaultTipAmount) { setError("All fields are required."); return; }
    try { new PublicKey(recipientAddr); }
    catch (e) { setError("Invalid Recipient SOL Address."); return; }
    if (isNaN(parseFloat(defaultTipAmount)) || parseFloat(defaultTipAmount) <= 0) { setError("Default tip amount must be > 0."); return; }
    const params = new URLSearchParams({ creator: handle, address: recipientAddr, amount: defaultTipAmount });
    if (creatorPfpForQr) params.append('pfp', creatorPfpForQr);
    const link = `${window.location.origin}/tipping-page?${params.toString()}`;
    setGeneratedLink(link);
    setSuccessMessage("Tip link generated! Copy and share it, or use the QR code.");
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(
      () => setSuccessMessage("Link copied to clipboard!"), () => setError("Failed to copy link.")
    );
  };

  if (!hasMounted) {
    return <div className="min-h-screen bg-gray-900 flex items-center justify-center text-xl text-gray-400 animate-pulse">Initializing...</div>;
  }

  return (
    <main className="min-h-screen bg-gray-900 text-gray-100 flex flex-col items-center p-4 sm:p-6 md:p-8">
      <div className="w-full max-w-xl space-y-8">
        <header className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <Link href="/" className="flex items-center gap-3 group">
            <svg className="h-8 w-8 text-purple-400 group-hover:text-purple-300 transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"> <path d="M12 2L2 7l10 5 10-5-10-5z"></path><path d="M2 17l10 5 10-5"></path><path d="M2 12l10 5 10-5"></path> </svg>
            <h1 className="text-2xl sm:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-400 to-red-400 group-hover:opacity-80 transition-opacity tracking-tight">
              Create Tip Link
            </h1>
          </Link>
          <WalletMultiButton />
        </header>

        {error && <p className="app-message-error animate-fadeIn">{error}</p>}
        {successMessage && <p className="app-message-success animate-fadeIn">{successMessage}</p>}

        <div className="bg-gray-800 p-6 sm:p-8 rounded-xl shadow-2xl ring-1 ring-gray-700/50">
          <p className="text-gray-300 mb-6 text-center sm:text-left">Generate a unique link for your fans to easily tip you SOL.
            {connected && publicKey && !linkRecipientAddress && <span className="block text-xs text-indigo-300 mt-1">Your connected wallet address will be pre-filled.</span>}
          </p>
          <div className="space-y-5">
            <div><label htmlFor="creatorHandle" className="app-label">Your Handle/Name (for this link)</label><input type="text" id="creatorHandle" value={creatorHandle} onChange={handleCreatorHandleChange} placeholder="e.g., My Awesome Stream" className="mt-1 app-input"/></div>
            <div><label htmlFor="linkRecipientAddress" className="app-label">Recipient SOL Address (Where tips go)</label><input type="text" id="linkRecipientAddress" value={linkRecipientAddress} onChange={handleLinkRecipientAddressChange} placeholder="Paste SOL address or connect wallet" className="mt-1 app-input"/>
               {connected && publicKey && linkRecipientAddress !== publicKey.toBase58() && ( <button onClick={() => setLinkRecipientAddress(publicKey.toBase58())} className="text-xs text-indigo-400 hover:text-indigo-300 mt-1.5"> Use my connected wallet address </button> )}
            </div>
            <div><label htmlFor="defaultTipAmount" className="app-label">Default Tip Amount (SOL)</label><input type="number" id="defaultTipAmount" value={defaultTipAmount} onChange={handleDefaultTipAmountChange} step="0.001" min="0.000000001" placeholder="0.05" className="mt-1 app-input"/></div>
            <button onClick={generateLinkAction} disabled={!(linkRecipientAddress && creatorHandle && defaultTipAmount)} className="w-full app-button-green !font-bold !py-3 disabled:opacity-60"><QrCodeOutlineIcon className="h-5 w-5 mr-2"/> Generate Link & QR Code</button>
            {generatedLink && (
              <div className="mt-8 p-4 bg-gray-700/80 rounded-lg space-y-4 border border-gray-600/50">
                <p className="text-sm text-gray-200 font-medium">Your Tip Link is Ready!</p>
                <div className="flex items-center gap-2"> <input type="text" readOnly value={generatedLink} className="flex-grow p-2.5 bg-gray-600 text-white rounded-md text-xs break-all" onClick={(e) => (e.target as HTMLInputElement).select()} /> <button onClick={() => copyToClipboard(generatedLink)} className="app-button-indigo !py-2 !px-3 !text-xs !font-medium flex-shrink-0"><ClipboardDocumentIcon className="h-4 w-4 mr-1.5"/>Copy</button> </div>
                <div className="text-center mt-4"> <p className="text-sm text-gray-300 mb-2">Or share this QR Code:</p> <div className="bg-white p-3 rounded-md inline-block mx-auto shadow-lg"> <QRCodeSVG value={generatedLink} size={160} level="H" bgColor="#FFFFFF" fgColor="#111827" includeMargin={true} imageSettings={creatorPfpForQr ? { src: creatorPfpForQr, height: 30, width: 30, excavate: true } : undefined} /> </div> {creatorPfpForQr && <p className="text-xs text-gray-500 mt-2">QR code includes your profile picture.</p>}</div>
              </div>
            )}
          </div>
        </div>
        <div className="text-center mt-8"> <Link href="/app" className="app-button-gray !font-normal !py-2 !px-6">Back to App</Link> </div>
      </div>
    </main>
  );
}