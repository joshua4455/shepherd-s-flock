import { useMemo, useState } from 'react';
import { Layout } from '@/components/Layout';
import { StatCard } from '@/components/StatCard';
import { StatusBadge } from '@/components/StatusBadge';
import { ServiceGroupBadge } from '@/components/ServiceGroupBadge';
import { AnalyticsDialog } from '@/components/AnalyticsDialog';
import { 
  Users, 
  Baby, 
  Sparkles, 
  GraduationCap, 
  Heart, 
  UserPlus,
  TrendingUp,
  Calendar,
  ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useMembers } from '@/services/members';
import { useVisitors } from '@/services/visitors';
import { useConverts } from '@/services/converts';

const Dashboard = () => {
  const [analyticsOpen, setAnalyticsOpen] = useState(false);
  const { data: members = [], isLoading: membersLoading } = useMembers();
  const { data: visitors = [], isLoading: visitorsLoading } = useVisitors();
  const { data: converts = [], isLoading: convertsLoading } = useConverts();

  const stats = useMemo(() => {
    // Derive simple stats from live data
    const totalMembers = members.length;
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const newVisitorsThisMonth = visitors.filter(v => new Date(v.firstVisitDate) >= monthStart).length;
    const newConvertsThisMonth = converts.filter(c => new Date(c.dateOfConversion) >= monthStart).length;
    const childrenCount = members.filter(m => (m.serviceCategory || '').toLowerCase() === 'children').length;
    const teensCount = members.filter(m => (m.serviceCategory || '').toLowerCase() === 'teens').length;
    const youthCount = members.filter(m => (m.serviceCategory || '').toLowerCase() === 'youth').length;
    const adultsCount = members.filter(m => (m.serviceCategory || '').toLowerCase() === 'adults').length;
    // Previous month end for growth comparison
    const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
    const membersPrev = members.filter((m: any) => new Date(m.createdAt || 0) <= prevMonthEnd).length;
    const membersGrowthPct = membersPrev > 0 ? Math.round(((totalMembers - membersPrev) / membersPrev) * 100) : null;
    return { totalMembers, newVisitorsThisMonth, newConvertsThisMonth, childrenCount, teensCount, youthCount, adultsCount, membersPrev, membersGrowthPct } as const;
  }, [members, visitors, converts]);

  const recentConverts = useMemo(() => [...converts].sort((a,b) => (new Date(b.dateOfConversion).getTime() - new Date(a.dateOfConversion).getTime())).slice(0,3), [converts]);
  const recentVisitors = useMemo(() => [...visitors].sort((a,b) => (new Date(b.firstVisitDate).getTime() - new Date(a.firstVisitDate).getTime())).slice(0,3), [visitors]);

  return (
    <Layout>
      <div className="space-y-8 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-display font-semibold tracking-tight">
              Welcome back
            </h1>
            <p className="text-muted-foreground mt-1 text-sm lg:text-base">
              Here's what's happening at your church today.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs lg:text-sm text-muted-foreground">
            <Calendar className="w-4 h-4" />
            <span className="hidden sm:inline">
              {new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </span>
            <span className="sm:hidden">
              {new Date().toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric' 
              })}
            </span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6">
          <StatCard
            title="Total Members"
            value={membersLoading ? '…' : stats.totalMembers}
            icon={Users}
            variant="primary"
            trend={(!membersLoading && stats.membersGrowthPct !== null) ? { value: stats.membersGrowthPct, isPositive: (stats.membersGrowthPct || 0) >= 0 } : undefined}
          />
          <StatCard
            title="New Visitors"
            value={visitorsLoading ? '…' : stats.newVisitorsThisMonth}
            subtitle="This month"
            icon={UserPlus}
            variant="accent"
          />
          <StatCard
            title="New Converts"
            value={convertsLoading ? '…' : stats.newConvertsThisMonth}
            subtitle="This month"
            icon={Heart}
            variant="secondary"
          />
          <div 
            onClick={() => setAnalyticsOpen(true)}
            className="cursor-pointer group"
          >
            <StatCard
              title="Growth Rate"
              value={(!membersLoading && stats.membersGrowthPct !== null) ? `${stats.membersGrowthPct >= 0 ? '+' : ''}${stats.membersGrowthPct}%` : '—'}
              subtitle="Click for details →"
              icon={TrendingUp}
              className="group-hover:shadow-lg group-hover:border-primary/30 transition-all duration-200"
            />
          </div>
        </div>

        <AnalyticsDialog open={analyticsOpen} onOpenChange={setAnalyticsOpen} />

        {/* Service Groups */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
          <div className="church-card p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-pink-100 flex items-center justify-center">
              <Baby className="w-6 h-6 text-pink-600" />
            </div>
            <div>
              <p className="text-2xl font-display font-semibold">{stats.childrenCount}</p>
              <p className="text-sm text-muted-foreground">Victory Land</p>
            </div>
          </div>
          <div className="church-card p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-cyan-100 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-cyan-600" />
            </div>
            <div>
              <p className="text-2xl font-display font-semibold">{stats.teensCount}</p>
              <p className="text-sm text-muted-foreground">Teens</p>
            </div>
          </div>
          <div className="church-card p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-violet-100 flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-violet-600" />
            </div>
            <div>
              <p className="text-2xl font-display font-semibold">{stats.youthCount}</p>
              <p className="text-sm text-muted-foreground">Youth</p>
            </div>
          </div>
          <div className="church-card p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center">
              <Users className="w-6 h-6 text-slate-600" />
            </div>
            <div>
              <p className="text-2xl font-display font-semibold">{stats.adultsCount}</p>
              <p className="text-sm text-muted-foreground">Adults</p>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Converts */}
          <div className="church-card">
            <div className="p-6 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-secondary/20 flex items-center justify-center">
                  <Heart className="w-5 h-5 text-secondary" />
                </div>
                <div>
                  <h3 className="font-display font-semibold">Recent Converts</h3>
                  <p className="text-sm text-muted-foreground">New believers this month</p>
                </div>
              </div>
              <Link to="/converts">
                <Button variant="ghost" size="sm" className="gap-1">
                  View all
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
            <div className="divide-y divide-border">
              {(convertsLoading ? [] : recentConverts).map((convert) => (
                <div key={convert.id} className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-sm font-semibold text-primary">
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
                  <StatusBadge status={convert.followUpStatus} />
                </div>
              ))}
              {(convertsLoading || (!recentConverts.length && !convertsLoading)) && (
                <div className="p-4 text-sm text-muted-foreground">{convertsLoading ? 'Loading…' : 'No recent converts'}</div>
              )}
            </div>
          </div>

          {/* Recent Visitors */}
          <div className="church-card">
            <div className="p-6 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center">
                  <UserPlus className="w-5 h-5 text-accent-foreground" />
                </div>
                <div>
                  <h3 className="font-display font-semibold">Recent Visitors</h3>
                  <p className="text-sm text-muted-foreground">First-time guests</p>
                </div>
              </div>
              <Link to="/visitors">
                <Button variant="ghost" size="sm" className="gap-1">
                  View all
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
            <div className="divide-y divide-border">
              {(visitorsLoading ? [] : recentVisitors).map((visitor) => (
                <div key={visitor.id} className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
                      <span className="text-sm font-semibold text-accent-foreground">
                        {visitor.fullName.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium">{visitor.fullName}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{new Date(visitor.firstVisitDate).toLocaleDateString()}</span>
                        <span>•</span>
                        <ServiceGroupBadge group={visitor.serviceAttended} />
                      </div>
                    </div>
                  </div>
                  <StatusBadge status={visitor.followUpStatus} />
                </div>
              ))}
              {(visitorsLoading || (!recentVisitors.length && !visitorsLoading)) && (
                <div className="p-4 text-sm text-muted-foreground">{visitorsLoading ? 'Loading…' : 'No recent visitors'}</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
