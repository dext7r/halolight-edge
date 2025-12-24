import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  FileText, 
  Search, 
  Filter,
  RefreshCw,
  Download,
  Clock,
  User,
  Shield,
  LogIn,
  LogOut,
  UserPlus,
  Key,
  Trash2,
  Settings
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ClearableInput } from '@/components/ui/clearable-input';
import { Badge } from '@/components/ui/badge';
import { DataTable, Column } from '@/components/ui/data-table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { fetchAuditLogs, AuditLog, AuditAction } from '@/lib/audit';
import { supabase } from '@/integrations/supabase/client';

const actionConfig: Record<AuditAction, { label: string; icon: any; color: string }> = {
  user_login: { label: '用户登录', icon: LogIn, color: 'bg-success/10 text-success' },
  user_logout: { label: '用户登出', icon: LogOut, color: 'bg-muted text-muted-foreground' },
  user_signup: { label: '用户注册', icon: UserPlus, color: 'bg-primary/10 text-primary' },
  role_change: { label: '角色变更', icon: Shield, color: 'bg-warning/10 text-warning' },
  permission_change: { label: '权限变更', icon: Settings, color: 'bg-warning/10 text-warning' },
  profile_update: { label: '资料更新', icon: User, color: 'bg-info/10 text-info' },
  password_reset: { label: '密码重置', icon: Key, color: 'bg-destructive/10 text-destructive' },
  user_delete: { label: '用户删除', icon: Trash2, color: 'bg-destructive/10 text-destructive' },
};

interface AuditLogWithUser extends AuditLog {
  user_name?: string;
  target_user_name?: string;
}

export default function AuditLogs() {
  const [logs, setLogs] = useState<AuditLogWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20, total: 0 });

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const auditLogs = await fetchAuditLogs(500);
      
      const userIds = [...new Set([
        ...auditLogs.map(l => l.user_id).filter(Boolean),
        ...auditLogs.map(l => l.target_user_id).filter(Boolean),
      ])] as string[];

      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, email')
        .in('user_id', userIds);

      const userMap = new Map(
        (profiles || []).map(p => [p.user_id, p.full_name || p.email || '未知用户'])
      );

      const logsWithUsers = auditLogs.map(log => ({
        ...log,
        user_name: log.user_id ? userMap.get(log.user_id) || '系统' : '系统',
        target_user_name: log.target_user_id ? userMap.get(log.target_user_id) : undefined,
      }));

      setLogs(logsWithUsers);
      setPagination(prev => ({ ...prev, total: logsWithUsers.length }));
    } catch (error) {
      console.error('Error fetching logs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const matchesSearch = 
        log.user_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.target_user_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        actionConfig[log.action]?.label.includes(searchQuery);
      const matchesAction = actionFilter === 'all' || log.action === actionFilter;
      return matchesSearch && matchesAction;
    });
  }, [logs, searchQuery, actionFilter]);

  const paginatedData = useMemo(() => {
    const start = (pagination.current - 1) * pagination.pageSize;
    const end = start + pagination.pageSize;
    return filteredLogs.slice(start, end);
  }, [filteredLogs, pagination.current, pagination.pageSize]);

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return '刚刚';
    if (diffMins < 60) return `${diffMins}分钟前`;
    if (diffHours < 24) return `${diffHours}小时前`;
    if (diffDays < 7) return `${diffDays}天前`;
    return date.toLocaleDateString('zh-CN');
  };

  const renderDetails = (log: AuditLogWithUser) => {
    if (log.action === 'role_change' && log.details) {
      const { old_role, new_role } = log.details;
      if (old_role && new_role) {
        return `${old_role} → ${new_role}`;
      }
      if (new_role) {
        return `分配角色: ${new_role}`;
      }
    }
    return '-';
  };

  const columns: Column<AuditLogWithUser>[] = [
    {
      key: 'created_at',
      title: '时间',
      sortable: true,
      render: (value) => (
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          {formatTime(value)}
        </div>
      ),
    },
    {
      key: 'action',
      title: '操作类型',
      sortable: true,
      render: (value) => {
        const config = actionConfig[value as AuditAction];
        const Icon = config?.icon || FileText;
        return (
          <Badge className={`gap-1.5 ${config?.color || ''}`}>
            <Icon className="h-3 w-3" />
            {config?.label || value}
          </Badge>
        );
      },
    },
    {
      key: 'user_name',
      title: '操作用户',
      sortable: true,
      render: (value) => (
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="h-3 w-3 text-primary" />
          </div>
          <span className="text-sm font-medium">{value}</span>
        </div>
      ),
    },
    {
      key: 'target_user_name',
      title: '目标用户',
      className: 'hidden md:table-cell',
      render: (value) => (
        <span className="text-sm">{value || '-'}</span>
      ),
    },
    {
      key: 'details',
      title: '详情',
      className: 'hidden lg:table-cell',
      render: (_, log) => (
        <span className="text-sm text-muted-foreground">{renderDetails(log)}</span>
      ),
    },
  ];

  return (
    <DashboardLayout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">审计日志</h1>
            <p className="text-muted-foreground mt-1">
              查看系统操作记录和安全事件 · 共 {filteredLogs.length} 条记录
            </p>
          </div>
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button variant="outline" className="gap-2 shadow-sm">
              <Download className="h-4 w-4" />
              导出日志
            </Button>
          </motion.div>
        </div>

        {/* Filters */}
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <ClearableInput
                  placeholder="搜索用户或操作..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onClear={() => setSearchQuery('')}
                  className="pl-10"
                />
              </div>
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="筛选操作类型" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部操作</SelectItem>
                  {Object.entries(actionConfig).map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      {config.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon" onClick={fetchLogs}>
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Logs Table */}
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              操作记录
            </CardTitle>
            <CardDescription>
              共 {filteredLogs.length} 条记录
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <DataTable
              columns={columns}
              data={paginatedData}
              rowKey="id"
              loading={loading}
              emptyText="暂无日志记录"
              pagination={{
                current: pagination.current,
                pageSize: pagination.pageSize,
                total: filteredLogs.length,
                onChange: (page, pageSize) => setPagination({ ...pagination, current: page, pageSize }),
              }}
            />
          </CardContent>
        </Card>
      </motion.div>
    </DashboardLayout>
  );
}
