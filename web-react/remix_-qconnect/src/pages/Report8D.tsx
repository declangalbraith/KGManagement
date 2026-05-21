import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card';
import { Button } from '@/src/components/ui/button';
import { ArrowLeft, Save, Send, Download, FileText, LayoutDashboard, ListTodo, Search, Sparkles, Loader2, Bot, X } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useToast } from '@/src/components/ui/use-toast';
import { GoogleGenAI, Type } from '@google/genai';

interface ReportState {
  d1: string;
  d2: string;
  d3: string;
  d4: string;
  d5: string;
  d6: string;
  d7: string;
  d8: string;
}

export function Report8D() {
  const navigate = useNavigate();
  const { id } = useParams();
  const issueId = id || 'ISS-202604-001';
  const { toast } = useToast();
  
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSyncing, setIsSyncing] = useState<Record<string, boolean>>({});

  // Form State
  const [reportData, setReportData] = useState<ReportState>({
    d1: "组长 (Champion): 张三 (质量总监)\n主导人 (Leader): 李四 (质量工程师)\n成员 (Members): 王五 (技术支持), 赵六 (采购工程师)",
    d2: "客户反馈在近期交付的列车上，发现部分制动盘表面存在异常的划痕和磨损现象。经过初步检查，磨损深度约为 0.5mm，分布不均匀。发生条件：运行里程约 5000km 后发现。影响范围：目前已发现 3 列车存在类似问题。",
    d3: "",
    d4: "",
    d5: "",
    d6: "",
    d7: "",
    d8: ""
  });

  const handleInputChange = (section: keyof ReportState, value: string) => {
    setReportData(prev => ({ ...prev, [section]: value }));
  };

  // AI Assistant State
  const [isAiDrawerOpen, setIsAiDrawerOpen] = useState(false);
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<string>('');

  const initGenAI = () => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      toast({ title: '配置错误', description: '缺失 Gemini API Key', variant: 'destructive' });
      return null;
    }
    return new GoogleGenAI({ apiKey });
  };

  const handleGenerateDraft = async () => {
    const ai = initGenAI();
    if (!ai) return;

    setIsAiProcessing(true);
    setIsAiDrawerOpen(true);
    setAiSuggestions('正在为您生成 8D 报告初步草稿...');

    try {
      const prompt = `您是一个专业的质量管理专家。请根据以下问题描述，为我生成一份完整的 8D (8 Disciplines) 报告草稿（涵盖 D1 到 D8）。
这里是已知的问题信息：
问题描述: ${reportData.d2}
团队建置: ${reportData.d1}

请输出 JSON 格式，包含 d3 到 d8 的字段，以字符串形式提供具体、专业、符合逻辑的措施和方案。`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              d3: { type: Type.STRING, description: "临时遏制措施内容" },
              d4: { type: Type.STRING, description: "根本原因分析内容" },
              d5: { type: Type.STRING, description: "纠正措施选择内容" },
              d6: { type: Type.STRING, description: "纠正措施实施与验证内容" },
              d7: { type: Type.STRING, description: "预防措施内容" },
              d8: { type: Type.STRING, description: "团队确认与结案内容" },
            },
            required: ["d3", "d4", "d5", "d6", "d7", "d8"]
          }
        }
      });
      
      const text = response.text || "{}";
      const json = JSON.parse(text);
      
      setReportData(prev => ({
        ...prev,
        d3: json.d3 || prev.d3,
        d4: json.d4 || prev.d4,
        d5: json.d5 || prev.d5,
        d6: json.d6 || prev.d6,
        d7: json.d7 || prev.d7,
        d8: json.d8 || prev.d8,
      }));
      setAiSuggestions('草稿生成成功，已自动填充到报告中。');
      toast({ title: '生成成功', description: '8D 报告部分已自动填充，请检查并修改。', variant: 'success' });
    } catch (error) {
      console.error(error);
      setAiSuggestions('生成失败，请重试或检查配置。');
      toast({ title: '发生错误', description: '无法请求 AI 服务。', variant: 'destructive' });
    } finally {
      setIsAiProcessing(false);
    }
  };

  const handleOptimizeReport = async () => {
    const ai = initGenAI();
    if (!ai) return;

    setIsAiProcessing(true);
    setIsAiDrawerOpen(true);
    setAiSuggestions('正在通过知识库和最佳实践检查和优化报告...');

    try {
      const prompt = `您是专业的质量审核专家，请审核以下 8D 报告内容，并给出详细的优化建议（如：补充遗漏的预防措施，确保问题得到有效闭环，报告完整性等）。
D1: ${reportData.d1}
D2: ${reportData.d2}
D3: ${reportData.d3}
D4: ${reportData.d4}
D5: ${reportData.d5}
D6: ${reportData.d6}
D7: ${reportData.d7}
D8: ${reportData.d8}

请回复详细的优化建议（包含具体需要补充或修改的文字，不用 JSON，直接提供建议列表和原因）：`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.1-pro-preview',
        contents: prompt
      });

      setAiSuggestions(response.text || "未能生成建议");
    } catch (error) {
      console.error(error);
      setAiSuggestions('优化建议生成失败。');
      toast({ title: '发生错误', description: '无法请求 AI 服务。', variant: 'destructive' });
    } finally {
      setIsAiProcessing(false);
    }
  };

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      toast({ title: "保存成功", description: "8D 报告草稿已保存。", variant: "success" });
    }, 800);
  };

  const handleSubmit = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      toast({ title: "提交成功", description: "8D 报告已提交审批。", variant: "success" });
      navigate(`/issues/${issueId}`);
    }, 1500);
  };

  const handleSync = (section: string) => {
    setIsSyncing(prev => ({ ...prev, [section]: true }));
    setTimeout(() => {
      setIsSyncing(prev => ({ ...prev, [section]: false }));
      toast({ title: "同步成功", description: `已成功从源数据同步 ${section} 章节内容。`, variant: "success" });
    }, 1000);
  };

  return (
    <div className="flex flex-col gap-8 max-w-6xl mx-auto relative overflow-hidden">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full hover:bg-muted">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight font-serif text-primary-900 dark:text-primary-100">8D 报告编辑</h1>
            <p className="text-muted-foreground mt-1">关联问题: <span className="font-mono text-foreground">{issueId}</span></p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="gap-2 rounded-full hover:bg-blue-50 hover:text-blue-600 transition-colors shadow-sm border-blue-200 text-blue-700" onClick={() => setIsAiDrawerOpen(true)}>
            <Sparkles className="h-4 w-4" />
            AI 助手
          </Button>
          <Button variant="outline" className="gap-2 rounded-full hover:bg-primary/5 hover:text-primary transition-colors shadow-sm" onClick={() => toast({ title: "导出中", description: "正在生成 PDF 文件..." })}>
            <Download className="h-4 w-4" />
            导出 PDF
          </Button>
          <Button variant="outline" className="gap-2 rounded-full hover:bg-primary/5 hover:text-primary transition-colors shadow-sm" onClick={handleSave} disabled={isSaving}>
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            保存草稿
          </Button>
          <Button className="gap-2 rounded-full shadow-md hover:shadow-lg transition-all" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            提交审批
          </Button>
        </div>
      </div>

      {/* AI Assistant Drawer/Sidebar Overlay */}
      {isAiDrawerOpen && (
        <div className="fixed inset-y-0 right-0 w-[400px] bg-background border-l border-border shadow-2xl z-50 flex flex-col transform transition-transform duration-300">
          <div className="p-4 border-b border-border/50 flex items-center justify-between bg-primary/5">
            <div className="flex items-center gap-2 text-primary font-medium">
              <Bot className="h-5 w-5" />
              8D AI 专家助手
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => setIsAiDrawerOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex-1 overflow-auto p-4 space-y-6">
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground">快速操作</h3>
              <div className="grid grid-cols-1 gap-2">
                <Button 
                  variant="outline" 
                  className="w-full justify-start gap-2 shadow-sm" 
                  onClick={handleGenerateDraft} 
                  disabled={isAiProcessing}
                >
                  <Sparkles className="h-4 w-4 text-blue-500" />
                  一键生成草稿
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start gap-2 shadow-sm" 
                  onClick={handleOptimizeReport} 
                  disabled={isAiProcessing}
                >
                  <Search className="h-4 w-4 text-purple-500" />
                  审核与优化建议
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                分析结果
                {isAiProcessing && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
              </h3>
              <div className="min-h-[200px] bg-muted/30 rounded-xl border border-border/50 p-4 text-sm prose prose-sm dark:prose-invert">
                {aiSuggestions ? (
                  <div className="whitespace-pre-wrap leading-relaxed">
                    {aiSuggestions}
                  </div>
                ) : (
                  <div className="text-muted-foreground flex flex-col items-center justify-center h-full gap-2 opacity-50 py-10">
                    <Bot className="h-8 w-8" />
                    <p>等待分析任务...</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Issue Workspace Navigation */}
      <div className={`flex items-center gap-1 border-b border-border/50 pb-px -mt-2 ${isAiDrawerOpen ? 'mr-[400px]' : ''} transition-all`}>
        <Link to={`/issues/${issueId}`} className="flex items-center gap-2 px-6 py-3 border-b-2 border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors rounded-t-lg">
          <LayoutDashboard className="h-4 w-4" />
          问题总览
        </Link>
        <Link to={`/tasks?issueId=${issueId}`} className="flex items-center gap-2 px-6 py-3 border-b-2 border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors rounded-t-lg">
          <ListTodo className="h-4 w-4" />
          子任务管理
        </Link>
        <Link to={`/rca/${issueId}`} className="flex items-center gap-2 px-6 py-3 border-b-2 border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors rounded-t-lg">
          <Search className="h-4 w-4" />
          根因分析 (5Why)
        </Link>
        <Link to={`/8d-reports/${issueId}`} className="flex items-center gap-2 px-6 py-3 border-b-2 border-primary text-primary font-medium transition-colors bg-primary/5 rounded-t-lg">
          <FileText className="h-4 w-4" />
          8D 报告
        </Link>
      </div>

      <div className={`grid gap-8 md:grid-cols-4 ${isAiDrawerOpen ? 'mr-[400px]' : ''} transition-all`}>
        <div className="md:col-span-1">
          <Card className="sticky top-6 glass-panel hover:shadow-lg transition-all duration-300 border-border/50">
            <CardHeader className="border-b border-border/50 pb-4 bg-muted/5">
              <CardTitle className="text-lg">8D 导航</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <nav className="flex flex-col text-sm py-2">
                {[
                  { id: 'd0', label: 'D0 准备和启动', active: true },
                  { id: 'd1', label: 'D1 团队组建' },
                  { id: 'd2', label: 'D2 问题描述' },
                  { id: 'd3', label: 'D3 临时遏制措施' },
                  { id: 'd4', label: 'D4 根本原因分析' },
                  { id: 'd5', label: 'D5 纠正措施选择' },
                  { id: 'd6', label: 'D6 纠正措施实施与验证' },
                  { id: 'd7', label: 'D7 预防措施' },
                  { id: 'd8', label: 'D8 团队确认与结案' },
                ].map((item) => (
                  <a 
                    key={item.id}
                    href={`#${item.id}`} 
                    className={`px-6 py-3 border-l-2 transition-all ${
                      item.active 
                        ? 'border-primary bg-primary/5 font-medium text-primary' 
                        : 'border-transparent hover:bg-muted/50 hover:border-border text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {item.label}
                  </a>
                ))}
              </nav>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-3 space-y-8 pb-20">
          <Card id="d0" className="glass-panel hover:shadow-lg transition-all duration-300 border-border/50 scroll-mt-24">
            <CardHeader className="bg-muted/5 border-b border-border/50 pb-4">
              <CardTitle className="text-lg flex items-center gap-3">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground text-xs font-bold shadow-sm">D0</span>
                准备和启动
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 gap-6 text-sm">
                <div className="space-y-1">
                  <span className="text-muted-foreground block text-xs uppercase tracking-wider">报告编号</span>
                  <span className="font-medium text-foreground font-mono">8D-202604-001</span>
                </div>
                <div className="space-y-1">
                  <span className="text-muted-foreground block text-xs uppercase tracking-wider">创建日期</span>
                  <span className="font-medium text-foreground">2026-04-11</span>
                </div>
                <div className="space-y-1">
                  <span className="text-muted-foreground block text-xs uppercase tracking-wider">客户名称</span>
                  <span className="font-medium text-foreground">北京地铁 16 号线</span>
                </div>
                <div className="space-y-1">
                  <span className="text-muted-foreground block text-xs uppercase tracking-wider">产品型号</span>
                  <span className="font-medium text-foreground">BRK-D-100</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card id="d1" className="glass-panel hover:shadow-lg transition-all duration-300 border-border/50 scroll-mt-24">
            <CardHeader className="bg-muted/5 border-b border-border/50 pb-4">
              <CardTitle className="text-lg flex items-center gap-3">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground text-xs font-bold shadow-sm">D1</span>
                团队组建
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <textarea 
                className="w-full min-h-[120px] rounded-xl border border-transparent bg-muted/30 p-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 focus:bg-background transition-all shadow-inner resize-none" 
                value={reportData.d1}
                onChange={(e) => handleInputChange('d1', e.target.value)}
                placeholder="描述团队成员..."
              ></textarea>
            </CardContent>
          </Card>

          <Card id="d2" className="glass-panel hover:shadow-lg transition-all duration-300 border-border/50 scroll-mt-24">
            <CardHeader className="bg-muted/5 border-b border-border/50 pb-4 flex flex-row items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-3">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground text-xs font-bold shadow-sm">D2</span>
                问题描述
              </CardTitle>
              <Button variant="ghost" size="sm" className="h-8 gap-2 text-primary hover:bg-primary/10 rounded-full" onClick={() => handleSync('D2')} disabled={isSyncing['D2']}>
                {isSyncing['D2'] ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
                从问题单同步
              </Button>
            </CardHeader>
            <CardContent className="pt-6">
              <textarea 
                className="w-full min-h-[140px] rounded-xl border border-transparent bg-muted/30 p-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 focus:bg-background transition-all shadow-inner resize-none leading-relaxed" 
                value={reportData.d2}
                onChange={(e) => handleInputChange('d2', e.target.value)}
                placeholder="描述问题..."
              ></textarea>
            </CardContent>
          </Card>

          <Card id="d3" className="glass-panel hover:shadow-lg transition-all duration-300 border-border/50 scroll-mt-24">
            <CardHeader className="bg-muted/5 border-b border-border/50 pb-4">
              <CardTitle className="text-lg flex items-center gap-3">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground text-xs font-bold shadow-sm">D3</span>
                临时遏制措施 (ICA)
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <textarea 
                className="w-full min-h-[120px] rounded-xl border border-transparent bg-muted/30 p-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 focus:bg-background transition-all shadow-inner resize-none" 
                value={reportData.d3}
                onChange={(e) => handleInputChange('d3', e.target.value)}
                placeholder="描述为防止问题扩大采取的临时措施..."
              ></textarea>
            </CardContent>
          </Card>

          <Card id="d4" className="glass-panel hover:shadow-lg transition-all duration-300 border-border/50 scroll-mt-24">
            <CardHeader className="bg-muted/5 border-b border-border/50 pb-4 flex flex-row items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-3">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground text-xs font-bold shadow-sm">D4</span>
                根本原因分析
              </CardTitle>
              <Button variant="ghost" size="sm" className="h-8 gap-2 text-primary hover:bg-primary/10 rounded-full" onClick={() => handleSync('D4')} disabled={isSyncing['D4']}>
                {isSyncing['D4'] ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
                从 RCA 同步
              </Button>
            </CardHeader>
            <CardContent className="pt-6">
              <textarea 
                className="w-full min-h-[140px] rounded-xl border border-transparent bg-muted/30 p-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 focus:bg-background transition-all shadow-inner resize-none" 
                value={reportData.d4}
                onChange={(e) => handleInputChange('d4', e.target.value)}
                placeholder="描述根本原因..."
              ></textarea>
            </CardContent>
          </Card>

          <Card id="d5" className="glass-panel hover:shadow-lg transition-all duration-300 border-border/50 scroll-mt-24">
            <CardHeader className="bg-muted/5 border-b border-border/50 pb-4">
              <CardTitle className="text-lg flex items-center gap-3">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground text-xs font-bold shadow-sm">D5</span>
                纠正措施选择 (PCA)
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <textarea 
                className="w-full min-h-[120px] rounded-xl border border-transparent bg-muted/30 p-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 focus:bg-background transition-all shadow-inner resize-none" 
                value={reportData.d5}
                onChange={(e) => handleInputChange('d5', e.target.value)}
                placeholder="描述选择的永久性纠正措施及其预期效果..."
              ></textarea>
            </CardContent>
          </Card>

          <Card id="d6" className="glass-panel hover:shadow-lg transition-all duration-300 border-border/50 scroll-mt-24">
            <CardHeader className="bg-muted/5 border-b border-border/50 pb-4">
              <CardTitle className="text-lg flex items-center gap-3">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground text-xs font-bold shadow-sm">D6</span>
                纠正措施实施与验证
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <textarea 
                className="w-full min-h-[120px] rounded-xl border border-transparent bg-muted/30 p-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 focus:bg-background transition-all shadow-inner resize-none" 
                value={reportData.d6}
                onChange={(e) => handleInputChange('d6', e.target.value)}
                placeholder="描述纠正措施的实施过程和验证结果..."
              ></textarea>
            </CardContent>
          </Card>

          <Card id="d7" className="glass-panel hover:shadow-lg transition-all duration-300 border-border/50 scroll-mt-24">
            <CardHeader className="bg-muted/5 border-b border-border/50 pb-4">
              <CardTitle className="text-lg flex items-center gap-3">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground text-xs font-bold shadow-sm">D7</span>
                预防措施
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <textarea 
                className="w-full min-h-[120px] rounded-xl border border-transparent bg-muted/30 p-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 focus:bg-background transition-all shadow-inner resize-none" 
                value={reportData.d7}
                onChange={(e) => handleInputChange('d7', e.target.value)}
                placeholder="描述为防止问题再次发生而采取的系统性预防措施（如更新FMEA、控制计划等）..."
              ></textarea>
            </CardContent>
          </Card>

          <Card id="d8" className="glass-panel hover:shadow-lg transition-all duration-300 border-border/50 scroll-mt-24">
            <CardHeader className="bg-muted/5 border-b border-border/50 pb-4">
              <CardTitle className="text-lg flex items-center gap-3">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground text-xs font-bold shadow-sm">D8</span>
                团队确认与结案
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <textarea 
                className="w-full min-h-[100px] rounded-xl border border-transparent bg-muted/30 p-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 focus:bg-background transition-all shadow-inner resize-none" 
                value={reportData.d8}
                onChange={(e) => handleInputChange('d8', e.target.value)}
                placeholder="总结团队贡献，确认结案..."
              ></textarea>
            </CardContent>
          </Card>
          
        </div>
      </div>
    </div>
  );
}

