// src/app/types.ts
export interface CreatorProfile {
  solAddress: string;
  displayName: string;
  username?: string;
  profilePictureUrl?: string; // For potential future PFP integrations (e.g., from social login)
}

export interface Tip {
  handle: string;           // Display name of the recipient at the time of tip
  address: string;          // Recipient SOL address
  amount: string;           // Amount in SOL
  sig: string;              // Transaction signature
  date: string;             // Date of tip
  message?: string;          // Optional: Message from tipper
}

export interface AggregatedTipData { // For Creator Dashboard & Leaderboard
  address: string;
  handle: string;
  totalAmount: number;
  tipCount: number;
  profilePictureUrl?: string;
}

export interface TipperStats { // For Tipper Dashboard
    totalTipped: number;
    tipCount: number;
    uniqueCreatorsTipped: number;
}