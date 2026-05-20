import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card';
import { Badge } from '@/src/components/ui/badge';
import { Button } from '@/src/components/ui/button';
import { AlertCircle, CheckCircle2, Clock, FileText, Plus, Ticket, ArrowRight, Flame, MessageSquare, EyeOff } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useToast } from '@/src/components/ui/use-toast';
import { useTranslation } from 'react-i18next';

const initialHotFeed = [
  {
    id: 'ISS-202605-001',
    author: '王工',
    department: '质量控制部 (上海厂)',
    time: '10 分钟前更新',
    heat: 98,
    title: '[ISS-202605-001] 高铁新型制动盘高温测试异常报警',
    content: '最新进展：8D 第三步（临时围堵措施）已完成并经 SQE 验证。通过修改测试台传感器的校准曲线，报警率显著下降。目前正在进行第四步（根本原因分析），初步怀疑是材料热应力导致的微小形变...',
    progress: 37.5,
    progressLabel: 'D3 完成',
    progressColor: 'bg-primary'
  },
  {
    id: 'ISS-202604-089',
    author: '李经理',
    department: '采购部 (总部)',
    time: '2 小时前更新',
    heat: 85,
    title: '[ISS-202604-089] 供应商 A 批次阀门泄漏率超标',
    content: '最新进展：已启动供应商质量预警机制。供应商 8D 报告初步提交至系统。D2 描述确认泄漏点集中在密封圈接口处。我们已暂停该供应商此物料的入库检验，并安排 SQE 明天前往现场进行过程审核。',
    progress: 25,
    progressLabel: 'D2 完成',
    progressColor: 'bg-orange-500'
  }
];

export function Dashboard() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [hotFeed, setHotFeed] = useState(initialHotFeed);
  const isAdmin = true;

  const handleProcessTask = (taskId: string) => {
    toast({
      title: "任务已接单",
      description: `您已成功开始处理任务 ${taskId}。`,
      variant: "success"
    });
  };

  const handleHideHotIssue = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setHotFeed(prev => prev.filter(issue => issue.id !== id));
    toast({ title: "已隐藏", description: "该问题已从热点问题列表中移除。" });
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-serif text-primary-900 dark:text-primary-100">{t('dashboard.title')}</h1>
          <p className="text-muted-foreground mt-1">{t('dashboard.subtitle')}</p>
        </div>
        <div className="flex gap-3">
          <Link to="/issues/new">
            <Button className="gap-2 rounded shadow-md hover:shadow-lg transition-all">
              <Plus className="h-4 w-4" />
              {t('dashboard.createIssue')}
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="glass-panel hover:shadow-lg transition-all duration-300 border-t-4 border-t-warning group cursor-pointer" onClick={() => navigate('/tasks')}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">{t('dashboard.pendingTasks')}</CardTitle>
            <div className="h-8 w-8 rounded bg-warning/10 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Clock className="h-4 w-4 text-warning" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-light tracking-tight text-foreground">12</div>
            <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
              <span className="text-warning font-medium">3 个逾期</span> 任务需要处理
            </p>
          </CardContent>
        </Card>
        <Card className="glass-panel hover:shadow-lg transition-all duration-300 border-t-4 border-t-primary group cursor-pointer" onClick={() => navigate('/issues')}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">{t('dashboard.activeIssues')}</CardTitle>
            <div className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Ticket className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-light tracking-tight text-foreground">8</div>
            <p className="text-xs text-muted-foreground mt-2">我负责或参与的</p>
          </CardContent>
        </Card>
        <Card className="glass-panel hover:shadow-lg transition-all duration-300 border-t-4 border-t-purple-500 group">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">{t('dashboard.pending8D')}</CardTitle>
            <div className="h-8 w-8 rounded bg-purple-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
              <FileText className="h-4 w-4 text-purple-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-light tracking-tight text-foreground">2</div>
            <p className="text-xs text-muted-foreground mt-2">需要您的审核</p>
          </CardContent>
        </Card>
        <Card className="glass-panel hover:shadow-lg transition-all duration-300 border-t-4 border-t-success group">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">{t('dashboard.resolvedThisMonth')}</CardTitle>
            <div className="h-8 w-8 rounded bg-success/10 flex items-center justify-center group-hover:scale-110 transition-transform">
              <CheckCircle2 className="h-4 w-4 text-success" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-light tracking-tight text-foreground">24</div>
            <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
              <span className="text-success font-medium">+12%</span> 较上月
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-12 lg:grid-cols-2">
        <div className="xl:col-span-5 lg:col-span-1 space-y-6">
          {/* Public Hot Issues Feed Section */}
          <Card className="glass-panel border-t-0 shadow-sm overflow-hidden flex flex-col h-[600px]">
            <CardHeader className="border-b border-border/50 pb-4 bg-muted/20 shrink-0">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Flame className="w-5 h-5 text-destructive" />
                    {t('dashboard.hotIssuesFeed')}
                  </CardTitle>
                  <CardDescription className="mt-1">{t('dashboard.hotIssuesDesc')}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0 flex-1 overflow-y-auto min-h-0 custom-scrollbar">
              <div className="divide-y divide-border/50">
                {hotFeed.length > 0 ? hotFeed.map(issue => (
                  <div key={issue.id} className="p-6 transition-all hover:bg-muted/10 group">
                    <div className="flex items-start gap-4">
                      <div className={`w-10 h-10 rounded ${issue.heat > 90 ? 'bg-primary/20 text-primary' : 'bg-emerald-500/20 text-emerald-600'} flex items-center justify-center font-bold text-sm shrink-0`}>
                        {issue.author[0]}
                      </div>
                      <div className="flex-1 space-y-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="font-semibold text-sm">{issue.author} <span className="font-normal text-muted-foreground ml-1">{issue.department}</span></div>
                            <div className="text-xs text-muted-foreground mt-0.5">{issue.time}</div>
                          </div>
                          <div className="flex items-center gap-2">
                             <Badge variant={issue.heat > 90 ? 'destructive' : 'outline'} className={issue.heat > 90 ? 'bg-red-50 text-red-600 border-red-200' : 'border-orange-200 text-orange-600 bg-orange-50'}>
                               🔥 热度 {issue.heat}%
                             </Badge>
                             {isAdmin && (
                               <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => handleHideHotIssue(e, issue.id)} title="从热点列表中隐藏">
                                  <EyeOff className="h-3.5 w-3.5 text-muted-foreground hover:text-red-500" />
                               </Button>
                             )}
                          </div>
                        </div>
                        
                        <div>
                          <h4 className="font-semibold text-[15px] text-primary-900 dark:text-primary-100 cursor-pointer hover:text-primary transition-colors" onClick={() => navigate(`/issues/${issue.id}`)}>
                            {issue.title}
                          </h4>
                          <p className="text-[13px] mt-1.5 text-foreground/80 leading-relaxed line-clamp-3">
                            {issue.content}
                          </p>
                        </div>
                        
                        <div className="flex items-center gap-2">
                           <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden flex">
                              <div className={`h-full ${issue.progressColor}`} style={{ width: `${issue.progress}%` }}></div>
                           </div>
                           <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">{issue.progressLabel}</span>
                        </div>

                        <div className="flex items-center gap-6 mt-4 pt-2">
                          <button className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors" onClick={() => toast({ title: "关注成功", description: "您将收到针对此问题的最新动态。" })}>
                            <Plus className="w-4 h-4" /> {t('dashboard.follow')}
                          </button>
                          <button className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors" onClick={() => navigate(`/issues/${issue.id}`)}>
                            <MessageSquare className="w-4 h-4" /> {t('dashboard.comment')}
                          </button>
                          <button className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors ml-auto" onClick={() => navigate(`/issues/${issue.id}`)}>
                            {t('dashboard.viewDetails')} <ArrowRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )) : (
                  <div className="p-8 text-center text-muted-foreground text-sm">
                    暂无热门问题
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="xl:col-span-4 lg:col-span-1 space-y-6">
          <Card className="glass-panel border-t-0 shadow-sm flex flex-col h-[600px]">
          <CardHeader className="border-b border-border/50 pb-4 bg-muted/10 shrink-0">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">{t('dashboard.tasksToProcess')}</CardTitle>
                <CardDescription className="mt-1">{t('dashboard.tasksDescription')}</CardDescription>
              </div>
              <Button variant="ghost" size="sm" className="text-primary hover:text-primary-700 hover:bg-primary/5" onClick={() => navigate('/tasks')}>
                {t('dashboard.viewAll')} <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0 flex-1 overflow-y-auto min-h-0 custom-scrollbar">
            <div className="divide-y divide-border/50">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors group">
                  <div className="flex items-start gap-4">
                    <div className="mt-1">
                      {i === 1 ? (
                        <div className="h-8 w-8 rounded bg-destructive/10 flex items-center justify-center">
                          <AlertCircle className="h-4 w-4 text-destructive" />
                        </div>
                      ) : (
                        <div className="h-8 w-8 rounded bg-warning/10 flex items-center justify-center">
                          <Clock className="h-4 w-4 text-warning" />
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium leading-none mb-1.5 group-hover:text-primary transition-colors cursor-pointer" onClick={() => navigate(`/tasks?issueId=ISS-202604-00${i}`)}>
                        确认制动盘表面裂纹原因 (TSK-202604-{i})
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="font-mono cursor-pointer hover:text-primary hover:underline" onClick={() => navigate(`/issues/ISS-202604-00${i}`)}>ISS-202604-00{i}</span>
                        <span>•</span>
                        <span className={i === 1 ? "text-destructive font-medium bg-destructive/10 px-1.5 py-0.5 rounded" : "bg-muted px-1.5 py-0.5 rounded"}>
                          {i === 1 ? "已逾期 2 天" : "今天截止"}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity rounded-full" onClick={() => handleProcessTask(`TSK-202604-${i}`)}>处理</Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        </div>

        <div className="xl:col-span-3 lg:col-span-2 space-y-6">
        <Card className="glass-panel hover:shadow-lg transition-all duration-300 h-[600px] flex flex-col">
          <CardHeader className="border-b border-border/50 pb-4 bg-muted/10 shrink-0">
            <CardTitle className="text-lg font-semibold">{t('dashboard.systemNotices', '系统公告 & 通知')}</CardTitle>
            <CardDescription className="mt-1">{t('dashboard.noticesDescription', '最新消息和流程提醒')}</CardDescription>
          </CardHeader>
          <CardContent className="p-4 flex-1 overflow-y-auto min-h-0 custom-scrollbar">
            <div className="space-y-4">
              <div className="relative overflow-hidden rounded bg-white p-4 border border-l-4 border-l-primary shadow-sm transition-all hover:shadow-md group cursor-pointer">
                <div className="absolute -right-4 -top-4 w-24 h-24 bg-primary/10 rounded-full blur-2xl group-hover:bg-primary/20 transition-colors" />
                <div className="flex items-center gap-2 mb-2 relative z-10">
                  <Badge variant="default" className="bg-primary-600 shadow-sm">系统公告</Badge>
                  <span className="text-xs text-primary-700/70 font-mono">今天 09:00</span>
                </div>
                <p className="text-sm font-semibold text-primary-900 dark:text-primary-100 relative z-10">QConnect 系统升级通知</p>
                <p className="text-xs text-primary-800/80 dark:text-primary-300 mt-1.5 leading-relaxed relative z-10">本周末将进行系统维护，届时将暂停服务2小时，请提前保存您的工作进度...</p>
              </div>
              
              <div className="space-y-1 mt-4">
                {[1, 2].map((i) => (
                  <div key={i} className="flex flex-col gap-1.5 hover:bg-muted/50 p-3 rounded-lg transition-colors cursor-pointer group" onClick={() => navigate(`/issues/ISS-202604-01${i}`)}>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium group-hover:text-primary transition-colors">流程节点提醒</span>
                      <span className="text-xs text-muted-foreground font-mono">2小时前</span>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      问题 <span className="text-foreground font-medium font-mono bg-muted px-1 rounded">ISS-202604-01{i}</span> 已流转至【待确认原因】节点，请及时处理。
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  </div>
  );
}
