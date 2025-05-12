import React, { FC, useCallback, useState, useMemo } from 'react'; // Removed useEffect, added useMemo
import './App.css';
import './index.css';
import { clusterApiUrl, Connection, LAMPORTS_PER_SOL, PublicKey, SystemProgram, Transaction } from '@solana/web3.js'; // Removed sendAndConfirmTransaction
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useWallet } from '@solana/wallet-adapter-react';

const App: FC = () => {
    const [logs, setLogs] = useState<string[]>([]);
    const [balance, setBalance] = useState<number | null>(null);
    const { publicKey, wallet, sendTransaction } = useWallet();
    const RECIPIENT_WALLET_ADDRESS = 'RecipientWalletAddressHere';
    const connection = useMemo(() => new Connection(clusterApiUrl('devnet'), 'confirmed'), []); // Wrapped in useMemo

    const handleTip = useCallback(async (amount: number) => {
        if (!publicKey) {
            alert('Please connect your wallet first.');
            return;
        }
        try {
            const lamports = amount * LAMPORTS_PER_SOL;
            const transaction = new Transaction().add(
                SystemProgram.transfer({
                    fromPubkey: publicKey,
                    toPubkey: new PublicKey(RECIPIENT_WALLET_ADDRESS),
                    lamports,
                })
            );
            transaction.feePayer = publicKey;
            const { blockhash } = await connection.getRecentBlockhash();
            transaction.recentBlockhash = blockhash;

            const signature = await sendTransaction(transaction, connection);
            await connection.confirmTransaction(signature, 'processed');

            setLogs(prevLogs => [`Sent ${amount} SOL to ${RECIPIENT_WALLET_ADDRESS}`, ...prevLogs]);
            const balance = await connection.getBalance(publicKey);
            setBalance(balance / LAMPORTS_PER_SOL);
        } catch (error: unknown) {
            let message = 'An unknown error occurred';
            if (error instanceof Error) {
                message = error.message;
            }
            console.error('Error sending tip:', message);
            setLogs(prevLogs => [`Error sending tip: ${message}`, ...prevLogs]);
        }
    }, [publicKey, connection, sendTransaction, setLogs]);

    const handleDisconnect = useCallback(async () => {
        if (wallet && wallet.adapter.disconnect) {
            try {
                await wallet.adapter.disconnect();
            } catch (error) {
                console.error('Error disconnecting wallet:', error);
                setLogs(prevLogs => [`Error disconnecting wallet: ${error}`, ...prevLogs]);
            }
        }
    }, [wallet, setLogs]);

    return (
        <div className="App bg-gray-900 min-h-screen text-white flex flex-col items-center justify-center p-4">
            <div className="container mx-auto max-w-lg p-6 bg-gray-800 rounded-xl shadow-2xl">
                <header className="App-header text-center mb-8">
                    <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 animate-pulse">
                        Solana Tip Jar
                    </h1>
                    <p className="text-gray-400 mt-2">Send a tip to the creator and see it happen live on the Solana blockchain!</p>
                </header>

                {!publicKey ? (
                    <div className="text-center">
                        <WalletMultiButton className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-3 px-6 rounded-lg shadow-lg transition duration-300 ease-in-out transform hover:scale-105 w-full" />
                        <p className="mt-4 text-gray-500">Connect your wallet to get started.</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div className="p-4 bg-gray-700 rounded-lg shadow">
                            <p className="text-sm text-gray-300">Your Wallet Address:</p>
                            <p className="text-lg font-mono break-all text-purple-300">{publicKey.toBase58()}</p>
                        </div>
                        <div className="p-4 bg-gray-700 rounded-lg shadow">
                            <p className="text-sm text-gray-300">Your Balance:</p>
                            <p className="text-2xl font-bold text-green-400">{balance !== null ? `${balance.toFixed(4)} SOL` : 'Loading...'}</p>
                        </div>
                        <div className="p-4 bg-gray-700 rounded-lg shadow">
                            <p className="text-sm text-gray-300">Recipient&apos;s Wallet Address:</p>
                            <p className="text-lg font-mono break-all text-pink-300">{RECIPIENT_WALLET_ADDRESS}</p>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            {[0.01, 0.05, 0.1, 0.5].map((tipAmount) => (
                                <button
                                    key={tipAmount}
                                    onClick={() => handleTip(tipAmount)}
                                    className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-4 rounded-lg shadow transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-75"
                                >
                                    Tip {tipAmount} SOL
                                </button>
                            ))}
                        </div>
                        <button
                            onClick={handleDisconnect}
                            className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-6 rounded-lg shadow-lg transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-opacity-75"
                        >
                            Disconnect Wallet
                        </button>
                    </div>
                )}

                <div className="mt-8">
                    <h2 className="text-2xl font-semibold mb-4 text-gray-200">Transaction Logs</h2>
                    {logs.length === 0 ? (
                        <p className="text-gray-500 italic">No transactions yet. Send a tip to see logs here!</p>
                    ) : (
                        <div className="bg-gray-700 p-4 rounded-lg shadow max-h-60 overflow-y-auto space-y-2">
                            {logs.map((log, index) => (
                                <p key={index} className={`text-sm font-mono p-2 rounded ${log.startsWith('Error:') ? 'bg-red-900 text-red-200' : 'bg-gray-600 text-gray-300'}`}>
                                    {log}
                                </p>
                            ))}
                        </div>
                    )}
                </div>
                <footer className="mt-10 text-center text-gray-500 text-sm">
                    <p>This is a simple Solana Tip Jar application. It&apos;s for demonstration purposes only.</p>
                    <p>Always be careful when connecting your wallet to websites.</p>
                    <p>
                        Powered by Solana. Check out the{' '}
                        <a
                            href={`https://explorer.solana.com/address/${RECIPIENT_WALLET_ADDRESS}?cluster=devnet`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-purple-400 hover:text-purple-300 underline"
                        >
                            recipient&apos;s transactions on Solana Explorer (Devnet)
                        </a>.
                    </p>
                </footer>
            </div>
        </div>
    );
};

export default App;