import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  Search, 
  Plus, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Shield,
  Filter,
  Download,
  RefreshCw,
  UserX,
  UserCheck,
  X
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { ClearableInput } from '@/components/ui/clearable-input';
import { Card, CardContent } from '@/components/ui/card';
import { DataTable, Column } from '@/components/ui/data-table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { AppRole, Profile } from '@/types/auth';

interface UserWithRole extends Profile {
  role?: AppRole;
  status?: 'active' | 'disabled';
}

const roleConfig = {
  admin: { label: '管理员', variant: 'default' as const, color: 'bg-primary/10 text-primary' },
  moderator: { label: '协管员', variant: 'secondary' as const, color: 'bg-warning/10 text-warning' },
  user: { label: '用户', variant: 'outline' as const, color: 'bg-muted text-muted-foreground' },
};

const statusConfig = {
  active: { label: '正常', color: 'bg-success/10 text-success' },
  disabled: { label: '已禁用', color: 'bg-destructive/10 text-destructive' },
};

type DialogType = 'add' | 'edit' | 'role' | 'delete' | null;

export default function Users() {
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<UserWithRole | null>(null);
  const [dialogType, setDialogType] = useState<DialogType>(null);
  const [newRole, setNewRole] = useState<AppRole>('user');
  const [saving, setSaving] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  
  // Form states
  const [formData, setFormData] = useState({
    email: '',
    full_name: '',
    password: '',
  });

  const { isAdmin } = useAuthContext();

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data: profiles, error, count } = await supabase
        .from('profiles')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false });

      if (error) throw error;

      const usersWithRoles = await Promise.all(
        (profiles || []).map(async (profile) => {
          const { data: roleData } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', profile.user_id)
            .maybeSingle();

          return {
            ...profile,
            role: (roleData?.role as AppRole) || 'user',
            status: (profile as any).status || 'active',
          } as UserWithRole;
        })
      );

      setUsers(usersWithRoles);
      setPagination(prev => ({ ...prev, total: count || 0 }));
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: '获取用户列表失败',
        description: '请稍后重试',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleUpdateRole = async () => {
    if (!selectedUser || !isAdmin) return;

    setSaving(true);
    try {
      const { data: existingRole } = await supabase
        .from('user_roles')
        .select('id')
        .eq('user_id', selectedUser.user_id)
        .maybeSingle();

      if (existingRole) {
        const { error } = await supabase
          .from('user_roles')
          .update({ role: newRole })
          .eq('user_id', selectedUser.user_id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('user_roles')
          .insert({ user_id: selectedUser.user_id, role: newRole });

        if (error) throw error;
      }

      toast({
        title: '角色更新成功',
        description: `${selectedUser.full_name || selectedUser.email} 的角色已更新为 ${roleConfig[newRole].label}`,
      });

      setDialogType(null);
      fetchUsers();
    } catch (error) {
      console.error('Error updating role:', error);
      toast({
        title: '更新角色失败',
        description: '请稍后重试',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleUserStatus = async (user: UserWithRole) => {
    if (!isAdmin) return;

    const newStatus = user.status === 'active' ? 'disabled' : 'active';
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ status: newStatus })
        .eq('user_id', user.user_id);

      if (error) throw error;

      toast({
        title: newStatus === 'disabled' ? '用户已禁用' : '用户已启用',
        description: `${user.full_name || user.email} ${newStatus === 'disabled' ? '已被禁用' : '已恢复正常'}`,
      });

      fetchUsers();
    } catch (error) {
      console.error('Error toggling user status:', error);
      toast({
        title: '操作失败',
        description: '请稍后重试',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser || !isAdmin) return;

    setSaving(true);
    try {
      // Note: In production, you'd typically call an edge function to delete the auth user
      // For now, we'll just mark them as deleted by disabling
      const { error } = await supabase
        .from('profiles')
        .update({ status: 'disabled' })
        .eq('user_id', selectedUser.user_id);

      if (error) throw error;

      toast({
        title: '用户已删除',
        description: `${selectedUser.full_name || selectedUser.email} 已被删除`,
      });

      setDialogType(null);
      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({
        title: '删除失败',
        description: '请稍后重试',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleEditUser = async () => {
    if (!selectedUser || !isAdmin) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: formData.full_name })
        .eq('user_id', selectedUser.user_id);

      if (error) throw error;

      toast({
        title: '用户信息已更新',
      });

      setDialogType(null);
      fetchUsers();
    } catch (error) {
      console.error('Error updating user:', error);
      toast({
        title: '更新失败',
        description: '请稍后重试',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchesSearch = 
        (user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesRole = roleFilter === 'all' || user.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [users, searchQuery, roleFilter]);

  const paginatedData = useMemo(() => {
    const start = (pagination.current - 1) * pagination.pageSize;
    const end = start + pagination.pageSize;
    return filteredUsers.slice(start, end);
  }, [filteredUsers, pagination.current, pagination.pageSize]);

  const columns: Column<UserWithRole>[] = [
    {
      key: 'full_name',
      title: '用户',
      sortable: true,
      render: (_, user) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9">
            <AvatarImage src={user.avatar_url || undefined} />
            <AvatarFallback className="bg-primary/10 text-primary text-sm">
              {user.full_name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">{user.full_name || '未设置'}</p>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      title: '角色',
      sortable: true,
      render: (_, user) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${roleConfig[user.role || 'user'].color}`}>
          {roleConfig[user.role || 'user'].label}
        </span>
      ),
    },
    {
      key: 'status',
      title: '状态',
      sortable: true,
      render: (_, user) => {
        const status = user.status || 'active';
        return (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusConfig[status].color}`}>
            {statusConfig[status].label}
          </span>
        );
      },
    },
    {
      key: 'created_at',
      title: '注册时间',
      sortable: true,
      className: 'hidden md:table-cell',
      render: (value) => new Date(value).toLocaleDateString('zh-CN'),
    },
    {
      key: 'updated_at',
      title: '最后更新',
      sortable: true,
      className: 'hidden md:table-cell',
      render: (value) => new Date(value).toLocaleDateString('zh-CN'),
    },
    {
      key: 'actions',
      title: '操作',
      className: 'text-right',
      render: (_, user) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => {
                setSelectedUser(user);
                setFormData({ ...formData, full_name: user.full_name || '' });
                setDialogType('edit');
              }}
            >
              <Edit className="mr-2 h-4 w-4" />
              编辑信息
            </DropdownMenuItem>
            {isAdmin && (
              <>
                <DropdownMenuItem 
                  onClick={() => {
                    setSelectedUser(user);
                    setNewRole(user.role || 'user');
                    setDialogType('role');
                  }}
                >
                  <Shield className="mr-2 h-4 w-4" />
                  修改角色
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => handleToggleUserStatus(user)}
                >
                  {user.status === 'disabled' ? (
                    <>
                      <UserCheck className="mr-2 h-4 w-4" />
                      启用用户
                    </>
                  ) : (
                    <>
                      <UserX className="mr-2 h-4 w-4" />
                      禁用用户
                    </>
                  )}
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="text-destructive focus:text-destructive"
                  onClick={() => {
                    setSelectedUser(user);
                    setDialogType('delete');
                  }}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  删除用户
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
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
            <h1 className="text-3xl font-bold tracking-tight">用户管理</h1>
            <p className="text-muted-foreground mt-1">
              管理系统用户及其角色权限 · 共 {filteredUsers.length} 名用户
            </p>
          </div>
          {isAdmin && (
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button 
                className="gap-2 shadow-sm shadow-primary/20"
                onClick={() => {
                  setFormData({ email: '', full_name: '', password: '' });
                  setDialogType('add');
                }}
              >
                <Plus className="h-4 w-4" />
                添加用户
              </Button>
            </motion.div>
          )}
        </div>

        {/* Filters */}
        <Card className="glass border-border/50">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <ClearableInput
                  placeholder="搜索用户名或邮箱..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onClear={() => setSearchQuery('')}
                  className="pl-10"
                />
              </div>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-full sm:w-40">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="筛选角色" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部角色</SelectItem>
                  <SelectItem value="admin">管理员</SelectItem>
                  <SelectItem value="moderator">协管员</SelectItem>
                  <SelectItem value="user">用户</SelectItem>
                </SelectContent>
              </Select>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button variant="outline" size="icon" onClick={fetchUsers} className="hover:bg-primary/10">
                  <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button variant="outline" size="icon" className="hover:bg-primary/10">
                  <Download className="h-4 w-4" />
                </Button>
              </motion.div>
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card className="glass border-border/50">
          <CardContent className="p-0">
            <DataTable
              columns={columns}
              data={paginatedData}
              rowKey="id"
              loading={loading}
              pagination={{
                current: pagination.current,
                pageSize: pagination.pageSize,
                total: filteredUsers.length,
                onChange: (page, pageSize) => setPagination({ ...pagination, current: page, pageSize }),
              }}
            />
          </CardContent>
        </Card>

        {/* Add User Dialog */}
        <Dialog open={dialogType === 'add'} onOpenChange={(open) => !open && setDialogType(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>添加用户</DialogTitle>
              <DialogDescription>
                创建新用户账户。用户将收到一封包含登录信息的邮件。
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>邮箱</Label>
                <ClearableInput
                  type="email"
                  placeholder="user@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  onClear={() => setFormData({ ...formData, email: '' })}
                />
              </div>
              <div className="space-y-2">
                <Label>姓名</Label>
                <ClearableInput
                  placeholder="用户姓名"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  onClear={() => setFormData({ ...formData, full_name: '' })}
                />
              </div>
              <div className="space-y-2">
                <Label>密码</Label>
                <ClearableInput
                  type="password"
                  placeholder="设置密码"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  onClear={() => setFormData({ ...formData, password: '' })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogType(null)}>
                取消
              </Button>
              <Button disabled={saving}>
                {saving ? '创建中...' : '创建用户'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit User Dialog */}
        <Dialog open={dialogType === 'edit'} onOpenChange={(open) => !open && setDialogType(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>编辑用户信息</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={selectedUser?.avatar_url || undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {selectedUser?.full_name?.[0]?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm text-muted-foreground">{selectedUser?.email}</p>
                </div>
              </div>
              <div className="space-y-2">
                <Label>姓名</Label>
                <ClearableInput
                  placeholder="用户姓名"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  onClear={() => setFormData({ ...formData, full_name: '' })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogType(null)}>
                取消
              </Button>
              <Button onClick={handleEditUser} disabled={saving}>
                {saving ? '保存中...' : '保存'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Role Update Dialog */}
        <Dialog open={dialogType === 'role'} onOpenChange={(open) => !open && setDialogType(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>修改用户角色</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={selectedUser?.avatar_url || undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {selectedUser?.full_name?.[0]?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{selectedUser?.full_name}</p>
                  <p className="text-sm text-muted-foreground">{selectedUser?.email}</p>
                </div>
              </div>
              <div className="space-y-2">
                <Label>选择新角色</Label>
                <Select value={newRole} onValueChange={(v) => setNewRole(v as AppRole)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">管理员</SelectItem>
                    <SelectItem value="moderator">协管员</SelectItem>
                    <SelectItem value="user">用户</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogType(null)}>
                取消
              </Button>
              <Button onClick={handleUpdateRole} disabled={saving}>
                {saving ? '保存中...' : '确认修改'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete User Dialog */}
        <Dialog open={dialogType === 'delete'} onOpenChange={(open) => !open && setDialogType(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>确认删除用户</DialogTitle>
              <DialogDescription>
                此操作无法撤销。确定要删除用户 "{selectedUser?.full_name || selectedUser?.email}" 吗？
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogType(null)}>
                取消
              </Button>
              <Button variant="destructive" onClick={handleDeleteUser} disabled={saving}>
                {saving ? '删除中...' : '确认删除'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </motion.div>
    </DashboardLayout>
  );
}
