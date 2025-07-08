'use client';

import dynamic from 'next/dynamic';
import { ComponentType, ReactElement } from 'react';

// Higher-order component to disable SSR for components
export function withNoSSR<P extends object>(
  Component: ComponentType<P>
): ComponentType<P> {
  const NoSSRComponent = dynamic(() => Promise.resolve(Component), {
    ssr: false,
    loading: () => <div className="h-16 bg-black"></div>, // Minimal loading placeholder
  });

  return NoSSRComponent;
}

// Component wrapper for disabling SSR
export const NoSSR = ({ children }: { children: ReactElement }) => {
  const NoSSRWrapper = dynamic(() => Promise.resolve(() => children), {
    ssr: false,
    loading: () => <div className="animate-pulse bg-gray-800 h-4 w-24 rounded"></div>,
  });

  return <NoSSRWrapper />;
};
