import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Zap, Shield, Users, Lock, BarChart3, Settings,
  ArrowRight, CheckCircle, Globe, Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';

const features = [
  {
    icon: Shield,
    title: '细粒度权限控制',
    description: '基于 RBAC 模型，支持角色、权限的灵活配置，精确控制每个功能的访问权限。',
  },
  {
    icon: Users,
    title: '用户管理',
    description: '完整的用户生命周期管理，包括注册、角色分配、状态管理等功能。',
  },
  {
    icon: Lock,
    title: '安全审计',
    description: '全面的操作日志记录，支持追踪每一次关键操作，确保系统安全合规。',
  },
  {
    icon: BarChart3,
    title: '数据可视化',
    description: '直观的数据仪表盘，实时展示系统运行状态和关键业务指标。',
  },
  {
    icon: Settings,
    title: '灵活配置',
    description: '支持多主题切换、个性化设置，满足不同企业的定制化需求。',
  },
  {
    icon: Globe,
    title: '多端适配',
    description: '响应式设计，完美适配桌面端和移动端，随时随地管理您的系统。',
  },
];

const stats = [
  { value: '99.9%', label: '系统可用性' },
  { value: '256-bit', label: '数据加密' },
  { value: '24/7', label: '安全监控' },
  { value: '100+', label: '权限节点' },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 glass border-b border-border/50">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Zap className="h-5 w-5 text-primary" />
            </div>
            <span className="text-xl font-bold">RBAC Admin</span>
          </Link>
          
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Link to="/auth?mode=login">
              <Button variant="ghost" className="hidden sm:inline-flex">
                登录
              </Button>
            </Link>
            <Link to="/auth?mode=signup">
              <Button className="gap-2">
                免费注册
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-grid opacity-30" />
        <div className="absolute inset-0 bg-radial-mask" />
        
        <motion.div
          animate={{ y: [0, -20, 0], rotate: [0, 5, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-40 right-[20%] w-72 h-72 bg-primary/10 rounded-full blur-3xl"
        />
        <motion.div
          animate={{ y: [0, 20, 0], rotate: [0, -5, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute bottom-20 left-[10%] w-96 h-96 bg-primary/5 rounded-full blur-3xl"
        />

        <div className="container mx-auto px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center max-w-4xl mx-auto"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-8">
              <Sparkles className="h-4 w-4" />
              企业级权限管理解决方案
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6">
              更智能的
              <span className="text-gradient"> RBAC 权限</span>
              <br />
              后台管理系统
            </h1>
            
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
              基于角色的访问控制（RBAC）模型，为您的企业提供安全、灵活、可扩展的权限管理解决方案。
              支持细粒度权限控制，完善的审计日志，助力企业数字化转型。
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/auth?mode=signup">
                <Button size="lg" className="h-12 px-8 text-base gap-2 group">
                  立即开始使用
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
              <Link to="/auth?mode=login">
                <Button variant="outline" size="lg" className="h-12 px-8 text-base">
                  已有账号？登录
                </Button>
              </Link>
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-20 max-w-3xl mx-auto"
          >
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl sm:text-4xl font-bold text-primary mb-1">
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 relative">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              功能特性
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              提供完整的权限管理功能，满足企业级应用的各种需求
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="group p-6 rounded-2xl bg-card border border-border/50 card-hover"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-primary/5" />
        <div className="absolute inset-0 bg-grid opacity-20" />
        
        <div className="container mx-auto px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl mx-auto text-center"
          >
            <h2 className="text-3xl sm:text-4xl font-bold mb-6">
              准备好开始了吗？
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              立即注册，体验企业级权限管理系统的强大功能
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
              <Link to="/auth?mode=signup">
                <Button size="lg" className="h-12 px-8 text-base gap-2 group">
                  免费注册
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-success" />
                免费试用
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-success" />
                无需信用卡
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-success" />
                快速部署
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border/50">
        <div className="container mx-auto px-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Zap className="h-4 w-4 text-primary" />
              </div>
              <span className="font-semibold">RBAC Admin</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} RBAC Admin. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
