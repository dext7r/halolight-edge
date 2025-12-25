import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import {
  LayoutDashboard,
  Users,
  Shield,
  Settings,
  FileText,
  HelpCircle,
  LogOut,
  Moon,
  Sun,
  Search,
  Database,
  Clock,
  Key,
  Book,
  Code,
} from 'lucide-react';
import { useAuthContext } from '@/contexts/AuthContext';
import { useTheme } from 'next-themes';

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const navigate = useNavigate();
  const { isAdmin, isModerator, signOut } = useAuthContext();
  const { theme, setTheme } = useTheme();

  const runCommand = (command: () => void) => {
    onOpenChange(false);
    command();
  };

  const navigationItems = [
    { icon: LayoutDashboard, label: '仪表盘', path: '/dashboard', show: true },
    { icon: Users, label: '用户管理', path: '/users', show: isModerator },
    { icon: Shield, label: '角色权限', path: '/roles', show: isAdmin },
    { icon: FileText, label: '审计日志', path: '/audit-logs', show: isAdmin },
    { icon: Database, label: '数据字典', path: '/data-dictionary', show: true },
    { icon: Clock, label: '定时任务', path: '/scheduled-tasks', show: isAdmin },
    { icon: Key, label: 'API 令牌', path: '/api-tokens', show: isAdmin },
    { icon: Book, label: 'API 文档', path: '/swagger-docs', show: true },
    { icon: Code, label: 'SQL 编辑器', path: '/sql-editor', show: isAdmin },
    { icon: Settings, label: '系统设置', path: '/settings', show: true },
  ].filter(item => item.show);

  const actionItems = [
    {
      icon: theme === 'dark' ? Sun : Moon,
      label: theme === 'dark' ? '切换到亮色模式' : '切换到暗色模式',
      action: () => setTheme(theme === 'dark' ? 'light' : 'dark'),
    },
    {
      icon: HelpCircle,
      label: '帮助文档',
      action: () => window.open('https://docs.lovable.dev', '_blank'),
    },
    {
      icon: LogOut,
      label: '退出登录',
      action: async () => {
        await signOut();
        navigate('/auth');
      },
    },
  ];

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="搜索功能、页面或设置..." />
      <CommandList>
        <CommandEmpty>未找到相关结果</CommandEmpty>
        
        <CommandGroup heading="页面导航">
          {navigationItems.map((item) => (
            <CommandItem
              key={item.path}
              onSelect={() => runCommand(() => navigate(item.path))}
              className="cursor-pointer"
            >
              <item.icon className="mr-2 h-4 w-4" />
              <span>{item.label}</span>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="快捷操作">
          {actionItems.map((item, index) => (
            <CommandItem
              key={index}
              onSelect={() => runCommand(item.action)}
              className="cursor-pointer"
            >
              <item.icon className="mr-2 h-4 w-4" />
              <span>{item.label}</span>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
