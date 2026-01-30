'use client';

import React from 'react';
import { QAFlowProvider, type QAFlowProviderProps } from '../context';
import { QAFlowToolbar } from './Toolbar';
import { QAFlowPanel } from './Panel';

export interface QAFlowProps extends Omit<QAFlowProviderProps, 'children'> {
  children?: React.ReactNode;
}

/**
 * Main QAFlow component - wrap your app or specific pages with this
 *
 * @example
 * ```tsx
 * // In your layout or app
 * import { QAFlow } from 'qaflow';
 *
 * export default function Layout({ children }) {
 *   return (
 *     <>
 *       {children}
 *       {process.env.NODE_ENV === 'development' && (
 *         <QAFlow config={{ githubRepo: 'user/repo' }} />
 *       )}
 *     </>
 *   );
 * }
 * ```
 */
export function QAFlow({ children, config }: QAFlowProps) {
  // Only render in browser
  if (typeof window === 'undefined') {
    return <>{children}</>;
  }

  return (
    <QAFlowProvider config={config}>
      {children}
      <QAFlowToolbar />
      <QAFlowPanel />
    </QAFlowProvider>
  );
}

/**
 * Standalone overlay - use if you want manual control via useQAFlow hook
 */
export function QAFlowOverlay() {
  return (
    <>
      <QAFlowToolbar />
      <QAFlowPanel />
    </>
  );
}
