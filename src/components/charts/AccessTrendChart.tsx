import { motion } from 'framer-motion';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BarChart3 } from 'lucide-react';

const data = [
  { day: '周一', visits: 2400, pageViews: 4200 },
  { day: '周二', visits: 1398, pageViews: 3100 },
  { day: '周三', visits: 3800, pageViews: 5800 },
  { day: '周四', visits: 3908, pageViews: 6200 },
  { day: '周五', visits: 4800, pageViews: 7100 },
  { day: '周六', visits: 3200, pageViews: 4800 },
  { day: '周日', visits: 2100, pageViews: 3200 },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
        <p className="font-medium text-sm mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2 text-sm">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-muted-foreground">
              {entry.dataKey === 'visits' ? '访问量' : '浏览量'}:
            </span>
            <span className="font-medium">{entry.value.toLocaleString()}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export function AccessTrendChart() {
  const totalVisits = data.reduce((sum, item) => sum + item.visits, 0);
  const avgVisits = Math.round(totalVisits / data.length);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                本周访问趋势
              </CardTitle>
              <CardDescription className="mt-1">
                每日访问量和页面浏览统计
              </CardDescription>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold">{totalVisits.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">本周总访问</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data}
                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                barCategoryGap="20%"
              >
                <CartesianGrid 
                  strokeDasharray="3 3" 
                  stroke="hsl(var(--border))" 
                  vertical={false}
                />
                <XAxis 
                  dataKey="day" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                  dx={-10}
                  tickFormatter={(value) => value >= 1000 ? `${value / 1000}k` : value}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted) / 0.3)' }} />
                <Bar 
                  dataKey="visits" 
                  fill="hsl(var(--primary))" 
                  radius={[4, 4, 0, 0]}
                  name="visits"
                />
                <Bar 
                  dataKey="pageViews" 
                  fill="hsl(var(--info))" 
                  radius={[4, 4, 0, 0]}
                  name="pageViews"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center justify-center gap-6 mt-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-primary" />
              <span className="text-muted-foreground">独立访问</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-info" />
              <span className="text-muted-foreground">页面浏览</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
