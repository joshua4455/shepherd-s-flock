import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, Users, Heart, UserPlus, Baby, Sparkles, GraduationCap, Download, Calendar } from 'lucide-react';
import { useMembers } from '@/services/members';
import { useVisitors } from '@/services/visitors';
import { useConverts } from '@/services/converts';

interface AnalyticsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Helper for group card styling
const groupColors: Record<string, string> = {
  children: 'bg-pink-100 text-pink-600',
  teens: 'bg-cyan-100 text-cyan-600',
  youth: 'bg-violet-100 text-violet-600',
  adults: 'bg-slate-100 text-slate-600',
};

export function AnalyticsDialog({ open, onOpenChange }: AnalyticsDialogProps) {
  const { data: members = [] } = useMembers();
  const { data: visitors = [] } = useVisitors();
  const { data: converts = [] } = useConverts();

  // Build last 6 months windows
  const months: { label: string; start: Date; end: Date }[] = Array.from({ length: 6 }).map((_, idx) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (5 - idx), 1);
    d.setHours(0, 0, 0, 0);
    const start = new Date(d);
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
    const label = start.toLocaleDateString('en-US', { month: 'short' });
    return { label, start, end };
  });

  // Compose monthly aggregates from live data
  const monthlyData = months.map((m) => {
    const membersToDate = members.filter((x: any) => new Date(x.createdAt || 0) <= m.end).length;
    const convertsInMonth = converts.filter((x: any) => {
      const dt = new Date(x.dateOfConversion || 0);
      return dt >= m.start && dt <= m.end;
    }).length;
    const visitorsInMonth = visitors.filter((x: any) => {
      const dt = new Date(x.firstVisitDate || 0);
      return dt >= m.start && dt <= m.end;
    }).length;
    return { month: m.label, members: membersToDate, converts: convertsInMonth, visitors: visitorsInMonth };
  });

  const currentMonth = monthlyData[monthlyData.length - 1] || { members: 0, converts: 0, visitors: 0 } as any;
  const previousMonth = monthlyData[monthlyData.length - 2] || currentMonth;

  const memberGrowth = previousMonth.members > 0
    ? (((currentMonth.members - previousMonth.members) / previousMonth.members) * 100).toFixed(1)
    : null;
  const convertGrowth = previousMonth.converts > 0
    ? (((currentMonth.converts - previousMonth.converts) / previousMonth.converts) * 100).toFixed(1)
    : null;
  const visitorGrowth = previousMonth.visitors > 0
    ? (((currentMonth.visitors - previousMonth.visitors) / previousMonth.visitors) * 100).toFixed(1)
    : null;

  const handleExport = () => {
    // Create CSV data
    const csvContent = [
      ['Month', 'Total Members', 'New Converts', 'Visitors'],
      ...monthlyData.map(d => [d.month, d.members, d.converts, d.visitors])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `church-analytics-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* Responsive modal sizing: narrow on mobile, medium on tablets, large on desktop */}
      <DialogContent
        className="w-[95vw] sm:w-auto sm:max-w-2xl md:max-w-3xl lg:max-w-4xl max-h-[88vh] sm:max-h-[85vh] overflow-y-auto p-4 sm:p-6"
      >
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl font-display">Growth Analytics</DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Detailed insights for your church meetings
              </p>
            </div>
            <Button variant="outline" size="sm" className="gap-2" onClick={handleExport}>
              <Download className="w-4 h-4" />
              Export CSV
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-2 sm:mt-4">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
            <div className="church-card p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Users className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Member Growth</p>
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-display font-semibold">{memberGrowth !== null ? `${Number(memberGrowth) >= 0 ? '+' : ''}${memberGrowth}%` : '—'}</span>
                    <TrendingUp className="w-4 h-4 text-emerald-500" />
                  </div>
                </div>
              </div>
            </div>
            <div className="church-card p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-secondary/20 flex items-center justify-center">
                  <Heart className="w-5 h-5 text-secondary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Convert Growth</p>
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-display font-semibold">{convertGrowth !== null ? `${Number(convertGrowth) >= 0 ? '+' : ''}${convertGrowth}%` : '—'}</span>
                    <TrendingUp className="w-4 h-4 text-emerald-500" />
                  </div>
                </div>
              </div>
            </div>
            <div className="church-card p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center">
                  <UserPlus className="w-5 h-5 text-accent-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Visitor Growth</p>
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-display font-semibold">{visitorGrowth !== null ? `${Number(visitorGrowth) >= 0 ? '+' : ''}${visitorGrowth}%` : '—'}</span>
                    <TrendingUp className="w-4 h-4 text-emerald-500" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Monthly Trend */}
          <div className="church-card p-4 sm:p-6">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="w-5 h-5 text-primary" />
              <h3 className="font-display font-semibold">6-Month Trend</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Month</th>
                    <th className="text-right py-3 px-4 font-medium text-muted-foreground">Total Members</th>
                    <th className="text-right py-3 px-4 font-medium text-muted-foreground">New Converts</th>
                    <th className="text-right py-3 px-4 font-medium text-muted-foreground">Visitors</th>
                    <th className="text-right py-3 px-4 font-medium text-muted-foreground">Net Growth</th>
                  </tr>
                </thead>
                <tbody>
                  {monthlyData.map((month, index) => {
                    const prevMembers = index > 0 ? monthlyData[index - 1].members : month.members;
                    const growth = month.members - prevMembers;
                    return (
                      <tr key={month.month} className="border-b border-border/50 hover:bg-muted/30">
                        <td className="py-3 px-4 font-medium">{month.month} 2024</td>
                        <td className="py-3 px-4 text-right">{month.members}</td>
                        <td className="py-3 px-4 text-right text-secondary">{month.converts}</td>
                        <td className="py-3 px-4 text-right text-accent-foreground">{month.visitors}</td>
                        <td className="py-3 px-4 text-right">
                          {index > 0 && (
                            <span className={`inline-flex items-center gap-1 ${growth >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                              {growth >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                              {growth >= 0 ? '+' : ''}{growth}
                            </span>
                          )}
                          {index === 0 && <span className="text-muted-foreground">—</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Group Breakdown */}
          <div className="church-card p-4 sm:p-6">
            <h3 className="font-display font-semibold mb-4">Growth by Service Group</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
              {[
                { key: 'children', name: 'Children', icon: Baby },
                { key: 'teens', name: 'Teens', icon: Sparkles },
                { key: 'youth', name: 'Youth', icon: GraduationCap },
                { key: 'adults', name: 'Adults', icon: Users },
              ].map((group) => {
                const current = members.filter((m: any) => (m.serviceCategory || '').toLowerCase() === group.key).length;
                const Icon = group.icon as any;
                return (
                  <div key={group.key} className="p-4 rounded-xl bg-muted/30">
                    <div className={`w-10 h-10 rounded-xl ${groupColors[group.key]} flex items-center justify-center mb-3`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <p className="text-sm text-muted-foreground">{group.name}</p>
                    <p className="text-2xl font-display font-semibold">{current}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Summary for Meetings */}
          <div className="church-card p-4 sm:p-6 bg-primary/5 border-primary/20">
            <h3 className="font-display font-semibold mb-3">📋 Meeting Summary</h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>Total church membership change over last month: <strong>{memberGrowth !== null ? `${memberGrowth}%` : '—'}</strong></span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span><strong>{currentMonth.converts}</strong> new converts this month, with <strong>{currentMonth.visitors}</strong> first-time visitors</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>Youth ministry total members: <strong>{members.filter((m: any) => (m.serviceCategory || '').toLowerCase() === 'youth').length}</strong></span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>Live follow-up metrics pending</span>
              </li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
