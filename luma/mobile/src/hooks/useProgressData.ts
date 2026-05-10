import { useState, useEffect } from 'react';
import { progressApi } from '../services/api';
import { ProgressStats } from '../types';

export function useProgressData(userId: string | undefined) {
  const [stats, setStats] = useState<ProgressStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    progressApi
      .getProgress(userId)
      .then(setStats)
      .catch(() => null)
      .finally(() => setIsLoading(false));
  }, [userId]);

  return { stats, isLoading };
}
