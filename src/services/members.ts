import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Member } from '@/types/index';
import { queryKeys } from './queryKeys';
import { getSupabase } from '@/lib/supabase';

const table = 'members';

async function getAll(): Promise<Member[]> {
  const sb = getSupabase();
  if (!sb) throw new Error('Supabase not configured');
  const { data, error } = await sb
    .from(table)
    .select('*')
    .order('createdAt', { ascending: false });
  if (error) throw error;
  return (data || []) as Member[];
}

async function add(input: Partial<Member>): Promise<Member> {
  const sb = getSupabase();
  if (!sb) throw new Error('Supabase not configured');
  const now = new Date().toISOString();
  const entity: Member = {
    id: (globalThis.crypto?.randomUUID?.() || Date.now().toString()) as string,
    fullName: input.fullName || 'Unnamed',
    serviceCategory: input.serviceCategory || 'adults',
    gender: input.gender,
    dateOfBirth: input.dateOfBirth,
    phoneNumber: input.phoneNumber,
    parentGuardian: input.parentGuardian,
    careGroup: input.careGroup,
    notes: (input as any).notes,
    createdAt: now,
    updatedAt: now,
  };
  const { data, error } = await sb.from(table).insert(entity).select().single();
  if (error) throw error;
  return data as Member;
}

async function update(id: string, patch: Partial<Member>): Promise<Member> {
  const sb = getSupabase();
  if (!sb) throw new Error('Supabase not configured');
  const { data, error } = await sb
    .from(table)
    .update({ ...patch, updatedAt: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as Member;
}

async function remove(id: string): Promise<void> {
  const sb = getSupabase();
  if (!sb) throw new Error('Supabase not configured');
  const { error } = await sb.from(table).delete().eq('id', id);
  if (error) throw error;
}

export function useMembers() {
  return useQuery({ queryKey: queryKeys.members, queryFn: getAll });
}

export function useAddMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: add,
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.members }),
  });
}

export function useUpdateMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<Member> }) => update(id, patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.members }),
  });
}

export function useDeleteMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.members }),
  });
}

// Replace all members (data import)
async function replaceAll(input: Member[]): Promise<Member[]> {
  const sb = getSupabase();
  if (!sb) throw new Error('Supabase not configured');
  // Replace strategy: delete all, then bulk insert
  const del = await sb.from(table).delete().neq('id', '');
  if (del.error) throw del.error;
  if (input.length === 0) return [];
  const { data, error } = await sb.from(table).insert(input).select();
  if (error) throw error;
  return (data || []) as Member[];
}

export function useReplaceMembers() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Member[]) => replaceAll(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.members }),
  });
}
