import { useMemo } from 'react';
import { Layout } from '@/components/Layout';
import { useMonthlyReports } from '@/services/monthlyReports';

function pct(curr: number, prev: number) {
  if (!prev || prev <= 0) return null;
  return Math.round(((curr - prev) / prev) * 100);
}

function monthLabel(isoDate: string) {
  const d = new Date(isoDate + 'T00:00:00Z');
  return d.toLocaleString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' });
}

export default function Reports() {
  const { data = [], isLoading, error } = useMonthlyReports();

  const rows = useMemo(() => {
    return data.map((r) => ({
      ...r,
      membersPct: pct(r.members_curr, r.members_prev),
      visitorsPct: pct(r.visitors_curr, r.visitors_prev),
      convertsPct: pct(r.converts_curr, r.converts_prev),
    }));
  }, [data]);

  return (
    <Layout>
      <div className="space-y-4">
        <div>
          <h1 className="font-display text-xl lg:text-2xl font-semibold">Reports</h1>
          <p className="text-sm text-muted-foreground">Monthly snapshots</p>
        </div>

        <div className="church-card p-4 lg:p-6">
          {isLoading ? (
            <div className="text-sm text-muted-foreground">Loading reports...</div>
          ) : error ? (
            <div className="text-sm text-destructive">Failed to load reports</div>
          ) : rows.length === 0 ? (
            <div className="text-sm text-muted-foreground">No monthly reports yet</div>
          ) : (
            <div className="overflow-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-muted-foreground border-b border-border">
                    <th className="py-2 pr-3 font-medium">Month</th>
                    <th className="py-2 pr-3 font-medium">Members</th>
                    <th className="py-2 pr-3 font-medium">Visitors</th>
                    <th className="py-2 pr-3 font-medium">Converts</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id} className="border-b border-border/60 last:border-0">
                      <td className="py-2 pr-3 font-medium">{monthLabel(r.month_start)}</td>
                      <td className="py-2 pr-3">
                        <span className="font-medium">{r.members_curr}</span>
                        <span className="ml-2 text-xs text-muted-foreground">{r.membersPct === null ? '—' : `${r.membersPct > 0 ? '+' : ''}${r.membersPct}%`}</span>
                      </td>
                      <td className="py-2 pr-3">
                        <span className="font-medium">{r.visitors_curr}</span>
                        <span className="ml-2 text-xs text-muted-foreground">{r.visitorsPct === null ? '—' : `${r.visitorsPct > 0 ? '+' : ''}${r.visitorsPct}%`}</span>
                      </td>
                      <td className="py-2 pr-3">
                        <span className="font-medium">{r.converts_curr}</span>
                        <span className="ml-2 text-xs text-muted-foreground">{r.convertsPct === null ? '—' : `${r.convertsPct > 0 ? '+' : ''}${r.convertsPct}%`}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
