import React, { useState, useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Input } from './ui/input';
import { useToast } from './ui/use-toast';
import { Bot, Check, X, Play, Plus, Save, Network, FileText, CheckCircle2, AlertCircle, Edit3, Trash2, RefreshCw } from 'lucide-react';

type ExtractionStatus = 'pending' | 'approved' | 'rejected';
type NodeType = 'Project' | 'Product' | 'Issue' | 'Component' | 'Cause' | 'Solution' | 'QualityDoc';

interface BuilderNode {
  id: string;
  label: string;
  type: NodeType;
  status: ExtractionStatus;
}

interface BuilderLink {
  id: string;
  source: string;
  target: string;
  label: string;
  status: ExtractionStatus;
}

const typeConfig: Record<NodeType, { color: string; icon: string; label: string }> = {
  Project: { color: '#a855f7', label: '项目', icon: '🏢' },
  Product: { color: '#06b6d4', label: '产品', icon: '🚆' },
  Issue: { color: '#ef4444', label: '问题', icon: '⚠' },
  Component: { color: '#3b82f6', label: '组件', icon: '⚙' },
  Cause: { color: '#f59e0b', label: '原因', icon: '🔍' },
  Solution: { color: '#10b981', label: '解决方案', icon: '✓' },
  QualityDoc: { color: '#4f46e5', label: '质量文档', icon: '📄' },
};

export function KnowledgeGraphBuilder() {
  const { toast } = useToast();
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [sourceText, setSourceText] = useState('2024年8月，地铁1号线A型车发生制动盘异常磨损。经排查，根本原因是闸瓦材质过硬，导致摩擦面受损。建议更新检验规范。参考文档：制动盘总成 PFMEA (DOC-001)。');
  const [isExtracting, setIsExtracting] = useState(false);
  const [hasExtracted, setHasExtracted] = useState(false);

  const [nodes, setNodes] = useState<BuilderNode[]>([]);
  const [links, setLinks] = useState<BuilderLink[]>([]);

  const [activeTab, setActiveTab] = useState<'nodes' | 'links'>('nodes');

  const handleExtract = () => {
    if (!sourceText.trim()) return;
    setIsExtracting(true);
    
    // Mock AI Extraction
    setTimeout(() => {
      setNodes([
        { id: 'n1', label: '地铁1号线', type: 'Project', status: 'pending' },
        { id: 'n2', label: 'A型车', type: 'Product', status: 'pending' },
        { id: 'n3', label: '制动盘', type: 'Component', status: 'pending' },
        { id: 'n4', label: '闸瓦', type: 'Component', status: 'pending' },
        { id: 'n5', label: '异常磨损', type: 'Issue', status: 'pending' },
        { id: 'n6', label: '材质过硬', type: 'Cause', status: 'pending' },
        { id: 'n7', label: '更新检验规范', type: 'Solution', status: 'pending' },
        { id: 'n8', label: '制动盘总成 PFMEA', type: 'QualityDoc', status: 'pending' },
      ]);
      setLinks([
        { id: 'l1', source: 'n1', target: 'n2', label: '包含', status: 'pending' },
        { id: 'l2', source: 'n2', target: 'n3', label: '使用', status: 'pending' },
        { id: 'l3', source: 'n2', target: 'n4', label: '使用', status: 'pending' },
        { id: 'l4', source: 'n3', target: 'n5', label: '发生', status: 'pending' },
        { id: 'l5', source: 'n5', target: 'n6', label: '归因于', status: 'pending' },
        { id: 'l6', source: 'n6', target: 'n7', label: '解决措施', status: 'pending' },
        { id: 'l7', source: 'n8', target: 'n3', label: '关联部件', status: 'pending' },
        { id: 'l8', source: 'n8', target: 'n5', label: '预防失效', status: 'pending' },
      ]);
      setIsExtracting(false);
      setHasExtracted(true);
      toast({
        title: "抽取完成",
        description: "AI 已从文本中提取出 8 个实体和 8 条关系，请进行人工审核。",
      });
    }, 1500);
  };

  const updateNodeStatus = (id: string, status: ExtractionStatus) => {
    setNodes(prev => prev.map(n => n.id === id ? { ...n, status } : n));
  };

  const updateLinkStatus = (id: string, status: ExtractionStatus) => {
    setLinks(prev => prev.map(l => l.id === id ? { ...l, status } : l));
  };

  const approveAll = () => {
    setNodes(prev => prev.map(n => ({ ...n, status: 'approved' })));
    setLinks(prev => prev.map(l => ({ ...l, status: 'approved' })));
    toast({ title: "全部通过", description: "已一键通过所有待审核的实体和关系。" });
  };

  const handleSaveToGraph = () => {
    const approvedNodes = nodes.filter(n => n.status === 'approved');
    const approvedLinks = links.filter(l => l.status === 'approved');
    if (approvedNodes.length === 0) {
      toast({ title: "无法保存", description: "没有已通过的实体可以保存。", variant: "destructive" });
      return;
    }
    toast({
      title: "保存成功",
      description: `成功将 ${approvedNodes.length} 个实体和 ${approvedLinks.length} 条关系入库！`,
    });
    // Reset after save
    setNodes([]);
    setLinks([]);
    setHasExtracted(false);
    setSourceText('');
  };

  // D3 Preview Rendering
  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight || 500;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const displayNodes = nodes.filter(n => n.status !== 'rejected').map(d => ({ ...d } as d3.SimulationNodeDatum & BuilderNode));
    const nodeIds = new Set(displayNodes.map(n => n.id));
    const displayLinks = links
      .filter(l => l.status !== 'rejected' && nodeIds.has(l.source) && nodeIds.has(l.target))
      .map(d => ({ ...d } as d3.SimulationLinkDatum<d3.SimulationNodeDatum & BuilderNode> & BuilderLink));

    if (displayNodes.length === 0) return;

    const g = svg.append('g');

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.2, 3])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoom);
    // Center initially
    svg.call(zoom.transform, d3.zoomIdentity.translate(width / 2, height / 2).scale(0.8).translate(-width / 2, -height / 2));

    const simulation = d3.forceSimulation(displayNodes)
      .force('link', d3.forceLink(displayLinks).id((d: any) => d.id).distance(120))
      .force('charge', d3.forceManyBody().strength(-500))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collide', d3.forceCollide().radius(50));

    // Arrow markers
    svg.append('defs').append('marker')
      .attr('id', 'arrow-pending')
      .attr('viewBox', '-0 -5 10 10')
      .attr('refX', 25)
      .attr('refY', 0)
      .attr('orient', 'auto')
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .append('svg:path')
      .attr('d', 'M 0,-5 L 10 ,0 L 0,5')
      .attr('fill', '#f59e0b'); // Amber for pending

    svg.append('defs').append('marker')
      .attr('id', 'arrow-approved')
      .attr('viewBox', '-0 -5 10 10')
      .attr('refX', 25)
      .attr('refY', 0)
      .attr('orient', 'auto')
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .append('svg:path')
      .attr('d', 'M 0,-5 L 10 ,0 L 0,5')
      .attr('fill', '#10b981'); // Emerald for approved

    const link = g.append('g')
      .selectAll('line')
      .data(displayLinks)
      .enter().append('line')
      .attr('stroke', d => d.status === 'approved' ? '#10b981' : '#f59e0b')
      .attr('stroke-width', d => d.status === 'approved' ? 2 : 1.5)
      .attr('stroke-dasharray', d => d.status === 'pending' ? '4,4' : 'none')
      .attr('marker-end', d => d.status === 'approved' ? 'url(#arrow-approved)' : 'url(#arrow-pending)');

    const linkText = g.append('g')
      .selectAll('text')
      .data(displayLinks)
      .enter().append('text')
      .attr('font-size', '10px')
      .attr('fill', d => d.status === 'approved' ? '#059669' : '#d97706')
      .attr('text-anchor', 'middle')
      .text(d => d.label);

    const node = g.append('g')
      .selectAll('g')
      .data(displayNodes)
      .enter().append('g')
      .call(d3.drag<SVGGElement, any>()
        .on('start', (event, d) => {
          if (!event.active) simulation.alphaTarget(0.3).restart();
          d.fx = d.x;
          d.fy = d.y;
        })
        .on('drag', (event, d) => {
          d.fx = event.x;
          d.fy = event.y;
        })
        .on('end', (event, d) => {
          if (!event.active) simulation.alphaTarget(0);
          d.fx = null;
          d.fy = null;
        })
      );

    node.append('circle')
      .attr('r', 20)
      .attr('fill', d => typeConfig[d.type].color)
      .attr('stroke', d => d.status === 'approved' ? '#10b981' : '#f59e0b')
      .attr('stroke-width', 3)
      .attr('stroke-dasharray', d => d.status === 'pending' ? '4,4' : 'none')
      .style('cursor', 'pointer');

    node.append('text')
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'central')
      .attr('font-family', 'system-ui')
      .attr('font-size', '14px')
      .attr('fill', '#fff')
      .style('pointer-events', 'none')
      .text(d => typeConfig[d.type].icon);

    node.append('text')
      .attr('dy', 32)
      .attr('text-anchor', 'middle')
      .attr('font-size', '12px')
      .attr('font-weight', '600')
      .attr('fill', '#1e293b')
      .text(d => d.label);

    simulation.on('tick', () => {
      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);

      linkText
        .attr('x', (d: any) => (d.source.x + d.target.x) / 2)
        .attr('y', (d: any) => (d.source.y + d.target.y) / 2 - 5);

      node
        .attr('transform', (d: any) => `translate(${d.x},${d.y})`);
    });

    return () => {
      simulation.stop();
    };
  }, [nodes, links]);

  return (
    <div className="flex flex-col gap-6 h-[800px]">
      <div className="flex justify-between items-center bg-muted/30 p-4 rounded-xl border border-border/50">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Network className="w-5 h-5 text-primary" />
            人机在环图谱构建器 (Human-in-the-loop Builder)
          </h2>
          <p className="text-sm text-muted-foreground mt-1">输入非结构化文本，AI 辅助抽取实体与关系，人工审核后入库。</p>
        </div>
        <Button onClick={handleSaveToGraph} disabled={!hasExtracted || nodes.filter(n => n.status === 'approved').length === 0} className="shadow-sm">
          <Save className="w-4 h-4 mr-2" /> 确认入库
        </Button>
      </div>

      <div className="flex gap-6 flex-1 min-h-0">
        {/* Left Panel: Input & Review */}
        <div className="w-1/3 flex flex-col gap-4 min-h-0">
          {/* Source Input */}
          <Card className="shrink-0 glass-panel border-border/50 shadow-sm">
            <CardHeader className="py-3 px-4 border-b border-border/50 bg-muted/10">
              <CardTitle className="text-sm flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" />
                数据源输入
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              <Textarea 
                className="min-h-[120px] text-sm resize-none" 
                placeholder="粘贴故障报告、维修记录或标准文档..."
                value={sourceText}
                onChange={(e) => setSourceText(e.target.value)}
              />
              <Button className="w-full" onClick={handleExtract} disabled={isExtracting || !sourceText.trim()}>
                {isExtracting ? (
                  <span className="flex items-center gap-2"><RefreshCw className="w-4 h-4 animate-spin" /> 正在智能抽取...</span>
                ) : (
                  <span className="flex items-center gap-2"><Bot className="w-4 h-4" /> AI 智能抽取</span>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Review Panel */}
          <Card className="flex-1 flex flex-col min-h-0 glass-panel border-border/50 shadow-sm">
            <CardHeader className="py-3 px-4 border-b border-border/50 bg-muted/10 flex flex-row items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-primary" />
                人工审核 (HITL)
              </CardTitle>
              {hasExtracted && (
                <Button variant="outline" size="sm" className="h-7 text-xs" onClick={approveAll}>
                  一键通过
                </Button>
              )}
            </CardHeader>
            <div className="flex border-b border-border/50">
              <button 
                className={`flex-1 py-2 text-sm font-medium text-center transition-colors ${activeTab === 'nodes' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                onClick={() => setActiveTab('nodes')}
              >
                实体 ({nodes.length})
              </button>
              <button 
                className={`flex-1 py-2 text-sm font-medium text-center transition-colors ${activeTab === 'links' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                onClick={() => setActiveTab('links')}
              >
                关系 ({links.length})
              </button>
            </div>
            <CardContent className="flex-1 overflow-y-auto p-2 space-y-2 bg-slate-50/50 dark:bg-slate-900/20">
              {!hasExtracted ? (
                <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-50">
                  <Bot className="w-12 h-12 mb-2" />
                  <p className="text-sm">等待 AI 抽取数据...</p>
                </div>
              ) : activeTab === 'nodes' ? (
                nodes.map(node => (
                  <div key={node.id} className={`p-3 rounded-lg border flex items-center justify-between gap-2 transition-all ${node.status === 'approved' ? 'bg-emerald-50/50 border-emerald-200 dark:bg-emerald-900/10 dark:border-emerald-800' : node.status === 'rejected' ? 'bg-red-50/50 border-red-200 opacity-50 dark:bg-red-900/10 dark:border-red-800' : 'bg-background border-border shadow-sm'}`}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-[10px] py-0 h-4" style={{ color: typeConfig[node.type].color, borderColor: typeConfig[node.type].color }}>
                          {typeConfig[node.type].label}
                        </Badge>
                        {node.status === 'pending' && <Badge variant="secondary" className="text-[10px] py-0 h-4 bg-amber-100 text-amber-700 hover:bg-amber-100">待审</Badge>}
                      </div>
                      <div className="font-medium text-sm truncate">{node.label}</div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      {node.status !== 'approved' && (
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-emerald-600 hover:bg-emerald-100 hover:text-emerald-700" onClick={() => updateNodeStatus(node.id, 'approved')}>
                          <Check className="w-4 h-4" />
                        </Button>
                      )}
                      {node.status !== 'rejected' && (
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-red-600 hover:bg-red-100 hover:text-red-700" onClick={() => updateNodeStatus(node.id, 'rejected')}>
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                links.map(link => {
                  const sourceNode = nodes.find(n => n.id === link.source);
                  const targetNode = nodes.find(n => n.id === link.target);
                  return (
                    <div key={link.id} className={`p-3 rounded-lg border flex flex-col gap-2 transition-all ${link.status === 'approved' ? 'bg-emerald-50/50 border-emerald-200 dark:bg-emerald-900/10 dark:border-emerald-800' : link.status === 'rejected' ? 'bg-red-50/50 border-red-200 opacity-50 dark:bg-red-900/10 dark:border-red-800' : 'bg-background border-border shadow-sm'}`}>
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className="text-[10px] py-0 h-4 bg-muted/50">{link.label}</Badge>
                        <div className="flex gap-1 shrink-0">
                          {link.status !== 'approved' && (
                            <Button variant="ghost" size="icon" className="h-6 w-6 text-emerald-600 hover:bg-emerald-100 hover:text-emerald-700" onClick={() => updateLinkStatus(link.id, 'approved')}>
                              <Check className="w-3 h-3" />
                            </Button>
                          )}
                          {link.status !== 'rejected' && (
                            <Button variant="ghost" size="icon" className="h-6 w-6 text-red-600 hover:bg-red-100 hover:text-red-700" onClick={() => updateLinkStatus(link.id, 'rejected')}>
                              <X className="w-3 h-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="truncate max-w-[40%] font-medium text-foreground">{sourceNode?.label || link.source}</span>
                        <span>→</span>
                        <span className="truncate max-w-[40%] font-medium text-foreground">{targetNode?.label || link.target}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Panel: Graph Preview */}
        <Card className="w-2/3 flex flex-col min-h-0 glass-panel border-border/50 shadow-sm">
          <CardHeader className="py-3 px-4 border-b border-border/50 bg-muted/10 flex flex-row items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <Play className="w-4 h-4 text-primary" />
              实时图谱预览
            </CardTitle>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-amber-500"></div> 待审核 (虚线)</span>
              <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> 已通过 (实线)</span>
            </div>
          </CardHeader>
          <CardContent className="flex-1 p-0 relative bg-slate-50/50 dark:bg-slate-900/20" ref={containerRef}>
            {!hasExtracted ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground opacity-50">
                <Network className="w-16 h-16 mb-4" />
                <p>图谱预览区域</p>
              </div>
            ) : (
              <svg ref={svgRef} className="w-full h-full cursor-grab active:cursor-grabbing" />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
