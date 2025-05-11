// src/app/layout.tsx
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import WalletContextProvider from './components/WalletContextProvider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Solana Tip Jar - Tip Creators with SOL!', // More descriptive
  description: 'The easiest way to send and receive SOL tips. One-click tipping for content creators on Twitter/X, Twitch, and more!',
  icons: {
    icon: '/favicon.ico', // Path relative to the public folder
  }
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-gray-900`}> {/* Ensure bg-gray-900 is on body or html for full coverage */}
        <WalletContextProvider>
          {children}
        </WalletContextProvider>
      </body>
    </html>
  );
}