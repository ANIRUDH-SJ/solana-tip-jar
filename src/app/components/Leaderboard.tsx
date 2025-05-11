// src/app/components/Leaderboard.tsx
"use client";

import React, { useEffect, useState } from 'react';

// Re-define Tip interface here or import if you move it to a shared types file
interface Tip {
  handle: string;
  address: string;
  amount: string;
  sig: string;
  date: string;
}

interface AggregatedTip {
  address: string; // Unique key: recipient's SOL address
  handle: string;  // Display name (e.g., Twitter handle, or first handle encountered)
  totalAmount: number; // Sum of SOL tipped
  tipCount: number;    // Number of tips received
}

const Leaderboard: React.FC = () => {
  const [leaderboardData, setLeaderboardData] = useState<AggregatedTip[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadAndProcessLeaderboard = () => {
    setIsLoading(true);
    const globalTipsRaw = localStorage.getItem('solanaTipJarGlobalLeaderboard');
    const globalTips: Tip[] = globalTipsRaw ? JSON.parse(globalTipsRaw) : [];

    if (globalTips.length === 0) {
      setLeaderboardData([]);
      setIsLoading(false);
      return;
    }

    const aggregatedData: Record<string, AggregatedTip> = {};

    globalTips.forEach(tip => {
      const amountNum = parseFloat(tip.amount);
      if (isNaN(amountNum) || !tip.address) return; // Skip invalid entries

      if (aggregatedData[tip.address]) {
        aggregatedData[tip.address].totalAmount += amountNum;
        aggregatedData[tip.address].tipCount += 1;
        // Logic for choosing best handle: if current tip's handle is not "Direct Tip"
        // and the stored one is, update it. Or prefer shorter/longer, etc.
        // For simplicity, we can take the handle from the most recent tip to this address
        // or the first non-"Direct Tip" handle.
        if (tip.handle && tip.handle !== "Direct Tip") {
             aggregatedData[tip.address].handle = tip.handle;
        } else if (!aggregatedData[tip.address].handle || aggregatedData[tip.address].handle === "Direct Tip") {
            // If existing handle is "Direct Tip" or null, and new one is also "Direct Tip", keep existing or update.
            // This logic can be refined. For now, a new "Direct Tip" doesn't overwrite a specific handle.
            if (!aggregatedData[tip.address].handle) { // If no handle yet
                 aggregatedData[tip.address].handle = "Creator"; // Default if only direct tips
            }
        }

      } else {
        aggregatedData[tip.address] = {
          address: tip.address,
          handle: (tip.handle && tip.handle !== "Direct Tip") ? tip.handle : `Creator (${tip.address.substring(0,4)}...)`, // Initial handle
          totalAmount: amountNum,
          tipCount: 1,
        };
      }
    });

    const sortedLeaderboard = Object.values(aggregatedData)
      .sort((a, b) => b.totalAmount - a.totalAmount) // Sort by total SOL received
      .slice(0, 10); // Display top 10 creators

    setLeaderboardData(sortedLeaderboard);
    setIsLoading(false);
  };

  useEffect(() => {
    loadAndProcessLeaderboard();

    // Listen for storage events to update the leaderboard if data changes in another tab/window
    // This provides a more "live" feel for the demo.
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'solanaTipJarGlobalLeaderboard' || event.key === 'solanaTipJarRecentTips') {
        // We can reload if either changes, as global tips are a superset
        loadAndProcessLeaderboard();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    // Cleanup listener on component unmount
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []); // Empty dependency array means this effect runs once on mount and cleans up on unmount

  if (isLoading) {
    return <div className="text-center text-gray-400 py-4">Loading leaderboard...</div>;
  }

  if (leaderboardData.length === 0) {
    return <p className="text-gray-400 text-center py-4">No creators have been tipped yet. Be the first to support someone!</p>;
  }

  return (
    <div className="space-y-4">
      {leaderboardData.map((creator, index) => (
        <div
          key={creator.address}
          className="p-4 bg-gray-700 rounded-lg shadow-md flex items-center justify-between space-x-3 hover:bg-gray-600/50 transition-colors"
        >
          <div className="flex items-center space-x-3">
            <span className="text-xl font-bold text-indigo-300 w-8 text-center">{index + 1}.</span>
            <div className="flex-1 min-w-0"> {/* min-w-0 for truncation */}
              <p className="font-semibold text-white truncate" title={creator.handle}>
                {creator.handle}
              </p>
              <p className="text-xs text-gray-400 break-all" title={creator.address}>{creator.address}</p>
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-lg font-bold text-green-400">
              {creator.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 9 })} SOL
            </p>
            <p className="text-xs text-gray-500">{creator.tipCount} tip{creator.tipCount !== 1 ? 's' : ''}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default Leaderboard;