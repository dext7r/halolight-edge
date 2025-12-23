import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Menu, Search, LogOut, User, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthContext } from '@/contexts/AuthContext';
import { useThemeSettings } from '@/contexts/ThemeContext';
import { ThemeColorPicker } from '@/components/ThemeColorPicker';
import { Breadcrumb } from './Breadcrumb';
import { CommandPalette } from '@/components/CommandPalette';
import { NotificationDropdown } from '@/components/NotificationDropdown';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';

interface HeaderProps {
  onMenuClick: () => void;
}

const roleLabels = {
  admin: { label: '管理员', variant: 'default' as const },
  moderator: { label: '协管员', variant: 'secondary' as const },
  user: { label: '用户', variant: 'outline' as const },
};

export function Header({ onMenuClick }: HeaderProps) {
  const { profile, role, signOut } = useAuthContext();
  const { settings } = useThemeSettings();
  const navigate = useNavigate();
  const [commandOpen, setCommandOpen] = useState(false);

  if (!settings.showHeader) {
    return null;
  }

  // 监听 Cmd+K / Ctrl+K 快捷键
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setCommandOpen(open => !open);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) {
      toast({
        title: '退出失败',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      navigate('/auth');
    }
  };

  const initials = profile?.full_name
    ?.split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase() || profile?.email?.[0]?.toUpperCase() || 'U';

  return (
    <>
      <header className={`h-16 border-b border-border bg-card/95 backdrop-blur-md z-40 shadow-sm ${
        settings.headerFixed ? 'sticky top-0' : ''
      }`}>
        <div className="h-full px-4 lg:px-6 flex items-center justify-between gap-4">
          {/* Left Section */}
          <div className="flex items-center gap-4 flex-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={onMenuClick}
              className="lg:hidden hover:bg-muted"
            >
              <Menu className="h-5 w-5" />
            </Button>

            {/* Breadcrumb - 隐藏在移动端 */}
            <div className="hidden md:block">
              <Breadcrumb />
            </div>
          </div>

          {/* Center - Search */}
          <motion.button
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={() => setCommandOpen(true)}
            className="hidden lg:flex items-center gap-2 bg-muted/50 hover:bg-muted/70 rounded-lg px-3 py-2 w-72 transition-colors cursor-pointer border border-transparent hover:border-border/50 text-left"
          >
            <Search className="h-4 w-4 text-muted-foreground" />
            <span className="flex-1 text-sm text-muted-foreground">搜索功能、设置...</span>
            <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border bg-background px-1.5 font-mono text-[10px] font-medium text-muted-foreground shadow-sm">
              ⌘K
            </kbd>
          </motion.button>

          {/* Right Section */}
          <div className="flex items-center gap-2">
            {/* Theme Color Picker */}
            <ThemeColorPicker />

            {/* Notifications */}
            <NotificationDropdown />

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex items-center gap-3 p-1.5 pr-3 rounded-full bg-muted/50 hover:bg-muted transition-colors"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={profile?.avatar_url || undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden sm:flex flex-col items-start">
                    <span className="text-sm font-medium leading-none">
                      {profile?.full_name || profile?.email?.split('@')[0]}
                    </span>
                    {role && (
                      <span className="text-xs text-muted-foreground mt-0.5">
                        {roleLabels[role]?.label}
                      </span>
                    )}
                  </div>
                </motion.button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium">{profile?.full_name}</p>
                    <p className="text-xs text-muted-foreground">{profile?.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/settings')}>
                  <User className="mr-2 h-4 w-4" />
                  个人资料
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/settings')}>
                  <Settings className="mr-2 h-4 w-4" />
                  系统设置
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={handleSignOut}
                  className="text-destructive focus:text-destructive"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  退出登录
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Command Palette */}
      <CommandPalette open={commandOpen} onOpenChange={setCommandOpen} />
    </>
  );
}
