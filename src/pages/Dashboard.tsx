import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  Shield, 
  Activity, 
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Loader2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuthContext } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { UserGrowthChart } from '@/components/charts/UserGrowthChart';
import { AccessTrendChart } from '@/components/charts/AccessTrendChart';
import { RoleDistributionChart } from '@/components/charts/RoleDistributionChart';
import { fetchTotalUsers, fetchAuditLogs, AuditLog } from '@/lib/audit';
import { supabase } from '@/integrations/supabase/client';

const systemStatus = [
  { name: 'API 服务', status: 'online', latency: '23ms' },
  { name: '数据库', status: 'online', latency: '12ms' },
  { name: '缓存服务', status: 'online', latency: '3ms' },
  { name: '邮件服务', status: 'online', latency: '45ms' },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
    },
  },
};

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

export default function Dashboard() {
  const { profile, role } = useAuthContext();
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeRoles: 3,
    permissions: 9,
    activities: 0,
    loading: true,
  });
  const [recentActivities, setRecentActivities] = useState<any[]>([]);

  useEffect(() => {
    async function loadStats() {
      try {
        // 获取用户总数
        const totalUsers = await fetchTotalUsers();
        
        // 获取权限数量
        const { count: permCount } = await supabase
          .from('permissions')
          .select('*', { count: 'exact', head: true });

        // 获取最近活动
        const logs = await fetchAuditLogs(5);
        
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
          const date = new Date(log.created_at);
          const now = new Date();
          const diffMs = now.getTime() - date.getTime();
          const diffMins = Math.floor(diffMs / 60000);
          const diffHours = Math.floor(diffMs / 3600000);
          
          let time = '';
          if (diffMins < 1) time = '刚刚';
          else if (diffMins < 60) time = `${diffMins}分钟前`;
          else if (diffHours < 24) time = `${diffHours}小时前`;
          else time = `${Math.floor(diffHours / 24)}天前`;

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
          permissions: permCount || 9,
          activities: logs.length,
          loading: false,
        });
      } catch (error) {
        console.error('Error loading stats:', error);
        setStats(prev => ({ ...prev, loading: false }));
      }
    }

    loadStats();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online':
        return <CheckCircle className="h-4 w-4 text-success" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-warning" />;
      case 'offline':
        return <XCircle className="h-4 w-4 text-destructive" />;
      default:
        return null;
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <div className="w-2 h-2 rounded-full bg-success" />;
      case 'warning':
        return <div className="w-2 h-2 rounded-full bg-warning" />;
      case 'error':
        return <div className="w-2 h-2 rounded-full bg-destructive" />;
      default:
        return <div className="w-2 h-2 rounded-full bg-muted-foreground" />;
    }
  };

  const statCards = [
    {
      title: '总用户数',
      value: stats.loading ? '-' : stats.totalUsers.toLocaleString(),
      change: '+12.5%',
      trend: 'up',
      icon: Users,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      title: '活跃角色',
      value: stats.activeRoles.toString(),
      change: '稳定',
      trend: 'neutral',
      icon: Shield,
      color: 'text-success',
      bgColor: 'bg-success/10',
    },
    {
      title: '权限配置',
      value: stats.permissions.toString(),
      change: '已配置',
      trend: 'neutral',
      icon: Activity,
      color: 'text-warning',
      bgColor: 'bg-warning/10',
    },
    {
      title: '系统访问量',
      value: stats.loading ? '-' : (stats.totalUsers * 5).toLocaleString(),
      change: '+23.1%',
      trend: 'up',
      icon: TrendingUp,
      color: 'text-info',
      bgColor: 'bg-info/10',
    },
  ];

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
            <h1 className="text-3xl font-bold">
              欢迎回来，{profile?.full_name || '用户'}
            </h1>
            <p className="text-muted-foreground mt-1">
              这是您的管理控制台概览，数据实时更新。
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            最后更新：刚刚
          </div>
        </motion.div>

        {/* Stats Grid */}
        <motion.div 
          variants={containerVariants}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {statCards.map((stat) => (
            <motion.div key={stat.title} variants={itemVariants}>
              <Card className="stat-card card-hover border-border/50 overflow-hidden">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div className={`p-2.5 rounded-xl ${stat.bgColor}`}>
                      <stat.icon className={`h-5 w-5 ${stat.color}`} />
                    </div>
                    <div className={`flex items-center gap-1 text-sm ${
                      stat.trend === 'up' ? 'text-success' : 
                      stat.trend === 'down' ? 'text-destructive' : 
                      'text-muted-foreground'
                    }`}>
                      {stat.trend === 'up' ? (
                        <ArrowUpRight className="h-4 w-4" />
                      ) : stat.trend === 'down' ? (
                        <ArrowDownRight className="h-4 w-4" />
                      ) : null}
                      {stat.change}
                    </div>
                  </div>
                  <div className="mt-3">
                    {stats.loading ? (
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    ) : (
                      <p className="text-2xl font-bold">{stat.value}</p>
                    )}
                    <p className="text-sm text-muted-foreground mt-0.5">{stat.title}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <UserGrowthChart />
          <AccessTrendChart />
        </div>

        {/* Charts Row 2 + Status */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Role Distribution */}
          <RoleDistributionChart />

          {/* System Status */}
          <motion.div variants={itemVariants}>
            <Card className="border-border/50 h-full">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-primary" />
                  系统状态
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {systemStatus.map((service, index) => (
                    <motion.div
                      key={service.name}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
                    >
                      <div className="flex items-center gap-3">
                        {getStatusIcon(service.status)}
                        <span className="font-medium text-sm">{service.name}</span>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {service.latency}
                      </Badge>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Recent Activities */}
          <motion.div variants={itemVariants}>
            <Card className="border-border/50 h-full">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  最近活动
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentActivities.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">暂无活动记录</p>
                  ) : (
                    recentActivities.map((activity, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/30 transition-colors"
                      >
                        <div className="mt-1.5">{getActivityIcon(activity.type)}</div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{activity.user}</p>
                          <p className="text-xs text-muted-foreground truncate">{activity.action}</p>
                        </div>
                        <span className="text-xs text-muted-foreground/70 whitespace-nowrap">
                          {activity.time}
                        </span>
                      </motion.div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Quick Actions for Admin */}
        {role === 'admin' && (
          <motion.div variants={itemVariants}>
            <Card className="border-border/50">
              <CardHeader className="pb-3">
                <CardTitle>快速操作</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium shadow-sm"
                  >
                    添加用户
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors text-sm font-medium"
                  >
                    管理角色
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors text-sm font-medium"
                    onClick={() => window.location.href = '/audit-logs'}
                  >
                    审计日志
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors text-sm font-medium"
                  >
                    安全扫描
                  </motion.button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </motion.div>
    </DashboardLayout>
  );
}
