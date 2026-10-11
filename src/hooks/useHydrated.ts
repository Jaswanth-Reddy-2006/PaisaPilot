'use client';

import { useState, useEffect } from 'react';

/**
 * Returns true once the component has mounted on the client.
 * Use this to avoid hydration mismatches between SSR and client-only storage.
 */
export function useHydrated(): boolean {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  return hydrated;
}
