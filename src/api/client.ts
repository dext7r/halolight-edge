const BASE_URL = import.meta.env.VITE_SUPABASE_URL || `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.supabase.opentrust.net`
const API_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
console.log(BASE_URL, API_KEY)
type RequestOptions = {
  method?: string
  body?: unknown
  token?: string
  params?: Record<string, string | number | undefined>
}

async function request<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, token, params } = opts

  const url = new URL(path, BASE_URL)
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined) url.searchParams.set(k, String(v))
    })
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'apikey': API_KEY,
  }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(url.toString(), {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: res.statusText }))
    throw new Error(error.message || error.error || res.statusText)
  }

  if (res.status === 204) return null as T
  return res.json()
}

// ============ Types ============

export type AppRole = 'admin' | 'moderator' | 'user'
export type AuditAction = 'user_login' | 'user_logout' | 'user_signup' | 'role_change' | 'permission_change' | 'profile_update' | 'password_reset' | 'user_delete'
export type ProfileStatus = 'active' | 'inactive' | 'suspended'

export interface Profile {
  id: string
  user_id: string
  email: string
  full_name?: string
  avatar_url?: string
  status: ProfileStatus
  created_at: string
  updated_at: string
}

export interface UserRole {
  id: string
  user_id: string
  role: AppRole
  created_at: string
}

export interface Permission {
  id: string
  name: string
  module: string
  description?: string
  created_at: string
}

export interface RolePermission {
  id: string
  role: AppRole
  permission_id: string
  created_at: string
}

export interface AuditLog {
  id: string
  user_id: string
  action: AuditAction
  target_user_id?: string
  details?: Record<string, unknown>
  ip_address?: string
  user_agent?: string
  created_at: string
}

export interface Notification {
  id: string
  title: string
  message: string
  type: string
  target_user_id?: string
  target_role?: string
  created_by?: string
  expires_at?: string
  created_at: string
}

export interface AuthResponse {
  access_token: string
  token_type: string
  expires_in: number
  refresh_token: string
  user: { id: string; email: string; created_at: string }
}

export interface DailyActivity {
  day: string
  action: AuditAction
  count: number
}

export interface RoleStatistics {
  role: AppRole
  user_count: number
}

export interface UserStatistics {
  month: string
  new_users: number
  total_users: number
}

export interface ApiToken {
  id: string
  name: string
  description?: string
  token: string
  permissions: string[]
  expires_at?: string
  last_used?: string
  status: 'active' | 'revoked' | 'expired'
  created_by?: string
  created_at: string
  updated_at: string
}

export interface ScheduledTask {
  id: string
  name: string
  description?: string
  url: string
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  headers?: string
  body?: string
  cron_expression: string
  enabled: boolean
  last_run?: string
  next_run?: string
  status: 'success' | 'error' | 'pending'
  created_by?: string
  created_at: string
  updated_at: string
}

export interface TaskExecutionHistory {
  id: string
  task_id: string
  status: 'success' | 'error'
  response_status?: number
  response_body?: string
  error_message?: string
  executed_at: string
}

// ============ API Client ============

export const api = {
  // 认证
  auth: {
    signup: (email: string, password: string) =>
      request<AuthResponse>('/auth/v1/signup', { method: 'POST', body: { email, password } }),

    login: (email: string, password: string) =>
      request<AuthResponse>('/auth/v1/token?grant_type=password', { method: 'POST', body: { email, password } }),

    logout: (token: string) =>
      request<void>('/auth/v1/logout', { method: 'POST', token }),
  },

  // 用户
  profiles: {
    list: (token: string, params?: { select?: string; order?: string; limit?: number; offset?: number }) =>
      request<Profile[]>('/rest/v1/profiles', { token, params }),

    get: (token: string, userId: string) =>
      request<Profile[]>(`/rest/v1/profiles?user_id=eq.${userId}`, { token }),

    create: (token: string, data: { user_id: string; email?: string; full_name?: string; avatar_url?: string }) =>
      request<Profile>('/rest/v1/profiles', { method: 'POST', token, body: data }),

    update: (token: string, userId: string, data: Partial<Pick<Profile, 'email' | 'full_name' | 'avatar_url' | 'status'>>) =>
      request<void>(`/rest/v1/profiles?user_id=eq.${userId}`, { method: 'PATCH', token, body: data }),

    delete: (token: string, userId: string) =>
      request<void>(`/rest/v1/profiles?user_id=eq.${userId}`, { method: 'DELETE', token }),
  },

  // 角色
  userRoles: {
    list: (token: string, params?: { user_id?: string; role?: string }) =>
      request<UserRole[]>('/rest/v1/user_roles', { token, params }),

    assign: (token: string, data: { user_id: string; role?: AppRole }) =>
      request<void>('/rest/v1/user_roles', { method: 'POST', token, body: data }),

    update: (token: string, userId: string, role: AppRole) =>
      request<void>(`/rest/v1/user_roles?user_id=eq.${userId}`, { method: 'PATCH', token, body: { role } }),

    remove: (token: string, userId: string) =>
      request<void>(`/rest/v1/user_roles?user_id=eq.${userId}`, { method: 'DELETE', token }),
  },

  // 权限
  permissions: {
    list: (token: string, params?: { module?: string }) =>
      request<Permission[]>('/rest/v1/permissions', { token, params }),

    create: (token: string, data: { name: string; module: string; description?: string }) =>
      request<void>('/rest/v1/permissions', { method: 'POST', token, body: data }),
  },

  // 角色权限
  rolePermissions: {
    list: (token: string, params?: { role?: string }) =>
      request<RolePermission[]>('/rest/v1/role_permissions', { token, params }),

    add: (token: string, data: { role: AppRole; permission_id: string }) =>
      request<void>('/rest/v1/role_permissions', { method: 'POST', token, body: data }),

    remove: (token: string, role: AppRole, permissionId: string) =>
      request<void>(`/rest/v1/role_permissions?role=eq.${role}&permission_id=eq.${permissionId}`, { method: 'DELETE', token }),
  },

  // 审计日志
  auditLogs: {
    list: (token: string, params?: { action?: string; user_id?: string; order?: string; limit?: number }) =>
      request<AuditLog[]>('/rest/v1/audit_logs', { token, params: { order: 'created_at.desc', limit: 50, ...params } }),
  },

  // 通知
  notifications: {
    list: (token: string, params?: { type?: string; target_role?: string }) =>
      request<Notification[]>('/rest/v1/notifications', { token, params }),

    create: (token: string, data: { title: string; message: string; type?: string; target_user_id?: string; target_role?: string; expires_at?: string }) =>
      request<void>('/rest/v1/notifications', { method: 'POST', token, body: data }),

    markRead: (token: string, notificationId: string, userId: string) =>
      request<void>('/rest/v1/user_notification_reads', { method: 'POST', token, body: { notification_id: notificationId, user_id: userId } }),
  },

  // 统计
  statistics: {
    dailyActivity: (token: string) => request<DailyActivity[]>('/rest/v1/daily_activity', { token }),
    roleStats: (token: string) => request<RoleStatistics[]>('/rest/v1/role_statistics', { token }),
    userStats: (token: string) => request<UserStatistics[]>('/rest/v1/user_statistics', { token }),
  },

  // RPC 函数
  rpc: {
    getUserRole: (token: string, userId: string) =>
      request<AppRole>('/rest/v1/rpc/get_user_role', { method: 'POST', token, body: { _user_id: userId } }),

    hasRole: (token: string, userId: string, role: AppRole) =>
      request<boolean>('/rest/v1/rpc/has_role', { method: 'POST', token, body: { _user_id: userId, _role: role } }),

    logAuditEvent: (token: string, action: AuditAction, details?: Record<string, unknown>, targetUserId?: string) =>
      request<string>('/rest/v1/rpc/log_audit_event', { method: 'POST', token, body: { p_action: action, p_details: details, p_target_user_id: targetUserId } }),
  },

  // API 令牌
  apiTokens: {
    list: (token: string) =>
      request<ApiToken[]>('/rest/v1/api_tokens?order=created_at.desc', { token }),

    create: (token: string, data: { name: string; description?: string; permissions?: string[]; expires_at?: string }) =>
      request<ApiToken>('/rest/v1/api_tokens', {
        method: 'POST',
        token,
        body: { ...data, token: `halo_${crypto.randomUUID().replace(/-/g, '')}`, status: 'active' },
      }),

    update: (token: string, id: string, data: Partial<{ name: string; description: string; permissions: string[]; status: string }>) =>
      request<void>(`/rest/v1/api_tokens?id=eq.${id}`, { method: 'PATCH', token, body: data }),

    delete: (token: string, id: string) =>
      request<void>(`/rest/v1/api_tokens?id=eq.${id}`, { method: 'DELETE', token }),

    revoke: (token: string, id: string) =>
      request<void>(`/rest/v1/api_tokens?id=eq.${id}`, { method: 'PATCH', token, body: { status: 'revoked' } }),
  },

  // 定时任务
  scheduledTasks: {
    list: (token: string) =>
      request<ScheduledTask[]>('/rest/v1/scheduled_tasks?order=created_at.desc', { token }),

    get: (token: string, id: string) =>
      request<ScheduledTask>(`/rest/v1/scheduled_tasks?id=eq.${id}`, { token }),

    create: (token: string, data: Omit<ScheduledTask, 'id' | 'created_at' | 'updated_at' | 'last_run' | 'next_run' | 'status'>) =>
      request<ScheduledTask>('/rest/v1/scheduled_tasks', { method: 'POST', token, body: { ...data, status: 'pending' } }),

    update: (token: string, id: string, data: Partial<Omit<ScheduledTask, 'id' | 'created_at' | 'updated_at'>>) =>
      request<void>(`/rest/v1/scheduled_tasks?id=eq.${id}`, { method: 'PATCH', token, body: data }),

    delete: (token: string, id: string) =>
      request<void>(`/rest/v1/scheduled_tasks?id=eq.${id}`, { method: 'DELETE', token }),

    toggle: (token: string, id: string, enabled: boolean) =>
      request<void>(`/rest/v1/scheduled_tasks?id=eq.${id}`, { method: 'PATCH', token, body: { enabled } }),

    getHistory: (token: string, taskId: string, limit = 20) =>
      request<TaskExecutionHistory[]>(`/rest/v1/task_execution_history?task_id=eq.${taskId}&order=executed_at.desc&limit=${limit}`, { token }),
  },

  // Edge Functions
  functions: {
    createUser: (token: string, data: { email: string; password: string; full_name?: string }) =>
      request<{ success: boolean; user: { id: string; email: string } }>('/functions/v1/create-user', { method: 'POST', token, body: data }),

    getEnv: () => request<Record<string, string>>('/functions/v1/get-env'),
  },
}

export default api
