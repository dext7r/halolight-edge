import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Shield, 
  Users, 
  Check, 
  X, 
  Save,
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
  const [saving, setSaving] = useState(false);
  const [roleCounts, setRoleCounts] = useState<Record<AppRole, number>>({
    admin: 0,
    moderator: 0,
    user: 0,
  });
  const [pendingChanges, setPendingChanges] = useState<Map<string, boolean>>(new Map());

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch permissions
      const { data: perms, error: permsError } = await supabase
        .from('permissions')
        .select('*')
        .order('module');

      if (permsError) throw permsError;

      // Fetch role permissions
      const { data: rolePerms, error: rolePermsError } = await supabase
        .from('role_permissions')
        .select('*');

      if (rolePermsError) throw rolePermsError;

      // Fetch user counts per role
      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('role');

      if (rolesError) throw rolesError;

      const counts = { admin: 0, moderator: 0, user: 0 };
      (userRoles || []).forEach((ur) => {
        const role = ur.role as AppRole;
        if (role in counts) {
          counts[role]++;
        }
      });

      setPermissions(perms as Permission[] || []);
      setRolePermissions(rolePerms as RolePermission[] || []);
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
  };

  useEffect(() => {
    fetchData();
  }, []);

  const hasPermission = (role: AppRole, permissionId: string): boolean => {
    const key = `${role}-${permissionId}`;
    if (pendingChanges.has(key)) {
      return pendingChanges.get(key)!;
    }
    return rolePermissions.some(
      (rp) => rp.role === role && rp.permission_id === permissionId
    );
  };

  const togglePermission = (role: AppRole, permissionId: string) => {
    const key = `${role}-${permissionId}`;
    const currentValue = hasPermission(role, permissionId);
    setPendingChanges(new Map(pendingChanges.set(key, !currentValue)));
  };

  const saveChanges = async () => {
    if (pendingChanges.size === 0) return;

    setSaving(true);
    try {
      for (const [key, shouldHave] of pendingChanges) {
        const [role, permissionId] = key.split('-') as [AppRole, string];
        const exists = rolePermissions.some(
          (rp) => rp.role === role && rp.permission_id === permissionId
        );

        if (shouldHave && !exists) {
          // Add permission
          await supabase
            .from('role_permissions')
            .insert({ role, permission_id: permissionId });
        } else if (!shouldHave && exists) {
          // Remove permission
          await supabase
            .from('role_permissions')
            .delete()
            .eq('role', role)
            .eq('permission_id', permissionId);
        }
      }

      toast({
        title: '保存成功',
        description: '权限配置已更新',
      });

      setPendingChanges(new Map());
      fetchData();
    } catch (error) {
      console.error('Error saving changes:', error);
      toast({
        title: '保存失败',
        description: '请稍后重试',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
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
              配置各角色的系统访问权限
            </p>
          </div>
          <div className="flex gap-3">
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button variant="outline" onClick={fetchData} disabled={loading} className="shadow-sm">
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                刷新
              </Button>
            </motion.div>
            {pendingChanges.size > 0 && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.02 }} 
                whileTap={{ scale: 0.98 }}
              >
                <Button onClick={saveChanges} disabled={saving} className="shadow-sm shadow-primary/20">
                  <Save className="h-4 w-4 mr-2" />
                  保存更改 ({pendingChanges.size})
                </Button>
              </motion.div>
            )}
          </div>
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
              为每个角色配置具体的操作权限
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
                          {roles.map((r) => (
                            <div key={r.role} className="flex justify-center">
                              <Switch
                                checked={hasPermission(r.role, perm.id)}
                                onCheckedChange={() => togglePermission(r.role, perm.id)}
                                disabled={r.role === 'admin'} // Admin always has all permissions
                              />
                            </div>
                          ))}
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
