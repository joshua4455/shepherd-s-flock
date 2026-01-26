import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Visitor } from '@/types/index';
import { queryKeys } from './queryKeys';
import { getSupabase } from '@/lib/supabase';

const table = 'visitors';

async function getAll(): Promise<Visitor[]> {
  const sb = getSupabase();
  if (!sb) throw new Error('Supabase not configured');
  const { data, error } = await sb
    .from(table)
    .select('*')
    .order('createdAt', { ascending: false });
  if (error) throw error;
  return (data || []) as Visitor[];
}

async function add(input: Partial<Visitor>): Promise<Visitor> {
  const sb = getSupabase();
  if (!sb) throw new Error('Supabase not configured');
  const now = new Date().toISOString();
  const entity: Visitor = {
    id: (globalThis.crypto?.randomUUID?.() || Date.now().toString()) as string,
    fullName: input.fullName || 'Unnamed',
    serviceAttended: input.serviceAttended || 'adults',
    phoneNumber: input.phoneNumber,
    email: input.email,
    firstVisitDate: input.firstVisitDate || now.split('T')[0],
    howHeardAboutUs: input.howHeardAboutUs,
    areasOfInterest: input.areasOfInterest,
    followUpStatus: input.followUpStatus ?? 'pending',
    notes: input.notes,
    createdAt: now,
    updatedAt: now,
  };
  const { data, error } = await sb.from(table).insert(entity).select().single();
  if (error) throw error;
  return data as Visitor;
}

async function update(id: string, patch: Partial<Visitor>): Promise<Visitor> {
  const sb = getSupabase();
  if (!sb) throw new Error('Supabase not configured');
  const { data, error } = await sb
    .from(table)
    .update({ ...patch, updatedAt: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as Visitor;
}

async function remove(id: string): Promise<void> {
  const sb = getSupabase();
  if (!sb) throw new Error('Supabase not configured');
  const { error } = await sb.from(table).delete().eq('id', id);
  if (error) throw error;
}

export function useVisitors() {
  return useQuery({ queryKey: queryKeys.visitors, queryFn: getAll });
}

export function useAddVisitor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: add,
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.visitors }),
  });
}

export function useUpdateVisitor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<Visitor> }) => update(id, patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.visitors }),
  });
}

export function useDeleteVisitor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.visitors }),
  });
}

// Replace all visitors (data import)
async function replaceAll(input: Visitor[]): Promise<Visitor[]> {
  const sb = getSupabase();
  if (!sb) throw new Error('Supabase not configured');
  const del = await sb.from(table).delete().neq('id', '');
  if (del.error) throw del.error;
  if (input.length === 0) return [];
  const { data, error } = await sb.from(table).insert(input).select();
  if (error) throw error;
  return (data || []) as Visitor[];
}

export function useReplaceVisitors() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Visitor[]) => replaceAll(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.visitors }),
  });
}
