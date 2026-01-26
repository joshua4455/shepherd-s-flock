import { cn } from '@/lib/utils';
import { FollowUpStatus, VisitorFollowUpStatus } from '@/types/index';

interface StatusBadgeProps {
  status: FollowUpStatus | VisitorFollowUpStatus;
}

const statusConfig: Record<FollowUpStatus | VisitorFollowUpStatus, { label: string; className: string }> = {
  pending: { 
    label: 'Pending', 
    className: 'bg-amber-50 text-amber-600 border-amber-200' 
  },
  contacted: { 
    label: 'Contacted', 
    className: 'bg-sky-50 text-sky-600 border-sky-200' 
  },
  discipled: { 
    label: 'Discipled', 
    className: 'bg-emerald-50 text-emerald-600 border-emerald-200' 
  },
  converted: { 
    label: 'Converted', 
    className: 'bg-violet-50 text-violet-600 border-violet-200' 
  },
  member: { 
    label: 'Member', 
    className: 'bg-primary/10 text-primary border-primary/20' 
  },
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status];
  
  return (
    <span className={cn(
      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border',
      config.className
    )}>
      {config.label}
    </span>
  );
}
