import { useState, useEffect } from 'react';
import { Bell, Check, Trash2, Clock, Plus, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { ClearableInput } from './ui/clearable-input';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  created_at: string;
  read?: boolean;
}

export function NotificationDropdown() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [isManageDialogOpen, setIsManageDialogOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const { isAdmin, user } = useAuthContext();

  const [newNotification, setNewNotification] = useState({
    title: '',
    message: '',
    type: 'info' as 'info' | 'success' | 'warning' | 'error',
    target_role: 'all',
  });

  const fetchNotifications = async () => {
    if (!user) return;

    try {
      // Fetch notifications
      const { data: notifs, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      // Fetch read status
      const { data: reads } = await supabase
        .from('user_notification_reads')
        .select('notification_id')
        .eq('user_id', user.id);

      const readSet = new Set((reads || []).map(r => r.notification_id));
      setReadIds(readSet);

      setNotifications((notifs || []) as Notification[]);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('notifications-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
        },
        () => {
          fetchNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const unreadCount = notifications.filter(n => !readIds.has(n.id)).length;

  const markAsRead = async (id: string) => {
    if (!user || readIds.has(id)) return;

    try {
      await supabase
        .from('user_notification_reads')
        .insert({ user_id: user.id, notification_id: id });

      setReadIds(prev => new Set([...prev, id]));
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;

    const unreadNotifs = notifications.filter(n => !readIds.has(n.id));
    if (unreadNotifs.length === 0) return;

    try {
      const inserts = unreadNotifs.map(n => ({
        user_id: user.id,
        notification_id: n.id,
      }));

      await supabase.from('user_notification_reads').insert(inserts);

      setReadIds(new Set(notifications.map(n => n.id)));
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const deleteNotification = async (id: string) => {
    if (!isAdmin) return;

    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setNotifications(prev => prev.filter(n => n.id !== id));
      toast({ title: '通知已删除' });
    } catch (error) {
      console.error('Error deleting notification:', error);
      toast({
        title: '删除失败',
        variant: 'destructive',
      });
    }
  };

  const handleAddNotification = async () => {
    if (!newNotification.title || !newNotification.message) {
      toast({
        title: '请填写标题和内容',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase.from('notifications').insert({
        title: newNotification.title,
        message: newNotification.message,
        type: newNotification.type,
        target_role: newNotification.target_role === 'all' ? null : newNotification.target_role,
        created_by: user?.id,
      });

      if (error) throw error;

      toast({ title: '通知已发送' });
      setIsAddDialogOpen(false);
      setNewNotification({ title: '', message: '', type: 'info', target_role: 'all' });
      fetchNotifications();
    } catch (error) {
      console.error('Error adding notification:', error);
      toast({
        title: '发送失败',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const getTypeColor = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return 'bg-success';
      case 'warning':
        return 'bg-warning';
      case 'error':
        return 'bg-destructive';
      default:
        return 'bg-info';
    }
  };

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

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            <AnimatePresence>
              {unreadCount > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-destructive text-destructive-foreground text-xs font-medium rounded-full flex items-center justify-center"
                >
                  {unreadCount}
                </motion.span>
              )}
            </AnimatePresence>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-80">
          <DropdownMenuLabel className="flex items-center justify-between">
            <span>通知</span>
            <div className="flex items-center gap-1">
              {isAdmin && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto py-1 px-2 text-xs"
                  onClick={() => setIsAddDialogOpen(true)}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  发送
                </Button>
              )}
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto py-1 px-2 text-xs"
                  onClick={markAllAsRead}
                >
                  <Check className="h-3 w-3 mr-1" />
                  全部已读
                </Button>
              )}
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <ScrollArea className="h-72">
            {loading ? (
              <div className="py-8 text-center text-muted-foreground">
                <div className="h-8 w-8 mx-auto mb-2 animate-spin border-2 border-primary border-t-transparent rounded-full" />
                <p className="text-sm">加载中...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">暂无通知</p>
              </div>
            ) : (
              <div className="space-y-1 p-1">
                {notifications.map((notification) => {
                  const isRead = readIds.has(notification.id);
                  return (
                    <motion.div
                      key={notification.id}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className={`
                        relative p-3 rounded-lg cursor-pointer transition-colors group
                        ${isRead ? 'bg-transparent' : 'bg-muted/50'}
                        hover:bg-muted
                      `}
                      onClick={() => markAsRead(notification.id)}
                    >
                      <div className="flex gap-3">
                        <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${getTypeColor(notification.type)}`} />
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium ${isRead ? 'text-muted-foreground' : ''}`}>
                            {notification.title}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {notification.message}
                          </p>
                          <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground/70">
                            <Clock className="h-3 w-3" />
                            {formatTime(notification.created_at)}
                          </div>
                        </div>
                        {isAdmin && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 opacity-0 group-hover:opacity-100 hover:text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteNotification(notification.id);
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Add Notification Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>发送系统通知</DialogTitle>
            <DialogDescription>
              向所有用户或指定角色发送通知
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>标题</Label>
              <ClearableInput
                placeholder="通知标题"
                value={newNotification.title}
                onChange={(e) => setNewNotification({ ...newNotification, title: e.target.value })}
                onClear={() => setNewNotification({ ...newNotification, title: '' })}
              />
            </div>
            <div className="space-y-2">
              <Label>内容</Label>
              <Textarea
                placeholder="通知内容"
                value={newNotification.message}
                onChange={(e) => setNewNotification({ ...newNotification, message: e.target.value })}
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>类型</Label>
                <Select
                  value={newNotification.type}
                  onValueChange={(v) => setNewNotification({ ...newNotification, type: v as any })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="info">信息</SelectItem>
                    <SelectItem value="success">成功</SelectItem>
                    <SelectItem value="warning">警告</SelectItem>
                    <SelectItem value="error">错误</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>目标角色</Label>
                <Select
                  value={newNotification.target_role}
                  onValueChange={(v) => setNewNotification({ ...newNotification, target_role: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="全部用户" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部用户</SelectItem>
                    <SelectItem value="admin">管理员</SelectItem>
                    <SelectItem value="moderator">协管员</SelectItem>
                    <SelectItem value="user">普通用户</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleAddNotification} disabled={saving}>
              {saving ? '发送中...' : '发送通知'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
