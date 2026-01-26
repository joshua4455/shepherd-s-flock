import { cn } from '@/lib/utils';
import { ServiceGroup } from '@/types/index';
import { Baby, GraduationCap, Sparkles, Users } from 'lucide-react';

interface ServiceGroupBadgeProps {
  group: ServiceGroup;
  showIcon?: boolean;
}

const groupConfig: Record<ServiceGroup, { 
  label: string; 
  className: string;
  icon: typeof Baby;
}> = {
  children: { 
    label: 'Victory Land', 
    className: 'bg-pink-100 text-pink-700 border-pink-200',
    icon: Baby,
  },
  teens: { 
    label: 'Teens', 
    className: 'bg-cyan-100 text-cyan-700 border-cyan-200',
    icon: Sparkles,
  },
  youth: { 
    label: 'Youth', 
    className: 'bg-violet-100 text-violet-700 border-violet-200',
    icon: GraduationCap,
  },
  adults: { 
    label: 'Adults', 
    className: 'bg-slate-100 text-slate-700 border-slate-200',
    icon: Users,
  },
};

export function ServiceGroupBadge({ group, showIcon = false }: ServiceGroupBadgeProps) {
  const config = groupConfig[group];
  const Icon = config.icon;
  
  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border',
      config.className
    )}>
      {showIcon && <Icon className="w-3 h-3" />}
      {config.label}
    </span>
  );
}
