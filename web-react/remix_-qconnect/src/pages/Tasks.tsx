import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/src/components/ui/card';
import { Input } from '@/src/components/ui/input';
import { Button } from '@/src/components/ui/button';
import { Badge } from '@/src/components/ui/badge';
import { Search, Filter, Plus, Clock, CheckCircle2, AlertCircle, ArrowLeft, LayoutDashboard, ListTodo, FileText, Edit, MessageSquare, Calendar, User, AlignLeft, Tag, Layers, UploadCloud, Save, Send, CornerUpLeft, Check, X, Paperclip, Trash2, Archive, RotateCcw, FileX } from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useToast } from '@/src/components/ui/use-toast';

type TaskApprovalStatus = '草稿' | '处理中' | '待审核' | '已完成' | '已驳回';
type TaskPriority = '高' | '中' | '低';

interface TaskComment {
  id: string;
  author: string;
  text: string;
  time: string;
  type: 'comment' | 'system';
}

interface TaskAttachment {
  id: string;
  name: string;
  size: string;
}

interface Task {
  id: string;
  issueId: string;
  title: string;
  description: string;
  assignee: string;
  status: TaskApprovalStatus;
  priority: TaskPriority;
  phase: string;
  startDate: string;
  deadline: string;
  comments: TaskComment[];
  attachments: TaskAttachment[];
  isArchived?: boolean;
  isDeleted?: boolean;
}

const initialTasks: Task[] = [
  { id: 'TSK-202604-001', issueId: 'ISS-202604-001', title: '现场数据采集与拍照', description: '前往现场对异常制动盘进行拍照和数据采集，重点关注磨损区域的深度和分布。', assignee: '王工程师', status: '已完成', priority: '高', phase: 'D2', startDate: '2026-04-08', deadline: '2026-04-10', attachments: [{ id: 'a1', name: '现场照片.zip', size: '12.5 MB' }], comments: [{ id: 'c1', author: '王工程师', text: '已完成现场采集，照片已上传至附件库。', time: '2026-04-10 14:00', type: 'comment' }, { id: 's1', author: '系统', text: '任务已通过审核并完成', time: '2026-04-10 15:30', type: 'system' }], isArchived: false, isDeleted: false },
  { id: 'TSK-202604-002', issueId: 'ISS-202604-001', title: '材料硬度测试分析', description: '对采集回来的制动盘样本和同批次闸瓦进行硬度测试，对比设计标准。', assignee: '李研究员', status: '处理中', priority: '高', phase: 'D4', startDate: '2026-04-10', deadline: '2026-04-12', attachments: [], comments: [{ id: 'c2', author: '李研究员', text: '测试设备已校准，正在进行第一批样本测试。', time: '2026-04-11 09:30', type: 'comment' }], isArchived: false, isDeleted: false },
  { id: 'TSK-202604-005', issueId: 'ISS-202604-001', title: '制定临时围堵措施 (ICA)', description: '针对目前已发现问题的列车，制定临时的安全围堵措施，防止问题扩大。', assignee: '李四', status: '草稿', priority: '中', phase: 'D3', startDate: '2026-04-11', deadline: '2026-04-13', attachments: [], comments: [], isArchived: false, isDeleted: false },
  { id: 'TSK-202604-003', issueId: 'ISS-202604-002', title: '空压机异响音频分析', description: '分析现场录制的空压机异响音频，提取特征频率。', assignee: '张三', status: '待审核', priority: '中', phase: 'D4', startDate: '2026-04-12', deadline: '2026-04-13', attachments: [{ id: 'a2', name: '分析报告_v1.pdf', size: '2.1 MB' }], comments: [{ id: 's2', author: '系统', text: '张三 提交了任务审核', time: '2026-04-12 10:00', type: 'system' }], isArchived: false, isDeleted: false },
];

export function Tasks() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const issueId = searchParams.get('issueId');
  
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'my' | 'pending'>('all');
  const [viewMode, setViewMode] = useState<'active' | 'archived' | 'deleted'>('active');
  
  // View State: 'list' | 'detail' | 'create'
  const [currentView, setCurrentView] = useState<'list' | 'detail' | 'create'>('list');
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  
  // Form State
  const [formData, setFormData] = useState<Partial<Task>>({});
  const [newComment, setNewComment] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentUser = '李四'; // Mock current user
  const isManager = true; // Mock role for approval

  const handleOpenCreate = () => {
    setFormData({
      issueId: issueId || '',
      title: '',
      description: '',
      assignee: currentUser,
      status: '草稿',
      priority: '中',
      phase: 'D0',
      startDate: new Date().toISOString().split('T')[0],
      deadline: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
      attachments: [],
      comments: []
    });
    setCurrentView('create');
  };

  const handleOpenDetail = (task: Task) => {
    setActiveTask(task);
    setFormData(task);
    setCurrentView('detail');
  };

  const handleBackToList = () => {
    setCurrentView('list');
    setActiveTask(null);
  };

  const handleSaveDraft = () => {
    if (!formData.title) {
      toast({ title: "验证失败", description: "请至少填写任务标题", variant: "destructive" });
      return;
    }
    saveTaskData('草稿', "草稿已保存");
  };

  const handleSubmitProcess = () => {
    if (!formData.title || !formData.assignee) {
      toast({ title: "验证失败", description: "请填写必填字段", variant: "destructive" });
      return;
    }
    saveTaskData('处理中', "任务已提交处理");
  };

  const handleSubmitReview = () => {
    saveTaskData('待审核', "任务已提交审核", "提交了任务审核");
  };

  const handleWithdraw = () => {
    saveTaskData('处理中', "任务已撤回", "撤回了审核请求");
  };

  const handleApprove = () => {
    saveTaskData('已完成', "任务已通过审核", "通过了审核");
  };

  const handleReject = () => {
    saveTaskData('已驳回', "任务已被驳回", "驳回了该任务");
  };

  const saveTaskData = (newStatus: TaskApprovalStatus, toastMsg: string, systemLog?: string) => {
    const updatedTaskData = { ...formData, status: newStatus } as Task;
    
    if (systemLog) {
      updatedTaskData.comments = [
        ...(updatedTaskData.comments || []), 
        { id: `s${Date.now()}`, author: '系统', text: `${currentUser} ${systemLog}`, time: new Date().toLocaleString(), type: 'system' }
      ];
    }

    if (currentView === 'create') {
      const newTask: Task = {
        ...updatedTaskData,
        id: `TSK-202604-${String(tasks.length + 1).padStart(3, '0')}`,
      };
      setTasks([newTask, ...tasks]);
      setActiveTask(newTask);
      setFormData(newTask);
      setCurrentView('detail');
    } else {
      setTasks(tasks.map(t => t.id === updatedTaskData.id ? updatedTaskData : t));
      setActiveTask(updatedTaskData);
      setFormData(updatedTaskData);
    }
    toast({ title: "操作成功", description: toastMsg, variant: "success" });
  };

  const handleAddComment = () => {
    if (!newComment.trim() || !activeTask) return;
    const comment: TaskComment = {
      id: `c${Date.now()}`,
      author: currentUser,
      text: newComment,
      time: new Date().toLocaleString(),
      type: 'comment'
    };
    const updatedTask = { ...activeTask, comments: [...activeTask.comments, comment] };
    setTasks(tasks.map(t => t.id === activeTask.id ? updatedTask : t));
    setActiveTask(updatedTask);
    setFormData(updatedTask);
    setNewComment('');
    toast({ title: "评论已添加", variant: "success" });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setIsUploading(true);
      const file = e.target.files[0];
      setTimeout(() => {
        const newAttachment: TaskAttachment = {
          id: `a${Date.now()}`,
          name: file.name,
          size: `${(file.size / 1024 / 1024).toFixed(2)} MB`
        };
        const updatedAttachments = [...(formData.attachments || []), newAttachment];
        setFormData({ ...formData, attachments: updatedAttachments });
        setIsUploading(false);
        toast({ title: "上传成功", description: `${file.name} 已上传`, variant: "success" });
      }, 1000);
    }
  };

  const removeAttachment = (id: string) => {
    setFormData({
      ...formData,
      attachments: formData.attachments?.filter(a => a.id !== id)
    });
  };

  const handleArchive = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setTasks(prev => prev.map(t => t.id === id ? { ...t, isArchived: true } : t));
    toast({ title: "已归档", description: "任务已移至归档库" });
  };

  const handleRestoreArchive = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setTasks(prev => prev.map(t => t.id === id ? { ...t, isArchived: false } : t));
    toast({ title: "已恢复", description: "任务已从归档库恢复" });
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setTasks(prev => prev.map(t => t.id === id ? { ...t, isDeleted: true } : t));
    toast({ title: "已删除", description: "任务已移至回收站", variant: "destructive" });
  };

  const handleRestoreDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setTasks(prev => prev.map(t => t.id === id ? { ...t, isDeleted: false } : t));
    toast({ title: "已恢复", description: "任务已从回收站恢复" });
  };

  const filteredTasks = tasks.filter(task => {
    const matchesIssue = issueId ? task.issueId === issueId : true;
    const matchesSearch = task.title.includes(searchQuery) || task.id.includes(searchQuery) || task.issueId.includes(searchQuery);
    const matchesFilter = 
      filterStatus === 'all' ? true :
      filterStatus === 'my' ? task.assignee === currentUser :
      filterStatus === 'pending' ? task.status !== '已完成' : true;
    
    let matchesView = false;
    if (viewMode === 'deleted') matchesView = !!task.isDeleted;
    else if (viewMode === 'archived') matchesView = !!task.isArchived && !task.isDeleted;
    else matchesView = !task.isArchived && !task.isDeleted;

    return matchesIssue && matchesSearch && matchesFilter && matchesView;
  });

  const getStatusBadge = (status: TaskApprovalStatus) => {
    switch (status) {
      case '已完成': return <Badge variant="success" className="shadow-sm"><CheckCircle2 className="w-3 h-3 mr-1"/>已完成</Badge>;
      case '待审核': return <Badge variant="warning" className="shadow-sm"><Clock className="w-3 h-3 mr-1"/>待审核</Badge>;
      case '处理中': return <Badge variant="default" className="shadow-sm"><Clock className="w-3 h-3 mr-1"/>处理中</Badge>;
      case '已驳回': return <Badge variant="destructive" className="shadow-sm"><AlertCircle className="w-3 h-3 mr-1"/>已驳回</Badge>;
      default: return <Badge variant="secondary" className="shadow-sm">草稿</Badge>;
    }
  };

  if (currentView === 'detail' || currentView === 'create') {
    const isEditing = formData.status === '草稿' || formData.status === '处理中' || formData.status === '已驳回';
    
    return (
      <div className="flex flex-col gap-6 max-w-5xl mx-auto pb-12 animate-in fade-in duration-300">
        {/* Header Actions */}
        <div className="flex items-center justify-between bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl p-4 border-b border-border/50 shadow-sm sticky top-0 z-[100] -mx-4 px-4 sm:-mx-8 sm:px-8 -mt-6 pt-6 sm:-mt-8 sm:pt-8">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={handleBackToList} className="rounded-full hover:bg-muted">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-bold text-foreground">
                  {currentView === 'create' ? '新建子任务' : formData.id}
                </h1>
                {currentView !== 'create' && getStatusBadge(formData.status as TaskApprovalStatus)}
              </div>
              {currentView !== 'create' && <p className="text-sm text-muted-foreground mt-0.5">关联问题: {formData.issueId}</p>}
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {formData.status === '草稿' && (
              <>
                <Button variant="outline" className="rounded-full gap-2" onClick={handleSaveDraft}><Save className="h-4 w-4"/>暂存草稿</Button>
                <Button className="rounded-full gap-2 shadow-md" onClick={handleSubmitProcess}><Send className="h-4 w-4"/>提交处理</Button>
              </>
            )}
            {(formData.status === '处理中' || formData.status === '已驳回') && (
              <>
                <Button variant="outline" className="rounded-full gap-2" onClick={handleSaveDraft}><Save className="h-4 w-4"/>保存修改</Button>
                <Button className="rounded-full gap-2 shadow-md" onClick={handleSubmitReview}><CheckCircle2 className="h-4 w-4"/>提交审核</Button>
              </>
            )}
            {formData.status === '待审核' && (
              <>
                <Button variant="outline" className="rounded-full gap-2" onClick={handleWithdraw}><CornerUpLeft className="h-4 w-4"/>撤回</Button>
                {isManager && (
                  <>
                    <Button variant="destructive" className="rounded-full gap-2" onClick={handleReject}><X className="h-4 w-4"/>驳回</Button>
                    <Button className="rounded-full gap-2 shadow-md bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handleApprove}><Check className="h-4 w-4"/>通过审核</Button>
                  </>
                )}
              </>
            )}
            {formData.status === '已完成' && (
              <Button variant="outline" className="rounded-full gap-2" onClick={() => saveTaskData('处理中', "任务已重新打开", "重新打开了任务")}><CornerUpLeft className="h-4 w-4"/>重新打开</Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6">
          {/* Left Column: Main Content */}
          <div className="col-span-2 space-y-6">
            <Card className="glass-panel shadow-sm">
              <CardHeader className="border-b border-border/50 pb-4">
                <CardTitle className="text-lg flex items-center gap-2"><AlignLeft className="h-5 w-5 text-primary"/> 任务详情</CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium">任务标题 <span className="text-destructive">*</span></label>
                  {isEditing ? (
                    <Input value={formData.title || ''} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="输入任务标题" className="bg-muted/30 text-lg font-medium py-6" />
                  ) : (
                    <div className="text-lg font-medium p-3 bg-muted/10 rounded-xl border border-transparent">{formData.title}</div>
                  )}
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">任务描述</label>
                  {isEditing ? (
                    <textarea 
                      className="flex min-h-[150px] w-full rounded-xl border border-input bg-muted/30 px-4 py-3 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
                      value={formData.description || ''}
                      onChange={e => setFormData({...formData, description: e.target.value})}
                      placeholder="详细描述该任务的背景、目标和要求..."
                    />
                  ) : (
                    <div className="min-h-[100px] p-4 bg-muted/10 rounded-xl border border-border/50 text-sm leading-relaxed whitespace-pre-wrap">
                      {formData.description || <span className="text-muted-foreground italic">暂无描述</span>}
                    </div>
                  )}
                </div>

                <div className="space-y-3 pt-4 border-t border-border/50">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium flex items-center gap-2"><Paperclip className="h-4 w-4"/> 附件</label>
                    {isEditing && (
                      <div>
                        <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />
                        <Button variant="outline" size="sm" className="rounded-full h-8 gap-2" onClick={() => fileInputRef.current?.click()} isLoading={isUploading}>
                          <UploadCloud className="h-4 w-4"/> 上传文件
                        </Button>
                      </div>
                    )}
                  </div>
                  
                  {formData.attachments && formData.attachments.length > 0 ? (
                    <div className="grid grid-cols-2 gap-3">
                      {formData.attachments.map(file => (
                        <div key={file.id} className="flex items-center justify-between p-3 border border-border/50 rounded-xl bg-background shadow-sm group">
                          <div className="flex items-center gap-3 overflow-hidden">
                            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                              <FileText className="h-4 w-4 text-primary" />
                            </div>
                            <div className="overflow-hidden">
                              <div className="text-sm font-medium truncate">{file.name}</div>
                              <div className="text-xs text-muted-foreground">{file.size}</div>
                            </div>
                          </div>
                          {isEditing && (
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => removeAttachment(file.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 border-2 border-dashed border-border/50 rounded-xl bg-muted/10">
                      <p className="text-sm text-muted-foreground">暂无附件</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {currentView !== 'create' && (
              <Card className="glass-panel shadow-sm">
                <CardHeader className="border-b border-border/50 pb-4">
                  <CardTitle className="text-lg flex items-center gap-2"><MessageSquare className="h-5 w-5 text-blue-500"/> 讨论与流转记录</CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-6">
                    {formData.comments?.map(comment => (
                      <div key={comment.id} className="flex gap-4">
                        {comment.type === 'system' ? (
                          <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0 border border-border/50">
                            <Layers className="h-4 w-4 text-muted-foreground" />
                          </div>
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center text-primary-700 shrink-0 shadow-sm border border-primary/10 font-medium">
                            {comment.author.charAt(0)}
                          </div>
                        )}
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">{comment.author}</span>
                            <span className="text-xs text-muted-foreground font-mono">{comment.time}</span>
                          </div>
                          {comment.type === 'system' ? (
                            <div className="text-sm text-muted-foreground italic">{comment.text}</div>
                          ) : (
                            <div className="text-sm bg-muted/30 p-4 rounded-2xl rounded-tl-none border border-border/50 text-foreground leading-relaxed">
                              {comment.text}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                    {(!formData.comments || formData.comments.length === 0) && (
                      <div className="text-center py-6 text-muted-foreground text-sm">暂无记录</div>
                    )}
                  </div>
                  
                  <div className="mt-8 pt-6 border-t border-border/50">
                    <textarea 
                      className="w-full rounded-xl border border-border/50 bg-muted/30 p-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:bg-background transition-all resize-none shadow-inner" 
                      placeholder="添加评论或记录进展..."
                      rows={3}
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                    ></textarea>
                    <div className="flex justify-end mt-3">
                      <Button size="sm" className="rounded-full px-6 shadow-sm" onClick={handleAddComment} disabled={!newComment.trim()}>发送</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column: Metadata */}
          <div className="space-y-6">
            <Card className="glass-panel shadow-sm sticky top-24">
              <CardHeader className="border-b border-border/50 pb-4">
                <CardTitle className="text-lg">属性设置</CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-5">
                {currentView === 'create' && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground flex items-center gap-2"><LayoutDashboard className="h-4 w-4"/> 关联问题</label>
                    <Input value={formData.issueId || ''} onChange={e => setFormData({...formData, issueId: e.target.value})} placeholder="例如: ISS-202604-001" className="bg-muted/30" />
                  </div>
                )}
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground flex items-center gap-2"><User className="h-4 w-4"/> 执行人 <span className="text-destructive">*</span></label>
                  {isEditing ? (
                    <Input value={formData.assignee || ''} onChange={e => setFormData({...formData, assignee: e.target.value})} className="bg-muted/30" />
                  ) : (
                    <div className="font-medium flex items-center gap-2 p-2">
                      <div className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">{formData.assignee?.charAt(0)}</div>
                      {formData.assignee}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground flex items-center gap-2"><Tag className="h-4 w-4"/> 优先级</label>
                  {isEditing ? (
                    <select 
                      className="flex h-10 w-full rounded-md border border-input bg-muted/30 px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      value={formData.priority || '中'}
                      onChange={e => setFormData({...formData, priority: e.target.value as TaskPriority})}
                    >
                      <option value="高">高</option>
                      <option value="中">中</option>
                      <option value="低">低</option>
                    </select>
                  ) : (
                    <div className="p-2">
                      <Badge variant={formData.priority === '高' ? 'destructive' : formData.priority === '中' ? 'warning' : 'secondary'} className="shadow-none">{formData.priority}</Badge>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground flex items-center gap-2"><Layers className="h-4 w-4"/> 关联 8D 阶段</label>
                  {isEditing ? (
                    <select 
                      className="flex h-10 w-full rounded-md border border-input bg-muted/30 px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      value={formData.phase || 'D0'}
                      onChange={e => setFormData({...formData, phase: e.target.value})}
                    >
                      {['D0', 'D1', 'D2', 'D3', 'D4', 'D5', 'D6', 'D7', 'D8', '无'].map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  ) : (
                    <div className="p-2"><Badge variant="outline" className="shadow-none bg-background">{formData.phase}</Badge></div>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground flex items-center gap-2"><Calendar className="h-4 w-4"/> 计划开始</label>
                  {isEditing ? (
                    <Input type="date" value={formData.startDate || ''} onChange={e => setFormData({...formData, startDate: e.target.value})} className="bg-muted/30" />
                  ) : (
                    <div className="p-2 font-mono text-sm">{formData.startDate}</div>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground flex items-center gap-2"><Clock className="h-4 w-4"/> 截止时间</label>
                  {isEditing ? (
                    <Input type="date" value={formData.deadline || ''} onChange={e => setFormData({...formData, deadline: e.target.value})} className="bg-muted/30" />
                  ) : (
                    <div className="p-2 font-mono text-sm">{formData.deadline}</div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // List View
  return (
    <div className="flex flex-col gap-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full hover:bg-muted">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight font-serif text-primary-900 dark:text-primary-100">子任务管理</h1>
            <p className="text-muted-foreground mt-1">
              {issueId ? (
                <>关联问题: <span className="font-mono text-foreground">{issueId}</span></>
              ) : (
                '管理问题处理过程中拆分的各项具体任务。'
              )}
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button className="gap-2 rounded-full shadow-md hover:shadow-lg transition-all" onClick={handleOpenCreate}>
            <Plus className="h-4 w-4" />
            新建任务
          </Button>
        </div>
      </div>

      {issueId && (
        <div className="flex items-center gap-1 border-b border-border/50 pb-px -mt-2">
          <Link to={`/issues/${issueId}`} className="flex items-center gap-2 px-6 py-3 border-b-2 border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors rounded-t-lg">
            <LayoutDashboard className="h-4 w-4" />
            问题总览
          </Link>
          <Link to={`/tasks?issueId=${issueId}`} className="flex items-center gap-2 px-6 py-3 border-b-2 border-primary text-primary font-medium transition-colors bg-primary/5 rounded-t-lg">
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
      )}

      <Card className="glass-panel hover:shadow-lg transition-all duration-300">
        <CardHeader className="pb-4 border-b border-border/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative w-72 group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input 
                  placeholder="搜索任务标题、编号..." 
                  className="pl-10 rounded-full bg-muted/30 border-transparent focus:border-primary/30 focus:bg-background transition-all shadow-inner" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button variant="outline" className="gap-2 rounded-full hover:bg-primary/5 hover:text-primary transition-colors">
                <Filter className="h-4 w-4" />
                筛选
              </Button>
            </div>
            <div className="flex gap-1 bg-muted/30 p-1 rounded-full border border-border/50">
              <Button 
                variant={viewMode === 'active' ? 'secondary' : 'ghost'} 
                size="sm" 
                className={`rounded-full shadow-sm ${viewMode === 'active' ? 'bg-background text-primary' : ''}`}
                onClick={() => setViewMode('active')}
              >
                活跃任务
              </Button>
              <Button 
                variant={viewMode === 'archived' ? 'secondary' : 'ghost'} 
                size="sm" 
                className={`rounded-full shadow-sm ${viewMode === 'archived' ? 'bg-background text-primary' : ''}`}
                onClick={() => setViewMode('archived')}
              >
                已归档
              </Button>
              <Button 
                variant={viewMode === 'deleted' ? 'secondary' : 'ghost'} 
                size="sm" 
                className={`rounded-full shadow-sm ${viewMode === 'deleted' ? 'bg-background text-primary' : ''}`}
                onClick={() => setViewMode('deleted')}
              >
                回收站
              </Button>
            </div>
            <div className="flex gap-1 bg-muted/30 p-1 rounded-full border border-border/50 ml-2">
              <Button variant={filterStatus === 'all' ? 'secondary' : 'ghost'} size="sm" className="rounded-full shadow-sm" onClick={() => setFilterStatus('all')}>全部</Button>
              <Button variant={filterStatus === 'my' ? 'secondary' : 'ghost'} size="sm" className="rounded-full" onClick={() => setFilterStatus('my')}>我的任务</Button>
              <Button variant={filterStatus === 'pending' ? 'secondary' : 'ghost'} size="sm" className="rounded-full" onClick={() => setFilterStatus('pending')}>待完成</Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground bg-muted/20 border-b border-border/50">
                <tr>
                  <th className="px-6 py-4 font-medium uppercase tracking-wider">任务编号</th>
                  <th className="px-6 py-4 font-medium uppercase tracking-wider">关联问题</th>
                  <th className="px-6 py-4 font-medium uppercase tracking-wider">任务标题</th>
                  <th className="px-6 py-4 font-medium uppercase tracking-wider">阶段</th>
                  <th className="px-6 py-4 font-medium uppercase tracking-wider">执行人</th>
                  <th className="px-6 py-4 font-medium uppercase tracking-wider">状态</th>
                  <th className="px-6 py-4 font-medium uppercase tracking-wider">截止时间</th>
                  <th className="px-6 py-4 font-medium uppercase tracking-wider text-right">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {filteredTasks.length > 0 ? (
                  filteredTasks.map((task) => (
                    <tr key={task.id} className="hover:bg-muted/30 transition-colors group cursor-pointer" onClick={() => handleOpenDetail(task)}>
                      <td className="px-6 py-4 font-medium text-foreground font-mono">{task.id}</td>
                      <td className="px-6 py-4">
                        <Link to={`/issues/${task.issueId}`} className="text-primary hover:underline font-mono inline-flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                          {task.issueId}
                        </Link>
                      </td>
                      <td className="px-6 py-4 font-medium text-foreground">
                        <div className="flex items-center gap-2">
                          {task.title}
                          {task.priority === '高' && <Badge variant="destructive" className="px-1.5 py-0 text-[10px] h-4">高优</Badge>}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant="outline" className="shadow-none bg-background">{task.phase}</Badge>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                            {task.assignee.charAt(0)}
                          </div>
                          {task.assignee}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(task.status)}
                      </td>
                      <td className="px-6 py-4 text-muted-foreground font-mono text-xs">{task.deadline}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {viewMode === 'active' && (
                            <>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 rounded-md hover:bg-orange-50 hover:text-orange-600"
                                onClick={(e) => handleArchive(e, task.id)}
                                title="归档"
                              >
                                <Archive className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 rounded-md hover:bg-red-50 hover:text-red-600"
                                onClick={(e) => handleDelete(e, task.id)}
                                title="移动至回收站"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                          {viewMode === 'archived' && (
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 rounded-md hover:bg-primary/10 hover:text-primary"
                              onClick={(e) => handleRestoreArchive(e, task.id)}
                              title="恢复至活跃"
                            >
                              <RotateCcw className="h-4 w-4" />
                            </Button>
                          )}
                          {viewMode === 'deleted' && (
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 rounded-md hover:bg-primary/10 hover:text-primary"
                              onClick={(e) => handleRestoreDelete(e, task.id)}
                              title="从回收站恢复"
                            >
                              <RotateCcw className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-muted-foreground">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <FileX className="h-10 text-muted-foreground/30" />
                        <p>没有找到相关任务</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
