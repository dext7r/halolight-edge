import { motion } from 'framer-motion';
import { LucideIcon, Loader2, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface StatCardProps {
  title: string;
  value: string;
  change: string;
  trend: 'up' | 'down' | 'neutral';
  icon: LucideIcon;
  color: string;
  bgColor: string;
  loading?: boolean;
  delay?: number;
}

export function StatCard({
  title,
  value,
  change,
  trend,
  icon: Icon,
  color,
  bgColor,
  loading = false,
  delay = 0,
}: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
    >
      <Card className="stat-card card-interactive border-border/50 overflow-hidden">
        <CardContent className="p-5">
          <div className="flex items-start justify-between">
            <motion.div 
              className={`p-2.5 rounded-xl ${bgColor}`}
              whileHover={{ scale: 1.1, rotate: 5 }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              <Icon className={`h-5 w-5 ${color}`} />
            </motion.div>
            <div className={`flex items-center gap-1 text-sm font-medium ${
              trend === 'up' ? 'text-success' : 
              trend === 'down' ? 'text-destructive' : 
              'text-muted-foreground'
            }`}>
              {trend === 'up' && <ArrowUpRight className="h-4 w-4" />}
              {trend === 'down' && <ArrowDownRight className="h-4 w-4" />}
              <span>{change}</span>
            </div>
          </div>
          <div className="mt-4">
            {loading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                <span className="text-sm text-muted-foreground">加载中...</span>
              </div>
            ) : (
              <motion.p 
                className="text-3xl font-bold tracking-tight"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: delay + 0.2 }}
              >
                {value}
              </motion.p>
            )}
            <p className="text-sm text-muted-foreground mt-1">{title}</p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
