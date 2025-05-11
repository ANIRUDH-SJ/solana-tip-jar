// src/app/page.tsx (This is your NEW Home/Landing Page)
"use client";

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ChevronRightIcon, UsersIcon, BoltIcon, ShieldCheckIcon, LinkIcon, WalletIcon, ShareIcon, CheckCircleIcon } from '@heroicons/react/24/outline'; // Using Heroicons for simple icons

// You would import any Aceternity UI components here if you use them
// import { Vortex } from './components/ui/vortex'; // Example if you copied Vortex from Aceternity

export default function HomePage() {

  const featureVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  const benefits = [
    {
      icon: <BoltIcon className="h-8 w-8 text-purple-400" />,
      title: "Lightning Fast Tips",
      description: "Leverage Solana's incredible speed for near-instant transactions.",
    },
    {
      icon: <UsersIcon className="h-8 w-8 text-pink-400" />,
      title: "Ultra-Low Fees",
      description: "Microtransactions made viable with Solana's minimal gas fees.",
    },
    {
      icon: <ShieldCheckIcon className="h-8 w-8 text-green-400" />,
      title: "Directly to Wallet",
      description: "Non-custodial. Tips go straight from fan to creator, no intermediaries.",
    },
    {
      icon: <LinkIcon className="h-8 w-8 text-sky-400" />,
      title: "Easy Link Sharing",
      description: "Generate unique, shareable tip links for any platform (X, Twitch, etc.).",
    },
  ];

  const howItWorksCreator = [
    { icon: <WalletIcon className="h-10 w-10 text-indigo-300" />, step: "Connect Wallet", description: "Securely connect your Solana wallet." },
    { icon: <LinkIcon className="h-10 w-10 text-indigo-300" />, step: "Generate Link", description: "Create your unique soltip.me/yourhandle link." },
    { icon: <ShareIcon className="h-10 w-10 text-indigo-300" />, step: "Share Link", description: "Post it on your profiles and content." },
    { icon: <CheckCircleIcon className="h-10 w-10 text-indigo-300" />, step: "Receive SOL", description: "Get tips directly to your wallet." },
  ];

  const howItWorksTipper = [
    { icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10 text-teal-300"><path strokeLinecap="round" strokeLinejoin="round" d="M15.042 21.672 13.684 16.6m0 0-2.51 2.225.569-9.47 5.227 7.917-3.286-.672Zm-7.518-.267A8.25 8.25 0 1 1 20.25 10.5M8.288 14.212A5.25 5.25 0 1 1 17.25 10.5" /></svg>, step: "Click Tip Link", description: "Access a creator's unique tipping page." },
    { icon: <WalletIcon className="h-10 w-10 text-teal-300" />, step: "Connect Wallet", description: "Quickly connect your preferred Solana wallet." },
    { icon: <BoltIcon className="h-10 w-10 text-teal-300" />, step: "Confirm Tip", description: "Send SOL with a single confirmation." },
    { icon: <UsersIcon className="h-10 w-10 text-teal-300" />, step: "Support Creator", description: "Instantly support your favorite content." },
  ];


  return (
    <div className="min-h-screen bg-gray-900 text-white overflow-x-hidden">
      {/* Optional: Aceternity UI Background Component could wrap this or be part of Hero */}
      {/* <Vortex className="absolute inset-0 z-0 opacity-20" /> */}

      {/* Hero Section */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="relative py-20 md:py-32 text-center bg-gradient-to-br from-gray-900 via-purple-900/30 to-gray-900"
      >
        <div className="container mx-auto px-6 z-10 relative">
          <motion.h1
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-5xl md:text-7xl font-extrabold mb-6"
          >
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-500 to-red-500">
              Solana Tip Jar
            </span>
          </motion.h1>
          <motion.p
            initial={{ y: -30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-xl md:text-2xl text-gray-300 mb-10 max-w-3xl mx-auto"
          >
            The simplest, fastest way to send and receive SOL tips. Empowering creators and fans with seamless on-chain microtransactions.
          </motion.p>
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            <Link
              href="/app" // This links to your main Tip Jar application page
              className="inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold rounded-lg shadow-xl text-lg transition-all duration-300 transform hover:scale-105"
            >
              Launch Tip Jar
              <ChevronRightIcon className="h-5 w-5 ml-2" />
            </Link>
          </motion.div>
        </div>
        {/* Placeholder for more intricate hero background if desired */}
      </motion.section>

      {/* Benefits Section */}
      <section className="py-16 md:py-24 bg-gray-800/50">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">Why Solana Tip Jar?</h2>
          <p className="text-center text-gray-400 mb-12 md:mb-16 max-w-2xl mx-auto">
            Experience the future of content monetization, powered by Solana.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, index) => (
              <motion.div
                key={benefit.title}
                variants={featureVariants}
                initial="hidden"
                whileInView="visible" // Animates when it comes into view
                viewport={{ once: true, amount: 0.3 }} // Trigger animation once, when 30% visible
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-gray-800 p-6 rounded-xl shadow-lg hover:shadow-purple-500/30 transition-shadow"
              >
                <div className="flex items-center justify-center mb-4 bg-gray-700 h-16 w-16 rounded-full mx-auto">
                  {benefit.icon}
                </div>
                <h3 className="text-xl font-semibold text-center mb-2">{benefit.title}</h3>
                <p className="text-gray-400 text-center text-sm">{benefit.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">Simple Steps to Get Started</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16">
            {/* For Creators */}
            <div>
              <h3 className="text-2xl font-semibold mb-8 text-center text-indigo-400">For Creators</h3>
              <div className="space-y-8">
                {howItWorksCreator.map((item, index) => (
                  <motion.div
                    key={item.step}
                    initial={{ opacity: 0, x: -30 }}
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.2 }}
                    variants={featureVariants}
                    transition={{ duration: 0.5, delay: index * 0.15 }}
                    className="flex items-start space-x-4 p-4 bg-gray-800 rounded-lg"
                  >
                    <div className="flex-shrink-0 bg-indigo-500/20 p-3 rounded-full">{item.icon}</div>
                    <div>
                      <h4 className="text-lg font-medium">{item.step}</h4>
                      <p className="text-gray-400 text-sm">{item.description}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
            {/* For Tippers */}
            <div>
              <h3 className="text-2xl font-semibold mb-8 text-center text-teal-400">For Tippers</h3>
               <div className="space-y-8">
                {howItWorksTipper.map((item, index) => (
                  <motion.div
                    key={item.step}
                    initial={{ opacity: 0, x: 30 }}
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.2 }}
                    variants={featureVariants}
                    transition={{ duration: 0.5, delay: index * 0.15 }}
                    className="flex items-start space-x-4 p-4 bg-gray-800 rounded-lg"
                  >
                     <div className="flex-shrink-0 bg-teal-500/20 p-3 rounded-full">{item.icon}</div>
                    <div>
                      <h4 className="text-lg font-medium">{item.step}</h4>
                      <p className="text-gray-400 text-sm">{item.description}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="py-20 md:py-32 bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-600 text-center">
        <div className="container mx-auto px-6">
          <motion.h2
            initial={{ opacity:0, y:20 }}
            whileInView="visible"
            viewport={{ once: true }}
            variants={featureVariants}
            className="text-3xl md:text-4xl font-bold mb-6 text-white"
          >
            Ready to Revolutionize Tipping?
          </motion.h2>
          <motion.p
            initial={{ opacity:0, y:20 }}
            whileInView="visible"
            viewport={{ once: true }}
            variants={featureVariants}
            transition={{ delay: 0.1 }}
            className="text-lg md:text-xl text-purple-100 mb-10 max-w-xl mx-auto"
          >
            Join the Solana Tip Jar community and experience the power of direct, on-chain support.
          </motion.p>
          <motion.div
            initial={{ opacity:0, scale:0.8 }}
            whileInView="visible"
            viewport={{ once: true }}
            variants={featureVariants}
            transition={{ delay: 0.2 }}
          >
            <Link
              href="/app"
              className="inline-flex items-center justify-center px-10 py-4 bg-white text-indigo-600 font-semibold rounded-lg shadow-lg text-lg transition-all duration-300 transform hover:scale-105 hover:bg-gray-100"
            >
              Get Started Now
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-gray-900 border-t border-gray-700/50">
        <div className="container mx-auto px-6 text-center text-gray-400">
          <p>© {new Date().getFullYear()} Solana Tip Jar. All Rights Reserved (or specify your license).</p>
          <p className="text-sm mt-2">
            Built with ❤️ on Solana.
            {/* Add link to your GitHub repo if public */}
            {/* <a href="YOUR_GITHUB_REPO_LINK" target="_blank" rel="noopener noreferrer" className="underline hover:text-purple-400 ml-2">View on GitHub</a> */}
          </p>
        </div>
      </footer>
    </div>
  );
}