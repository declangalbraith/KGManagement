import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { QualityDocsService } from '../services/api';
import { QualityDoc, AuditLog, DocStatus } from '../types';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, FileCheck, History, Edit, Upload, FileText, BookOpen, Sparkles, ChevronRight, Network, Eye, XCircle, CheckCircle2, Navigation, MessageSquare, Lock, Unlock, KeyRound, Trash2 } from 'lucide-react';
import { Badge } from '@/src/components/ui/badge';
import { Button } from '@/src/components/ui/button';
import { DocumentViewer } from '@/src/components/DocumentViewer';
import { useToast } from '@/src/components/ui/use-toast';
import { Textarea } from '@/src/components/ui/textarea';
import { Input } from '@/src/components/ui/input';

export function DocDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [doc, setDoc] = useState<QualityDoc | null>(null);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [activeAttachment, setActiveAttachment] = useState<{name: string, type: string} | null>(null);
  
  // Rejection modal state
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectComment, setRejectComment] = useState('');

  // CheckIn modal state
  const [checkInModalOpen, setCheckInModalOpen] = useState(false);
  const [checkInComment, setCheckInComment] = useState('');
  const [newVersion, setNewVersion] = useState('');
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (id) {
      Promise.all([
        QualityDocsService.getDocById(id),
        QualityDocsService.getAuditLogs(id)
      ]).then(([docData, logsData]) => {
        setDoc(docData);
        if (docData) {
          const currentParts = docData.version.match(/V(\d+)\.(\d+)/);
          if (currentParts) {
            setNewVersion(`V${currentParts[1]}.${parseInt(currentParts[2]) + 1}`);
          } else {
            setNewVersion(docData.version + '.1');
          }
        }
        setLogs(logsData);
        setLoading(false);
      });
    }
  }, [id]);

  const refreshData = async () => {
    if (!id) return;
    const [docData, logsData] = await Promise.all([
      QualityDocsService.getDocById(id),
      QualityDocsService.getAuditLogs(id)
    ]);
    setDoc(docData);
    setLogs(logsData);
  };

  const handleAction = async (action: 'SUBMIT' | 'APPROVE' | 'REJECT' | 'RELEASE', comment?: string) => {
    if (!doc) return;
    try {
      const nextStatusMap: Record<string, DocStatus> = {
        'SUBMIT': 'PENDING_APPROVAL',
        'APPROVE': 'APPROVED',
        'REJECT': 'REJECTED',
        'RELEASE': 'RELEASED' as any
      };
      
      const newStatus = nextStatusMap[action];
      if (newStatus) {
        setDoc({ ...doc, status: newStatus });
      }

      setLogs([{
        id: Date.now().toString(),
        docId: doc.id,
        action: action as any,
        operatorId: 'USR-001',
        operatorName: '张三 (当前用户)',
        timestamp: new Date().toISOString(),
        details: comment ? `操作附言: ${comment}` : `执行操作: ${action}`
      }, ...logs]);

      toast({
        title: "操作成功",
        description: `文档流程已更新至 ${newStatus}`,
        variant: "success"
      });
      
      if (action === 'REJECT') {
        setRejectModalOpen(false);
        setRejectComment('');
      }
    } catch (e) {
      toast({
        title: "操作失败",
        description: "系统异常，请稍后重试",
        variant: "destructive"
      });
    }
  };

  const handleCheckOut = async () => {
    if (!doc) return;
    try {
      await QualityDocsService.checkOutDoc(doc.id, 'USR-001', '张三 (当前用户)');
      toast({
        title: "检出成功",
        description: "您已成功检出该文档，可以开始修订。",
        variant: "success",
      });
      await refreshData();
    } catch (e: any) {
      toast({
        title: "检出失败",
        description: e.message || "系统异常，请稍后重试",
        variant: "destructive"
      });
    }
  };

  const handleCancelCheckOut = async () => {
    if (!doc) return;
    try {
      await QualityDocsService.cancelCheckOutDoc(doc.id, 'USR-001');
      toast({
        title: "取消检出",
        description: "已成功取消检出，文档恢复为发布状态。",
        variant: "success",
      });
      await refreshData();
    } catch (e: any) {
      toast({
        title: "操作失败",
        description: e.message || "系统异常，请稍后重试",
        variant: "destructive"
      });
    }
  };

  const handleCheckIn = async () => {
    if (!doc) return;
    try {
      await QualityDocsService.checkInDoc(doc.id, 'USR-001', '张三 (当前用户)', newVersion, checkInComment);
      toast({
        title: "检入成功",
        description: "文档新版本已保存，当前状态为草稿。",
        variant: "success",
      });
      setCheckInModalOpen(false);
      setCheckInComment('');
      await refreshData();
    } catch (e: any) {
      toast({
        title: "检入失败",
        description: e.message || "系统异常，请稍后重试",
        variant: "destructive"
      });
    }
  };

  const handleViewDocument = (att?: {name: string}) => {
    setActiveAttachment(att ? { name: att.name, type: 'pdf' } : { name: doc?.name || 'Document', type: 'pdf' });
    setViewerOpen(true);
  };

  const handleExtractToGraph = () => {
    toast({
      title: "提取成功",
      description: "文档实体及关系已成功提取并同步至知识图谱。",
      variant: "success"
    });
  };

  const handleSmartRead = () => {
    toast({
      title: "智能伴读已启动",
      description: "Queen 助手已就绪，您可以针对当前文档进行提问。",
    });
  };

  const handleUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0 || !doc) return;
    const file = files[0];
    
    setIsUploading(true);
    try {
      const newAttachment = {
        id: `att-${Date.now()}`,
        name: file.name,
        size: file.size,
        uploadDate: new Date().toISOString(),
        type: file.type || 'application/octet-stream'
      };
      
      const updatedAttachments = [...(doc.attachments || []), newAttachment];
      await QualityDocsService.updateDoc(doc.id, { attachments: updatedAttachments });
      toast({
        title: "上传成功",
        description: `附件 ${file.name} 已成功关联`,
        variant: "success"
      });
      await refreshData();
    } catch (error: any) {
      toast({
        title: "上传失败",
        description: error.message || "未知错误",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDeleteAttachment = async (e: React.MouseEvent, attachmentId: string) => {
    e.stopPropagation();
    if (!doc) return;
    try {
      const updatedAttachments = (doc.attachments || []).filter(a => a.id !== attachmentId);
      await QualityDocsService.updateDoc(doc.id, { attachments: updatedAttachments });
      toast({
        title: "删除成功",
        description: "附件已成功移除",
        variant: "success"
      });
      await refreshData();
    } catch (error: any) {
      toast({
        title: "删除失败",
        description: error.message || "未知错误",
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'APPROVED': return <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-success/10 text-success border-success/20">已审批</span>;
      case 'PENDING_APPROVAL': return <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-warning/10 text-warning-700 border-warning/20">待审批</span>;
      case 'REJECTED': return <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-destructive/10 text-destructive border-destructive/20">已打回</span>;
      case 'RELEASED': return <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-blue-100 text-blue-700 border-blue-200">已发布</span>;
      default: return <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-secondary text-secondary-foreground">草稿</span>;
    }
  };

  const getLogIcon = (action: string) => {
    switch(action) {
      case 'APPROVE': return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case 'REJECT': return <XCircle className="w-4 h-4 text-destructive" />;
      case 'SUBMIT': return <Navigation className="w-4 h-4 text-blue-500" />;
      case 'RELEASE': return <Sparkles className="w-4 h-4 text-purple-500" />;
      case 'UPDATE': return <Edit className="w-4 h-4 text-orange-500" />;
      case 'CHECK_OUT': return <Lock className="w-4 h-4 text-orange-600" />;
      case 'CANCEL_CHECK_OUT': return <Unlock className="w-4 h-4 text-muted-foreground" />;
      case 'CHECK_IN': return <KeyRound className="w-4 h-4 text-emerald-600" />;
      default: return <FileText className="w-4 h-4 text-muted-foreground" />;
    }
  };

  if (loading) return <div className="p-8 text-center">加载中...</div>;
  if (!doc) return <div className="p-8 text-center text-red-500">文档不存在</div>;

  const canEdit = doc.status === 'DRAFT' || doc.status === 'REJECTED' || (doc.isCheckedOut && doc.checkedOutBy === '张三 (当前用户)');

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center gap-4">
        <div className="flex items-start gap-4">
          <button 
            onClick={() => navigate('/quality-docs')}
            className="inline-flex items-center justify-center rounded-full text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground h-10 w-10 flex-shrink-0 bg-card border shadow-sm mt-1 md:mt-0"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center flex-wrap gap-2 md:gap-3">
              <h1 className="text-xl md:text-2xl font-bold tracking-tight">{doc.name}</h1>
              {getStatusBadge(doc.status)}
              {doc.isCheckedOut && (
                <Badge variant="outline" className="border-orange-200 bg-orange-50 text-orange-700 flex items-center gap-1.5 whitespace-nowrap">
                  <Lock className="w-3 h-3" />
                  {t('docDetails.checkedOutBy', { name: doc.checkedOutBy, defaultValue: `已被 ${doc.checkedOutBy} 检出` })}
                </Badge>
              )}
            </div>
            <div className="flex items-center flex-wrap gap-2 mt-1">
              <Badge variant="outline" className="font-mono text-xs">{doc.uniqueId}</Badge>
              <span className="text-muted-foreground text-sm">·</span>
              <span className="text-muted-foreground text-sm">{doc.fileType}</span>
              <span className="text-muted-foreground text-sm">·</span>
              <span className="text-muted-foreground text-sm font-mono">v{doc.version}</span>
            </div>
          </div>
        </div>
        <div className="md:ml-auto flex gap-2 flex-wrap justify-end w-full md:w-auto mt-2 md:mt-0">
          <Button 
            variant="outline"
            onClick={() => handleViewDocument()}
            className="shadow-sm bg-background border-primary text-primary hover:bg-primary/5 whitespace-nowrap shrink-0"
          >
            <Eye className="w-4 h-4 mr-2" /> 预览正文
          </Button>

          <Button 
            variant="secondary"
            onClick={handleSmartRead}
            className="shadow-sm bg-primary/10 text-primary-700 hover:bg-primary/20 hover:text-primary-800 whitespace-nowrap shrink-0"
          >
            <Sparkles className="w-4 h-4 mr-2" /> 智能伴读
          </Button>
          
          {(doc.status === 'APPROVED' || doc.status === 'RELEASED') && !doc.isCheckedOut && (
            <Button 
              variant="outline"
              onClick={handleExtractToGraph}
              className="shadow-sm text-blue-700 border-blue-200 bg-blue-50 hover:bg-blue-100 hover:text-blue-800 whitespace-nowrap shrink-0"
            >
              <Network className="w-4 h-4 mr-2" /> 提取至图谱
            </Button>
          )}

          {(doc.status === 'APPROVED' || doc.status === 'RELEASED') && !doc.isCheckedOut && (
            <Button 
              variant="default"
              onClick={handleCheckOut}
              className="shadow-sm bg-orange-600 hover:bg-orange-700 text-white whitespace-nowrap shrink-0"
            >
              <Lock className="w-4 h-4 mr-2" /> {t('docDetails.checkOut', '检出 (修订)')}
            </Button>
          )}

          {doc.isCheckedOut && doc.checkedOutBy === '张三 (当前用户)' && (
            <>
              <Button 
                variant="outline"
                onClick={handleCancelCheckOut}
                className="shadow-sm text-muted-foreground whitespace-nowrap shrink-0"
              >
                <Unlock className="w-4 h-4 mr-2" /> {t('docDetails.cancelCheckOut', '取消检出')}
              </Button>
              <Button 
                variant="default"
                onClick={() => setCheckInModalOpen(true)}
                className="shadow-sm bg-emerald-600 hover:bg-emerald-700 text-white whitespace-nowrap shrink-0"
              >
                <KeyRound className="w-4 h-4 mr-2" /> {t('docDetails.checkIn', '检入 (完成修订)')}
              </Button>
            </>
          )}

          {(doc.status === 'DRAFT' || doc.status === 'REJECTED') && !doc.isCheckedOut && (
            <Button 
              variant="outline"
              onClick={() => toast({ title: "编辑文档", description: "打开编辑器" })}
              className="shadow-sm whitespace-nowrap shrink-0"
            >
              <Edit className="w-4 h-4 mr-2" /> 编辑
            </Button>
          )}
          
          {/* Workflow Closed Loop Buttons */}
          {(doc.status === 'DRAFT' || doc.status === 'REJECTED') && (
            <Button onClick={() => handleAction('SUBMIT')} className="shadow-sm shadow-primary/20 whitespace-nowrap shrink-0">
              <FileCheck className="w-4 h-4 mr-2 shrink-0" /> 提交审核
            </Button>
          )}

          {doc.status === 'PENDING_APPROVAL' && (
            <>
              <Button variant="destructive" onClick={() => setRejectModalOpen(true)} className="shadow-sm whitespace-nowrap shrink-0">
                <XCircle className="w-4 h-4 mr-2 shrink-0" /> 打回
              </Button>
              <Button onClick={() => handleAction('APPROVE')} className="shadow-sm bg-emerald-600 hover:bg-emerald-700 text-white whitespace-nowrap shrink-0">
                <CheckCircle2 className="w-4 h-4 mr-2 shrink-0" /> 审批通过
              </Button>
            </>
          )}

          {doc.status === 'APPROVED' && (
            <Button onClick={() => handleAction('RELEASE')} className="shadow-sm bg-indigo-600 hover:bg-indigo-700 text-white whitespace-nowrap shrink-0">
              <Navigation className="w-4 h-4 mr-2 shrink-0" /> 发布 (Release)
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <div className="bg-card border rounded-xl p-6 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
            <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" /> 基本信息
            </h3>
            <div className="grid grid-cols-2 gap-y-6 gap-x-8 text-sm">
              <div className="flex flex-col gap-1">
                <span className="text-muted-foreground text-xs uppercase tracking-wider">文件编号</span>
                <span className="font-medium text-base">{doc.docNumber}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-muted-foreground text-xs uppercase tracking-wider">Owner (所有者)</span>
                <span className="font-medium flex items-center gap-2">
                  <div className="h-6 w-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold">{doc.owner.charAt(0)}</div>
                  {doc.owner}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-muted-foreground text-xs uppercase tracking-wider">部门</span>
                <span className="font-medium">{doc.department || '-'}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-muted-foreground text-xs uppercase tracking-wider">项目名称</span>
                <span className="font-medium">{doc.projectName || '-'}</span>
              </div>
              <div className="col-span-2 flex flex-col gap-1">
                <span className="text-muted-foreground text-xs uppercase tracking-wider">文件描述</span>
                <span className="font-medium leading-relaxed bg-muted/40 p-3 rounded-lg mt-1">{doc.description || '暂无详细描述'}</span>
              </div>
            </div>
          </div>

          <div className="bg-card border rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Upload className="w-5 h-5 text-primary" /> 附件列表
              </h3>
              {canEdit && (
                <>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileUpload} 
                    className="hidden" 
                  />
                  <Button variant="outline" size="sm" onClick={handleUpload} disabled={isUploading}>
                    {isUploading ? '上传中...' : '上传新附件'}
                  </Button>
                </>
              )}
            </div>
            {doc.attachments && doc.attachments.length > 0 ? (
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {doc.attachments.map(att => (
                  <li 
                    key={att.id} 
                    className="flex flex-col p-4 border rounded-xl hover:border-primary/40 hover:shadow-md transition-all cursor-pointer bg-gradient-to-br from-background to-muted/20 group relative"
                    onClick={() => handleViewDocument(att)}
                  >
                    {canEdit && (
                       <button
                         onClick={(e) => handleDeleteAttachment(e, att.id)}
                         className="absolute top-2 right-2 p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md opacity-0 group-hover:opacity-100 transition-all z-10"
                         title="删除附件"
                       >
                         <Trash2 className="w-4 h-4" />
                       </button>
                    )}
                    <div className="flex items-start justify-between mb-2 pr-6">
                      <FileText className="w-8 h-8 text-blue-500 bg-blue-50 p-1.5 rounded-lg" />
                      <span className="text-xs text-muted-foreground font-mono bg-muted px-2 py-0.5 rounded-full">{(att.size / 1024).toFixed(0)} KB</span>
                    </div>
                    <span className="text-sm font-medium group-hover:text-primary transition-colors line-clamp-2 mt-1 pr-6">{att.name}</span>
                    <span className="text-xs text-muted-foreground mt-2">{new Date(att.uploadDate).toLocaleDateString()}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="py-12 flex flex-col items-center justify-center border-2 border-dashed rounded-xl bg-muted/20">
                <Upload className="w-8 h-8 text-muted-foreground/50 mb-3" />
                <p className="text-sm text-muted-foreground">暂无附件</p>
                {canEdit && (
                  <Button variant="link" className="mt-2" onClick={handleUpload}>点击上传</Button>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          {/* 关联知识与案例模块 */}
          <div className="bg-gradient-to-br from-primary/5 to-transparent border border-primary/20 rounded-xl p-6 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none">
              <BookOpen className="w-32 h-32 text-primary" />
            </div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-primary/10 rounded-lg">
                    <BookOpen className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold text-primary-900 dark:text-primary-100">推荐关联集</h3>
                </div>
              </div>
              
              <div className="space-y-3">
                <Link to="/knowledge/1" className="block p-3.5 rounded-xl bg-background/80 hover:bg-background border border-border/50 hover:border-primary/40 shadow-sm transition-all group/card">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-sm font-medium group-hover/card:text-primary transition-colors line-clamp-2 leading-relaxed">
                      制动盘表面异常磨损的根因分析与解决案例
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-3 justify-between">
                    <Badge variant="secondary" className="text-[10px] px-2 py-0 border-blue-200 bg-blue-50 text-blue-700">历史案例</Badge>
                    <span className="text-xs text-emerald-600 font-medium tracking-tight">95% 匹配度</span>
                  </div>
                </Link>
                
                <Link to="/knowledge/2" className="block p-3.5 rounded-xl bg-background/80 hover:bg-background border border-border/50 hover:border-primary/40 shadow-sm transition-all group/card">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-sm font-medium group-hover/card:text-primary transition-colors line-clamp-2 leading-relaxed">
                      制动系统标准操作规程 (SOP) v2.0
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-3 justify-between">
                    <Badge variant="secondary" className="text-[10px] px-2 py-0 border-purple-200 bg-purple-50 text-purple-700">技术文档</Badge>
                    <span className="text-xs text-emerald-600 font-medium tracking-tight">88% 匹配度</span>
                  </div>
                </Link>
              </div>
            </div>
          </div>

          <div className="bg-card border rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-6">
              <div className="p-1.5 bg-muted rounded-lg">
                <History className="w-5 h-5 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold">审计日志与版本控制</h3>
            </div>
            
            <div className="space-y-0.5 ml-2 border-l-2 border-muted pl-4 relative">
              {logs.map((log, index) => (
                <div key={log.id} className="relative py-4 first:pt-0 last:pb-0">
                  {/* Timeline dot */}
                  <div className="absolute -left-[23px] top-5 w-3.5 h-3.5 rounded-full bg-background border-2 border-muted-foreground ring-4 ring-card z-10" />
                  
                  <div className="bg-muted/30 hover:bg-muted/50 transition-colors p-3.5 rounded-lg border border-transparent hover:border-border/50">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getLogIcon(log.action)}
                        <span className="font-semibold text-sm">{log.operatorName}</span>
                      </div>
                      <span className="text-xs text-muted-foreground font-mono">{new Date(log.timestamp).toLocaleDateString()} {new Date(log.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                    </div>
                    {(log.action === 'UPDATE' || log.action === 'CHECK_IN') && index === logs.length - 1 && (
                       <Badge variant="outline" className="mb-2 text-[10px] font-mono">v{doc.version}</Badge>
                    )}
                    <p className="text-sm text-foreground/80 leading-relaxed font-medium">
                      {log.action === 'SUBMIT' && '提交了文档审批请求'}
                      {log.action === 'APPROVE' && '通过了该版本的审批'}
                      {log.action === 'REJECT' && '打回了该项申请'}
                      {log.action === 'RELEASE' && '将该版本发布至受控库'}
                      {log.action === 'UPDATE' && '更新了文档内容或附件'}
                      {log.action === 'CREATE' && '创建了初始草稿'}
                      {log.action === 'CHECK_OUT' && '检出了该文档进行修订'}
                      {log.action === 'CANCEL_CHECK_OUT' && '取消了检出状态'}
                      {log.action === 'CHECK_IN' && '检入了该文档的新版本'}
                    </p>
                    {log.details && (
                      <div className="mt-2 bg-background p-2.5 rounded-md text-xs text-muted-foreground border border-border flex items-start gap-2">
                        <MessageSquare className="w-3.5 h-3.5 mt-0.5 shrink-0 opacity-50" />
                        <span className="leading-relaxed">{log.details.replace('操作附言: ', '')}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {rejectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-card border shadow-xl rounded-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold flex items-center gap-2 text-destructive">
                <XCircle className="w-5 h-5" /> 确认打回文档
              </h2>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-muted-foreground">打回后，文档将重新回到草稿状态，Owner 需要修改后重新提交。请务必留下修改意见。</p>
              <div className="space-y-2">
                <label className="text-sm font-medium">修改意见 <span className="text-destructive">*</span></label>
                <Textarea 
                  value={rejectComment}
                  onChange={(e) => setRejectComment(e.target.value)}
                  placeholder="填写具体的需修改内容或打回原因..."
                  className="min-h-[100px] resize-none"
                  autoFocus
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 p-4 border-t bg-muted/20">
              <Button variant="ghost" onClick={() => setRejectModalOpen(false)}>取消</Button>
              <Button variant="destructive" disabled={!rejectComment.trim()} onClick={() => handleAction('REJECT', rejectComment)}>确认打回</Button>
            </div>
          </div>
        </div>
      )}

      {checkInModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-card border shadow-xl rounded-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold flex items-center gap-2 text-emerald-600">
                <KeyRound className="w-5 h-5" /> {t('docDetails.checkInConfirm', '确认检入文档')}
              </h2>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-muted-foreground">{t('docDetails.checkInDesc', '检入后，将记录新版本并解锁文档以供他人查看或修订。')}</p>
              
              <div className="flex items-center gap-4 bg-muted/30 p-3 rounded-lg border">
                 <div className="flex-1 space-y-1">
                    <label className="text-xs text-muted-foreground uppercase tracking-wider">{t('docDetails.currentVersion', { version: doc.version, defaultValue: `当前版本: ${doc.version}` })}</label>
                    <div className="font-mono text-sm">{doc.version}</div>
                 </div>
                 <ArrowLeft className="w-4 h-4 text-muted-foreground rotate-180" />
                 <div className="flex-1 space-y-1">
                    <label className="text-xs text-muted-foreground uppercase tracking-wider">{t('docDetails.newVersion', '新版本号')}</label>
                    <Input 
                      value={newVersion}
                      onChange={(e) => setNewVersion(e.target.value)}
                      className="h-8 font-mono"
                    />
                 </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">{t('docDetails.checkInComment', '修订备注')} <span className="text-destructive">*</span></label>
                <Textarea 
                  value={checkInComment}
                  onChange={(e) => setCheckInComment(e.target.value)}
                  placeholder={t('docDetails.checkInPlaceholder', '填写本次修订的内容摘要...')}
                  className="min-h-[100px] resize-none"
                  autoFocus
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 p-4 border-t bg-muted/20">
              <Button variant="ghost" onClick={() => setCheckInModalOpen(false)}>{t('docDetails.cancel', '取消')}</Button>
              <Button onClick={handleCheckIn} disabled={!checkInComment.trim() || !newVersion.trim()} className="bg-emerald-600 hover:bg-emerald-700">{t('docDetails.confirmCheckIn', '确认检入')}</Button>
            </div>
          </div>
        </div>
      )}

      <DocumentViewer 
        isOpen={viewerOpen}
        onClose={() => setViewerOpen(false)}
        title={activeAttachment?.name || doc.name}
        type={(activeAttachment?.type as any) || 'pdf'}
        watermarkText={`CONFIDENTIAL - ${doc.uniqueId} - ${new Date().toISOString().split('T')[0]}`}
      />
    </div>
  );
}
