import { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Upload,
  FileJson,
  Send,
  Code,
  Book,
  ChevronDown,
  ChevronRight,
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
} from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { toast } from '@/hooks/use-toast';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface ApiEndpoint {
  id: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  summary: string;
  description: string;
  tags: string[];
  parameters?: any[];
  requestBody?: any;
  responses?: any;
}

interface SwaggerDoc {
  openapi: string;
  info: {
    title: string;
    version: string;
    description?: string;
  };
  servers?: { url: string }[];
  paths: Record<string, any>;
}

export default function SwaggerDocs() {
  const [endpoints, setEndpoints] = useState<ApiEndpoint[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [isTestDialogOpen, setIsTestDialogOpen] = useState(false);
  const [selectedEndpoint, setSelectedEndpoint] = useState<ApiEndpoint | null>(null);
  const [importJson, setImportJson] = useState('');
  const [expandedEndpoints, setExpandedEndpoints] = useState<Set<string>>(new Set());

  const [testForm, setTestForm] = useState({
    url: '',
    headers: '',
    body: '',
    token: '',
  });

  const [testResponse, setTestResponse] = useState<{
    status: number;
    body: string;
    headers: string;
  } | null>(null);

  // Mock data
  useEffect(() => {
    const mockEndpoints: ApiEndpoint[] = [
      {
        id: '1',
        method: 'GET',
        path: '/api/users',
        summary: '获取用户列表',
        description: '获取所有用户的列表，支持分页和筛选',
        tags: ['用户管理'],
        parameters: [
          { name: 'page', in: 'query', type: 'integer', description: '页码' },
          { name: 'limit', in: 'query', type: 'integer', description: '每页数量' },
        ],
        responses: {
          200: { description: '成功', schema: { type: 'array', items: { $ref: '#/definitions/User' } } },
        },
      },
      {
        id: '2',
        method: 'POST',
        path: '/api/users',
        summary: '创建用户',
        description: '创建一个新用户',
        tags: ['用户管理'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                properties: {
                  email: { type: 'string' },
                  full_name: { type: 'string' },
                  role: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: '创建成功' },
          400: { description: '请求参数错误' },
        },
      },
      {
        id: '3',
        method: 'GET',
        path: '/api/roles',
        summary: '获取角色列表',
        description: '获取所有角色及其权限',
        tags: ['角色管理'],
        responses: {
          200: { description: '成功' },
        },
      },
      {
        id: '4',
        method: 'DELETE',
        path: '/api/users/{id}',
        summary: '删除用户',
        description: '删除指定 ID 的用户',
        tags: ['用户管理'],
        parameters: [{ name: 'id', in: 'path', required: true, type: 'string', description: '用户 ID' }],
        responses: {
          200: { description: '删除成功' },
          404: { description: '用户不存在' },
        },
      },
    ];
    setEndpoints(mockEndpoints);
  }, []);

  const allTags = ['all', ...Array.from(new Set(endpoints.flatMap((e) => e.tags)))];

  const filteredEndpoints = endpoints.filter((endpoint) => {
    const matchesSearch =
      endpoint.path.toLowerCase().includes(searchTerm.toLowerCase()) ||
      endpoint.summary.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTag = selectedTag === 'all' || endpoint.tags.includes(selectedTag);
    return matchesSearch && matchesTag;
  });

  const handleImport = () => {
    setImportJson('');
    setIsImportDialogOpen(true);
  };

  const handleParseSwagger = () => {
    try {
      const doc: SwaggerDoc = JSON.parse(importJson);
      const newEndpoints: ApiEndpoint[] = [];

      Object.entries(doc.paths || {}).forEach(([path, methods]: [string, any]) => {
        Object.entries(methods).forEach(([method, details]: [string, any]) => {
          if (['get', 'post', 'put', 'patch', 'delete'].includes(method.toLowerCase())) {
            newEndpoints.push({
              id: `${method}-${path}-${Date.now()}`,
              method: method.toUpperCase() as any,
              path,
              summary: details.summary || '',
              description: details.description || '',
              tags: details.tags || [],
              parameters: details.parameters,
              requestBody: details.requestBody,
              responses: details.responses,
            });
          }
        });
      });

      setEndpoints([...endpoints, ...newEndpoints]);
      setIsImportDialogOpen(false);
      toast({ title: '导入成功', description: `已导入 ${newEndpoints.length} 个接口` });
    } catch (error) {
      toast({ title: '解析失败', description: '请输入有效的 Swagger JSON', variant: 'destructive' });
    }
  };

  const handleTest = (endpoint: ApiEndpoint) => {
    setSelectedEndpoint(endpoint);
    setTestForm({
      url: `https://api.example.com${endpoint.path}`,
      headers: 'Content-Type: application/json',
      body: endpoint.method !== 'GET' ? '{\n  \n}' : '',
      token: '',
    });
    setTestResponse(null);
    setIsTestDialogOpen(true);
  };

  const handleSendRequest = async () => {
    toast({ title: '发送请求中...' });

    // Mock response
    setTimeout(() => {
      setTestResponse({
        status: 200,
        headers: 'content-type: application/json\ndate: ' + new Date().toISOString(),
        body: JSON.stringify(
          {
            success: true,
            data: {
              id: '123',
              message: 'This is a mock response',
            },
          },
          null,
          2
        ),
      });
      toast({ title: '请求成功' });
    }, 1000);
  };

  const toggleEndpoint = (id: string) => {
    setExpandedEndpoints((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'GET':
        return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
      case 'POST':
        return 'bg-green-500/10 text-green-600 border-green-500/20';
      case 'PUT':
        return 'bg-orange-500/10 text-orange-600 border-orange-500/20';
      case 'PATCH':
        return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20';
      case 'DELETE':
        return 'bg-red-500/10 text-red-600 border-red-500/20';
      default:
        return 'bg-gray-500/10 text-gray-600 border-gray-500/20';
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Book className="h-8 w-8 text-primary" />
              API 文档
            </h1>
            <p className="text-muted-foreground mt-2">Swagger / OpenAPI 接口文档</p>
          </div>
          <Button onClick={handleImport} className="gap-2">
            <Upload className="h-4 w-4" />
            导入 Swagger JSON
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="搜索接口..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={selectedTag} onValueChange={setSelectedTag}>
                <SelectTrigger>
                  <SelectValue placeholder="选择标签" />
                </SelectTrigger>
                <SelectContent>
                  {allTags.map((tag) => (
                    <SelectItem key={tag} value={tag}>
                      {tag === 'all' ? '全部标签' : tag}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Endpoints */}
        <Card>
          <CardHeader>
            <CardTitle>接口列表</CardTitle>
            <CardDescription>共 {filteredEndpoints.length} 个接口</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {filteredEndpoints.map((endpoint) => (
                <Collapsible
                  key={endpoint.id}
                  open={expandedEndpoints.has(endpoint.id)}
                  onOpenChange={() => toggleEndpoint(endpoint.id)}
                >
                  <div className="border rounded-lg">
                    <CollapsibleTrigger asChild>
                      <div className="p-4 hover:bg-muted cursor-pointer flex items-center justify-between">
                        <div className="flex items-center gap-4 flex-1">
                          {expandedEndpoints.has(endpoint.id) ? (
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          )}
                          <Badge className={`${getMethodColor(endpoint.method)} font-mono font-bold`}>
                            {endpoint.method}
                          </Badge>
                          <code className="text-sm font-mono">{endpoint.path}</code>
                          <p className="text-sm text-muted-foreground">{endpoint.summary}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {endpoint.tags.map((tag) => (
                            <Badge key={tag} variant="secondary">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </CollapsibleTrigger>

                    <CollapsibleContent>
                      <div className="border-t p-4 bg-muted/30">
                        <Tabs defaultValue="description">
                          <TabsList>
                            <TabsTrigger value="description">说明</TabsTrigger>
                            <TabsTrigger value="parameters">参数</TabsTrigger>
                            <TabsTrigger value="responses">响应</TabsTrigger>
                          </TabsList>

                          <TabsContent value="description" className="space-y-3">
                            <p className="text-sm">{endpoint.description}</p>
                            <Button onClick={() => handleTest(endpoint)} className="gap-2">
                              <Send className="h-4 w-4" />
                              在线测试
                            </Button>
                          </TabsContent>

                          <TabsContent value="parameters">
                            {endpoint.parameters && endpoint.parameters.length > 0 ? (
                              <div className="space-y-2">
                                {endpoint.parameters.map((param: any, idx: number) => (
                                  <div key={idx} className="border rounded p-3 bg-background">
                                    <div className="flex items-center gap-2 mb-1">
                                      <code className="text-sm font-mono font-bold">{param.name}</code>
                                      <Badge variant="outline" className="text-xs">
                                        {param.in}
                                      </Badge>
                                      {param.required && <Badge variant="destructive" className="text-xs">必填</Badge>}
                                    </div>
                                    <p className="text-sm text-muted-foreground">{param.description}</p>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-sm text-muted-foreground">无参数</p>
                            )}
                          </TabsContent>

                          <TabsContent value="responses">
                            {endpoint.responses && Object.keys(endpoint.responses).length > 0 ? (
                              <div className="space-y-2">
                                {Object.entries(endpoint.responses).map(([status, response]: [string, any]) => (
                                  <div key={status} className="border rounded p-3 bg-background">
                                    <div className="flex items-center gap-2 mb-1">
                                      <Badge variant={status === '200' || status === '201' ? 'default' : 'destructive'}>
                                        {status}
                                      </Badge>
                                      <p className="text-sm font-medium">{response.description}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-sm text-muted-foreground">无响应定义</p>
                            )}
                          </TabsContent>
                        </Tabs>
                      </div>
                    </CollapsibleContent>
                  </div>
                </Collapsible>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Import Dialog */}
        <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>导入 Swagger JSON</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <Textarea
                placeholder="粘贴 Swagger/OpenAPI JSON 文档..."
                value={importJson}
                onChange={(e) => setImportJson(e.target.value)}
                rows={15}
                className="font-mono text-sm"
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsImportDialogOpen(false)}>
                取消
              </Button>
              <Button onClick={handleParseSwagger}>解析并导入</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Test Dialog */}
        <Dialog open={isTestDialogOpen} onOpenChange={setIsTestDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>测试接口: {selectedEndpoint?.summary}</DialogTitle>
            </DialogHeader>
            <Tabs defaultValue="request" className="py-4">
              <TabsList>
                <TabsTrigger value="request">请求</TabsTrigger>
                <TabsTrigger value="response">响应</TabsTrigger>
              </TabsList>

              <TabsContent value="request" className="space-y-4">
                <div className="space-y-2">
                  <Label>URL</Label>
                  <Input
                    value={testForm.url}
                    onChange={(e) => setTestForm({ ...testForm, url: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Headers</Label>
                  <Textarea
                    value={testForm.headers}
                    onChange={(e) => setTestForm({ ...testForm, headers: e.target.value })}
                    rows={4}
                    className="font-mono text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Authorization Token (可选)</Label>
                  <Input
                    placeholder="Bearer token..."
                    value={testForm.token}
                    onChange={(e) => setTestForm({ ...testForm, token: e.target.value })}
                  />
                </div>
                {selectedEndpoint?.method !== 'GET' && (
                  <div className="space-y-2">
                    <Label>Body (JSON)</Label>
                    <Textarea
                      value={testForm.body}
                      onChange={(e) => setTestForm({ ...testForm, body: e.target.value })}
                      rows={8}
                      className="font-mono text-sm"
                    />
                  </div>
                )}
                <Button onClick={handleSendRequest} className="w-full gap-2">
                  <Send className="h-4 w-4" />
                  发送请求
                </Button>
              </TabsContent>

              <TabsContent value="response" className="space-y-4">
                {testResponse ? (
                  <>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Label>状态码</Label>
                        <Badge variant={testResponse.status < 400 ? 'default' : 'destructive'}>
                          {testResponse.status}
                        </Badge>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Headers</Label>
                      <pre className="p-3 bg-muted rounded text-xs font-mono overflow-x-auto">
                        {testResponse.headers}
                      </pre>
                    </div>
                    <div className="space-y-2">
                      <Label>Body</Label>
                      <pre className="p-3 bg-muted rounded text-xs font-mono overflow-x-auto">
                        {testResponse.body}
                      </pre>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <FileJson className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>发送请求后查看响应</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
