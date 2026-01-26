import { useState } from 'react';
import { Plus, Users, Heart, UserPlus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate, useLocation } from 'react-router-dom';

export function QuickAddButton() {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Hide on login page
  if (location.pathname === '/login') {
    return null;
  }

  const actions = [
    { 
      label: 'Add Member', 
      icon: Users, 
      path: '/members',
      color: 'bg-primary text-primary-foreground hover:bg-primary/90'
    },
    { 
      label: 'Add Convert', 
      icon: Heart, 
      path: '/converts',
      color: 'bg-secondary text-secondary-foreground hover:bg-secondary/90'
    },
    { 
      label: 'Add Visitor', 
      icon: UserPlus, 
      path: '/visitors',
      color: 'bg-accent text-accent-foreground hover:bg-accent/90'
    },
  ];

  const handleAction = (path: string) => {
    setIsOpen(false);
    navigate(path, { state: { openAddDialog: true } });
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Action buttons */}
      <div 
        className={`absolute bottom-16 right-0 flex flex-col gap-3 transition-all duration-300 ${
          isOpen 
            ? 'opacity-100 translate-y-0 pointer-events-auto' 
            : 'opacity-0 translate-y-4 pointer-events-none'
        }`}
      >
        {actions.map((action) => (
          <button
            key={action.label}
            onClick={() => handleAction(action.path)}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg ${action.color} transition-all duration-200 hover:scale-105 hover:shadow-xl whitespace-nowrap`}
          >
            <action.icon className="w-5 h-5" />
            <span className="font-medium text-sm">{action.label}</span>
          </button>
        ))}
      </div>

      {/* Main FAB */}
      <Button
        size="lg"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 rounded-full shadow-lg transition-all duration-300 ${
          isOpen 
            ? 'bg-muted-foreground hover:bg-muted-foreground/90 rotate-45' 
            : 'bg-primary hover:bg-primary/90'
        }`}
      >
        {isOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <Plus className="w-6 h-6" />
        )}
      </Button>
    </div>
  );
}
