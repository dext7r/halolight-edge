import { motion } from 'framer-motion';
import { Clock, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface Activity {
  user: string;
  action: string;
  time: string;
  type: 'success' | 'warning' | 'error' | 'info';
}

interface RecentActivitiesProps {
  activities: Activity[];
  loading?: boolean;
}

export function RecentActivities({ activities, loading }: RecentActivitiesProps) {
  const navigate = useNavigate();

  const getActivityDot = (type: Activity['type']) => {
    const colors = {
      success: 'bg-success',
      warning: 'bg-warning',
      error: 'bg-destructive',
      info: 'bg-info',
    };
    return (
      <motion.div 
        className={`w-2 h-2 rounded-full ${colors[type]}`}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 500 }}
      />
    );
  };

  return (
    <Card className="border-border/50 h-full flex flex-col">
      <CardHeader className="pb-3 flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2 text-base">
          <Clock className="h-5 w-5 text-primary" />
          最近活动
        </CardTitle>
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-xs gap-1 text-muted-foreground hover:text-foreground"
          onClick={() => navigate('/audit-logs')}
        >
          查看全部
          <ArrowRight className="h-3 w-3" />
        </Button>
      </CardHeader>
      <CardContent className="flex-1">
        {loading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-start gap-3 p-2 animate-pulse">
                <div className="w-2 h-2 rounded-full bg-muted mt-2" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-24" />
                  <div className="h-3 bg-muted rounded w-32" />
                </div>
              </div>
            ))}
          </div>
        ) : activities.length === 0 ? (
          <div className="empty-state">
            <Clock className="empty-state-icon" />
            <p className="text-muted-foreground">暂无活动记录</p>
          </div>
        ) : (
          <div className="space-y-1">
            {activities.map((activity, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer group"
              >
                <div className="mt-1.5">{getActivityDot(activity.type)}</div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate group-hover:text-primary transition-colors">
                    {activity.user}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {activity.action}
                  </p>
                </div>
                <span className="text-xs text-muted-foreground/70 whitespace-nowrap flex-shrink-0">
                  {activity.time}
                </span>
              </motion.div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
