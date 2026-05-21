import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/src/components/ui/card';
import { Button } from '@/src/components/ui/button';
import { Badge } from '@/src/components/ui/badge';
import { ArrowLeft, Edit, Users, Search, FileText, MessageSquare, Clock, CheckCircle2, Sparkles, ListTodo, LayoutDashboard, Circle, CheckCircle, CircleDashed, ChevronRight, CalendarDays, ZoomIn, ZoomOut, Download, Calendar, Maximize2, Minimize2, BrainCircuit } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useToast } from '@/src/components/ui/use-toast';
import { HolographicStoryline, StorylineItem } from '../components/HolographicStoryline';
import { Dynamic8DReport } from '../components/Dynamic8DReport';

const mockStoryline: StorylineItem[] = [
  {
    id: '1',
    type: 'system',
    content: '李四 创建了问题单',
    timestamp: '昨天 10:00'
  },
  {
    id: '2',
    type: 'chat',
    sender: '李四',
    avatar: '李',
    content: '已安排现场人员进行数据采集，预计明天上午能拿到初步的硬度测试报告。初步怀疑是同批次闸瓦材质过硬导致。',
    timestamp: '昨天 14:30'
  },
  {
    id: '3',
    type: 'queen_widget',
    sender: 'Queen',
    content: '根据历史知识库，2024年曾发生过类似问题 (ISS-202408-012)。当时的根因是闸瓦供应商更改了配方导致摩擦系数异常。建议重点排查近期闸瓦的入厂检验记录。',
    timestamp: '昨天 14:32'
  },
  {
    id: '4',
    type: 'file',
    content: '硬度测试报告_v1.pdf',
    timestamp: '今天 09:15'
  },
  {
    id: '5',
    type: 'chat',
    sender: '张三',
    avatar: '张',
    content: '@Q 帮我根据目前的测试报告和现场反馈，生成一个鱼骨图分析。',
    timestamp: '今天 09:30'
  },
  {
    id: '6',
    type: 'queen_widget',
    sender: 'Queen',
    content: '好的，我已经为您生成了初步的鱼骨图分析，您可以直接在下方进行拖拽编辑。',
    timestamp: '今天 09:31',
    widgetType: 'fishbone'
  }
];

export function IssueDetails() {
  const navigate = useNavigate();
  const { id } = useParams();
  const issueId = id || 'ISS-202604-001';
  const { toast } = useToast();
  const [comment, setComment] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [is8DReportOpen, setIs8DReportOpen] = useState(false);
  const [isKnowledgeModalOpen, setIsKnowledgeModalOpen] = useState(false);
  const [storylineItems, setStorylineItems] = useState<StorylineItem[]>(mockStoryline);

  const handleResolveIssue = () => {
    toast({
      title: "问题已标记为解决",
      description: "Queen 正在自动提炼知识资产...",
      variant: "default"
    });
    setTimeout(() => {
      setIsKnowledgeModalOpen(true);
    }, 1500);
  };

  const handleSendMessage = (content: string) => {
    const newItem: StorylineItem = {
      id: Date.now().toString(),
      type: 'chat',
      sender: '我',
      avatar: '我',
      content,
      timestamp: '刚刚'
    };
    setStorylineItems(prev => [...prev, newItem]);
    
    // Simulate Queen response if @Q is used
    if (content.includes('@Q')) {
      setTimeout(() => {
        const queenResponse: StorylineItem = {
          id: (Date.now() + 1).toString(),
          type: 'queen_widget',
          sender: 'Queen',
          content: '收到指令。我已经为您创建了相关子任务卡片，并自动分配给了相关负责人。',
          timestamp: '刚刚',
          widgetType: 'task_card',
          widgetData: {
            title: '分析闸瓦材质硬度异常原因',
            assignee: '王五',
            dueDate: '明天 18:00'
          }
        };
        setStorylineItems(prev => [...prev, queenResponse]);
      }, 1000);
    }
  };

  const handleSendComment = () => {
    if (!comment.trim()) return;
    setIsSending(true);
    setTimeout(() => {
      setIsSending(false);
      setComment('');
      toast({
        title: "评论已发送",
        description: "您的讨论记录已成功添加。",
        variant: "success"
      });
    }, 600);
  };

  const d8Steps = [
    { id: 'D0', name: '准备', status: 'done' },
    { id: 'D1', name: '成立团队', status: 'done' },
    { id: 'D2', name: '问题描述', status: 'done' },
    { id: 'D3', name: '临时围堵', status: 'in-progress' },
    { id: 'D4', name: '根本原因', status: 'pending' },
    { id: 'D5', name: '永久纠正', status: 'pending' },
    { id: 'D6', name: '验证措施', status: 'pending' },
    { id: 'D7', name: '预防再发', status: 'pending' },
    { id: 'D8', name: '团队认可', status: 'pending' },
  ];

  // Gantt Chart Logic & Data
  const ganttTasks = [
    { id: 'TSK-001', name: '现场数据采集与拍照', start: '2026-04-08', end: '2026-04-10', progress: 100, status: 'done', assignee: '王工程师', phase: 'D2' },
    { id: 'TSK-005', name: '制定临时围堵措施', start: '2026-04-09', end: '2026-04-11', progress: 100, status: 'done', assignee: '李四', phase: 'D3' },
    { id: 'TSK-002', name: '材料硬度测试分析', start: '2026-04-10', end: '2026-04-14', progress: 60, status: 'in-progress', assignee: '李研究员', phase: 'D4' },
    { id: 'TSK-003', name: '空压机异响音频分析', start: '2026-04-13', end: '2026-04-15', progress: 0, status: 'pending', assignee: '张三', phase: 'D4' },
    { id: 'TSK-004', name: '控制阀密封圈材质确认', start: '2026-04-14', end: '2026-04-18', progress: 0, status: 'pending', assignee: '赵六', phase: 'D4' },
  ];

  const DAY_WIDTH = 40;
  const timelineStart = new Date('2026-04-05T00:00:00');
  const timelineEnd = new Date('2026-04-22T00:00:00');
  const today = new Date('2026-04-12T00:00:00');

  const getDaysDiff = (start: Date, end: Date) => Math.round((end.getTime() - start.getTime()) / (1000 * 3600 * 24));

  const days: Date[] = [];
  let currentDate = new Date(timelineStart);
  while (currentDate <= timelineEnd) {
    days.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }

  const months: { label: string; count: number }[] = [];
  let currentMonth = -1;
  days.forEach(d => {
    if (d.getMonth() !== currentMonth) {
      months.push({ label: `${d.getFullYear()}年${d.getMonth() + 1}月`, count: 1 });
      currentMonth = d.getMonth();
    } else {
      months[months.length - 1].count++;
    }
  });

  const [maximizedCard, setMaximizedCard] = useState<'gantt' | 'comments' | null>(null);

  return (
    <div className="flex flex-col gap-8 relative">
      {maximizedCard && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40" onClick={() => setMaximizedCard(null)} />
      )}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full hover:bg-muted">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-3xl font-bold tracking-tight font-serif text-primary-900 dark:text-primary-100">制动盘表面出现异常磨损</h1>
              <Badge variant="warning" className="shadow-sm">处理中</Badge>
              <Badge variant="outline" className="font-mono shadow-sm">{issueId}</Badge>
            </div>
            <p className="text-muted-foreground text-sm">由 <span className="font-medium text-foreground">张三</span> 创建于 <span className="font-mono">2026-04-10 09:30</span></p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="gap-2 rounded-full border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100 dark:border-purple-800 dark:bg-purple-900/30 dark:text-purple-300 transition-colors" onClick={() => setIs8DReportOpen(true)}>
            <FileText className="h-4 w-4" />
            动态 8D 报告
            <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-[10px] bg-purple-200 text-purple-800 dark:bg-purple-800 dark:text-purple-100">伴写中</Badge>
          </Button>
          <Button variant="outline" className="gap-2 rounded-full hover:bg-primary/5 hover:text-primary transition-colors" onClick={() => toast({ title: "进入编辑模式" })}>
            <Edit className="h-4 w-4" />
            编辑
          </Button>
          <Button className="gap-2 rounded-full shadow-md hover:shadow-lg transition-all" onClick={handleResolveIssue}>
            <CheckCircle2 className="h-4 w-4" />
            标记解决
          </Button>
        </div>
      </div>

      {/* Issue Workspace Navigation */}
      <div className="flex items-center gap-1 border-b border-border/50 pb-px -mt-2">
        <Link to={`/issues/${issueId}`} className="flex items-center gap-2 px-6 py-3 border-b-2 border-primary text-primary font-medium transition-colors bg-primary/5 rounded-t-lg">
          <LayoutDashboard className="h-4 w-4" />
          问题总览
        </Link>
        <Link to={`/tasks?issueId=${issueId}`} className="flex items-center gap-2 px-6 py-3 border-b-2 border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors rounded-t-lg">
          <ListTodo className="h-4 w-4" />
          子任务管理
        </Link>
        <Link to={`/rca/${issueId}`} className="flex items-center gap-2 px-6 py-3 border-b-2 border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors rounded-t-lg">
          <Search className="h-4 w-4" />
          根因分析工具箱
        </Link>
        <Link to={`/8d-reports/${issueId}`} className="flex items-center gap-2 px-6 py-3 border-b-2 border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors rounded-t-lg">
          <FileText className="h-4 w-4" />
          8D 报告
        </Link>
      </div>

      {/* 8D Report Progress Overview */}
      <Card className="glass-panel border-primary/20 bg-gradient-to-r from-primary/5 via-transparent to-transparent">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              8D 报告脉络进度
            </CardTitle>
            <Link to={`/8d-reports/${issueId}`}>
              <Button variant="ghost" size="sm" className="text-primary hover:bg-primary/10 rounded-full gap-1">
                查看完整报告 <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mt-4 overflow-x-auto pb-2 scrollbar-hide">
            {d8Steps.map((step, index) => (
              <div key={step.id} className="flex flex-col items-center min-w-[80px] relative group">
                {/* Connecting Line */}
                {index < d8Steps.length - 1 && (
                  <div className={`absolute top-4 left-[50%] w-full h-[2px] ${
                    step.status === 'done' ? 'bg-primary' : 'bg-border'
                  }`} />
                )}
                
                {/* Icon */}
                <div className={`relative z-10 flex items-center justify-center h-8 w-8 rounded-full bg-background border-2 transition-colors ${
                  step.status === 'done' ? 'border-primary text-primary' :
                  step.status === 'in-progress' ? 'border-warning text-warning ring-4 ring-warning/20' :
                  'border-muted-foreground/30 text-muted-foreground/50'
                }`}>
                  {step.status === 'done' ? <CheckCircle className="h-4 w-4" /> :
                   step.status === 'in-progress' ? <CircleDashed className="h-4 w-4 animate-spin-slow" /> :
                   <Circle className="h-4 w-4" />}
                </div>
                
                {/* Label */}
                <div className="mt-3 text-center">
                  <div className={`text-xs font-bold ${
                    step.status === 'done' ? 'text-primary' :
                    step.status === 'in-progress' ? 'text-warning' :
                    'text-muted-foreground'
                  }`}>{step.id}</div>
                  <div className="text-[10px] text-muted-foreground mt-0.5 whitespace-nowrap">{step.name}</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          <Card className="glass-panel hover:shadow-lg transition-all duration-300">
            <CardHeader className="border-b border-border/50 pb-4">
              <CardTitle className="text-lg">问题描述</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="prose prose-sm max-w-none dark:prose-invert text-muted-foreground leading-relaxed">
                <p>客户反馈在近期交付的列车上，发现部分制动盘表面存在异常的划痕和磨损现象。经过初步检查，磨损深度约为 0.5mm，分布不均匀。</p>
                <p><strong className="text-foreground">发生条件：</strong> 运行里程约 5000km 后发现。</p>
                <p><strong className="text-foreground">影响范围：</strong> 目前已发现 3 列车存在类似问题。</p>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-6 border-t border-border/50">
                <div>
                  <div className="text-xs text-muted-foreground mb-1.5 uppercase tracking-wider">分类</div>
                  <div className="font-medium">质量投诉</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1.5 uppercase tracking-wider">产品</div>
                  <div className="font-medium">制动盘 (BRK-D-100)</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1.5 uppercase tracking-wider">严重程度</div>
                  <div className="font-medium text-warning flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-warning"></span>
                    高 - 影响行车安全
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1.5 uppercase tracking-wider">客户信息</div>
                  <div className="font-medium">北京地铁 16 号线</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Advanced Gantt Chart Section */}
          <Card className={`glass-panel transition-all duration-300 overflow-hidden flex flex-col ${maximizedCard === 'gantt' ? 'fixed inset-4 z-50 shadow-2xl bg-background' : 'hover:shadow-lg'}`}>
            <CardHeader className="flex flex-row items-center justify-between border-b border-border/50 pb-4 bg-muted/5 shrink-0">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <CalendarDays className="h-5 w-5 text-primary" />
                  子任务进度规划 (Gantt)
                </CardTitle>
                <CardDescription className="mt-1">全局掌控任务排期、进度与依赖关系</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <div className="hidden md:flex items-center bg-background border border-border/50 rounded-md p-1 shadow-sm mr-2">
                  <Button variant="ghost" size="sm" className="h-7 px-2 text-xs"><ZoomOut className="h-3 w-3 mr-1"/>缩小</Button>
                  <Button variant="ghost" size="sm" className="h-7 px-2 text-xs"><ZoomIn className="h-3 w-3 mr-1"/>放大</Button>
                  <div className="w-px h-4 bg-border mx-1"></div>
                  <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-primary"><Calendar className="h-3 w-3 mr-1"/>今天</Button>
                </div>
                <Button variant="outline" size="sm" className="rounded-full hover:bg-primary/5 hover:text-primary transition-colors hidden sm:flex">
                  <Download className="h-4 w-4 mr-1" /> 导出
                </Button>
                <Link to={`/tasks?issueId=${issueId}`}>
                  <Button size="sm" className="rounded-full shadow-sm">管理子任务</Button>
                </Link>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full ml-2" onClick={() => setMaximizedCard(maximizedCard === 'gantt' ? null : 'gantt')}>
                  {maximizedCard === 'gantt' ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0 flex flex-col flex-1 overflow-hidden">
              {/* Gantt Container */}
              <div className="flex flex-row w-full border-b border-border/50 bg-background overflow-hidden flex-1">
                {/* Left Panel: Task List */}
                <div className="w-[280px] md:w-[380px] shrink-0 border-r border-border/50 flex flex-col z-20 bg-background shadow-[4px_0_12px_rgba(0,0,0,0.02)] overflow-y-auto">
                  {/* Header */}
                  <div className="h-14 border-b border-border/50 flex items-center bg-muted/10">
                    <div className="w-[160px] md:w-[200px] px-4 font-medium text-xs text-muted-foreground uppercase tracking-wider">任务名称</div>
                    <div className="w-[70px] md:w-[80px] px-2 font-medium text-xs text-muted-foreground uppercase tracking-wider">负责人</div>
                    <div className="w-[50px] md:w-[100px] px-2 font-medium text-xs text-muted-foreground uppercase tracking-wider">状态</div>
                  </div>
                  {/* Rows */}
                  {ganttTasks.map(task => (
                    <div key={task.id} className="h-12 border-b border-border/50 flex items-center hover:bg-muted/30 transition-colors group cursor-pointer" onClick={() => navigate(`/tasks?issueId=${issueId}`)}>
                      <div className="w-[160px] md:w-[200px] px-4 truncate">
                        <div className="text-sm font-medium text-foreground group-hover:text-primary transition-colors truncate" title={task.name}>{task.name}</div>
                        <div className="text-[10px] text-muted-foreground font-mono hidden md:block">{task.start} ~ {task.end}</div>
                      </div>
                      <div className="w-[70px] md:w-[80px] px-2">
                        <div className="flex items-center gap-1.5">
                          <div className="h-5 w-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold shrink-0">
                            {task.assignee.charAt(0)}
                          </div>
                          <span className="text-xs truncate hidden md:inline">{task.assignee}</span>
                        </div>
                      </div>
                      <div className="w-[50px] md:w-[100px] px-2">
                        {task.status === 'done' && <Badge variant="success" className="text-[10px] h-5 px-1.5 shadow-none">已完成</Badge>}
                        {task.status === 'in-progress' && <Badge variant="default" className="text-[10px] h-5 px-1.5 shadow-none bg-blue-500 hover:bg-blue-600">处理中</Badge>}
                        {task.status === 'pending' && <Badge variant="secondary" className="text-[10px] h-5 px-1.5 shadow-none">未开始</Badge>}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Right Panel: Timeline */}
                <div className="flex-1 overflow-x-auto overflow-y-auto bg-muted/5 relative">
                  <div style={{ width: `${days.length * DAY_WIDTH}px` }} className="relative min-h-full flex flex-col">
                    {/* Months Header */}
                    <div className="h-7 border-b border-border/50 flex bg-muted/10 sticky top-0 z-10">
                      {months.map((m, i) => (
                        <div key={i} style={{ width: `${m.count * DAY_WIDTH}px` }} className="border-r border-border/50 flex items-center justify-center text-xs font-medium text-muted-foreground">
                          {m.label}
                        </div>
                      ))}
                    </div>
                    {/* Days Header */}
                    <div className="h-7 border-b border-border/50 flex bg-muted/10 sticky top-7 z-10">
                      {days.map((d, i) => {
                        const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                        const isToday = d.getTime() === today.getTime();
                        return (
                          <div key={i} style={{ width: `${DAY_WIDTH}px` }} className={`border-r border-border/50 flex items-center justify-center text-xs ${isWeekend ? 'bg-muted/30 text-muted-foreground/50' : 'text-muted-foreground'} ${isToday ? 'bg-primary/10 text-primary font-bold' : ''}`}>
                            {d.getDate()}
                          </div>
                        );
                      })}
                    </div>

                    {/* Grid Background (Vertical Lines) */}
                    <div className="absolute top-14 bottom-0 left-0 right-0 flex pointer-events-none z-0">
                      {days.map((d, i) => {
                        const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                        return (
                          <div key={i} style={{ width: `${DAY_WIDTH}px` }} className={`border-r border-border/30 h-full ${isWeekend ? 'bg-muted/20' : ''}`}></div>
                        );
                      })}
                    </div>

                    {/* Today Line */}
                    <div 
                      className="absolute top-14 bottom-0 w-px bg-red-500/50 z-10 pointer-events-none"
                      style={{ left: `${getDaysDiff(timelineStart, today) * DAY_WIDTH + (DAY_WIDTH / 2)}px` }}
                    >
                      <div className="absolute -top-1 -translate-x-1/2 w-2 h-2 rounded-full bg-red-500"></div>
                    </div>

                    {/* Task Rows */}
                    <div className="relative z-10 flex flex-col">
                      {ganttTasks.map((task, index) => {
                        const taskStart = new Date(task.start + 'T00:00:00');
                        const taskEnd = new Date(task.end + 'T00:00:00');
                        const leftOffset = getDaysDiff(timelineStart, taskStart) * DAY_WIDTH;
                        const width = (getDaysDiff(taskStart, taskEnd) + 1) * DAY_WIDTH;
                        
                        const barColor = task.status === 'done' ? 'bg-emerald-500' : task.status === 'in-progress' ? 'bg-blue-500' : 'bg-slate-400';
                        
                        return (
                          <div key={task.id} className="h-12 border-b border-border/50 relative group">
                            {/* Task Bar */}
                            <div 
                              className={`absolute top-2.5 bottom-2.5 rounded-md shadow-sm overflow-hidden cursor-pointer hover:shadow-md hover:ring-2 ring-primary/50 transition-all ${barColor}`}
                              style={{ left: `${leftOffset}px`, width: `${width}px` }}
                              onClick={() => navigate(`/tasks?issueId=${issueId}`)}
                            >
                              {/* Progress Fill */}
                              <div className="h-full bg-white/25" style={{ width: `${task.progress}%` }}></div>
                              
                              {/* Text inside bar if it fits, else hide */}
                              {width > 60 && (
                                <div className="absolute inset-0 flex items-center px-2 text-[10px] font-medium text-white truncate drop-shadow-sm">
                                  {task.progress}%
                                </div>
                              )}
                            </div>

                            {/* Tooltip on hover */}
                            <div className="hidden group-hover:block absolute top-10 z-50 bg-popover text-popover-foreground text-xs rounded-lg shadow-xl border border-border p-3 w-64 pointer-events-none"
                                 style={{ left: `${leftOffset + (width/2)}px`, transform: 'translateX(-50%)' }}>
                              <div className="font-bold mb-1">{task.name}</div>
                              <div className="grid grid-cols-2 gap-2 mt-2">
                                <div className="text-muted-foreground">负责人:</div><div>{task.assignee}</div>
                                <div className="text-muted-foreground">阶段:</div><div>{task.phase}</div>
                                <div className="text-muted-foreground">时间:</div><div>{task.start} 至 {task.end}</div>
                                <div className="text-muted-foreground">进度:</div><div>{task.progress}%</div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className={`glass-panel transition-all duration-300 flex flex-col ${maximizedCard === 'comments' ? 'fixed inset-4 z-50 shadow-2xl bg-background' : 'hover:shadow-lg h-[600px]'}`}>
            <CardHeader className="border-b border-border/50 pb-4 flex flex-row items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <CardTitle className="text-lg">全息信息故事线</CardTitle>
                <Badge variant="secondary" className="px-1.5 py-0 text-[10px] bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 flex items-center gap-1">
                  <BrainCircuit className="w-3 h-3" /> Queen 伴随
                </Badge>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => setMaximizedCard(maximizedCard === 'comments' ? null : 'comments')}>
                {maximizedCard === 'comments' ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </Button>
            </CardHeader>
            <CardContent className="pt-6 flex flex-col flex-1 overflow-hidden">
              <HolographicStoryline items={storylineItems} onSendMessage={handleSendMessage} />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="glass-panel hover:shadow-lg transition-all duration-300">
            <CardHeader className="border-b border-border/50 pb-4">
              <CardTitle className="text-lg">处理团队</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-center justify-between hover:bg-muted/50 p-3 rounded-xl transition-colors cursor-pointer group border border-transparent hover:border-border/50">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center text-primary-700 shadow-sm border border-primary/10 font-medium">李</div>
                  <div>
                    <div className="text-sm font-medium group-hover:text-primary transition-colors">李四</div>
                    <div className="text-xs text-muted-foreground mt-0.5">问题负责人</div>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between hover:bg-muted/50 p-3 rounded-xl transition-colors cursor-pointer group border border-transparent hover:border-border/50">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center font-medium shadow-sm border border-border/50">王</div>
                  <div>
                    <div className="text-sm font-medium group-hover:text-primary transition-colors">王工程师</div>
                    <div className="text-xs text-muted-foreground mt-0.5">现场支持</div>
                  </div>
                </div>
              </div>
              <Button variant="outline" className="w-full gap-2 mt-4 rounded-xl border-dashed hover:border-primary/50 hover:bg-primary/5 hover:text-primary transition-all" onClick={() => toast({ title: "管理团队", description: "正在打开团队管理面板..." })}>
                <Users className="h-4 w-4" />
                管理团队
              </Button>
            </CardContent>
          </Card>

          <Card className="glass-panel hover:shadow-lg transition-all duration-300">
            <CardHeader className="border-b border-border/50 pb-4">
              <CardTitle className="text-lg">快捷操作</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-2">
              <Link to={`/rca/${issueId}`} className="flex items-center gap-3 p-3 hover:bg-muted/50 rounded-xl transition-colors group border border-transparent hover:border-border/50">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Search className="h-4 w-4 text-primary" />
                </div>
                <span className="text-sm font-medium group-hover:text-primary transition-colors">根因分析工具箱</span>
              </Link>
              <Link to={`/8d-reports/${issueId}`} className="flex items-center gap-3 p-3 hover:bg-muted/50 rounded-xl transition-colors group border border-transparent hover:border-border/50">
                <div className="h-8 w-8 rounded-full bg-purple-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <FileText className="h-4 w-4 text-purple-500" />
                </div>
                <span className="text-sm font-medium group-hover:text-purple-600 transition-colors">8D 报告 (草稿)</span>
              </Link>
              <Link to="/ai-assistant" className="flex items-center gap-3 p-3 hover:bg-muted/50 rounded-xl transition-colors cursor-pointer group border border-transparent hover:border-border/50">
                <div className="h-8 w-8 rounded-full bg-blue-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <MessageSquare className="h-4 w-4 text-blue-500" />
                </div>
                <span className="text-sm font-medium group-hover:text-blue-600 transition-colors">向 AI 助手提问</span>
              </Link>
            </CardContent>
          </Card>

          <Card className="glass-panel hover:shadow-lg transition-all duration-300">
            <CardHeader className="border-b border-border/50 pb-4">
              <CardTitle className="text-lg">流程时间线</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="relative border-l-2 border-muted ml-4 space-y-8">
                <div className="relative pl-6 group">
                  <div className="absolute -left-[9px] top-1.5 h-4 w-4 rounded-full bg-primary ring-4 ring-card group-hover:scale-125 transition-transform shadow-sm"></div>
                  <div className="text-sm font-medium text-primary">处理中</div>
                  <div className="text-xs text-muted-foreground mt-1">当前阶段</div>
                </div>
                <div className="relative pl-6 group">
                  <div className="absolute -left-[9px] top-1.5 h-4 w-4 rounded-full bg-muted ring-4 ring-card border-2 border-background group-hover:border-primary/50 transition-colors"></div>
                  <div className="text-sm font-medium">已受理</div>
                  <div className="text-xs text-muted-foreground mt-1">李四 - <span className="font-mono">2026-04-10 10:15</span></div>
                </div>
                <div className="relative pl-6 group">
                  <div className="absolute -left-[9px] top-1.5 h-4 w-4 rounded-full bg-muted ring-4 ring-card border-2 border-background group-hover:border-primary/50 transition-colors"></div>
                  <div className="text-sm font-medium">已提交</div>
                  <div className="text-xs text-muted-foreground mt-1">张三 - <span className="font-mono">2026-04-10 09:30</span></div>
                </div>
              </div>
              <Button variant="ghost" className="w-full mt-6 text-xs text-muted-foreground hover:text-primary rounded-xl" onClick={() => toast({ title: "完整时间线", description: "正在加载完整历史记录..." })}>查看完整时间线</Button>
            </CardContent>
          </Card>
        </div>
      </div>
      <Dynamic8DReport isOpen={is8DReportOpen} onClose={() => setIs8DReportOpen(false)} />

      {/* Knowledge Crystallization Modal */}
      {isKnowledgeModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="w-full max-w-2xl bg-background border border-border/50 rounded-2xl shadow-2xl overflow-hidden"
          >
            <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 h-1.5 w-full" />
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-xl text-purple-600 dark:text-purple-400">
                    <BrainCircuit className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">无感经验结晶完成</h2>
                    <p className="text-sm text-muted-foreground">Queen 已自动提炼本次排故经验，生成标准排查指南</p>
                  </div>
                </div>
              </div>

              <Card className="bg-muted/30 border-dashed border-2 mb-6">
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center justify-between border-b pb-2">
                    <h3 className="font-semibold text-lg">闸瓦材质硬度异常排查指南</h3>
                    <Badge variant="outline" className="bg-background">领域: 制动系统</Badge>
                  </div>
                  <div className="space-y-3 text-sm">
                    <div>
                      <span className="font-medium text-muted-foreground">核心故障模式:</span>
                      <p className="mt-1">同批次闸瓦材质过硬导致制动盘异常磨损</p>
                    </div>
                    <div>
                      <span className="font-medium text-muted-foreground">关键排查步骤:</span>
                      <ul className="list-disc list-inside mt-1 space-y-1">
                        <li>核对异常闸瓦的批次号及供应商信息。</li>
                        <li>调取入厂检验记录，重点复核硬度测试数据。</li>
                        <li>若硬度超标，立即隔离同批次库存并启动召回。</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-end gap-3">
                <Button variant="ghost" onClick={() => setIsKnowledgeModalOpen(false)}>暂不入库</Button>
                <Button className="gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white" onClick={() => {
                  toast({ title: "知识资产已沉淀", description: "已推送给 Domain Owner 审核入库。", variant: "success" });
                  setIsKnowledgeModalOpen(false);
                }}>
                  <Sparkles className="w-4 h-4" />
                  确认入库并推送审核
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
