import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { useToast } from './ui/use-toast';
import { ZoomIn, ZoomOut, Maximize, RefreshCw, Search, Filter, Layers, ExternalLink, GitMerge, MessageSquare, Send, Bot, User, Sparkles } from 'lucide-react';

interface GraphNode extends d3.SimulationNodeDatum {
  id: string;
  group: number;
  label: string;
  type: 'Project' | 'Product' | 'Issue' | 'Component' | 'Cause' | 'Solution' | 'QualityDoc';
  occurrences?: number;
  confidence?: number;
}

interface GraphLink extends d3.SimulationLinkDatum<GraphNode> {
  source: string | GraphNode;
  target: string | GraphNode;
  label: string;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'ai';
  content: string;
  highlightNodes?: string[];
}

const rawNodes: GraphNode[] = [
  // Projects
  { id: 'PROJ-A', group: 5, label: '地铁1号线', type: 'Project' },
  { id: 'PROJ-B', group: 5, label: '高铁CRH380', type: 'Project' },
  // Products
  { id: 'PROD-X', group: 6, label: 'A型车', type: 'Product' },
  { id: 'PROD-Y', group: 6, label: '动车组', type: 'Product' },
  // Components
  { id: 'COMP-001', group: 2, label: '闸瓦', type: 'Component' },
  { id: 'COMP-002', group: 2, label: '制动盘', type: 'Component' },
  { id: 'COMP-003', group: 2, label: '制动夹钳', type: 'Component' },
  // Issues
  { id: 'ISS-001', group: 1, label: '制动盘异常磨损', type: 'Issue', occurrences: 12 },
  { id: 'ISS-002', group: 1, label: '制动盘偏磨异响', type: 'Issue', occurrences: 5 },
  { id: 'ISS-003', group: 1, label: '闸瓦异常脱落', type: 'Issue', occurrences: 2 },
  // Causes
  { id: 'CAUSE-001', group: 3, label: '材质过硬', type: 'Cause', confidence: 0.92 },
  { id: 'CAUSE-002', group: 3, label: '配方比例错误', type: 'Cause', confidence: 0.85 },
  { id: 'CAUSE-003', group: 3, label: '夹钳安装不平行', type: 'Cause', confidence: 0.78 },
  { id: 'CAUSE-004', group: 3, label: '固定螺栓松动', type: 'Cause', confidence: 0.88 },
  // Solutions
  { id: 'SOL-001', group: 4, label: '更新检验规范', type: 'Solution', occurrences: 45 },
  { id: 'SOL-002', group: 4, label: '隔离退回', type: 'Solution', occurrences: 8 },
  { id: 'SOL-003', group: 4, label: '重新校准工装', type: 'Solution', occurrences: 12 },
  { id: 'SOL-004', group: 4, label: '增加防松标记', type: 'Solution', occurrences: 30 },
  // Quality Docs
  { id: 'DOC-001', group: 7, label: '制动盘总成 PFMEA', type: 'QualityDoc' },
  { id: 'DOC-002', group: 7, label: '闸瓦安装 SOP', type: 'QualityDoc' },
];

const rawLinks: GraphLink[] = [
  { source: 'PROJ-A', target: 'PROD-X', label: '包含' },
  { source: 'PROJ-B', target: 'PROD-Y', label: '包含' },
  { source: 'PROD-X', target: 'COMP-001', label: '使用' },
  { source: 'PROD-X', target: 'COMP-002', label: '使用' },
  { source: 'PROD-Y', target: 'COMP-002', label: '使用' },
  { source: 'PROD-Y', target: 'COMP-003', label: '使用' },

  { source: 'COMP-002', target: 'ISS-001', label: '发生' },
  { source: 'COMP-002', target: 'ISS-002', label: '发生' },
  { source: 'COMP-001', target: 'ISS-003', label: '发生' },
  { source: 'COMP-003', target: 'ISS-002', label: '关联' },

  { source: 'ISS-001', target: 'CAUSE-001', label: '归因于' },
  { source: 'CAUSE-001', target: 'CAUSE-002', label: '深层原因' },
  { source: 'ISS-002', target: 'CAUSE-003', label: '归因于' },
  { source: 'ISS-003', target: 'CAUSE-004', label: '归因于' },

  { source: 'CAUSE-001', target: 'SOL-001', label: '解决措施' },
  { source: 'CAUSE-002', target: 'SOL-002', label: '解决措施' },
  { source: 'CAUSE-003', target: 'SOL-003', label: '解决措施' },
  { source: 'CAUSE-004', target: 'SOL-004', label: '解决措施' },

  // Doc Links
  { source: 'DOC-001', target: 'COMP-002', label: '关联部件' },
  { source: 'DOC-001', target: 'ISS-001', label: '预防失效' },
  { source: 'DOC-002', target: 'COMP-001', label: '操作指导' },
  { source: 'DOC-002', target: 'SOL-004', label: '落实措施' },
];

const colorScale = d3.scaleOrdinal<number, string>()
  .domain([1, 2, 3, 4, 5, 6, 7])
  .range(['#ef4444', '#3b82f6', '#f59e0b', '#10b981', '#a855f7', '#06b6d4', '#4f46e5']);

const typeConfig = {
  Project: { color: '#a855f7', label: '项目', icon: '🏢' },
  Product: { color: '#06b6d4', label: '产品', icon: '🚆' },
  Issue: { color: '#ef4444', label: '问题', icon: '⚠' },
  Component: { color: '#3b82f6', label: '组件', icon: '⚙' },
  Cause: { color: '#f59e0b', label: '原因', icon: '🔍' },
  Solution: { color: '#10b981', label: '解决方案', icon: '✓' },
  QualityDoc: { color: '#4f46e5', label: '质量文档', icon: '📄' },
};

export function KnowledgeGraph() {
  const { toast } = useToast();
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);
  
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [visibleTypes, setVisibleTypes] = useState<Set<string>>(new Set(Object.keys(typeConfig)));
  
  // Q&A State
  const [chatInput, setChatInput] = useState('');
  const [activeHighlight, setActiveHighlight] = useState<string[] | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([
    {
      id: 'msg-0',
      role: 'ai',
      content: '您好！我是图谱智能助手。您可以向我提问，例如：“跨项目分析制动盘的共性故障” 或 “查询闸瓦脱落的解决链路”。我会为您深度检索并高亮相关图谱。'
    }
  ]);
  
  // Use refs for state accessed inside D3 callbacks to avoid stale closures
  const selectedNodeRef = useRef<GraphNode | null>(null);
  const searchQueryRef = useRef(searchQuery);
  const activeHighlightRef = useRef<string[] | null>(null);

  const linkedByIndex = useMemo(() => {
    const map: Record<string, boolean> = {};
    rawLinks.forEach(d => {
      const sourceId = typeof d.source === 'string' ? d.source : d.source.id;
      const targetId = typeof d.target === 'string' ? d.target : d.target.id;
      map[`${sourceId},${targetId}`] = true;
      map[`${targetId},${sourceId}`] = true;
    });
    return map;
  }, []);

  function isConnected(a: GraphNode | string, b: GraphNode | string) {
    const aId = typeof a === 'string' ? a : a.id;
    const bId = typeof b === 'string' ? b : b.id;
    return linkedByIndex[`${aId},${bId}`] || aId === bId;
  }

  useEffect(() => {
    selectedNodeRef.current = selectedNode;
    activeHighlightRef.current = activeHighlight;
    updateGraphStyles();
  }, [selectedNode, activeHighlight]);

  useEffect(() => {
    searchQueryRef.current = searchQuery;
    if (svgRef.current) {
      const svg = d3.select(svgRef.current);
      svg.selectAll('.node-group').each(function(d: any) {
        const isMatch = searchQueryRef.current && d.label.toLowerCase().includes(searchQueryRef.current.toLowerCase());
        d3.select(this).select('circle')
          .attr('stroke', isMatch ? '#1e293b' : '#fff')
          .attr('stroke-width', isMatch ? 4 : 2);
      });
    }
  }, [searchQuery]);

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatHistory]);

  const updateGraphStyles = () => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    const node = svg.selectAll('.node-group');
    const link = svg.selectAll('.links line');
    const linkText = svg.selectAll('.link-labels text');

    const highlight = activeHighlightRef.current;
    const selected = selectedNodeRef.current;

    if (highlight) {
      const highlightSet = new Set(highlight);
      node.style('opacity', (d: any) => highlightSet.has(d.id) ? 1 : 0.1);
      link.style('opacity', (d: any) => highlightSet.has(d.source.id) && highlightSet.has(d.target.id) ? 1 : 0.1);
      linkText.style('opacity', (d: any) => highlightSet.has(d.source.id) && highlightSet.has(d.target.id) ? 1 : 0.1);
    } else if (selected) {
      node.style('opacity', (d: any) => isConnected(selected, d) ? 1 : 0.1);
      link.style('opacity', (d: any) => d.source.id === selected.id || d.target.id === selected.id ? 1 : 0.1);
      linkText.style('opacity', (d: any) => d.source.id === selected.id || d.target.id === selected.id ? 1 : 0.1);
    } else {
      node.style('opacity', 1);
      link.style('opacity', 1);
      linkText.style('opacity', 1);
    }
  };

  const toggleType = (type: string) => {
    setVisibleTypes(prev => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
    setSelectedNode(null);
    setActiveHighlight(null);
  };

  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight || 600;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const nodes = rawNodes.filter(n => visibleTypes.has(n.type)).map(d => ({ ...d }));
    const nodeIds = new Set(nodes.map(n => n.id));
    const links = rawLinks
      .filter(l => nodeIds.has(typeof l.source === 'string' ? l.source : l.source.id) && 
                   nodeIds.has(typeof l.target === 'string' ? l.target : l.target.id))
      .map(d => ({ ...d }));

    const g = svg.append('g');

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoom);
    zoomRef.current = zoom;

    const simulation = d3.forceSimulation<GraphNode>(nodes)
      .force('link', d3.forceLink<GraphNode, GraphLink>(links).id(d => d.id).distance(100))
      .force('charge', d3.forceManyBody().strength(-600))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collide', d3.forceCollide().radius(60));

    svg.append('defs').append('marker')
      .attr('id', 'arrowhead')
      .attr('viewBox', '-0 -5 10 10')
      .attr('refX', 28)
      .attr('refY', 0)
      .attr('orient', 'auto')
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('xoverflow', 'visible')
      .append('svg:path')
      .attr('d', 'M 0,-5 L 10 ,0 L 0,5')
      .attr('fill', '#94a3b8')
      .style('stroke', 'none');

    const link = g.append('g')
      .attr('class', 'links')
      .selectAll('line')
      .data(links)
      .enter().append('line')
      .attr('stroke', '#cbd5e1')
      .attr('stroke-width', 2)
      .attr('marker-end', 'url(#arrowhead)')
      .attr('class', 'transition-opacity duration-300');

    const linkText = g.append('g')
      .attr('class', 'link-labels')
      .selectAll('text')
      .data(links)
      .enter().append('text')
      .attr('font-size', '10px')
      .attr('fill', '#64748b')
      .attr('text-anchor', 'middle')
      .attr('class', 'transition-opacity duration-300 pointer-events-none bg-background')
      .text(d => d.label);

    const node = g.append('g')
      .attr('class', 'nodes')
      .selectAll('g')
      .data(nodes)
      .enter().append('g')
      .attr('class', 'node-group transition-opacity duration-300')
      .call(d3.drag<SVGGElement, GraphNode>()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended)
      )
      .on('mouseover', function(event, d) {
        if (!activeHighlightRef.current && !selectedNodeRef.current) {
          node.style('opacity', o => isConnected(d, o) ? 1 : 0.1);
          link.style('opacity', o => (o.source as GraphNode).id === d.id || (o.target as GraphNode).id === d.id ? 1 : 0.1);
          linkText.style('opacity', o => (o.source as GraphNode).id === d.id || (o.target as GraphNode).id === d.id ? 1 : 0.1);
        }
        d3.select(this).select('circle').attr('stroke', '#1e293b').attr('stroke-width', 3);
      })
      .on('mouseout', function(event, d) {
        updateGraphStyles();
        const isMatch = searchQueryRef.current && d.label.toLowerCase().includes(searchQueryRef.current.toLowerCase());
        d3.select(this).select('circle')
          .attr('stroke', isMatch ? '#1e293b' : '#fff')
          .attr('stroke-width', isMatch ? 4 : 2);
      })
      .on('click', (event, d) => {
        setSelectedNode(d);
        setActiveHighlight(null); // Clear Q&A highlight when manually selecting
        event.stopPropagation();
      });

    node.append('circle')
      .attr('r', d => d.type === 'Project' || d.type === 'Product' ? 26 : (d.type === 'Issue' ? 24 : 20))
      .attr('fill', d => colorScale(d.group))
      .attr('stroke', '#fff')
      .attr('stroke-width', 2)
      .style('cursor', 'pointer')
      .style('filter', 'drop-shadow(0 4px 6px rgba(0,0,0,0.1))');

    node.append('text')
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'central')
      .attr('font-family', 'system-ui')
      .attr('font-size', '14px')
      .attr('fill', '#fff')
      .style('pointer-events', 'none')
      .text(d => typeConfig[d.type].icon);

    node.append('text')
      .attr('dy', 40)
      .attr('text-anchor', 'middle')
      .attr('font-size', '12px')
      .attr('font-weight', '600')
      .attr('fill', '#1e293b')
      .style('pointer-events', 'none')
      .style('text-shadow', '0 1px 3px rgba(255,255,255,0.8)')
      .text(d => d.label);

    svg.on('click', () => {
      setSelectedNode(null);
      setActiveHighlight(null);
    });

    simulation.on('tick', () => {
      link
        .attr('x1', d => (d.source as GraphNode).x!)
        .attr('y1', d => (d.source as GraphNode).y!)
        .attr('x2', d => (d.target as GraphNode).x!)
        .attr('y2', d => (d.target as GraphNode).y!);

      linkText
        .attr('x', d => ((d.source as GraphNode).x! + (d.target as GraphNode).x!) / 2)
        .attr('y', d => ((d.source as GraphNode).y! + (d.target as GraphNode).y!) / 2 - 5);

      node
        .attr('transform', d => `translate(${d.x},${d.y})`);
    });

    function dragstarted(event: d3.D3DragEvent<SVGGElement, GraphNode, GraphNode>, d: GraphNode) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(event: d3.D3DragEvent<SVGGElement, GraphNode, GraphNode>, d: GraphNode) {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragended(event: d3.D3DragEvent<SVGGElement, GraphNode, GraphNode>, d: GraphNode) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }

    // Initial styles
    updateGraphStyles();

    return () => {
      simulation.stop();
    };
  }, [visibleTypes]);

  const handleZoomIn = () => {
    if (svgRef.current && zoomRef.current) {
      d3.select(svgRef.current).transition().duration(300).call(zoomRef.current.scaleBy, 1.3);
    }
  };

  const handleZoomOut = () => {
    if (svgRef.current && zoomRef.current) {
      d3.select(svgRef.current).transition().duration(300).call(zoomRef.current.scaleBy, 1 / 1.3);
    }
  };

  const handleResetZoom = () => {
    if (svgRef.current && zoomRef.current) {
      d3.select(svgRef.current).transition().duration(500).call(zoomRef.current.transform, d3.zoomIdentity);
    }
  };

  const executeQuery = (query: string) => {
    setChatHistory(prev => [...prev, { id: Date.now().toString(), role: 'user', content: query }]);
    setSelectedNode(null); // Clear manual selection
    
    setTimeout(() => {
      let responseContent = '';
      let highlightIds: string[] = [];

      if (query.includes('跨项目') && query.includes('制动盘')) {
        responseContent = '已为您深度检索跨项目（地铁1号线、高铁CRH380）中与【制动盘】相关的所有故障。共发现 2 类主要故障（异常磨损、偏磨异响），核心根因指向【材质过硬】与【夹钳安装不平行】。图谱已为您高亮相关链路。';
        highlightIds = ['PROJ-A', 'PROJ-B', 'PROD-X', 'PROD-Y', 'COMP-002', 'ISS-001', 'ISS-002', 'CAUSE-001', 'CAUSE-002', 'CAUSE-003', 'SOL-001', 'SOL-002', 'SOL-003', 'DOC-001'];
      } else if (query.includes('闸瓦脱落')) {
        responseContent = '已为您检索【闸瓦异常脱落】的完整解决链路。该问题主要发生在 A型车（地铁1号线），核心根因为【固定螺栓松动】，标准解决措施为【增加防松标记】。图谱已为您高亮。';
        highlightIds = ['PROJ-A', 'PROD-X', 'COMP-001', 'ISS-003', 'CAUSE-004', 'SOL-004', 'DOC-002'];
      } else {
        responseContent = `关于“${query}”的检索结果：已在图谱中为您匹配相关节点。您可以点击高亮节点查看详细业务指标。`;
        // Simple keyword match for demo
        highlightIds = rawNodes.filter(n => n.label.includes(query) || query.includes(n.label)).map(n => n.id);
        if (highlightIds.length === 0) highlightIds = rawNodes.map(n => n.id); // Show all if no match
      }

      setChatHistory(prev => [...prev, { 
        id: (Date.now() + 1).toString(), 
        role: 'ai', 
        content: responseContent,
        highlightNodes: highlightIds
      }]);
      setActiveHighlight(highlightIds);
      
      // Auto zoom to fit highlighted nodes could be added here
    }, 600);
  };

  const handleSendQA = () => {
    if (!chatInput.trim()) return;
    executeQuery(chatInput);
    setChatInput('');
  };

  return (
    <div className="flex gap-4 h-[750px]">
      {/* Q&A Sidebar */}
      <Card className="w-80 flex flex-col overflow-hidden glass-panel border-border/50 shadow-md shrink-0">
        <CardHeader className="border-b border-border/50 bg-primary/5 py-4">
          <CardTitle className="text-base flex items-center gap-2 text-primary-900 dark:text-primary-100">
            <Sparkles className="w-5 h-5 text-primary" />
            图谱智能检索
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-1">支持跨项目、跨部件的自然语言深度查询</p>
        </CardHeader>
        
        <CardContent className="flex-1 p-4 overflow-y-auto space-y-4" ref={chatScrollRef}>
          {chatHistory.map((msg) => (
            <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'ai' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                {msg.role === 'ai' ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
              </div>
              <div className={`text-sm p-3 rounded-2xl max-w-[85%] ${msg.role === 'user' ? 'bg-primary text-primary-foreground rounded-tr-sm' : 'bg-muted/50 border border-border/50 rounded-tl-sm'}`}>
                {msg.content}
                {msg.highlightNodes && (
                  <Button 
                    variant="link" 
                    className="h-auto p-0 text-xs mt-2 text-primary flex items-center gap-1"
                    onClick={() => setActiveHighlight(msg.highlightNodes!)}
                  >
                    <Layers className="w-3 h-3" /> 重新高亮图谱
                  </Button>
                )}
              </div>
            </div>
          ))}
        </CardContent>

        <div className="p-3 bg-muted/10 border-t border-border/50 space-y-3">
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="text-[10px] cursor-pointer hover:bg-primary hover:text-primary-foreground" onClick={() => executeQuery('分析跨项目制动盘共性故障及根因')}>
              跨项目制动盘分析
            </Badge>
            <Badge variant="secondary" className="text-[10px] cursor-pointer hover:bg-primary hover:text-primary-foreground" onClick={() => executeQuery('查询闸瓦脱落的完整解决链路')}>
              闸瓦脱落解决链路
            </Badge>
          </div>
          <div className="relative flex items-center">
            <Input 
              placeholder="输入查询需求..." 
              className="pr-10 bg-background rounded-full"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendQA()}
            />
            <Button size="icon" variant="ghost" className="absolute right-1 h-8 w-8 rounded-full text-primary hover:bg-primary/10" onClick={handleSendQA}>
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>

      {/* Main Graph Area */}
      <Card className="flex-1 flex flex-col overflow-hidden glass-panel border-border/50 shadow-md">
        <CardHeader className="border-b border-border/50 bg-muted/30 py-3 px-4 flex flex-row items-center justify-between">
          <div className="flex items-center gap-4">
            <CardTitle className="text-base flex items-center gap-2">
              <Layers className="w-5 h-5 text-primary" />
              根因关联图谱
            </CardTitle>
            <div className="h-6 w-px bg-border/50 mx-2"></div>
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="快速定位节点..." 
                className="pl-9 h-8 rounded-full bg-background text-xs shadow-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <div className="flex gap-1.5 bg-background p-1 rounded-lg border border-border/50 shadow-sm">
            {activeHighlight && (
              <Button variant="outline" size="sm" className="h-7 text-xs mr-2 text-primary border-primary/20 bg-primary/5" onClick={() => setActiveHighlight(null)}>
                清除检索高亮
              </Button>
            )}
            <Button variant="ghost" size="icon" className="h-7 w-7 rounded-md hover:bg-muted" onClick={handleZoomIn} title="放大">
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 rounded-md hover:bg-muted" onClick={handleZoomOut} title="缩小">
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 rounded-md hover:bg-muted" onClick={handleResetZoom} title="重置视图">
              <Maximize className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0 flex-1 relative bg-slate-50/50 dark:bg-slate-900/20" ref={containerRef}>
          <svg ref={svgRef} className="w-full h-full cursor-grab active:cursor-grabbing" />
          
          {/* Interactive Legend / Filters */}
          <div className="absolute bottom-6 left-6 bg-background/95 backdrop-blur-xl p-4 rounded-xl border border-border/50 shadow-lg flex flex-col gap-3 min-w-[160px]">
            <div className="text-xs font-bold text-muted-foreground flex items-center gap-1.5 uppercase tracking-wider mb-1">
              <Filter className="w-3.5 h-3.5" /> 节点过滤
            </div>
            {(Object.keys(typeConfig) as Array<keyof typeof typeConfig>).map(type => (
              <div 
                key={type} 
                className={`flex items-center gap-3 text-sm cursor-pointer transition-all hover:opacity-80 ${!visibleTypes.has(type) ? 'opacity-40 grayscale' : ''}`}
                onClick={() => toggleType(type)}
              >
                <div className="w-4 h-4 rounded-full shadow-sm flex items-center justify-center text-[10px] text-white" style={{ backgroundColor: typeConfig[type as keyof typeof typeConfig].color }}>
                  {typeConfig[type as keyof typeof typeConfig].icon}
                </div> 
                <span className="font-medium">{typeConfig[type as keyof typeof typeConfig].label}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Detail Sidebar */}
      {selectedNode && (
        <Card className="w-80 flex flex-col glass-panel border-border/50 shadow-lg animate-in slide-in-from-right-8 duration-300 shrink-0">
          <CardHeader className="border-b border-border/50 bg-gradient-to-b from-muted/30 to-transparent py-5">
            <div className="flex justify-between items-start mb-2">
              <Badge 
                variant="outline" 
                className="text-white border-none shadow-sm flex items-center gap-1"
                style={{ backgroundColor: typeConfig[selectedNode.type].color }}
              >
                <span>{typeConfig[selectedNode.type].icon}</span>
                {typeConfig[selectedNode.type].label}
              </Badge>
              <Button variant="ghost" size="icon" className="h-6 w-6 -mr-2 -mt-2 text-muted-foreground" onClick={() => setSelectedNode(null)}>
                <RefreshCw className="h-3.5 w-3.5" />
              </Button>
            </div>
            <CardTitle className="text-xl leading-tight">{selectedNode.label}</CardTitle>
            <p className="text-xs text-muted-foreground mt-2 font-mono bg-muted/50 inline-block px-2 py-1 rounded-md">{selectedNode.id}</p>
          </CardHeader>
          <CardContent className="p-5 space-y-6 flex-1 overflow-y-auto">
            
            {/* Business Metrics */}
            <div className="grid grid-cols-2 gap-3">
              {selectedNode.occurrences !== undefined && (
                <div className="bg-muted/30 p-3 rounded-lg border border-border/50">
                  <div className="text-[10px] text-muted-foreground mb-1 uppercase tracking-wider">历史发生频次</div>
                  <div className="text-2xl font-bold text-primary">{selectedNode.occurrences} <span className="text-sm font-normal text-muted-foreground">次</span></div>
                </div>
              )}
              {selectedNode.confidence !== undefined && (
                <div className="bg-muted/30 p-3 rounded-lg border border-border/50">
                  <div className="text-[10px] text-muted-foreground mb-1 uppercase tracking-wider">AI 关联置信度</div>
                  <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{(selectedNode.confidence * 100).toFixed(0)}<span className="text-sm font-normal">%</span></div>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <GitMerge className="w-3.5 h-3.5" /> 关联分析
              </h4>
              <ul className="space-y-2">
                {rawLinks.filter(l => {
                  const sId = typeof l.source === 'string' ? l.source : l.source.id;
                  const tId = typeof l.target === 'string' ? l.target : l.target.id;
                  return sId === selectedNode.id || tId === selectedNode.id;
                }).map((l, i) => {
                  const sId = typeof l.source === 'string' ? l.source : l.source.id;
                  const isSource = sId === selectedNode.id;
                  const relatedNodeId = isSource ? (typeof l.target === 'string' ? l.target : l.target.id) : sId;
                  const relatedNode = rawNodes.find(n => n.id === relatedNodeId);
                  
                  if (!relatedNode) return null;

                  return (
                    <li key={i} className="text-xs flex flex-col gap-1.5 bg-background p-3 rounded-lg border border-border/50 shadow-sm hover:border-primary/30 transition-colors cursor-pointer" onClick={() => setSelectedNode(relatedNode)}>
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className="text-[9px] py-0 h-4 bg-muted/50">{isSource ? l.label : `${l.label} (被动)`}</Badge>
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1" style={{ color: typeConfig[relatedNode.type].color }}>
                          {typeConfig[relatedNode.type].icon} {typeConfig[relatedNode.type].label}
                        </span>
                      </div>
                      <span className="font-medium text-sm">{relatedNode.label}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          </CardContent>
          <div className="p-4 border-t border-border/50 bg-muted/10 space-y-2">
            {selectedNode.type === 'QualityDoc' ? (
              <Button className="w-full shadow-sm" variant="default" onClick={() => window.location.href=`/quality-docs/${selectedNode.id.toLowerCase()}`}>
                <ExternalLink className="w-4 h-4 mr-2" /> 查看源文档
              </Button>
            ) : (
              <Button className="w-full shadow-sm" variant="default" onClick={() => toast({ title: "查看详细报告", description: "报告生成功能开发中..." })}>
                <ExternalLink className="w-4 h-4 mr-2" /> 查看详细报告
              </Button>
            )}
            {selectedNode.type === 'Cause' && (
              <Button className="w-full shadow-sm" variant="outline" onClick={() => toast({ title: "创建 8D", description: "基于此原因创建 8D 报告功能开发中..." })}>
                基于此原因创建 8D
              </Button>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
