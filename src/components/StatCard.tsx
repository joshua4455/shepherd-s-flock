import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: 'default' | 'primary' | 'secondary' | 'accent';
  className?: string;
}

const variantStyles = {
  default: 'bg-card',
  primary: 'bg-primary/5 border-primary/20',
  secondary: 'bg-secondary/10 border-secondary/20',
  accent: 'bg-accent/10 border-accent/30',
};

const iconStyles = {
  default: 'bg-muted text-muted-foreground',
  primary: 'bg-primary/10 text-primary',
  secondary: 'bg-secondary/20 text-secondary',
  accent: 'bg-accent/20 text-accent-foreground',
};

export function StatCard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  trend,
  variant = 'default',
  className
}: StatCardProps) {
  return (
    <div className={cn('stat-card p-4 lg:p-6', variantStyles[variant], className)}>
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-1 lg:space-y-2 min-w-0">
          <p className="text-xs lg:text-sm font-medium text-muted-foreground truncate">{title}</p>
          <p className="text-xl lg:text-3xl font-display font-semibold tracking-tight">
            {value}
          </p>
          {subtitle && (
            <p className="text-xs lg:text-sm text-muted-foreground truncate">{subtitle}</p>
          )}
          {trend && (
            <p className={cn(
              'text-xs lg:text-sm font-medium',
              trend.isPositive ? 'text-secondary' : 'text-destructive'
            )}>
              {trend.isPositive ? '+' : ''}{trend.value}%
              <span className="hidden sm:inline"> from last month</span>
            </p>
          )}
        </div>
        <div className={cn('p-2 lg:p-3 rounded-lg lg:rounded-xl flex-shrink-0', iconStyles[variant])}>
          <Icon className="w-4 h-4 lg:w-6 lg:h-6" />
        </div>
      </div>
    </div>
  );
}
