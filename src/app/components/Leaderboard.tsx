// src/app/components/Leaderboard.tsx
"use client";

import React, { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import type { Tip, CreatorProfile, AggregatedTipData } from '../types'; // Adjust path

const Leaderboard: React.FC = () => {
  const [leaderboardData, setLeaderboardData] = useState<AggregatedTipData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadAndProcessLeaderboard = useCallback(() => {
    setIsLoading(true);
    const globalTipsRaw = localStorage.getItem('solanaTipJarGlobalLeaderboard');
    const allTips: Tip[] = globalTipsRaw ? JSON.parse(globalTipsRaw) : [];

    if (allTips.length === 0) {
      setLeaderboardData([]); setIsLoading(false); return;
    }

    const aggregatedData: Record<string, AggregatedTipData> = {};

    allTips.forEach(tip => {
      const amountNum = parseFloat(tip.amount);
      if (isNaN(amountNum) || !tip.address) return;

      let pfpUrl: string | undefined;
      let currentDisplayHandle = tip.handle;
      const profileKey = `creatorProfile_${tip.address}`;
      const profileJson = localStorage.getItem(profileKey);
      if (profileJson) {
        try {
          const profile: CreatorProfile = JSON.parse(profileJson);
          currentDisplayHandle = profile.displayName || profile.username || tip.handle;
          pfpUrl = profile.profilePictureUrl;
        } catch (e) { console.error("Error parsing profile for leaderboard entry:", tip.address, e); }
      }
      if (currentDisplayHandle === "Direct Tip" || currentDisplayHandle === tip.address || !currentDisplayHandle?.trim()) {
        currentDisplayHandle = `Creator (${tip.address.substring(0,4)}...)`;
      }

      if (aggregatedData[tip.address]) {
        aggregatedData[tip.address].totalAmount += amountNum;
        aggregatedData[tip.address].tipCount += 1;
        aggregatedData[tip.address].handle = currentDisplayHandle;
        if (pfpUrl !== undefined) aggregatedData[tip.address].profilePictureUrl = pfpUrl;
      } else {
        aggregatedData[tip.address] = {
          address: tip.address, handle: currentDisplayHandle, totalAmount: amountNum, tipCount: 1, profilePictureUrl: pfpUrl,
        };
      }
    });

    const sortedLeaderboard = Object.values(aggregatedData)
      .sort((a, b) => b.totalAmount - a.totalAmount)
      .slice(0, 10);
    setLeaderboardData(sortedLeaderboard);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadAndProcessLeaderboard();
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'solanaTipJarGlobalLeaderboard' || event.key?.startsWith('creatorProfile_')) {
        loadAndProcessLeaderboard();
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [loadAndProcessLeaderboard]);

  if (isLoading) {
    return (
      <div className="space-y-3 max-h-96 overflow-y-auto pr-1 custom-scrollbar">
        <p className="text-gray-400 italic text-center py-4">Loading leaderboard...</p>
      </div>
    );
  }
  if (leaderboardData.length === 0) {
    return <p className="text-gray-400 text-center py-6 italic bg-gray-700/40 rounded-md">The leaderboard is currently empty. Be the first to tip a creator!</p>;
  }

  return (
    <div className="space-y-3 max-h-[calc(100vh-350px)] min-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
      {leaderboardData.map((entry, index) => (
        <div
          key={entry.address}
          className="p-3.5 bg-gray-700/80 rounded-lg shadow-md flex items-center space-x-4 hover:bg-gray-600/70 transition-all duration-150 transform hover:scale-[1.01]"
        >
          <span className="text-lg font-bold text-indigo-300 w-8 text-center flex-shrink-0">{index + 1}.</span>
          {entry.profilePictureUrl ? (
            <Image src={entry.profilePictureUrl} alt={entry.handle} width={44} height={44} className="rounded-full object-cover flex-shrink-0 shadow-sm border border-gray-600" onError={(e)=>(e.currentTarget.style.display = 'none')} />
          ) : (
            <div className="w-11 h-11 bg-gray-600 rounded-full flex items-center justify-center text-xl text-gray-300 flex-shrink-0 shadow-sm border border-gray-600">
              {(entry.handle.charAt(0) || "?").toUpperCase()}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-50 truncate" title={entry.handle}>
              {entry.handle}
            </p>
            <p className="text-xs text-gray-400 break-all" title={entry.address}>{entry.address.substring(0,10)}...{entry.address.substring(entry.address.length - 4)}</p>
          </div>
          <div className="text-right flex-shrink-0 pl-2">
            <p className="text-md font-bold text-green-400">{entry.totalAmount.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:4})} SOL</p>
            <p className="text-xs text-gray-500">{entry.tipCount} tip{entry.tipCount !== 1 ? 's' : ''}</p>
          </div>
        </div>
      ))}
    </div>
  );
};
export default Leaderboard;