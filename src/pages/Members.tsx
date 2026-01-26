import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { ServiceGroupBadge } from '@/components/ServiceGroupBadge';
import { MemberFormDialog } from '@/components/MemberFormDialog';
import { Member, ServiceGroup } from '@/types/index';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, 
  Search, 
  MoreHorizontal, 
  Pencil, 
  Trash2, 
  ArrowRightLeft,
  Download,
  Filter,
  Users,
  Baby,
  Sparkles,
  GraduationCap
} from 'lucide-react';
import { toast } from 'sonner';
import { useAddMember, useDeleteMember, useMembers, useUpdateMember } from '@/services/members';

const serviceGroupIcons = {
  children: Baby,
  teens: Sparkles,
  youth: GraduationCap,
  adults: Users,
};

const Members = () => {
  const location = useLocation();
  const { data: members = [], isLoading } = useMembers();
  const addMember = useAddMember();
  const updateMember = useUpdateMember();
  const deleteMember = useDeleteMember();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | ServiceGroup>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | undefined>();
  const [filters, setFilters] = useState<{
    gender: 'all' | 'male' | 'female';
    hasPhone: boolean;
    hasCareGroup: boolean;
  }>({ gender: 'all', hasPhone: false, hasCareGroup: false });

  // Move-to-group dialog state
  const [moveOpen, setMoveOpen] = useState(false);
  const [movingMember, setMovingMember] = useState<Member | null>(null);
  const [targetGroup, setTargetGroup] = useState<ServiceGroup>('adults');

  // Open Add dialog when navigated from QuickAdd
  useEffect(() => {
    // @ts-ignore
    if ((location.state as any)?.openAddDialog) {
      setIsDialogOpen(true);
      // Clear the flag so back/forward doesn't reopen
      window.history.replaceState({}, document.title, location.pathname);
    }
  }, [location]);

  // Sync header (global) search query from URL `q` into page search
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const q = params.get('q') || '';
    setSearchQuery(q);
  }, [location.search]);

  const filteredMembers = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return members.filter((member) => {
      const matchesSearch = member.fullName.toLowerCase().includes(q) ||
        (member.phoneNumber?.toLowerCase().includes(q) ?? false) ||
        (member.careGroup?.toLowerCase().includes(q) ?? false);
      const matchesTab = activeTab === 'all' || member.serviceCategory === activeTab;
      const matchesGender =
        filters.gender === 'all' || (member.gender as any) === filters.gender;
      const matchesHasPhone = !filters.hasPhone || !!member.phoneNumber;
      const matchesHasCareGroup = !filters.hasCareGroup || !!member.careGroup;
      return (
        matchesSearch &&
        matchesTab &&
        matchesGender &&
        matchesHasPhone &&
        matchesHasCareGroup
      );
    });
  }, [members, searchQuery, activeTab]);

  const getCounts = () => {
    return {
      all: members.length,
      children: members.filter(m => m.serviceCategory === 'children').length,
      teens: members.filter(m => m.serviceCategory === 'teens').length,
      youth: members.filter(m => m.serviceCategory === 'youth').length,
      adults: members.filter(m => m.serviceCategory === 'adults').length,
    };
  };

  const counts = getCounts();

  const handleAddMember = (memberData: Partial<Member>) => {
    addMember.mutate(memberData, {
      onSuccess: () => toast.success('Member added successfully'),
      onError: () => toast.error('Failed to add member'),
    });
  };

  const handleEditMember = (memberData: Partial<Member>) => {
    if (!editingMember) return;
    updateMember.mutate({ id: editingMember.id, patch: memberData }, {
      onSuccess: () => toast.success('Member updated successfully'),
      onError: () => toast.error('Failed to update member'),
    });
    setEditingMember(undefined);
  };

  const handleDeleteMember = (id: string) => {
    deleteMember.mutate(id, {
      onSuccess: () => toast.success('Member removed'),
      onError: () => toast.error('Failed to remove member'),
    });
  };

  const openEditDialog = (member: Member) => {
    setEditingMember(member);
    setIsDialogOpen(true);
  };

  const openMoveDialog = (member: Member) => {
    setMovingMember(member);
    setTargetGroup(member.serviceCategory);
    setMoveOpen(true);
  };

  const handleMove = () => {
    if (!movingMember) return;
    if (movingMember.serviceCategory === targetGroup) {
      toast.message('Member already in selected group');
      setMoveOpen(false);
      return;
    }
    updateMember.mutate(
      { id: movingMember.id, patch: { serviceCategory: targetGroup } },
      {
        onSuccess: () => {
          toast.success('Member moved to group');
          setMoveOpen(false);
          setMovingMember(null);
        },
        onError: () => toast.error('Failed to move member'),
      }
    );
  };

  const openAddDialog = () => {
    setEditingMember(undefined);
    setIsDialogOpen(true);
  };

  const handleExport = () => {
    const headers = [
      'Full Name',
      'Gender',
      'Date of Birth',
      'Phone',
      'Parent/Guardian',
      'Service Category',
      'Care Group',
      'Created At',
      'Updated At',
    ];
    const rows = filteredMembers.map((m) => [
      m.fullName,
      m.gender ?? '',
      dobToMonthDay(m.dateOfBirth),
      m.phoneNumber ?? '',
      m.parentGuardian ?? '',
      m.serviceCategory,
      m.careGroup ?? '',
      m.createdAt,
      m.updatedAt,
    ]);
    const csv = [headers, ...rows]
      .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `members-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatBirthday = (dateOfBirth?: string) => {
    if (!dateOfBirth) return '-';
    const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    let m: number | null = null;
    let d: number | null = null;
    if (dateOfBirth.startsWith('--')) {
      const mm = parseInt(dateOfBirth.slice(2, 4), 10);
      const dd = parseInt(dateOfBirth.slice(5, 7), 10);
      if (!isNaN(mm) && !isNaN(dd)) { m = mm; d = dd; }
    } else {
      const dt = new Date(dateOfBirth);
      if (!isNaN(dt.getTime())) { m = dt.getMonth() + 1; d = dt.getDate(); }
    }
    if (!m || !d) return '-';
    return `${monthNames[m-1]} ${d}`;
  };

  const dobToMonthDay = (dateOfBirth?: string) => {
    if (!dateOfBirth) return '';
    if (dateOfBirth.startsWith('--')) return dateOfBirth.slice(2);
    const dt = new Date(dateOfBirth);
    if (isNaN(dt.getTime())) return '';
    const mm = String(dt.getMonth() + 1).padStart(2, '0');
    const dd = String(dt.getDate()).padStart(2, '0');
    return `${mm}-${dd}`;
  };

  return (
    <Layout>
      <div className="space-y-4 lg:space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-display font-semibold tracking-tight">
              Members
            </h1>
            <p className="text-muted-foreground mt-1 text-sm lg:text-base">
              Manage your church members across all service groups.
            </p>
          </div>
          <div className="flex items-center gap-2 lg:gap-3">
            <Button variant="outline" size="sm" className="gap-2" onClick={handleExport}>
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Export</span>
            </Button>
            <Button onClick={openAddDialog} size="sm" className="gap-2">
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add Member</span>
              <span className="sm:hidden">Add</span>
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="overflow-x-auto -mx-4 px-4 lg:mx-0 lg:px-0">
              <TabsList className="bg-transparent inline-flex gap-2">
                <TabsTrigger
                  value="all"
                  className="gap-2 px-3 py-2 text-sm rounded-full border bg-muted/30 hover:bg-muted/50 transition-colors data-[state=active]:bg-primary/10 data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-sm data-[state=active]:ring-2 data-[state=active]:ring-primary/30"
                >
                  <Users className="w-4 h-4" />
                  <span>All</span>
                  <span className="ml-1 inline-flex items-center justify-center min-w-5 h-5 px-1 rounded-full bg-background border text-xs">
                    {counts.all}
                  </span>
                </TabsTrigger>
                <TabsTrigger
                  value="children"
                  className="gap-2 px-3 py-2 text-sm rounded-full border bg-muted/30 hover:bg-muted/50 transition-colors data-[state=active]:bg-primary/10 data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-sm data-[state=active]:ring-2 data-[state=active]:ring-primary/30"
                >
                  <Baby className="w-4 h-4" />
                  <span>Victory Land</span>
                  <span className="ml-1 inline-flex items-center justify-center min-w-5 h-5 px-1 rounded-full bg-background border text-xs">
                    {counts.children}
                  </span>
                </TabsTrigger>
                <TabsTrigger
                  value="teens"
                  className="gap-2 px-3 py-2 text-sm rounded-full border bg-muted/30 hover:bg-muted/50 transition-colors data-[state=active]:bg-primary/10 data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-sm data-[state=active]:ring-2 data-[state=active]:ring-primary/30"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Teens</span>
                  <span className="ml-1 inline-flex items-center justify-center min-w-5 h-5 px-1 rounded-full bg-background border text-xs">
                    {counts.teens}
                  </span>
                </TabsTrigger>
                <TabsTrigger
                  value="youth"
                  className="gap-2 px-3 py-2 text-sm rounded-full border bg-muted/30 hover:bg-muted/50 transition-colors data-[state=active]:bg-primary/10 data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-sm data-[state=active]:ring-2 data-[state=active]:ring-primary/30"
                >
                  <GraduationCap className="w-4 h-4" />
                  <span>Youth</span>
                  <span className="ml-1 inline-flex items-center justify-center min-w-5 h-5 px-1 rounded-full bg-background border text-xs">
                    {counts.youth}
                  </span>
                </TabsTrigger>
                <TabsTrigger
                  value="adults"
                  className="gap-2 px-3 py-2 text-sm rounded-full border bg-muted/30 hover:bg-muted/50 transition-colors data-[state=active]:bg-primary/10 data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-sm data-[state=active]:ring-2 data-[state=active]:ring-primary/30"
                >
                  <Users className="w-4 h-4" />
                  <span>Adults</span>
                  <span className="ml-1 inline-flex items-center justify-center min-w-5 h-5 px-1 rounded-full bg-background border text-xs">
                    {counts.adults}
                  </span>
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="flex items-center gap-2 lg:gap-3">
              <div className="relative flex-1 lg:flex-none">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-full lg:w-64 h-9"
                />
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" className="h-9 w-9" aria-label="Filters">
                    <Filter className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-2 py-1.5 text-xs text-muted-foreground">Gender</div>
                  <DropdownMenuRadioGroup
                    value={filters.gender}
                    onValueChange={(v) => setFilters((f) => ({ ...f, gender: v as any }))}
                  >
                    <DropdownMenuRadioItem value="all">All</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="male">Male</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="female">Female</DropdownMenuRadioItem>
                  </DropdownMenuRadioGroup>
                  <DropdownMenuSeparator />
                  <div className="px-2 py-1.5 text-xs text-muted-foreground">Data</div>
                  <DropdownMenuCheckboxItem
                    checked={filters.hasPhone}
                    onCheckedChange={(c) => setFilters((f) => ({ ...f, hasPhone: !!c }))}
                  >
                    Has phone number
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={filters.hasCareGroup}
                    onCheckedChange={(c) => setFilters((f) => ({ ...f, hasCareGroup: !!c }))}
                  >
                    Has care group
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setFilters({ gender: 'all', hasPhone: false, hasCareGroup: false })}>
                    Reset filters
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <TabsContent value={activeTab} className="mt-4 lg:mt-6">
            {isLoading && (
              <div className="church-card p-8 text-center">
                <Users className="w-12 h-12 mx-auto mb-3 opacity-30 text-muted-foreground" />
                <p className="text-muted-foreground">Loading members...</p>
              </div>
            )}
            {/* Mobile Card View */}
            <div className="lg:hidden space-y-3">
              {filteredMembers.length === 0 ? (
                <div className="church-card p-8 text-center">
                  <Users className="w-12 h-12 mx-auto mb-3 opacity-30 text-muted-foreground" />
                  <p className="text-muted-foreground">No members found</p>
                </div>
              ) : (
                filteredMembers.map((member) => (
                  <div key={member.id} className="church-card p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-sm font-semibold text-primary">
                            {member.fullName.split(' ').map(n => n[0]).join('')}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium">{member.fullName}</p>
                          <p className="text-sm text-muted-foreground">
                            {member.phoneNumber || 'No phone'}
                          </p>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEditDialog(member)}>
                            <Pencil className="w-4 h-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openMoveDialog(member)}>
                            <ArrowRightLeft className="w-4 h-4 mr-2" />
                            Move Group
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => handleDeleteMember(member.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <div className="flex items-center gap-2 mt-3 flex-wrap">
                      <ServiceGroupBadge group={member.serviceCategory} />
                      <span className="text-xs text-muted-foreground">
                        Birthday: {formatBirthday(member.dateOfBirth)}
                      </span>
                      {member.careGroup && (
                        <span className="text-xs text-muted-foreground">
                          • {member.careGroup}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Desktop Table View */}
            <div className="hidden lg:block church-card overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead>Name</TableHead>
                    <TableHead>Gender</TableHead>
                    <TableHead>Birthday</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Service</TableHead>
                    <TableHead>Care Group</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMembers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-12">
                        <div className="text-muted-foreground">
                          <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
                          <p>No members found</p>
                          <p className="text-sm">Try adjusting your search or add a new member</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredMembers.map((member) => (
                      <TableRow key={member.id} className="hover:bg-muted/30">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                              <span className="text-sm font-semibold text-primary">
                                {member.fullName.split(' ').map(n => n[0]).join('')}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium">{member.fullName}</p>
                              {member.parentGuardian && (
                                <p className="text-xs text-muted-foreground">
                                  Guardian: {member.parentGuardian}
                                </p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="capitalize">{member.gender}</TableCell>
                        <TableCell>{formatBirthday(member.dateOfBirth)}</TableCell>
                        <TableCell>{member.phoneNumber || '-'}</TableCell>
                        <TableCell>
                          <ServiceGroupBadge group={member.serviceCategory} />
                        </TableCell>
                        <TableCell>{member.careGroup || '-'}</TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openEditDialog(member)}>
                                <Pencil className="w-4 h-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openMoveDialog(member)}>
                                <ArrowRightLeft className="w-4 h-4 mr-2" />
                                Move to Group
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => handleDeleteMember(member.id)}
                                className="text-destructive"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <MemberFormDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        member={editingMember}
        onSave={editingMember ? handleEditMember : handleAddMember}
      />

      {/* Move to Group Dialog */}
      <Dialog open={moveOpen} onOpenChange={setMoveOpen}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle className="font-display">Move to Group</DialogTitle>
            <DialogDescription>
              Select a target service group for {movingMember?.fullName}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Service Group</p>
              <Select value={targetGroup} onValueChange={(v: ServiceGroup) => setTargetGroup(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="children">Children</SelectItem>
                  <SelectItem value="teens">Teens</SelectItem>
                  <SelectItem value="youth">Youth</SelectItem>
                  <SelectItem value="adults">Adults</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMoveOpen(false)}>Cancel</Button>
            <Button onClick={handleMove}>Move</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default Members;
