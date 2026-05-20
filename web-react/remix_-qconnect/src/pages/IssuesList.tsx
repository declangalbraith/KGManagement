import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card';
import { Input } from '@/src/components/ui/input';
import { Button } from '@/src/components/ui/button';
import { Badge } from '@/src/components/ui/badge';
import { Search, Filter, Download, Plus, LayoutDashboard, ListTodo, FileText, Search as SearchIcon, Archive, Trash2, RotateCcw, FileX, Flame, EyeOff } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useToast } from '@/src/components/ui/use-toast';

const initialIssues = [
  { id: 'ISS-202604-001', title: '制动盘表面出现异常磨损', category: '质量投诉', product: '制动盘', status: '处理中', priority: '高', owner: '李四', date: '2026-04-10', isArchived: false, isDeleted: false, isHot: true },
  { id: 'ISS-202604-002', title: '空压机异响问题排查', category: '技术咨询', product: '空压机', status: '待确认原因', priority: '中', owner: '王五', date: '2026-04-09', isArchived: false, isDeleted: false, isHot: false },
  { id: 'ISS-202604-003', title: '控制阀漏气现象', category: '质量投诉', product: '控制阀', status: '待审批', priority: '紧急', owner: '张三', date: '2026-04-08', isArchived: false, isDeleted: false, isHot: false },
  { id: 'ISS-202604-004', title: '传感器信号不稳定', category: '现场支持', product: '传感器', status: '已完成', priority: '低', owner: '赵六', date: '2026-04-05', isArchived: false, isDeleted: false, isHot: true },
];

export function IssuesList() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [issues, setIssues] = useState(initialIssues);
  const [viewMode, setViewMode] = useState<'active' | 'archived' | 'deleted' | 'hot'>('active');
  const [isExporting, setIsExporting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const isAdmin = true; // Assume true to show admin features

  const handleExport = () => {
    setIsExporting(true);
    setTimeout(() => {
      setIsExporting(false);
      toast({
        title: "导出成功",
        description: "问题列表已导出为 Excel 文件。",
        variant: "success"
      });
    }, 1500);
  };

  const handleArchive = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setIssues(prev => prev.map(issue => issue.id === id ? { ...issue, isArchived: true } : issue));
    toast({ title: "已归档", description: "问题单已移至归档库" });
  };

  const handleRestoreArchive = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setIssues(prev => prev.map(issue => issue.id === id ? { ...issue, isArchived: false } : issue));
    toast({ title: "已恢复", description: "问题单已从归档库恢复" });
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setIssues(prev => prev.map(issue => issue.id === id ? { ...issue, isDeleted: true } : issue));
    toast({ title: "已删除", description: "问题单已移至回收站", variant: "destructive" });
  };

  const handleRestoreDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setIssues(prev => prev.map(issue => issue.id === id ? { ...issue, isDeleted: false } : issue));
    toast({ title: "已恢复", description: "问题单已从回收站恢复" });
  };

  const handleSetHot = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setIssues(prev => prev.map(issue => issue.id === id ? { ...issue, isHot: true } : issue));
    toast({ title: "已设为热点", description: "问题已升级为系统热点" });
  };

  const handleRemoveHot = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setIssues(prev => prev.map(issue => issue.id === id ? { ...issue, isHot: false } : issue));
    toast({ title: "取消热点", description: "问题已从热点列表移除" });
  };

  const filteredIssues = issues.filter(issue => {
    const matchesSearch = issue.title.includes(searchQuery) || issue.id.includes(searchQuery) || issue.product.includes(searchQuery);
    
    if (viewMode === 'deleted') return issue.isDeleted && matchesSearch;
    if (viewMode === 'archived') return issue.isArchived && !issue.isDeleted && matchesSearch;
    if (viewMode === 'hot') return issue.isHot && !issue.isDeleted && matchesSearch;
    return !issue.isArchived && !issue.isDeleted && matchesSearch;
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-serif text-primary-900 dark:text-primary-100">问题管理</h1>
          <p className="text-muted-foreground mt-1">查看和管理所有客户问题及内部协同流程。</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="gap-2 rounded-md hover:bg-primary/5 hover:text-primary transition-colors" onClick={handleExport} isLoading={isExporting}>
            <Download className="h-4 w-4" />
            导出
          </Button>
          <Link to="/issues/new">
            <Button className="gap-2 rounded-md shadow-md hover:shadow-lg transition-all">
              <Plus className="h-4 w-4" />
              创建问题
            </Button>
          </Link>
        </div>
      </div>

      <Card className="glass-panel hover:shadow-lg transition-all duration-300">
        <CardHeader className="pb-3 border-b border-border/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="relative w-72 group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input 
                  placeholder="搜索编号、标题、产品..." 
                  className="pl-10 transition-all focus:ring-2 rounded-md bg-muted/50 border-transparent focus:border-primary/30 focus:bg-background h-10" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button variant="outline" className="gap-2 rounded-md hover:bg-primary/5 hover:text-primary transition-colors" onClick={() => toast({ title: "高级筛选", description: "正在打开高级筛选面板..." })}>
                <Filter className="h-4 w-4" />
                筛选
              </Button>
            </div>
            <div className="flex gap-1 bg-muted/50 p-1 rounded-md">
              <Button 
                variant="ghost" 
                size="sm" 
                className={`rounded-sm shadow-sm ${viewMode === 'active' ? 'bg-background text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                onClick={() => setViewMode('active')}
              >
                活跃问题
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className={`rounded-sm shadow-sm ${viewMode === 'hot' ? 'bg-background text-red-600' : 'text-muted-foreground hover:text-foreground'}`}
                onClick={() => setViewMode('hot')}
              >
                <Flame className="w-3.5 h-3.5 mr-1" /> 热点问题
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className={`rounded-sm shadow-sm ${viewMode === 'archived' ? 'bg-background text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                onClick={() => setViewMode('archived')}
              >
                已归档
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className={`rounded-sm shadow-sm ${viewMode === 'deleted' ? 'bg-background text-primary' : 'text-muted-foreground hover:text-foreground'}`}
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
                  <th className="px-6 py-4 font-medium">问题编号</th>
                  <th className="px-6 py-4 font-medium">标题</th>
                  <th className="px-6 py-4 font-medium">分类</th>
                  <th className="px-6 py-4 font-medium">产品</th>
                  <th className="px-6 py-4 font-medium">状态</th>
                  <th className="px-6 py-4 font-medium">优先级</th>
                  <th className="px-6 py-4 font-medium">负责人</th>
                  <th className="px-6 py-4 font-medium">创建时间</th>
                  <th className="px-6 py-4 font-medium text-right">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {filteredIssues.length > 0 ? (
                  filteredIssues.map((issue) => (
                    <tr key={issue.id} className="hover:bg-muted/30 transition-colors group cursor-pointer" onClick={() => navigate(`/issues/${issue.id}`)}>
                      <td className="px-6 py-4 font-medium text-primary-600 font-mono text-xs">
                        <span className="hover:underline">{issue.id}</span>
                      </td>
                      <td className="px-6 py-4 font-medium group-hover:text-primary transition-colors">
                        <div className="flex items-center gap-2">
                          {issue.title}
                          {issue.isHot && (
                            <span title="热点问题" className="flex items-center justify-center shrink-0">
                               <Flame className="h-4 w-4 text-red-500" />
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">{issue.category}</td>
                      <td className="px-6 py-4 text-muted-foreground">{issue.product}</td>
                      <td className="px-6 py-4">
                        <Badge variant={issue.status === '已完成' ? 'success' : issue.status === '处理中' ? 'default' : 'warning'} className="shadow-sm whitespace-nowrap">
                          {issue.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={issue.priority === '紧急' ? 'destructive' : issue.priority === '高' ? 'warning' : 'outline'} className="shadow-sm whitespace-nowrap">
                          {issue.priority}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">{issue.owner}</td>
                      <td className="px-6 py-4 text-muted-foreground font-mono text-xs">{issue.date}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {(viewMode === 'active' || viewMode === 'hot') && (
                            <>
                              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-md hover:bg-primary/10 hover:text-primary" onClick={(e) => { e.stopPropagation(); navigate(`/issues/${issue.id}`); }} title="问题总览">
                                <LayoutDashboard className="h-4 w-4" />
                              </Button>
                              {isAdmin && !issue.isHot && viewMode === 'active' && (
                                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-md hover:bg-red-50 hover:text-red-500" onClick={(e) => handleSetHot(e, issue.id)} title="设为热点问题">
                                  <Flame className="h-4 w-4" />
                                </Button>
                              )}
                              {isAdmin && issue.isHot && (viewMode === 'active' || viewMode === 'hot') && (
                                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-md hover:bg-red-50 hover:text-red-500" onClick={(e) => handleRemoveHot(e, issue.id)} title="取消热点问题">
                                  <EyeOff className="h-4 w-4" />
                                </Button>
                              )}
                              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-md hover:bg-orange-50 hover:text-orange-600" onClick={(e) => handleArchive(e, issue.id)} title="归档">
                                <Archive className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-md hover:bg-red-50 hover:text-red-600" onClick={(e) => handleDelete(e, issue.id)} title="移动至回收站">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                          {viewMode === 'archived' && (
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-md hover:bg-primary/10 hover:text-primary" onClick={(e) => handleRestoreArchive(e, issue.id)} title="从归档库恢复">
                              <RotateCcw className="h-4 w-4" />
                            </Button>
                          )}
                          {viewMode === 'deleted' && (
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-md hover:bg-primary/10 hover:text-primary" onClick={(e) => handleRestoreDelete(e, issue.id)} title="从回收站恢复">
                              <RotateCcw className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={9} className="px-6 py-12 text-center text-muted-foreground">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <FileX className="h-8 w-8 text-muted-foreground/30" />
                        <p>没有找到相关的问题单</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between p-4 border-t border-border/50 text-sm text-muted-foreground bg-muted/10">
            <div>显示 1 到 {filteredIssues.length} 条，共 {filteredIssues.length} 条记录</div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled className="rounded-md">上一页</Button>
              <Button variant="outline" size="sm" disabled={filteredIssues.length < 4} className="rounded-md">下一页</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
