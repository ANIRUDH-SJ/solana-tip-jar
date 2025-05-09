// src/app/layout.tsx
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
// MODIFIED IMPORT PATH:
import WalletContextProvider from './components/WalletContextProvider'; // Assuming components folder is directly under app

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Solana Tip Jar',
  description: 'Tip content creators with SOL!',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <WalletContextProvider>
          {children}
        </WalletContextProvider>
      </body>
    </html>
  );
}