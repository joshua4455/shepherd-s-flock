import { useQuery } from '@tanstack/react-query';
import { getSupabase } from '@/lib/supabase';
import { queryKeys } from './queryKeys';

export type MonthlyReportSnapshot = {
  id: string;
  month_start: string;
  members_curr: number;
  visitors_curr: number;
  converts_curr: number;
  members_prev: number;
  visitors_prev: number;
  converts_prev: number;
  created_at: string;
};

const table = 'monthly_report_snapshots';

async function fetchMonthlyReports(): Promise<MonthlyReportSnapshot[]> {
  const sb = getSupabase();
  if (!sb) throw new Error('Supabase not configured');
  const { data, error } = await sb.from(table).select('*').order('month_start', { ascending: false });
  if (error) throw error;
  return (data || []) as MonthlyReportSnapshot[];
}

export function useMonthlyReports() {
  return useQuery({ queryKey: queryKeys.monthlyReports, queryFn: fetchMonthlyReports, staleTime: 2 * 60 * 1000 });
}
