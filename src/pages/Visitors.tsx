import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { ServiceGroupBadge } from '@/components/ServiceGroupBadge';
import { Visitor, ServiceGroup } from '@/types/index';
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
  Heart,
  Download,
  Filter,
  UserPlus
} from 'lucide-react';
import { toast } from 'sonner';
import { useAddVisitor, useDeleteVisitor, useUpdateVisitor, useVisitors } from '@/services/visitors';


const Visitors = () => {
  const location = useLocation();
  const { data: visitors = [], isLoading } = useVisitors();
  const addVisitor = useAddVisitor();
  const updateVisitor = useUpdateVisitor();
  const deleteVisitor = useDeleteVisitor();
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<{
    status: 'all' | 'pending' | 'contacted' | 'converted' | 'member';
    service: 'all' | ServiceGroup;
    hasContact: boolean;
  }>({ status: 'all', service: 'all', hasContact: false });
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingVisitor, setEditingVisitor] = useState<Visitor | undefined>();
  const [formData, setFormData] = useState<Partial<Visitor>>({
    fullName: '',
    serviceAttended: 'adults',
    firstVisitDate: new Date().toISOString().split('T')[0],
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

  const filteredVisitors = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return visitors.filter((visitor) => {
      const matchesSearch =
        visitor.fullName.toLowerCase().includes(q) ||
        (visitor.phoneNumber?.toLowerCase().includes(q) ?? false) ||
        (visitor.email?.toLowerCase().includes(q) ?? false) ||
        (visitor.howHeardAboutUs?.toLowerCase().includes(q) ?? false);
      const matchesStatus =
        filters.status === 'all' || (visitor.followUpStatus ?? 'pending') === filters.status;
      const matchesService =
        filters.service === 'all' || visitor.serviceAttended === filters.service;
      const matchesHasContact = !filters.hasContact || !!(visitor.phoneNumber || visitor.email);
      return matchesSearch && matchesStatus && matchesService && matchesHasContact;
    });
  }, [visitors, searchQuery, filters]);

  const handleSave = () => {
    if (!formData.fullName) {
      toast.error('Please enter a name');
      return;
    }

    if (editingVisitor) {
      updateVisitor.mutate({ id: editingVisitor.id, patch: formData }, {
        onSuccess: () => toast.success('Visitor updated successfully'),
        onError: () => toast.error('Failed to update visitor'),
      });
    } else {
      addVisitor.mutate(formData, {
        onSuccess: () => toast.success('New visitor added successfully'),
        onError: () => toast.error('Failed to add visitor'),
      });
    }
    
    setIsDialogOpen(false);
    setEditingVisitor(undefined);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      fullName: '',
      serviceAttended: 'adults',
      firstVisitDate: new Date().toISOString().split('T')[0],
    });
  };

  const handleDelete = (id: string) => {
    deleteVisitor.mutate(id, {
      onSuccess: () => toast.success('Visitor record removed'),
      onError: () => toast.error('Failed to remove visitor'),
    });
  };

  const openEditDialog = (visitor: Visitor) => {
    setEditingVisitor(visitor);
    setFormData(visitor);
    setIsDialogOpen(true);
  };

  const openAddDialog = () => {
    setEditingVisitor(undefined);
    resetForm();
    setIsDialogOpen(true);
  };

  const handleExport = () => {
    const headers = [
      'Full Name',
      'Phone',
      'Email',
      'Service Attended',
      'First Visit Date',
      'How Heard',
      'Areas of Interest',
      'Follow-up',
      'Created At',
      'Updated At',
    ];
    const rows = filteredVisitors.map((v) => [
      v.fullName,
      v.phoneNumber ?? '',
      v.email ?? '',
      v.serviceAttended,
      v.firstVisitDate,
      v.howHeardAboutUs ?? '',
      (v.areasOfInterest ?? []).join('; '),
      v.followUpStatus ?? '',
      v.createdAt,
      v.updatedAt,
    ]);
    const csv = [headers, ...rows]
      .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `visitors-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const promoteToMember = (visitor: Visitor) => {
    toast.success(`${visitor.fullName} has been promoted to member!`);
    handleDelete(visitor.id);
  };

  const promoteToConvert = (visitor: Visitor) => {
    toast.success(`${visitor.fullName} has been recorded as a new convert!`);
    handleDelete(visitor.id);
  };


  return (
    <Layout>
      <div className="space-y-4 lg:space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-display font-semibold tracking-tight">
              Visitors
            </h1>
            <p className="text-muted-foreground mt-1 text-sm lg:text-base">
              Record first-time guests at your church.
            </p>
          </div>
          <div className="flex items-center gap-2 lg:gap-3">
            <Button variant="outline" size="sm" className="gap-2" onClick={handleExport}>
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Export</span>
            </Button>
            <Button onClick={openAddDialog} size="sm" className="gap-2">
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add Visitor</span>
              <span className="sm:hidden">Add</span>
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 lg:gap-4">
          <div className="church-card p-3 lg:p-4 flex items-center gap-2 lg:gap-4">
            <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-lg bg-accent/20 flex items-center justify-center">
              <span className="text-accent-foreground font-semibold text-sm lg:text-base">
                {visitors.length}
              </span>
            </div>
            <div className="min-w-0">
              <p className="font-medium text-sm lg:text-base truncate">Total</p>
              <p className="text-xs lg:text-sm text-muted-foreground hidden sm:block">All time</p>
            </div>
          </div>
          <div className="church-card p-3 lg:p-4 flex items-center gap-2 lg:gap-4">
            <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <span className="text-primary font-semibold text-sm lg:text-base">
                {visitors.filter(v => {
                  const visitDate = new Date(v.firstVisitDate);
                  const now = new Date();
                  return visitDate.getMonth() === now.getMonth() && visitDate.getFullYear() === now.getFullYear();
                }).length}
              </span>
            </div>
            <div className="min-w-0">
              <p className="font-medium text-sm lg:text-base truncate">Month</p>
              <p className="text-xs lg:text-sm text-muted-foreground hidden sm:block">New visitors</p>
            </div>
          </div>
          <div className="church-card p-3 lg:p-4 flex items-center gap-2 lg:gap-4">
            <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-lg bg-secondary/20 flex items-center justify-center">
              <span className="text-secondary font-semibold text-sm lg:text-base">
                {visitors.filter(v => {
                  const visitDate = new Date(v.firstVisitDate);
                  const now = new Date();
                  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                  return visitDate >= weekAgo;
                }).length}
              </span>
            </div>
            <div className="min-w-0">
              <p className="font-medium text-sm lg:text-base truncate">Week</p>
              <p className="text-xs lg:text-sm text-muted-foreground hidden sm:block">Recent guests</p>
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
                <DropdownMenuRadioItem value="converted">Converted</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="member">Member</DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
              <DropdownMenuSeparator />
              <div className="px-2 py-1.5 text-xs text-muted-foreground">Service</div>
              <DropdownMenuRadioGroup
                value={filters.service}
                onValueChange={(v) => setFilters((f) => ({ ...f, service: v as any }))}
              >
                <DropdownMenuRadioItem value="all">All</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="children">Victory Land</DropdownMenuRadioItem>
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
            <UserPlus className="w-12 h-12 mx-auto mb-3 opacity-30 text-muted-foreground" />
            <p className="text-muted-foreground">Loading visitors...</p>
          </div>
        )}
        {/* Mobile Card View */}
        <div className="lg:hidden space-y-3">
          {filteredVisitors.length === 0 ? (
            <div className="church-card p-8 text-center">
              <UserPlus className="w-12 h-12 mx-auto mb-3 opacity-30 text-muted-foreground" />
              <p className="text-muted-foreground">No visitors found</p>
            </div>
          ) : (
            filteredVisitors.map((visitor) => (
              <div key={visitor.id} className="church-card p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
                      <span className="text-sm font-semibold text-accent-foreground">
                        {visitor.fullName.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium">{visitor.fullName}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(visitor.firstVisitDate).toLocaleDateString()}
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
                      <DropdownMenuItem onClick={() => openEditDialog(visitor)}>
                        <Pencil className="w-4 h-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => promoteToConvert(visitor)}>
                        <Heart className="w-4 h-4 mr-2" />
                        Mark as Convert
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => promoteToMember(visitor)}>
                        <UserCheck className="w-4 h-4 mr-2" />
                        Promote to Member
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => handleDelete(visitor.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="flex items-center gap-2 mt-3 flex-wrap">
                  <ServiceGroupBadge group={visitor.serviceAttended} />
                  {visitor.phoneNumber && (
                    <span className="text-xs text-muted-foreground">
                      {visitor.phoneNumber}
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
                <TableHead>First Visit</TableHead>
                <TableHead>Service</TableHead>
                <TableHead>How They Found Us</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredVisitors.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12">
                    <div className="text-muted-foreground">
                      <UserPlus className="w-12 h-12 mx-auto mb-3 opacity-30" />
                      <p>No visitors found</p>
                      <p className="text-sm">Add a new visitor to get started</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredVisitors.map((visitor) => (
                  <TableRow key={visitor.id} className="hover:bg-muted/30">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-accent/20 flex items-center justify-center">
                          <span className="text-sm font-semibold text-accent-foreground">
                            {visitor.fullName.split(' ').map(n => n[0]).join('')}
                          </span>
                        </div>
                        <p className="font-medium">{visitor.fullName}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {visitor.phoneNumber && <p>{visitor.phoneNumber}</p>}
                        {visitor.email && <p className="text-muted-foreground">{visitor.email}</p>}
                        {!visitor.phoneNumber && !visitor.email && <p className="text-muted-foreground">-</p>}
                      </div>
                    </TableCell>
                    <TableCell>
                      {new Date(visitor.firstVisitDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <ServiceGroupBadge group={visitor.serviceAttended} />
                    </TableCell>
                    <TableCell>{visitor.howHeardAboutUs || '-'}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEditDialog(visitor)}>
                            <Pencil className="w-4 h-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => promoteToConvert(visitor)}>
                            <Heart className="w-4 h-4 mr-2" />
                            Mark as Convert
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => promoteToMember(visitor)}>
                            <UserCheck className="w-4 h-4 mr-2" />
                            Promote to Member
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => handleDelete(visitor.id)}
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
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">
              {editingVisitor ? 'Edit Visitor' : 'Add New Visitor'}
            </DialogTitle>
            <DialogDescription>
              {editingVisitor 
                ? 'Update the visitor information below.' 
                : 'Record a first-time guest at your church.'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
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
                    <SelectItem value="children">Victory Land</SelectItem>
                    <SelectItem value="teens">Teen Service</SelectItem>
                    <SelectItem value="youth">Youth Service</SelectItem>
                    <SelectItem value="adults">Main Service</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="firstVisitDate">First Visit Date *</Label>
                <Input
                  id="firstVisitDate"
                  type="date"
                  value={formData.firstVisitDate || ''}
                  onChange={(e) => setFormData({ ...formData, firstVisitDate: e.target.value })}
                />
              </div>

              <div className="col-span-2 space-y-2">
                <Label htmlFor="howHeardAboutUs">How They Found Us</Label>
                <Input
                  id="howHeardAboutUs"
                  value={formData.howHeardAboutUs || ''}
                  onChange={(e) => setFormData({ ...formData, howHeardAboutUs: e.target.value })}
                  placeholder="e.g., Friend invitation, Social media, etc."
                />
              </div>



              <div className="col-span-2 space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes || ''}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Additional notes about this visitor..."
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
              {editingVisitor ? 'Save Changes' : 'Add Visitor'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default Visitors;
