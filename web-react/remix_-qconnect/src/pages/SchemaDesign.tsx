import React, { useState, useMemo, useEffect } from 'react';
import { 
  Undo2, Redo2, Save, Send, Search, Plus, 
  Users, Box, Share2, Link2, Map, Activity, 
  ChevronRight, ChevronDown, CheckCircle2, 
  AlertTriangle, Settings2, Trash2, ShieldAlert,
  Network, AlertCircle, History, Upload, Download,
  FileText, GitCommit, Info, Check, X, FileCode,
  Database
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { Badge } from '@/src/components/ui/badge';
import { Card, CardContent } from '@/src/components/ui/card';
import { useToast } from '@/src/components/ui/use-toast';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/src/components/ui/dropdown-menu';

// --- Types & Mock Data ---

type SelectionType = { type: 'Community' | 'Entity' | 'Relation'; id: string } | null;

interface EntityNode {
  id: string;
  name: string;
  nameEn: string;
  domain: string;
  communities: string[];
  x: number;
  y: number;
  properties: { name: string; type: string; required: boolean }[];
  impact: { instances: number; models: number; risk: 'Low' | 'Medium' | 'High' };
}

interface RelationNode {
  id: string;
  name: string;
  nameEn: string;
  sourceId: string;
  targetId: string;
  semantics: { desc: string; multiValue: boolean; required: boolean; inverse: boolean };
  usage: { communities: string[]; instanceCount: number };
  impact: { instances: number; models: number; risk: 'Low' | 'Medium' | 'High' };
}

interface CommunityNode {
  id: string;
  name: string;
  nameEn: string;
  domain: string;
  members: number;
  desc: string;
  owner: string;
}

const MOCK_COMMUNITIES: CommunityNode[] = [
  { id: 'com-1', name: '设备对象社区', nameEn: 'Device Assets', domain: '资产域', members: 12, desc: '承载所有硬件实体及其装配关系', owner: '张工 (系统工程)' },
  { id: 'com-2', name: '故障问题社区', nameEn: 'Faults & Issues', domain: '质量域', members: 8, desc: '质量及现场维保问题记录与分析', owner: '李工 (质量中心)' },
  { id: 'com-3', name: '维修维护社区', nameEn: 'Maintenance', domain: '服务域', members: 15, desc: '工单与维护操作规范定义', owner: '王工 (售后服务)' }
];

const MOCK_ENTITIES: EntityNode[] = [
  {
    id: 'ent-001', name: '空压机主机', nameEn: 'Compressor Main Unit', domain: '设备资产',
    communities: ['com-1'], x: 200, y: 150,
    properties: [
      { name: '额定功率', type: 'Number', required: true },
      { name: '工作压力', type: 'Number', required: true },
      { name: '冷却方式', type: 'Enum', required: false }
    ],
    impact: { instances: 2450, models: 5, risk: 'High' }
  },
  {
    id: 'ent-002', name: '故障模式', nameEn: 'Failure Mode', domain: '质量可靠性',
    communities: ['com-2'], x: 550, y: 150,
    properties: [
      { name: '故障代码', type: 'String', required: true },
      { name: '严重度', type: 'Enum', required: true },
      { name: '发生频次', type: 'Number', required: false }
    ],
    impact: { instances: 12500, models: 12, risk: 'High' }
  },
  {
    id: 'ent-003', name: '控制板卡', nameEn: 'Control Board', domain: '电气控制',
    communities: ['com-1'], x: 200, y: 350,
    properties: [
      { name: '固件版本', type: 'String', required: true },
      { name: '供电电压', type: 'Number', required: true }
    ],
    impact: { instances: 860, models: 2, risk: 'Medium' }
  }
];

const MOCK_RELATIONS: RelationNode[] = [
  {
    id: 'rel-1', name: '具有包含关系', nameEn: 'Contains', sourceId: 'ent-001', targetId: 'ent-003',
    semantics: { desc: '物理上或逻辑上的包含/组成的层级关系', multiValue: true, required: false, inverse: true },
    usage: { communities: ['com-1'], instanceCount: 15600 },
    impact: { instances: 15600, models: 3, risk: 'Medium' }
  },
  {
    id: 'rel-2', name: '具有故障', nameEn: 'Has_Failure', sourceId: 'ent-001', targetId: 'ent-002',
    semantics: { desc: '设备实体发生了某种已知的失效模式', multiValue: true, required: false, inverse: false },
    usage: { communities: ['com-1', 'com-2'], instanceCount: 4200 },
    impact: { instances: 4200, models: 8, risk: 'High' }
  }
];

export function SchemaDesign() {
  const { toast } = useToast();
  const [selection, setSelection] = useState<SelectionType>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSaved, setIsSaved] = useState(true);

  // Modals state
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [importState, setImportState] = useState<'upload' | 'analyzing' | 'error' | 'conflicts' | 'preview' | 'success'>('upload');
  const [importErrorMsg, setImportErrorMsg] = useState("");
  const [schemaText, setSchemaText] = useState(`namespace KGtestV2\n\nProductModel(产品型号): EntityType\n    desc: 产品的设计型号\n    properties:\n        modelCode(型号编码): Text\n            index: Text\n            constraint: NotNull,Unique\n    relations:\n        hasBOMPart(包含BOM件): BOMPart\n        basedOnModel(对应型号): ProductModel`);
  const [parsedSchemaStats, setParsedSchemaStats] = useState({ namespace: 'unknown', entities: 0, relations: 0, properties: 0, constraint: 0, indexCount: 0 });
  const [resolutions, setResolutions] = useState({ attrConflict: 'import', relIncrement: 'merge', relSignal: 'update' });


  useEffect(() => {
    if (importState === 'analyzing') {
      const timer = setTimeout(() => {
        // simple parsing
        const matchNamespace = schemaText.match(/namespace\s+([A-Za-z0-9_]+)/);
        if (!matchNamespace) {
           setImportErrorMsg("SyntaxError: Missing 'namespace' definition at the beginning of the file.");
           setImportState('error');
           return;
        }
        
        const entitiesCount = (schemaText.match(/EntityType/g) || []).length;
        const relationsCount = (schemaText.match(/^\s+\w+\([^)]+\):\s+[A-Za-z0-9_]+/gm) || []).length; // rough estimate
        const propertiesCount = (schemaText.match(/^\s+\w+\([^)]+\):\s+Text/gm) || []).length; // rough estimate
        const constraintCount = (schemaText.match(/constraint\s*:/g) || []).length;
        const indexCount = (schemaText.match(/index\s*:/g) || []).length;
        
        setParsedSchemaStats({
           namespace: matchNamespace[1],
           entities: entitiesCount || 8,
           relations: relationsCount || 14,
           properties: propertiesCount || 32,
           constraint: constraintCount || 2,
           indexCount: indexCount || 10
        });
        
        setImportState('conflicts');
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [importState, schemaText]);

  const [expandedSections, setExpandedSections] = useState({
    communities: true, entities: true, relations: true
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const selectedEntity = selection?.type === 'Entity' ? MOCK_ENTITIES.find(e => e.id === selection.id) : null;
  const selectedRelation = selection?.type === 'Relation' ? MOCK_RELATIONS.find(r => r.id === selection.id) : null;
  const selectedCommunity = selection?.type === 'Community' ? MOCK_COMMUNITIES.find(c => c.id === selection.id) : null;

  // Deriving Highlight States dynamically based on selection
  const isEntityHighlighted = (ent: EntityNode) => {
    if (!selection) return false;
    if (selection.type === 'Entity' && selection.id === ent.id) return true;
    if (selection.type === 'Community' && ent.communities.includes(selection.id)) return true;
    if (selection.type === 'Relation') {
      const rel = MOCK_RELATIONS.find(r => r.id === selection.id);
      if (rel && (rel.sourceId === ent.id || rel.targetId === ent.id)) return true;
    }
    return false;
  };

  const isRelationHighlighted = (rel: RelationNode) => {
    if (!selection) return false;
    if (selection.type === 'Relation' && selection.id === rel.id) return true;
    if (selection.type === 'Community') {
      const sourceEnt = MOCK_ENTITIES.find(e => e.id === rel.sourceId);
      const targetEnt = MOCK_ENTITIES.find(e => e.id === rel.targetId);
      return (sourceEnt?.communities.includes(selection.id) || targetEnt?.communities.includes(selection.id));
    }
    if (selection.type === 'Entity') {
      return rel.sourceId === selection.id || rel.targetId === selection.id;
    }
    return false;
  };

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden relative">
      {/* Top Toolbar */}
      <div className="flex-none bg-card border-b flex flex-col shadow-sm z-10">
        {/* Main Bar */}
        <div className="px-6 py-3 flex items-center justify-between">
           <div className="flex flex-col lg:flex-row lg:items-center gap-4">
              <div>
                <div className="text-sm text-muted-foreground font-medium flex items-center gap-2">
                  <Network className="w-4 h-4" />
                  本体设计工作台
                </div>
                <h1 className="text-lg font-semibold text-primary-900 leading-tight">图谱 Schema 设计</h1>
              </div>
              
              <div className="h-8 w-px bg-border hidden lg:block" />
              
              <div className="flex items-center gap-3">
                 <Badge variant="outline" className="font-mono bg-blue-50 text-blue-800 border-blue-200 px-2 py-0.5 shadow-sm">
                   当前版本: KB-ONT-V2.1.0
                 </Badge>
                 <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                   {isSaved ? (
                     <><CheckCircle2 className="w-3.5 h-3.5 text-green-600" /> 已自动保存</>
                   ) : (
                     <><div className="w-2 h-2 rounded-full bg-amber-500" /> 编辑中</>
                   )}
                   <span className="text-slate-400">| 昨天 18:30 更新</span>
                 </div>
              </div>
              
              <Button variant="ghost" size="sm" className="h-7 text-xs gap-1.5 text-primary hover:bg-primary/10" onClick={() => setIsHistoryOpen(true)}>
                <History className="w-3.5 h-3.5" /> 历史版本...
              </Button>
           </div>

           <div className="flex items-center gap-4">
              {/* Import / Export */}
              <div className="flex items-center border rounded-md shadow-sm bg-card">
                 <Button variant="ghost" size="sm" className="h-8 rounded-none px-3 gap-2 border-r hover:bg-muted" onClick={() => { setIsImportOpen(true); setImportState('upload'); setSchemaText(`namespace KGtestV2\n\nProductModel(产品型号): EntityType\n    desc: 产品的设计型号\n    properties:\n        modelCode(型号编码): Text\n            index: Text\n            constraint: NotNull,Unique\n    relations:\n        hasBOMPart(包含BOM件): BOMPart\n        basedOnModel(对应型号): ProductModel`); }}>
                    <Upload className="w-3.5 h-3.5 text-blue-600" /> 导入 Schema
                 </Button>
                 <DropdownMenu>
                   <DropdownMenuTrigger className="inline-flex items-center justify-center whitespace-nowrap text-sm font-medium ring-offset-background transition-all duration-200 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-muted hover:text-accent-foreground h-8 rounded-none px-3 gap-2">
                        <Download className="w-3.5 h-3.5 text-emerald-600" /> 导出 <ChevronDown className="w-3 h-3 text-slate-400" />
                   </DropdownMenuTrigger>
                   <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuLabel className="text-xs text-slate-500">导出范围</DropdownMenuLabel>
                      <DropdownMenuItem className="text-sm cursor-pointer" onClick={() => toast({ title: "导出当前版本", description: "正在导出为 .schema 文件..." })}>
                         当前版本 (KB-ONT-V2.1.0-draft)
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-sm cursor-pointer" onClick={() => setIsHistoryOpen(true)}>
                         导出指定历史版本...
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuLabel className="text-xs text-slate-500">导出格式</DropdownMenuLabel>
                      <DropdownMenuItem className="text-sm cursor-pointer font-mono text-slate-700">
                         <FileCode className="w-4 h-4 mr-2" /> 结构化 .schema
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-sm cursor-pointer font-mono text-slate-700">
                         <Database className="w-4 h-4 mr-2" /> JSON-LD / OWL
                      </DropdownMenuItem>
                   </DropdownMenuContent>
                 </DropdownMenu>
              </div>

              <div className="relative hidden xl:block">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  placeholder="检索社区、实体或关系..." 
                  className="w-56 pl-9 h-8 bg-muted/50"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              <div className="flex items-center gap-1 bg-muted/50 p-0.5 rounded-md border">
                 <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground"><Undo2 className="w-3.5 h-3.5" /></Button>
                 <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground"><Redo2 className="w-3.5 h-3.5" /></Button>
              </div>

              <div className="flex items-center gap-2 pl-2 border-l">
                 <Button variant="outline" className="h-8 gap-2 px-3 text-slate-700 hover:bg-slate-100" onClick={() => { setIsSaved(true); toast({ title: "已保存草稿" }); }}>
                   <Save className="w-3.5 h-3.5" /> Save草稿
                 </Button>
                 <Button className="h-8 gap-2 px-4 bg-[#cc0000] hover:bg-[#a30000] text-white shadow-md font-medium" onClick={() => toast({ title: "提交审批", description: "版本发布流程已启动。" })}>
                   <Send className="w-3.5 h-3.5" /> Submit发布
                 </Button>
              </div>
           </div>
        </div>
      </div>

      {/* Main Workspace */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Side: Resources Navigation */}
        <div className="w-[300px] flex-none border-r bg-card/50 flex flex-col z-10 shadow-[2px_0_10px_rgba(0,0,0,0.02)]">
           <div className="p-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b bg-card">
              模型资源树
           </div>
           
           <div className="flex-1 overflow-auto p-2 space-y-4">
              {/* Communities */}
              <div>
                 <button onClick={() => toggleSection('communities')} className="w-full flex items-center gap-2 text-sm font-medium py-1.5 px-2 hover:bg-muted/50 rounded-md transition-colors text-slate-800">
                    {expandedSections.communities ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                    <Users className="w-4 h-4 text-indigo-600" />
                    业务社区
                    <span className="ml-auto text-xs text-muted-foreground bg-muted px-1.5 rounded">{MOCK_COMMUNITIES.length}</span>
                 </button>
                 {expandedSections.communities && (
                   <div className="mt-1 pl-6 pr-2 space-y-1">
                     {MOCK_COMMUNITIES.map(c => (
                       <div 
                          key={c.id} 
                          onClick={() => setSelection({ type: 'Community', id: c.id })}
                          className={cn(
                            "text-sm py-1.5 px-2 hover:bg-muted rounded cursor-pointer flex justify-between items-center transition-colors",
                            selection?.id === c.id ? "bg-indigo-50 text-indigo-700 font-medium border border-indigo-100" : "text-slate-600"
                          )}
                       >
                         <span className="truncate">{c.name}</span>
                       </div>
                     ))}
                   </div>
                 )}
              </div>

              {/* Entities */}
              <div>
                 <button onClick={() => toggleSection('entities')} className="w-full flex items-center gap-2 text-sm font-medium py-1.5 px-2 hover:bg-muted/50 rounded-md transition-colors text-slate-800">
                    {expandedSections.entities ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                    <Box className="w-4 h-4 text-emerald-600" />
                    实体 Entities
                    <span className="ml-auto text-xs text-muted-foreground bg-muted px-1.5 rounded">{MOCK_ENTITIES.length}</span>
                 </button>
                 {expandedSections.entities && (
                   <div className="mt-1 pl-6 pr-2 space-y-1">
                     {MOCK_ENTITIES.map(e => (
                       <div 
                         key={e.id} 
                         onClick={() => setSelection({ type: 'Entity', id: e.id })}
                         className={cn(
                           "text-sm py-1.5 px-2 rounded cursor-pointer truncate transition-colors",
                           selection?.id === e.id ? "bg-emerald-50 text-emerald-700 font-medium border border-emerald-100" : "text-slate-600 hover:bg-muted hover:text-foreground"
                         )}
                       >
                         {e.name}
                       </div>
                     ))}
                   </div>
                 )}
              </div>

              {/* Relations */}
              <div>
                 <button onClick={() => toggleSection('relations')} className="w-full flex items-center gap-2 text-sm font-medium py-1.5 px-2 hover:bg-muted/50 rounded-md transition-colors text-slate-800">
                    {expandedSections.relations ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                    <Share2 className="w-4 h-4 text-blue-500" />
                    关系 Relations
                    <span className="ml-auto text-xs text-muted-foreground bg-muted px-1.5 rounded">{MOCK_RELATIONS.length}</span>
                 </button>
                 {expandedSections.relations && (
                   <div className="mt-1 pl-6 pr-2 space-y-1">
                     {MOCK_RELATIONS.map(r => (
                       <div 
                         key={r.id} 
                         onClick={() => setSelection({ type: 'Relation', id: r.id })}
                         className={cn(
                           "text-sm py-1.5 px-2 hover:bg-muted rounded cursor-pointer truncate transition-colors",
                           selection?.id === r.id ? "bg-blue-50 text-blue-700 font-medium border border-blue-100" : "text-slate-600 hover:text-foreground"
                         )}
                       >
                         {r.name}
                       </div>
                     ))}
                   </div>
                 )}
              </div>
           </div>

           {/* Bottom Action */}
           <div className="p-3 border-t bg-card grid grid-cols-2 gap-2">
              <Button variant="outline" className="w-full justify-center gap-1.5 h-8 border-dashed text-xs text-primary hover:bg-primary/5">
                 <Plus className="w-3.5 h-3.5" /> 实体
              </Button>
              <Button variant="outline" className="w-full justify-center gap-1.5 h-8 border-dashed text-xs text-primary hover:bg-primary/5">
                 <Plus className="w-3.5 h-3.5" /> 关系
              </Button>
           </div>
        </div>

        {/* Middle Canvas */}
        <div className="flex-1 relative overflow-hidden bg-[#eef2f6]" onClick={() => setSelection(null)}>
           {/* Grid Background */}
           <div 
             className="absolute inset-0 z-0 opacity-[0.6]"
             style={{
               backgroundImage: `linear-gradient(to right, #cbd5e1 1px, transparent 1px), linear-gradient(to bottom, #cbd5e1 1px, transparent 1px)`,
               backgroundSize: '40px 40px'
             }}
           />

           {/* Connection Lines (SVG) */}
           <svg className="absolute inset-0 w-full h-full z-10">
              <defs>
                 <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                   <polygon points="0 0, 10 3.5, 0 7" fill="#64748b" />
                 </marker>
                 <marker id="arrowhead-active" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                   <polygon points="0 0, 10 3.5, 0 7" fill="#2563eb" />
                 </marker>
              </defs>
              
              {MOCK_RELATIONS.map(rel => {
                const source = MOCK_ENTITIES.find(e => e.id === rel.sourceId);
                const target = MOCK_ENTITIES.find(e => e.id === rel.targetId);
                if (!source || !target) return null;
                
                const isRelSelected = selection?.type === 'Relation' && selection.id === rel.id;
                const isHighlighted = isRelationHighlighted(rel);
                
                // Extremely simple path logic for demo
                const isVertical = Math.abs(source.x - target.x) < 50;
                let pathD = '';
                let midX = (source.x + target.x) / 2 + 96; // 96 is approx half node width (192/2)
                let midY = (source.y + target.y) / 2 + 36;
                
                if (isVertical) {
                  pathD = `M${source.x + 96} ${source.y + 72} L${target.x + 96} ${target.y}`;
                  midY = (source.y + 72 + target.y) / 2;
                } else {
                  pathD = `M${source.x + 192} ${source.y + 36} L${target.x} ${target.y + 36}`;
                  midX = (source.x + 192 + target.x) / 2;
                }

                // Make the line highly visible if selected or highlighted
                const strokeColor = isRelSelected ? "#2563eb" : (isHighlighted ? "#60a5fa" : "#94a3b8");
                const strokeW = isRelSelected ? 3 : 2;
                const marker = (isRelSelected || isHighlighted) ? "url(#arrowhead-active)" : "url(#arrowhead)";

                return (
                  <g key={rel.id} className="cursor-pointer" onClick={(e) => { e.stopPropagation(); setSelection({ type: 'Relation', id: rel.id }); }}>
                    {/* Invisible thicker line for easier clicking */}
                    <path d={pathD} fill="none" stroke="transparent" strokeWidth="20" />
                    <path 
                      d={pathD} 
                      fill="none" 
                      stroke={strokeColor} 
                      strokeWidth={strokeW}
                      strokeDasharray={rel.semantics.inverse ? "0" : "5 5"} 
                      markerEnd={marker}
                      className="transition-colors duration-200"
                    />
                    <rect 
                       x={midX - 40} y={midY - 12} width="80" height="24" rx="4" 
                       fill={isRelSelected ? "#eff6ff" : "white"} 
                       stroke={isRelSelected ? "#60a5fa" : "#cbd5e1"} 
                       strokeWidth={isRelSelected ? 2 : 1}
                       className="transition-colors shadow-sm" 
                    />
                    <text x={midX} y={midY + 4} className={cn("text-[11px] text-anchor-middle font-medium", isRelSelected ? "fill-blue-700" : "fill-slate-600")} textAnchor="middle">
                       {rel.name}
                    </text>
                  </g>
                );
              })}
           </svg>

           {/* Entity Nodes */}
           {MOCK_ENTITIES.map(node => {
             const isSelected = selection?.type === 'Entity' && selection.id === node.id;
             const isHighlighted = isEntityHighlighted(node);
             
             return (
               <div 
                 key={node.id}
                 className={cn(
                   "absolute z-20 w-48 bg-card border-2 rounded-lg shadow-sm cursor-pointer transition-all duration-200 hover:shadow-md",
                   isSelected ? "border-blue-500 shadow-md ring-4 ring-blue-500/20 scale-[1.02]" : 
                   isHighlighted ? "border-blue-300 shadow-md" : "border-slate-200 opacity-90"
                 )}
                 style={{ left: node.x, top: node.y }}
                 onClick={(e) => { e.stopPropagation(); setSelection({ type: 'Entity', id: node.id }); }}
               >
                 <div className={cn("flex items-center gap-2 px-3 py-2 border-b rounded-t-sm", isSelected || isHighlighted ? "bg-blue-50/50" : "bg-slate-50")}>
                   <Box className={cn("w-4 h-4", isSelected ? "text-blue-600" : "text-emerald-600")} />
                   <span className={cn("text-sm font-semibold truncate", isSelected ? "text-blue-900" : "text-foreground")}>{node.name}</span>
                 </div>
                 <div className="px-3 py-2 bg-white rounded-b-md">
                   <div className="text-xs font-mono mb-2 truncate text-slate-500">{node.id}</div>
                   <div className="flex gap-1 flex-wrap">
                      <Badge variant="secondary" className="text-[10px] font-normal bg-slate-100 text-slate-600">{node.domain}</Badge>
                      {node.communities.map(cId => {
                         const comm = MOCK_COMMUNITIES.find(c => c.id === cId);
                         return comm ? <Badge key={cId} variant="outline" className="text-[10px] border-indigo-200 text-indigo-700 bg-indigo-50">{comm.name}</Badge> : null;
                      })}
                   </div>
                 </div>
               </div>
             )
           })}

           {/* Floating Tools */}
           <div 
             className="absolute left-6 bottom-6 z-30 flex flex-col gap-2 bg-white/90 backdrop-blur border rounded-lg p-1.5 shadow-md"
             onClick={(e) => e.stopPropagation()}
           >
              <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-600 hover:text-blue-600 hover:bg-blue-50" title="建立关联">
                 <Link2 className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-600 hover:text-blue-600 hover:bg-blue-50" title="查看社区映射">
                 <Map className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-600 hover:text-blue-600 hover:bg-blue-50" title="自适应画布布局">
                 <Activity className="w-4 h-4" />
              </Button>
           </div>
        </div>

        {/* Right Layout: Dynamic Config Panel */}
        {selection && (
          <div className="w-[360px] flex-none border-l bg-white flex flex-col z-20 shadow-[-2px_0_10px_rgba(0,0,0,0.02)] overflow-x-hidden">
        {/* Community Config Panel */}
           {selection?.type === 'Community' && selectedCommunity && (
              <>
                 <div className="flex items-center justify-between p-4 border-b bg-slate-50 font-semibold text-sm">
                    <div className="flex items-center gap-2">
                       <Users className="w-4 h-4 text-indigo-600" />
                       业务社区详情
                    </div>
                    <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200">Community Selected</Badge>
                 </div>
                 <div className="flex-1 overflow-auto p-4 space-y-6">
                    <div className="space-y-3">
                       <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">基础信息</h3>
                       <div className="space-y-4">
                          <div>
                             <label className="text-xs text-slate-500 block mb-1">社区名称</label>
                             <Input className="h-8 text-sm" value={selectedCommunity.name} readOnly />
                          </div>
                          <div>
                             <label className="text-xs text-slate-500 block mb-1">英文名称 / 标识</label>
                             <Input className="h-8 text-sm font-mono" value={selectedCommunity.nameEn} readOnly />
                          </div>
                          <div>
                             <label className="text-xs text-slate-500 block mb-1">所属业务域</label>
                             <Input className="h-8 text-sm" value={selectedCommunity.domain} readOnly />
                          </div>
                          <div>
                             <label className="text-xs text-slate-500 block mb-1">社区描述与规范</label>
                             <textarea 
                               className="w-full min-h-[60px] border border-input bg-background rounded-md px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                               value={selectedCommunity.desc} readOnly
                             />
                          </div>
                       </div>
                    </div>
                    <div className="space-y-3">
                       <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">协作概况</h3>
                       <div className="bg-slate-50 border rounded-lg p-3 grid grid-cols-2 gap-4">
                          <div>
                             <div className="text-xs text-slate-500 mb-0.5">活跃成员</div>
                             <div className="text-lg font-bold text-foreground">{selectedCommunity.members}</div>
                          </div>
                          <div>
                             <div className="text-xs text-slate-500 mb-0.5">主要负责人</div>
                             <div className="text-sm font-medium pt-1 text-primary">{selectedCommunity.owner}</div>
                          </div>
                       </div>
                       <Button variant="outline" className="w-full h-8 text-xs font-medium">配置人员权限...</Button>
                    </div>
                 </div>
              </>
           )}

           {/* Entity Config Panel */}
           {selection?.type === 'Entity' && selectedEntity && (
             <>
                <div className="flex items-center justify-between p-4 border-b bg-slate-50 font-semibold text-sm">
                   <div className="flex items-center gap-2">
                      <Box className="w-4 h-4 text-emerald-600" />
                      实体建模配置
                   </div>
                   <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">Entity Selected</Badge>
                </div>
                
                <div className="flex-1 overflow-auto p-4 space-y-6">
                   {/* 1. Base Config */}
                   <div className="space-y-3">
                      <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                        <FileText className="w-3.5 h-3.5" /> 基础属性
                      </h3>
                      <div className="space-y-3">
                         <div>
                            <label className="text-xs text-slate-500 mb-1 block">中文名称</label>
                            <Input className="h-8 text-sm" value={selectedEntity.name} readOnly />
                         </div>
                         <div className="grid grid-cols-2 gap-2">
                           <div>
                              <label className="text-xs text-slate-500 mb-1 block">英文名称</label>
                              <Input className="h-8 text-sm font-mono" value={selectedEntity.nameEn} readOnly />
                           </div>
                           <div>
                              <label className="text-xs text-slate-500 mb-1 block">所属域</label>
                              <Input className="h-8 text-sm" value={selectedEntity.domain} readOnly />
                           </div>
                         </div>
                         <div>
                            <label className="text-xs text-slate-500 mb-1 block">唯一标识 ID</label>
                            <Input className="h-8 text-sm font-mono text-slate-500 bg-slate-100" value={selectedEntity.id} disabled />
                         </div>
                      </div>
                   </div>

                   <div className="h-px w-full bg-border" />

                   {/* 2. Community Mapping */}
                   <div className="space-y-3">
                      <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                        <Users className="w-3.5 h-3.5" /> 社区归属
                      </h3>
                      <div className="flex flex-wrap gap-2">
                         {selectedEntity.communities.map(cId => {
                           const comm = MOCK_COMMUNITIES.find(c => c.id === cId);
                           return comm ? (
                             <Badge key={cId} variant="secondary" className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200">
                               {comm.name} <X className="w-3 h-3 ml-1 cursor-pointer" />
                             </Badge>
                           ) : null;
                         })}
                         <Button variant="outline" size="sm" className="h-5 px-1.5 text-[10px] border-dashed text-slate-600 hover:text-primary hover:border-primary">
                           <Plus className="w-3 h-3 mr-1" /> 添加映射
                         </Button>
                      </div>
                   </div>

                   <div className="h-px w-full bg-border" />

                   {/* 3. Property Set */}
                   <div className="space-y-3">
                      <div className="flex items-center justify-between">
                         <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                           元数据属性集
                         </h3>
                         <Button variant="ghost" size="icon" className="h-6 w-6"><Plus className="w-3.5 h-3.5 text-primary" /></Button>
                      </div>
                      
                      <div className="space-y-2">
                        {selectedEntity.properties?.map((prop, i) => (
                           <div key={i} className="flex flex-col p-2.5 rounded-md border bg-slate-50 hover:bg-slate-100 transition-colors group">
                               <div className="flex justify-between items-center mb-1">
                                  <span className="text-sm font-medium text-slate-800">{prop.name}</span>
                                  <Button variant="ghost" size="icon" className="h-5 w-5 opacity-0 group-hover:opacity-100 text-red-500 ml-auto">
                                    <Trash2 className="w-3 h-3" />
                                  </Button>
                               </div>
                               <div className="flex gap-2 items-center text-xs">
                                  <Badge variant="outline" className="text-[10px] font-mono bg-white">{prop.type}</Badge>
                                  {prop.required && <span className="text-red-500 font-medium text-[10px]">必填项</span>}
                                  {!prop.required && <span className="text-slate-400 font-medium text-[10px]">选填项目</span>}
                               </div>
                           </div>
                        ))}
                      </div>
                   </div>

                   <div className="h-px w-full bg-border" />

                   {/* 4. Impact Card */}
                   <div className="space-y-3">
                      <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                        <Activity className="w-3.5 h-3.5" /> 修改影响预警
                      </h3>
                      <Card className={cn(
                        "border shadow-sm",
                        selectedEntity.impact.risk === 'High' ? "border-red-200 bg-[#fff5f5]" : "border-amber-200 bg-amber-50"
                      )}>
                         <CardContent className="p-3">
                            <div className="flex items-start gap-2">
                               <ShieldAlert className={cn(
                                  "w-4 h-4 mt-0.5 shrink-0", 
                                  selectedEntity.impact.risk === 'High' ? "text-red-500" : "text-amber-500"
                               )} />
                               <div>
                                  <p className="text-xs font-semibold text-slate-900 mb-1 leading-tight">
                                     高风险：将引发业务数据震荡
                                  </p>
                                  <p className="text-xs text-slate-600 mb-2">
                                     修改或删除该实体，在生产环境中共影响 <strong>{selectedEntity.impact.instances.toLocaleString()}</strong> 条设备实例数据，及 <strong>{selectedEntity.impact.models}</strong> 个依赖该节点的图分析模型。
                                  </p>
                                  <Button variant="link" className="h-auto p-0 text-[11px] text-blue-600 font-medium">
                                     展开详细受影响清单 &rarr;
                                  </Button>
                               </div>
                            </div>
                         </CardContent>
                      </Card>
                   </div>
                </div>
             </>
           )}

           {/* Relation Config Panel */}
           {selection?.type === 'Relation' && selectedRelation && (
             <>
                <div className="flex items-center justify-between p-4 border-b bg-slate-50 font-semibold text-sm">
                   <div className="flex items-center gap-2">
                      <Share2 className="w-4 h-4 text-blue-600" />
                      语义关系配置
                   </div>
                   <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Relation Selected</Badge>
                </div>
                
                <div className="flex-1 overflow-auto p-4 space-y-6">
                   <div className="space-y-3">
                      <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">连接定义</h3>
                      <div className="bg-slate-50 border rounded-lg p-3">
                         <div className="flex items-center justify-between mb-3 text-xs font-medium text-slate-500">
                           <span>起点类型</span>
                           <span>终点类型</span>
                         </div>
                         <div className="flex items-center gap-2">
                            <div className="flex-1 border border-emerald-200 bg-emerald-50 text-emerald-800 text-xs px-2 py-1.5 rounded text-center truncate font-medium">
                              {MOCK_ENTITIES.find(e => e.id === selectedRelation.sourceId)?.name}
                            </div>
                            <div className="w-8 shrink-0 flex items-center justify-center text-slate-400">
                               <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-5 h-5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                            </div>
                            <div className="flex-1 border border-emerald-200 bg-emerald-50 text-emerald-800 text-xs px-2 py-1.5 rounded text-center truncate font-medium">
                              {MOCK_ENTITIES.find(e => e.id === selectedRelation.targetId)?.name}
                            </div>
                         </div>
                      </div>
                      <div className="space-y-3 pt-2">
                         <div>
                            <label className="text-xs text-slate-500 mb-1 block">关系名称</label>
                            <Input className="h-8 text-sm font-medium" value={selectedRelation.name} readOnly />
                         </div>
                         <div className="grid grid-cols-2 gap-2">
                           <div>
                              <label className="text-xs text-slate-500 mb-1 block">英文语义名称</label>
                              <Input className="h-8 text-sm font-mono text-blue-700" value={selectedRelation.nameEn} readOnly />
                           </div>
                           <div>
                              <label className="text-xs text-slate-500 mb-1 block">关系 ID</label>
                              <Input className="h-8 text-sm font-mono text-slate-500 bg-slate-100" value={selectedRelation.id} disabled />
                           </div>
                         </div>
                      </div>
                   </div>

                   <div className="h-px w-full bg-border" />

                   <div className="space-y-3">
                      <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Semantic Rules (约束规则)</h3>
                      <div className="space-y-2">
                         <textarea 
                           className="w-full border border-input bg-background rounded-md px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1"
                           value={selectedRelation.semantics.desc} readOnly rows={2}
                         />
                         <div className="grid grid-cols-2 gap-2 pt-1 text-sm bg-slate-50 rounded-md border p-2">
                           <div className="flex items-center justify-between text-slate-700"><span className="text-xs">支持多值</span>
                             {selectedRelation.semantics.multiValue ? <Check className="w-3.5 h-3.5 text-green-600"/> : <X className="w-3 h-3 text-slate-400"/>}
                           </div>
                           <div className="flex items-center justify-between text-slate-700"><span className="text-xs">支持逆向推理</span>
                             {selectedRelation.semantics.inverse ? <Check className="w-3.5 h-3.5 text-green-600"/> : <X className="w-3 h-3 text-slate-400"/>}
                           </div>
                           <div className="flex items-center justify-between text-slate-700"><span className="text-xs">强制必填</span>
                             {selectedRelation.semantics.required ? <Check className="w-3.5 h-3.5 text-green-600"/> : <X className="w-3 h-3 text-slate-400"/>}
                           </div>
                         </div>
                      </div>
                   </div>

                   <div className="h-px w-full bg-border" />

                   <div className="space-y-3">
                      <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">使用情况与影响分析</h3>
                      <div className="space-y-3">
                         <div className="flex flex-col gap-1">
                            <span className="text-xs text-slate-500">归属及引用的业务社区</span>
                            <div className="flex flex-wrap gap-1.5">
                               {selectedRelation.usage.communities.map(cId => {
                                 const comm = MOCK_COMMUNITIES.find(c => c.id === cId);
                                 return comm ? <Badge key={cId} variant="outline" className="text-[10px] bg-slate-50">{comm.name}</Badge> : null;
                               })}
                            </div>
                         </div>
                         <Card className={cn(
                           "border shadow-sm",
                           selectedRelation.impact.risk === 'High' ? "border-red-200 bg-[#fff5f5]" : "border-amber-200 bg-amber-50"
                         )}>
                            <CardContent className="p-3">
                               <div className="flex items-start gap-2">
                                  <ShieldAlert className={cn(
                                     "w-4 h-4 mt-0.5 shrink-0", 
                                     selectedRelation.impact.risk === 'High' ? "text-red-500" : "text-amber-500"
                                  )} />
                                  <div>
                                     <p className="text-xs font-semibold text-slate-900 mb-1 leading-tight">
                                        关系变更影响预警
                                     </p>
                                     <p className="text-xs text-slate-600 mb-2">
                                        已产生 <strong>{selectedRelation.impact.instances.toLocaleString()}</strong> 条边实例。变更将影响 <strong>{selectedRelation.impact.models}</strong> 个图查询服务。
                                     </p>
                                  </div>
                               </div>
                            </CardContent>
                         </Card>
                      </div>
                   </div>
                </div>
             </>
           )}
          </div>
        )}

      </div>

      {/* --- Overlays & Modals --- */}
      
      {/* 1. History Version Modal */}
      {isHistoryOpen && (
        <div className="absolute inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex justify-end">
           <div className="w-[450px] bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right">
              <div className="p-4 border-b flex items-center justify-between bg-slate-50">
                 <div className="flex items-center gap-2 font-semibold">
                   <GitCommit className="w-5 h-5 text-slate-600" />
                   历史版本管理
                 </div>
                 <Button variant="ghost" size="icon" onClick={() => setIsHistoryOpen(false)}><X className="w-4 h-4" /></Button>
              </div>
              <div className="flex-1 overflow-auto p-6 space-y-6">
                 {/* Current */}
                 <div className="relative pl-6 pb-6 border-l-2 border-primary">
                    <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full border-4 border-white bg-primary shadow-sm" />
                    <div className="font-semibold text-sm">KB-ONT-V2.1.0-draft (当前草稿)</div>
                    <div className="text-xs text-slate-500 mb-2">更新于 今天 10:24 • 你</div>
                    <p className="text-xs text-slate-700 bg-slate-50 p-2 rounded-md border">正在扩充故障预测相关属性。</p>
                    <div className="mt-3 flex gap-2">
                       <Button variant="outline" size="sm" className="h-7 text-xs"><Download className="w-3 h-3 mr-1"/> 导出此版本</Button>
                    </div>
                 </div>
                 {/* History 1 */}
                 <div className="relative pl-6 pb-6 border-l-2 border-slate-200">
                    <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full border-4 border-white bg-slate-400 shadow-sm" />
                    <div className="flex items-center justify-between">
                       <span className="font-semibold text-sm">KB-ONT-V2.1.0</span>
                       <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]">已发布</Badge>
                    </div>
                    <div className="text-xs text-slate-500 mb-2">2024-05-18 14:00 • 系统管理员</div>
                    <p className="text-xs text-slate-700 bg-slate-50 p-2 rounded-md border">合并了设备台账实体的微调规范。</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                       <Button variant="outline" size="sm" className="h-7 text-xs">对比差异</Button>
                       <Button variant="outline" size="sm" className="h-7 text-xs text-blue-600 border-blue-200 bg-blue-50">恢复为新草稿</Button>
                       <Button variant="outline" size="sm" className="h-7 text-xs"><Download className="w-3 h-3 mr-1"/> 导出 .schema</Button>
                    </div>
                 </div>
                 {/* History 2 */}
                 <div className="relative pl-6 pb-0">
                    <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full border-4 border-white bg-slate-400 shadow-sm" />
                    <div className="font-semibold text-sm">KB-ONT-V2.0.0</div>
                    <div className="text-xs text-slate-500 mb-2">2024-03-10 09:12 • 张工</div>
                    <p className="text-xs text-slate-700 bg-slate-50 p-2 rounded-md border">年度大发版：重构维修工艺节点结构。</p>
                    <div className="mt-3 flex gap-2">
                       <Button variant="outline" size="sm" className="h-7 text-xs">对比差异</Button>
                       <Button variant="outline" size="sm" className="h-7 text-xs text-blue-600 border-blue-200 bg-blue-50">恢复为新草稿</Button>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* 2. Import Schema Modal */}
      {isImportOpen && (
        <div className="absolute inset-0 z-50 bg-slate-900/60 backdrop-blur-[2px] flex items-center justify-center p-4">
           <div className="bg-white rounded-xl shadow-2xl w-full max-w-[800px] flex flex-col overflow-hidden max-h-[90vh]">
              <div className="px-6 py-4 border-b flex items-center justify-between bg-slate-50 shrink-0">
                 <div className="text-lg font-semibold flex items-center gap-2">
                    <Upload className="w-5 h-5 text-blue-600" />
                    导入 Schema 识别与合并
                 </div>
                 <Button variant="ghost" size="icon" onClick={() => setIsImportOpen(false)}><X className="w-5 h-5" /></Button>
              </div>

              <div className="p-6 flex-1 overflow-y-auto min-h-0 bg-[#f8fafc]">
                 {importState === 'upload' && (
                    <div className="grid grid-cols-2 gap-6 h-[400px]">
                       <div 
                          className="border-2 border-dashed border-slate-300 rounded-xl bg-white p-8 flex flex-col items-center justify-center hover:border-blue-400 hover:bg-blue-50/50 transition-colors relative"
                       >
                          <input 
                             type="file" 
                             className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                             accept=".schema,.json,.txt" 
                             title="选择 .schema 文件"
                             onChange={(e) => {
                                if (e.target.files && e.target.files.length > 0) {
                                   const file = e.target.files[0];
                                   const reader = new FileReader();
                                   reader.onload = (event) => {
                                      if (event.target?.result) {
                                          setSchemaText(event.target.result as string);
                                          setImportState('analyzing');
                                      }
                                   };
                                   reader.readAsText(file);
                                }
                             }} 
                          />
                          <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-6">
                             <Upload className="w-8 h-8" />
                          </div>
                          <h3 className="text-lg font-semibold mb-2">上传 .schema 建模文件</h3>
                          <p className="text-slate-500 text-sm text-center mb-4">自动识别 Namespace、实体、关系、属性类型、索引及约束定义，并一键映射到工作台。</p>
                          <Badge variant="outline" className="bg-slate-50 text-slate-500 hover:bg-slate-100">Click or Drag & Drop</Badge>
                       </div>
                       <div className="flex flex-col gap-2 relative">
                           <div className="absolute top-2 right-2 flex gap-1 z-10">
                              <Badge className="bg-[#1e1e1e] border-slate-700 text-slate-400 pointer-events-none">.schema DSL</Badge>
                           </div>
                           <textarea 
                              className="w-full flex-1 border border-slate-200 rounded-xl bg-[#0d1117] text-[#c9d1d9] font-mono text-xs p-4 focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none shadow-inner"
                              value={schemaText}
                              onChange={(e) => setSchemaText(e.target.value)}
                              spellCheck={false}
                           />
                           <div className="flex justify-between items-center mt-2">
                              <span className="text-xs text-slate-500 font-medium whitespace-pre">支持格式验证、语法高亮与智能提示</span>
                              <Button onClick={() => setImportState('analyzing')} className="gap-2 shadow-sm">
                                <FileCode className="w-4 h-4" /> 解析脚本
                              </Button>
                           </div>
                       </div>
                    </div>
                 )}
                 {importState === 'analyzing' && (
                    <div className="py-24 flex flex-col items-center justify-center h-[400px]">
                       <div className="w-12 h-12 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin mb-6" />
                       <h3 className="text-lg font-semibold mb-2">正在解析 Schema 文件</h3>
                       <p className="text-slate-500 text-sm">提取实体、关系定义，解析属性约束体系，并与当前工作台进行防呆比对...</p>
                    </div>
                 )}
                 {importState === 'error' && (
                    <div className="py-24 flex flex-col items-center justify-center h-[400px]">
                       <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-6">
                           <X className="w-8 h-8" />
                       </div>
                       <h3 className="text-lg font-semibold mb-2 text-slate-800">解析失败</h3>
                       <p className="text-red-500 text-sm bg-red-50 px-4 py-2 rounded-md font-mono mb-8 border border-red-100 max-w-lg text-center break-words">
                         {importErrorMsg || "SyntaxError: Unexpected token 'EntityType' at line 2. Expected namespace definition first."}
                       </p>
                       <div className="flex gap-4">
                         <Button variant="outline" onClick={() => setImportState('upload')}>重新上传</Button>
                         <Button onClick={() => setImportState('analyzing')} className="bg-blue-600 hover:bg-blue-700">重试解析</Button>
                       </div>
                    </div>
                 )}
                 {importState === 'conflicts' && (
                    <div className="space-y-6">
                       <div className="grid grid-cols-7 gap-3">
                          <Card className="border-blue-200 shadow-sm col-span-2 bg-gradient-to-br from-white to-blue-50/30">
                            <CardContent className="p-4 flex flex-col justify-center h-full">
                               <div className="text-xs text-slate-500 font-semibold mb-1">识别 Namespace</div>
                               <div className="text-lg font-bold text-blue-800 font-mono">{parsedSchemaStats.namespace}</div>
                               <div className="text-[10px] text-blue-600/70 mt-auto pt-2">自动映射为新建业务社区</div>
                            </CardContent>
                          </Card>
                          <Card className="border-slate-200 shadow-sm text-center py-3 flex flex-col justify-center">
                               <div className="text-2xl font-bold text-slate-700">{parsedSchemaStats.entities}</div>
                               <div className="text-xs text-slate-500 font-medium">已识别实体</div>
                          </Card>
                          <Card className="border-slate-200 shadow-sm text-center py-3 flex flex-col justify-center">
                               <div className="text-2xl font-bold text-slate-700">{parsedSchemaStats.relations}</div>
                               <div className="text-xs text-slate-500 font-medium">已识别关系</div>
                          </Card>
                          <Card className="border-slate-200 shadow-sm text-center py-3 flex flex-col justify-center">
                               <div className="flex items-baseline justify-center gap-1">
                                  <span className="text-2xl font-bold text-slate-700">{parsedSchemaStats.properties}</span>
                                  <span className="text-sm text-slate-400">/</span>
                                  <span className="text-lg font-bold text-blue-600">{parsedSchemaStats.indexCount}</span>
                               </div>
                               <div className="text-xs text-slate-500 font-medium">已解析属性 / 索引</div>
                          </Card>
                          <Card className="border-amber-200 bg-amber-50 shadow-sm text-center py-3 flex flex-col justify-center col-span-2 relative overflow-hidden">
                               <div className="absolute top-0 right-0 w-16 h-16 bg-amber-100 rounded-bl-full -z-10 blur-xl"></div>
                               <div className="flex items-baseline justify-center gap-1">
                                 <span className="text-2xl font-bold text-amber-700">{Math.floor(parsedSchemaStats.entities * 0.3)}</span>
                                 <span className="text-sm font-medium text-amber-600/60">/</span>
                                 <span className="text-xl font-bold text-red-600">{parsedSchemaStats.constraint}</span>
                               </div>
                               <div className="text-xs text-amber-800 font-medium flex items-center justify-center gap-1 mt-1">
                                 重复实体总数 / <span className="text-red-700">属性约束冲突项</span>
                               </div>
                          </Card>
                       </div>

                       <div className="bg-white border rounded-lg overflow-hidden shadow-sm">
                          <div className="px-4 py-3 bg-slate-50 border-b flex items-center justify-between">
                             <h4 className="font-semibold text-sm">重叠结构与冲突处理建议</h4>
                              <div className="flex items-center gap-3">
                                 <Badge variant="secondary" className="text-xs bg-white border border-slate-200">2 项需人工确认</Badge>
                                 <Badge variant="secondary" className="text-xs bg-emerald-50 text-emerald-700 border-emerald-200">5 项安全合并</Badge>
                              </div>
                           </div>
                           <div className="divide-y text-sm">
                              {/* Conflict Row 1 */}
                              <div className="p-4 flex items-start gap-4 hover:bg-slate-50/50">
                                 <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                                 <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="font-semibold">实体属性配置冲突：产品型号 (ProductModel)</span>
                                      <Badge variant="outline" className="text-[10px] text-red-600 border-red-200 bg-red-50">同名属性，约束与索引配置不同</Badge>
                                    </div>
                                    <div className="text-xs text-slate-600 bg-slate-100/50 p-3 rounded-md mb-3 flex gap-6 border">
                                       <div className="flex-1 space-y-2">
                                         <div className="font-medium text-slate-700 pb-1 border-b mb-2">当前工作台模型</div>
                                         <div className="font-mono text-[11px] space-y-1">
                                           <div className="text-slate-500">modelCode (型号编码): Text</div>
                                           <div className="pl-4">index: <span className="line-through text-slate-400">None</span></div>
                                           <div className="pl-4">constraint: <span className="line-through text-slate-400">NotNull</span></div>
                                         </div>
                                       </div>
                                       <div className="flex-1 border-l pl-6 border-slate-200 space-y-2">
                                         <div className="font-medium text-blue-700 pb-1 border-b border-blue-100 mb-2">导入的 .schema 文件</div>
                                         <div className="font-mono text-[11px] space-y-1">
                                           <div className="text-blue-800 font-semibold">modelCode (型号编码): Text</div>
                                           <div className="pl-4 text-emerald-600 font-bold bg-emerald-50 inline-block px-1 rounded">index: Text</div><br/>
                                           <div className="pl-4 text-emerald-600 font-bold bg-emerald-50 inline-block px-1 rounded mt-1">constraint: NotNull,Unique</div>
                                         </div>
                                       </div>
                                    </div>
                                    <div className="flex gap-2 items-center">
                                       <Button size="sm" className={cn("h-7 text-xs shadow-none font-medium", resolutions.attrConflict === 'import' ? "bg-amber-100 text-amber-800 hover:bg-amber-200" : "bg-white border text-slate-600 hover:bg-slate-50")} onClick={() => setResolutions({...resolutions, attrConflict: 'import'})}>使用导入文件配置 (覆盖约束)</Button>
                                       <Button size="sm" className={cn("h-7 text-xs shadow-none", resolutions.attrConflict === 'keep' ? "bg-slate-200 text-slate-800 hover:bg-slate-300" : "bg-white border text-slate-600 hover:bg-slate-50")} onClick={() => setResolutions({...resolutions, attrConflict: 'keep'})}>保留工作台原有配置</Button>
                                       <Button size="sm" className={cn("h-7 text-xs border-dashed", resolutions.attrConflict === 'rename' ? "bg-slate-200 text-slate-800 hover:bg-slate-300" : "bg-white border text-slate-500 hover:bg-slate-50")} onClick={() => setResolutions({...resolutions, attrConflict: 'rename'})}>重命名导入属性</Button>
                                    </div>
                                 </div>
                              </div>
                              {/* Conflict Row 2 */}
                              <div className="p-4 flex items-start gap-4 hover:bg-slate-50/50">
                                 <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                                 <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="font-semibold">关系增量合并：包含BOM件 (hasBOMPart)</span>
                                      <Badge variant="outline" className="text-[10px] bg-blue-50 text-blue-700 border-blue-200">目标实体一致，安全追加</Badge>
                                    </div>
                                    <p className="text-xs text-slate-500 mb-2">已存在的实体 <span className="font-mono bg-slate-100 px-1 rounded">ProductModel</span> 与 <span className="font-mono bg-slate-100 px-1 rounded">BOMPart</span>，将安全注入本条新发现的关系拓扑连线。</p>
                                    <div className="flex gap-2">
                                       <Button size="sm" className={cn("h-7 text-xs shadow-none", resolutions.relIncrement === 'merge' ? "bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100" : "bg-white border text-slate-600 hover:bg-slate-50")} onClick={() => setResolutions({...resolutions, relIncrement: 'merge'})}>勾选合并</Button>
                                       <Button size="sm" className={cn("h-7 text-xs shadow-none", resolutions.relIncrement === 'skip' ? "bg-slate-200 text-slate-800 hover:bg-slate-300" : "bg-white border text-slate-600 hover:bg-slate-50")} onClick={() => setResolutions({...resolutions, relIncrement: 'skip'})}>跳过此关系注入</Button>
                                    </div>
                                 </div>
                              </div>
                             {/* Conflict Row 3 */}
                             <div className="p-4 flex items-start gap-4 hover:bg-slate-50/50 border-t">
                                <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                                <div className="flex-1">
                                   <div className="flex items-center gap-2 mb-1">
                                     <span className="font-semibold">关系：带有监测信号 (Has_Signal)</span>
                                     <Badge variant="outline" className="text-[10px] bg-blue-50 text-blue-700 border-blue-200">目标实体变更</Badge>
                                   </div>
                                   <p className="text-xs text-slate-500 mb-2">导入的 Schema 试图将原本指向【传感器】实体的关系拓宽至【通讯模块】实体。</p>
                                   <div className="flex gap-2">
                                      <Button size="sm" className={cn("h-7 text-xs shadow-none", resolutions.relSignal === 'update' ? "bg-blue-100 text-blue-800 hover:bg-blue-200" : "bg-white border text-slate-600 hover:bg-slate-50")} onClick={() => setResolutions({...resolutions, relSignal: 'update'})}>确认识别并更新多目标类型</Button>
                                      <Button size="sm" className={cn("h-7 text-xs", resolutions.relSignal === 'skip' ? "bg-slate-200 text-slate-800 hover:bg-slate-300" : "bg-white border text-slate-600 hover:bg-slate-50")} onClick={() => setResolutions({...resolutions, relSignal: 'skip'})}>跳过导入</Button>
                                   </div>
                                </div>
                             </div>
                          </div>
                       </div>
                    </div>
                 )}
                 {importState === 'preview' && (
                    <div className="flex flex-col items-center justify-center p-8 h-full">
                       <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-6">
                         <Network className="w-8 h-8" />
                       </div>
                       <h3 className="text-xl font-semibold mb-2">解析与冲突处理完成</h3>
                       <p className="text-slate-500 text-center max-w-lg mb-8">
                         Schema 包含 <b>{parsedSchemaStats.namespace}</b> Namespace 下的 <b>{parsedSchemaStats.entities}</b> 个实体和 <b>{parsedSchemaStats.relations}</b> 条关系。
                         配置已按您的要求调整。点击下方确认以将其合并入当前工作台。
                       </p>
                       <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-lg shadow-sm">
                          <div className="w-full h-32 bg-slate-50 rounded-t-lg border-b flex items-center justify-center dashboard-grid-bg relative overflow-hidden">
                             <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-indigo-500/10"></div>
                             <Network className="w-16 h-16 text-blue-200" />
                          </div>
                          <div className="p-4 flex gap-4 overflow-x-auto justify-center">
                              <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200">+ Namespace {parsedSchemaStats.namespace}</Badge>
                              <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">+ {parsedSchemaStats.entities} Entities</Badge>
                              <Badge className="bg-blue-50 text-blue-700 border-blue-200">+ {parsedSchemaStats.relations} Relations</Badge>
                          </div>
                       </div>
                    </div>
                 )}
                 {importState === 'success' && (
                    <div className="flex flex-col items-center justify-center py-20 h-full">
                       <div className="w-20 h-20 bg-emerald-50 border border-emerald-100 rounded-full flex items-center justify-center mb-6">
                         <Check className="w-10 h-10 text-emerald-500" />
                       </div>
                       <h3 className="text-2xl font-bold mb-3 text-slate-800">导入成功</h3>
                       <p className="text-slate-500 mb-8 text-center max-w-md">当前图谱 Schema 已经与上传并解析的配置文件无缝合并，您可以并在画布中继续编辑设计。</p>
                    </div>
                 )}
              </div>

              <div className="px-6 py-4 border-t bg-slate-50 flex justify-end gap-3 shrink-0">
                 <Button variant="outline" onClick={() => setIsImportOpen(false)}>取消</Button>
                 {importState === 'conflicts' && (
                   <Button 
                     className="bg-blue-600 hover:bg-blue-700"
                     onClick={() => setImportState('preview')}
                   >
                     应用配置并预览
                   </Button>
                 )}
                 {importState === 'preview' && (
                   <Button 
                     className="bg-blue-600 hover:bg-blue-700"
                     onClick={() => setImportState('success')}
                   >
                     确认导入并合并
                   </Button>
                 )}
                 {importState === 'success' && (
                   <Button 
                     className="bg-blue-600 hover:bg-blue-700"
                     onClick={() => {
                       toast({ title: "导入成功", description: "已成功将 .schema 建模文件合并入当前工作台！" });
                       setIsImportOpen(false);
                     }}
                   >
                     完成导入
                   </Button>
                 )}
                 {(importState !== 'conflicts' && importState !== 'preview' && importState !== 'success') && (
                   <Button 
                     disabled 
                     className="bg-blue-600/50"
                   >
                     应用导入配置
                   </Button>
                 )}
              </div>
           </div>
        </div>
      )}

    </div>
  );
}
