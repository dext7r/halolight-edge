import { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Clock,
  Play,
  Pause,
  FileText,
  Upload,
  Copy,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
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
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { toast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';
import { parseRequest, formatHeaders, parseHeaders, type ParsedRequest } from '@/lib/request-parser';

interface ScheduledTask {
  id: string;
  name: string;
  description: string;
  url: string;
  method: string;
  headers: string;
  body: string | null;
  cron_expression: string;
  enabled: boolean;
  last_run: string | null;
  next_run: string | null;
  status: 'success' | 'error' | 'pending';
  created_at: string;
}

export default function ScheduledTasks() {
  const [tasks, setTasks] = useState<ScheduledTask[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<ScheduledTask | null>(null);
  const [importText, setImportText] = useState('');

  const [taskForm, setTaskForm] = useState({
    name: '',
    description: '',
    url: '',
    method: 'GET',
    headers: '',
    body: '',
    cron_expression: '0 0 * * *',
    enabled: true,
  });

  // Mock data
  useEffect(() => {
    const mockTasks: ScheduledTask[] = [
      {
        id: '1',
        name: '每日数据同步',
        description: '同步用户数据到数据仓库',
        url: 'https://api.example.com/sync/users',
        method: 'POST',
        headers: 'Authorization: Bearer token123\nContent-Type: application/json',
        body: '{"type":"daily"}',
        cron_expression: '0 2 * * *',
        enabled: true,
        last_run: '2024-01-15 02:00:00',
        next_run: '2024-01-16 02:00:00',
        status: 'success',
        created_at: '2024-01-01',
      },
      {
        id: '2',
        name: '清理临时文件',
        description: '每小时清理过期的临时文件',
        url: 'https://api.example.com/cleanup/temp',
        method: 'DELETE',
        headers: 'Authorization: Bearer token123',
        body: null,
        cron_expression: '0 * * * *',
        enabled: true,
        last_run: '2024-01-15 10:00:00',
        next_run: '2024-01-15 11:00:00',
        status: 'success',
        created_at: '2024-01-01',
      },
      {
        id: '3',
        name: '健康检查',
        description: '检查服务健康状态',
        url: 'https://api.example.com/health',
        method: 'GET',
        headers: '',
        body: null,
        cron_expression: '*/5 * * * *',
        enabled: false,
        last_run: '2024-01-15 09:55:00',
        next_run: null,
        status: 'error',
        created_at: '2024-01-01',
      },
    ];
    setTasks(mockTasks);
  }, []);

  const filteredTasks = tasks.filter(
    (task) =>
      task.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAdd = () => {
    setEditingTask(null);
    setTaskForm({
      name: '',
      description: '',
      url: '',
      method: 'GET',
      headers: '',
      body: '',
      cron_expression: '0 0 * * *',
      enabled: true,
    });
    setIsDialogOpen(true);
  };

  const handleEdit = (task: ScheduledTask) => {
    setEditingTask(task);
    setTaskForm({
      name: task.name,
      description: task.description,
      url: task.url,
      method: task.method,
      headers: task.headers,
      body: task.body || '',
      cron_expression: task.cron_expression,
      enabled: task.enabled,
    });
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    if (!taskForm.name || !taskForm.url) {
      toast({ title: '请填写任务名称和 URL', variant: 'destructive' });
      return;
    }

    if (editingTask) {
      setTasks(
        tasks.map((t) =>
          t.id === editingTask.id
            ? {
                ...t,
                ...taskForm,
              }
            : t
        )
      );
      toast({ title: '任务更新成功' });
    } else {
      const newTask: ScheduledTask = {
        id: Date.now().toString(),
        ...taskForm,
        body: taskForm.body || null,
        last_run: null,
        next_run: '2024-01-16 00:00:00',
        status: 'pending',
        created_at: new Date().toISOString(),
      };
      setTasks([...tasks, newTask]);
      toast({ title: '任务创建成功' });
    }

    setIsDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('确定要删除此任务吗？')) {
      setTasks(tasks.filter((t) => t.id !== id));
      toast({ title: '任务删除成功' });
    }
  };

  const handleToggleEnabled = (id: string) => {
    setTasks(
      tasks.map((t) =>
        t.id === id
          ? {
              ...t,
              enabled: !t.enabled,
              next_run: !t.enabled ? '2024-01-16 00:00:00' : null,
            }
          : t
      )
    );
    toast({ title: tasks.find((t) => t.id === id)?.enabled ? '任务已暂停' : '任务已启用' });
  };

  const handleImport = () => {
    setImportText('');
    setIsImportDialogOpen(true);
  };

  const handleParseImport = () => {
    const parsed = parseRequest(importText);
    if (!parsed) {
      toast({ title: '解析失败', description: '请输入有效的 curl 或 fetch 代码', variant: 'destructive' });
      return;
    }

    setTaskForm({
      ...taskForm,
      url: parsed.url,
      method: parsed.method,
      headers: formatHeaders(parsed.headers),
      body: parsed.body || '',
    });

    setIsImportDialogOpen(false);
    setIsDialogOpen(true);
    toast({ title: '导入成功', description: '请完善任务信息' });
  };

  const handleRunNow = (id: string) => {
    const task = tasks.find((t) => t.id === id);
    if (task) {
      toast({ title: '任务执行中...', description: `正在执行: ${task.name}` });
      // 实际项目中这里应该调用 API
    }
  };

  const getStatusColor = (status: ScheduledTask['status']) => {
    switch (status) {
      case 'success':
        return 'text-success';
      case 'error':
        return 'text-destructive';
      default:
        return 'text-warning';
    }
  };

  const getStatusIcon = (status: ScheduledTask['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4" />;
      case 'error':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const cronPresets = [
    { label: '每分钟', value: '* * * * *' },
    { label: '每5分钟', value: '*/5 * * * *' },
    { label: '每小时', value: '0 * * * *' },
    { label: '每天凌晨2点', value: '0 2 * * *' },
    { label: '每周一凌晨', value: '0 0 * * 1' },
    { label: '每月1号', value: '0 0 1 * *' },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Clock className="h-8 w-8 text-primary" />
              定时任务
            </h1>
            <p className="text-muted-foreground mt-2">管理自动化定时任务和 API 调用</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleImport} className="gap-2">
              <Upload className="h-4 w-4" />
              导入请求
            </Button>
            <Button onClick={handleAdd} className="gap-2">
              <Plus className="h-4 w-4" />
              新建任务
            </Button>
          </div>
        </div>

        {/* Search */}
        <Card>
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="搜索任务名称或描述..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Tasks Table */}
        <Card>
          <CardHeader>
            <CardTitle>任务列表</CardTitle>
            <CardDescription>共 {tasks.length} 个任务</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>状态</TableHead>
                    <TableHead>任务名称</TableHead>
                    <TableHead>请求</TableHead>
                    <TableHead>Cron 表达式</TableHead>
                    <TableHead>上次运行</TableHead>
                    <TableHead>下次运行</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTasks.map((task) => (
                    <TableRow key={task.id}>
                      <TableCell>
                        <div className={`flex items-center gap-2 ${getStatusColor(task.status)}`}>
                          {getStatusIcon(task.status)}
                          {task.enabled ? (
                            <Badge variant="default">运行中</Badge>
                          ) : (
                            <Badge variant="secondary">已暂停</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{task.name}</p>
                          <p className="text-sm text-muted-foreground">{task.description}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <Badge variant="outline">{task.method}</Badge>
                          <p className="text-sm text-muted-foreground truncate max-w-[200px]">
                            {task.url}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <code className="text-xs bg-muted px-2 py-1 rounded">{task.cron_expression}</code>
                      </TableCell>
                      <TableCell className="text-sm">{task.last_run || '-'}</TableCell>
                      <TableCell className="text-sm">{task.next_run || '-'}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => handleRunNow(task.id)}
                          >
                            <Play className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => handleToggleEnabled(task.id)}
                          >
                            {task.enabled ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => handleEdit(task)}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 hover:text-destructive"
                            onClick={() => handleDelete(task.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Import Dialog */}
        <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>导入请求</DialogTitle>
              <DialogDescription>粘贴 curl 命令或 fetch 代码，自动解析为任务配置</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <Textarea
                placeholder={`示例 curl:\ncurl 'https://api.example.com/users' -H 'Authorization: Bearer token' -X POST --data-raw '{"name":"test"}'\n\n示例 fetch:\nfetch('https://api.example.com/users', { method: 'POST', headers: { 'Authorization': 'Bearer token' }, body: JSON.stringify({ name: 'test' }) })`}
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                rows={10}
                className="font-mono text-sm"
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsImportDialogOpen(false)}>
                取消
              </Button>
              <Button onClick={handleParseImport}>解析并导入</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Task Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingTask ? '编辑任务' : '新建任务'}</DialogTitle>
            </DialogHeader>
            <Tabs defaultValue="basic" className="py-4">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="basic">基本信息</TabsTrigger>
                <TabsTrigger value="request">请求配置</TabsTrigger>
                <TabsTrigger value="schedule">调度配置</TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-4">
                <div className="space-y-2">
                  <Label>任务名称</Label>
                  <Input
                    placeholder="例如: 每日数据同步"
                    value={taskForm.name}
                    onChange={(e) => setTaskForm({ ...taskForm, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>任务描述</Label>
                  <Textarea
                    placeholder="描述任务的用途"
                    value={taskForm.description}
                    onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={taskForm.enabled}
                      onChange={(e) => setTaskForm({ ...taskForm, enabled: e.target.checked })}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm">启用任务</span>
                  </label>
                </div>
              </TabsContent>

              <TabsContent value="request" className="space-y-4">
                <div className="grid grid-cols-4 gap-4">
                  <div className="col-span-1 space-y-2">
                    <Label>方法</Label>
                    <Select value={taskForm.method} onValueChange={(v) => setTaskForm({ ...taskForm, method: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="GET">GET</SelectItem>
                        <SelectItem value="POST">POST</SelectItem>
                        <SelectItem value="PUT">PUT</SelectItem>
                        <SelectItem value="PATCH">PATCH</SelectItem>
                        <SelectItem value="DELETE">DELETE</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-3 space-y-2">
                    <Label>URL</Label>
                    <Input
                      placeholder="https://api.example.com/endpoint"
                      value={taskForm.url}
                      onChange={(e) => setTaskForm({ ...taskForm, url: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Headers (每行一个，格式: Key: Value)</Label>
                  <Textarea
                    placeholder="Authorization: Bearer token&#10;Content-Type: application/json"
                    value={taskForm.headers}
                    onChange={(e) => setTaskForm({ ...taskForm, headers: e.target.value })}
                    rows={4}
                    className="font-mono text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Body (JSON)</Label>
                  <Textarea
                    placeholder='{"key": "value"}'
                    value={taskForm.body}
                    onChange={(e) => setTaskForm({ ...taskForm, body: e.target.value })}
                    rows={6}
                    className="font-mono text-sm"
                  />
                </div>
              </TabsContent>

              <TabsContent value="schedule" className="space-y-4">
                <div className="space-y-2">
                  <Label>Cron 表达式</Label>
                  <Input
                    placeholder="0 0 * * *"
                    value={taskForm.cron_expression}
                    onChange={(e) => setTaskForm({ ...taskForm, cron_expression: e.target.value })}
                    className="font-mono"
                  />
                  <p className="text-xs text-muted-foreground">
                    格式: 分 时 日 月 周 (例如: 0 2 * * * 表示每天凌晨2点)
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>快速选择</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {cronPresets.map((preset) => (
                      <Button
                        key={preset.value}
                        variant="outline"
                        size="sm"
                        onClick={() => setTaskForm({ ...taskForm, cron_expression: preset.value })}
                      >
                        {preset.label}
                      </Button>
                    ))}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                取消
              </Button>
              <Button onClick={handleSave}>{editingTask ? '更新' : '创建'}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
