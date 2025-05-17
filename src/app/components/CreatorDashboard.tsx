// src/app/components/CreatorDashboard.tsx
"use client";

import React, { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import type { Tip, CreatorProfile, AggregatedTipData } from '../types';
import { ChatBubbleLeftEllipsisIcon } from '@heroicons/react/20/solid'; // For message icon

interface CreatorDashboardProps {
  solAddress: string;
}

const CreatorDashboard: React.FC<CreatorDashboardProps> = ({ solAddress }) => {
  // ... (states: dashboardData, recentCreatorTips, creatorProfileForDisplay, isLoading - same as previous)
  const [dashboardData, setDashboardData] = useState<AggregatedTipData | null>(null);
  const [recentCreatorTips, setRecentCreatorTips] = useState<Tip[]>([]);
  const [creatorProfileForDisplay, setCreatorProfileForDisplay] = useState<CreatorProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);


  const loadDashboardData = useCallback(() => { /* ... (same as previous complete version, ensuring it fetches profile and aggregates tips) ... */
    if (!solAddress) { setIsLoading(false); setDashboardData(null); setRecentCreatorTips([]); setCreatorProfileForDisplay(null); return; }
    setIsLoading(true);
    let currentProfile: CreatorProfile | null = null;
    const profileJson = localStorage.getItem(`creatorProfile_${solAddress}`);
    if (profileJson) { try { currentProfile = JSON.parse(profileJson); setCreatorProfileForDisplay(currentProfile); } catch (e) { console.error(e); localStorage.removeItem(`creatorProfile_${solAddress}`);}}
    else { setCreatorProfileForDisplay({ solAddress: solAddress, displayName: `Creator (${solAddress.substring(0,4)}...)`}); }
    const globalTipsRaw = localStorage.getItem('solanaTipJarGlobalLeaderboard');
    const allTips: Tip[] = globalTipsRaw ? JSON.parse(globalTipsRaw) : [];
    const myTips = allTips.filter(tip => tip.address === solAddress);
    let sum = 0; myTips.forEach(tip => { sum += parseFloat(tip.amount) || 0; });
    setDashboardData({ address: solAddress, handle: currentProfile?.displayName || currentProfile?.username || `Creator (${solAddress.substring(0, 6)}...)`, totalAmount: sum, tipCount: myTips.length, profilePictureUrl: currentProfile?.profilePictureUrl });
    setRecentCreatorTips(myTips.slice(0, 10).reverse()); // Show latest 10 tips
    setIsLoading(false);
  }, [solAddress]);

  useEffect(() => { /* ... (same as previous complete version, listening to storage changes) ... */
    loadDashboardData();
    const handleStorageChange = (event: StorageEvent) => { if (event.key === 'solanaTipJarGlobalLeaderboard' || event.key === `creatorProfile_${solAddress}`) { loadDashboardData(); } };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [solAddress, loadDashboardData]);


  if (isLoading) { /* ... (Loading skeleton UI - same as previous) ... */ }
  const displayHandle = dashboardData?.handle || creatorProfileForDisplay?.displayName || `Creator (${solAddress.substring(0,6)}...)`;
  const displayPfp = dashboardData?.profilePictureUrl || creatorProfileForDisplay?.profilePictureUrl;


  return (
    <div className="bg-gray-800/80 p-6 md:p-8 rounded-xl shadow-2xl ring-1 ring-gray-700/50 animate-fadeIn">
      {/* ... (Dashboard Header with PFP and Name - same as previous) ... */}
      <div className="flex flex-col sm:flex-row items-center mb-8 border-b border-gray-700 pb-6 gap-5">
        {displayPfp ? ( <Image src={displayPfp} alt={displayHandle} width={80} height={80} className="rounded-full object-cover ring-2 ring-indigo-500 flex-shrink-0 shadow-lg" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
        ) : ( <div className="w-20 h-20 bg-gray-600 rounded-full flex items-center justify-center text-4xl text-gray-300 ring-2 ring-indigo-500 flex-shrink-0 shadow-lg"> {(displayHandle.charAt(0) || "?").toUpperCase()} </div> )}
        <div className="text-center sm:text-left flex-grow mt-3 sm:mt-0"> <h2 className="text-2xl md:text-3xl font-bold text-gray-50 tracking-tight"> {displayHandle}'s Dashboard </h2> <p className="text-sm text-gray-400">Your Solana Tip Jar Summary.</p> </div>
      </div>

      {/* ... (Stats Cards: Total SOL Received, Total Tips - same as previous) ... */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-gray-700/70 p-6 rounded-lg text-center shadow-md hover:bg-gray-700/90 transition-colors duration-200"> <p className="text-base text-gray-300 uppercase tracking-wider font-medium">Total SOL Received</p> <p className="text-4xl font-extrabold text-green-400 mt-1.5"> {(dashboardData?.totalAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })} <span className="text-2xl ml-1.5 font-semibold">SOL</span> </p> </div>
        <div className="bg-gray-700/70 p-6 rounded-lg text-center shadow-md hover:bg-gray-700/90 transition-colors duration-200"> <p className="text-base text-gray-300 uppercase tracking-wider font-medium">Total Tips</p> <p className="text-4xl font-extrabold text-indigo-400 mt-1.5">{dashboardData?.tipCount || 0}</p> </div>
      </div>


      <h3 className="text-xl font-semibold mb-4 text-gray-100">Recent Tips Received:</h3>
      {recentCreatorTips.length > 0 ? (
        <ul className="space-y-3 max-h-80 overflow-y-auto pr-2 custom-scrollbar"> {/* Increased max-h */}
          {recentCreatorTips.map((tip) => (
            <li key={tip.sig} className="p-4 bg-gray-700 rounded-lg text-sm hover:bg-gray-600/80 transition-colors shadow">
              <div className="flex justify-between items-center mb-1.5">
                <div>
                  <span className="font-semibold text-lg text-green-300">{tip.amount} SOL</span>
                  <span className="text-gray-400 text-xs"> on {new Date(tip.date).toLocaleDateString()}</span>
                </div>
                <a href={`https://explorer.solana.com/tx/${tip.sig}?cluster=devnet`} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-400 hover:text-blue-300 underline">
                  View Tx
                </a>
              </div>
              {/* << NEW: Display Tip Message >> */}
              {tip.message && (
                <div className="mt-2 pt-2 border-t border-gray-600/50 flex items-start space-x-2">
                  <ChatBubbleLeftEllipsisIcon className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-gray-300 italic leading-relaxed">"{tip.message}"</p>
                </div>
              )}
              {/* << END NEW >> */}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-gray-400 italic text-center py-6 bg-gray-700/40 rounded-md">
            No tips received through the Tip Jar yet. Share your tip link to get started!
        </p>
      )}
    </div>
  );
};
export default CreatorDashboard;