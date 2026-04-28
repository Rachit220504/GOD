import { useEffect, useState, useCallback } from 'react';
import { analyticsApi, ProgressSummary, SkillsData, PaginatedHistory, ReadingTips } from '../services/analyticsApi';

// ─── useProgressSummary ────────────────────────────────────────────────────────

export function useProgressSummary(userId: string | undefined) {
  const [data, setData] = useState<ProgressSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!userId) return;
    setIsLoading(true);
    setError(null);
    try {
      const result = await analyticsApi.getSummary(userId);
      setData(result);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load summary');
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => { void fetch(); }, [fetch]);
  return { data, isLoading, error, refetch: fetch };
}

// ─── useSkills ────────────────────────────────────────────────────────────────

export function useSkills(userId: string | undefined) {
  const [data, setData] = useState<SkillsData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!userId) return;
    setIsLoading(true);
    setError(null);
    try {
      const result = await analyticsApi.getSkills(userId);
      setData(result);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load skills');
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => { void fetch(); }, [fetch]);
  return { data, isLoading, error, refetch: fetch };
}

// ─── useSessionHistory ────────────────────────────────────────────────────────

export function useSessionHistory(userId: string | undefined, limit = 10) {
  const [data, setData] = useState<PaginatedHistory | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async (page = 1) => {
    if (!userId) return;
    setIsLoading(true);
    setError(null);
    try {
      const result = await analyticsApi.getHistory(userId, page, limit);
      setData(result);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load history');
    } finally {
      setIsLoading(false);
    }
  }, [userId, limit]);

  useEffect(() => { void fetch(1); }, [fetch]);
  return { data, isLoading, error, fetchPage: fetch };
}

// ─── useReadingTips ───────────────────────────────────────────────────────────

export function useReadingTips(userId: string | undefined) {
  const [data, setData] = useState<ReadingTips | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!userId) return;
    setIsLoading(true);
    setError(null);
    try {
      const result = await analyticsApi.getTips(userId);
      setData(result);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load tips');
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => { void fetch(); }, [fetch]);
  return { data, isLoading, error, refetch: fetch };
}
