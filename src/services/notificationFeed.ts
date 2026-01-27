import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getSupabase } from '@/lib/supabase';
import { queryKeys } from './queryKeys';

export type Notice = { id: string; title: string; message?: string; ts: string; read?: boolean };

const TABLE = (import.meta as any).env?.VITE_SUPABASE_NOTIFICATIONS_TABLE || 'notification_feed';
const TS_COL = (import.meta as any).env?.VITE_SUPABASE_NOTIFICATIONS_TS_COLUMN || 'ts';
const LS_KEY = 'churchhub_notification_feed';

async function fetchFeed(): Promise<Notice[]> {
  const sb = getSupabase();
  if (!sb) {
    // Local fallback only reads existing items (no seeding)
    try { const raw = localStorage.getItem(LS_KEY); return raw ? JSON.parse(raw) : []; } catch { return []; }
  }
  const { data, error } = await sb.from(TABLE).select('*').order(TS_COL, { ascending: false }).limit(50);
  if (error) throw error;
  const rows = (data || []) as any[];
  return rows.map((r) => ({
    id: String(r.id),
    title: r.title,
    message: r.message ?? undefined,
    ts: r[TS_COL] ?? r.ts ?? r.created_at,
    read: r.read ?? false,
  }));
}

async function appendFeed(input: Omit<Notice, 'id'>): Promise<Notice> {
  const sb = getSupabase();
  if (!sb) {
    // Local fallback append
    const next: Notice = { id: String(Date.now()), ...input };
    try { const raw = localStorage.getItem(LS_KEY); const arr: Notice[] = raw ? JSON.parse(raw) : []; arr.unshift(next); localStorage.setItem(LS_KEY, JSON.stringify(arr)); } catch {}
    return next;
  }
  // Build insert payload honoring configured timestamp column
  const payload: any = { title: input.title, message: input.message, read: input.read ?? false };
  payload[TS_COL] = input.ts;
  const { data, error } = await sb.from(TABLE).insert(payload).select().single();
  if (error) throw error;
  const r: any = data;
  return {
    id: String(r.id),
    title: r.title,
    message: r.message ?? undefined,
    ts: r[TS_COL] ?? r.ts ?? r.created_at,
    read: r.read ?? false,
  };
}

export function useNotificationFeed() {
  return useQuery({ queryKey: queryKeys.notificationFeed, queryFn: fetchFeed });
}

export function useAppendNotification() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (n: Omit<Notice, 'id'>) => appendFeed(n),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.notificationFeed }),
  });
}

// Realtime subscription hook
export function useNotificationRealtime() {
  const qc = useQueryClient();
  useEffect(() => {
    const sb = getSupabase();
    if (!sb) return;
    const channel = sb
      .channel('notification-feed')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: TABLE }, () => {
        qc.invalidateQueries({ queryKey: queryKeys.notificationFeed });
      })
      .subscribe();
    return () => { sb.removeChannel(channel); };
  }, [qc]);
}

// Helpers to compose common notices
export function makeVisitorAddedNotice(fullName: string, service: string): Omit<Notice, 'id'> {
  return {
    title: 'New visitor added',
    message: `${fullName} (${service})`,
    ts: new Date().toISOString(),
    read: false,
  };
}
