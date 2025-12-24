import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  Shield, 
  Users, 
  RefreshCw
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { AppRole, Permission, RolePermission } from '@/types/auth';

interface RoleData {
  role: AppRole;
  label: string;
  description: string;
  color: string;
  userCount: number;
}

const roles: RoleData[] = [
  {
    role: 'admin',
    label: '管理员',
    description: '拥有系统所有权限，可以管理用户、角色和系统设置',
    color: 'bg-primary/10 text-primary',
    userCount: 0,
  },
  {
    role: 'moderator',
    label: '协管员',
    description: '可以查看和编辑用户信息，但不能修改角色权限',
    color: 'bg-warning/10 text-warning',
    userCount: 0,
  },
  {
    role: 'user',
    label: '普通用户',
    description: '基础用户权限，只能访问仪表盘',
    color: 'bg-muted text-muted-foreground',
    userCount: 0,
  },
];

const moduleLabels: Record<string, string> = {
  dashboard: '仪表盘',
  users: '用户管理',
  roles: '角色管理',
  settings: '系统设置',
};

export default function Roles() {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [rolePermissions, setRolePermissions] = useState<RolePermission[]>([]);
  const [loading, setLoading] = useState(true);
  const [roleCounts, setRoleCounts] = useState<Record<AppRole, number>>({
    admin: 0,
    moderator: 0,
    user: 0,
  });
  const [savingKey, setSavingKey] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [permsResult, rolePermsResult, userRolesResult] = await Promise.all([
        supabase.from('permissions').select('*').order('module'),
        supabase.from('role_permissions').select('*'),
        supabase.from('user_roles').select('role'),
      ]);

      if (permsResult.error) throw permsResult.error;
      if (rolePermsResult.error) throw rolePermsResult.error;
      if (userRolesResult.error) throw userRolesResult.error;

      const counts = { admin: 0, moderator: 0, user: 0 };
      (userRolesResult.data || []).forEach((ur) => {
        const role = ur.role as AppRole;
        if (role in counts) {
          counts[role]++;
        }
      });

      setPermissions(permsResult.data as Permission[] || []);
      setRolePermissions(rolePermsResult.data as RolePermission[] || []);
      setRoleCounts(counts);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: '获取数据失败',
        description: '请稍后重试',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const hasPermission = (role: AppRole, permissionId: string): boolean => {
    return rolePermissions.some(
      (rp) => rp.role === role && rp.permission_id === permissionId
    );
  };

  // Realtime toggle - saves immediately
  const togglePermission = async (role: AppRole, permissionId: string) => {
    const key = `${role}-${permissionId}`;
    const currentHas = hasPermission(role, permissionId);
    
    setSavingKey(key);
    
    try {
      if (currentHas) {
        // Remove permission
        const { error } = await supabase
          .from('role_permissions')
          .delete()
          .eq('role', role)
          .eq('permission_id', permissionId);

        if (error) throw error;

        // Optimistic update
        setRolePermissions(prev => 
          prev.filter(rp => !(rp.role === role && rp.permission_id === permissionId))
        );

        toast({
          title: '权限已移除',
          duration: 2000,
        });
      } else {
        // Add permission
        const { data, error } = await supabase
          .from('role_permissions')
          .insert({ role, permission_id: permissionId })
          .select()
          .single();

        if (error) throw error;

        // Optimistic update
        setRolePermissions(prev => [...prev, data as RolePermission]);

        toast({
          title: '权限已添加',
          duration: 2000,
        });
      }
    } catch (error) {
      console.error('Error toggling permission:', error);
      toast({
        title: '操作失败',
        description: '请稍后重试',
        variant: 'destructive',
      });
      // Refresh to get correct state
      fetchData();
    } finally {
      setSavingKey(null);
    }
  };

  // Group permissions by module
  const groupedPermissions = permissions.reduce((acc, perm) => {
    if (!acc[perm.module]) {
      acc[perm.module] = [];
    }
    acc[perm.module].push(perm);
    return acc;
  }, {} as Record<string, Permission[]>);

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
            <h1 className="text-3xl font-bold tracking-tight">角色权限</h1>
            <p className="text-muted-foreground mt-1">
              配置各角色的系统访问权限 · 修改实时生效
            </p>
          </div>
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button variant="outline" onClick={fetchData} disabled={loading} className="shadow-sm">
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              刷新
            </Button>
          </motion.div>
        </div>

        {/* Role Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {roles.map((roleData, index) => (
            <motion.div
              key={roleData.role}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="glass border-border/50 card-hover">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <Badge className={roleData.color}>{roleData.label}</Badge>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Users className="h-4 w-4" />
                      <span className="text-sm">{roleCounts[roleData.role]}</span>
                    </div>
                  </div>
                  <CardDescription className="mt-2">
                    {roleData.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Permissions Matrix */}
        <Card className="glass border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              权限配置矩阵
            </CardTitle>
            <CardDescription>
              为每个角色配置具体的操作权限，修改后立即生效
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              Object.entries(groupedPermissions).map(([module, perms]) => (
                <motion.div
                  key={module}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-4"
                >
                  <h3 className="font-semibold text-lg">
                    {moduleLabels[module] || module}
                  </h3>
                  <div className="rounded-lg border border-border/50 overflow-hidden">
                    <div className="grid grid-cols-4 gap-4 bg-muted/30 px-4 py-3 text-sm font-medium">
                      <div>权限</div>
                      {roles.map((r) => (
                        <div key={r.role} className="text-center">
                          {r.label}
                        </div>
                      ))}
                    </div>
                    <Separator />
                    {perms.map((perm, index) => (
                      <div key={perm.id}>
                        <div className="grid grid-cols-4 gap-4 px-4 py-3 items-center">
                          <div>
                            <p className="font-medium text-sm">{perm.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {perm.description}
                            </p>
                          </div>
                          {roles.map((r) => {
                            const key = `${r.role}-${perm.id}`;
                            const isChecked = hasPermission(r.role, perm.id);
                            const isSaving = savingKey === key;
                            
                            return (
                              <div key={r.role} className="flex justify-center">
                                <Switch
                                  checked={isChecked}
                                  onCheckedChange={() => togglePermission(r.role, perm.id)}
                                  disabled={r.role === 'admin' || isSaving}
                                  className={isSaving ? 'opacity-50' : ''}
                                />
                              </div>
                            );
                          })}
                        </div>
                        {index < perms.length - 1 && <Separator />}
                      </div>
                    ))}
                  </div>
                </motion.div>
              ))
            )}
          </CardContent>
        </Card>
      </motion.div>
    </DashboardLayout>
  );
}
