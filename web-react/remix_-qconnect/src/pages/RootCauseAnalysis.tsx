import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/src/components/ui/card';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { ArrowLeft, Plus, Save, GitBranch, CheckCircle2, Sparkles, FileText, UploadCloud, LayoutDashboard, ListTodo, Search, Activity, SplitSquareHorizontal, Workflow, Layers, ChevronRight, X, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { FishboneCanvasWorkspace } from '@/src/pages/FishboneCanvasWorkspace';
import { useToast } from '@/src/components/ui/use-toast';

const tools = [
  { id: '5why', name: '5 Why 分析', description: '通过连续追问"为什么"，深入挖掘问题的根本原因。', icon: GitBranch, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  { id: 'fishbone', name: '鱼骨图 (Ishikawa)', description: '从人、机、料、法、环、测等维度全面分析可能的原因。', icon: Activity, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  { id: 'is-isnot', name: 'IS / IS NOT 分析', description: '界定问题的边界，明确问题"是"什么，"不是"什么。', icon: SplitSquareHorizontal, color: 'text-purple-500', bg: 'bg-purple-500/10' },
  { id: 'flowchart', name: '流程图分析', description: '梳理业务或生产流程，定位流程中的断点或异常环节。', icon: Workflow, color: 'text-orange-500', bg: 'bg-orange-500/10' },
  { id: 'sipoc', name: 'SIPOC 模型', description: '宏观梳理供应商、输入、过程、输出和客户的关系。', icon: Layers, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
];

export function RootCauseAnalysis() {
  const navigate = useNavigate();
  const { id } = useParams();
  const issueId = id || 'ISS-202604-001';
  const { toast } = useToast();
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);

  const [fishboneZoom, setFishboneZoom] = useState(1);
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const topCategories = ['人员 (Man)', '机器 (Machine)', '物料 (Material)'];
  const bottomCategories = ['方法 (Method)', '测量 (Measurement)', '环境 (Environment)'];

  interface CauseNode {
    id: string;
    text: string;
    isMainCause?: boolean;
    children?: CauseNode[];
  }

  const [fishboneData, setFishboneData] = useState<Record<string, CauseNode[]>>({
    '人员 (Man)': [{ id: '1', text: '操作员培训不足' }, { id: '2', text: '疲劳作业' }],
    '机器 (Machine)': [{ id: '3', text: '设备老化' }, { id: '4', text: '维护保养不及时' }],
    '物料 (Material)': [{ id: '5', text: '同批次闸瓦材质过硬' }, { id: '6', text: '供应商变更' }],
    '方法 (Method)': [{ id: '7', text: '工艺参数设置错误' }],
    '测量 (Measurement)': [],
    '环境 (Environment)': [],
  });

  const generateId = () => Math.random().toString(36).substr(2, 9);

  const handleUpdateCause = (cat: string, id: string, newText: string) => {
    setFishboneData(prev => {
      const updateNode = (nodes: CauseNode[]): CauseNode[] => {
        return nodes.map(n => {
          if (n.id === id) return { ...n, text: newText };
          if (n.children) return { ...n, children: updateNode(n.children) };
          return n;
        });
      };
      return { ...prev, [cat]: updateNode(prev[cat]) };
    });
  };

  const addCause = (cat: string, parentId?: string) => {
    setFishboneData(prev => {
      const newNode: CauseNode = { id: generateId(), text: '新原因' };
      if (!parentId) {
        return { ...prev, [cat]: [...prev[cat], newNode] };
      }
      const addNode = (nodes: CauseNode[]): CauseNode[] => {
        return nodes.map(n => {
          if (n.id === parentId) return { ...n, children: [...(n.children || []), newNode] };
          if (n.children) return { ...n, children: addNode(n.children) };
          return n;
        });
      };
      return { ...prev, [cat]: addNode(prev[cat]) };
    });
  };

  const removeCause = (cat: string, id: string) => {
    setFishboneData(prev => {
      const rmNode = (nodes: CauseNode[]): CauseNode[] => {
        return nodes.filter(n => n.id !== id).map(n => {
          if (n.children) return { ...n, children: rmNode(n.children) };
          return n;
        });
      };
      return { ...prev, [cat]: rmNode(prev[cat]) };
    });
  };

  const toggleMainCause = (cat: string, id: string) => {
    setFishboneData(prev => {
      let mainCount = 0;
      Object.keys(prev).forEach(k => {
        const countMains = (nodes: CauseNode[]) => {
          nodes.forEach(n => {
            if (n.isMainCause) mainCount++;
            if (n.children) countMains(n.children);
          });
        };
        countMains(prev[k]);
      });

      const toggleNode = (nodes: CauseNode[]): CauseNode[] => {
        return nodes.map(n => {
          if (n.id === id) {
             if (!n.isMainCause && mainCount >= 3) {
                toast({ title: "标记失败", description: "最多只能标记 3 个主因", variant: "destructive" });
                return n;
             }
             return { ...n, isMainCause: !n.isMainCause };
          }
          if (n.children) return { ...n, children: toggleNode(n.children) };
          return n;
        });
      };
      return { ...prev, [cat]: toggleNode(prev[cat]) };
    });
  };

  const findParentOrSiblingCat = (id: string): {cat: string; parentId?: string} | null => {
     let result: {cat: string; parentId?: string} | null = null;
     Object.keys(fishboneData).forEach(cat => {
        const findInNodes = (nodes: CauseNode[], parentId?: string) => {
           nodes.forEach(n => {
              if (n.id === id) result = { cat, parentId };
              if (n.children) findInNodes(n.children, n.id);
           });
        };
        findInNodes(fishboneData[cat]);
     });
     return result;
  };

  const handleKeyDown = (e: React.KeyboardEvent, cat: string, node: CauseNode) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      setEditingNodeId(null);
      const loc = findParentOrSiblingCat(node.id);
      addCause(cat, loc?.parentId);
    } else if (e.key === 'Tab') {
      e.preventDefault();
      setEditingNodeId(null);
      addCause(cat, node.id);
    } else if (e.key === 'Escape') {
      setEditingNodeId(null);
    }
  };

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      toast({ title: "保存成功", description: "分析草稿已保存。", variant: "success" });
    }, 800);
  };

  const handleConfirm = () => {
    setIsConfirming(true);
    setTimeout(() => {
      setIsConfirming(false);
      toast({ title: "根因已确认", description: "分析结果已同步至 8D 报告 D4 章节。", variant: "success" });
    }, 1200);
  };

  const renderToolbox = () => (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {tools.map((tool) => {
        const Icon = tool.icon;
        return (
          <Card key={tool.id} className="glass-panel hover:shadow-lg transition-all duration-300 cursor-pointer group" onClick={() => setActiveTool(tool.id)}>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className={`h-12 w-12 rounded-2xl ${tool.bg} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                  <Icon className={`h-6 w-6 ${tool.color}`} />
                </div>
                <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </Button>
              </div>
              <CardTitle className="mt-4 text-xl group-hover:text-primary transition-colors">{tool.name}</CardTitle>
              <CardDescription className="mt-2 line-clamp-2">{tool.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Sparkles className="h-3 w-3 text-blue-500" />
                <span>支持 AI 辅助分析</span>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );

  const render5Why = () => (
    <div className="grid gap-6 md:grid-cols-3">
      <div className="md:col-span-2 space-y-6">
        <Card className="glass-panel hover:shadow-lg transition-all duration-300">
          <CardHeader className="border-b border-border/50 pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <GitBranch className="h-5 w-5 text-primary" />
              5 Why 分析链路
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-8">
            <div className="space-y-6">
              {[
                { num: 1, q: "为什么制动盘表面会出现异常磨损？", a: "因为闸瓦在制动过程中对制动盘造成了过度切削。" },
                { num: 2, q: "为什么闸瓦会造成过度切削？", a: "因为该批次闸瓦的硬度超出了设计标准上限。" },
                { num: 3, q: "为什么闸瓦硬度会超标？", a: "因为供应商在近期生产中更改了摩擦材料的配方比例。" },
                { num: 4, q: "为什么供应商更改配方没有被发现？", a: "因为入厂检验环节仅抽检了外观和尺寸，未对硬度进行批次必检。" },
              ].map((item) => (
                <div key={item.num} className="flex gap-4 group">
                  <div className="flex flex-col items-center">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold shadow-sm ring-4 ring-background">
                      {item.num}
                    </div>
                    <div className="h-full w-0.5 bg-border my-2 group-hover:bg-primary/30 transition-colors"></div>
                  </div>
                  <div className="flex-1 space-y-2 pb-4">
                    <label className="text-sm font-medium text-foreground">Why {item.num}: {item.q}</label>
                    <Input defaultValue={item.a} className="transition-all focus:ring-2 bg-muted/30 border-transparent focus:border-primary/30 focus:bg-background shadow-inner rounded-xl" />
                  </div>
                </div>
              ))}

              <div className="flex gap-4 group">
                <div className="flex flex-col items-center">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-muted-foreground font-bold ring-4 ring-background border-2 border-dashed border-border group-hover:border-primary/50 transition-colors">
                    5
                  </div>
                </div>
                <div className="flex-1 space-y-2">
                  <label className="text-sm font-medium text-foreground">Why 5: 为什么入厂检验未包含硬度测试？</label>
                  <Input placeholder="输入第五个 Why 的答案..." className="transition-all focus:ring-2 bg-muted/30 border-transparent focus:border-primary/30 focus:bg-background shadow-inner rounded-xl" />
                </div>
              </div>
            </div>
            <Button variant="outline" className="w-full mt-2 border-dashed rounded-xl hover:bg-primary/5 hover:text-primary hover:border-primary/50 transition-all" onClick={() => toast({ title: "已添加新节点", description: "请填写新的 Why 节点。" })}>
              <Plus className="h-4 w-4 mr-2" />
              添加 Why
            </Button>
          </CardContent>
        </Card>

        <Card className="glass-panel hover:shadow-lg transition-all duration-300">
          <CardHeader className="border-b border-border/50 pb-4">
            <CardTitle className="text-lg">最终根因与措施</CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            <div className="space-y-3">
              <label className="text-sm font-medium text-foreground">根本原因总结</label>
              <textarea 
                className="flex min-h-[100px] w-full rounded-xl border border-transparent bg-muted/30 px-4 py-3 text-sm transition-all placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:bg-background shadow-inner resize-none"
                placeholder="总结根本原因..."
              ></textarea>
            </div>
            <div className="space-y-3">
              <label className="text-sm font-medium text-foreground">纠正与预防措施 (推荐)</label>
              <div className="p-4 border border-border/50 rounded-xl bg-background shadow-sm text-sm leading-relaxed text-muted-foreground">
                <ol className="list-decimal list-inside space-y-2">
                  <li>立即隔离并退回该批次异常闸瓦。</li>
                  <li>更新《入厂检验规范》，将闸瓦硬度测试列为批次必检项目。</li>
                  <li>约谈供应商，要求其提交配方变更的验证报告及整改措施。</li>
                </ol>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <Card className="glass-panel hover:shadow-lg transition-all duration-300 border-blue-200/50 bg-gradient-to-b from-blue-50/50 to-transparent dark:from-blue-900/10">
          <CardHeader className="border-b border-blue-100/50 dark:border-blue-800/50 pb-4">
            <CardTitle className="text-lg flex items-center gap-2 text-blue-700 dark:text-blue-400">
              <Sparkles className="h-5 w-5" />
              AI 辅助分析
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="text-sm space-y-4">
              <p className="text-muted-foreground">基于当前填写的 Why 1-4，AI 助手为您提供以下分析建议：</p>
              <div className="p-4 rounded-xl bg-white dark:bg-card text-blue-900 dark:text-blue-100 border border-blue-100 dark:border-blue-800 shadow-sm leading-relaxed">
                <div className="font-semibold mb-2 flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-blue-500"></div>
                  系统性原因提示
                </div>
                <p>Why 5 的方向建议指向<strong>质量管理体系</strong>或<strong>供应商变更管理流程(PCN)</strong>。例如：“因为供应商未按照 PCN 流程提前申报配方变更，且我们的质量协议中对此类违约的约束力不足。”</p>
              </div>
              <Button variant="outline" className="w-full text-xs rounded-xl border-blue-200 text-blue-700 hover:bg-blue-50 hover:text-blue-800 transition-colors" onClick={() => toast({ title: "已采纳 AI 建议", description: "建议内容已填入 Why 5。", variant: "success" })}>采纳建议并填入 Why 5</Button>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-panel hover:shadow-lg transition-all duration-300">
          <CardHeader className="border-b border-border/50 pb-4">
            <CardTitle className="text-lg">证据与附件</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 border border-border/50 rounded-xl text-sm hover:bg-muted/50 transition-colors group bg-background shadow-sm">
                <div className="flex items-center gap-3 overflow-hidden">
                  <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="truncate group-hover:text-primary transition-colors">硬度测试报告_B202603.pdf</span>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"><ArrowLeft className="h-4 w-4 rotate-[-135deg]" /></Button>
              </div>
              <div className="flex items-center justify-between p-3 border border-border/50 rounded-xl text-sm hover:bg-muted/50 transition-colors group bg-background shadow-sm">
                <div className="flex items-center gap-3 overflow-hidden">
                  <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="truncate group-hover:text-primary transition-colors">客诉现场照片_多张.zip</span>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"><ArrowLeft className="h-4 w-4 rotate-[-135deg]" /></Button>
              </div>
              <Button variant="outline" className="w-full gap-2 border-dashed bg-muted/30 hover:bg-muted/50 transition-colors"><UploadCloud className="h-4 w-4" /> 上传新证据</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderNodes = (nodes: CauseNode[], cat: string, depth = 0) => {
    return nodes.map((node) => (
      <div key={node.id} className={`flex flex-col gap-1 relative ${depth > 0 ? 'ml-4 pl-3 border-l-2 border-border/50' : ''}`}>
        <div 
          draggable
          onDragStart={(e) => {
             e.dataTransfer.setData('text/plain', node.id);
             e.dataTransfer.effectAllowed = 'move';
          }}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
             e.preventDefault();
             const draggedId = e.dataTransfer.getData('text/plain');
             if (draggedId !== node.id) {
                toast({ title: "移动节点", description: "已将拖拽的节点移动到当前节点下。此功能暂不支持持久化存储。" });
             }
          }}
          className={`relative flex items-center gap-2 group/item p-1.5 rounded-lg border transition-colors focus-within:shadow-sm cursor-move ${node.isMainCause ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' : 'bg-muted/30 border-transparent hover:border-emerald-500/30 hover:bg-emerald-500/5 focus-within:border-emerald-500/50 focus-within:bg-background'}`}
          onContextMenu={(e) => {
             e.preventDefault();
             toggleMainCause(cat, node.id);
          }}
        >
          <div className={`w-1.5 h-1.5 rounded-full shrink-0 ml-1 ${node.isMainCause ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' : 'bg-muted-foreground/30 group-hover/item:bg-emerald-500/50'}`}></div>
          
          {editingNodeId === node.id ? (
             <Input 
                autoFocus
                value={node.text} 
                onChange={(e) => handleUpdateCause(cat, node.id, e.target.value)} 
                onKeyDown={(e) => handleKeyDown(e, cat, node)}
                onBlur={() => setEditingNodeId(null)}
                className="h-7 text-xs flex-1 bg-transparent border-none px-1 py-0 focus-visible:ring-0 shadow-none font-medium text-foreground" 
             />
          ) : (
             <span 
                className={`text-xs flex-1 cursor-text truncate px-1 py-0.5 font-medium ${node.isMainCause ? 'text-red-700 dark:text-red-400 font-bold' : 'text-foreground hover:bg-foreground/5 rounded'}`} 
                onDoubleClick={() => setEditingNodeId(node.id)}
             >
                {node.text}
             </span>
          )}

          <div className="flex items-center opacity-0 group-hover/item:opacity-100 transition-opacity shrink-0">
            <Button variant="ghost" size="icon" className="h-6 w-6 text-amber-500 hover:text-amber-600 hover:bg-amber-100 rounded-md" title="AI 深挖原因" onClick={(e) => { e.stopPropagation(); toast({ title: "AI 分析中", description: "正在深挖该原因..."}); }}>
              <Sparkles className="h-3 w-3" />
            </Button>
            <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md" onClick={() => removeCause(cat, node.id)}>
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
        {node.children && node.children.length > 0 && (
           <div className="flex flex-col gap-1 mt-1">
              {renderNodes(node.children, cat, depth + 1)}
           </div>
        )}
      </div>
    ));
  };

  const renderFishbone = () => (
    <>
      {/* Left Toolbar */}
      <div className="w-16 border-r border-border/50 bg-muted/10 flex flex-col items-center py-4 gap-4 shrink-0 z-10 shadow-[2px_0_8px_rgba(0,0,0,0.02)]">
        <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl bg-background shadow-sm border border-border/50 text-primary" title="选择/拖拽">
           <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 3 7.07 16.97 2.51-7.39 7.39-2.51L3 3z"/><path d="m13 13 6 6"/></svg>
        </Button>
        <div className="w-8 h-px bg-border/50 my-1"></div>
        <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl text-muted-foreground hover:text-primary hover:bg-primary/5" title="添加大骨分类">
           <Layers className="h-5 w-5" />
        </Button>
        <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl text-muted-foreground hover:text-primary hover:bg-primary/5" title="添加小骨原因">
           <GitBranch className="h-5 w-5 -rotate-90" />
        </Button>
        <div className="w-8 h-px bg-border/50 my-1"></div>
        <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl text-muted-foreground hover:text-primary hover:bg-primary/5" title="撤销">
           <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/></svg>
        </Button>
      </div>

      {/* Center Canvas */}
      <div 
         className="flex-1 relative bg-slate-50/50 dark:bg-slate-900/20 overflow-auto custom-scrollbar cursor-grab active:cursor-grabbing"
         onContextMenu={(e) => {
            if (e.target === e.currentTarget || (e.target as HTMLElement).className.includes('bg-slate-50')) {
                e.preventDefault();
                toast({ title: "AI 分析中", description: "正在根据已知上下文为您补全可能的原因和分类..." });
            }
         }}
      >
        {/* Canvas Background with Dots grid */}
        <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(0,0,0,0.05) 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>
        
        <div className="min-w-[1000px] min-h-[700px] w-full h-full pt-16 pb-24 pl-12 pr-48 flex flex-col justify-center transition-transform origin-top-left" style={{ transform: `scale(${fishboneZoom})` }}>
          {/* The Problem Head */}
          <div className="absolute right-12 top-1/2 -translate-y-1/2 w-48 p-5 bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-950/40 dark:to-emerald-900/20 border-2 border-emerald-500/30 rounded-xl shadow-lg z-20 text-center text-emerald-900 dark:text-emerald-100 backdrop-blur-sm transition-colors hover:border-emerald-500/50">
            <h3 className="font-bold text-sm tracking-wide">制动盘表面异常磨损</h3>
          </div>

          {/* The Central Line */}
          <div className="absolute left-12 right-60 top-1/2 -translate-y-1/2 h-2.5 bg-gradient-to-r from-emerald-500/20 via-emerald-500/50 to-emerald-500 shadow-sm z-10 rounded-l-full">
             <div className="absolute -right-4 top-1/2 -translate-y-1/2 w-0 h-0 border-y-[8px] border-y-transparent border-l-[16px] border-l-emerald-500" />
          </div>

          {/* Categories */}
          <div className="flex flex-col gap-24 relative z-20 pr-20">
            {/* Top Categories */}
            <div className="flex justify-between w-full">
               {topCategories.map((cat) => (
                  <div key={cat} className="flex-1 px-4 relative flex flex-col justify-end group/branch">
                     <div className="absolute bottom-[-3rem] left-1/2 w-[3px] h-[calc(100%+3rem)] bg-emerald-500/30 rotate-[35deg] origin-bottom -z-10 group-hover/branch:bg-emerald-500/60 transition-colors rounded-full" />
                     
                     <div 
                        className="bg-background/90 backdrop-blur-md rounded-2xl p-4 border border-border/50 shadow-sm hover:shadow-lg transition-all ring-1 ring-black/5 dark:ring-white/5 relative z-10 w-full max-w-[240px] mx-auto group/cat"
                        onContextMenu={(e) => {
                           if (e.target === e.currentTarget || (e.target as HTMLElement).className.includes('space-y-')) {
                              e.preventDefault();
                              e.stopPropagation();
                              toast({ title: "AI 分析中", description: `正在为您补全【${cat}】分类...` });
                              setTimeout(() => {
                                 addCause(cat);
                                 handleUpdateCause(cat, fishboneData[cat][fishboneData[cat].length]?.id || '', 'AI 预测原因');
                              }, 1000);
                           }
                        }}
                     >
                       <div className="flex items-center justify-between mb-4 border-b border-border/50 pb-3">
                         <div className="flex items-center gap-2">
                           <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/50 group-hover/branch:bg-emerald-500"></span>
                           <span className="font-bold text-sm text-foreground whitespace-nowrap">{cat}</span>
                         </div>
                         <div className="flex items-center opacity-0 group-hover/cat:opacity-100 transition-opacity">
                           <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full hover:bg-emerald-500/10 hover:text-emerald-600 bg-muted/50" onClick={() => addCause(cat)}>
                             <Plus className="h-3.5 w-3.5" />
                           </Button>
                         </div>
                       </div>
                       <div className="space-y-2.5 max-h-[200px] overflow-y-auto pr-1 custom-scrollbar">
                         {fishboneData[cat].length === 0 && (
                           <div className="text-xs text-muted-foreground/50 italic text-center py-2">无原因，点击 + 添加</div>
                         )}
                         {renderNodes(fishboneData[cat], cat)}
                       </div>
                     </div>
                  </div>
               ))}
            </div>

            {/* Bottom Categories */}
            <div className="flex justify-between w-full mt-4">
               {bottomCategories.map((cat) => (
                  <div key={cat} className="flex-1 px-4 relative flex flex-col justify-start group/branch">
                     <div className="absolute top-[-3rem] left-1/2 w-[3px] h-[calc(100%+3rem)] bg-emerald-500/30 -rotate-[35deg] origin-top -z-10 group-hover/branch:bg-emerald-500/60 transition-colors rounded-full" />
                     
                     <div 
                        className="bg-background/90 backdrop-blur-md rounded-2xl p-4 border border-border/50 shadow-sm hover:shadow-lg transition-all ring-1 ring-black/5 dark:ring-white/5 relative z-10 w-full max-w-[240px] mx-auto group/cat mt-12"
                        onContextMenu={(e) => {
                           if (e.target === e.currentTarget || (e.target as HTMLElement).className.includes('space-y-')) {
                              e.preventDefault();
                              e.stopPropagation();
                              toast({ title: "AI 分析中", description: `正在为您补全【${cat}】分类...` });
                              setTimeout(() => {
                                 addCause(cat);
                                 handleUpdateCause(cat, fishboneData[cat][fishboneData[cat].length]?.id || '', 'AI 预测原因');
                              }, 1000);
                           }
                        }}
                     >
                       <div className="flex items-center justify-between mb-4 border-b border-border/50 pb-3">
                         <div className="flex items-center gap-2">
                           <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/50 group-hover/branch:bg-emerald-500"></span>
                           <span className="font-bold text-sm text-foreground whitespace-nowrap">{cat}</span>
                         </div>
                         <div className="flex items-center opacity-0 group-hover/cat:opacity-100 transition-opacity">
                           <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full hover:bg-emerald-500/10 hover:text-emerald-600 bg-muted/50" onClick={() => addCause(cat)}>
                             <Plus className="h-3.5 w-3.5" />
                           </Button>
                         </div>
                       </div>
                       <div className="space-y-2.5 max-h-[200px] overflow-y-auto pr-1 custom-scrollbar">
                         {fishboneData[cat].length === 0 && (
                           <div className="text-xs text-muted-foreground/50 italic text-center py-2">无原因，点击 + 添加</div>
                         )}
                         {renderNodes(fishboneData[cat], cat)}
                       </div>
                     </div>
                  </div>
               ))}
            </div>
          </div>
        </div>

        {/* Canvas Controls */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-background/80 backdrop-blur-md border border-border/50 rounded-full p-1.5 shadow-sm z-30">
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-emerald-500/10 hover:text-emerald-600" onClick={() => setFishboneZoom(z => Math.max(0.5, z - 0.1))}><ZoomOut className="h-4 w-4" /></Button>
          <span className="text-xs font-mono w-12 text-center text-muted-foreground">{Math.round(fishboneZoom * 100)}%</span>
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-emerald-500/10 hover:text-emerald-600" onClick={() => setFishboneZoom(z => Math.min(2, z + 0.1))}><ZoomIn className="h-4 w-4" /></Button>
          <div className="w-px h-4 bg-border mx-2" />
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-emerald-500/10 hover:text-emerald-600" onClick={() => setFishboneZoom(1)}><Maximize2 className="h-4 w-4" /></Button>
        </div>
      </div>

      {/* Right AI Sidebar */}
      <div className="w-80 border-l border-border/50 bg-background flex flex-col shrink-0 z-10 shadow-[-2px_0_8px_rgba(0,0,0,0.02)]">
        <div className="p-4 border-b border-border/50 border-dashed bg-gradient-to-br from-emerald-50/50 to-transparent dark:from-emerald-950/20">
           <Button 
               className="w-full gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 shadow-md font-medium" 
               onClick={() => {
                  toast({ title: "AI 一键生成", description: "正在调用知识库生成全图..." });
                  setTimeout(() => {
                     setFishboneData({
                        '人员 (Man)': [{ id: '1', text: '操作员培训不足', children: [{id: '1a', text: '师傅带徒弟未标准化'}, {id: '1b', text: '新员工考核松散'}] }, { id: '2', text: '疲劳作业' }],
                        '机器 (Machine)': [{ id: '3', text: '设备老化', children: [{id: '3a', text: '机床主轴轴承磨损'}] }, { id: '4', text: '维护保养不及时' }],
                        '物料 (Material)': [{ id: '5', text: '同批次闸瓦材质过硬', isMainCause: true, children: [{id: '5a', text: '摩擦树脂配方含碳量超标'}] }, { id: '6', text: '供应商变更' }],
                        '方法 (Method)': [{ id: '7', text: '工艺参数设置错误', children: [{id: '7a', text: '操作指导书参数未更新'}] }],
                        '测量 (Measurement)': [{ id: '8', text: '量具精度不够', children: [{id: '8a', text: '未定期校验游标卡尺'}] }],
                        '环境 (Environment)': [{ id: '9', text: '车间粉尘过大' }],
                     });
                     toast({ title: "生成完成", description: "已根据历史工单为您自动补全 5M1E 结构。", variant: "success" });
                  }, 1500);
               }}
           >
              <Sparkles className="h-4 w-4" /> ✨ 一键生成 (AI)
           </Button>
           <p className="text-xs text-muted-foreground text-center mt-3">支持从 5M1E、4M 模型智能发散</p>
        </div>

        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 custom-scrollbar">
           {/* AI Chat History */}
           <div className="flex flex-col gap-1.5">
             <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded-md bg-emerald-100 flex items-center justify-center text-emerald-600"><Sparkles className="h-3 w-3" /></div>
                <span className="text-xs font-medium text-emerald-800 dark:text-emerald-300">Queen AI</span>
             </div>
             <div className="text-sm p-3 bg-muted/40 border border-border/50 rounded-xl rounded-tl-sm text-foreground">
                <p>已识别问题：<strong>制动盘表面异常磨损</strong>。</p>
                <p className="mt-2 text-muted-foreground">有什么我可以帮您的？您可以通过自然语言修改画布，例如：</p>
                <div className="mt-2 space-y-1">
                   <div className="text-xs bg-background border border-border/50 px-2 py-1.5 rounded cursor-pointer hover:border-emerald-500/50 transition-colors" onClick={() => {
                        toast({ title: "执行指令", description: "执行操作：补充几条机器老化相关的原因" });
                        setTimeout(() => {
                           setFishboneData(prev => ({
                              ...prev,
                              '机器 (Machine)': [{ id: '3', text: '设备老化', children: [{ id: 'newAI1', text: '主轴承磨损严重' }, { id: 'newAI2', text: '冷却液系统故障' }] }, ...prev['机器 (Machine)'].filter(n => n.id !== '3')]
                           }));
                           toast({ title: "执行完成", variant: "success" });
                        }, 1000);
                   }}>"补充几条机器老化相关的原因"</div>
                   <div className="text-xs bg-background border border-border/50 px-2 py-1.5 rounded cursor-pointer hover:border-emerald-500/50 transition-colors" onClick={() => {
                        toast({ title: "指令处理中", description: "正在分析已标记为红色的主因..." });
                        setTimeout(() => {
                           handleConfirm();
                        }, 1500);
                   }}>"汇总主因生成并导出 D4 部分"</div>
                </div>
             </div>
           </div>
        </div>

        <div className="p-4 border-t border-border/50 bg-background">
          <div className="relative">
            <textarea 
               className="w-full h-20 resize-none rounded-xl border border-border/50 bg-muted/20 p-3 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all custom-scrollbar placeholder:text-muted-foreground"
               placeholder="输入指令，如：深度挖掘关于闸瓦材质的可能原因..."
            />
            <Button size="icon" className="absolute right-2 bottom-2 h-7 w-7 rounded-lg bg-emerald-500 hover:bg-emerald-600">
               <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>
            </Button>
          </div>
        </div>
      </div>
    </>
  );

  const renderIsIsNot = () => (
    <div className="grid gap-6 md:grid-cols-3">
      <div className="md:col-span-2 space-y-6">
        <Card className="glass-panel hover:shadow-lg transition-all duration-300">
          <CardHeader className="border-b border-border/50 pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <SplitSquareHorizontal className="h-5 w-5 text-purple-500" />
              IS / IS NOT 分析
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground bg-muted/30 border-b border-border/50">
                  <tr>
                    <th className="px-4 py-3 font-medium w-1/4">维度</th>
                    <th className="px-4 py-3 font-medium w-3/8">IS (是什么)</th>
                    <th className="px-4 py-3 font-medium w-3/8">IS NOT (不是什么)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {[
                    { dim: 'What (对象/缺陷)', is: '制动盘表面异常磨损', isnot: '制动盘断裂或变形' },
                    { dim: 'Where (位置)', is: '接触摩擦面', isnot: '安装孔或非摩擦区域' },
                    { dim: 'When (时间)', is: '列车运行 5000 公里后', isnot: '出厂测试阶段' },
                    { dim: 'Who/Extent (范围)', is: '特定批次 (批次号: B202603)', isnot: '所有批次的制动盘' },
                  ].map((row, idx) => (
                    <tr key={idx}>
                      <td className="px-4 py-3 font-medium text-foreground">{row.dim}</td>
                      <td className="px-4 py-3"><Input defaultValue={row.is} className="bg-muted/30" /></td>
                      <td className="px-4 py-3"><Input defaultValue={row.isnot} className="bg-muted/30" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
      <div className="space-y-6">
        <Card className="glass-panel hover:shadow-lg transition-all duration-300 border-purple-200/50 bg-gradient-to-b from-purple-50/50 to-transparent dark:from-purple-900/10">
          <CardHeader className="border-b border-purple-100/50 dark:border-purple-800/50 pb-4">
            <CardTitle className="text-lg flex items-center gap-2 text-purple-700 dark:text-purple-400">
              <Sparkles className="h-5 w-5" />
              AI 辅助分析
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="text-sm space-y-4">
              <p className="text-muted-foreground">AI 边界界定建议：</p>
              <div className="p-4 rounded-xl bg-white dark:bg-card text-purple-900 dark:text-purple-100 border border-purple-100 dark:border-purple-800 shadow-sm leading-relaxed">
                <p>通过对比 IS 和 IS NOT，问题集中在<strong>特定批次</strong>的<strong>摩擦面</strong>上，这排除了系统性设计缺陷，强烈指向<strong>近期生产批次的物料或工艺变更</strong>。</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderFlowchart = () => (
    <div className="grid gap-6 md:grid-cols-3">
      <div className="md:col-span-2 space-y-6">
        <Card className="glass-panel hover:shadow-lg transition-all duration-300">
          <CardHeader className="border-b border-border/50 pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Workflow className="h-5 w-5 text-orange-500" />
              流程图分析
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
              {[
                { step: '原材料采购', desc: '采购摩擦材料及金属背板', status: 'normal' },
                { step: '入厂检验', desc: '外观、尺寸抽检 (未包含硬度必检)', status: 'warning' },
                { step: '配料与混合', desc: '按配方比例混合摩擦材料', status: 'error' },
                { step: '热压成型', desc: '高温高压下压制成型', status: 'normal' },
                { step: '出厂检验', desc: '成品性能测试', status: 'normal' },
              ].map((item, idx) => (
                <div key={idx} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-background bg-muted text-muted-foreground shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                    {idx + 1}
                  </div>
                  <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-border/50 bg-background shadow-sm group-hover:shadow-md transition-all">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-bold text-foreground">{item.step}</h3>
                      {item.status === 'error' && <span className="flex h-2 w-2 rounded-full bg-destructive"></span>}
                      {item.status === 'warning' && <span className="flex h-2 w-2 rounded-full bg-warning"></span>}
                    </div>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
      <div className="space-y-6">
        <Card className="glass-panel hover:shadow-lg transition-all duration-300 border-orange-200/50 bg-gradient-to-b from-orange-50/50 to-transparent dark:from-orange-900/10">
          <CardHeader className="border-b border-orange-100/50 dark:border-orange-800/50 pb-4">
            <CardTitle className="text-lg flex items-center gap-2 text-orange-700 dark:text-orange-400">
              <Sparkles className="h-5 w-5" />
              AI 辅助分析
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="text-sm space-y-4">
              <p className="text-muted-foreground">流程断点识别：</p>
              <div className="p-4 rounded-xl bg-white dark:bg-card text-orange-900 dark:text-orange-100 border border-orange-100 dark:border-orange-800 shadow-sm leading-relaxed">
                <p>AI 识别到 <strong>入厂检验</strong> 环节存在漏洞（未包含硬度必检），且 <strong>配料与混合</strong> 环节可能发生了未受控的变更。建议重点排查这两个流程节点。</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderSipoc = () => (
    <div className="grid gap-6 md:grid-cols-3">
      <div className="md:col-span-2 space-y-6">
        <Card className="glass-panel hover:shadow-lg transition-all duration-300">
          <CardHeader className="border-b border-border/50 pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Layers className="h-5 w-5 text-indigo-500" />
              SIPOC 模型
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-5 gap-2 text-center">
              {[
                { title: 'S (供应商)', items: ['摩擦材料供应商', '背板供应商'] },
                { title: 'I (输入)', items: ['原材料', '配方规范', '检验标准'] },
                { title: 'P (过程)', items: ['配料', '热压', '机加工', '检验'] },
                { title: 'O (输出)', items: ['成品闸瓦', '检验报告'] },
                { title: 'C (客户)', items: ['主机厂', '终端车主'] },
              ].map((col, idx) => (
                <div key={idx} className="space-y-3">
                  <div className="font-bold text-sm bg-muted/50 py-2 rounded-lg border border-border/50">{col.title}</div>
                  <div className="space-y-2">
                    {col.items.map((item, i) => (
                      <div key={i} className="text-xs p-2 bg-background border border-border/50 rounded shadow-sm">{item}</div>
                    ))}
                    <Button variant="ghost" size="sm" className="w-full h-6 text-muted-foreground hover:text-primary"><Plus className="h-3 w-3" /></Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
      <div className="space-y-6">
        <Card className="glass-panel hover:shadow-lg transition-all duration-300 border-indigo-200/50 bg-gradient-to-b from-indigo-50/50 to-transparent dark:from-indigo-900/10">
          <CardHeader className="border-b border-indigo-100/50 dark:border-indigo-800/50 pb-4">
            <CardTitle className="text-lg flex items-center gap-2 text-indigo-700 dark:text-indigo-400">
              <Sparkles className="h-5 w-5" />
              AI 辅助分析
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="text-sm space-y-4">
              <p className="text-muted-foreground">宏观视角分析：</p>
              <div className="p-4 rounded-xl bg-white dark:bg-card text-indigo-900 dark:text-indigo-100 border border-indigo-100 dark:border-indigo-800 shadow-sm leading-relaxed">
                <p>在 SIPOC 链条中，<strong>输入 (I)</strong> 环节的“配方规范”与 <strong>供应商 (S)</strong> 的实际执行存在脱节。建议加强对 S 到 I 环节的质量控制和变更管理。</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  if (activeTool === 'fishbone') {
    return <FishboneCanvasWorkspace issueId={issueId} onClose={() => setActiveTool(null)} />;
  }

  return (
    <div className="flex flex-col gap-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => activeTool ? setActiveTool(null) : navigate(-1)} className="rounded-full hover:bg-muted">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight font-serif text-primary-900 dark:text-primary-100">
              {activeTool ? tools.find(t => t.id === activeTool)?.name : '根因分析工具箱'}
            </h1>
            <p className="text-muted-foreground mt-1">关联问题: <span className="font-mono text-foreground">{issueId}</span> - 制动盘表面出现异常磨损</p>
          </div>
        </div>
        {activeTool && (
          <div className="flex gap-3">
            <Button variant="outline" className="gap-2 rounded-full hover:bg-primary/5 hover:text-primary transition-colors" onClick={handleSave} isLoading={isSaving}>
              <Save className="h-4 w-4" />
              保存草稿
            </Button>
            <Button className="gap-2 rounded-full shadow-md hover:shadow-lg transition-all" onClick={handleConfirm} isLoading={isConfirming}>
              <CheckCircle2 className="h-4 w-4" />
              确认根因
            </Button>
          </div>
        )}
      </div>

      {/* Issue Workspace Navigation */}
      <div className="flex items-center gap-1 border-b border-border/50 pb-px -mt-2">
        <Link to={`/issues/${issueId}`} className="flex items-center gap-2 px-6 py-3 border-b-2 border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors rounded-t-lg">
          <LayoutDashboard className="h-4 w-4" />
          问题总览
        </Link>
        <Link to={`/tasks?issueId=${issueId}`} className="flex items-center gap-2 px-6 py-3 border-b-2 border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors rounded-t-lg">
          <ListTodo className="h-4 w-4" />
          子任务管理
        </Link>
        <Link to={`/rca/${issueId}`} className="flex items-center gap-2 px-6 py-3 border-b-2 border-primary text-primary font-medium transition-colors bg-primary/5 rounded-t-lg" onClick={() => setActiveTool(null)}>
          <Search className="h-4 w-4" />
          根因分析工具箱
        </Link>
        <Link to={`/8d-reports/${issueId}`} className="flex items-center gap-2 px-6 py-3 border-b-2 border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors rounded-t-lg">
          <FileText className="h-4 w-4" />
          8D 报告
        </Link>
      </div>

      {!activeTool && renderToolbox()}
      {activeTool === '5why' && render5Why()}
      {activeTool === 'fishbone' && renderFishbone()}
      {activeTool === 'is-isnot' && renderIsIsNot()}
      {activeTool === 'flowchart' && renderFlowchart()}
      {activeTool === 'sipoc' && renderSipoc()}
    </div>
  );
}
