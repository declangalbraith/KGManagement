import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { 
  Search, 
  RefreshCcw, 
  Play, 
  ChevronRight, 
  ChevronDown, 
  Trash2,
  Box,
  Layers,
  Database,
  CheckCircle2,
  Maximize2,
  ZoomIn,
  ZoomOut,
  AlertCircle,
  ArrowLeft
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/src/components/ui/card';
import { Badge } from '@/src/components/ui/badge';
import { useToast } from '@/src/components/ui/use-toast';

type BomStatus = 'Ingested' | 'Pending';

interface BomNode {
  id: string;
  name: string;
  code: string;
  level: number;
  spec: string;
  status: BomStatus;
  children?: BomNode[];
}

const MOCK_BOM_DATA: BomNode = {
  id: 'root',
  name: 'KB 75kW 螺杆空压机总成',
  code: 'KB-75KW-00',
  level: 0,
  spec: '75kW, 8bar',
  status: 'Pending',
  children: [
    {
      id: 'n1',
      name: '主机头总成',
      code: 'KB-75-HA-01',
      level: 1,
      spec: '标准',
      status: 'Pending',
      children: [
        { id: 'n1-1', name: '主轴承', code: 'BRG-001', level: 2, spec: 'D45', status: 'Ingested' },
        { id: 'n1-2', name: '阴阳转子', code: 'RTR-002', level: 2, spec: '75kW', status: 'Pending' },
        { id: 'n1-3', name: '轴封', code: 'SEAL-03', level: 2, spec: '耐高温', status: 'Pending' }
      ]
    },
    {
      id: 'n2',
      name: '油气分离系统',
      code: 'KB-75-OS-02',
      level: 1,
      spec: '综合',
      status: 'Pending',
      children: [
        { id: 'n2-1', name: '油气分离罐', code: 'TNK-01', level: 2, spec: '300L', status: 'Pending' },
        { id: 'n2-2', name: '过滤芯', code: 'FLT-05', level: 2, spec: '高精度', status: 'Pending' },
        { id: 'n2-3', name: '回油阀', code: 'VLV-11', level: 2, spec: '单向', status: 'Ingested' }
      ]
    },
    {
      id: 'n3',
      name: '冷却系统',
      code: 'KB-75-CS-03',
      level: 1,
      spec: '风冷',
      status: 'Ingested',
      children: [
        { id: 'n3-1', name: '冷却风扇', code: 'FAN-01', level: 2, spec: '直连', status: 'Pending' }
      ]
    }
  ]
};

// Flatten tree to get all descendants or specific array
const flattenNodes = (node: BomNode): BomNode[] => {
  let acc = [node];
  if (node.children) {
    node.children.forEach(child => {
      acc = acc.concat(flattenNodes(child));
    });
  }
  return acc;
};

const getAllNodeIds = (node: BomNode): string[] => flattenNodes(node).map(n => n.id);

export function BomWorkbench() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchQuery, setSearchQuery] = useState('');
  
  // Mock BOM summary data instead of select states
  const bomSummary = {
     name: "KB 75kW 螺杆空压机总成 BOM",
     code: "BOM-KB75-001",
     version: "V3.0",
     deviceModel: "KB 75kW 螺杆空压机",
     status: "Active"
  };
  
  // Tree State
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set(['root', 'n1', 'n2']));
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set([]));

  const allNodes = useMemo(() => flattenNodes(MOCK_BOM_DATA), []);
  const { toast } = useToast();
  
  const toggleExpand = (id: string) => {
    const next = new Set(expandedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpandedIds(next);
  };

  const handleSelect = (node: BomNode, isSelected: boolean) => {
    const next = new Set(selectedIds);
    const affectedIds = getAllNodeIds(node);
    
    if (isSelected) {
      // Add node and all descendants
      affectedIds.forEach(id => next.add(id));
      
      // Bottom-up check: if all children of a parent are selected, select the parent
      let changed = true;
      while (changed) {
        changed = false;
        allNodes.forEach(n => {
          if (!next.has(n.id) && n.children && n.children.length > 0) {
            if (n.children.every(child => next.has(child.id))) {
              next.add(n.id);
              changed = true;
            }
          }
        });
      }
    } else {
      // Remove node and all descendants
      affectedIds.forEach(id => next.delete(id));
      
      // Bottom-up check: if any child is missing, parent must be missing
      let changed = true;
      while (changed) {
        changed = false;
        allNodes.forEach(n => {
          if (next.has(n.id) && n.children && n.children.length > 0) {
            if (n.children.some(child => !next.has(child.id))) {
              next.delete(n.id);
              changed = true;
            }
          }
        });
      }
    }
    
    setSelectedIds(next);
  };

  // Re-evaluate parent states dynamically based on selection
  const getNodeSelectionState = (node: BomNode) => {
    const allDescendants = getAllNodeIds(node);
    const selectedCount = allDescendants.filter(id => selectedIds.has(id)).length;
    
    if (selectedCount === 0) return 'none';
    if (selectedCount === allDescendants.length) return 'all';
    return 'partial';
  };

  // Build Graph Nodes based on selected ids
  // We want to show a node in the graph if it is selected, OR if any of its descendants are selected
  const isNodeOrDescendantSelected = (node: BomNode): boolean => {
    if (selectedIds.has(node.id)) return true;
    if (node.children) {
      return node.children.some(child => isNodeOrDescendantSelected(child));
    }
    return false;
  };

  const graphNodes = useMemo(() => {
    return allNodes.filter(n => n.id === 'root' || isNodeOrDescendantSelected(n));
  }, [selectedIds, allNodes]);

  const conflictsCount = graphNodes.filter(n => n.status === 'Ingested' && selectedIds.has(n.id)).length;
  const newImportCount = graphNodes.filter(n => n.status === 'Pending' && selectedIds.has(n.id)).length;

  const removeFromManifest = (id: string) => {
    const node = allNodes.find(n => n.id === id);
    if (node) {
      handleSelect(node, false);
    }
  };

  // Recursive Tree Render
  const renderTree = (node: BomNode, pathName: string = '') => {
    const isExpanded = expandedIds.has(node.id);
    const selectionState = getNodeSelectionState(node);
    const isMatched = searchQuery && (node.name.toLowerCase().includes(searchQuery.toLowerCase()) || node.code.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const currentPath = pathName ? `${pathName} > ${node.name}` : node.name;

    return (
      <div key={node.id} className="select-none flex flex-col">
        <div className={cn(
          "flex items-center group hover:bg-muted/50 rounded-sm py-1.5 px-2 transition-colors border-b border-transparent",
          isMatched && "bg-primary/5 ring-1 ring-primary/20",
          "text-sm"
        )}>
          {/* Indent spacer */}
          <div style={{ width: `${node.level * 20}px` }} className="shrink-0" />
          
          {/* Chevron */}
          <div className="w-5 shrink-0 flex items-center justify-center">
            {node.children && node.children.length > 0 ? (
              <button onClick={() => toggleExpand(node.id)} className="text-muted-foreground hover:text-foreground">
                {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </button>
            ) : (
              <span className="w-4 h-4" />
            )}
          </div>

          {/* Checkbox */}
          <div className="w-6 shrink-0 flex items-center justify-center relative cursor-pointer" 
               onClick={() => handleSelect(node, selectionState !== 'all')}>
             <div className={cn(
               "w-4 h-4 rounded border flex items-center justify-center transition-colors",
               selectionState === 'all' ? "bg-primary border-primary" : 
               selectionState === 'partial' ? "bg-primary/20 border-primary" : "border-input bg-background"
             )}>
                {selectionState === 'all' && <CheckCircle2 className="w-3 h-3 text-white" />}
                {selectionState === 'partial' && <div className="w-2 h-0.5 bg-primary rounded-full" />}
             </div>
          </div>

          {/* Node Info */}
          <div className="flex-1 flex items-center gap-3 min-w-0">
             <div className="font-medium truncate" title={node.name}>{node.name}</div>
             <div className="text-xs text-muted-foreground font-mono bg-muted px-1.5 py-0.5 rounded shrink-0">{node.code}</div>
          </div>

          {/* Level & Spec */}
          <div className="w-12 text-xs text-muted-foreground text-center shrink-0">L{node.level}</div>
          <div className="w-20 text-xs text-muted-foreground truncate shrink-0 pr-2" title={node.spec}>{node.spec}</div>
          
          {/* Status */}
          <div className="w-20 shrink-0 flex justify-end">
             {node.status === 'Ingested' ? (
                <Badge variant="secondary" className="text-[10px] h-5 bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100">已入图</Badge>
             ) : (
                <Badge variant="outline" className="text-[10px] h-5 text-muted-foreground">待入图</Badge>
             )}
          </div>
        </div>

        {isExpanded && node.children && (
          <div className="flex flex-col">
            {node.children.map(child => renderTree(child, currentPath))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Top Control Bar */}
      <div className="flex-none bg-card border-b px-6 py-4 flex flex-col gap-4">
        {/* Breadcrumb & Title */}
        <div className="flex items-center text-sm text-muted-foreground">
          <Database className="w-4 h-4 mr-2" />
          <span>质量系统</span>
          <ChevronRight className="w-4 h-4 mx-1" />
          <Link to="/bom-management" className="hover:text-primary transition-colors hover:underline">BOM 管理</Link>
          <ChevronRight className="w-4 h-4 mx-1" />
          <span className="font-medium text-foreground">{bomSummary.code} ({bomSummary.version})</span>
          <ChevronRight className="w-4 h-4 mx-1" />
          <span className="font-medium text-primary">图谱提取</span>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="h-8 w-8 -ml-2" onClick={() => navigate('/bom-management')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-2xl font-semibold tracking-tight text-primary-900">图谱提取工作台</h1>
            
            <div className="h-6 w-px bg-border mx-2" />
            
            {/* BOM Summary Info */}
            <div className="flex items-center gap-4 text-sm">
              <div className="flex gap-2">
                <span className="text-muted-foreground">BOM名称:</span>
                <span className="font-medium">{bomSummary.name}</span>
              </div>
              <div className="flex gap-2">
                <span className="text-muted-foreground">设备型号:</span>
                <span className="font-medium">{bomSummary.deviceModel}</span>
              </div>
              <Badge variant="outline" className="font-mono text-xs bg-slate-50">{bomSummary.version}</Badge>
              {bomSummary.status === 'Active' && <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-200">启用中</Badge>}
            </div>
          </div>

          <div className="flex items-center gap-3">
             <div className="relative">
               <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
               <Input 
                 placeholder="搜索部件名称或编号..." 
                 className="w-64 pl-9 bg-background h-9 text-sm"
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
               />
             </div>
             <Button variant="outline" size="icon" className="h-9 w-9" title="刷新数据源">
               <RefreshCcw className="w-4 h-4" />
             </Button>
             <Button 
               className="h-9 gap-2 shadow-sm bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
               onClick={() => {
                  if (selectedIds.size === 0) {
                     toast({ title: "提示", description: "请先勾选待入图节点。" });
                     return;
                  }
                  toast({
                     title: "导入开始",
                     description: `正在将 ${selectedIds.size} 个 BOM 节点导入图谱...`
                  });
               }}
             >
               <Play className="w-4 h-4" />
               开始导入入图
             </Button>
          </div>
        </div>
      </div>

      {/* Main Workspace */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Tree Pane */}
        <div className="w-1/2 flex flex-col border-r bg-card/50">
          <div className="flex items-center justify-between px-4 py-3 border-b bg-card">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Layers className="w-4 h-4 text-primary" />
              BOM 结构关系
            </div>
            <div className="text-xs text-muted-foreground">
              共 {allNodes.length} 个节点
            </div>
          </div>
          
          <div className="flex-1 overflow-auto p-2">
            <div className="min-w-[500px]">
              {/* Header Row */}
              <div className="flex items-center py-2 px-2 border-b border-border/50 text-xs font-semibold tracking-wider text-muted-foreground uppercase sticky top-0 bg-card/95 backdrop-blur z-10">
                 <div className="w-[44px] shrink-0" />
                 <div className="flex-1">名称 / Code</div>
                 <div className="w-12 text-center shrink-0">LVL</div>
                 <div className="w-20 shrink-0">规格</div>
                 <div className="w-20 text-right shrink-0">状态</div>
              </div>
              
              {/* Tree Content */}
              <div className="pb-4 pt-1">
                 {renderTree(MOCK_BOM_DATA)}
              </div>
            </div>
          </div>
        </div>

        {/* Right Graph Preview Pane */}
        <div className="w-1/2 flex flex-col bg-[#f8fafc] relative">
          <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-10 pointer-events-none">
            <div className="flex items-center gap-2 bg-white/80 backdrop-blur border shadow-sm px-3 py-1.5 rounded-md pointer-events-auto">
               <Box className="w-4 h-4 text-primary" />
               <span className="text-sm font-medium">实时图谱映射预览</span>
            </div>
            <div className="flex items-center gap-1 bg-white/80 backdrop-blur border shadow-sm rounded-md p-1 pointer-events-auto">
               <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground"><ZoomOut className="w-4 h-4"/></Button>
               <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground"><ZoomIn className="w-4 h-4"/></Button>
               <div className="w-px h-4 bg-border mx-1" />
               <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground"><Maximize2 className="w-4 h-4"/></Button>
            </div>
          </div>

          <div className="flex-1 overflow-auto p-8 relative bg-dot-pattern">
             {selectedIds.size === 0 ? (
               <div className="h-full flex flex-col items-center justify-center gap-3 text-muted-foreground opacity-60">
                 <Database className="w-12 h-12 stroke-1" />
                 <p className="text-sm">在左侧勾选 BOM 节点以预览图谱结构</p>
               </div>
             ) : (
               <div className="min-w-max min-h-max flex justify-center pt-8">
                 {/* Simplified Visual Simulation of Graph Layout */}
                 <div className="flex flex-col items-center relative">
                    {/* Root Node */}
                    <div className="border-2 border-primary/30 bg-primary/10 text-primary-900 px-4 py-2 rounded-lg text-sm font-semibold shadow-sm z-10">
                       BOM ROOT
                    </div>
                    <div className="w-px h-8 bg-primary/30" />
                    
                    {/* Level 1 Nodes */}
                    <div className="flex gap-12 relative">
                      <div className="absolute top-0 left-12 right-12 h-px bg-primary/30 -mt-px pointer-events-none" />
                      
                      {graphNodes.filter(n => n.level === 1).map((node, i) => (
                        <div key={node.id} className="flex flex-col items-center relative">
                           <div className="w-px h-6 bg-primary/30" />
                           <div className={cn(
                             "border shadow-sm px-3 py-1.5 rounded-md text-xs font-medium z-10 w-32 text-center",
                             node.status === 'Ingested' ? "bg-red-50 border-red-200 text-red-800" : "bg-white border-blue-200 text-blue-900"
                           )}>
                             <div className="truncate" title={node.name}>{node.name}</div>
                             <div className="font-mono text-[10px] opacity-70 mt-0.5">{node.code}</div>
                           </div>
                           
                           {/* Level 2 Nodes (Child of this node) */}
                           {graphNodes.filter(child => child.level === 2 && flattenNodes(node).find(x => x.id === child.id)).length > 0 && (
                             <>
                               <div className="w-px h-6 bg-primary/20" />
                               <div className="flex flex-col gap-2 relative mt-1 items-start">
                                 {/* Vertical spine coming from the top center */}
                                 <div className="absolute left-1/2 -top-1 bottom-4 w-px bg-primary/20 -translate-x-1/2 pointer-events-none" />
                                 
                                 {graphNodes.filter(child => child.level === 2 && flattenNodes(node).find(x => x.id === child.id)).map((childNode, idx, arr) => (
                                   <div key={childNode.id} className="flex flex-col items-center relative z-10 mx-auto">
                                     {idx > 0 && <div className="w-px h-2 bg-primary/20 absolute -top-2" />}
                                     <div className={cn(
                                       "border px-2 py-1 rounded text-[10px] w-28 truncate text-center shadow-sm relative bg-background",
                                       childNode.status === 'Ingested' ? "bg-red-50/50 border-red-200 text-red-700" : "border-blue-100 text-blue-800"
                                     )}>
                                        {childNode.name}
                                     </div>
                                   </div>
                                 ))}
                               </div>
                             </>
                           )}
                        </div>
                      ))}
                    </div>
                 </div>
               </div>
             )}
          </div>
        </div>
      </div>

      {/* Bottom Manifest Region */}
      <div className="h-64 border-t bg-card flex flex-col shrink-0">
        <div className="flex h-full">
           {/* Summary Cards */}
           <div className="w-64 border-r p-4 flex flex-col gap-3 bg-muted/20">
             <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-1">本次导入清单</h3>
             
             <Card className="rounded-md border-primary/20 bg-primary/5 shadow-none">
               <CardContent className="p-3 flex items-center justify-between">
                 <span className="text-xs font-medium text-muted-foreground">已选总数 Selected</span>
                 <span className="text-lg font-bold text-primary">{selectedIds.size}</span>
               </CardContent>
             </Card>
             
             <Card className={cn(
               "rounded-md shadow-none",
               conflictsCount > 0 ? "border-red-200 bg-red-50" : "border-border bg-card"
             )}>
               <CardContent className="p-3 flex items-center justify-between">
                 <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                   冲突 Conflicts
                   {conflictsCount > 0 && <AlertCircle className="w-3 h-3 text-red-500" />}
                 </span>
                 <span className={cn("text-lg font-bold", conflictsCount > 0 ? "text-red-600" : "text-foreground")}>
                   {conflictsCount}
                 </span>
               </CardContent>
             </Card>
             
             <Card className="rounded-md border-border bg-card shadow-none">
               <CardContent className="p-3 flex items-center justify-between">
                 <span className="text-xs font-medium text-muted-foreground">新实体 To Import</span>
                 <span className="text-lg font-bold text-green-600">+{newImportCount}</span>
               </CardContent>
             </Card>
           </div>
           
           {/* Manifest Table */}
           <div className="flex-1 flex flex-col min-w-0">
             <div className="flex-1 overflow-auto p-4">
               {selectedIds.size === 0 ? (
                 <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                   暂无待入图对象，请在上方勾选
                 </div>
               ) : (
                 <table className="w-full text-sm text-left">
                   <thead className="text-xs text-muted-foreground uppercase bg-muted/50 sticky top-0">
                     <tr>
                       <th className="px-4 py-2 font-medium rounded-tl-md">部件名称</th>
                       <th className="px-4 py-2 font-medium">Code</th>
                       <th className="px-4 py-2 font-medium">层级路径</th>
                       <th className="px-4 py-2 font-medium">Delta</th>
                       <th className="px-4 py-2 font-medium break-words text-right rounded-tr-md">操作</th>
                     </tr>
                   </thead>
                   <tbody>
                     {Array.from(selectedIds).map(id => {
                       const node = allNodes.find(n => n.id === id);
                       if (!node) return null;
                       
                       const isConflict = node.status === 'Ingested';
                       
                       // Find path (naive approach for UI demo)
                       let pathStr = node.name;
                       if (node.level > 0) {
                          // just mocking parent path
                          if (node.id.startsWith('n1')) pathStr = `主机头总成 > ${node.name}`;
                          else if (node.id.startsWith('n2')) pathStr = `油气分离系统 > ${node.name}`;
                          else if (node.id.startsWith('n3')) pathStr = `冷却系统 > ${node.name}`;
                       } else {
                          pathStr = "-";
                       }
                       
                       return (
                         <tr key={node.id} className="border-b last:border-0 hover:bg-muted/30">
                           <td className="px-4 py-2.5 font-medium text-foreground">
                             {node.name}
                           </td>
                           <td className="px-4 py-2.5 font-mono text-muted-foreground text-xs">
                             {node.code}
                           </td>
                           <td className="px-4 py-2.5 text-muted-foreground">
                             {pathStr}
                           </td>
                           <td className="px-4 py-2.5">
                             {isConflict ? (
                               <Badge variant="destructive" className="bg-red-100 text-red-700 hover:bg-red-100 border-red-200">冲突 (已存在)</Badge>
                             ) : (
                               <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded border border-green-100">+1 Entity</span>
                             )}
                           </td>
                           <td className="px-4 py-2.5 text-right">
                             <Button 
                               variant="ghost" 
                               size="icon" 
                               className="h-7 w-7 text-muted-foreground hover:text-red-600 hover:bg-red-50"
                               onClick={() => removeFromManifest(node.id)}
                               title="移除"
                             >
                               <Trash2 className="w-4 h-4" />
                             </Button>
                           </td>
                         </tr>
                       );
                     })}
                   </tbody>
                 </table>
               )}
             </div>
           </div>
        </div>
      </div>
    </div>
  );
}
