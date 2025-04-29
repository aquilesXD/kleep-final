import { useCallback, useState } from 'react';

interface RetryConfig {
  maxRetries?: number;
  delayMs?: number;
  backoffRate?: number;
}

export const useRetry = ({
  maxRetries = 3,
  delayMs = 1000,
  backoffRate = 2
}: RetryConfig = {}) => {
  const [attemptCount, setAttemptCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);

  const executeWithRetry = useCallback(async <T>(
    operation: () => Promise<T>,
    onSuccess?: (result: T) => void,
    onError?: (error: Error) => void
  ) => {
    setIsRetrying(true);
    let currentDelay = delayMs;

    try {
      for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
          setAttemptCount(attempt + 1);
          const result = await operation();
          onSuccess?.(result);
          setIsRetrying(false);
          setAttemptCount(0);
          return result;
        } catch (error) {
          if (attempt === maxRetries - 1) {
            throw error;
          }
          await new Promise(resolve => setTimeout(resolve, currentDelay));
          currentDelay *= backoffRate; // Exponential backoff
        }
      }
    } catch (error: any) {
      setIsRetrying(false);
      onError?.(error);
      throw error;
    }
  }, [maxRetries, delayMs, backoffRate]);

  return {
    executeWithRetry,
    attemptCount,
    isRetrying
  };
}; 