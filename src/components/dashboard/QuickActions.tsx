import { motion } from 'framer-motion';
import { Plus, Shield, FileText, Scan, Users, Settings } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';

interface QuickAction {
  label: string;
  icon: typeof Plus;
  path: string;
  variant: 'primary' | 'secondary';
}

const actions: QuickAction[] = [
  { label: '添加用户', icon: Plus, path: '/users', variant: 'primary' },
  { label: '管理角色', icon: Shield, path: '/roles', variant: 'secondary' },
  { label: '审计日志', icon: FileText, path: '/audit-logs', variant: 'secondary' },
  { label: '用户管理', icon: Users, path: '/users', variant: 'secondary' },
  { label: '系统设置', icon: Settings, path: '/settings', variant: 'secondary' },
];

export function QuickActions() {
  const navigate = useNavigate();

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">快速操作</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {actions.map((action, index) => {
            const Icon = action.icon;
            return (
              <motion.button
                key={action.label}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ scale: 1.02, y: -1 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate(action.path)}
                className={`
                  inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium
                  transition-all duration-200 shadow-sm
                  ${action.variant === 'primary' 
                    ? 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-primary/20' 
                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                  }
                `}
              >
                <Icon className="h-4 w-4" />
                {action.label}
              </motion.button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
