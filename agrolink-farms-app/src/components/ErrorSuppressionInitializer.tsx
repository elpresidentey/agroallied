'use client';

import { useEffect } from 'react';
import { initializeErrorSuppression } from '@/lib/error-suppression';

/**
 * Component that initializes error suppression on the client side
 * This helps reduce console spam from expected errors like AbortErrors
 */
export function ErrorSuppressionInitializer() {
  useEffect(() => {
    initializeErrorSuppression();
  }, []);

  // This component doesn't render anything
  return null;
}