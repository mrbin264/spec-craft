'use client';

import { useToast } from '@/lib/toast';
import { ErrorResponse } from '@/lib/errors';
import { useCallback } from 'react';

/**
 * Hook for handling API errors with toast notifications
 */
export function useApiError() {
  const { showToast } = useToast();

  const handleError = useCallback(
    (error: unknown) => {
      let message = 'An unexpected error occurred';

      if (error instanceof Error) {
        message = error.message;
      } else if (typeof error === 'object' && error !== null) {
        const errorResponse = error as ErrorResponse;
        if (errorResponse.error?.message) {
          message = errorResponse.error.message;
        }
      }

      showToast('error', message);
    },
    [showToast]
  );

  return { handleError };
}
