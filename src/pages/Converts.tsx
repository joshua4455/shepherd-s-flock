import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { StatusBadge } from '@/components/StatusBadge';
import { ServiceGroupBadge } from '@/components/ServiceGroupBadge';
import { NewConvert, FollowUpStatus, ServiceGroup } from '@/types/index';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
  Plus, 
  Search, 
  MoreHorizontal, 
  Pencil, 
  Trash2, 
  UserCheck,
  Download,
  Filter,
  Heart
} from 'lucide-react';
import { toast } from 'sonner';
import { useAddConvert, useConverts, useDeleteConvert, useUpdateConvert } from '@/services/converts';

const Converts = () => {
  const location = useLocation();
  const { data: converts = [], isLoading } = useConverts();
  const addConvert = useAddConvert();
  const updateConvert = useUpdateConvert();
  const deleteConvert = useDeleteConvert();
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingConvert, setEditingConvert] = useState<NewConvert | undefined>();
  const [filters, setFilters] = useState<{
    status: 'all' | FollowUpStatus;
    service: 'all' | ServiceGroup;
    hasContact: boolean;
  }>({ status: 'all', service: 'all', hasContact: false });
  const [formData, setFormData] = useState<Partial<NewConvert>>({
    fullName: '',
    serviceAttended: 'adults',
    followUpStatus: 'pending',
    dateOfConversion: new Date().toISOString().split('T')[0],
  });

  // Open Add dialog when navigated from QuickAdd
  useEffect(() => {
    // @ts-ignore
    if ((location.state as any)?.openAddDialog) {
      setIsDialogOpen(true);
      window.history.replaceState({}, document.title, location.pathname);
    }
  }, [location]);

  // Sync global header search from URL param `q`
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const q = params.get('q') || '';
    setSearchQuery(q);
  }, [location.search]);

  const filteredConverts = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return converts.filter((convert) => {
      const matchesSearch =
        convert.fullName.toLowerCase().includes(q) ||
        (convert.phoneNumber?.toLowerCase().includes(q) ?? false) ||
        (convert.email?.toLowerCase().includes(q) ?? false) ||
        (convert.assignedLeader?.toLowerCase().includes(q) ?? false);
      const matchesStatus =
        filters.status === 'all' || convert.followUpStatus === filters.status;
      const matchesService =
        filters.service === 'all' || convert.serviceAttended === filters.service;
      const matchesHasContact = !filters.hasContact || !!(convert.phoneNumber || convert.email);
      return matchesSearch && matchesStatus && matchesService && matchesHasContact;
    });
  }, [converts, searchQuery, filters]);

  const handleSave = () => {
    if (!formData.fullName) {
      toast.error('Please enter a name');
      return;
    }

    if (editingConvert) {
      updateConvert.mutate({ id: editingConvert.id, patch: formData }, {
        onSuccess: () => toast.success('Convert updated successfully'),
        onError: () => toast.error('Failed to update convert'),
      });
    } else {
      addConvert.mutate(formData, {
        onSuccess: () => toast.success('New convert added successfully'),
        onError: () => toast.error('Failed to add convert'),
      });
    }
    
    setIsDialogOpen(false);
    setEditingConvert(undefined);
    setFormData({
      fullName: '',
      serviceAttended: 'adults',
      followUpStatus: 'pending',
      dateOfConversion: new Date().toISOString().split('T')[0],
    });
  };

  const handleDelete = (id: string) => {
    deleteConvert.mutate(id, {
      onSuccess: () => toast.success('Convert record removed'),
      onError: () => toast.error('Failed to remove convert'),
    });
  };

  const openEditDialog = (convert: NewConvert) => {
    setEditingConvert(convert);
    setFormData(convert);
    setIsDialogOpen(true);
  };

  const openAddDialog = () => {
    setEditingConvert(undefined);
    setFormData({
      fullName: '',
      serviceAttended: 'adults',
      followUpStatus: 'pending',
      dateOfConversion: new Date().toISOString().split('T')[0],
    });
    setIsDialogOpen(true);
  };

  const handleExport = () => {
    const headers = [
      'Full Name',
      'Phone',
      'Email',
      'Service',
      'Date of Conversion',
      'Follow-up Status',
      'Assigned Leader',
      'Created At',
      'Updated At',
    ];
    const rows = filteredConverts.map((c) => [
      c.fullName,
      c.phoneNumber ?? '',
      c.email ?? '',
      c.serviceAttended,
      c.dateOfConversion,
      c.followUpStatus,
      c.assignedLeader ?? '',
      c.createdAt,
      c.updatedAt,
    ]);
    const csv = [headers, ...rows]
      .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `converts-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const promoteToMember = (convert: NewConvert) => {
    toast.success(`${convert.fullName} has been promoted to member!`);
    handleDelete(convert.id);
  };

  return (
    <Layout>
      <div className="space-y-4 lg:space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-display font-semibold tracking-tight">
              New Converts
            </h1>
            <p className="text-muted-foreground mt-1 text-sm lg:text-base">
              Track and follow up with new believers.
            </p>
          </div>
          <div className="flex items-center gap-2 lg:gap-3">
            <Button variant="outline" size="sm" className="gap-2" onClick={handleExport}>
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Export</span>
            </Button>
            <Button onClick={openAddDialog} size="sm" className="gap-2">
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add Convert</span>
              <span className="sm:hidden">Add</span>
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 lg:gap-4">
          <div className="church-card p-3 lg:p-4 flex items-center gap-2 lg:gap-4">
            <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-lg bg-amber-100 flex items-center justify-center">
              <span className="text-amber-700 font-semibold text-sm lg:text-base">
                {converts.filter(c => c.followUpStatus === 'pending').length}
              </span>
            </div>
            <div className="min-w-0">
              <p className="font-medium text-sm lg:text-base truncate">Pending</p>
              <p className="text-xs lg:text-sm text-muted-foreground hidden sm:block">Need follow-up</p>
            </div>
          </div>
          <div className="church-card p-3 lg:p-4 flex items-center gap-2 lg:gap-4">
            <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <span className="text-blue-700 font-semibold text-sm lg:text-base">
                {converts.filter(c => c.followUpStatus === 'contacted').length}
              </span>
            </div>
            <div className="min-w-0">
              <p className="font-medium text-sm lg:text-base truncate">Contacted</p>
              <p className="text-xs lg:text-sm text-muted-foreground hidden sm:block">In progress</p>
            </div>
          </div>
          <div className="church-card p-3 lg:p-4 flex items-center gap-2 lg:gap-4">
            <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
              <span className="text-emerald-700 font-semibold text-sm lg:text-base">
                {converts.filter(c => c.followUpStatus === 'discipled').length}
              </span>
            </div>
            <div className="min-w-0">
              <p className="font-medium text-sm lg:text-base truncate">Discipled</p>
              <p className="text-xs lg:text-sm text-muted-foreground hidden sm:block">Completed</p>
            </div>
          </div>
        </div>

        {/* Search & Filter */}
        <div className="flex items-center gap-2 lg:gap-3">
          <div className="relative flex-1 lg:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-9"
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="h-9 w-9" aria-label="Filters">
                <Filter className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="px-2 py-1.5 text-xs text-muted-foreground">Follow-up Status</div>
              <DropdownMenuRadioGroup
                value={filters.status}
                onValueChange={(v) => setFilters((f) => ({ ...f, status: v as any }))}
              >
                <DropdownMenuRadioItem value="all">All</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="pending">Pending</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="contacted">Contacted</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="discipled">Discipled</DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
              <DropdownMenuSeparator />
              <div className="px-2 py-1.5 text-xs text-muted-foreground">Service</div>
              <DropdownMenuRadioGroup
                value={filters.service}
                onValueChange={(v) => setFilters((f) => ({ ...f, service: v as any }))}
              >
                <DropdownMenuRadioItem value="all">All</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="children">Children</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="teens">Teens</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="youth">Youth</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="adults">Adults</DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem
                checked={filters.hasContact}
                onCheckedChange={(c) => setFilters((f) => ({ ...f, hasContact: !!c }))}
              >
                Has phone or email
              </DropdownMenuCheckboxItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setFilters({ status: 'all', service: 'all', hasContact: false })}>
                Reset filters
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {isLoading && (
          <div className="church-card p-8 text-center">
            <Heart className="w-12 h-12 mx-auto mb-3 opacity-30 text-muted-foreground" />
            <p className="text-muted-foreground">Loading converts...</p>
          </div>
        )}
        {/* Mobile Card View */}
        <div className="lg:hidden space-y-3">
          {filteredConverts.length === 0 ? (
            <div className="church-card p-8 text-center">
              <Heart className="w-12 h-12 mx-auto mb-3 opacity-30 text-muted-foreground" />
              <p className="text-muted-foreground">No converts found</p>
            </div>
          ) : (
            filteredConverts.map((convert) => (
              <div key={convert.id} className="church-card p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-secondary/20 flex items-center justify-center">
                      <span className="text-sm font-semibold text-secondary">
                        {convert.fullName.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium">{convert.fullName}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(convert.dateOfConversion).toLocaleDateString()}
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
                      <DropdownMenuItem onClick={() => openEditDialog(convert)}>
                        <Pencil className="w-4 h-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => promoteToMember(convert)}>
                        <UserCheck className="w-4 h-4 mr-2" />
                        Promote to Member
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => handleDelete(convert.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="flex items-center gap-2 mt-3 flex-wrap">
                  <StatusBadge status={convert.followUpStatus} />
                  {/* Inline status updater (mobile card) */}
                  <Select
                    value={convert.followUpStatus}
                    onValueChange={(value: FollowUpStatus) =>
                      updateConvert.mutate(
                        { id: convert.id, patch: { followUpStatus: value } },
                        {
                          onSuccess: () => toast.success('Status updated'),
                          onError: () => toast.error('Failed to update status'),
                        }
                      )
                    }
                  >
                    <SelectTrigger className="h-8 w-[140px]">
                      <SelectValue placeholder="Update status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="contacted">Contacted</SelectItem>
                      <SelectItem value="discipled">Discipled</SelectItem>
                    </SelectContent>
                  </Select>
                  <ServiceGroupBadge group={convert.serviceAttended} />
                  {convert.assignedLeader && (
                    <span className="text-xs text-muted-foreground">
                      • {convert.assignedLeader}
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Desktop Table */}
        <div className="hidden lg:block church-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead>Name</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Service</TableHead>
                <TableHead>Date of Conversion</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Assigned Leader</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredConverts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12">
                    <div className="text-muted-foreground">
                      <Heart className="w-12 h-12 mx-auto mb-3 opacity-30" />
                      <p>No converts found</p>
                      <p className="text-sm">Add a new convert to get started</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredConverts.map((convert) => (
                  <TableRow key={convert.id} className="hover:bg-muted/30">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-secondary/20 flex items-center justify-center">
                          <span className="text-sm font-semibold text-secondary">
                            {convert.fullName.split(' ').map(n => n[0]).join('')}
                          </span>
                        </div>
                        <p className="font-medium">{convert.fullName}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {convert.phoneNumber && <p>{convert.phoneNumber}</p>}
                        {convert.email && <p className="text-muted-foreground">{convert.email}</p>}
                        {!convert.phoneNumber && !convert.email && <p className="text-muted-foreground">-</p>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <ServiceGroupBadge group={convert.serviceAttended} />
                    </TableCell>
                    <TableCell>
                      {new Date(convert.dateOfConversion).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <StatusBadge status={convert.followUpStatus} />
                        {/* Inline status updater (desktop/table) */}
                        <Select
                          value={convert.followUpStatus}
                          onValueChange={(value: FollowUpStatus) =>
                            updateConvert.mutate(
                              { id: convert.id, patch: { followUpStatus: value } },
                              {
                                onSuccess: () => toast.success('Status updated'),
                                onError: () => toast.error('Failed to update status'),
                              }
                            )
                          }
                        >
                          <SelectTrigger className="h-8 w-[140px]">
                            <SelectValue placeholder="Update status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="contacted">Contacted</SelectItem>
                            <SelectItem value="discipled">Discipled</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </TableCell>
                    <TableCell>{convert.assignedLeader || '-'}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEditDialog(convert)}>
                            <Pencil className="w-4 h-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => promoteToMember(convert)}>
                            <UserCheck className="w-4 h-4 mr-2" />
                            Promote to Member
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => handleDelete(convert.id)}
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
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">
              {editingConvert ? 'Edit Convert' : 'Add New Convert'}
            </DialogTitle>
            <DialogDescription>
              {editingConvert 
                ? 'Update the convert information below.' 
                : 'Record a new believer who accepted Christ.'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-2">
                <Label htmlFor="fullName">Full Name *</Label>
                <Input
                  id="fullName"
                  value={formData.fullName || ''}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="Enter full name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phoneNumber">Phone Number</Label>
                <Input
                  id="phoneNumber"
                  value={formData.phoneNumber || ''}
                  onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                  placeholder="+1 (555) 000-0000"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email || ''}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="email@example.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="serviceAttended">Service Attended *</Label>
                <Select
                  value={formData.serviceAttended}
                  onValueChange={(value: ServiceGroup) => 
                    setFormData({ ...formData, serviceAttended: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select service" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="children">Children Service</SelectItem>
                    <SelectItem value="teens">Teen Service</SelectItem>
                    <SelectItem value="youth">Youth Service</SelectItem>
                    <SelectItem value="adults">Main Service</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dateOfConversion">Date of Conversion *</Label>
                <Input
                  id="dateOfConversion"
                  type="date"
                  value={formData.dateOfConversion || ''}
                  onChange={(e) => setFormData({ ...formData, dateOfConversion: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="followUpStatus">Follow-up Status *</Label>
                <Select
                  value={formData.followUpStatus}
                  onValueChange={(value: FollowUpStatus) => 
                    setFormData({ ...formData, followUpStatus: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="contacted">Contacted</SelectItem>
                    <SelectItem value="discipled">Discipled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="assignedLeader">Assigned Leader</Label>
                <Input
                  id="assignedLeader"
                  value={formData.assignedLeader || ''}
                  onChange={(e) => setFormData({ ...formData, assignedLeader: e.target.value })}
                  placeholder="e.g., Pastor James"
                />
              </div>

              <div className="col-span-2 space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes || ''}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Additional notes about this convert..."
                  rows={3}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              {editingConvert ? 'Save Changes' : 'Add Convert'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default Converts;
