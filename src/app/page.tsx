// src/app/page.tsx (Landing Page)
"use client";

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ChevronRightIcon, UsersIcon, BoltIcon, ShieldCheckIcon,
  LinkIcon as LinkHeroIcon, PencilSquareIcon, TableCellsIcon,
  CodeBracketIcon, SparklesIcon, GiftIcon, CurrencyDollarIcon, PaperAirplaneIcon // Added PaperAirplaneIcon
} from '@heroicons/react/24/outline';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import type { Tip, CreatorProfile, AggregatedTipData } from './types'; // Path to your types

export default function HomePage() {
  const [featuredCreators, setFeaturedCreators] = useState<AggregatedTipData[]>([]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100, duration: 0.5 } }
  };

  // Selling points (ensure these arrays are defined as they were in that version)
  const creatorFeatures = [
    { icon: <PencilSquareIcon className="h-7 w-7 text-purple-400" />, title: "Personalized Profile", description: "Set your display name and handle for your public presence." },
    { icon: <LinkHeroIcon className="h-7 w-7 text-sky-400" />, title: "Unique Shareable Links", description: "Generate tip links to share anywhere on the web." },
    { icon: <TableCellsIcon className="h-7 w-7 text-green-400" />, title: "Creator Dashboard", description: "Track your tips, total SOL received, and recent activity." },
    { icon: <CodeBracketIcon className="h-7 w-7 text-pink-400" />, title: "Embeddable Widgets", description: "Add a 'Tip Me' button directly to your website or blog." },
    { icon: <CurrencyDollarIcon className="h-7 w-7 text-yellow-400" />, title: "Direct Monetization", description: "Receive SOL directly to your wallet, no intermediaries." },
  ];
  const fanFeatures = [
    { icon: <BoltIcon className="h-7 w-7 text-purple-400" />, title: "Instant & Direct", description: "Tips go straight to the creator's wallet using Solana's speed." },
    { icon: <SparklesIcon className="h-7 w-7 text-sky-400" />, title: "Seamless Experience", description: "One-click tipping through easy-to-use links. No sign-ups." },
    { icon: <ShieldCheckIcon className="h-7 w-7 text-green-400" />, title: "Transparent & Secure", description: "All transactions are on-chain, verifiable, and non-custodial." },
    { icon: <GiftIcon className="h-7 w-7 text-pink-400" />, title: "Support Your Favorites", description: "A direct and meaningful way to appreciate the content you love." },
    { icon: <UsersIcon className="h-7 w-7 text-yellow-400" />, title: "Join the Community", description: "Be part of the Web3 creator economy on Solana." },
  ];

  useEffect(() => {
    // Logic to load featured creators from localStorage (same as before)
    const globalTipsRaw = localStorage.getItem('solanaTipJarGlobalLeaderboard');
    const allTips: Tip[] = globalTipsRaw ? JSON.parse(globalTipsRaw) : [];
    const aggregated: Record<string, AggregatedTipData> = {};
    allTips.forEach(tip => {
      const amountNum = parseFloat(tip.amount);
      if (isNaN(amountNum) || !tip.address) return;
      let pfpUrl: string | undefined;
      let handleToUse = tip.handle;
      const profileKey = `creatorProfile_${tip.address}`;
      const profileJson = localStorage.getItem(profileKey);
      if (profileJson) {
        try {
          const profile: CreatorProfile = JSON.parse(profileJson);
          handleToUse = profile.displayName || profile.username || tip.handle;
          pfpUrl = profile.profilePictureUrl;
        } catch (e) { console.error("Error parsing profile for featured creator", e); }
      }
      if (handleToUse === "Direct Tip" || handleToUse === tip.address || !handleToUse) {
        handleToUse = `Creator (${tip.address.substring(0, 4)}...)`;
      }
      if (aggregated[tip.address]) {
        aggregated[tip.address].totalAmount += amountNum;
        aggregated[tip.address].tipCount += 1;
        aggregated[tip.address].handle = handleToUse;
        if (pfpUrl) aggregated[tip.address].profilePictureUrl = pfpUrl;
      } else {
        aggregated[tip.address] = {
          address: tip.address, handle: handleToUse, totalAmount: amountNum, tipCount: 1, profilePictureUrl: pfpUrl,
        };
      }
    });
    const sortedAndFeatured = Object.values(aggregated)
      .sort((a, b) => b.totalAmount - a.totalAmount).slice(0, 3);
    setFeaturedCreators(sortedAndFeatured);
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 overflow-x-hidden">
      <motion.section
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.7 }}
        className="relative py-24 md:py-36 text-center bg-gradient-to-b from-gray-900 via-purple-900/25 to-gray-900 overflow-hidden"
      >
        <div className="absolute -top-20 -left-20 w-96 h-96 bg-purple-600/20 rounded-full filter blur-3xl opacity-70 animate-pulse"></div>
        <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-indigo-600/20 rounded-full filter blur-3xl opacity-70 animate-pulse animation-delay-2000"></div>
        <div className="container mx-auto px-6 z-10 relative">
          <motion.h1 variants={itemVariants} initial="hidden" animate="visible"
            className="text-5xl sm:text-6xl md:text-7xl font-extrabold mb-6 tracking-tight">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-400 to-red-400">
              Solana Tip Jar
            </span>
          </motion.h1>
          <motion.p variants={itemVariants} initial="hidden" animate="visible" transition={{delay: 0.1}}
            className="text-xl md:text-2xl text-gray-300 mb-12 max-w-3xl mx-auto"
          >
            The simplest, fastest way to send and receive SOL tips. Empowering creators and fans with seamless on-chain microtransactions.
          </motion.p>
          <motion.div
            variants={itemVariants} initial="hidden" animate="visible" transition={{delay: 0.2}}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6" // Ensure this div allows wrapping or adequate spacing
          >
            <Link href="/app" className="app-button bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 !text-base sm:!text-lg !px-6 sm:!px-8 !py-3 sm:!py-3.5 transform hover:scale-105 focus:ring-purple-500 !font-bold shadow-2xl w-full sm:w-auto">
              App Hub
              <UsersIcon className="h-5 w-5 ml-2" />
            </Link>
            <Link href="/create-link" className="app-button bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-500 hover:to-teal-500 !text-base sm:!text-lg !px-6 sm:!px-8 !py-3 sm:!py-3.5 transform hover:scale-105 focus:ring-green-500 !font-bold shadow-2xl w-full sm:w-auto">
              Create Tip Link
              <LinkHeroIcon className="h-5 w-5 ml-2" />
            </Link>
            {/* --- MODIFIED: ADDED SEND DIRECT TIP BUTTON --- */}
            <Link href="/send-tip" className="app-button bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-400 hover:to-cyan-400 !text-base sm:!text-lg !px-6 sm:!px-8 !py-3 sm:!py-3.5 transform hover:scale-105 focus:ring-sky-500 !font-bold shadow-2xl w-full sm:w-auto">
              Send Direct Tip
              <PaperAirplaneIcon className="h-5 w-5 ml-2" />
            </Link>
            {/* --- END MODIFICATION --- */}
          </motion.div>
        </div>
      </motion.section>

      {/* Selling Points Section: For Creators & For Fans */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-start">
            <motion.div variants={containerVariants} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.1 }}>
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-center lg:text-left tracking-tight">For <span className="text-purple-400">Creators</span></h2>
              <p className="text-gray-400 mb-10 text-center lg:text-left text-lg">Monetize your content effortlessly and build a direct connection with your audience on Solana.</p>
              <div className="space-y-6">
                {creatorFeatures.map((feature) => ( <motion.div key={feature.title} variants={itemVariants} className="flex items-start p-5 bg-gray-800/60 rounded-xl shadow-lg hover:bg-gray-700/60 transition-all duration-200 hover:shadow-purple-500/20"> <div className="flex-shrink-0 bg-gray-700 p-3.5 rounded-lg mr-5 shadow-inner">{feature.icon}</div> <div> <h3 className="text-xl font-semibold mb-1.5 text-gray-50">{feature.title}</h3> <p className="text-gray-400 text-sm leading-relaxed">{feature.description}</p> </div> </motion.div> ))}
              </div>
            </motion.div>
            <motion.div variants={containerVariants} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.1 }}>
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-center lg:text-left tracking-tight">For <span className="text-sky-400">Fans</span> & Tippers</h2>
              <p className="text-gray-400 mb-10 text-center lg:text-left text-lg">Support your favorite creators instantly, securely, and show your appreciation directly.</p>
              <div className="space-y-6">
                {fanFeatures.map((feature) => ( <motion.div key={feature.title} variants={itemVariants} className="flex items-start p-5 bg-gray-800/60 rounded-xl shadow-lg hover:bg-gray-700/60 transition-all duration-200 hover:shadow-sky-500/20"> <div className="flex-shrink-0 bg-gray-700 p-3.5 rounded-lg mr-5 shadow-inner">{feature.icon}</div> <div> <h3 className="text-xl font-semibold mb-1.5 text-gray-50">{feature.title}</h3> <p className="text-gray-400 text-sm leading-relaxed">{feature.description}</p> </div> </motion.div> ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Featured Creators Section */}
      {featuredCreators.length > 0 && (
        <section className="py-16 md:py-24 bg-gray-800/40">
          <div className="container mx-auto px-6">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-16 tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-teal-300 via-sky-400 to-indigo-400">✨ Spotlight Creators ✨</h2>
            <motion.div variants={containerVariants} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.1 }} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredCreators.map((creator) => ( <motion.div key={creator.address} variants={itemVariants} className="bg-gray-700/70 p-6 rounded-xl shadow-lg text-center flex flex-col items-center hover:shadow-indigo-500/30 transition-all duration-300 transform hover:-translate-y-1.5"> {creator.profilePictureUrl ? ( <Image src={creator.profilePictureUrl} alt={creator.handle} width={100} height={100} className="rounded-full object-cover mb-5 border-2 border-indigo-500 shadow-md" onError={(e) => {(e.target as HTMLImageElement).style.display = 'none';}}/> ) : ( <div className="w-24 h-24 bg-gray-600 rounded-full mb-5 flex items-center justify-center text-4xl text-gray-400 border-2 border-indigo-500 shadow-md">{creator.handle.charAt(0).toUpperCase()}</div> )} <h3 className="text-xl font-semibold mb-1 truncate w-full" title={creator.handle}>{creator.handle}</h3> <p className="text-sm text-green-400 font-bold">{creator.totalAmount.toLocaleString(undefined, { minimumFractionDigits:2, maximumFractionDigits: 4 })} SOL Received</p> <p className="text-xs text-gray-400 mb-4">{creator.tipCount} Tips</p> <Link href={`/tipping-page?address=${creator.address}&creator=${encodeURIComponent(creator.handle)}&amount=0.05${creator.profilePictureUrl ? `&pfp=${encodeURIComponent(creator.profilePictureUrl)}` : '' }`} className="mt-auto app-button-indigo !text-sm !px-6 !py-2"> Tip {creator.handle.split(' ')[0]} </Link> </motion.div> ))}
            </motion.div>
          </div>
        </section>
      )}

      <footer className="py-16 bg-gray-900 border-t border-gray-700/50 mt-10">
        <div className="container mx-auto px-6 text-center text-gray-400">
          <p>© {new Date().getFullYear()} Solana Tip Jar. </p>
          <p className="text-sm mt-2">Built with ❤️ on Solana.</p>
        </div>
      </footer>
    </div>
  );
}