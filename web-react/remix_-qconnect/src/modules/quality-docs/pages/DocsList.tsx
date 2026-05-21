import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Plus, Search, Filter, Lock, Archive, Trash2, RotateCcw, MoreHorizontal, FileX } from 'lucide-react';
import { QualityDocsService } from '../services/api';
import { QualityDoc } from '../types';
import { useTranslation } from 'react-i18next';
import { useToast } from '@/src/components/ui/use-toast';
import { Badge } from '@/src/components/ui/badge';
import { Button } from '@/src/components/ui/button';

export function DocsList() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [docs, setDocs] = useState<QualityDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'active' | 'archived' | 'deleted'>('active');
  const { t } = useTranslation();

  const fetchDocs = async () => {
    setLoading(true);
    try {
      const data = await QualityDocsService.getDocs({
        showArchived: viewMode === 'archived',
        showDeleted: viewMode === 'deleted'
      });
      setDocs(data);
    } catch (error) {
      toast({ title: "加载失败", description: "无法获取文档列表", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocs();
  }, [viewMode]);

  const handleArchive = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await QualityDocsService.archiveDoc(id, 'USR-001', '张三 (当前用户)');
      toast({ title: "已归档", description: "文档已移至归档库", variant: "success" });
      fetchDocs();
    } catch (error) {
      toast({ title: "操作失败", variant: "destructive" });
    }
  };

  const handleRestoreArchive = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await QualityDocsService.restoreArchivedDoc(id, 'USR-001', '张三 (当前用户)');
      toast({ title: "已恢复", description: "文档已从归档库恢复", variant: "success" });
      fetchDocs();
    } catch (error) {
      toast({ title: "操作失败", variant: "destructive" });
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await QualityDocsService.deleteDoc(id, 'USR-001', '张三 (当前用户)');
      toast({ title: "已删除", description: "文档已移至回收站", variant: "success" });
      fetchDocs();
    } catch (error) {
      toast({ title: "操作失败", variant: "destructive" });
    }
  };

  const handleRestoreDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await QualityDocsService.restoreDeletedDoc(id, 'USR-001', '张三 (当前用户)');
      toast({ title: "已恢复", description: "文档已从回收站恢复", variant: "success" });
      fetchDocs();
    } catch (error) {
      toast({ title: "操作失败", variant: "destructive" });
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('qualityDocs.title')}</h1>
          <p className="text-muted-foreground">{t('qualityDocs.subtitle')}</p>
        </div>
        <div className="flex gap-2">
          {/* 权限控制示例：只有拥有 qualityDocs:create 权限的用户才能看到新建按钮 */}
          {/* <RequireAuth permission="qualityDocs:create"> */}
          <button 
            onClick={() => navigate('/quality-docs/new')}
            className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background bg-primary text-primary-foreground hover:bg-primary/90 h-10 py-2 px-4"
          >
            <Plus className="w-4 h-4 mr-2" />
            {t('qualityDocs.upload')}
          </button>
          {/* </RequireAuth> */}
        </div>
      </div>

      <div className="flex items-center gap-4 bg-card p-4 rounded-lg border shadow-sm">
        <div className="flex gap-1 bg-muted/50 p-1 rounded-full mr-2">
          <Button 
            variant="ghost" 
            size="sm" 
            className={`rounded-full shadow-sm ${viewMode === 'active' ? 'bg-background text-primary' : 'text-muted-foreground hover:text-foreground'}`}
            onClick={() => setViewMode('active')}
          >
            在用文档
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className={`rounded-full shadow-sm ${viewMode === 'archived' ? 'bg-background text-primary' : 'text-muted-foreground hover:text-foreground'}`}
            onClick={() => setViewMode('archived')}
          >
            已归档
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className={`rounded-full shadow-sm ${viewMode === 'deleted' ? 'bg-background text-primary' : 'text-muted-foreground hover:text-foreground'}`}
            onClick={() => setViewMode('deleted')}
          >
            回收站
          </Button>
        </div>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input 
            type="text" 
            placeholder={t('qualityDocs.searchPlaceholder')} 
            className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 pl-9"
          />
        </div>
        <button className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 border border-input hover:bg-accent hover:text-accent-foreground h-10 py-2 px-4 whitespace-nowrap">
          <Filter className="w-4 h-4 mr-2" />
          高级筛选
        </button>
      </div>

      <div className="rounded-md border bg-card">
        <div className="w-full overflow-auto">
          <table className="w-full caption-bottom text-sm">
            <thead className="[&_tr]:border-b">
              <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">{t('qualityDocs.docNumber')}</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">{t('qualityDocs.type')}</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">{t('qualityDocs.docName')}</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">{t('qualityDocs.version')}</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">{t('qualityDocs.status')}</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">{t('qualityDocs.owner')}</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">{t('qualityDocs.updateTime')}</th>
                <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">操作</th>
              </tr>
            </thead>
            <tbody className="[&_tr:last-child]:border-0">
              {loading ? (
                <tr><td colSpan={8} className="p-4 text-center text-muted-foreground">加载中...</td></tr>
              ) : docs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-2">
                       <FileX className="w-10 h-10 text-muted-foreground/30" />
                       <p>暂无{viewMode === 'archived' ? '归档' : viewMode === 'deleted' ? '被删除' : ''}文档</p>
                    </div>
                  </td>
                </tr>
              ) : docs.map(doc => (
                <tr 
                  key={doc.id} 
                  className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted cursor-pointer group"
                  onClick={() => navigate(`/quality-docs/${doc.id}`)}
                >
                  <td className="p-4 align-middle font-medium">{doc.uniqueId}</td>
                  <td className="p-4 align-middle">
                    <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80">
                      {doc.fileType}
                    </span>
                  </td>
                  <td className="p-4 align-middle">
                    <div className="flex items-center gap-2">
                      {doc.name}
                      {doc.isCheckedOut && (
                        <span title={`已被 ${doc.checkedOutBy} 检出`}>
                          <Lock className="w-3.5 h-3.5 text-orange-500" />
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="p-4 align-middle">{doc.version}</td>
                  <td className="p-4 align-middle">
                    <Badge variant={
                      doc.status === 'RELEASED' ? 'success' : 
                      doc.status === 'DRAFT' ? 'outline' : 
                      doc.status === 'PENDING_APPROVAL' ? 'warning' : 'default'
                    }>
                      {doc.status}
                    </Badge>
                  </td>
                  <td className="p-4 align-middle">{doc.owner}</td>
                  <td className="p-4 align-middle">{new Date(doc.updateDate).toLocaleDateString()}</td>
                  <td className="p-4 align-middle text-right">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {viewMode === 'active' && (
                        <>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 rounded-full hover:bg-orange-50 hover:text-orange-600"
                            onClick={(e) => handleArchive(e, doc.id)}
                            title="归档"
                          >
                            <Archive className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 rounded-full hover:bg-red-50 hover:text-red-600"
                            onClick={(e) => handleDelete(e, doc.id)}
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
                          className="h-8 w-8 rounded-full hover:bg-primary/10 hover:text-primary"
                          onClick={(e) => handleRestoreArchive(e, doc.id)}
                          title="恢复至在用"
                        >
                          <RotateCcw className="h-4 w-4" />
                        </Button>
                      )}
                      {viewMode === 'deleted' && (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 rounded-full hover:bg-primary/10 hover:text-primary"
                          onClick={(e) => handleRestoreDelete(e, doc.id)}
                          title="从回收站恢复"
                        >
                          <RotateCcw className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
