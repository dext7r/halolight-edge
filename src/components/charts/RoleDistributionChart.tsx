import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Shield, Loader2 } from 'lucide-react';
import { fetchRoleStatistics, RoleStatistics } from '@/lib/audit';

const roleConfig: Record<string, { name: string; color: string }> = {
  admin: { name: '管理员', color: 'hsl(var(--primary))' },
  moderator: { name: '协管员', color: 'hsl(var(--warning))' },
  user: { name: '普通用户', color: 'hsl(var(--muted-foreground))' },
};

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const item = payload[0];
    const total = item.payload.total || 1;
    return (
      <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
        <div className="flex items-center gap-2 text-sm">
          <div 
            className="w-3 h-3 rounded-full" 
            style={{ backgroundColor: item.payload.color }}
          />
          <span className="font-medium">{item.name}</span>
        </div>
        <p className="text-lg font-bold mt-1">{item.value.toLocaleString()} 人</p>
        <p className="text-xs text-muted-foreground">
          占比 {((item.value / total) * 100).toFixed(1)}%
        </p>
      </div>
    );
  }
  return null;
};

export function RoleDistributionChart() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const stats = await fetchRoleStatistics();
      
      const formattedData = stats.map(item => ({
        name: roleConfig[item.role]?.name || item.role,
        value: item.user_count,
        color: roleConfig[item.role]?.color || 'hsl(var(--muted-foreground))',
      }));

      const totalCount = formattedData.reduce((sum, item) => sum + item.value, 0);
      setTotal(totalCount);

      // 添加 total 到每个数据点用于 tooltip
      const dataWithTotal = formattedData.map(item => ({
        ...item,
        total: totalCount,
      }));

      if (dataWithTotal.length === 0) {
        setData([
          { name: '暂无数据', value: 1, color: 'hsl(var(--muted))', total: 1 },
        ]);
      } else {
        setData(dataWithTotal);
      }
      setLoading(false);
    }

    loadData();
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
    >
      <Card className="border-border/50 h-full">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            角色分布
          </CardTitle>
          <CardDescription>
            系统用户角色占比（实时数据）
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          {loading ? (
            <div className="h-48 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={70}
                      paddingAngle={3}
                      dataKey="value"
                      strokeWidth={0}
                    >
                      {data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-col gap-2 mt-2">
                {data.filter(item => item.name !== '暂无数据').map((item, index) => (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-muted-foreground">{item.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{item.value.toLocaleString()}</span>
                      <span className="text-muted-foreground text-xs">
                        ({total > 0 ? ((item.value / total) * 100).toFixed(1) : 0}%)
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
