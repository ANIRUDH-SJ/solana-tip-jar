// src/app/app/layout.tsx
import React from 'react';

// This layout applies to all routes within the /app segment
// It will be nested inside the root src/app/layout.tsx
export default function AppSegmentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // You could add an app-specific header/sidebar here if it's different from other parts of the site
    // For now, it simply passes children through, inheriting the root layout.
    <>
      {children}
    </>
  );
}