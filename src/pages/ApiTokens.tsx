import { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, Key, Copy, Eye, EyeOff, CheckCircle } from 'lucide-react';
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
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { toast } from '@/hooks/use-toast';

interface ApiToken {
  id: string;
  name: string;
  description: string;
  token: string;
  permissions: string[];
  expires_at: string | null;
  last_used: string | null;
  created_at: string;
  status: 'active' | 'revoked' | 'expired';
}

export default function ApiTokens() {
  const [tokens, setTokens] = useState<ApiToken[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingToken, setEditingToken] = useState<ApiToken | null>(null);
  const [showTokenDialog, setShowTokenDialog] = useState(false);
  const [newToken, setNewToken] = useState('');
  const [revealedTokens, setRevealedTokens] = useState<Set<string>>(new Set());

  const [tokenForm, setTokenForm] = useState({
    name: '',
    description: '',
    permissions: [] as string[],
    expires_at: '',
  });

  const availablePermissions = [
    'users:read',
    'users:write',
    'users:delete',
    'roles:read',
    'roles:write',
    'audit:read',
    'settings:read',
    'settings:write',
    'api:all',
  ];

  useEffect(() => {
    const mockTokens: ApiToken[] = [
      {
        id: '1',
        name: '生产环境 API',
        description: '用于生产环境的 API 调用',
        token: 'token_1234567890abcdefghijklmnopqrstuvwxyz',
        permissions: ['users:read', 'users:write', 'roles:read'],
        expires_at: '2024-12-31',
        last_used: '2024-01-15 10:30:00',
        created_at: '2024-01-01',
        status: 'active',
      },
      {
        id: '2',
        name: '测试环境',
        description: '测试环境使用的令牌',
        token: 'token_abcdefghijklmnopqrstuvwxyz1234567890',
        permissions: ['api:all'],
        expires_at: null,
        last_used: '2024-01-14 15:20:00',
        created_at: '2024-01-01',
        status: 'active',
      },
      {
        id: '3',
        name: '旧版 API',
        description: '已废弃的旧版 API 令牌',
        token: 'token_zyxwvutsrqponmlkjihgfedcba0987654321',
        permissions: ['users:read'],
        expires_at: '2023-12-31',
        last_used: '2023-12-30 08:00:00',
        created_at: '2023-01-01',
        status: 'expired',
      },
    ];
    setTokens(mockTokens);
  }, []);

  const filteredTokens = tokens.filter(
    (token) =>
      token.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      token.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAdd = () => {
    setEditingToken(null);
    setTokenForm({
      name: '',
      description: '',
      permissions: [],
      expires_at: '',
    });
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    if (!tokenForm.name) {
      toast({ title: '请填写令牌名称', variant: 'destructive' });
      return;
    }

    if (editingToken) {
      setTokens(
        tokens.map((t) =>
          t.id === editingToken.id
            ? {
                ...t,
                ...tokenForm,
                expires_at: tokenForm.expires_at || null,
              }
            : t
        )
      );
      toast({ title: '令牌更新成功' });
      setIsDialogOpen(false);
    } else {
      const generatedToken = `token_${Math.random().toString(36).substr(2, 40)}`;
      const newTokenObj: ApiToken = {
        id: Date.now().toString(),
        ...tokenForm,
        token: generatedToken,
        expires_at: tokenForm.expires_at || null,
        last_used: null,
        created_at: new Date().toISOString(),
        status: 'active',
      };
      setTokens([...tokens, newTokenObj]);
      setNewToken(generatedToken);
      setShowTokenDialog(true);
      setIsDialogOpen(false);
    }
  };

  const handleRevoke = (id: string) => {
    if (confirm('确定要撤销此令牌吗？撤销后将无法恢复。')) {
      setTokens(tokens.map((t) => (t.id === id ? { ...t, status: 'revoked' as const } : t)));
      toast({ title: '令牌已撤销' });
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('确定要删除此令牌吗？')) {
      setTokens(tokens.filter((t) => t.id !== id));
      toast({ title: '令牌删除成功' });
    }
  };

  const copyToken = (token: string) => {
    navigator.clipboard.writeText(token);
    toast({ title: '令牌已复制到剪贴板' });
  };

  const toggleRevealToken = (id: string) => {
    setRevealedTokens((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const maskToken = (token: string) => {
    return `${token.substring(0, 12)}${'*'.repeat(20)}${token.substring(token.length - 8)}`;
  };

  const getStatusBadge = (status: ApiToken['status']) => {
    switch (status) {
      case 'active':
        return <Badge variant="default">活跃</Badge>;
      case 'revoked':
        return <Badge variant="destructive">已撤销</Badge>;
      case 'expired':
        return <Badge variant="secondary">已过期</Badge>;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Key className="h-8 w-8 text-primary" />
              API 令牌管理
            </h1>
            <p className="text-muted-foreground mt-2">管理 API 访问令牌和权限</p>
          </div>
          <Button onClick={handleAdd} className="gap-2">
            <Plus className="h-4 w-4" />
            创建令牌
          </Button>
        </div>

        {/* Search */}
        <Card>
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="搜索令牌..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Tokens Table */}
        <Card>
          <CardHeader>
            <CardTitle>令牌列表</CardTitle>
            <CardDescription>共 {tokens.length} 个令牌</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>名称</TableHead>
                    <TableHead>令牌</TableHead>
                    <TableHead>权限</TableHead>
                    <TableHead>过期时间</TableHead>
                    <TableHead>上次使用</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTokens.map((token) => (
                    <TableRow key={token.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{token.name}</p>
                          <p className="text-sm text-muted-foreground">{token.description}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <code className="text-xs bg-muted px-2 py-1 rounded font-mono">
                            {revealedTokens.has(token.id) ? token.token : maskToken(token.token)}
                          </code>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => toggleRevealToken(token.id)}
                          >
                            {revealedTokens.has(token.id) ? (
                              <EyeOff className="h-3 w-3" />
                            ) : (
                              <Eye className="h-3 w-3" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => copyToken(token.token)}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {token.permissions.slice(0, 2).map((perm) => (
                            <Badge key={perm} variant="outline" className="text-xs">
                              {perm}
                            </Badge>
                          ))}
                          {token.permissions.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{token.permissions.length - 2}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{token.expires_at || '永不过期'}</TableCell>
                      <TableCell className="text-sm">{token.last_used || '从未使用'}</TableCell>
                      <TableCell>{getStatusBadge(token.status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {token.status === 'active' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRevoke(token.id)}
                            >
                              撤销
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 hover:text-destructive"
                            onClick={() => handleDelete(token.id)}
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

        {/* Create/Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingToken ? '编辑令牌' : '创建令牌'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>令牌名称</Label>
                <Input
                  placeholder="例如: 生产环境 API"
                  value={tokenForm.name}
                  onChange={(e) => setTokenForm({ ...tokenForm, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>描述</Label>
                <Textarea
                  placeholder="令牌的用途说明"
                  value={tokenForm.description}
                  onChange={(e) => setTokenForm({ ...tokenForm, description: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label>权限</Label>
                <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto border rounded-lg p-3">
                  {availablePermissions.map((perm) => (
                    <label key={perm} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={tokenForm.permissions.includes(perm)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setTokenForm({
                              ...tokenForm,
                              permissions: [...tokenForm.permissions, perm],
                            });
                          } else {
                            setTokenForm({
                              ...tokenForm,
                              permissions: tokenForm.permissions.filter((p) => p !== perm),
                            });
                          }
                        }}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm">{perm}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label>过期时间（可选）</Label>
                <Input
                  type="date"
                  value={tokenForm.expires_at}
                  onChange={(e) => setTokenForm({ ...tokenForm, expires_at: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                取消
              </Button>
              <Button onClick={handleSave}>{editingToken ? '更新' : '创建'}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* New Token Dialog */}
        <Dialog open={showTokenDialog} onOpenChange={setShowTokenDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-success" />
                令牌创建成功
              </DialogTitle>
              <DialogDescription>
                请立即复制并保存此令牌。出于安全考虑，令牌只会显示一次。
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="p-4 bg-muted rounded-lg">
                <code className="text-sm font-mono break-all">{newToken}</code>
              </div>
              <Button onClick={() => copyToken(newToken)} className="w-full gap-2">
                <Copy className="h-4 w-4" />
                复制令牌
              </Button>
            </div>
            <DialogFooter>
              <Button onClick={() => setShowTokenDialog(false)}>我已保存</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
