// src/app/components/EmbedCodeGenerator.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { ClipboardDocumentIcon } from '@heroicons/react/24/outline'; // For copy button icon

interface EmbedCodeGeneratorProps {
  creatorSolAddress: string;
  creatorHandleForLink: string;
  profilePictureUrl?: string;
}

const EmbedCodeGenerator: React.FC<EmbedCodeGeneratorProps> = ({
  creatorSolAddress,
  creatorHandleForLink,
  profilePictureUrl,
}) => {
  const [copied, setCopied] = useState(false);
  const [embedCode, setEmbedCode] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined' && creatorSolAddress && creatorHandleForLink) {
      const defaultTipAmount = "0.05";
      const params = new URLSearchParams({
        creator: creatorHandleForLink,
        address: creatorSolAddress,
        amount: defaultTipAmount,
      });
      if (profilePictureUrl) {
        params.append('pfp', profilePictureUrl);
      }
      const currentTipLink = `${window.location.origin}/tipping-page?${params.toString()}`;

      const pfpImgHtml = profilePictureUrl
        ? `<img src="${profilePictureUrl}" alt="${creatorHandleForLink}" style="width:28px; height:28px; border-radius:50%; margin-right:10px; border: 1px solid rgba(255,255,255,0.3);" />`
        : `<svg xmlns="http://www.w3.org/2000/svg" style="width:20px; height:20px; margin-right:8px; color:white;" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599.97M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-.97M12 16c-4.418 0-8-1.79-8-4s3.582-4 8-4 8 1.79 8 4-3.582 4-8 4z" /></svg>`;

      const currentEmbedCode = `<a href="${currentTipLink}" target="_blank" rel="noopener noreferrer" style="display:inline-flex; align-items:center; padding:12px 24px; background-image:linear-gradient(to right, #8B5CF6, #6366F1); color:white; text-decoration:none; font-family:system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif; font-size:16px; font-weight:600; border-radius:10px; box-shadow:0 4px 15px rgba(0,0,0,0.15), 0 2px 6px rgba(0,0,0,0.1); transition:transform 0.2s ease-out, box-shadow 0.2s ease-out;" onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 7px 20px rgba(0,0,0,0.15), 0 3px 8px rgba(0,0,0,0.1)';" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 15px rgba(0,0,0,0.15), 0 2px 6px rgba(0,0,0,0.1)';">
  ${pfpImgHtml}
  Tip ${creatorHandleForLink}
</a>`;
      setEmbedCode(currentEmbedCode);
    } else {
        setEmbedCode('');
    }
  }, [creatorSolAddress, creatorHandleForLink, profilePictureUrl]);

  const handleCopy = () => {
    if (embedCode) {
      navigator.clipboard.writeText(embedCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  if (typeof window === 'undefined') return null;

  if (!creatorSolAddress) {
    return (
      <div className="bg-gray-800/80 p-6 md:p-8 rounded-xl shadow-2xl ring-1 ring-gray-700/50 animate-fadeIn">
         <h3 className="text-xl md:text-2xl font-bold mb-3 text-gray-100 tracking-tight">Embed Your Tip Button</h3>
         <p className="text-sm text-gray-400">Connect your wallet and set up your profile in the "Main App" view to generate an embeddable tip button.</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-800/80 p-6 md:p-8 rounded-xl shadow-2xl ring-1 ring-gray-700/50 animate-fadeIn">
      <h3 className="text-xl md:text-2xl font-bold mb-3 text-gray-100 tracking-tight">Embed Your Tip Button</h3>
      <p className="text-sm text-gray-400 mb-6">Add this button to your website, blog, or portfolio for easy tipping!</p>
      <div className="mb-6">
        <p className="text-sm text-gray-300 mb-2 font-medium">Button Preview:</p>
        <div className="p-6 border-2 border-dashed border-gray-700 rounded-lg flex justify-center items-center bg-gray-800 min-h-[100px] shadow-inner">
          {embedCode ? (
            // biome-ignore lint/security/noDangerouslySetInnerHtml: Used for trusted, generated HTML
            <div dangerouslySetInnerHTML={{ __html: embedCode }} />
          ) : (
            <p className="text-gray-500 italic">
                {creatorHandleForLink ? "Generating preview..." : "Set your profile handle in 'Edit Profile' to generate."}
            </p>
          )}
        </div>
      </div>
      <div>
        <p className="text-sm text-gray-300 mb-2 font-medium">Copy HTML Code:</p>
        <div className="relative">
          <textarea
            readOnly
            value={embedCode}
            rows={10}
            className="w-full p-3.5 bg-gray-700 border border-gray-600 rounded-lg text-xs text-gray-300 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 custom-scrollbar font-mono"
            onClick={(e) => (e.target as HTMLTextAreaElement).select()}
            placeholder="Code will appear here once your profile handle is set..."
          />
          <button
            onClick={handleCopy}
            disabled={!embedCode}
            className="absolute top-3 right-3 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-md disabled:opacity-50 transition-colors flex items-center gap-1.5"
          >
            <ClipboardDocumentIcon className="h-4 w-4" />
            {copied ? 'Copied!' : 'Copy Code'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmbedCodeGenerator;