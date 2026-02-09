import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getSupabase } from '@/lib/supabase';
import { delay, queryKeys } from './queryKeys';

export type UserRole = 'Admin' | 'Leader';
export interface ProfileRow {
  id: string;          // auth.users.id
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

export type CreateUserWithLoginInput = { name: string; email: string; role: UserRole };
export type CreateUserWithLoginResult = { userId: string; temporaryPassword: string };
export type DeleteUserAdminInput = { userId: string };

const table = (import.meta as any).env?.VITE_SUPABASE_PROFILES_TABLE || 'profiles';

async function listProfiles(): Promise<ProfileRow[]> {
  const sb = getSupabase();
  if (!sb) throw new Error('Supabase not configured');
  const { data, error } = await sb.from(table).select('*');
  if (error) throw error;
  const rows = (data || []) as any[];
  // Map common column variants to our ProfileRow shape
  return rows.map((r) => ({
    id: r.id,
    email: r.email,
    name: r.name ?? r.fullName ?? r.full_name ?? r.display_name ?? '-',
    role: (r.role as UserRole) ?? 'Leader',
    createdAt: r.createdAt ?? r.created_at ?? new Date().toISOString(),
    updatedAt: r.updatedAt ?? r.updated_at ?? new Date().toISOString(),
  }));
}

async function createProfile(input: { id?: string; name: string; email: string; role: UserRole }): Promise<ProfileRow> {
  const sb = getSupabase();
  if (!sb) throw new Error('Supabase not configured');
  const row = { id: input.id, name: input.name, email: input.email, role: input.role } as any;
  const { data, error } = await sb.from(table).insert(row).select().single();
  if (error) throw error;
  return data as ProfileRow;
}

async function updateProfile(id: string, patch: Partial<ProfileRow>): Promise<ProfileRow> {
  const sb = getSupabase();
  if (!sb) throw new Error('Supabase not configured');
  const { data, error } = await sb
    .from(table)
    .update({ ...patch })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as ProfileRow;
}

async function removeProfile(id: string): Promise<void> {
  const sb = getSupabase();
  if (!sb) throw new Error('Supabase not configured');
  // Guard: do not delete Admin
  const { data: existing, error: selErr } = await sb.from(table).select('*').eq('id', id).maybeSingle();
  if (selErr) throw selErr;
  const role = (existing?.role as UserRole | undefined)?.toString().toLowerCase();
  if (role === 'admin') {
    throw new Error('Admin accounts cannot be deleted');
  }
  const { error } = await sb.from(table).delete().eq('id', id);
  if (error) throw error;
}

async function inviteByEmail(email: string): Promise<void> {
  const sb = getSupabase();
  if (!sb) throw new Error('Supabase not configured');
  const { error } = await sb.auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.origin } });
  if (error) throw error;
}

async function createUserWithLogin(input: CreateUserWithLoginInput): Promise<CreateUserWithLoginResult> {
  const sb = getSupabase();
  if (!sb) throw new Error('Supabase not configured');
  const fn: any = (sb as any).functions;
  if (!fn?.invoke) throw new Error('Supabase Functions client not available');

  const { data: sessionData, error: sessionErr } = await sb.auth.getSession();
  if (sessionErr) throw sessionErr;
  const accessToken = sessionData?.session?.access_token;
  if (!accessToken) throw new Error('You must be logged in to create users');

  try {
    const payloadPart = accessToken.split('.')[1] || '';
    const payloadJson = JSON.parse(atob(payloadPart.replace(/-/g, '+').replace(/_/g, '/')));
    console.info('[supabase] access token iss:', payloadJson?.iss);
  } catch {
    // ignore decode errors
  }

  const { data, error } = await fn.invoke('create_user', {
    body: {
      name: input.name,
      email: input.email,
      role: input.role,
    },
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (error) throw error;
  return data as CreateUserWithLoginResult;
}

async function deleteUserAdmin(input: DeleteUserAdminInput): Promise<void> {
  const sb = getSupabase();
  if (!sb) throw new Error('Supabase not configured');
  const fn: any = (sb as any).functions;
  if (!fn?.invoke) throw new Error('Supabase Functions client not available');

  const { data: sessionData, error: sessionErr } = await sb.auth.getSession();
  if (sessionErr) throw sessionErr;
  const accessToken = sessionData?.session?.access_token;
  if (!accessToken) throw new Error('You must be logged in to delete users');

  const { error } = await fn.invoke('delete_user', {
    body: { userId: input.userId },
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (error) throw error;
}

export function useProfiles() {
  return useQuery({ queryKey: queryKeys.profiles, queryFn: listProfiles });
}

export function useAddProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createProfile,
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.profiles }),
  });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<ProfileRow> }) => updateProfile(id, patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.profiles }),
  });
}

export function useDeleteProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => removeProfile(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.profiles }),
  });
}

export function useInviteUser() {
  return useMutation({ mutationFn: (email: string) => inviteByEmail(email) });
}

export function useCreateUserWithLogin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createUserWithLogin,
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.profiles }),
  });
}

export function useDeleteUserAdmin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: DeleteUserAdminInput) => deleteUserAdmin(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.profiles }),
  });
}
