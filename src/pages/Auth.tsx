import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { Zap, Mail, Lock, User, ArrowRight, Loader2, ArrowLeft, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthContext } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

type AuthMode = 'login' | 'signup' | 'forgot' | 'reset-sent';

const loginSchema = z.object({
  email: z.string().email('请输入有效的邮箱地址'),
  password: z.string().min(6, '密码至少6个字符'),
});

const signupSchema = loginSchema.extend({
  fullName: z.string().min(2, '姓名至少2个字符').max(50, '姓名最多50个字符'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: '两次密码输入不一致',
  path: ['confirmPassword'],
});

const forgotSchema = z.object({
  email: z.string().email('请输入有效的邮箱地址'),
});

export default function Auth() {
  const [mode, setMode] = useState<AuthMode>('login');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { user, signIn, signUp } = useAuthContext();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    try {
      if (mode === 'login') {
        const validated = loginSchema.parse(formData);
        setLoading(true);
        const { error } = await signIn(validated.email, validated.password);
        
        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            toast({
              title: '登录失败',
              description: '邮箱或密码错误',
              variant: 'destructive',
            });
          } else {
            toast({
              title: '登录失败',
              description: error.message,
              variant: 'destructive',
            });
          }
        } else {
          toast({
            title: '登录成功',
            description: '欢迎回来！',
          });
        }
      } else if (mode === 'signup') {
        const validated = signupSchema.parse(formData);
        setLoading(true);
        const { error } = await signUp(validated.email, validated.password, validated.fullName);
        
        if (error) {
          if (error.message.includes('already registered')) {
            toast({
              title: '注册失败',
              description: '该邮箱已被注册',
              variant: 'destructive',
            });
          } else {
            toast({
              title: '注册失败',
              description: error.message,
              variant: 'destructive',
            });
          }
        } else {
          toast({
            title: '注册成功',
            description: '账号创建成功，正在登录...',
          });
        }
      } else if (mode === 'forgot') {
        const validated = forgotSchema.parse(formData);
        setLoading(true);
        
        const { error } = await supabase.auth.resetPasswordForEmail(validated.email, {
          redirectTo: `${window.location.origin}/auth?mode=reset`,
        });

        if (error) {
          toast({
            title: '发送失败',
            description: error.message,
            variant: 'destructive',
          });
        } else {
          setMode('reset-sent');
        }
      }
    } catch (err) {
      if (err instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        err.errors.forEach((e) => {
          if (e.path[0]) {
            fieldErrors[e.path[0] as string] = e.message;
          }
        });
        setErrors(fieldErrors);
      }
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (newMode: AuthMode) => {
    setMode(newMode);
    setErrors({});
    if (newMode === 'login' || newMode === 'signup') {
      setFormData({
        email: '',
        password: '',
        fullName: '',
        confirmPassword: '',
      });
    }
  };

  const renderTitle = () => {
    switch (mode) {
      case 'login':
        return { title: '欢迎回来', subtitle: '请输入您的账号信息登录系统' };
      case 'signup':
        return { title: '创建账号', subtitle: '填写以下信息创建您的账号' };
      case 'forgot':
        return { title: '找回密码', subtitle: '输入您的邮箱，我们将发送重置链接' };
      case 'reset-sent':
        return { title: '邮件已发送', subtitle: '请检查您的邮箱并点击重置链接' };
    }
  };

  const { title, subtitle } = renderTitle();

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Panel - Branding */}
      <motion.div
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
        className="hidden lg:flex lg:w-1/2 bg-card relative overflow-hidden"
      >
        {/* Background Effects */}
        <div className="absolute inset-0 bg-grid opacity-30" />
        <div className="absolute inset-0 bg-radial-mask" />
        
        {/* Floating Elements */}
        <motion.div
          animate={{ 
            y: [0, -20, 0],
            rotate: [0, 5, 0],
          }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-20 right-20 w-32 h-32 bg-primary/10 rounded-full blur-3xl"
        />
        <motion.div
          animate={{ 
            y: [0, 20, 0],
            rotate: [0, -5, 0],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute bottom-32 left-20 w-48 h-48 bg-primary/5 rounded-full blur-3xl"
        />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center px-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            <div className="flex items-center gap-3 mb-8">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Zap className="h-7 w-7 text-primary" />
              </div>
              <h1 className="text-3xl font-bold">RBAC Admin</h1>
            </div>
            
            <h2 className="text-4xl font-bold mb-6 leading-tight">
              企业级权限管理
              <br />
              <span className="text-gradient">后台管理系统</span>
            </h2>
            
            <p className="text-lg text-muted-foreground max-w-md">
              基于 RBAC 模型的可插拔权限管理系统，支持细粒度的角色权限控制，
              为您的企业提供安全、灵活的管理解决方案。
            </p>

            <div className="mt-12 flex items-center gap-8">
              <div>
                <div className="text-3xl font-bold text-primary">99.9%</div>
                <div className="text-sm text-muted-foreground">系统可用性</div>
              </div>
              <div className="w-px h-12 bg-border" />
              <div>
                <div className="text-3xl font-bold text-primary">256-bit</div>
                <div className="text-sm text-muted-foreground">加密传输</div>
              </div>
              <div className="w-px h-12 bg-border" />
              <div>
                <div className="text-3xl font-bold text-primary">24/7</div>
                <div className="text-sm text-muted-foreground">安全监控</div>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Right Panel - Form */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="flex-1 flex items-center justify-center p-8"
      >
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Zap className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-2xl font-bold">RBAC Admin</h1>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={mode}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {/* Back Button for forgot/reset-sent */}
              {(mode === 'forgot' || mode === 'reset-sent') && (
                <button
                  onClick={() => switchMode('login')}
                  className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
                >
                  <ArrowLeft className="h-4 w-4" />
                  返回登录
                </button>
              )}

              <h2 className="text-2xl font-bold mb-2">{title}</h2>
              <p className="text-muted-foreground mb-8">{subtitle}</p>

              {mode === 'reset-sent' ? (
                <div className="text-center py-8">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200 }}
                    className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-6"
                  >
                    <CheckCircle className="h-8 w-8 text-success" />
                  </motion.div>
                  <p className="text-muted-foreground mb-6">
                    我们已向 <span className="text-foreground font-medium">{formData.email}</span> 发送了密码重置链接。
                    请检查您的收件箱（包括垃圾邮件文件夹）。
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => switchMode('login')}
                    className="w-full"
                  >
                    返回登录
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  {mode === 'signup' && (
                    <div className="space-y-2">
                      <Label htmlFor="fullName">姓名</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="fullName"
                          name="fullName"
                          placeholder="请输入您的姓名"
                          value={formData.fullName}
                          onChange={handleChange}
                          className="pl-10 input-glow"
                        />
                      </div>
                      {errors.fullName && (
                        <p className="text-sm text-destructive">{errors.fullName}</p>
                      )}
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="email">邮箱</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="请输入邮箱地址"
                        value={formData.email}
                        onChange={handleChange}
                        className="pl-10 input-glow"
                      />
                    </div>
                    {errors.email && (
                      <p className="text-sm text-destructive">{errors.email}</p>
                    )}
                  </div>

                  {mode !== 'forgot' && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="password">密码</Label>
                        {mode === 'login' && (
                          <button
                            type="button"
                            onClick={() => switchMode('forgot')}
                            className="text-sm text-primary hover:underline"
                          >
                            忘记密码？
                          </button>
                        )}
                      </div>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="password"
                          name="password"
                          type="password"
                          placeholder="请输入密码"
                          value={formData.password}
                          onChange={handleChange}
                          className="pl-10 input-glow"
                        />
                      </div>
                      {errors.password && (
                        <p className="text-sm text-destructive">{errors.password}</p>
                      )}
                    </div>
                  )}

                  {mode === 'signup' && (
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">确认密码</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="confirmPassword"
                          name="confirmPassword"
                          type="password"
                          placeholder="请再次输入密码"
                          value={formData.confirmPassword}
                          onChange={handleChange}
                          className="pl-10 input-glow"
                        />
                      </div>
                      {errors.confirmPassword && (
                        <p className="text-sm text-destructive">{errors.confirmPassword}</p>
                      )}
                    </div>
                  )}

                  <Button 
                    type="submit" 
                    className="w-full h-11 text-base font-medium group"
                    disabled={loading}
                  >
                    {loading ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <>
                        {mode === 'login' && '登录'}
                        {mode === 'signup' && '注册'}
                        {mode === 'forgot' && '发送重置链接'}
                        <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </>
                    )}
                  </Button>
                </form>
              )}

              {(mode === 'login' || mode === 'signup') && (
                <div className="mt-6 text-center">
                  <button
                    type="button"
                    onClick={() => switchMode(mode === 'login' ? 'signup' : 'login')}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {mode === 'login' ? '没有账号？' : '已有账号？'}
                    <span className="font-medium text-primary ml-1">
                      {mode === 'login' ? '立即注册' : '立即登录'}
                    </span>
                  </button>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
