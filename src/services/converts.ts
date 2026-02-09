import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { NewConvert } from '@/types/index';
import { queryKeys } from './queryKeys';
import { getSupabase } from '@/lib/supabase';

const table = 'converts';

function normalizeRow(r: any): NewConvert {
  return {
    ...r,
    fullName: r.fullName ?? r.full_name,
    serviceAttended: r.serviceAttended ?? r.service_attended,
    phoneNumber: r.phoneNumber ?? r.phone_number,
    dateOfConversion: r.dateOfConversion ?? r.date_of_conversion,
    followUpStatus: r.followUpStatus ?? r.follow_up_status,
    assignedLeader: r.assignedLeader ?? r.assigned_leader,
    createdAt: r.createdAt ?? r.created_at,
    updatedAt: r.updatedAt ?? r.updated_at,
  } as NewConvert;
}

async function getAll(): Promise<NewConvert[]> {
  const sb = getSupabase();
  if (!sb) throw new Error('Supabase not configured');
  const { data, error } = await sb
    .from(table)
    .select('*')
    .limit(100);
  if (error) throw error;
  const rows = (data || []).map(normalizeRow);
  rows.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  return rows;
}

async function add(input: Partial<NewConvert>): Promise<NewConvert> {
  const sb = getSupabase();
  if (!sb) throw new Error('Supabase not configured');
  const now = new Date().toISOString();
  const entity: any = {
    id: (globalThis.crypto?.randomUUID?.() || Date.now().toString()) as string,
    fullName: input.fullName || 'Unnamed',
    serviceAttended: input.serviceAttended || 'adults',
    phoneNumber: input.phoneNumber,
    email: input.email,
    dateOfConversion: input.dateOfConversion || now.split('T')[0],
    followUpStatus: input.followUpStatus || 'pending',
    assignedLeader: input.assignedLeader,
    notes: input.notes,
    createdAt: now,
    updatedAt: now,
  };
  const { data, error } = await sb.from(table).insert(entity).select().single();
  if (error) throw error;
  return normalizeRow(data);
}

async function update(id: string, patch: Partial<NewConvert>): Promise<NewConvert> {
  const sb = getSupabase();
  if (!sb) throw new Error('Supabase not configured');
  const { data, error } = await sb
    .from(table)
    .update({ ...(patch as any), updatedAt: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return normalizeRow(data);
}

async function remove(id: string): Promise<void> {
  const sb = getSupabase();
  if (!sb) throw new Error('Supabase not configured');
  const { error } = await sb.from(table).delete().eq('id', id);
  if (error) throw error;
}

export function useConverts() {
  return useQuery({
    queryKey: queryKeys.converts,
    queryFn: getAll,
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  });
}

export function useAddConvert() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: add,
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.converts }),
  });
}

export function useUpdateConvert() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<NewConvert> }) => update(id, patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.converts }),
  });
}

export function useDeleteConvert() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.converts }),
  });
}

// Replace all converts (data import)
async function replaceAll(input: NewConvert[]): Promise<NewConvert[]> {
  const sb = getSupabase();
  if (!sb) throw new Error('Supabase not configured');
  const del = await sb.from(table).delete().neq('id', '');
  if (del.error) throw del.error;
  if (input.length === 0) return [];
  const { data, error } = await sb.from(table).insert(input).select();
  if (error) throw error;
  return (data || []) as NewConvert[];
}

export function useReplaceConverts() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: NewConvert[]) => replaceAll(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.converts }),
  });
}
