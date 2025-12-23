import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Shield, Activity, TrendingUp, Clock } from 'lucide-react';
import { useAuthContext } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { UserGrowthChart } from '@/components/charts/UserGrowthChart';
import { AccessTrendChart } from '@/components/charts/AccessTrendChart';
import { RoleDistributionChart } from '@/components/charts/RoleDistributionChart';
import { StatCard } from '@/components/dashboard/StatCard';
import { RecentActivities } from '@/components/dashboard/RecentActivities';
import { SystemStatus } from '@/components/dashboard/SystemStatus';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { fetchTotalUsers, fetchAuditLogs } from '@/lib/audit';
import { supabase } from '@/integrations/supabase/client';

const systemServices = [
  { name: 'API 服务', status: 'online' as const, latency: '23ms' },
  { name: '数据库', status: 'online' as const, latency: '12ms' },
  { name: '缓存服务', status: 'online' as const, latency: '3ms' },
  { name: '邮件服务', status: 'online' as const, latency: '45ms' },
];

const actionLabels: Record<string, string> = {
  user_login: '登录系统',
  user_logout: '退出系统',
  user_signup: '注册账号',
  role_change: '角色变更',
  permission_change: '权限变更',
  profile_update: '更新资料',
  password_reset: '重置密码',
  user_delete: '删除用户',
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export default function Dashboard() {
  const { profile, role } = useAuthContext();
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeRoles: 3,
    permissions: 9,
    loading: true,
  });
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [activitiesLoading, setActivitiesLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        // 并行获取数据
        const [totalUsers, permResult, logs] = await Promise.all([
          fetchTotalUsers(),
          supabase.from('permissions').select('*', { count: 'exact', head: true }),
          fetchAuditLogs(5),
        ]);

        // 获取用户名
        const userIds = [...new Set(logs.map(l => l.user_id).filter(Boolean))] as string[];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, full_name, email')
          .in('user_id', userIds);

        const userMap = new Map(
          (profiles || []).map(p => [p.user_id, p.full_name || p.email?.split('@')[0] || '用户'])
        );

        const formattedActivities = logs.map(log => {
          const time = formatRelativeTime(log.created_at);
          return {
            user: log.user_id ? userMap.get(log.user_id) || '系统' : '系统',
            action: actionLabels[log.action] || log.action,
            time,
            type: log.action.includes('delete') || log.action.includes('reset') ? 'warning' : 'success',
          };
        });

        setRecentActivities(formattedActivities);
        setStats({
          totalUsers,
          activeRoles: 3,
          permissions: permResult.count || 9,
          loading: false,
        });
        setActivitiesLoading(false);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
        setStats(prev => ({ ...prev, loading: false }));
        setActivitiesLoading(false);
      }
    }

    loadData();
  }, []);

  const formatRelativeTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    
    if (diffMins < 1) return '刚刚';
    if (diffMins < 60) return `${diffMins}分钟前`;
    if (diffHours < 24) return `${diffHours}小时前`;
    return `${Math.floor(diffHours / 24)}天前`;
  };

  const statCards = [
    {
      title: '总用户数',
      value: stats.loading ? '-' : stats.totalUsers.toLocaleString(),
      change: '+12.5%',
      trend: 'up' as const,
      icon: Users,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      title: '活跃角色',
      value: stats.activeRoles.toString(),
      change: '稳定',
      trend: 'neutral' as const,
      icon: Shield,
      color: 'text-success',
      bgColor: 'bg-success/10',
    },
    {
      title: '权限配置',
      value: stats.permissions.toString(),
      change: '已配置',
      trend: 'neutral' as const,
      icon: Activity,
      color: 'text-warning',
      bgColor: 'bg-warning/10',
    },
    {
      title: '系统访问量',
      value: stats.loading ? '-' : (stats.totalUsers * 5).toLocaleString(),
      change: '+23.1%',
      trend: 'up' as const,
      icon: TrendingUp,
      color: 'text-info',
      bgColor: 'bg-info/10',
    },
  ];

  const currentTime = new Date().toLocaleTimeString('zh-CN', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });

  return (
    <DashboardLayout>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-6"
      >
        {/* Welcome Section */}
        <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              欢迎回来，
              <span className="text-gradient-primary">{profile?.full_name || '用户'}</span>
            </h1>
            <p className="text-muted-foreground mt-1.5">
              这是您的管理控制台概览，数据实时更新。
            </p>
          </div>
          <motion.div 
            className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 px-3 py-2 rounded-lg"
            whileHover={{ scale: 1.02 }}
          >
            <Clock className="h-4 w-4" />
            <span>当前时间：{currentTime}</span>
          </motion.div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((stat, index) => (
            <StatCard
              key={stat.title}
              {...stat}
              loading={stats.loading}
              delay={index * 0.1}
            />
          ))}
        </div>

        {/* Charts Row 1 */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <UserGrowthChart />
          <AccessTrendChart />
        </motion.div>

        {/* Charts Row 2 + Status */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <RoleDistributionChart />
          <SystemStatus services={systemServices} />
          <RecentActivities activities={recentActivities} loading={activitiesLoading} />
        </motion.div>

        {/* Quick Actions for Admin */}
        {role === 'admin' && (
          <motion.div variants={itemVariants}>
            <QuickActions />
          </motion.div>
        )}
      </motion.div>
    </DashboardLayout>
  );
}
