import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  User, 
  Shield, 
  Bell, 
  Palette,
  Save,
  Camera,
  Loader2,
  Sun,
  Moon,
  Monitor
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useAuthContext } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

const roleLabels = {
  admin: '管理员',
  moderator: '协管员',
  user: '用户',
};

const themeOptions = [
  { value: 'light', label: '亮色模式', icon: Sun, description: '适合日间使用' },
  { value: 'dark', label: '暗色模式', icon: Moon, description: '保护眼睛，适合夜间' },
  { value: 'system', label: '跟随系统', icon: Monitor, description: '自动匹配系统设置' },
];

export default function Settings() {
  const { profile, role, user } = useAuthContext();
  const { theme, setTheme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: profile?.full_name || '',
    email: profile?.email || '',
  });
  const [notifications, setNotifications] = useState({
    email: true,
    security: true,
    updates: false,
  });

  const handleSaveProfile = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: formData.fullName,
        })
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: '保存成功',
        description: '个人信息已更新',
      });
    } catch (error) {
      console.error('Error saving profile:', error);
      toast({
        title: '保存失败',
        description: '请稍后重试',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const initials = formData.fullName
    ?.split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase() || formData.email?.[0]?.toUpperCase() || 'U';

  return (
    <DashboardLayout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">系统设置</h1>
          <p className="text-muted-foreground mt-1">
            管理您的账号和系统偏好设置
          </p>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="bg-muted/50 p-1">
            <TabsTrigger value="profile" className="gap-2">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">个人资料</span>
            </TabsTrigger>
            <TabsTrigger value="appearance" className="gap-2">
              <Palette className="h-4 w-4" />
              <span className="hidden sm:inline">外观主题</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="gap-2">
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">安全设置</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="gap-2">
              <Bell className="h-4 w-4" />
              <span className="hidden sm:inline">通知设置</span>
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle>个人资料</CardTitle>
                <CardDescription>更新您的个人信息</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Avatar Section */}
                <div className="flex items-center gap-6">
                  <div className="relative">
                    <Avatar className="h-24 w-24">
                      <AvatarImage src={profile?.avatar_url || undefined} />
                      <AvatarFallback className="bg-primary/10 text-primary text-2xl">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <button className="absolute bottom-0 right-0 p-2 bg-primary rounded-full text-primary-foreground hover:bg-primary/90 transition-colors">
                      <Camera className="h-4 w-4" />
                    </button>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{formData.fullName || '未设置'}</h3>
                    <p className="text-muted-foreground">{formData.email}</p>
                    {role && (
                      <Badge variant="secondary" className="mt-2">
                        {roleLabels[role]}
                      </Badge>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Form Fields */}
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">姓名</Label>
                    <Input
                      id="fullName"
                      value={formData.fullName}
                      onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                      placeholder="请输入您的姓名"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">邮箱</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      disabled
                      className="bg-muted"
                    />
                    <p className="text-xs text-muted-foreground">邮箱地址不可修改</p>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button onClick={handleSaveProfile} disabled={loading}>
                    {loading ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    保存更改
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Appearance Tab */}
          <TabsContent value="appearance">
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle>外观主题</CardTitle>
                <CardDescription>自定义您的界面主题偏好</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <RadioGroup
                  value={theme}
                  onValueChange={setTheme}
                  className="grid gap-4 md:grid-cols-3"
                >
                  {themeOptions.map((option) => {
                    const Icon = option.icon;
                    return (
                      <motion.label
                        key={option.value}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className={`
                          relative flex flex-col items-center gap-3 p-6 rounded-xl border-2 cursor-pointer transition-all
                          ${theme === option.value 
                            ? 'border-primary bg-primary/5' 
                            : 'border-border hover:border-primary/50 hover:bg-muted/50'
                          }
                        `}
                      >
                        <RadioGroupItem 
                          value={option.value} 
                          id={option.value}
                          className="sr-only"
                        />
                        <div className={`
                          p-3 rounded-xl
                          ${theme === option.value ? 'bg-primary/10' : 'bg-muted'}
                        `}>
                          <Icon className={`h-6 w-6 ${theme === option.value ? 'text-primary' : 'text-muted-foreground'}`} />
                        </div>
                        <div className="text-center">
                          <p className="font-medium">{option.label}</p>
                          <p className="text-xs text-muted-foreground mt-1">{option.description}</p>
                        </div>
                        {theme === option.value && (
                          <motion.div
                            layoutId="themeIndicator"
                            className="absolute top-3 right-3 w-2 h-2 bg-primary rounded-full"
                          />
                        )}
                      </motion.label>
                    );
                  })}
                </RadioGroup>

                <Separator />

                <div className="space-y-4">
                  <h4 className="font-medium">主题预览</h4>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="p-4 rounded-lg bg-card border">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Palette className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">主色调</p>
                          <p className="text-sm text-muted-foreground">Primary Color</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <div className="h-8 flex-1 rounded bg-primary" />
                        <div className="h-8 flex-1 rounded bg-primary/80" />
                        <div className="h-8 flex-1 rounded bg-primary/60" />
                        <div className="h-8 flex-1 rounded bg-primary/40" />
                        <div className="h-8 flex-1 rounded bg-primary/20" />
                      </div>
                    </div>
                    <div className="p-4 rounded-lg bg-card border">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                          <div className="w-5 h-5 rounded bg-muted-foreground/30" />
                        </div>
                        <div>
                          <p className="font-medium">中性色</p>
                          <p className="text-sm text-muted-foreground">Neutral Colors</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <div className="h-8 flex-1 rounded bg-foreground" />
                        <div className="h-8 flex-1 rounded bg-muted-foreground" />
                        <div className="h-8 flex-1 rounded bg-muted" />
                        <div className="h-8 flex-1 rounded bg-border" />
                        <div className="h-8 flex-1 rounded bg-background border" />
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security">
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle>安全设置</CardTitle>
                <CardDescription>管理您的账号安全选项</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">修改密码</h4>
                    <p className="text-sm text-muted-foreground">
                      定期更换密码以保障账号安全
                    </p>
                  </div>
                  <Button variant="outline">修改密码</Button>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">两步验证</h4>
                    <p className="text-sm text-muted-foreground">
                      增加额外的安全验证步骤
                    </p>
                  </div>
                  <Button variant="outline">设置</Button>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">登录记录</h4>
                    <p className="text-sm text-muted-foreground">
                      查看您的账号登录历史
                    </p>
                  </div>
                  <Button variant="outline">查看记录</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications">
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle>通知设置</CardTitle>
                <CardDescription>配置您希望接收的通知类型</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">邮件通知</h4>
                    <p className="text-sm text-muted-foreground">
                      接收重要的系统通知邮件
                    </p>
                  </div>
                  <Switch
                    checked={notifications.email}
                    onCheckedChange={(checked) => 
                      setNotifications(prev => ({ ...prev, email: checked }))
                    }
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">安全警报</h4>
                    <p className="text-sm text-muted-foreground">
                      账号异常登录或安全事件通知
                    </p>
                  </div>
                  <Switch
                    checked={notifications.security}
                    onCheckedChange={(checked) => 
                      setNotifications(prev => ({ ...prev, security: checked }))
                    }
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">产品更新</h4>
                    <p className="text-sm text-muted-foreground">
                      接收系统新功能和更新通知
                    </p>
                  </div>
                  <Switch
                    checked={notifications.updates}
                    onCheckedChange={(checked) => 
                      setNotifications(prev => ({ ...prev, updates: checked }))
                    }
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>
    </DashboardLayout>
  );
}
