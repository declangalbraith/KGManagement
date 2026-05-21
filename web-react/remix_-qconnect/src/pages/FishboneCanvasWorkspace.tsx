import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, Edit2, Clock, MoreHorizontal, Share2, ClipboardList,
  Plus, Undo2, Redo2, Palette, AlignCenter, ZoomIn, ZoomOut, 
  LayoutTemplate, MessageSquare, Paperclip, Sparkles, Settings, 
  X, ChevronDown, Check, ChevronRight, Minimize2, Trash2, Link as LinkIcon
} from 'lucide-react';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { Badge } from '@/src/components/ui/badge';
import { useToast } from '@/src/components/ui/use-toast';

interface CauseNode {
  id: string;
  text: string;
  isMainCause?: boolean;
  children?: CauseNode[];
  isAiGhost?: boolean;
  confidence?: number;
}

export function FishboneCanvasWorkspace({ issueId, onClose }: { issueId: string, onClose: () => void }) {
  const { toast } = useToast();
  const [zoom, setZoom] = useState(1);
  const [isAiPanelOpen, setIsAiPanelOpen] = useState(true);
  const [aiState, setAiState] = useState<'idle' | 'configuring' | 'generating' | 'reviewing'>('idle');
  const [genProgress, setGenProgress] = useState(0);
  
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  
  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      setZoom(z => Math.min(Math.max(0.1, z - e.deltaY * 0.005), 3));
    } else {
      setPan(p => ({ x: p.x - e.deltaX, y: p.y - e.deltaY }));
    }
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.button === 1 || e.button === 0) {
      setIsPanning(true);
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (isPanning) {
      setPan(p => ({ x: p.x + e.movementX, y: p.y + e.movementY }));
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsPanning(false);
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch (err) {}
  };

  const [fishboneData, setFishboneData] = useState<Record<string, CauseNode[]>>({
    '人 (Man)': [{ id: '1', text: '培训不足' }],
    '机 (Machine)': [{ id: '2', text: '模具温度控制偏差', isMainCause: true }],
    '料 (Material)': [],
    '法 (Method)': [],
    '环 (Environment)': [],
    '测 (Measurement)': [],
  });

  const catColors: Record<string, string> = {
    '人 (Man)': '#3B82F6',
    '机 (Machine)': '#8B5CF6',
    '料 (Material)': '#10B981',
    '法 (Method)': '#F59E0B',
    '环 (Environment)': '#06B6D4',
    '测 (Measurement)': '#EC4899',
  };

  const handleGenerateClick = () => {
    setAiState('configuring');
  };

  const startGeneration = () => {
    setAiState('generating');
    setGenProgress(0);
    
    // set ghost data
    setFishboneData({
      '人 (Man)': [
        { id: '1', text: '培训不足' },
        { id: 'ghost_1', text: '操作员入职未满月', isAiGhost: true, confidence: 0.85 },
        { id: 'ghost_2', text: '疲劳作业', isAiGhost: true, confidence: 0.68 }
      ],
      '机 (Machine)': [
        { id: '2', text: '模具温度控制偏差', isMainCause: true },
        { id: 'ghost_3', text: '冷却管道堵塞', isAiGhost: true, confidence: 0.91 }
      ],
      '料 (Material)': [{ id: 'ghost_4', text: '再生料比例过高', isAiGhost: true, confidence: 0.72 }],
      '法 (Method)': [{ id: 'ghost_5', text: '保压时间不足', isAiGhost: true, confidence: 0.88 }],
      '环 (Environment)': [],
      '测 (Measurement)': [],
    });

    let p = 0;
    const interval = setInterval(() => {
      p += 5;
      setGenProgress(p);
      if (p >= 100) {
        clearInterval(interval);
        setAiState('reviewing');
      }
    }, 100);
  };

  const applyAiSelections = () => {
    setFishboneData(prev => {
      const next = { ...prev };
      Object.keys(next).forEach(cat => {
        next[cat] = next[cat].map(n => ({ ...n, isAiGhost: false }));
      });
      return next;
    });
    setAiState('idle');
    toast({ title: "已应用", description: "已将选中的 AI 生成原因合并到画布中", variant: "success" });
  };

  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{ id: string, cat: string, x: number, y: number } | null>(null);

  useEffect(() => {
    const hideMenu = () => setContextMenu(null);
    window.addEventListener('click', hideMenu);
    return () => window.removeEventListener('click', hideMenu);
  }, []);

  const updateNodeText = (cat: string, id: string, text: string) => {
    setFishboneData(prev => {
      const next = { ...prev };
      next[cat] = next[cat].map(n => n.id === id ? { ...n, text } : n);
      return next;
    });
  };

  const renderCanvasNode = (node: CauseNode, catColor: string, catName: string) => {
    return (
      <div 
         key={node.id} 
         className="relative group/node flex items-center mb-4 last:mb-0" 
         onPointerDown={e => {
           if (e.button !== 2) e.stopPropagation();
         }}
         onContextMenu={e => {
           e.preventDefault();
           setContextMenu({ id: node.id, cat: catName, x: e.clientX, y: e.clientY });
         }}
      >
        <div className="w-8 border-t border-slate-300"></div>
        <div className={`relative px-3 py-1 flex items-center gap-2 transition-colors ${node.isAiGhost ? 'border-2 border-dashed border-purple-400 bg-purple-50 text-purple-600' : 'text-slate-700'}`}>
           <div className={`w-2 h-2 rounded-full ${node.isMainCause ? 'bg-red-500 w-3 h-3' : ''} ${node.isAiGhost ? 'border-2 border-dashed border-purple-400 bg-transparent' : ''}`} style={{ backgroundColor: (!node.isMainCause && !node.isAiGhost) ? catColor : undefined }}></div>
           
           {editingNodeId === node.id ? (
             <input 
               autoFocus
               defaultValue={node.text}
               onBlur={e => {
                 updateNodeText(catName, node.id, e.target.value);
                 setEditingNodeId(null);
               }}
               onKeyDown={e => {
                 if (e.key === 'Enter') e.currentTarget.blur();
               }}
               className="text-[13px] font-medium bg-transparent border-none outline-none focus:ring-1 focus:ring-blue-500 rounded px-1 w-[120px]"
             />
           ) : (
             <span onDoubleClick={() => !node.isAiGhost && setEditingNodeId(node.id)} className={`text-[13px] ${node.isMainCause ? 'font-bold text-red-600' : 'font-medium'} ${node.isAiGhost ? 'opacity-70' : ''}`}>{node.text}</span>
           )}

           {node.isAiGhost && <Sparkles className="w-3 h-3 text-purple-500 absolute -top-1.5 -right-1.5 bg-white rounded-full" />}
           
           {/* Node Hover Toolbar */}
           {!editingNodeId && !node.isAiGhost && (
             <div className="absolute left-1/2 bottom-full mb-1 -translate-x-1/2 opacity-0 group-hover/node:opacity-100 transition-opacity bg-white shadow-md rounded-md p-1 flex items-center gap-1 z-30 border border-slate-200">
               <Button variant="ghost" size="icon" className="w-6 h-6 text-purple-500 hover:bg-purple-50"><Sparkles className="w-3 h-3"/></Button>
               <Button variant="ghost" size="icon" className="w-6 h-6"><Plus className="w-3 h-3"/></Button>
               <Button variant="ghost" size="icon" className="w-6 h-6"><MessageSquare className="w-3 h-3"/></Button>
               <Button variant="ghost" size="icon" className="w-6 h-6"><MoreHorizontal className="w-3 h-3"/></Button>
             </div>
           )}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-50 flex flex-col font-sans">
      {/* 1. Header */}
      <header className="h-[56px] border-b border-slate-200 bg-white flex items-center justify-between px-4 shrink-0 shadow-sm z-20">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="w-8 h-8 rounded-full hover:bg-slate-100" onClick={onClose}>
            <ArrowLeft className="w-4 h-4 text-slate-600" />
          </Button>
          <div className="flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-slate-500" />
            <h1 className="text-[18px] font-semibold text-slate-900 leading-[28px] cursor-pointer hover:bg-slate-50 px-1 rounded transition-colors">
              注塑件表面缩痕分析
            </h1>
            <Badge variant="secondary" className="bg-slate-100 text-slate-500 hover:bg-slate-200 h-[22px] px-2 text-[12px] font-normal">草稿</Badge>
          </div>
          <div className="h-4 w-px bg-slate-200 mx-2"></div>
          <span className="text-[12px] text-slate-500">
            关联工单 <a href="#" className="text-blue-600 hover:underline">#{issueId}</a>
          </span>
        </div>

        <div className="flex items-center gap-2 flex-1 justify-center relative left-12">
           <div className="flex -space-x-2">
              <div className="w-7 h-7 rounded-full bg-blue-100 border-2 border-white flex items-center justify-center text-[10px] font-bold text-blue-700 relative">
                张
                <div className="absolute right-0 bottom-0 w-2 h-2 bg-emerald-500 rounded-full border border-white"></div>
              </div>
              <div className="w-7 h-7 rounded-full bg-emerald-100 border-2 border-white flex items-center justify-center text-[10px] font-bold text-emerald-700 relative">
                李
                <div className="absolute right-0 bottom-0 w-2 h-2 bg-amber-500 rounded-full border border-white"></div>
              </div>
              <div className="w-7 h-7 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center text-[10px] font-bold text-slate-600">
                +2
              </div>
           </div>
           <span className="text-[12px] text-slate-500 ml-2">3人在线</span>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="w-8 h-8 rounded-full hover:bg-slate-100 text-slate-600">
            <Clock className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" className="w-8 h-8 rounded-full hover:bg-slate-100 text-slate-600">
            <MoreHorizontal className="w-4 h-4" />
          </Button>
          <Button className="h-[36px] px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-md gap-2 shadow-sm font-medium">
             <Share2 className="w-4 h-4" /> 分享
          </Button>
        </div>
      </header>

      {/* Main Area */}
      <div className="flex-1 flex overflow-hidden">
         {/* Left Toolbar */}
         <aside className="w-[56px] border-r border-slate-200 bg-white flex flex-col items-center py-3 gap-1 shrink-0 z-10 shadow-[1px_0_4px_rgba(0,0,0,0.02)]">
            <ToolbarButton icon={Plus} active />
            <div className="w-8 h-px bg-slate-200 my-1 font-sans"></div>
            <ToolbarButton icon={Undo2} />
            <ToolbarButton icon={Redo2} />
            <div className="w-8 h-px bg-slate-200 my-1 font-sans"></div>
            <ToolbarButton icon={Palette} />
            <ToolbarButton icon={AlignCenter} />
            <ToolbarButton icon={ZoomIn} />
            <div className="w-8 h-px bg-slate-200 my-1 font-sans"></div>
            <ToolbarButton icon={LayoutTemplate} />
            <ToolbarButton icon={MessageSquare} />
            <ToolbarButton icon={Paperclip} />
         </aside>

         {/* Center Canvas */}
         <main 
            className="flex-1 relative bg-[#F8FAFC] overflow-hidden select-none cursor-grab active:cursor-grabbing" 
            onWheel={handleWheel}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
            style={{ 
               backgroundImage: `radial-gradient(circle at ${10 + pan.x}px ${10 + pan.y}px, rgba(203, 213, 225, 0.4) 1px, transparent 0)`, 
               backgroundSize: '20px 20px',
               backgroundPosition: `${pan.x % 20}px ${pan.y % 20}px` 
            }}>
            
            <div className="absolute inset-0 flex items-center justify-center transition-transform origin-center" style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }}>
               <div className="w-full max-w-[1000px] h-full min-h-[600px] relative flex items-center">
                  
                  {/* Fish Head */}
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 z-20">
                    <div className="w-[220px] h-[72px] bg-slate-900 text-white flex flex-col justify-center pl-4 pr-6 shadow-md relative" 
                         style={{ clipPath: 'polygon(0% 0%, 85% 0%, 100% 50%, 85% 100%, 0% 100%)', borderRadius: '8px 0 0 8px' }}>
                       <h3 className="text-[14px] font-semibold leading-[20px] mb-1">注塑件表面出现缩痕</h3>
                       <p className="text-[12px] opacity-70">不良率 8% | 2026-04-28</p>
                    </div>
                  </div>

                  {/* Main Spine */}
                  <div className="absolute left-[80px] right-[210px] top-1/2 h-[3px] bg-slate-700 z-10 -translate-y-1/2 shadow-sm"></div>

                  {/* Top Branches (Man, Material, Environment) */}
                  <div className="absolute left-[150px] right-[250px] top-[10%] bottom-1/2 flex justify-between px-10">
                    {['人 (Man)', '料 (Material)', '环 (Environment)'].map((cat, i) => (
                      <div key={cat} className="relative flex-1 flex justify-center h-full">
                         {/* Branch Line */}
                         <div className="absolute bottom-0 w-[3px] h-full origin-bottom -rotate-[60deg] z-0" style={{ backgroundColor: catColors[cat] }}></div>
                         
                         {/* Category Capsule */}
                         <div className="absolute top-10 whitespace-nowrap z-20" style={{ transform: 'translateX(60px)' }}>
                           <div className="h-[32px] px-4 rounded-full text-white font-semibold text-[14px] flex items-center shadow-md border-2 border-white" style={{ backgroundColor: catColors[cat] }}>
                             {cat}
                           </div>
                           <div className="mt-6 flex flex-col items-end gap-2 pr-12">
                             {fishboneData[cat]?.map(node => renderCanvasNode(node, catColors[cat], cat))}
                           </div>
                         </div>
                      </div>
                    ))}
                  </div>

                  {/* Bottom Branches (Machine, Method, Measurement) */}
                  <div className="absolute left-[200px] right-[200px] top-1/2 bottom-[10%] flex justify-between px-10">
                     {['机 (Machine)', '法 (Method)', '测 (Measurement)'].map((cat, i) => (
                      <div key={cat} className="relative flex-1 flex justify-center h-full">
                         {/* Branch Line */}
                         <div className="absolute top-0 w-[3px] h-full origin-top rotate-[60deg] z-0" style={{ backgroundColor: catColors[cat] }}></div>
                         
                         {/* Category Capsule */}
                         <div className="absolute bottom-10 whitespace-nowrap z-20" style={{ transform: 'translateX(-60px)' }}>
                           <div className="mb-6 flex flex-col items-start gap-2 pl-12">
                             {fishboneData[cat]?.map(node => renderCanvasNode(node, catColors[cat], cat))}
                           </div>
                           <div className="h-[32px] px-4 rounded-full text-white font-semibold text-[14px] flex items-center shadow-md border-2 border-white" style={{ backgroundColor: catColors[cat] }}>
                             {cat}
                           </div>
                         </div>
                      </div>
                    ))}
                  </div>

               </div>
            </div>

            {/* Minimap & Controls */}
            <div className="absolute right-6 bottom-6 flex flex-col items-end gap-3 z-30">
               <div className="w-[160px] h-[100px] bg-white/80 backdrop-blur shadow-lg rounded-lg border border-slate-200 relative p-1.5">
                  <div className="w-[40px] h-[30px] bg-slate-300 pointer-events-none absolute left-8 top-6 border border-slate-400"></div>
                  <div className="text-[10px] text-slate-400 font-medium absolute bottom-2 left-2">小地图</div>
               </div>
               <div className="h-[36px] bg-white shadow-md rounded-md flex items-center border border-slate-200">
                 <Button variant="ghost" size="icon" className="w-[36px] h-full rounded-none rounded-l-md hover:bg-slate-100" onClick={() => setZoom(z => Math.max(0.5, z-0.1))}><ZoomOut className="w-4 h-4 text-slate-600"/></Button>
                 <div className="w-[48px] text-center text-[12px] font-medium text-slate-700">{Math.round(zoom * 100)}%</div>
                 <Button variant="ghost" size="icon" className="w-[36px] h-full rounded-none hover:bg-slate-100" onClick={() => setZoom(z => Math.min(2, z+0.1))}><ZoomIn className="w-4 h-4 text-slate-600"/></Button>
                 <div className="w-px h-6 bg-slate-200 mx-1"></div>
                 <Button variant="ghost" size="icon" className="w-[36px] h-full rounded-none rounded-r-md hover:bg-slate-100" title="适应窗口" onClick={() => setZoom(1)}><Minimize2 className="w-4 h-4 text-slate-600"/></Button>
               </div>
            </div>
         </main>

         {/* Right AI Panel */}
         <aside className={`border-l border-slate-200 bg-white flex flex-col shrink-0 transition-all duration-300 z-20 shadow-[-4px_0_12px_rgba(0,0,0,0.03)] ${isAiPanelOpen ? 'w-[360px]' : 'w-0 overflow-hidden'}`}>
            <div className="h-[52px] border-b border-slate-200 flex items-center justify-between px-4 shrink-0">
               <div className="flex items-center gap-2">
                 <Sparkles className="w-4 h-4 text-purple-500" />
                 <span className="font-semibold text-[16px] text-slate-900">AI 助手</span>
               </div>
               <div className="flex items-center gap-1">
                 <Button variant="ghost" size="icon" className="w-8 h-8 rounded-md text-slate-500"><Settings className="w-4 h-4"/></Button>
                 <Button variant="ghost" size="icon" className="w-8 h-8 rounded-md text-slate-500" onClick={() => setIsAiPanelOpen(false)}><ChevronRight className="w-4 h-4"/></Button>
               </div>
            </div>

            <div className="flex-1 bg-white overflow-y-auto">
              {aiState === 'idle' && (
                <div className="p-4">
                  <span className="text-[12px] text-slate-500 mb-6 block">基于 Claude · 已联网</span>
                  
                  {/* Big CTA */}
                  <div className="w-full h-[280px] rounded-[12px] p-6 flex flex-col items-center justify-center text-center border border-purple-100 shadow-sm relative overflow-hidden group/cta"
                       style={{ background: 'linear-gradient(135deg, #F3E8FF 0%, #EFF6FF 100%)' }}>
                     <Sparkles className="w-12 h-12 text-purple-500 mb-4 drop-shadow-md" />
                     <h3 className="text-[18px] font-semibold text-slate-800 mb-2">一键生成鱼骨图</h3>
                     <p className="text-[13px] text-slate-600 mb-6 leading-relaxed">
                       描述您的质量问题，<br/>AI 将基于 5M1E 框架自动<br/>生成完整的根因分析
                     </p>
                     <Button className="w-[180px] h-[44px] bg-purple-500 hover:bg-purple-600 text-white rounded-md flex items-center gap-2 shadow-md transition-all group-hover/cta:-translate-y-1" onClick={handleGenerateClick}>
                       <Sparkles className="w-4 h-4" /> 开始生成
                     </Button>
                  </div>
                  <div className="text-center mt-4">
                    <a href="#" className="text-[13px] text-blue-600 hover:underline inline-flex items-center gap-1">
                       或从模板开始 <ArrowLeft className="w-3 h-3 rotate-180"/>
                    </a>
                  </div>
                </div>
              )}

              {aiState === 'configuring' && (
                <div className="p-4 flex flex-col gap-5">
                  <div className="flex items-center justify-between">
                     <h3 className="font-semibold text-slate-800">生成参数配置</h3>
                     <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setAiState('idle')}><X className="w-4 h-4"/></Button>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-[13px] font-medium text-slate-700">问题描述 *</label>
                    <textarea className="w-full h-[80px] p-3 text-[13px] border border-slate-200 rounded-md bg-slate-50 focus:bg-white focus:border-purple-400 focus:ring-1 focus:ring-purple-400 resize-none outline-none" defaultValue="注塑件表面出现缩痕，不良率 8%"></textarea>
                    <div className="flex items-center gap-1 text-[12px] text-purple-600 bg-purple-50 px-2 py-1 rounded">
                      <span>💡 已自动从工单 #ISS-202604-001 导入</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[13px] font-medium text-slate-700">分析框架</label>
                    <div className="grid grid-cols-4 gap-2">
                      <div className="h-[48px] rounded-md border-2 border-purple-500 bg-purple-50 flex items-center justify-center text-[12px] font-semibold text-purple-800 cursor-pointer relative">
                         5M1E
                         <div className="absolute -top-1 -right-1 w-3 h-3 bg-purple-500 rounded-full border border-white"></div>
                      </div>
                      <div className="h-[48px] rounded-md border border-slate-200 hover:border-slate-300 flex items-center justify-center text-[12px] text-slate-600 cursor-pointer">4M</div>
                      <div className="h-[48px] rounded-md border border-slate-200 hover:border-slate-300 flex items-center justify-center text-[12px] text-slate-600 cursor-pointer">4P</div>
                      <div className="h-[48px] rounded-md border border-slate-200 hover:border-slate-300 flex items-center justify-center text-[12px] text-slate-600 cursor-pointer">自定义</div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[13px] font-medium text-slate-700">参考资料</label>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <input type="checkbox" id="ref1" defaultChecked className="w-4 h-4 accent-purple-500 rounded border-slate-300"/>
                        <label htmlFor="ref1" className="text-[13px] text-slate-600">关联历史同类工单 (找到 3 条)</label>
                      </div>
                      <div className="flex items-center gap-2">
                        <input type="checkbox" id="ref2" defaultChecked className="w-4 h-4 accent-purple-500 rounded border-slate-300"/>
                        <label htmlFor="ref2" className="text-[13px] text-slate-600">引用质量知识库 SOP</label>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100 mt-2">
                    <p className="text-[12px] text-slate-500 mb-4">预计消耗: ~2000 tokens · 约 8 秒</p>
                    <div className="flex gap-3">
                      <Button variant="outline" className="flex-1" onClick={() => setAiState('idle')}>取消</Button>
                      <Button className="flex-1 bg-purple-500 hover:bg-purple-600 text-white gap-2" onClick={startGeneration}>
                        <Sparkles className="w-4 h-4"/> 生成预览
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {aiState === 'generating' && (
                <div className="p-6 flex flex-col gap-6">
                   <div className="flex items-center justify-between">
                     <div className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-purple-500 animate-pulse" />
                        <span className="font-semibold text-slate-800">正在生成...</span>
                     </div>
                     <Button variant="ghost" size="sm" className="h-7 text-xs text-slate-500" onClick={() => setAiState('idle')}>停止</Button>
                   </div>
                   
                   <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                     <div className="h-full bg-gradient-to-r from-purple-400 to-purple-600 transition-all duration-300" style={{ width: `${genProgress}%` }}></div>
                   </div>
                   <div className="text-right text-[12px] font-medium text-purple-600 -mt-4">{genProgress}%</div>

                   <div className="space-y-3 font-mono text-[12px]">
                     <div className="flex items-center gap-2 text-emerald-600"><Check className="w-3 h-3"/> 分析问题描述</div>
                     <div className="flex items-center gap-2 text-emerald-600"><Check className="w-3 h-3"/> 检索历史相似案例 (3条)</div>
                     <div className="flex items-center gap-2 text-purple-600 animate-pulse"><Sparkles className="w-3 h-3"/> 生成 5M1E 各分类原因...</div>
                     <div className="pl-5 text-slate-500">
                        └ 人 <Check className="w-3 h-3 inline text-emerald-500"/> 机 <Check className="w-3 h-3 inline text-emerald-500"/> 料 ⟳ 法 ○ 环 ○ 测 ○
                     </div>
                   </div>
                </div>
              )}

              {aiState === 'reviewing' && (
                <div className="flex flex-col h-[calc(100vh-56px-44px)]">
                  <div className="p-4 border-b border-slate-100 shrink-0">
                     <h3 className="text-[14px] font-semibold text-slate-800 flex items-center gap-2">
                       <Sparkles className="w-4 h-4 text-purple-500"/> AI 已生成 5 个原因
                     </h3>
                     <p className="text-[12px] text-slate-500 mt-1">请审阅并选择保留的内容</p>
                     <div className="flex items-center gap-2 mt-4">
                        <Button variant="secondary" size="sm" className="flex-1 text-xs h-7">全部接受</Button>
                        <Button variant="outline" size="sm" className="flex-1 text-xs h-7">重新生成</Button>
                     </div>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-2">
                     <ReviewCategory title="人 (Man)" count="2/2" items={[
                       { label: '操作员入职未满月', badge: '历史匹配', score: 0.85 },
                       { label: '疲劳作业', score: 0.68 }
                     ]} />
                     <ReviewCategory title="机 (Machine)" count="1/1" items={[
                       { label: '冷却管道堵塞', badge: '推荐', score: 0.91 }
                     ]} />
                     <ReviewCategory title="料 (Material)" count="1/1" items={[
                       { label: '再生料比例过高', score: 0.72 }
                     ]} />
                     <ReviewCategory title="法 (Method)" count="1/1" items={[
                       { label: '保压时间不足', score: 0.88 }
                     ]} />
                  </div>

                  <div className="p-4 border-t border-slate-100 shrink-0 bg-slate-50">
                     <Button className="w-full bg-purple-500 hover:bg-purple-600 text-white shadow-md font-medium" onClick={applyAiSelections}>
                        应用所选 (5)
                     </Button>
                  </div>
                </div>
              )}
            </div>
         </aside>
      </div>

      {/* Footer */}
      <footer className="h-[44px] border-t border-slate-200 bg-white flex items-center justify-between px-4 shrink-0 shadow-[0_-1px_2px_rgba(0,0,0,0.02)] z-30">
         <div className="flex items-center gap-2 text-[12px] text-slate-500">
           <span>💾 已自动保存 · 13:42</span>
         </div>
         <div className="flex items-center gap-6 text-[12px] text-slate-500">
           <span className="font-medium text-slate-600 flex items-center gap-1.5"><LayoutTemplate className="w-3.5 h-3.5"/> 节点 18</span>
           <span className="font-medium text-slate-600 flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5 text-purple-500"/> AI 5</span>
           <span className="font-medium text-red-500 flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-red-500"></div> 主因 1</span>
         </div>
         <div className="flex items-center gap-2">
           <Button variant="ghost" size="sm" className="h-7 text-[12px] text-slate-600 font-medium">评论 (3) <div className="w-1.5 h-1.5 rounded-full bg-red-500 ml-1"></div></Button>
         </div>
      </footer>

      {/* Context Menu */}
      {contextMenu && (
        <div 
          className="fixed z-[100] bg-white rounded-lg shadow-lg border border-slate-200 w-[200px] py-1 text-[13px] text-slate-700 font-sans"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          <div className="px-3 py-1.5 hover:bg-slate-50 cursor-pointer flex items-center justify-between group">
            <span className="flex items-center gap-2"><Sparkles className="w-3.5 h-3.5 text-purple-500"/> AI 深挖此原因</span>
            <span className="text-slate-400 text-[11px] opacity-0 group-hover:opacity-100">⌘E</span>
          </div>
          <div className="px-3 py-1.5 hover:bg-slate-50 cursor-pointer flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-purple-500"/> 寻找相似案例
          </div>
          <div className="my-1 border-t border-slate-100"></div>
          <div className="px-3 py-1.5 hover:bg-slate-50 cursor-pointer flex items-center justify-between group" onClick={() => {
              setFishboneData(prev => {
                const next = {...prev};
                next[contextMenu.cat] = [...next[contextMenu.cat], { id: Math.random().toString(), text: '新原因' }];
                return next;
              });
              setEditingNodeId(contextMenu.id);
          }}>
            <span className="flex items-center gap-2"><Plus className="w-3.5 h-3.5"/> 添加同级原因</span>
            <span className="text-slate-400 text-[11px] opacity-0 group-hover:opacity-100">Enter</span>
          </div>
          <div className="px-3 py-1.5 hover:bg-slate-50 cursor-pointer flex items-center justify-between group" onClick={() => setEditingNodeId(contextMenu.id)}>
            <span className="flex items-center gap-2"><Edit2 className="w-3.5 h-3.5"/> 编辑</span>
            <span className="text-slate-400 text-[11px] opacity-0 group-hover:opacity-100">F2</span>
          </div>
          <div className="my-1 border-t border-slate-100"></div>
          <div className="px-3 py-1.5 hover:bg-slate-50 cursor-pointer flex items-center gap-2" onClick={() => {
              setFishboneData(prev => {
                const next = {...prev};
                next[contextMenu.cat] = next[contextMenu.cat].map(n => n.id === contextMenu.id ? {...n, isMainCause: !n.isMainCause} : n);
                return next;
              });
          }}>
            <span className="w-3.5 h-3.5 flex items-center justify-center text-[10px]">🔥</span> 标记为主因
          </div>
          <div className="my-1 border-t border-slate-100"></div>
          <div className="px-3 py-1.5 hover:bg-red-50 text-red-600 cursor-pointer flex items-center justify-between group" onClick={() => {
              setFishboneData(prev => {
                const next = {...prev};
                next[contextMenu.cat] = next[contextMenu.cat].filter(n => n.id !== contextMenu.id);
                return next;
              });
          }}>
            <span className="flex items-center gap-2"><Trash2 className="w-3.5 h-3.5"/> 删除</span>
            <span className="text-slate-400 text-[11px] opacity-0 group-hover:opacity-100">Del</span>
          </div>
        </div>
      )}
    </div>
  );
}

function ToolbarButton({ icon: Icon, active }: { icon: React.ElementType, active?: boolean }) {
  return (
    <Button 
      variant="ghost" 
      size="icon" 
      className={`w-10 h-10 rounded-lg transition-colors relative group ${active ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'}`}
    >
      {active && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-blue-600 rounded-r-full"></div>}
      <Icon className="w-5 h-5 stroke-[1.5]" />
    </Button>
  );
}

function ReviewCategory({ title, count, items }: { title: string, count: string, items: any[] }) {
  return (
    <div className="mb-4">
      <div className="flex items-center justify-between px-2 py-1.5 mb-1 cursor-pointer hover:bg-slate-50 rounded">
        <div className="flex items-center gap-1 text-[13px] font-semibold text-slate-700">
          <ChevronDown className="w-4 h-4 text-slate-400"/>
          {title}
        </div>
        <span className="text-[12px] text-slate-400">{count} 选中</span>
      </div>
      <div className="space-y-1 pl-4 pr-2">
        {items.map((item, i) => (
          <div key={i} className="flex items-center justify-between p-1.5 hover:bg-slate-50 rounded group/item text-[13px]">
            <div className="flex items-center gap-2 flex-1 overflow-hidden">
               <input type="checkbox" id={`chk-${title}-${i}`} defaultChecked className="w-4 h-4 accent-purple-500 rounded border-slate-300"/>
               <label htmlFor={`chk-${title}-${i}`} className="text-slate-700 truncate cursor-pointer font-medium">{item.label}</label>
               {item.badge && <Badge variant="secondary" className={`h-[18px] text-[10px] px-1 font-normal ${item.badge === '推荐' ? 'bg-purple-100 text-purple-700 border-purple-200' : 'bg-blue-100 text-blue-700 border-blue-200'}`}>{item.badge}</Badge>}
            </div>
            <div className={`text-[11px] font-mono shrink-0 ml-2 ${item.score > 0.8 ? 'text-emerald-600' : 'text-amber-600'}`}>
              {item.score.toFixed(2)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
