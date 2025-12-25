import { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, Database, Table as TableIcon, FileText } from 'lucide-react';
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
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';

interface DataTable {
  id: string;
  name: string;
  comment: string;
  type: string;
  created_at: string;
}

interface DataField {
  id: string;
  table_id: string;
  name: string;
  type: string;
  length: number | null;
  nullable: boolean;
  default_value: string | null;
  comment: string;
  is_primary: boolean;
  is_unique: boolean;
}

export default function DataDictionary() {
  const { user } = useAuthContext();
  const [tables, setTables] = useState<DataTable[]>([]);
  const [fields, setFields] = useState<DataField[]>([]);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isTableDialogOpen, setIsTableDialogOpen] = useState(false);
  const [isFieldDialogOpen, setIsFieldDialogOpen] = useState(false);
  const [editingTable, setEditingTable] = useState<DataTable | null>(null);
  const [editingField, setEditingField] = useState<DataField | null>(null);
  const [loading, setLoading] = useState(true);

  const [tableForm, setTableForm] = useState({
    name: '',
    comment: '',
    type: 'business',
  });

  const [fieldForm, setFieldForm] = useState({
    name: '',
    type: 'VARCHAR',
    length: 255,
    nullable: true,
    default_value: '',
    comment: '',
    is_primary: false,
    is_unique: false,
  });

  // 获取数据表列表
  const fetchTables = async () => {
    try {
      const { data, error } = await supabase
        .from('data_tables')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setTables((data || []) as DataTable[]);
      if (data && data.length > 0 && !selectedTable) {
        setSelectedTable(data[0].id);
      }
    } catch (error) {
      console.error('Error fetching tables:', error);
      toast({ title: '获取数据表失败', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTables();
  }, []);

  // 获取字段列表
  useEffect(() => {
    if (!selectedTable) return;

    const fetchFields = async () => {
      try {
        const { data, error } = await supabase
          .from('data_fields')
          .select('*')
          .eq('table_id', selectedTable)
          .order('created_at', { ascending: true });

        if (error) throw error;

        setFields((data || []) as DataField[]);
      } catch (error) {
        console.error('Error fetching fields:', error);
        toast({ title: '获取字段失败', variant: 'destructive' });
      }
    };

    fetchFields();
  }, [selectedTable]);

  const filteredTables = tables.filter(
    (table) =>
      table.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      table.comment.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddTable = () => {
    setEditingTable(null);
    setTableForm({ name: '', comment: '', type: 'business' });
    setIsTableDialogOpen(true);
  };

  const handleEditTable = (table: DataTable) => {
    setEditingTable(table);
    setTableForm({ name: table.name, comment: table.comment, type: table.type });
    setIsTableDialogOpen(true);
  };

  const handleSaveTable = () => {
    if (!tableForm.name) {
      toast({ title: '请输入表名', variant: 'destructive' });
      return;
    }

    if (editingTable) {
      setTables(tables.map((t) => (t.id === editingTable.id ? { ...t, ...tableForm } : t)));
      toast({ title: '表更新成功' });
    } else {
      const newTable: DataTable = {
        id: Date.now().toString(),
        ...tableForm,
        created_at: new Date().toISOString(),
      };
      setTables([...tables, newTable]);
      toast({ title: '表创建成功' });
    }

    setIsTableDialogOpen(false);
  };

  const handleDeleteTable = (id: string) => {
    if (confirm('确定要删除此表吗？')) {
      setTables(tables.filter((t) => t.id !== id));
      if (selectedTable === id) {
        setSelectedTable(tables[0]?.id || null);
      }
      toast({ title: '表删除成功' });
    }
  };

  const handleAddField = () => {
    setEditingField(null);
    setFieldForm({
      name: '',
      type: 'VARCHAR',
      length: 255,
      nullable: true,
      default_value: '',
      comment: '',
      is_primary: false,
      is_unique: false,
    });
    setIsFieldDialogOpen(true);
  };

  const handleEditField = (field: DataField) => {
    setEditingField(field);
    setFieldForm({
      name: field.name,
      type: field.type,
      length: field.length || 255,
      nullable: field.nullable,
      default_value: field.default_value || '',
      comment: field.comment,
      is_primary: field.is_primary,
      is_unique: field.is_unique,
    });
    setIsFieldDialogOpen(true);
  };

  const handleSaveField = () => {
    if (!fieldForm.name || !selectedTable) {
      toast({ title: '请输入字段名', variant: 'destructive' });
      return;
    }

    if (editingField) {
      setFields(
        fields.map((f) =>
          f.id === editingField.id
            ? { ...f, ...fieldForm, length: fieldForm.length || null }
            : f
        )
      );
      toast({ title: '字段更新成功' });
    } else {
      const newField: DataField = {
        id: Date.now().toString(),
        table_id: selectedTable,
        ...fieldForm,
        length: fieldForm.length || null,
        default_value: fieldForm.default_value || null,
      };
      setFields([...fields, newField]);
      toast({ title: '字段创建成功' });
    }

    setIsFieldDialogOpen(false);
  };

  const handleDeleteField = (id: string) => {
    if (confirm('确定要删除此字段吗？')) {
      setFields(fields.filter((f) => f.id !== id));
      toast({ title: '字段删除成功' });
    }
  };

  const selectedTableInfo = tables.find((t) => t.id === selectedTable);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Database className="h-8 w-8 text-primary" />
              数据字典
            </h1>
            <p className="text-muted-foreground mt-2">管理数据库表结构和字段定义</p>
          </div>
          <Button onClick={handleAddTable} className="gap-2">
            <Plus className="h-4 w-4" />
            新建表
          </Button>
        </div>

        <div className="grid grid-cols-12 gap-6">
          {/* Table List */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="col-span-12 lg:col-span-4"
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TableIcon className="h-5 w-5" />
                  数据表列表
                </CardTitle>
                <CardDescription>共 {tables.length} 张表</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="搜索表名..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>

                  <div className="space-y-2 max-h-[600px] overflow-y-auto">
                    {filteredTables.map((table) => (
                      <motion.div
                        key={table.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className={`
                          p-3 rounded-lg border cursor-pointer transition-all group
                          ${
                            selectedTable === table.id
                              ? 'bg-primary/10 border-primary'
                              : 'hover:bg-muted'
                          }
                        `}
                        onClick={() => setSelectedTable(table.id)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-medium truncate">{table.name}</p>
                              <Badge variant={table.type === 'business' ? 'default' : 'secondary'}>
                                {table.type === 'business' ? '业务表' : '系统表'}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground truncate">{table.comment}</p>
                          </div>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditTable(table);
                              }}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 hover:text-destructive"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteTable(table.id);
                              }}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Field List */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="col-span-12 lg:col-span-8"
          >
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      {selectedTableInfo?.name || '选择表'} - 字段列表
                    </CardTitle>
                    {selectedTableInfo && (
                      <CardDescription>{selectedTableInfo.comment}</CardDescription>
                    )}
                  </div>
                  {selectedTable && (
                    <Button onClick={handleAddField} className="gap-2">
                      <Plus className="h-4 w-4" />
                      新建字段
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {selectedTable ? (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>字段名</TableHead>
                          <TableHead>类型</TableHead>
                          <TableHead>长度</TableHead>
                          <TableHead>可空</TableHead>
                          <TableHead>默认值</TableHead>
                          <TableHead>说明</TableHead>
                          <TableHead>标识</TableHead>
                          <TableHead className="text-right">操作</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {fields.map((field) => (
                          <TableRow key={field.id}>
                            <TableCell className="font-medium">{field.name}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{field.type}</Badge>
                            </TableCell>
                            <TableCell>{field.length || '-'}</TableCell>
                            <TableCell>
                              <Badge variant={field.nullable ? 'secondary' : 'default'}>
                                {field.nullable ? '是' : '否'}
                              </Badge>
                            </TableCell>
                            <TableCell className="max-w-[150px] truncate">
                              {field.default_value || '-'}
                            </TableCell>
                            <TableCell className="max-w-[200px] truncate">{field.comment}</TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                {field.is_primary && <Badge variant="destructive">主键</Badge>}
                                {field.is_unique && <Badge variant="default">唯一</Badge>}
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={() => handleEditField(field)}
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 hover:text-destructive"
                                  onClick={() => handleDeleteField(field.id)}
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
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>请选择一个表查看字段</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Table Dialog */}
        <Dialog open={isTableDialogOpen} onOpenChange={setIsTableDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingTable ? '编辑表' : '新建表'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>表名</Label>
                <Input
                  placeholder="例如: users"
                  value={tableForm.name}
                  onChange={(e) => setTableForm({ ...tableForm, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>说明</Label>
                <Textarea
                  placeholder="表的用途说明"
                  value={tableForm.comment}
                  onChange={(e) => setTableForm({ ...tableForm, comment: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label>类型</Label>
                <Select
                  value={tableForm.type}
                  onValueChange={(v) => setTableForm({ ...tableForm, type: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="business">业务表</SelectItem>
                    <SelectItem value="system">系统表</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsTableDialogOpen(false)}>
                取消
              </Button>
              <Button onClick={handleSaveTable}>{editingTable ? '更新' : '创建'}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Field Dialog */}
        <Dialog open={isFieldDialogOpen} onOpenChange={setIsFieldDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingField ? '编辑字段' : '新建字段'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>字段名</Label>
                  <Input
                    placeholder="例如: email"
                    value={fieldForm.name}
                    onChange={(e) => setFieldForm({ ...fieldForm, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>数据类型</Label>
                  <Select
                    value={fieldForm.type}
                    onValueChange={(v) => setFieldForm({ ...fieldForm, type: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="VARCHAR">VARCHAR</SelectItem>
                      <SelectItem value="TEXT">TEXT</SelectItem>
                      <SelectItem value="INTEGER">INTEGER</SelectItem>
                      <SelectItem value="BIGINT">BIGINT</SelectItem>
                      <SelectItem value="DECIMAL">DECIMAL</SelectItem>
                      <SelectItem value="BOOLEAN">BOOLEAN</SelectItem>
                      <SelectItem value="DATE">DATE</SelectItem>
                      <SelectItem value="TIMESTAMP">TIMESTAMP</SelectItem>
                      <SelectItem value="UUID">UUID</SelectItem>
                      <SelectItem value="JSON">JSON</SelectItem>
                      <SelectItem value="JSONB">JSONB</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>长度</Label>
                  <Input
                    type="number"
                    placeholder="例如: 255"
                    value={fieldForm.length}
                    onChange={(e) =>
                      setFieldForm({ ...fieldForm, length: parseInt(e.target.value) || 0 })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>默认值</Label>
                  <Input
                    placeholder="例如: NULL"
                    value={fieldForm.default_value}
                    onChange={(e) => setFieldForm({ ...fieldForm, default_value: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>说明</Label>
                <Textarea
                  placeholder="字段用途说明"
                  value={fieldForm.comment}
                  onChange={(e) => setFieldForm({ ...fieldForm, comment: e.target.value })}
                  rows={2}
                />
              </div>

              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={fieldForm.nullable}
                    onChange={(e) => setFieldForm({ ...fieldForm, nullable: e.target.checked })}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm">允许为空</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={fieldForm.is_primary}
                    onChange={(e) => setFieldForm({ ...fieldForm, is_primary: e.target.checked })}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm">主键</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={fieldForm.is_unique}
                    onChange={(e) => setFieldForm({ ...fieldForm, is_unique: e.target.checked })}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm">唯一</span>
                </label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsFieldDialogOpen(false)}>
                取消
              </Button>
              <Button onClick={handleSaveField}>{editingField ? '更新' : '创建'}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
