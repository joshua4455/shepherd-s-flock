import { useEffect, useState } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Heart, 
  UserPlus, 
  Settings,
  LogOut,
  Menu,
  X
} from 'lucide-react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { getSupabase } from '@/lib/supabase';
import { useProfiles } from '@/services/users';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Members', href: '/members', icon: Users },
  { name: 'New Converts', href: '/converts', icon: Heart },
  { name: 'Visitors', href: '/visitors', icon: UserPlus },
  { name: 'Settings', href: '/settings', icon: Settings },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const sb = getSupabase();
  const { data: profiles = [] } = useProfiles();
  const [userDisplay, setUserDisplay] = useState<{ initials: string; name: string; role: string } | null>(null);

  useEffect(() => {
    let mounted = true;
    const deriveInitials = (val: string) => val.split(' ').map((n) => n[0]).join('').slice(0,2).toUpperCase();
    if (sb) {
      sb.auth.getUser().then(({ data }) => {
        if (!mounted) return;
        const authUser = data?.user;
        if (!authUser) return;
        const profile = (profiles as any[]).find((p: any) => p.id === authUser.id);
        const name = profile?.name || authUser.user_metadata?.name || authUser.email || 'User';
        const role = (profile?.role || 'Leader') as string;
        const initials = deriveInitials(String(name));
        setUserDisplay({ initials, name: String(name), role });
      });
    } else {
      // Fallback demo
      setUserDisplay({ initials: 'JD', name: 'John Doe', role: 'Admin' });
    }
    return () => { mounted = false; };
  }, [sb, profiles]);

  const handleLogout = () => {
    toast.success('Logged out successfully');
    logout();
    onClose();
  };

  const handleNavClick = () => {
    // Close sidebar on mobile after navigation
    if (window.innerWidth < 1024) {
      onClose();
    }
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={cn(
          "fixed left-0 top-0 h-screen w-64 flex flex-col z-50 transition-transform duration-300 ease-in-out lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
        style={{ background: 'var(--gradient-sidebar)' }}
      >
        {/* Logo */}
        <div className="p-4 lg:p-6 border-b border-sidebar-border/50 flex items-center justify-between">
          <div className="flex items-center gap-3 lg:gap-4">
            <img src="/logo12.png" alt="App logo" className="w-8 h-8 lg:w-9 lg:h-9 object-contain" />
            <div className="leading-tight">
              <h1 className="font-display text-base lg:text-lg font-semibold text-sidebar-foreground">
                VBCI REDEEMER SANCTUARY
              </h1>
              <p className="text-[11px] lg:text-xs text-sidebar-foreground/60">
                Management Platform
              </p>
            </div>
          </div>
          {/* Mobile Close Button */}
          <button 
            onClick={onClose}
            className="lg:hidden p-2 rounded-lg hover:bg-sidebar-accent/60 transition-colors"
          >
            <X className="w-5 h-5 text-sidebar-foreground" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <NavLink
                key={item.name}
                to={item.href}
                onClick={handleNavClick}
                className={`nav-item ${isActive ? 'active' : ''}`}
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.name}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* User Section */}
        <div className="p-4 border-t border-sidebar-border/50">
          <div className="flex items-center gap-3 px-4 py-3">
            <div className="w-9 h-9 rounded-full bg-sidebar-primary/20 flex items-center justify-center">
              <span className="text-sm font-semibold text-sidebar-foreground">
                {userDisplay?.initials || '??'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">
                {userDisplay?.name || 'User'}
              </p>
              <p className="text-xs text-sidebar-foreground/60 truncate">
                {(userDisplay?.role || 'Leader')}
              </p>
            </div>
            <button 
              onClick={handleLogout}
              className="p-2 rounded-lg hover:bg-sidebar-accent/60 transition-colors"
              title="Logout"
            >
              <LogOut className="w-4 h-4 text-sidebar-foreground/60 hover:text-sidebar-foreground" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

// Mobile Menu Button Component
export function MobileMenuButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="lg:hidden p-2 rounded-lg hover:bg-muted transition-colors"
      aria-label="Open menu"
    >
      <Menu className="w-6 h-6" />
    </button>
  );
}
