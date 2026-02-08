import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getSupabase } from '@/lib/supabase';
import { delay, queryKeys } from './queryKeys';

export interface NotificationPrefs {
  visitorAlerts: boolean;
  followupReminders: boolean;
  monthlyReports: boolean; // formerly weeklyReports
}

const LS_KEY = 'churchhub_notifications';
const TABLE = 'notification_prefs';

const defaultPrefs: NotificationPrefs = {
  visitorAlerts: true,
  followupReminders: true,
  monthlyReports: false,
};

async function readLocal(): Promise<NotificationPrefs> {
  await delay();
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? (JSON.parse(raw) as NotificationPrefs) : defaultPrefs;
  } catch {
    return defaultPrefs;
  }
}

async function writeLocal(next: NotificationPrefs): Promise<NotificationPrefs> {
  await delay();
  try { localStorage.setItem(LS_KEY, JSON.stringify(next)); } catch {}
  return next;
}

async function fetchPrefs(): Promise<NotificationPrefs> {
  const sb = getSupabase();
  if (!sb) return readLocal();
  const { data: userRes } = await sb.auth.getUser();
  const user = userRes?.user;
  if (!user) return defaultPrefs;
  const { data, error } = await sb.from(TABLE).select('*').eq('user_id', user.id).maybeSingle();
  if (error) throw error;
  if (!data) return defaultPrefs;
  return {
    visitorAlerts: !!data.visitor_alerts,
    followupReminders: !!data.followup_reminders,
    // Read either monthly_reports (preferred) or weekly_reports (legacy)
    monthlyReports: data.hasOwnProperty('monthly_reports')
      ? !!(data as any).monthly_reports
      : !!(data as any).weekly_reports,
  };
}

async function savePrefs(input: NotificationPrefs): Promise<NotificationPrefs> {
  const sb = getSupabase();
  if (!sb) return writeLocal(input);
  const { data: userRes } = await sb.auth.getUser();
  const user = userRes?.user;
  if (!user) throw new Error('Not authenticated');
  const row: any = {
    user_id: user.id,
    visitor_alerts: input.visitorAlerts,
    followup_reminders: input.followupReminders,
    // Write to legacy column weekly_reports until DB migration is applied
    weekly_reports: input.monthlyReports,
    updated_at: new Date().toISOString(),
  };
  const { error } = await sb.from(TABLE).upsert(row, { onConflict: 'user_id' });
  if (error) throw error;
  return input;
}

export function useNotificationPrefs() {
  return useQuery({ queryKey: queryKeys.notifications, queryFn: fetchPrefs });
}

export function useUpdateNotificationPrefs() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: NotificationPrefs) => savePrefs(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.notifications }),
  });
}
