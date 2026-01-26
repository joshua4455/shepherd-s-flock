import { useEffect, useState } from 'react';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { 
  Church, 
  User, 
  Bell, 
  Shield, 
  Database,
  Palette,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useMembers, useReplaceMembers } from '@/services/members';
import { useVisitors, useReplaceVisitors } from '@/services/visitors';
import { useConverts, useReplaceConverts } from '@/services/converts';
import { useProfiles, useAddProfile, useUpdateProfile, useDeleteProfile, useInviteUser } from '@/services/users';
import { getSupabase } from '@/lib/supabase';
import { useNotificationPrefs, useUpdateNotificationPrefs } from '@/services/notifications';

type Role = 'Admin' | 'Leader';

interface UserRow {
  id: string;
  initials: string;
  name: string;
  email: string;
  role: Role;
}

const Settings = () => {
  // Users state (Supabase profiles when available, fallback local demo)
  const sb = getSupabase();
  const { data: profiles = [], isLoading: profilesLoading } = useProfiles();
  const addProfile = useAddProfile();
  const updateProfile = useUpdateProfile();
  const deleteProfile = useDeleteProfile();
  const inviteUser = useInviteUser();
  const [users, setUsers] = useState<UserRow[]>([
    { id: '1', initials: 'JD', name: 'John Doe', email: 'john@gracechurch.org', role: 'Admin' },
    { id: '2', initials: 'SJ', name: 'Sarah Johnson', email: 'sarah@gracechurch.org', role: 'Leader' },
  ]);
  const supabaseConnected = !!sb;
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserRow | null>(null);
  const [newUser, setNewUser] = useState<{ name: string; email: string; role: Role }>({ name: '', email: '', role: 'Leader' });

  // Notification preferences (Supabase per-user with local fallback)
  const { data: notifData } = useNotificationPrefs();
  const updateNotif = useUpdateNotificationPrefs();
  const [notif, setNotif] = useState<{ visitorAlerts: boolean; followupReminders: boolean; weeklyReports: boolean }>(
    { visitorAlerts: true, followupReminders: true, weeklyReports: false }
  );

  useEffect(() => {
    if (notifData) setNotif(notifData);
  }, [notifData]);

  const persistNotif = (next: typeof notif) => {
    setNotif(next);
    updateNotif.mutate(next);
  };

  // ----- User management (Supabase-aware) -----
  const computedUsers: UserRow[] = sb
    ? (profiles as any[]).map((p) => ({
        id: p.id,
        initials: (p.name || p.email).split(' ').map((n: string) => n[0]).join('').slice(0,2).toUpperCase(),
        name: p.name || '-',
        email: p.email,
        role: (p.role as Role) || 'Leader',
      }))
    : users;

  const handleAddUser = async () => {
    const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!newUser.name || !newUser.email) { toast.error('Please provide name and email'); return; }
    if (!isValidEmail(newUser.email)) { toast.error('Please enter a valid email'); return; }

    if (sb) {
      try {
        await inviteUser.mutateAsync(newUser.email);
        await addProfile.mutateAsync({ name: newUser.name, email: newUser.email, role: newUser.role });
        toast.success('Invitation sent and profile created');
        setAddOpen(false);
        setNewUser({ name: '', email: '', role: 'Leader' });
      } catch (e: any) {
        toast.error(e?.message || 'Failed to invite user');
      }
      return;
    }

    if (users.some(u => u.email.toLowerCase() === newUser.email.toLowerCase())) { toast.error('A user with this email already exists'); return; }
    const initials = newUser.name.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase();
    const row: UserRow = { id: Date.now().toString(), initials, name: newUser.name, email: newUser.email, role: newUser.role };
    setUsers((u) => [row, ...u]);
    setAddOpen(false);
    setNewUser({ name: '', email: '', role: 'Leader' });
    toast.success('User added');
  };
  const canonDob = (val: string | undefined): string | undefined => {
    const v = (val || '').trim();
    if (!v) return undefined;
    // Accept MM-DD or --MM-DD or full ISO date; store as --MM-DD
    if (/^--\d{2}-\d{2}$/.test(v)) return v;
    if (/^\d{2}-\d{2}$/.test(v)) return `--${v}`;
    const dt = new Date(v);
    if (!isNaN(dt.getTime())) {
      const mm = String(dt.getMonth()+1).padStart(2,'0');
      const dd = String(dt.getDate()).padStart(2,'0');
      return `--${mm}-${dd}`;
    }
    return undefined;
  };

  // CSV export helpers and handler
  const toCSV = (headers: string[], rows: (string | number)[][]) => {
    const esc = (v: any) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    return [headers.map(esc).join(','), ...rows.map(r => r.map(esc).join(','))].join('\n');
  };

  const handleExportCSV = () => {
    try {
      const memberHeaders = ['Full Name','Gender','Date of Birth','Phone','Parent/Guardian','Service Category','Care Group','Created At','Updated At'];
      const serviceLabel = (g: any) => g === 'children' ? 'Victory Land' : (g ? String(g)[0].toUpperCase() + String(g).slice(1) : '');
      const dobMMDD = (dob?: string) => {
        if (!dob) return '';
        if (dob.startsWith('--')) return dob.slice(2);
        const dt = new Date(dob);
        if (isNaN(dt.getTime())) return '';
        return String(dt.getMonth()+1).padStart(2,'0') + '-' + String(dt.getDate()).padStart(2,'0');
      };
      const memberRows = members.map((m: any) => [m.fullName,m.gender ?? '',dobMMDD(m.dateOfBirth),m.phoneNumber ?? '',m.parentGuardian ?? '',serviceLabel(m.serviceCategory),m.careGroup ?? '',m.createdAt ?? '',m.updatedAt ?? '']);
      const visitorHeaders = ['Full Name','Phone','Email','Service Attended','First Visit Date','How Heard','Areas of Interest','Follow-up','Created At','Updated At'];
      const visitorRows = visitors.map((v: any) => [v.fullName,v.phoneNumber ?? '',v.email ?? '',serviceLabel(v.serviceAttended),v.firstVisitDate ?? '',v.howHeardAboutUs ?? '',(v.areasOfInterest ?? []).join('; '),v.followUpStatus ?? '',v.createdAt ?? '',v.updatedAt ?? '']);
      const convertHeaders = ['Full Name','Phone','Email','Service','Date of Conversion','Follow-up Status','Assigned Leader','Created At','Updated At'];
      const convertRows = converts.map((c: any) => [c.fullName,c.phoneNumber ?? '',c.email ?? '',serviceLabel(c.serviceAttended),c.dateOfConversion ?? '',c.followUpStatus ?? '',c.assignedLeader ?? '',c.createdAt ?? '',c.updatedAt ?? '']);

      const files = [
        { name: 'members', content: toCSV(memberHeaders, memberRows) },
        { name: 'visitors', content: toCSV(visitorHeaders, visitorRows) },
        { name: 'converts', content: toCSV(convertHeaders, convertRows) },
      ];
      files.forEach(f => {
        const blob = new Blob([f.content], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `church-${f.name}-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
      });
      toast.success('CSV exports downloaded');
    } catch {
      toast.error('Failed to export CSV');
    }
  };

  // CSV import (choose entity)
  const [importOpen, setImportOpen] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importEntity, setImportEntity] = useState<'members' | 'visitors' | 'converts'>('members');
  const [importMode, setImportMode] = useState<'replace' | 'merge'>('replace');
  const [importLoading, setImportLoading] = useState(false);
  // Column mapping mode
  const [mapEnabled, setMapEnabled] = useState(false);
  const [parsedHeaders, setParsedHeaders] = useState<string[]>([]);
  const [parsedRows, setParsedRows] = useState<string[][]>([]);
  const [columnMap, setColumnMap] = useState<Record<string, string>>({});
  const parseCSV = (text: string) => {
    const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n').filter(Boolean);
    if (lines.length === 0) return { headers: [], rows: [] };
    const parseLine = (line: string) => {
      const out: string[] = [];
      let cur = '';
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"') {
          if (inQuotes && line[i+1] === '"') { cur += '"'; i++; }
          else inQuotes = !inQuotes;
        } else if (ch === ',' && !inQuotes) {
          out.push(cur); cur = '';
        } else {
          cur += ch;
        }
      }
      out.push(cur);
      return out;
    };
    const headers = parseLine(lines[0]).map(h => h.trim());
    const rows = lines.slice(1).map(l => parseLine(l));
    return { headers, rows };
  };
  // Canonicalizers
  const canonService = (val: string | undefined): 'children' | 'teens' | 'youth' | 'adults' => {
    const v = (val || '').toString().trim().toLowerCase();
    if (['child', 'children', 'kids', 'kid', 'victory land', 'victoryland', 'victory'].includes(v)) return 'children';
    if (['teen', 'teens'].includes(v)) return 'teens';
    if (['youth', 'young', 'young adults'].includes(v)) return 'youth';
    return 'adults';
  };
  const canonFollowUp = (val: string | undefined, entity: 'visitors' | 'converts'): string => {
    const v = (val || '').toString().trim().toLowerCase();
    if (['contact', 'contacted'].includes(v)) return 'contacted';
    if (entity === 'visitors') {
      if (['convert', 'converted'].includes(v)) return 'converted';
      if (['member', 'membership'].includes(v)) return 'member';
      return 'pending';
    }
    // converts page supports 'discipled' in this app
    if (['disciple', 'discipled', 'disicpled'].includes(v)) return 'discipled';
    return 'pending';
  };

  const handleImportCSV = async (file: File) => {
    setImportError(null);
    setImportLoading(true);
    try {
      const text = await file.text();
      const { headers, rows } = parseCSV(text);
      if (!headers.length) throw new Error('Empty CSV');
      if (mapEnabled) {
        // Enter mapping flow: store parsed and build default mapping by best-effort matching
        setParsedHeaders(headers);
        setParsedRows(rows);
        const requiredByEntity: Record<typeof importEntity, string[]> = {
          members: ['Full Name','Gender','Date of Birth','Phone','Service Category','Care Group','Created At','Updated At'],
          visitors: ['Full Name','Phone','Email','Service Attended','First Visit Date','How Heard','Areas of Interest','Follow-up','Created At','Updated At'],
          converts: ['Full Name','Phone','Email','Service','Date of Conversion','Follow-up Status','Assigned Leader','Created At','Updated At'],
        };
        const required = requiredByEntity[importEntity];
        const auto: Record<string,string> = {};
        required.forEach(req => {
          const found = headers.find(h => h.trim().toLowerCase() === req.trim().toLowerCase())
            || headers.find(h => h.toLowerCase().includes(req.split(' ')[0].toLowerCase()));
          if (found) auto[req] = found;
        });
        setColumnMap(auto);
        // Stop here; user will click Apply after mapping
        return;
      }
      // Strict header validation per entity
      const requiredByEntity: Record<typeof importEntity, string[]> = {
        members: ['Full Name','Gender','Date of Birth','Phone','Service Category','Care Group','Created At','Updated At'],
        visitors: ['Full Name','Phone','Email','Service Attended','First Visit Date','How Heard','Areas of Interest','Follow-up','Created At','Updated At'],
        converts: ['Full Name','Phone','Email','Service','Date of Conversion','Follow-up Status','Assigned Leader','Created At','Updated At'],
      };
      const missing = requiredByEntity[importEntity].filter(h => !headers.includes(h));
      if (missing.length) {
        throw new Error(`Missing required headers: ${missing.join(', ')}`);
      }

      if (importEntity === 'members') {
        const mapped = rows.map((r) => ({
          id: Date.now().toString() + Math.random(),
          fullName: r[headers.indexOf('Full Name')] || 'Unnamed',
          gender: r[headers.indexOf('Gender')] || undefined,
          dateOfBirth: canonDob(r[headers.indexOf('Date of Birth')]),
          phoneNumber: r[headers.indexOf('Phone')] || undefined,
          parentGuardian: headers.includes('Parent/Guardian') ? (r[headers.indexOf('Parent/Guardian')] || undefined) : undefined,
          serviceCategory: canonService(r[headers.indexOf('Service Category')] as any),
          careGroup: r[headers.indexOf('Care Group')] || undefined,
          createdAt: r[headers.indexOf('Created At')] || new Date().toISOString(),
          updatedAt: r[headers.indexOf('Updated At')] || new Date().toISOString(),
        }));
        const finalPayload = importMode === 'replace'
          ? mapped
          : (() => {
              // merge by email or phone or name as last resort
              const seen = new Set<string>();
              const key = (m: any) => (m.email?.toLowerCase() || '') + '|' + (m.phoneNumber || '') + '|' + m.fullName.toLowerCase();
              const out: any[] = [];
              [...(members as any[]), ...mapped as any[]].forEach((m) => {
                const k = key(m);
                if (!seen.has(k)) { seen.add(k); out.push(m); }
              });
              return out;
            })();
        await replaceMembers.mutateAsync(finalPayload as any);
      } else if (importEntity === 'visitors') {
        const mapped = rows.map((r) => ({
          id: Date.now().toString() + Math.random(),
          fullName: r[headers.indexOf('Full Name')] || 'Unnamed',
          phoneNumber: r[headers.indexOf('Phone')] || undefined,
          email: r[headers.indexOf('Email')] || undefined,
          serviceAttended: canonService(r[headers.indexOf('Service Attended')] as any),
          firstVisitDate: r[headers.indexOf('First Visit Date')] || new Date().toISOString().split('T')[0],
          howHeardAboutUs: r[headers.indexOf('How Heard')] || undefined,
          areasOfInterest: (r[headers.indexOf('Areas of Interest')] || '').split(';').map(s => s.trim()).filter(Boolean),
          followUpStatus: canonFollowUp(r[headers.indexOf('Follow-up')] as any, 'visitors'),
          createdAt: r[headers.indexOf('Created At')] || new Date().toISOString(),
          updatedAt: r[headers.indexOf('Updated At')] || new Date().toISOString(),
        }));
        const finalPayload = importMode === 'replace'
          ? mapped
          : (() => {
              const seen = new Set<string>();
              const key = (v: any) => (v.email?.toLowerCase() || '') + '|' + (v.phoneNumber || '') + '|' + v.fullName.toLowerCase();
              const out: any[] = [];
              [...(visitors as any[]), ...mapped as any[]].forEach((v) => {
                const k = key(v);
                if (!seen.has(k)) { seen.add(k); out.push(v); }
              });
              return out;
            })();
        await replaceVisitors.mutateAsync(finalPayload as any);
      } else {
        const mapped = rows.map((r) => ({
          id: Date.now().toString() + Math.random(),
          fullName: r[headers.indexOf('Full Name')] || 'Unnamed',
          phoneNumber: r[headers.indexOf('Phone')] || undefined,
          email: r[headers.indexOf('Email')] || undefined,
          serviceAttended: canonService(r[headers.indexOf('Service')] as any),
          dateOfConversion: r[headers.indexOf('Date of Conversion')] || new Date().toISOString().split('T')[0],
          followUpStatus: canonFollowUp(r[headers.indexOf('Follow-up Status')] as any, 'converts'),
          assignedLeader: r[headers.indexOf('Assigned Leader')] || undefined,
          createdAt: r[headers.indexOf('Created At')] || new Date().toISOString(),
          updatedAt: r[headers.indexOf('Updated At')] || new Date().toISOString(),
        }));
        const finalPayload = importMode === 'replace'
          ? mapped
          : (() => {
              const seen = new Set<string>();
              const key = (c: any) => (c.email?.toLowerCase() || '') + '|' + (c.phoneNumber || '') + '|' + c.fullName.toLowerCase();
              const out: any[] = [];
              [...(converts as any[]), ...mapped as any[]].forEach((c) => {
                const k = key(c);
                if (!seen.has(k)) { seen.add(k); out.push(c); }
              });
              return out;
            })();
        await replaceConverts.mutateAsync(finalPayload as any);
      }
      toast.success('CSV imported');
      setImportOpen(false);
    } catch (e: any) {
      setImportError(e?.message || 'Failed to import CSV');
    }
    finally {
      setImportLoading(false);
    }
  };

  // Apply import using current mapping state
  const applyMappedImport = async () => {
    setImportError(null);
    setImportLoading(true);
    try {
      const headers = parsedHeaders;
      const rows = parsedRows;
      if (!headers.length) throw new Error('No CSV parsed. Please upload a CSV.');
      const requiredByEntity: Record<typeof importEntity, string[]> = {
        members: ['Full Name','Gender','Date of Birth','Phone','Service Category','Care Group','Created At','Updated At'],
        visitors: ['Full Name','Phone','Email','Service Attended','First Visit Date','How Heard','Areas of Interest','Follow-up','Created At','Updated At'],
        converts: ['Full Name','Phone','Email','Service','Date of Conversion','Follow-up Status','Assigned Leader','Created At','Updated At'],
      };
      const required = requiredByEntity[importEntity];
      const missing = required.filter(r => !columnMap[r]);
      if (missing.length) throw new Error(`Please map all required fields: ${missing.join(', ')}`);

      const idx = (req: string) => headers.indexOf(columnMap[req]);

      if (importEntity === 'members') {
        const mapped = rows.map((r) => ({
          id: Date.now().toString() + Math.random(),
          fullName: r[idx('Full Name')] || 'Unnamed',
          gender: r[idx('Gender')] || undefined,
          dateOfBirth: canonDob(r[idx('Date of Birth')]),
          phoneNumber: r[idx('Phone')] || undefined,
          parentGuardian: columnMap['Parent/Guardian'] ? r[idx('Parent/Guardian')] || undefined : undefined,
          serviceCategory: canonService(r[idx('Service Category')] as any),
          careGroup: r[idx('Care Group')] || undefined,
          createdAt: r[idx('Created At')] || new Date().toISOString(),
          updatedAt: r[idx('Updated At')] || new Date().toISOString(),
        }));
        const finalPayload = importMode === 'replace'
          ? mapped
          : (() => {
              const seen = new Set<string>();
              const key = (m: any) => (m.email?.toLowerCase() || '') + '|' + (m.phoneNumber || '') + '|' + m.fullName.toLowerCase();
              const out: any[] = [];
              [...(members as any[]), ...mapped as any[]].forEach((m) => { const k = key(m); if (!seen.has(k)) { seen.add(k); out.push(m); } });
              return out;
            })();
        await replaceMembers.mutateAsync(finalPayload as any);
      } else if (importEntity === 'visitors') {
        const mapped = rows.map((r) => ({
          id: Date.now().toString() + Math.random(),
          fullName: r[idx('Full Name')] || 'Unnamed',
          phoneNumber: r[idx('Phone')] || undefined,
          email: r[idx('Email')] || undefined,
          serviceAttended: canonService(r[idx('Service Attended')] as any),
          firstVisitDate: r[idx('First Visit Date')] || new Date().toISOString().split('T')[0],
          howHeardAboutUs: r[idx('How Heard')] || undefined,
          areasOfInterest: (r[idx('Areas of Interest')] || '').split(';').map(s => s.trim()).filter(Boolean),
          followUpStatus: canonFollowUp(r[idx('Follow-up')] as any, 'visitors'),
          createdAt: r[idx('Created At')] || new Date().toISOString(),
          updatedAt: r[idx('Updated At')] || new Date().toISOString(),
        }));
        const finalPayload = importMode === 'replace'
          ? mapped
          : (() => {
              const seen = new Set<string>();
              const key = (v: any) => (v.email?.toLowerCase() || '') + '|' + (v.phoneNumber || '') + '|' + v.fullName.toLowerCase();
              const out: any[] = [];
              [...(visitors as any[]), ...mapped as any[]].forEach((v) => { const k = key(v); if (!seen.has(k)) { seen.add(k); out.push(v); } });
              return out;
            })();
        await replaceVisitors.mutateAsync(finalPayload as any);
      } else {
        const mapped = rows.map((r) => ({
          id: Date.now().toString() + Math.random(),
          fullName: r[idx('Full Name')] || 'Unnamed',
          phoneNumber: r[idx('Phone')] || undefined,
          email: r[idx('Email')] || undefined,
          serviceAttended: canonService(r[idx('Service')] as any),
          dateOfConversion: r[idx('Date of Conversion')] || new Date().toISOString().split('T')[0],
          followUpStatus: canonFollowUp(r[idx('Follow-up Status')] as any, 'converts'),
          assignedLeader: r[idx('Assigned Leader')] || undefined,
          createdAt: r[idx('Created At')] || new Date().toISOString(),
          updatedAt: r[idx('Updated At')] || new Date().toISOString(),
        }));
        const finalPayload = importMode === 'replace'
          ? mapped
          : (() => {
              const seen = new Set<string>();
              const key = (c: any) => (c.email?.toLowerCase() || '') + '|' + (c.phoneNumber || '') + '|' + c.fullName.toLowerCase();
              const out: any[] = [];
              [...(converts as any[]), ...mapped as any[]].forEach((c) => { const k = key(c); if (!seen.has(k)) { seen.add(k); out.push(c); } });
              return out;
            })();
        await replaceConverts.mutateAsync(finalPayload as any);
      }
      toast.success('CSV imported');
      setImportOpen(false);
      setMapEnabled(false);
      setParsedHeaders([]);
      setParsedRows([]);
      setColumnMap({});
    } catch (e: any) {
      setImportError(e?.message || 'Failed to import CSV');
    } finally {
      setImportLoading(false);
    }
  };

  

  // Data export (members, converts, visitors)
  const { data: members = [] } = useMembers();
  const { data: visitors = [] } = useVisitors();
  const { data: converts = [] } = useConverts();
  const replaceMembers = useReplaceMembers();
  const replaceVisitors = useReplaceVisitors();
  const replaceConverts = useReplaceConverts();

  const handleExportData = () => {
    try {
      const payload = {
        exportedAt: new Date().toISOString(),
        members,
        visitors,
        converts,
      };
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `church-data-export-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Export downloaded');
    } catch (e) {
      toast.error('Failed to export data');
    }
  };

  return (
    <Layout>
      <div className="space-y-4 lg:space-y-6 animate-fade-in max-w-4xl">
        {/* Header */}
        <div>
          <h1 className="text-2xl lg:text-3xl font-display font-semibold tracking-tight">
            Settings
          </h1>
          <p className="text-muted-foreground mt-1 text-sm lg:text-base">
            Manage your church platform settings and preferences.
          </p>
          <div className="mt-2">
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${
                supabaseConnected
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}
            >
              {supabaseConnected ? 'Supabase connected' : 'Mock mode (no Supabase env)'}
            </span>
          </div>
        </div>

        {/* Church Info removed as requested */}

        {/* User Management */}
        <div className="church-card p-4 lg:p-6 space-y-4 lg:space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-secondary/20 flex items-center justify-center">
              <User className="w-5 h-5 text-secondary" />
            </div>
            <div>
              <h2 className="font-display font-semibold text-base lg:text-lg">User Management</h2>
              <p className="text-xs lg:text-sm text-muted-foreground">Manage admin and leader accounts</p>
            </div>
          </div>
          
          <Separator />
          
          <div className="space-y-3 lg:space-y-4">
            {computedUsers.map((u) => (
              <div key={u.id} className="flex items-center justify-between p-3 lg:p-4 bg-muted/30 rounded-lg gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="font-semibold text-primary text-sm">{u.initials}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-sm lg:text-base truncate flex items-center gap-2">
                      <span className="truncate">{u.name}</span>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${
                          u.role === 'Admin'
                            ? 'bg-red-50 text-red-700 border-red-200'
                            : 'bg-blue-50 text-blue-700 border-blue-200'
                        }`}
                      >
                        {u.role}
                      </span>
                    </p>
                    <p className="text-xs lg:text-sm text-muted-foreground truncate">{u.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => { setEditingUser(u); setEditOpen(true); }}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={(u.role || '').toLowerCase() === 'admin'}
                    title={(u.role || '').toLowerCase() === 'admin' ? 'Admin accounts cannot be deleted' : undefined}
                    onClick={async () => {
                      if ((u.role || '').toLowerCase() === 'admin') { toast.error('Admin accounts cannot be deleted'); return; }
                      if (sb) {
                        try { await deleteProfile.mutateAsync(u.id); toast.success('User deleted'); } catch (e: any) { toast.error(e?.message || 'Delete failed'); }
                      } else {
                        setUsers(prev => prev.filter(x => x.id !== u.id)); toast.success('User removed');
                      }
                    }}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <Button variant="outline" size="sm" onClick={() => setAddOpen(true)}>Add New User</Button>
        </div>

        {/* Notifications */}
        <div className="church-card p-4 lg:p-6 space-y-4 lg:space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center">
              <Bell className="w-5 h-5 text-accent-foreground" />
            </div>
            <div>
              <h2 className="font-display font-semibold text-base lg:text-lg">Notifications</h2>
              <p className="text-xs lg:text-sm text-muted-foreground">Configure notification preferences</p>
            </div>
          </div>
          
          <Separator />
          
          <div className="space-y-3 lg:space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="font-medium text-sm lg:text-base">New Visitor Alerts</p>
                <p className="text-xs lg:text-sm text-muted-foreground">Get notified when a new visitor is added</p>
              </div>
              <Switch
                checked={notif.visitorAlerts}
                onCheckedChange={(c) => {
                  const next = { ...notif, visitorAlerts: !!c };
                  persistNotif(next);
                  toast.success(c ? 'Visitor alerts enabled' : 'Visitor alerts disabled');
                }}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="font-medium text-sm lg:text-base">Follow-up Reminders</p>
                <p className="text-xs lg:text-sm text-muted-foreground">Receive reminders for pending follow-ups</p>
              </div>
              <Switch
                checked={notif.followupReminders}
                onCheckedChange={(c) => {
                  const next = { ...notif, followupReminders: !!c };
                  persistNotif(next);
                  toast.success(c ? 'Follow-up reminders enabled' : 'Follow-up reminders disabled');
                }}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="font-medium text-sm lg:text-base">Weekly Reports</p>
                <p className="text-xs lg:text-sm text-muted-foreground">Get weekly summary reports via email</p>
              </div>
              <Switch
                checked={notif.weeklyReports}
                onCheckedChange={(c) => {
                  const next = { ...notif, weeklyReports: !!c };
                  persistNotif(next);
                  toast.success(c ? 'Weekly reports enabled' : 'Weekly reports disabled');
                }}
              />
            </div>
          </div>
        </div>

        {/* Data & Security */}
        <div className="church-card p-4 lg:p-6 space-y-4 lg:space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="font-display font-semibold text-base lg:text-lg">Data & Security</h2>
              <p className="text-xs lg:text-sm text-muted-foreground">Manage data and security settings</p>
            </div>
          </div>
          
          <Separator />
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:gap-4">
            <Button variant="outline" className="gap-2 justify-start h-auto p-3 lg:p-4" onClick={handleExportData}>
              <Database className="w-5 h-5 flex-shrink-0" />
              <div className="text-left min-w-0">
                <p className="font-medium text-sm lg:text-base">Export Data</p>
                <p className="text-xs lg:text-sm text-muted-foreground">Download all church data</p>
              </div>
            </Button>
            <Button variant="outline" className="gap-2 justify-start h-auto p-3 lg:p-4" onClick={handleExportCSV}>
              <Database className="w-5 h-5 flex-shrink-0" />
              <div className="text-left min-w-0">
                <p className="font-medium text-sm lg:text-base">Export CSV</p>
                <p className="text-xs lg:text-sm text-muted-foreground">Download CSV files for entities</p>
              </div>
            </Button>
            <Button variant="outline" className="gap-2 justify-start h-auto p-3 lg:p-4" onClick={() => {
              // bundle templates in one ZIP-like approach by triggering three downloads
              const download = (name: string, headers: string[]) => {
                const content = headers.join(',') + '\n';
                const blob = new Blob([content], { type: 'text/csv' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url; a.download = `template-${name}.csv`; a.click(); URL.revokeObjectURL(url);
              };
              download('members',["Full Name","Gender","Date of Birth","Phone","Parent/Guardian","Service Category","Care Group","Created At","Updated At"]);
              download('visitors',["Full Name","Phone","Email","Service Attended","First Visit Date","How Heard","Areas of Interest","Follow-up","Created At","Updated At"]);
              download('converts',["Full Name","Phone","Email","Service","Date of Conversion","Follow-up Status","Assigned Leader","Created At","Updated At"]);
              toast.success('CSV templates downloaded');
            }}>
              <Database className="w-5 h-5 flex-shrink-0" />
              <div className="text-left min-w-0">
                <p className="font-medium text-sm lg:text-base">Download CSV Templates</p>
                <p className="text-xs lg:text-sm text-muted-foreground">Blank headers for each entity</p>
              </div>
            </Button>
            <Button variant="outline" className="gap-2 justify-start h-auto p-3 lg:p-4" onClick={() => setImportOpen(true)}>
              <Database className="w-5 h-5 flex-shrink-0" />
              <div className="text-left min-w-0">
                <p className="font-medium text-sm lg:text-base">Import Data (CSV)</p>
                <p className="text-xs lg:text-sm text-muted-foreground">Replace data from CSV</p>
              </div>
            </Button>
            <Button variant="outline" className="gap-2 justify-start h-auto p-3 lg:p-4" onClick={() => toast.message('Theme customization (coming soon)')}>
              <Palette className="w-5 h-5 flex-shrink-0" />
              <div className="text-left min-w-0">
                <p className="font-medium text-sm lg:text-base">Customize Theme</p>
                <p className="text-xs lg:text-sm text-muted-foreground">Personalize the look and feel</p>
              </div>
            </Button>
          </div>
        </div>
      </div>

      {/* Add User Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="font-display">Add New User</DialogTitle>
            <DialogDescription>Invite a new admin or leader to your church workspace.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-2">
                <Label htmlFor="userName">Full Name</Label>
                <Input id="userName" value={newUser.name} onChange={(e) => setNewUser({ ...newUser, name: e.target.value })} placeholder="e.g., Mary Smith" />
              </div>
              <div className="col-span-2 space-y-2">
                <Label htmlFor="userEmail">Email</Label>
                <Input id="userEmail" type="email" value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} placeholder="email@example.com" />
              </div>
              <div className="col-span-2 space-y-2">
                <Label>Role</Label>
                <Select value={newUser.role} onValueChange={(v: Role) => setNewUser({ ...newUser, role: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Admin">Admin</SelectItem>
                    <SelectItem value="Leader">Leader</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button onClick={handleAddUser}>Add User</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="font-display">Edit User</DialogTitle>
            <DialogDescription>Update user details.</DialogDescription>
          </DialogHeader>
          {editingUser && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-2">
                  <Label htmlFor="editUserName">Full Name</Label>
                  <Input id="editUserName" value={editingUser.name} onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })} />
                </div>
                <div className="col-span-2 space-y-2">
                  <Label htmlFor="editUserEmail">Email</Label>
                  <Input id="editUserEmail" type="email" value={editingUser.email} onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })} />
                </div>
                <div className="col-span-2 space-y-2">
                  <Label>Role</Label>
                  <Select value={editingUser.role} onValueChange={(v: Role) => setEditingUser({ ...editingUser, role: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Admin">Admin</SelectItem>
                      <SelectItem value="Leader">Leader</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button onClick={async () => {
              if (!editingUser) return;
              const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
              if (!editingUser.name || !editingUser.email) { toast.error('Please provide name and email'); return; }
              if (!isValidEmail(editingUser.email)) { toast.error('Please enter a valid email address'); return; }
              if (!sb) {
                if (users.some(u => u.email.toLowerCase() === editingUser.email.toLowerCase() && u.id !== editingUser.id)) { toast.error('A user with this email already exists'); return; }
                const initials = editingUser.name.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase();
                setUsers(prev => prev.map(u => u.id === editingUser.id ? { ...editingUser, initials } : u));
                toast.success('User updated');
                setEditOpen(false);
                return;
              }
              try {
                await updateProfile.mutateAsync({ id: editingUser.id, patch: { name: editingUser.name, email: editingUser.email, role: editingUser.role } });
                toast.success('User updated');
                setEditOpen(false);
              } catch (e: any) {
                toast.error(e?.message || 'Update failed');
              }
            }}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import Data (CSV) Dialog */}
      <Dialog open={importOpen} onOpenChange={setImportOpen}>
        <DialogContent className="sm|max-w-[520px]">
          <DialogHeader>
            <DialogTitle className="font-display">Import Church Data (CSV)</DialogTitle>
            <DialogDescription>Upload a CSV file to replace one entity's data.</DialogDescription>
          </DialogHeader>
          {importLoading ? (
            <div className="flex items-center gap-3 py-6 text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Importing CSV... This may take a moment.</span>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="space-y-2">
                <Label>Entity</Label>
                <Select value={importEntity} onValueChange={(v: any) => setImportEntity(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="members">Members</SelectItem>
                    <SelectItem value="visitors">Visitors</SelectItem>
                    <SelectItem value="converts">Converts</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Mode</Label>
                <Select value={importMode} onValueChange={(v: any) => setImportMode(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="replace">Replace (overwrite all)</SelectItem>
                    <SelectItem value="merge">Merge (no duplicates)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <input id="mapEnabled" type="checkbox" className="accent-primary" checked={mapEnabled} onChange={(e) => setMapEnabled(e.target.checked)} />
                  <Label htmlFor="mapEnabled">Enable column mapping</Label>
                </div>
              </div>
              <div>
                <Button variant="outline" size="sm" onClick={() => {
                  const headersMap: Record<typeof importEntity, string[]> = {
                    members: ["Full Name","Gender","Date of Birth","Phone","Parent/Guardian","Service Category","Care Group","Created At","Updated At"],
                    visitors: ["Full Name","Phone","Email","Service Attended","First Visit Date","How Heard","Areas of Interest","Follow-up","Created At","Updated At"],
                    converts: ["Full Name","Phone","Email","Service","Date of Conversion","Follow-up Status","Assigned Leader","Created At","Updated At"],
                  } as any;
                  const headers = headersMap[importEntity];
                  const blob = new Blob([headers.join(',') + '\n'], { type: 'text/csv' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url; a.download = `template-${importEntity}.csv`; a.click(); URL.revokeObjectURL(url);
                }}>Download {importEntity} template</Button>
              </div>
              <input
                type="file"
                accept=".csv,text/csv"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleImportCSV(file);
                }}
              />
              {mapEnabled && parsedHeaders.length > 0 && (
                <div className="space-y-3">
                  <Separator />
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Map CSV Columns</p>
                    <p className="text-xs text-muted-foreground">Map your CSV columns to the required fields.</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {(() => {
                        const requiredByEntity: Record<typeof importEntity, string[]> = {
                          // Include Parent/Guardian in the list for convenience, but it's optional in validation
                          members: ['Full Name','Gender','Date of Birth','Phone','Parent/Guardian','Service Category','Care Group','Created At','Updated At'],
                          visitors: ['Full Name','Phone','Email','Service Attended','First Visit Date','How Heard','Areas of Interest','Follow-up','Created At','Updated At'],
                          converts: ['Full Name','Phone','Email','Service','Date of Conversion','Follow-up Status','Assigned Leader','Created At','Updated At'],
                        };
                        const required = requiredByEntity[importEntity];
                        return required.map(req => (
                          <div key={req} className="space-y-1">
                            <Label className="text-xs">{req}</Label>
                            <select
                              className="w-full h-8 rounded-md border bg-background px-2 text-sm"
                              value={columnMap[req] || ''}
                              onChange={(e) => setColumnMap(prev => ({ ...prev, [req]: e.target.value }))}
                            >
                              <option value="">-- Select column --</option>
                              {parsedHeaders.map(h => (
                                <option key={h} value={h}>{h}</option>
                              ))}
                            </select>
                          </div>
                        ));
                      })()}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Preview (first 10 rows)</p>
                    <div className="overflow-auto border rounded-md">
                      <table className="w-full text-xs">
                        <thead className="bg-muted">
                          <tr>
                            {Object.keys(columnMap).filter(k => columnMap[k]).map(req => (
                              <th key={req} className="text-left p-2 whitespace-nowrap">{req}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {parsedRows.slice(0,10).map((r, i) => (
                            <tr key={i} className="border-t">
                              {Object.keys(columnMap).filter(k => columnMap[k]).map(req => (
                                <td key={req} className="p-2 whitespace-nowrap">{r[parsedHeaders.indexOf(columnMap[req])]}</td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button onClick={applyMappedImport} disabled={importLoading}>Apply Import</Button>
                  </div>
                </div>
              )}
              {importError && <p className="text-sm text-red-600">{importError}</p>}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => !importLoading && setImportOpen(false)} disabled={importLoading}>
              {importLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default Settings;
