import { useState } from 'react';
import { Member, ServiceGroup } from '@/types/index';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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

interface MemberFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member?: Member;
  onSave: (member: Partial<Member>) => void;
}

const serviceGroups: { value: ServiceGroup; label: string }[] = [
  { value: 'children', label: 'Victory Land' },
  { value: 'teens', label: 'Teen Service' },
  { value: 'youth', label: 'Youth Service' },
  { value: 'adults', label: 'Main (Adult) Service' },
];

export function MemberFormDialog({ 
  open, 
  onOpenChange, 
  member, 
  onSave 
}: MemberFormDialogProps) {
  const [formData, setFormData] = useState<Partial<Member>>(
    member || {
      fullName: '',
      gender: 'male',
      serviceCategory: 'adults',
    }
  );
  const [parentError, setParentError] = useState<string | null>(null);
  const [dobMonth, setDobMonth] = useState<string>(() => {
    if (!member?.dateOfBirth) return '';
    if (member.dateOfBirth.startsWith('--')) return member.dateOfBirth.slice(2,4);
    const dt = new Date(member.dateOfBirth);
    return isNaN(dt.getTime()) ? '' : String(dt.getMonth()+1).padStart(2,'0');
  });
  const [dobDay, setDobDay] = useState<string>(() => {
    if (!member?.dateOfBirth) return '';
    if (member.dateOfBirth.startsWith('--')) return member.dateOfBirth.slice(5,7);
    const dt = new Date(member.dateOfBirth);
    return isNaN(dt.getTime()) ? '' : String(dt.getDate()).padStart(2,'0');
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const needsParent = formData.serviceCategory === 'children' || formData.serviceCategory === 'teens';
    if (needsParent && !formData.parentGuardian?.trim()) {
      setParentError('Parent/Guardian is required for Children and Teens');
      return;
    }
    setParentError(null);
    const dob = dobMonth && dobDay ? `--${dobMonth}-${dobDay}` : undefined;
    onSave({ ...formData, dateOfBirth: dob });
    onOpenChange(false);
  };

  const isEdit = !!member;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">
            {isEdit ? 'Edit Member' : 'Add New Member'}
          </DialogTitle>
          <DialogDescription>
            {isEdit 
              ? 'Update the member information below.' 
              : 'Fill in the details to add a new member to the church.'}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-2">
              <Label htmlFor="fullName">Full Name *</Label>
              <Input
                id="fullName"
                value={formData.fullName || ''}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                placeholder="Enter full name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="gender">Gender *</Label>
              <Select
                value={formData.gender}
                onValueChange={(value: 'male' | 'female') => 
                  setFormData({ ...formData, gender: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Date of Birth (Month & Day)</Label>
              <div className="grid grid-cols-2 gap-2">
                <Select
                  value={dobMonth}
                  onValueChange={(v: string) => { setDobMonth(v); }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Month" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="01">Jan</SelectItem>
                    <SelectItem value="02">Feb</SelectItem>
                    <SelectItem value="03">Mar</SelectItem>
                    <SelectItem value="04">Apr</SelectItem>
                    <SelectItem value="05">May</SelectItem>
                    <SelectItem value="06">Jun</SelectItem>
                    <SelectItem value="07">Jul</SelectItem>
                    <SelectItem value="08">Aug</SelectItem>
                    <SelectItem value="09">Sep</SelectItem>
                    <SelectItem value="10">Oct</SelectItem>
                    <SelectItem value="11">Nov</SelectItem>
                    <SelectItem value="12">Dec</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={dobDay}
                  onValueChange={(v: string) => { setDobDay(v); }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Day" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 31 }, (_, i) => {
                      const d = String(i+1).padStart(2,'0');
                      return (
                        <SelectItem key={d} value={d}>{parseInt(d,10)}</SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="col-span-2 space-y-2">
              <Label htmlFor="phoneNumber">Phone Number</Label>
              <Input
                id="phoneNumber"
                value={formData.phoneNumber || ''}
                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                placeholder="+1 (555) 000-0000"
              />
            </div>

            <div className="col-span-2 space-y-2">
              <Label htmlFor="serviceCategory">Service Category *</Label>
              <Select
                value={formData.serviceCategory}
                onValueChange={(value: ServiceGroup) => 
                  setFormData({ ...formData, serviceCategory: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select service" />
                </SelectTrigger>
                <SelectContent>
                  {serviceGroups.map((group) => (
                    <SelectItem key={group.value} value={group.value}>
                      {group.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {(formData.serviceCategory === 'children' || formData.serviceCategory === 'teens') && (
              <div className="col-span-2 space-y-2">
                <Label htmlFor="parentGuardian">Parent/Guardian *</Label>
                <Input
                  id="parentGuardian"
                  value={formData.parentGuardian || ''}
                  onChange={(e) => {
                    setFormData({ ...formData, parentGuardian: e.target.value });
                    if (parentError && e.target.value.trim()) setParentError(null);
                  }}
                  aria-invalid={!!parentError}
                  className={parentError ? 'border-destructive focus-visible:ring-destructive' : ''}
                  placeholder="Parent or guardian name"
                  required
                />
                {parentError && (
                  <p className="text-xs text-destructive">{parentError}</p>
                )}
              </div>
            )}

            <div className="col-span-2 space-y-2">
              <Label htmlFor="careGroup">Care Group</Label>
              <Input
                id="careGroup"
                value={formData.careGroup || ''}
                onChange={(e) => setFormData({ ...formData, careGroup: e.target.value })}
                placeholder="e.g., Grace Group"
              />
            </div>

            <div className="col-span-2 space-y-2">
              <Label htmlFor="notes">Notes (Admin Only)</Label>
              <Textarea
                id="notes"
                value={formData.notes || ''}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Internal notes about this member..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={(formData.serviceCategory === 'children' || formData.serviceCategory === 'teens') && !(formData.parentGuardian && formData.parentGuardian.trim())}>
              {isEdit ? 'Save Changes' : 'Add Member'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
