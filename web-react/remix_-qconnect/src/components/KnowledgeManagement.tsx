import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Search, Plus, Filter, MoreHorizontal, CheckCircle, XCircle, Clock, Edit, RefreshCw, FileText, Archive, Trash2, RotateCcw } from 'lucide-react';
import { useToast } from './ui/use-toast';

type KnowledgeStatus = 'draft' | 'pending' | 'published' | 'rejected';

interface KnowledgeItem {
  id: string;
  title: string;
  category: string;
  author: string;
  date: string;
  status: KnowledgeStatus;
  isArchived?: boolean;
  isDeleted?: boolean;
}

const initialData: KnowledgeItem[] = [
  { id: 'KN-001', title: '制动盘异常磨损的根因分析与解决案例', category: '历史案例', author: '张三', date: '2024-09-15', status: 'published', isArchived: false, isDeleted: false },
  { id: 'KN-002', title: '空压机异响排查标准操作规程 (SOP)', category: '标准操作规程', author: '李四', date: '2024-09-18', status: 'pending', isArchived: false, isDeleted: false },
  { id: 'KN-003', title: '8D 报告编写规范与优秀案例', category: '培训资料', author: '王五', date: '2024-09-20', status: 'draft', isArchived: false, isDeleted: false },
  { id: 'KN-004', title: '列车车门防夹功能测试指南', category: '产品技术文档', author: '赵六', date: '2024-09-22', status: 'rejected', isArchived: false, isDeleted: false },
  { id: 'KN-005', title: '牵引电机高温报警处理流程', category: '常见问题解答', author: '张三', date: '2024-09-25', status: 'pending', isArchived: false, isDeleted: false },
];

export function KnowledgeManagement() {
  const { toast } = useToast();
  const [items, setItems] = useState<KnowledgeItem[]>(initialData);
  const [filter, setFilter] = useState<'all' | KnowledgeStatus>('all');
  const [viewMode, setViewMode] = useState<'active' | 'archived' | 'deleted'>('active');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);

  const handleArchive = (id: string) => {
    setItems(items.map(item => item.id === id ? { ...item, isArchived: true } : item));
    toast({ title: "已归档", description: `知识条目 ${id} 已移至归档库` });
  };

  const handleRestoreArchive = (id: string) => {
    setItems(items.map(item => item.id === id ? { ...item, isArchived: false } : item));
    toast({ title: "已恢复", description: `知识条目 ${id} 已从归档库恢复` });
  };

  const handleDelete = (id: string) => {
    setItems(items.map(item => item.id === id ? { ...item, isDeleted: true } : item));
    toast({ title: "已删除", description: `知识条目 ${id} 已移至回收站`, variant: "destructive" });
  };

  const handleRestoreDelete = (id: string) => {
    setItems(items.map(item => item.id === id ? { ...item, isDeleted: false } : item));
    toast({ title: "已恢复", description: `知识条目 ${id} 已从回收站恢复` });
  };

  const filteredItems = items.filter(item => {
    const matchesFilter = filter === 'all' || item.status === filter;
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) || item.id.toLowerCase().includes(searchQuery.toLowerCase());
    
    let matchesView = false;
    if (viewMode === 'deleted') matchesView = !!item.isDeleted;
    else if (viewMode === 'archived') matchesView = !!item.isArchived && !item.isDeleted;
    else matchesView = !item.isArchived && !item.isDeleted;

    return matchesFilter && matchesSearch && matchesView;
  });

  const handleStatusChange = (id: string, newStatus: KnowledgeStatus) => {
    setItems(items.map(item => item.id === id ? { ...item, status: newStatus } : item));
    toast({
      title: "状态已更新",
      description: `知识条目 ${id} 已更新为 ${newStatus === 'published' ? '已发布' : newStatus === 'rejected' ? '已驳回' : '待审核'}`,
    });
  };

  const handleSyncQualityDocs = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setItems([
        { id: 'KN-006', title: '制动盘总成 PFMEA V1.0', category: '受控文档', author: '系统同步', date: new Date().toISOString().split('T')[0], status: 'published' },
        ...items
      ]);
      setIsSyncing(false);
      toast({
        title: "同步完成",
        description: "已成功从质量文档系统同步 1 份已发布的文档至知识库。",
      });
    }, 1500);
  };

  const getStatusBadge = (status: KnowledgeStatus) => {
    switch (status) {
      case 'published': return <Badge variant="success" className="bg-emerald-100 text-emerald-800 border-emerald-200"><CheckCircle className="w-3 h-3 mr-1" /> 已发布</Badge>;
      case 'pending': return <Badge variant="warning" className="bg-amber-100 text-amber-800 border-amber-200"><Clock className="w-3 h-3 mr-1" /> 待审核</Badge>;
      case 'draft': return <Badge variant="secondary" className="bg-slate-100 text-slate-800 border-slate-200"><Edit className="w-3 h-3 mr-1" /> 草稿</Badge>;
      case 'rejected': return <Badge variant="destructive" className="bg-red-100 text-red-800 border-red-200"><XCircle className="w-3 h-3 mr-1" /> 已驳回</Badge>;
    }
  };

  return (
    <Card className="glass-panel border-border/50 shadow-sm">
      <CardHeader className="border-b border-border/50 bg-muted/10 pb-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <CardTitle className="text-xl font-serif text-primary-900 dark:text-primary-100">知识管理与审核</CardTitle>
          <div className="flex items-center gap-2">
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="搜索标题或编号..." 
                className="pl-9 h-9 rounded-full bg-background"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button size="sm" variant="outline" className="h-9 rounded-full gap-1.5 shadow-sm border-blue-200 text-blue-700 hover:bg-blue-50" onClick={handleSyncQualityDocs} disabled={isSyncing}>
              {isSyncing ? <RefreshCw className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
              同步质量文档
            </Button>
            <Button size="sm" className="h-9 rounded-full gap-1.5 shadow-sm" onClick={() => toast({ title: "新建知识", description: "正在打开知识编辑器..." })}>
              <Plus className="h-4 w-4" /> 新建知识
            </Button>
          </div>
        </div>
        <div className="flex justify-between items-center mt-4">
          <div className="flex gap-2">
            <Button variant={filter === 'all' ? 'default' : 'outline'} size="sm" onClick={() => setFilter('all')} className="rounded-sm h-8 px-4 text-xs">全部</Button>
            <Button variant={filter === 'pending' ? 'default' : 'outline'} size="sm" onClick={() => setFilter('pending')} className="rounded-sm h-8 px-4 text-xs">待审核</Button>
            <Button variant={filter === 'published' ? 'default' : 'outline'} size="sm" onClick={() => setFilter('published')} className="rounded-sm h-8 px-4 text-xs">已发布</Button>
            <Button variant={filter === 'draft' ? 'default' : 'outline'} size="sm" onClick={() => setFilter('draft')} className="rounded-sm h-8 px-4 text-xs">草稿</Button>
            <Button variant={filter === 'rejected' ? 'default' : 'outline'} size="sm" onClick={() => setFilter('rejected')} className="rounded-sm h-8 px-4 text-xs">已驳回</Button>
          </div>
          <div className="flex gap-1 bg-muted p-1 rounded-sm border">
            <Button 
                variant={viewMode === 'active' ? 'secondary' : 'ghost'} 
                size="sm" 
                className={`rounded-sm h-7 text-xs ${viewMode === 'active' ? 'bg-background shadow-sm' : ''}`}
                onClick={() => setViewMode('active')}
              >
                活跃
              </Button>
              <Button 
                variant={viewMode === 'archived' ? 'secondary' : 'ghost'} 
                size="sm" 
                className={`rounded-sm h-7 text-xs ${viewMode === 'archived' ? 'bg-background shadow-sm' : ''}`}
                onClick={() => setViewMode('archived')}
              >
                已归档
              </Button>
              <Button 
                variant={viewMode === 'deleted' ? 'secondary' : 'ghost'} 
                size="sm" 
                className={`rounded-sm h-7 text-xs ${viewMode === 'deleted' ? 'bg-background shadow-sm' : ''}`}
                onClick={() => setViewMode('deleted')}
              >
                回收站
              </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground bg-muted/30 border-b border-border/50">
              <tr>
                <th className="px-6 py-3 font-medium">编号</th>
                <th className="px-6 py-3 font-medium">标题</th>
                <th className="px-6 py-3 font-medium">分类</th>
                <th className="px-6 py-3 font-medium">作者</th>
                <th className="px-6 py-3 font-medium">更新时间</th>
                <th className="px-6 py-3 font-medium">状态</th>
                <th className="px-6 py-3 font-medium text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {filteredItems.map((item) => (
                <tr key={item.id} className="hover:bg-muted/20 transition-colors group">
                  <td className="px-6 py-4 font-mono text-xs text-muted-foreground">{item.id}</td>
                  <td className="px-6 py-4 font-medium text-foreground max-w-[300px] truncate" title={item.title}>{item.title}</td>
                  <td className="px-6 py-4"><Badge variant="outline" className="bg-background font-normal">{item.category}</Badge></td>
                  <td className="px-6 py-4 text-muted-foreground">{item.author}</td>
                  <td className="px-6 py-4 text-muted-foreground text-xs">{item.date}</td>
                  <td className="px-6 py-4">{getStatusBadge(item.status)}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {viewMode === 'active' ? (
                        <>
                          {item.status === 'pending' && (
                            <>
                              <Button size="sm" variant="outline" className="h-7 px-2 text-xs text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 border-emerald-200" onClick={() => handleStatusChange(item.id, 'published')}>
                                通过
                              </Button>
                              <Button size="sm" variant="outline" className="h-7 px-2 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200" onClick={() => handleStatusChange(item.id, 'rejected')}>
                                驳回
                              </Button>
                            </>
                          )}
                          {item.status === 'draft' && (
                            <Button size="sm" variant="outline" className="h-7 px-2 text-xs text-primary hover:text-primary hover:bg-primary/10 border-primary/20" onClick={() => handleStatusChange(item.id, 'pending')}>
                              提交审核
                            </Button>
                          )}
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0 hover:text-orange-600 hover:bg-orange-50" onClick={() => handleArchive(item.id)} title="归档">
                            <Archive className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0 hover:text-red-600 hover:bg-red-50" onClick={() => handleDelete(item.id)} title="删除">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      ) : (
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="h-7 px-2 text-xs gap-1 hover:bg-primary/5 hover:text-primary transition-colors" 
                          onClick={() => viewMode === 'archived' ? handleRestoreArchive(item.id) : handleRestoreDelete(item.id)}
                        >
                          <RotateCcw className="h-3 w-3" /> 恢复
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredItems.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-muted-foreground">
                    没有找到符合条件的知识条目
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
