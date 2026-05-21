import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card';
import { Input } from '@/src/components/ui/input';
import { Button } from '@/src/components/ui/button';
import { Search, Filter, Download, ShieldCheck, ChevronLeft, ChevronRight } from 'lucide-react';
import { useToast } from '@/src/components/ui/use-toast';

const logs = [
  { id: '1', time: '2026-04-11 10:23:45', user: '张三', action: '审批通过', module: '8D报告', target: '8D-202604-003', ip: '192.168.1.105' },
  { id: '2', time: '2026-04-11 09:15:22', user: '李四', action: '更新状态', module: '问题管理', target: 'ISS-202604-001', ip: '192.168.1.112' },
  { id: '3', time: '2026-04-10 16:45:10', user: '王五', action: '导出数据', module: '数据分析', target: '本月质量报表', ip: '192.168.1.88' },
  { id: '4', time: '2026-04-10 14:30:00', user: '赵六', action: '创建任务', module: '子任务', target: 'TSK-202604-004', ip: '192.168.1.95' },
  { id: '5', time: '2026-04-10 09:30:15', user: '张三', action: '创建问题', module: '问题管理', target: 'ISS-202604-001', ip: '192.168.1.105' },
];

export function Audit() {
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleExport = () => {
    setIsExporting(true);
    setTimeout(() => {
      setIsExporting(false);
      toast({
        title: "导出成功",
        description: "审计日志已导出为 CSV 文件。",
        variant: "success"
      });
    }, 1500);
  };

  const filteredLogs = logs.filter(log => 
    log.user.includes(searchQuery) || log.target.includes(searchQuery) || log.action.includes(searchQuery) || log.module.includes(searchQuery)
  );

  return (
    <div className="flex flex-col gap-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-serif text-primary-900 dark:text-primary-100 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <ShieldCheck className="h-6 w-6 text-primary" />
            </div>
            日志与审计
          </h1>
          <p className="text-muted-foreground mt-2">查看系统操作日志，确保数据安全与合规。</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="gap-2 rounded-full hover:bg-primary/5 hover:text-primary transition-colors shadow-sm" onClick={handleExport} isLoading={isExporting}>
            <Download className="h-4 w-4" />
            导出日志
          </Button>
        </div>
      </div>

      <Card className="glass-panel hover:shadow-lg transition-all duration-300 border-border/50">
        <CardHeader className="pb-4 border-b border-border/50 bg-muted/5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1 w-full sm:w-auto flex-wrap">
              <div className="relative w-full sm:w-72 group">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input 
                  placeholder="搜索操作人、目标、模块..." 
                  className="pl-9 bg-background/50 border-border/50 focus:bg-background transition-all rounded-full" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <select className="h-10 rounded-full border border-border/50 bg-background/50 px-4 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 transition-all hover:border-primary/50 cursor-pointer">
                  <option value="">所有模块</option>
                  <option value="issue">问题管理</option>
                  <option value="8d">8D报告</option>
                  <option value="knowledge">知识库</option>
                  <option value="admin">后台管理</option>
                </select>
                <select className="h-10 rounded-full border border-border/50 bg-background/50 px-4 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 transition-all hover:border-primary/50 cursor-pointer">
                  <option value="">所有操作</option>
                  <option value="create">创建</option>
                  <option value="update">更新</option>
                  <option value="delete">删除</option>
                  <option value="export">导出</option>
                  <option value="approve">审批</option>
                </select>
                <Input type="date" className="w-auto rounded-full bg-background/50 border-border/50 transition-all focus:ring-2 focus:ring-primary/20 hover:border-primary/50 cursor-pointer" />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground bg-muted/20 border-b border-border/50">
                <tr>
                  <th className="px-6 py-4 font-medium">操作时间</th>
                  <th className="px-6 py-4 font-medium">操作人</th>
                  <th className="px-6 py-4 font-medium">操作类型</th>
                  <th className="px-6 py-4 font-medium">所属模块</th>
                  <th className="px-6 py-4 font-medium">操作对象</th>
                  <th className="px-6 py-4 font-medium">IP 地址</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {filteredLogs.length > 0 ? (
                  filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-primary/5 transition-colors group">
                      <td className="px-6 py-4 text-muted-foreground font-mono text-xs">{log.time}</td>
                      <td className="px-6 py-4 font-medium text-foreground group-hover:text-primary transition-colors">{log.user}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${
                          log.action.includes('删除') ? 'bg-destructive/10 text-destructive border-destructive/20' :
                          log.action.includes('审批') ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' :
                          log.action.includes('创建') ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20' :
                          'bg-primary/10 text-primary border-primary/20'
                        }`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">{log.module}</td>
                      <td className="px-6 py-4 font-medium font-mono text-xs">{log.target}</td>
                      <td className="px-6 py-4 text-muted-foreground font-mono text-xs opacity-70">{log.ip}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Search className="h-8 w-8 text-muted-foreground/50" />
                        <p>没有找到匹配的日志记录</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between p-4 border-t border-border/50 bg-muted/5 text-sm text-muted-foreground">
            <div>显示 1 到 {filteredLogs.length} 条，共 <span className="font-medium text-foreground">{filteredLogs.length}</span> 条记录</div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled className="rounded-full h-8 w-8 p-0">
                <ChevronLeft className="h-4 w-4" />
                <span className="sr-only">上一页</span>
              </Button>
              <Button variant="outline" size="sm" disabled={filteredLogs.length < 5} className="rounded-full h-8 w-8 p-0">
                <ChevronRight className="h-4 w-4" />
                <span className="sr-only">下一页</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
