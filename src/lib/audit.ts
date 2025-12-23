import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';

export type AuditAction = 
  | 'user_login'
  | 'user_logout'
  | 'user_signup'
  | 'role_change'
  | 'permission_change'
  | 'profile_update'
  | 'password_reset'
  | 'user_delete';

export interface AuditLog {
  id: string;
  user_id: string | null;
  action: AuditAction;
  target_user_id: string | null;
  details: Record<string, any>;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

export interface UserStatistics {
  month: string;
  new_users: number;
  total_users: number;
}

export interface RoleStatistics {
  role: string;
  user_count: number;
}

export interface DailyActivity {
  day: string;
  action: AuditAction;
  count: number;
}

// 记录审计日志
export async function logAuditEvent(
  action: AuditAction,
  targetUserId?: string,
  details?: Record<string, any>
): Promise<void> {
  try {
    const { error } = await supabase.rpc('log_audit_event', {
      p_action: action,
      p_target_user_id: targetUserId || null,
      p_details: details || {},
    });

    if (error) {
      console.error('Failed to log audit event:', error);
    }
  } catch (err) {
    console.error('Error logging audit event:', err);
  }
}

// 获取用户统计数据
export async function fetchUserStatistics(): Promise<UserStatistics[]> {
  const { data, error } = await supabase
    .from('user_statistics')
    .select('*')
    .order('month', { ascending: true });

  if (error) {
    console.error('Error fetching user statistics:', error);
    return [];
  }

  return (data || []).map(item => ({
    month: item.month,
    new_users: Number(item.new_users),
    total_users: Number(item.total_users),
  }));
}

// 获取角色统计数据
export async function fetchRoleStatistics(): Promise<RoleStatistics[]> {
  const { data, error } = await supabase
    .from('role_statistics')
    .select('*');

  if (error) {
    console.error('Error fetching role statistics:', error);
    return [];
  }

  return (data || []).map(item => ({
    role: item.role,
    user_count: Number(item.user_count),
  }));
}

// 获取每日活动统计
export async function fetchDailyActivity(): Promise<DailyActivity[]> {
  const { data, error } = await supabase
    .from('daily_activity')
    .select('*')
    .order('day', { ascending: false });

  if (error) {
    console.error('Error fetching daily activity:', error);
    return [];
  }

  return (data || []).map(item => ({
    day: item.day,
    action: item.action as AuditAction,
    count: Number(item.count),
  }));
}

// 获取审计日志列表
export async function fetchAuditLogs(limit = 50): Promise<AuditLog[]> {
  const { data, error } = await supabase
    .from('audit_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching audit logs:', error);
    return [];
  }

  return (data || []) as AuditLog[];
}

// 获取用户总数
export async function fetchTotalUsers(): Promise<number> {
  const { count, error } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true });

  if (error) {
    console.error('Error fetching total users:', error);
    return 0;
  }

  return count || 0;
}

// 获取今日新增用户
export async function fetchTodayNewUsers(): Promise<number> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { count, error } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', today.toISOString());

  if (error) {
    console.error('Error fetching today new users:', error);
    return 0;
  }

  return count || 0;
}
