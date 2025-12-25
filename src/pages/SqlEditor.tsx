import { useState, useEffect } from 'react';
import { Play, History, FileText, AlertCircle, CheckCircle, Clock, Trash2, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { motion } from 'framer-motion';

interface SqlHistory {
  id: string;
  sql: string;
  status: 'success' | 'error';
  result: any;
  error: string | null;
  executed_at: string;
  execution_time: number;
}

const SQL_TEMPLATES = [
  {
    name: '查看所有表',
    sql: `SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;`,
  },
  {
    name: '查看表结构',
    sql: `SELECT
  column_name,
  data_type,
  character_maximum_length,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'your_table_name'
ORDER BY ordinal_position;`,
  },
  {
    name: '应用新功能迁移',
    sql: `-- 执行前请先阅读 supabase/migrations/20250101000000_add_new_features.sql
-- 复制该文件的完整内容到编辑器中执行`,
  },
  {
    name: '查看用户角色',
    sql: `SELECT
  p.id,
  p.email,
  p.full_name,
  ur.role
FROM profiles p
LEFT JOIN user_roles ur ON p.id = ur.user_id
ORDER BY p.created_at DESC
LIMIT 20;`,
  },
  {
    name: '添加管理员角色',
    sql: `-- 替换 'user_email@example.com' 为实际邮箱
INSERT INTO user_roles (user_id, role)
SELECT id, 'admin'
FROM profiles
WHERE email = 'user_email@example.com'
AND NOT EXISTS (
  SELECT 1 FROM user_roles
  WHERE user_id = profiles.id
  AND role = 'admin'
);`,
  },
];

export default function SqlEditor() {
  const [sql, setSql] = useState('');
  const [executing, setExecuting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<SqlHistory[]>([]);
  const [executionTime, setExecutionTime] = useState<number>(0);

  // 从 localStorage 加载历史记录
  useEffect(() => {
    const savedHistory = localStorage.getItem('sql_history');
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error('Failed to parse SQL history:', e);
      }
    }
  }, []);

  const executeSql = async () => {
    if (!sql.trim()) {
      toast({ title: '请输入 SQL 语句', variant: 'destructive' });
      return;
    }

    setExecuting(true);
    setError(null);
    setResult(null);

    const startTime = Date.now();

    try {
      // 使用 Supabase RPC 执行 SQL
      const { data, error: execError } = await supabase.rpc('execute_sql', {
        query: sql,
      });

      const endTime = Date.now();
      const execTime = endTime - startTime;
      setExecutionTime(execTime);

      if (execError) {
        setError(execError.message);
        toast({ title: '执行失败', description: execError.message, variant: 'destructive' });

        // 保存到历史
        saveToHistory({
          id: Date.now().toString(),
          sql,
          status: 'error',
          result: null,
          error: execError.message,
          executed_at: new Date().toISOString(),
          execution_time: execTime,
        });
      } else {
        setResult(data);
        toast({ title: '执行成功', description: `耗时 ${execTime}ms` });

        // 保存到历史
        saveToHistory({
          id: Date.now().toString(),
          sql,
          status: 'success',
          result: data,
          error: null,
          executed_at: new Date().toISOString(),
          execution_time: execTime,
        });
      }
    } catch (err: any) {
      const endTime = Date.now();
      const execTime = endTime - startTime;
      const errorMsg = err?.message || '执行出错';

      setError(errorMsg);
      toast({ title: '执行失败', description: errorMsg, variant: 'destructive' });

      saveToHistory({
        id: Date.now().toString(),
        sql,
        status: 'error',
        result: null,
        error: errorMsg,
        executed_at: new Date().toISOString(),
        execution_time: execTime,
      });
    } finally {
      setExecuting(false);
    }
  };

  const saveToHistory = (entry: SqlHistory) => {
    const newHistory = [entry, ...history].slice(0, 50); // 保留最近 50 条
    setHistory(newHistory);
    localStorage.setItem('sql_history', JSON.stringify(newHistory));
  };

  const loadFromHistory = (entry: SqlHistory) => {
    setSql(entry.sql);
    setResult(entry.result);
    setError(entry.error);
    setExecutionTime(entry.execution_time);
  };

  const clearHistory = () => {
    if (confirm('确定要清空执行历史吗？')) {
      setHistory([]);
      localStorage.removeItem('sql_history');
      toast({ title: '历史记录已清空' });
    }
  };

  const loadTemplate = (template: string) => {
    setSql(template);
    setResult(null);
    setError(null);
  };

  const copySql = () => {
    navigator.clipboard.writeText(sql);
    toast({ title: 'SQL 已复制' });
  };

  const formatTime = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const renderResult = () => {
    if (!result) return null;

    // 如果是数组，显示为表格
    if (Array.isArray(result) && result.length > 0) {
      const columns = Object.keys(result[0]);
      return (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((col) => (
                  <TableHead key={col}>{col}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {result.map((row, idx) => (
                <TableRow key={idx}>
                  {columns.map((col) => (
                    <TableCell key={col}>
                      {typeof row[col] === 'object'
                        ? JSON.stringify(row[col])
                        : String(row[col] ?? '-')}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      );
    }

    // 其他结果显示为 JSON
    return (
      <pre className="p-4 bg-muted rounded-lg text-sm font-mono overflow-auto max-h-96">
        {JSON.stringify(result, null, 2)}
      </pre>
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <FileText className="h-8 w-8 text-primary" />
              SQL 编辑器
            </h1>
            <p className="text-muted-foreground mt-2">直接执行 SQL 语句管理数据库</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Editor */}
          <div className="lg:col-span-2 space-y-6">
            {/* SQL Editor */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>SQL 编辑器</CardTitle>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={copySql} className="gap-2">
                      <Copy className="h-3 w-3" />
                      复制
                    </Button>
                    <Button
                      onClick={executeSql}
                      disabled={executing || !sql.trim()}
                      className="gap-2"
                    >
                      <Play className="h-4 w-4" />
                      {executing ? '执行中...' : '执行'}
                    </Button>
                  </div>
                </div>
                <CardDescription>输入并执行 SQL 语句</CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="输入 SQL 语句...&#10;&#10;示例:&#10;SELECT * FROM profiles LIMIT 10;"
                  value={sql}
                  onChange={(e) => setSql(e.target.value)}
                  className="font-mono text-sm min-h-[300px]"
                  spellCheck={false}
                />
              </CardContent>
            </Card>

            {/* Result */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    {error ? (
                      <>
                        <AlertCircle className="h-5 w-5 text-destructive" />
                        执行失败
                      </>
                    ) : result ? (
                      <>
                        <CheckCircle className="h-5 w-5 text-success" />
                        执行成功
                      </>
                    ) : (
                      <>
                        <FileText className="h-5 w-5" />
                        执行结果
                      </>
                    )}
                  </CardTitle>
                  {executionTime > 0 && (
                    <Badge variant="outline">
                      <Clock className="h-3 w-3 mr-1" />
                      {formatTime(executionTime)}
                    </Badge>
                  )}
                </div>
                {Array.isArray(result) && (
                  <CardDescription>返回 {result.length} 行数据</CardDescription>
                )}
              </CardHeader>
              <CardContent>
                {error ? (
                  <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                    <p className="text-sm text-destructive font-mono">{error}</p>
                  </div>
                ) : result ? (
                  renderResult()
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>执行 SQL 后查看结果</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right: Templates & History */}
          <div className="space-y-6">
            <Tabs defaultValue="templates">
              <TabsList className="w-full grid grid-cols-2">
                <TabsTrigger value="templates">模板</TabsTrigger>
                <TabsTrigger value="history">历史</TabsTrigger>
              </TabsList>

              <TabsContent value="templates" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">SQL 模板</CardTitle>
                    <CardDescription>常用 SQL 语句模板</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[600px]">
                      <div className="space-y-2">
                        {SQL_TEMPLATES.map((template, idx) => (
                          <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            className="p-3 border rounded-lg hover:bg-muted cursor-pointer transition-colors"
                            onClick={() => loadTemplate(template.sql)}
                          >
                            <p className="font-medium text-sm mb-2">{template.name}</p>
                            <pre className="text-xs text-muted-foreground font-mono overflow-x-auto">
                              {template.sql.split('\n').slice(0, 3).join('\n')}
                              {template.sql.split('\n').length > 3 && '\n...'}
                            </pre>
                          </motion.div>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="history" className="mt-4">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-base">执行历史</CardTitle>
                        <CardDescription>最近 {history.length} 条记录</CardDescription>
                      </div>
                      {history.length > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={clearHistory}
                          className="h-7 text-xs"
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          清空
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[600px]">
                      {history.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                          <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p className="text-sm">暂无执行历史</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {history.map((entry) => (
                            <motion.div
                              key={entry.id}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className="p-3 border rounded-lg hover:bg-muted cursor-pointer transition-colors group"
                              onClick={() => loadFromHistory(entry)}
                            >
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  {entry.status === 'success' ? (
                                    <CheckCircle className="h-4 w-4 text-success" />
                                  ) : (
                                    <AlertCircle className="h-4 w-4 text-destructive" />
                                  )}
                                  <Badge variant={entry.status === 'success' ? 'default' : 'destructive'}>
                                    {entry.status === 'success' ? '成功' : '失败'}
                                  </Badge>
                                  <span className="text-xs text-muted-foreground">
                                    {formatTime(entry.execution_time)}
                                  </span>
                                </div>
                                <span className="text-xs text-muted-foreground">
                                  {new Date(entry.executed_at).toLocaleString('zh-CN')}
                                </span>
                              </div>
                              <pre className="text-xs text-muted-foreground font-mono overflow-x-auto">
                                {entry.sql.split('\n').slice(0, 2).join('\n')}
                                {entry.sql.split('\n').length > 2 && '\n...'}
                              </pre>
                              {entry.error && (
                                <p className="text-xs text-destructive mt-2 truncate">
                                  {entry.error}
                                </p>
                              )}
                            </motion.div>
                          ))}
                        </div>
                      )}
                    </ScrollArea>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Warning Notice */}
        <Card className="border-warning/50 bg-warning/5">
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <AlertCircle className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
              <div className="space-y-2">
                <p className="font-medium text-warning">安全提示</p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• 仅管理员可以执行 SQL 语句</li>
                  <li>• 请谨慎执行 DELETE、DROP 等危险操作</li>
                  <li>• 建议先在测试环境验证 SQL</li>
                  <li>• 所有执行记录都会被保存</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
