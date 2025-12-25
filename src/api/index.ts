import { ref, shallowRef } from 'vue'
import api, {
  type Profile,
  type UserRole,
  type Permission,
  type RolePermission,
  type AuditLog,
  type Notification,
  type DailyActivity,
  type RoleStatistics,
  type UserStatistics,
  type AuthResponse,
  type AppRole,
  type AuditAction,
} from './client'

export { api }
export type { Profile, UserRole, Permission, RolePermission, AuditLog, Notification, AppRole, AuditAction }

function useRequest<T, Args extends unknown[]>(fn: (...args: Args) => Promise<T>) {
  const data = shallowRef<T | null>(null)
  const loading = ref(false)
  const error = ref<Error | null>(null)

  const execute = async (...args: Args): Promise<T | null> => {
    loading.value = true
    error.value = null
    try {
      data.value = await fn(...args)
      return data.value
    } catch (e) {
      error.value = e as Error
      return null
    } finally {
      loading.value = false
    }
  }

  return { data, loading, error, execute }
}

// ============ Auth ============

export function useLogin() {
  return useRequest((email: string, password: string) => api.auth.login(email, password))
}

export function useSignup() {
  return useRequest((email: string, password: string) => api.auth.signup(email, password))
}

export function useLogout() {
  return useRequest((token: string) => api.auth.logout(token))
}

// ============ Profiles ============

export function useProfiles() {
  return useRequest((token: string, params?: { select?: string; order?: string; limit?: number; offset?: number }) =>
    api.profiles.list(token, params)
  )
}

export function useProfile() {
  return useRequest((token: string, userId: string) => api.profiles.get(token, userId))
}

export function useCreateProfile() {
  return useRequest((token: string, data: { user_id: string; email?: string; full_name?: string }) =>
    api.profiles.create(token, data)
  )
}

export function useUpdateProfile() {
  return useRequest((token: string, userId: string, data: Partial<Profile>) =>
    api.profiles.update(token, userId, data)
  )
}

export function useDeleteProfile() {
  return useRequest((token: string, userId: string) => api.profiles.delete(token, userId))
}

// ============ User Roles ============

export function useUserRoles() {
  return useRequest((token: string, params?: { user_id?: string; role?: string }) =>
    api.userRoles.list(token, params)
  )
}

export function useAssignRole() {
  return useRequest((token: string, data: { user_id: string; role?: AppRole }) =>
    api.userRoles.assign(token, data)
  )
}

export function useUpdateRole() {
  return useRequest((token: string, userId: string, role: AppRole) =>
    api.userRoles.update(token, userId, role)
  )
}

export function useRemoveRole() {
  return useRequest((token: string, userId: string) => api.userRoles.remove(token, userId))
}

// ============ Permissions ============

export function usePermissions() {
  return useRequest((token: string, params?: { module?: string }) => api.permissions.list(token, params))
}

export function useCreatePermission() {
  return useRequest((token: string, data: { name: string; module: string; description?: string }) =>
    api.permissions.create(token, data)
  )
}

// ============ Role Permissions ============

export function useRolePermissions() {
  return useRequest((token: string, params?: { role?: string }) => api.rolePermissions.list(token, params))
}

export function useAddRolePermission() {
  return useRequest((token: string, data: { role: AppRole; permission_id: string }) =>
    api.rolePermissions.add(token, data)
  )
}

export function useRemoveRolePermission() {
  return useRequest((token: string, role: AppRole, permissionId: string) =>
    api.rolePermissions.remove(token, role, permissionId)
  )
}

// ============ Audit Logs ============

export function useAuditLogs() {
  return useRequest((token: string, params?: { action?: string; user_id?: string; limit?: number }) =>
    api.auditLogs.list(token, params)
  )
}

// ============ Notifications ============

export function useNotifications() {
  return useRequest((token: string, params?: { type?: string; target_role?: string }) =>
    api.notifications.list(token, params)
  )
}

export function useCreateNotification() {
  return useRequest((token: string, data: { title: string; message: string; type?: string; target_role?: string }) =>
    api.notifications.create(token, data)
  )
}

export function useMarkNotificationRead() {
  return useRequest((token: string, notificationId: string, userId: string) =>
    api.notifications.markRead(token, notificationId, userId)
  )
}

// ============ Statistics ============

export function useDailyActivity() {
  return useRequest((token: string) => api.statistics.dailyActivity(token))
}

export function useRoleStatistics() {
  return useRequest((token: string) => api.statistics.roleStats(token))
}

export function useUserStatistics() {
  return useRequest((token: string) => api.statistics.userStats(token))
}

// ============ RPC ============

export function useGetUserRole() {
  return useRequest((token: string, userId: string) => api.rpc.getUserRole(token, userId))
}

export function useHasRole() {
  return useRequest((token: string, userId: string, role: AppRole) => api.rpc.hasRole(token, userId, role))
}

export function useLogAuditEvent() {
  return useRequest((token: string, action: AuditAction, details?: Record<string, unknown>, targetUserId?: string) =>
    api.rpc.logAuditEvent(token, action, details, targetUserId)
  )
}

// ============ Edge Functions ============

export function useCreateUser() {
  return useRequest((token: string, data: { email: string; password: string; full_name?: string }) =>
    api.functions.createUser(token, data)
  )
}

export function useGetEnv() {
  return useRequest(() => api.functions.getEnv())
}
