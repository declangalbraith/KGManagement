import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card';
import { Input } from '@/src/components/ui/input';
import { Button } from '@/src/components/ui/button';
import { Badge } from '@/src/components/ui/badge';
import { Search, BookOpen, FileText, Video, Star, Clock, TrendingUp, Sparkles, ChevronRight, Network, Settings, Wrench, Files } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useToast } from '@/src/components/ui/use-toast';
import { KnowledgeGraph } from '@/src/components/KnowledgeGraph';
import { KnowledgeManagement } from '@/src/components/KnowledgeManagement';
import { KnowledgeGraphBuilder } from '@/src/components/KnowledgeGraphBuilder';
import { DocumentViewer } from '@/src/components/DocumentViewer';
import { useTranslation } from 'react-i18next';

export function KnowledgeBase() {
  const { toast } = useToast();
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [activeTab, setActiveTab] = useState<'retrieval' | 'graph' | 'builder' | 'management'>('retrieval');
  
  const [viewerOpen, setViewerOpen] = useState(false);
  const [activeDoc, setActiveDoc] = useState<{title: string, content?: React.ReactNode}>({ title: '' });

  const handleSearch = () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    setTimeout(() => {
      setIsSearching(false);
      toast({
        title: "搜索完成",
        description: `找到关于 "${searchQuery}" 的 12 条结果。`,
      });
    }, 800);
  };

  const openDocument = (title: string, content?: React.ReactNode) => {
    setActiveDoc({ title, content });
    setViewerOpen(true);
  };

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-serif text-primary-900 dark:text-primary-100 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
               <BookOpen className="h-6 w-6 text-primary" />
            </div>
            {t('knowledgeBase.title')}
          </h1>
          <p className="text-muted-foreground mt-2">{t('knowledgeBase.subtitle')}</p>
        </div>
        
        <div className="flex bg-muted/50 p-1 rounded-xl border border-border/50 shadow-sm">
          <Button 
            variant={activeTab === 'retrieval' ? 'default' : 'ghost'} 
            className={`rounded-lg px-6 ${activeTab === 'retrieval' ? 'shadow-sm' : 'hover:bg-background/50'}`}
            onClick={() => setActiveTab('retrieval')}
          >
            <Search className="w-4 h-4 mr-2" /> {t('knowledgeBase.tabs.retrieval')}
          </Button>
          <Button 
            variant={activeTab === 'graph' ? 'default' : 'ghost'} 
            className={`rounded-lg px-6 ${activeTab === 'graph' ? 'shadow-sm' : 'hover:bg-background/50'}`}
            onClick={() => setActiveTab('graph')}
          >
            <Network className="w-4 h-4 mr-2" /> {t('knowledgeBase.tabs.graph')}
          </Button>
          <Button 
            variant={activeTab === 'builder' ? 'default' : 'ghost'} 
            className={`rounded-lg px-6 ${activeTab === 'builder' ? 'shadow-sm' : 'hover:bg-background/50'}`}
            onClick={() => setActiveTab('builder')}
          >
            <Wrench className="w-4 h-4 mr-2" /> {t('knowledgeBase.tabs.builder')}
          </Button>
          <Button 
            variant={activeTab === 'management' ? 'default' : 'ghost'} 
            className={`rounded-lg px-6 ${activeTab === 'management' ? 'shadow-sm' : 'hover:bg-background/50'}`}
            onClick={() => setActiveTab('management')}
          >
            <Settings className="w-4 h-4 mr-2" /> {t('knowledgeBase.tabs.management')}
          </Button>
        </div>
      </div>

      {activeTab === 'retrieval' && (
        <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/10 via-background to-background border border-border/50 shadow-sm p-12 text-center flex flex-col items-center justify-center">
            <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03] pointer-events-none"></div>
            <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
            
            <div className="relative z-10 space-y-6 max-w-3xl">
              <Badge variant="outline" className="bg-background/50 backdrop-blur-sm border-primary/20 text-primary mb-2 px-4 py-1.5 rounded-full">
                <Sparkles className="h-3.5 w-3.5 mr-2" />
                {t('knowledgeBase.heroTag')}
              </Badge>
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight font-serif text-primary-900 dark:text-primary-100">{t('knowledgeBase.heroTitle')}</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">{t('knowledgeBase.heroSubtitle')}</p>
              
              <div className="relative w-full max-w-2xl mx-auto mt-8 group">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input 
                  className="w-full h-14 pl-14 pr-32 text-lg rounded-full border-2 border-border/50 bg-background/80 backdrop-blur-sm focus-visible:ring-primary/50 focus-visible:border-primary transition-all shadow-sm" 
                  placeholder={t('knowledgeBase.searchPlaceholder')} 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
                <Button className="absolute right-2 top-2 rounded-full h-10 px-8 shadow-md hover:shadow-lg transition-all" onClick={handleSearch} isLoading={isSearching}>
                  {t('knowledgeBase.searchBtn')}
                </Button>
              </div>
              
              <div className="flex flex-wrap justify-center items-center gap-3 mt-6">
                <span className="text-sm text-muted-foreground font-medium">{t('knowledgeBase.hotSearch')}</span>
                {['制动盘磨损', '空压机异响', '8D 报告模板', '5Why 分析法', 'PFMEA 制动系统'].map((tag) => (
                  <Badge key={tag} variant="secondary" className="cursor-pointer bg-background/50 backdrop-blur-sm hover:bg-primary hover:text-primary-foreground transition-all px-3 py-1 rounded-full border border-border/50 shadow-sm" onClick={() => setSearchQuery(tag)}>
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          <div className="grid gap-8 md:grid-cols-4">
            <div className="space-y-8">
              <Card className="glass-panel hover:shadow-lg transition-all duration-300">
                <CardHeader className="pb-4 border-b border-border/50">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-primary" />
                    知识分类
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-2">
                  <div className="space-y-1">
                    {['标准操作规程 (SOP)', '历史 8D 报告', '常见问题解答 (FAQ)', '产品技术文档', '培训资料'].map((category) => (
                      <Button key={category} variant="ghost" className="w-full justify-between font-normal hover:bg-primary/5 hover:text-primary transition-colors rounded-xl h-12 px-4 group">
                        {category}
                        <ChevronRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
              
              <Card className="glass-panel hover:shadow-lg transition-all duration-300">
                <CardHeader className="pb-4 border-b border-border/50">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Files className="h-5 w-5 text-blue-500" />
                    最新质量文档
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                  <Link to="/quality-docs/doc-001" className="group block space-y-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-blue-200 text-blue-700 bg-blue-50">PFMEA</Badge>
                    </div>
                    <span className="text-sm font-medium group-hover:text-primary transition-colors line-clamp-2">制动盘总成 PFMEA V1.0</span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" /> 2天前更新</span>
                  </Link>
                  <div className="h-px bg-border/50 w-full"></div>
                  <Link to="/quality-docs/doc-002" className="group block space-y-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-emerald-200 text-emerald-700 bg-emerald-50">巡检记录</Badge>
                    </div>
                    <span className="text-sm font-medium group-hover:text-primary transition-colors line-clamp-2">地铁1号线转向架巡检</span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" /> 刚刚更新</span>
                  </Link>
                  <Button variant="ghost" size="sm" className="w-full text-xs text-primary mt-2" onClick={() => window.location.href='/quality-docs'}>
                    进入质量文档库 <ChevronRight className="h-3 w-3 ml-1" />
                  </Button>
                </CardContent>
              </Card>
            </div>

            <div className="md:col-span-3 space-y-6">
              <div className="flex items-center justify-between border-b border-border/50 pb-4">
                <h2 className="text-xl font-bold font-serif flex items-center gap-2 text-primary-900 dark:text-primary-100">
                  <TrendingUp className="h-6 w-6 text-primary" />
                  推荐知识与文档
                </h2>
                <Button variant="ghost" size="sm" className="text-primary hover:bg-primary/10 rounded-full" onClick={() => toast({ title: "查看全部", description: "正在加载更多推荐内容..." })}>查看全部 <ChevronRight className="h-4 w-4 ml-1" /></Button>
              </div>
              <div className="grid gap-6 md:grid-cols-2">
                {[1, 2, 3, 4].map((i) => (
                  <Card key={i} className="glass-panel hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer group border-transparent hover:border-primary/20">
                    <CardContent className="p-6 flex flex-col h-full">
                      <div className="flex justify-between items-start mb-4">
                        <Badge variant="outline" className={`rounded-full px-3 py-1 border ${i % 2 === 0 ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800' : 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800'}`}>
                          {i % 2 === 0 ? '历史案例' : (i === 3 ? '受控文档' : '技术文档')}
                        </Badge>
                        <div className="flex items-center text-muted-foreground text-xs gap-1 bg-muted/50 px-2 py-1 rounded-full">
                          <Star className="h-3 w-3 text-yellow-500" /> 4.8
                        </div>
                      </div>
                      <div className="flex-1 cursor-pointer" onClick={() => openDocument(
                        i === 1 ? '制动盘表面异常磨损的根因分析与解决案例 (ISS-202408-012)' : 
                        i === 3 ? '制动盘总成 PFMEA (FMEA-BRK-001)' :
                        `知识条目标题示例 ${i}`,
                        <div className="space-y-4">
                          <h2 className="text-2xl font-bold border-b pb-2">文档详情内容</h2>
                          <p>这是关于 {i === 1 ? '制动盘表面异常磨损' : i === 3 ? '制动盘总成 PFMEA' : `知识条目 ${i}`} 的详细内容。</p>
                          <p>在实际应用中，本系统会自动从后端获取完整的富文本或 PDF 内容进行渲染。为了防止知识产权泄露，系统已自动在当前视图叠加了防剽窃水印。</p>
                          <div className="bg-muted p-4 rounded-md mt-4">
                            <h3 className="font-semibold mb-2">核心要点：</h3>
                            <ul className="list-disc pl-5 space-y-1">
                              <li>严格遵守操作规程</li>
                              <li>定期进行设备巡检与维护</li>
                              <li>发现异常立即上报并启动 8D 流程</li>
                            </ul>
                          </div>
                        </div>
                      )}>
                        <h3 className="font-bold text-lg mb-3 group-hover:text-primary line-clamp-2 transition-colors leading-tight">
                          {i === 1 ? '制动盘表面异常磨损的根因分析与解决案例 (ISS-202408-012)' : 
                           i === 3 ? '制动盘总成 PFMEA (FMEA-BRK-001)' :
                           `知识条目标题示例 ${i}`}
                        </h3>
                        <p className="text-sm text-muted-foreground line-clamp-3 mb-6 leading-relaxed">
                          {i === 3 ? '针对新型制动盘总成的潜在失效模式及后果分析，已关联最新 8D 报告中的纠正措施。' :
                           '本文档详细记录了 2024 年 8 月发生的制动盘异常磨损问题的处理过程，包含完整的 5Why 分析和最终的纠正预防措施。'}
                        </p>
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground pt-4 border-t border-border/50 mt-auto">
                        <div className="flex items-center gap-2">
                          <div className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">张</div>
                          <span>张三</span>
                          <span className="text-border">•</span>
                          <span>2024-09-15</span>
                        </div>
                        <div className="flex items-center gap-1.5 bg-muted/30 px-2 py-1 rounded-full">
                          <BookOpen className="h-3.5 w-3.5" /> 1.2k
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'graph' && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <KnowledgeGraph />
        </div>
      )}

      {activeTab === 'builder' && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <KnowledgeGraphBuilder />
        </div>
      )}

      {activeTab === 'management' && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <KnowledgeManagement />
        </div>
      )}

      <DocumentViewer 
        isOpen={viewerOpen}
        onClose={() => setViewerOpen(false)}
        title={activeDoc.title}
        content={activeDoc.content}
        watermarkText={`CONFIDENTIAL - QCONNECT - ${new Date().toISOString().split('T')[0]}`}
      />
    </div>
  );
}
