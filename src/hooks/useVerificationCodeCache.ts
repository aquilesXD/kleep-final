import { useMemo, useState } from 'react';

interface VerificationCode {
  code: string;
  timestamp: number;
  expiresIn: number;
}

export const useVerificationCodeCache = (expirationTime: number = 1800000) => { // 30 minutes default
  const [codeCache, setCodeCache] = useState<Map<string, VerificationCode>>(new Map());

  const cacheOperations = useMemo(() => ({
    getCode: (accountId: string): string | null => {
      const cached = codeCache.get(accountId);
      if (!cached) return null;

      const now = Date.now();
      if (now - cached.timestamp > cached.expiresIn) {
        cacheOperations.removeCode(accountId);
        return null;
      }
      return cached.code;
    },

    setCode: (accountId: string, code: string, customExpiration?: number) => {
      setCodeCache(prev => {
        const newCache = new Map(prev);
        newCache.set(accountId, {
          code,
          timestamp: Date.now(),
          expiresIn: customExpiration || expirationTime
        });
        return newCache;
      });
    },

    removeCode: (accountId: string) => {
      setCodeCache(prev => {
        const newCache = new Map(prev);
        newCache.delete(accountId);
        return newCache;
      });
    },

    clearExpired: () => {
      const now = Date.now();
      setCodeCache(prev => {
        const newCache = new Map();
        prev.forEach((value, key) => {
          if (now - value.timestamp <= value.expiresIn) {
            newCache.set(key, value);
          }
        });
        return newCache;
      });
    }
  }), [expirationTime]);

  return cacheOperations;
}; 