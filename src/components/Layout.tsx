import { ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { Sidebar, MobileMenuButton } from './Sidebar';
import { Search, Bell, Moon, Sun } from 'lucide-react';
import { Input } from './ui/input';
import { useLocation, useNavigate } from 'react-router-dom';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useNotificationFeed, useNotificationRealtime, Notice } from '@/services/notificationFeed';
import { resolveTheme, toggleTheme, getStoredTheme } from '@/lib/theme';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const [headerQuery, setHeaderQuery] = useState('');
  const debounceRef = useRef<number | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => resolveTheme(getStoredTheme()));

  const { data: notices = [] } = useNotificationFeed();
  useNotificationRealtime();
  const unreadCount = useMemo(() => notices.filter(n => !n.read).length, [notices]);
  // For now, mark/clear are local UI only (no server mutation implemented yet)
  const [localReadMap, setLocalReadMap] = useState<Record<string, boolean>>({});
  const markAllRead = () => {
    const map: Record<string, boolean> = {};
    for (const n of notices) map[n.id] = true;
    setLocalReadMap(map);
  };
  const clearAll = () => {
    // Hide locally by treating all as read
    setLocalReadMap(Object.fromEntries(notices.map(n => [n.id, true])));
  };

  // Reflect current URL `q` param in the header input
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const q = params.get('q') || '';
    setHeaderQuery(q);
  }, [location.search]);

  // Debounced navigate to update `q` without full reload
  const updateQueryParam = (q: string) => {
    const params = new URLSearchParams(location.search);
    if (q) params.set('q', q); else params.delete('q');
    navigate({ pathname: location.pathname, search: params.toString() }, { replace: true });
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      {/* Main Content */}
      <main className="lg:ml-64 min-h-screen">
        {/* Top Header */}
        <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border">
          <div className="flex items-center justify-between h-14 lg:h-16 px-4 lg:px-8">
            {/* Mobile Menu + Search */}
            <div className="flex items-center gap-3 flex-1">
              <MobileMenuButton onClick={() => setSidebarOpen(true)} />
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  type="search"
                  placeholder="Search..."
                  value={headerQuery}
                  onChange={(e) => {
                    const val = e.target.value;
                    setHeaderQuery(val);
                    if (debounceRef.current) window.clearTimeout(debounceRef.current);
                    debounceRef.current = window.setTimeout(() => {
                      updateQueryParam(val);
                    }, 250);
                  }}
                  className="pl-10 bg-muted/50 border-transparent focus:border-primary focus:bg-background text-sm h-9 lg:h-10"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 lg:gap-4">
              {/* Theme Toggle */}
              <button
                className="p-2 rounded-lg hover:bg-muted transition-colors"
                aria-label="Toggle theme"
                onClick={() => setTheme(toggleTheme())}
                title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {theme === 'dark' ? (
                  <Sun className="w-5 h-5 text-muted-foreground" />
                ) : (
                  <Moon className="w-5 h-5 text-muted-foreground" />
                )}
              </button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="relative p-2 rounded-lg hover:bg-muted transition-colors" aria-label="Notifications">
                    <Bell className="w-5 h-5 text-muted-foreground" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 min-w-[1rem] h-4 px-1 rounded-full bg-accent text-white text-[10px] leading-4 flex items-center justify-center">
                        {unreadCount}
                      </span>
                    )}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80">
                  <DropdownMenuLabel className="flex items-center justify-between">
                    <span>Notifications</span>
                    {unreadCount > 0 && (
                      <span className="text-xs text-muted-foreground">{unreadCount} unread</span>
                    )}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {notices.length === 0 ? (
                    <div className="p-3 text-sm text-muted-foreground">No notifications</div>
                  ) : (
                    <div className="max-h-72 overflow-auto">
                      {notices.filter(n => !localReadMap[n.id]).map((n) => (
                        <DropdownMenuItem
                          key={n.id}
                          className="whitespace-normal py-2"
                          onClick={() => {
                            if (n.title === 'Monthly report ready') {
                              navigate('/reports');
                            }
                          }}
                        >
                          <div className="space-y-0.5">
                            <p className={`text-sm ${n.read ? 'text-foreground' : 'font-medium'}`}>{n.title}</p>
                            {n.message && <p className="text-xs text-muted-foreground">{n.message}</p>}
                            <p className="text-[11px] text-muted-foreground">{new Date(n.ts).toLocaleString()}</p>
                          </div>
                        </DropdownMenuItem>
                      ))}
                    </div>
                  )}
                  <DropdownMenuSeparator />
                  <div className="px-2 py-1.5 flex items-center gap-2">
                    <button className="text-xs px-2 py-1 rounded hover:bg-muted" onClick={markAllRead} disabled={notices.length === 0}>Mark all read</button>
                    <button className="text-xs px-2 py-1 rounded hover:bg-muted" onClick={clearAll} disabled={notices.length === 0}>Clear</button>
                    <button className="ml-auto text-xs px-2 py-1 rounded hover:bg-muted" onClick={() => navigate('/settings')}>Settings</button>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-4 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
