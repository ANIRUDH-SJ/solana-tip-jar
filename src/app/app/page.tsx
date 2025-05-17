// src/app/app/page.tsx
"use client";

import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
// SystemProgram, Transaction, PublicKey, LAMPORTS_PER_SOL, MemoProgram are not used here
import { useState, useCallback, ChangeEvent, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  UserCircleIcon, Cog8ToothIcon, TableCellsIcon, ArrowLeftOnRectangleIcon,
  Bars3Icon, XMarkIcon, CodeBracketIcon, InformationCircleIcon,
  ChatBubbleLeftEllipsisIcon, ArrowUpRightIcon, CreditCardIcon, LinkIcon as LinkHeroIcon, PaperAirplaneIcon // Added PaperAirplaneIcon
} from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';
import type { CreatorProfile, Tip, TipperStats } from '../types';

import CreatorDashboard from '../components/CreatorDashboard';
import EmbedCodeGenerator from '../components/EmbedCodeGenerator';
import Leaderboard from '../components/Leaderboard';

export default function AppHomePage() {
  // const { connection } = useConnection(); // Not directly used in this component's tipping logic anymore
  const { publicKey, connected, disconnect } = useWallet();

  const [hasMounted, setHasMounted] = useState(false);
  // REMOVED: States for Direct Tipping (recipient, amount, directTipMessage)
  // REMOVED: txSignature, loading (related to direct tipping on this page)
  const [error, setError] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string>("");
  const [recentTipsSent, setRecentTipsSent] = useState<Tip[]>([]); // Still used for Tipper Dashboard
  const [currentProfile, setCurrentProfile] = useState<CreatorProfile | null>(null);
  const [profileDisplayName, setProfileDisplayName] = useState<string>("");
  const [profileUsername, setProfileUsername] = useState<string>("");
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<'main_tools' | 'creator_dashboard' | 'tipper_dashboard' | 'edit_profile' | 'embed_widget'>('main_tools');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  const handleProfileDisplayNameChange = (e: ChangeEvent<HTMLInputElement>) => setProfileDisplayName(e.target.value);
  const handleProfileUsernameChange = (e: ChangeEvent<HTMLInputElement>) => setProfileUsername(e.target.value);

  useEffect(() => { setHasMounted(true); }, []);
  useEffect(() => { /* ... Click outside handler ... */ }, []);
  useEffect(() => { /* ... Load data on mount/connect (same profile loading logic) ... */
    if (!hasMounted) return;
    const storedUserTips = localStorage.getItem('solanaTipJarRecentTips');
    if (storedUserTips) { try { setRecentTipsSent(JSON.parse(storedUserTips)); } catch (e) { console.error(e); } }

    if (connected && publicKey) {
      const profileKey = `creatorProfile_${publicKey.toBase58()}`;
      const existingProfileJson = localStorage.getItem(profileKey);
      if (existingProfileJson) {
        try {
          const profile: CreatorProfile = JSON.parse(existingProfileJson);
          setCurrentProfile(profile); setProfileDisplayName(profile.displayName);
          setProfileUsername(profile.username || '');
          if (activeSection === 'main_tools') setActiveSection('creator_dashboard');
        } catch (e) { localStorage.removeItem(profileKey); if(activeSection === 'main_tools') setActiveSection('edit_profile'); }
      } else {
        setProfileDisplayName(""); setProfileUsername("");
        if (activeSection === 'main_tools') setActiveSection('edit_profile');
      }
    } else { /* ... reset states on disconnect ... */ }
  }, [connected, publicKey, hasMounted, activeSection]);

  const handleSaveCreatorProfile = () => {
    if (!connected || !publicKey) { setError("Connect wallet."); return; }
    const displayNameToSave = profileDisplayName.trim();
    if (!displayNameToSave) { setError("Display Name is required."); return; }
    const profile: CreatorProfile = {
      solAddress: publicKey.toBase58(),
      displayName: displayNameToSave,
      username: profileUsername.trim() || undefined,
      profilePictureUrl: currentProfile?.profilePictureUrl,
    };
    localStorage.setItem(`creatorProfile_${publicKey.toBase58()}`, JSON.stringify(profile));
    setCurrentProfile(profile);
    setSuccessMessage("Profile saved!");
    setError("");
    window.dispatchEvent(new StorageEvent('storage', { key: `creatorProfile_${publicKey.toBase58()}` }));
    setActiveSection('creator_dashboard');
    setIsUserDropdownOpen(false);
    setIsMobileMenuOpen(false);
  };

  const tipperStats = useMemo<TipperStats>(() => {
    if (!hasMounted || !connected || !publicKey) return { totalTipped: 0, tipCount: 0, uniqueCreatorsTipped: 0 };
    let totalSOL = 0;
    const uniqueAddresses = new Set<string>();
    recentTipsSent.forEach(tip => {
      totalSOL += parseFloat(tip.amount) || 0;
      uniqueAddresses.add(tip.address);
    });
    return {
      totalTipped: totalSOL,
      tipCount: recentTipsSent.length,
      uniqueCreatorsTipped: uniqueAddresses.size
    };
  }, [recentTipsSent, connected, publicKey, hasMounted]);

  const renderSectionContent = () => {
    if (!hasMounted) { return <div className="text-center py-20 text-gray-400 animate-pulse">Initializing App...</div>; }
    if (!connected || !publicKey) { 
      return (
        <div className="text-center py-20">
          <h2 className="text-2xl font-bold mb-4 text-gray-300">Connect Your Wallet</h2>
          <p className="text-gray-400 mb-8">Please connect your wallet to access the Tip Jar features.</p>
          <WalletMultiButton />
        </div>
      ); 
    }
    switch (activeSection) {
      case 'creator_dashboard': return <CreatorDashboard solAddress={publicKey.toBase58()} />;
      case 'tipper_dashboard': return (
        <div className="space-y-6 animate-fadeIn">
          <div className="bg-gray-800 p-6 rounded-xl shadow-xl">
            <h2 className="text-2xl font-bold mb-4 text-gray-100">Your Tipping Stats</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-gray-700/50 p-4 rounded-lg">
                <p className="text-sm text-gray-400">Total Tipped</p>
                <p className="text-2xl font-bold text-indigo-400">{tipperStats.totalTipped.toFixed(2)} SOL</p>
              </div>
              <div className="bg-gray-700/50 p-4 rounded-lg">
                <p className="text-sm text-gray-400">Tips Sent</p>
                <p className="text-2xl font-bold text-indigo-400">{tipperStats.tipCount}</p>
              </div>
              <div className="bg-gray-700/50 p-4 rounded-lg">
                <p className="text-sm text-gray-400">Creators Tipped</p>
                <p className="text-2xl font-bold text-indigo-400">{tipperStats.uniqueCreatorsTipped}</p>
              </div>
            </div>
          </div>
          <div className="bg-gray-800 p-6 rounded-xl shadow-xl">
            <h2 className="text-2xl font-bold mb-4 text-gray-100">Recent Tips</h2>
            {recentTipsSent.length === 0 ? (
              <p className="text-gray-400 text-center py-4">No tips sent yet.</p>
            ) : (
              <div className="space-y-3">
                {recentTipsSent.map((tip, index) => (
                  <div key={index} className="bg-gray-700/50 p-4 rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-gray-200">{tip.handle}</p>
                        <p className="text-sm text-gray-400">{tip.date}</p>
                      </div>
                      <p className="text-lg font-bold text-indigo-400">{tip.amount} SOL</p>
                    </div>
                    {tip.message && (
                      <p className="mt-2 text-sm text-gray-300 italic">"{tip.message}"</p>
                    )}
                    <a href={`https://explorer.solana.com/tx/${tip.sig}?cluster=devnet`} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-400 hover:text-indigo-300 mt-2 inline-block">
                      View on Explorer
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      );
      case 'edit_profile': return (
        <div className="max-w-2xl mx-auto space-y-6 animate-fadeIn">
          <div className="bg-gray-800 p-6 rounded-xl shadow-xl">
            <h2 className="text-2xl font-bold mb-6 text-gray-100">Edit Your Profile</h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="displayName" className="app-label">Display Name</label>
                <input
                  type="text"
                  id="displayName"
                  value={profileDisplayName}
                  onChange={handleProfileDisplayNameChange}
                  placeholder="Enter your display name"
                  className="mt-1 app-input"
                />
              </div>
              <div>
                <label htmlFor="username" className="app-label">Username (optional)</label>
                <input
                  type="text"
                  id="username"
                  value={profileUsername}
                  onChange={handleProfileUsernameChange}
                  placeholder="Enter a username"
                  className="mt-1 app-input"
                />
              </div>
              <button
                onClick={handleSaveCreatorProfile}
                className="w-full app-button-indigo !font-bold !py-3"
              >
                Save Profile
              </button>
            </div>
          </div>
        </div>
      );
      case 'embed_widget': return <EmbedCodeGenerator creatorSolAddress={publicKey.toBase58()} creatorHandleForLink={profileUsername || profileDisplayName || publicKey.toBase58().substring(0,6)} profilePictureUrl={currentProfile?.profilePictureUrl} />;
      case 'main_tools':
      default: return (
        <div className="space-y-10 animate-fadeIn">
          {/* Main tools section - Now a welcome/overview and links */}
          <section className="bg-gray-800 p-6 md:p-8 rounded-xl shadow-2xl ring-1 ring-gray-700/50 text-center">
            <h2 className="text-3xl font-bold mb-4 text-gray-50 tracking-tight">Tip Jar Hub</h2>
            <p className="text-gray-300 mb-8 max-w-xl mx-auto">
              Welcome! From here you can send a direct tip to any Solana address, create a personalized tip link to share, or manage your creator profile and dashboards.
            </p>
            <div className="grid sm:grid-cols-2 gap-6 max-w-lg mx-auto">
                {/* --- LINK TO SEND-TIP PAGE --- */}
                <Link href="/send-tip" className="app-button-indigo !font-bold !py-3.5 w-full text-base">
                    <PaperAirplaneIcon className="h-5 w-5 mr-2.5" /> Send a Direct Tip
                </Link>
                {/* --- END LINK --- */}
                <Link href="/create-link" className="app-button-green !font-bold !py-3.5 w-full text-base">
                    <LinkHeroIcon className="h-5 w-5 mr-2.5" /> Create Your Tip Link
                </Link>
            </div>
          </section>

          <section className="bg-gray-800 p-6 md:p-8 rounded-xl shadow-2xl ring-1 ring-gray-700/50">
            <h2 className="text-2xl font-bold mb-6 text-center text-transparent bg-clip-text bg-gradient-to-r from-green-400 via-teal-400 to-sky-400 tracking-tight">🏆 Top Tipped Creators 🏆</h2>
            <Leaderboard />
          </section>
        </div>
      );
    }
  };

  return (
    <main className="min-h-screen bg-gray-900 text-gray-100 flex flex-col items-center p-4 sm:p-6 md:p-8">
      <div className="w-full max-w-5xl space-y-8">
        <header className="flex flex-wrap justify-between items-center gap-4 sticky top-0 bg-gray-900/80 backdrop-blur-lg py-4 px-2 -mx-2 z-30 md:relative md:bg-transparent md:backdrop-blur-none md:py-0 md:px-0 md:mx-0 shadow-sm md:shadow-none rounded-b-lg md:rounded-none">
          <Link href="/" className="flex items-center gap-3 group">
            <svg className="h-8 w-8 text-purple-400 group-hover:text-purple-300 transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"> <path d="M12 2L2 7l10 5 10-5-10-5z"></path><path d="M2 17l10 5 10-5"></path><path d="M2 12l10 5 10-5"></path> </svg>
            <h1 className="text-2xl sm:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-400 to-red-400 group-hover:opacity-80 transition-opacity tracking-tight">Solana Tip Jar</h1>
          </Link>
          <div className="flex items-center gap-3 sm:gap-4">
            {!hasMounted ? <div className="app-button !bg-indigo-600 opacity-50 !font-semibold !py-2 !px-4 !text-sm !h-[40px] w-[150px] leading-snug animate-pulse rounded-lg"></div> : !connected ? ( <WalletMultiButton /> ) : (
              <>
                <div className="hidden md:flex relative" ref={dropdownRef}>
                  <button onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)} className="flex items-center justify-center w-10 h-10 bg-gray-700/80 hover:bg-gray-700 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-900 transition-colors shadow-md">
                    {currentProfile?.profilePictureUrl ? (<Image src={currentProfile.profilePictureUrl} alt="User" width={40} height={40} className="rounded-full object-cover"/>) : (<UserCircleIcon className="h-7 w-7 text-gray-300" />)}
                  </button>
                  <AnimatePresence> {isUserDropdownOpen && ( <motion.div initial={{ opacity: 0, y: -10, scale:0.95 }} animate={{ opacity: 1, y: 0, scale:1 }} exit={{ opacity: 0, y: -10, scale:0.95 }} transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-12 w-64 bg-gray-800 border border-gray-700 rounded-lg shadow-2xl z-20 py-2 space-y-1">
                    <div className="px-4 py-3 border-b border-gray-700 mb-1"><p className="text-sm font-semibold text-gray-100 truncate" title={currentProfile?.displayName}>{currentProfile?.displayName || "User"}</p><p className="text-xs text-gray-400 truncate" title={publicKey?.toBase58()}>{publicKey?.toBase58()}</p></div>
                    <button onClick={() => { setActiveSection('main_tools'); setIsUserDropdownOpen(false); }} className="user-dropdown-item"><CreditCardIcon className="h-5 w-5 mr-2.5 text-gray-400"/>App Hub</button>
                    {/* --- NEW LINK TO SEND-TIP PAGE IN DROPDOWN --- */}
                    <Link href="/send-tip" onClick={() => setIsUserDropdownOpen(false)} className="user-dropdown-item"><PaperAirplaneIcon className="h-5 w-5 mr-2.5 text-gray-400"/>Send Direct Tip</Link>
                    {/* --- END NEW LINK --- */}
                    <button onClick={() => { setActiveSection('creator_dashboard'); setIsUserDropdownOpen(false); }} className="user-dropdown-item"><TableCellsIcon className="h-5 w-5 mr-2.5 text-gray-400"/>Creator Dashboard</button>
                    <button onClick={() => { setActiveSection('tipper_dashboard'); setIsUserDropdownOpen(false); }} className="user-dropdown-item"><ArrowUpRightIcon className="h-5 w-5 mr-2.5 text-gray-400"/>My Sent Tips</button>
                    <button onClick={() => { setActiveSection('edit_profile'); setIsUserDropdownOpen(false); }} className="user-dropdown-item"><Cog8ToothIcon className="h-5 w-5 mr-2.5 text-gray-400"/>Edit My Profile</button>
                    <button onClick={() => { setActiveSection('embed_widget'); setIsUserDropdownOpen(false); }} className="user-dropdown-item"><CodeBracketIcon className="h-5 w-5 mr-2.5 text-gray-400"/>Embed Button</button>
                    <Link href="/create-link" onClick={() => setIsUserDropdownOpen(false)} className="user-dropdown-item"><LinkHeroIcon className="h-5 w-5 mr-2.5 text-gray-400"/>Create New Tip Link</Link>
                    <div className="px-2 pt-1"><hr className="border-gray-700"/></div>
                    <button onClick={() => { disconnect().catch(e=>console.error(e)); setIsUserDropdownOpen(false); }} className="user-dropdown-item !text-red-400 hover:!bg-red-500/20 hover:!text-red-300"><ArrowLeftOnRectangleIcon className="h-5 w-5 mr-2.5"/>Disconnect</button>
                   </motion.div> )} </AnimatePresence>
                </div>
                <div className="md:hidden relative" ref={mobileMenuRef}> <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 rounded-md text-gray-300 hover:bg-gray-700 focus:outline-none"> {isMobileMenuOpen ? <XMarkIcon className="h-7 w-7"/> : <Bars3Icon className="h-7 w-7"/>} </button> </div>
              </>
            )}
          </div>
        </header>
        <AnimatePresence> {isMobileMenuOpen && connected && hasMounted && ( <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.25, ease:"easeInOut" }}
            className="md:hidden bg-gray-800 rounded-lg shadow-xl p-4 space-y-2 fixed top-[76px] left-4 right-4 z-20 border border-gray-700 mobile-menu-content">
            <button onClick={() => { setActiveSection('main_tools'); setIsMobileMenuOpen(false); }} className="user-dropdown-item w-full"><CreditCardIcon className="h-5 w-5 mr-2.5 text-gray-400"/>App Hub</button>
            {/* --- NEW LINK TO SEND-TIP PAGE IN MOBILE MENU --- */}
            <Link href="/send-tip" onClick={() => setIsMobileMenuOpen(false)} className="user-dropdown-item w-full"><PaperAirplaneIcon className="h-5 w-5 mr-2.5 text-gray-400"/>Send Direct Tip</Link>
            {/* --- END NEW LINK --- */}
            <button onClick={() => { setActiveSection('creator_dashboard'); setIsMobileMenuOpen(false); }} className="user-dropdown-item w-full"><TableCellsIcon className="h-5 w-5 mr-2.5 text-gray-400"/>Creator Dashboard</button>
            <button onClick={() => { setActiveSection('tipper_dashboard'); setIsMobileMenuOpen(false); }} className="user-dropdown-item w-full"><ArrowUpRightIcon className="h-5 w-5 mr-2.5 text-gray-400"/>My Sent Tips</button>
            <button onClick={() => { setActiveSection('edit_profile'); setIsMobileMenuOpen(false); }} className="user-dropdown-item w-full"><Cog8ToothIcon className="h-5 w-5 mr-2.5 text-gray-400"/>Edit My Profile</button>
            <button onClick={() => { setActiveSection('embed_widget'); setIsMobileMenuOpen(false); }} className="user-dropdown-item w-full"><CodeBracketIcon className="h-5 w-5 mr-2.5 text-gray-400"/>Embed Button</button>
            <Link href="/create-link" onClick={() => setIsMobileMenuOpen(false)} className="user-dropdown-item w-full"><LinkHeroIcon className="h-5 w-5 mr-2.5 text-gray-400"/>Create New Tip Link</Link>
            <div className="px-2 pt-1"><hr className="border-gray-700"/></div>
            <button onClick={() => { disconnect().catch(e=>console.error(e)); setIsMobileMenuOpen(false); }} className="user-dropdown-item w-full !text-red-400 hover:!bg-red-500/20 hover:!text-red-300"><ArrowLeftOnRectangleIcon className="h-5 w-5 mr-2.5"/>Disconnect</button>
        </motion.div> )} </AnimatePresence>

        {hasMounted && error && <p className="app-message-error animate-fadeIn">{error}</p>}
        {hasMounted && successMessage && <p className="app-message-success animate-fadeIn">{successMessage}</p>}
        
        <div className="mt-4 md:mt-0">
         {renderSectionContent()}
        </div>
      </div>
    </main>
  );
}