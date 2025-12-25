import { useState, useEffect } from 'react'
import { Plus, Search, Trash2, Key, Copy, Eye, EyeOff, CheckCircle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { toast } from '@/hooks/use-toast'
import { useAuth } from '@/hooks/useAuth';
import api, { type ApiToken } from '@/api/client'

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
]

export default function ApiTokens() {
  const { session } = useAuth()
  const [tokens, setTokens] = useState<ApiToken[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [showTokenDialog, setShowTokenDialog] = useState(false)
  const [newToken, setNewToken] = useState('')
  const [revealedTokens, setRevealedTokens] = useState<Set<string>>(new Set())
  const [saving, setSaving] = useState(false)

  const [tokenForm, setTokenForm] = useState({
    name: '',
    description: '',
    permissions: [] as string[],
    expires_at: '',
  })

  const fetchTokens = async () => {
    if (!session?.access_token) return
    setLoading(true)
    try {
      const data = await api.apiTokens.list(session.access_token)
      setTokens(data)
    } catch (e) {
      toast({ title: '获取令牌列表失败', description: (e as Error).message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTokens()
  }, [session?.access_token])

  const filteredTokens = tokens.filter(
    (token) =>
      token.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (token.description || '').toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleAdd = () => {
    setTokenForm({ name: '', description: '', permissions: [], expires_at: '' })
    setIsDialogOpen(true)
  }

  const handleSave = async () => {
    if (!tokenForm.name || !session?.access_token) {
      toast({ title: '请填写令牌名称', variant: 'destructive' })
      return
    }

    setSaving(true)
    try {
      const result = await api.apiTokens.create(session.access_token, {
        name: tokenForm.name,
        description: tokenForm.description || undefined,
        permissions: tokenForm.permissions.length > 0 ? tokenForm.permissions : undefined,
        expires_at: tokenForm.expires_at || undefined,
      })
      setNewToken(result.token)
      setShowTokenDialog(true)
      setIsDialogOpen(false)
      fetchTokens()
    } catch (e) {
      toast({ title: '创建令牌失败', description: (e as Error).message, variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const handleRevoke = async (id: string) => {
    if (!confirm('确定要撤销此令牌吗？撤销后将无法恢复。') || !session?.access_token) return
    try {
      await api.apiTokens.revoke(session.access_token, id)
      toast({ title: '令牌已撤销' })
      fetchTokens()
    } catch (e) {
      toast({ title: '撤销失败', description: (e as Error).message, variant: 'destructive' })
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除此令牌吗？') || !session?.access_token) return
    try {
      await api.apiTokens.delete(session.access_token, id)
      toast({ title: '令牌删除成功' })
      fetchTokens()
    } catch (e) {
      toast({ title: '删除失败', description: (e as Error).message, variant: 'destructive' })
    }
  }

  const copyToken = (token: string) => {
    navigator.clipboard.writeText(token)
    toast({ title: '令牌已复制到剪贴板' })
  }

  const toggleRevealToken = (id: string) => {
    setRevealedTokens((prev) => {
      const newSet = new Set(prev)
      newSet.has(id) ? newSet.delete(id) : newSet.add(id)
      return newSet
    })
  }

  const maskToken = (token: string) =>
    token.length > 20 ? `${token.slice(0, 12)}${'*'.repeat(16)}${token.slice(-8)}` : token

  const getStatusBadge = (status: ApiToken['status']) => {
    const map = {
      active: <Badge variant="default">活跃</Badge>,
      revoked: <Badge variant="destructive">已撤销</Badge>,
      expired: <Badge variant="secondary">已过期</Badge>,
    }
    return map[status] || null
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Key className="h-8 w-8 text-primary" />
              API 令牌管理
            </h1>
            <p className="text-muted-foreground mt-2">管理 API 访问令牌，用于 Edge API 认证</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={fetchTokens} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              刷新
            </Button>
            <Button onClick={handleAdd} className="gap-2">
              <Plus className="h-4 w-4" />
              创建令牌
            </Button>
          </div>
        </div>

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

        <Card>
          <CardHeader>
            <CardTitle>令牌列表</CardTitle>
            <CardDescription>
              共 {tokens.length} 个令牌 · 使用 <code className="text-xs bg-muted px-1 rounded">X-API-Token</code> header 调用 Edge API
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">加载中...</div>
            ) : filteredTokens.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {tokens.length === 0 ? '暂无令牌，点击"创建令牌"开始' : '无匹配结果'}
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>名称</TableHead>
                      <TableHead>令牌</TableHead>
                      <TableHead>权限</TableHead>
                      <TableHead>过期时间</TableHead>
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
                            {token.description && (
                              <p className="text-sm text-muted-foreground">{token.description}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <code className="text-xs bg-muted px-2 py-1 rounded font-mono">
                              {revealedTokens.has(token.id) ? token.token : maskToken(token.token)}
                            </code>
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => toggleRevealToken(token.id)}>
                              {revealedTokens.has(token.id) ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                            </Button>
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyToken(token.token)}>
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {(token.permissions || []).slice(0, 2).map((perm) => (
                              <Badge key={perm} variant="outline" className="text-xs">{perm}</Badge>
                            ))}
                            {(token.permissions || []).length > 2 && (
                              <Badge variant="outline" className="text-xs">+{token.permissions.length - 2}</Badge>
                            )}
                            {(!token.permissions || token.permissions.length === 0) && (
                              <span className="text-xs text-muted-foreground">无限制</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">
                          {token.expires_at ? new Date(token.expires_at).toLocaleDateString() : '永不过期'}
                        </TableCell>
                        <TableCell>{getStatusBadge(token.status)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            {token.status === 'active' && (
                              <Button variant="ghost" size="sm" onClick={() => handleRevoke(token.id)}>
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
            )}
          </CardContent>
        </Card>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>创建令牌</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>令牌名称 *</Label>
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
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label>权限（留空表示无限制）</Label>
                <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto border rounded-lg p-3">
                  {availablePermissions.map((perm) => (
                    <label key={perm} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={tokenForm.permissions.includes(perm)}
                        onChange={(e) => {
                          setTokenForm({
                            ...tokenForm,
                            permissions: e.target.checked
                              ? [...tokenForm.permissions, perm]
                              : tokenForm.permissions.filter((p) => p !== perm),
                          })
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
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>取消</Button>
              <Button onClick={handleSave} disabled={saving}>{saving ? '创建中...' : '创建'}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={showTokenDialog} onOpenChange={setShowTokenDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
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
              <div className="text-sm text-muted-foreground">
                使用方式：在请求 Header 中添加 <code className="bg-muted px-1 rounded">X-API-Token: {newToken.slice(0, 20)}...</code>
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
  )
}
