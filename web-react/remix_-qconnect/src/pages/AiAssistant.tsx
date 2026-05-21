import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card';
import { Input } from '@/src/components/ui/input';
import { Button } from '@/src/components/ui/button';
import { Send, Bot, User, Sparkles, Copy, ThumbsUp, ThumbsDown } from 'lucide-react';
import { useToast } from '@/src/components/ui/use-toast';
import { useTranslation } from 'react-i18next';

export function AiAssistant() {
  const { toast } = useToast();
  const { t } = useTranslation();
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);

  const handleSend = () => {
    if (!input.trim()) return;
    setIsSending(true);
    setTimeout(() => {
      setIsSending(false);
      setInput('');
      toast({
        title: "消息已发送",
        description: "AI 助手正在处理您的请求...",
      });
    }, 800);
  };

  const handleCopy = () => {
    toast({
      title: "已复制",
      description: "内容已复制到剪贴板。",
      variant: "success"
    });
  };

  const handleFeedback = (type: 'up' | 'down') => {
    toast({
      title: "感谢反馈",
      description: type === 'up' ? "已记录您的正面反馈。" : "已记录您的负面反馈，我们将持续改进。",
      variant: "default"
    });
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] max-w-5xl mx-auto gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-serif text-primary-900 dark:text-primary-100 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Bot className="h-6 w-6 text-primary" />
            </div>
            {t('aiAssistant.title')}
          </h1>
          <p className="text-muted-foreground mt-2">{t('aiAssistant.subtitle')}</p>
        </div>
      </div>

      <Card className="flex-1 flex flex-col overflow-hidden glass-panel hover:shadow-xl transition-all duration-300 border-border/50">
        <CardContent className="flex-1 overflow-auto p-6 space-y-8 bg-gradient-to-b from-background/50 to-background">
          <div className="flex gap-4 group">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0 shadow-sm border border-primary/20">
              <Bot className="h-5 w-5" />
            </div>
            <div className="flex-1 space-y-2 max-w-[85%]">
              <div className="font-medium text-sm text-muted-foreground ml-1">{t('aiAssistant.title')}</div>
              <div className="text-sm bg-card p-5 rounded-2xl rounded-tl-sm border border-border/50 shadow-sm leading-relaxed">
                <p>{t('aiAssistant.greeting')}</p>
                <ul className="list-disc list-inside mt-3 space-y-2 text-muted-foreground">
                  <li className="hover:text-primary cursor-pointer transition-colors" onClick={() => setInput('帮我总结一下 ISS-202604-001 问题的当前进展？')}>帮我总结一下 ISS-202604-001 问题的当前进展？</li>
                  <li className="hover:text-primary cursor-pointer transition-colors" onClick={() => setInput('知识库中有关于空压机异响的处理案例吗？')}>知识库中有关于空压机异响的处理案例吗？</li>
                  <li className="hover:text-primary cursor-pointer transition-colors" onClick={() => setInput('基于目前的 5Why 分析，帮我生成 8D 报告的 D4 部分草稿。')}>基于目前的 5Why 分析，帮我生成 8D 报告的 D4 部分草稿。</li>
                  <li className="hover:text-primary cursor-pointer transition-colors" onClick={() => setInput('制动盘磨损问题通常有哪些系统性原因？')}>制动盘磨损问题通常有哪些系统性原因？</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="flex gap-4 flex-row-reverse group">
            <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground shrink-0 shadow-md">
              <User className="h-5 w-5" />
            </div>
            <div className="flex-1 space-y-2 flex flex-col items-end max-w-[85%]">
              <div className="font-medium text-sm text-muted-foreground mr-1">张三</div>
              <div className="text-sm bg-primary text-primary-foreground p-5 rounded-2xl rounded-tr-sm shadow-md leading-relaxed">
                帮我查一下知识库中关于“制动盘异常磨损”的历史案例，重点看看当时的根本原因是什么。
              </div>
            </div>
          </div>

          <div className="flex gap-4 group">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0 shadow-sm border border-primary/20">
              <Bot className="h-5 w-5" />
            </div>
            <div className="flex-1 space-y-2 max-w-[85%]">
              <div className="font-medium text-sm text-muted-foreground ml-1">QConnect Assistant</div>
              <div className="text-sm bg-card p-5 rounded-2xl rounded-tl-sm border border-border/50 shadow-sm space-y-5 leading-relaxed">
                <p>为您检索到以下相关历史案例：</p>
                
                <div className="border border-border/50 rounded-xl p-4 bg-muted/30 hover:bg-muted/50 hover:border-primary/30 transition-all">
                  <div className="font-semibold text-primary mb-2 text-base">ISS-202408-012: 某型号列车制动盘早期异常磨损</div>
                  <p className="text-muted-foreground mb-3"><strong className="text-foreground">根本原因 (D4):</strong> 供应商在未通知我方的情况下，更改了闸瓦摩擦材料的配方比例，导致该批次闸瓦硬度超出了设计标准上限，在制动过程中对制动盘造成了过度切削。</p>
                  <p className="text-muted-foreground"><strong className="text-foreground">纠正措施 (D5):</strong> 1. 隔离并退回异常闸瓦。2. 更新《入厂检验规范》，增加硬度必检项。</p>
                </div>

                <div className="border border-border/50 rounded-xl p-4 bg-muted/30 hover:bg-muted/50 hover:border-primary/30 transition-all">
                  <div className="font-semibold text-primary mb-2 text-base">ISS-202211-045: 制动盘偏磨导致异响</div>
                  <p className="text-muted-foreground mb-2"><strong className="text-foreground">根本原因 (D4):</strong> 制动夹钳安装支架加工公差累积，导致夹钳与制动盘不平行，产生偏磨。</p>
                </div>

                <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 text-primary-900 dark:text-primary-100">
                  <p><strong className="font-semibold">总结建议：</strong> 针对您当前处理的制动盘磨损问题，建议优先排查 <strong>闸瓦材质硬度</strong> 和 <strong>制动夹钳安装平行度</strong> 这两个方向。</p>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-2 ml-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button variant="ghost" size="sm" className="h-8 px-3 text-muted-foreground hover:text-foreground hover:bg-muted rounded-full transition-colors" onClick={handleCopy}>
                  <Copy className="h-4 w-4 mr-1.5" /> 复制
                </Button>
                <Button variant="ghost" size="sm" className="h-8 px-3 text-muted-foreground hover:text-success hover:bg-success/10 rounded-full transition-colors" onClick={() => handleFeedback('up')}>
                  <ThumbsUp className="h-4 w-4 mr-1.5" /> 有用
                </Button>
                <Button variant="ghost" size="sm" className="h-8 px-3 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full transition-colors" onClick={() => handleFeedback('down')}>
                  <ThumbsDown className="h-4 w-4 mr-1.5" /> 无用
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
        
        <div className="p-4 border-t border-border/50 bg-card/80 backdrop-blur-md">
          <div className="relative flex items-center max-w-4xl mx-auto">
            <Input 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder={t('aiAssistant.placeholder')}
              className="pr-28 h-14 rounded-full bg-background border-border/50 focus-visible:ring-primary focus-visible:border-primary transition-all shadow-sm text-base"
            />
            <div className="absolute right-2 flex items-center gap-1.5">
              <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full text-primary hover:bg-primary/10 transition-colors" onClick={() => toast({ title: "AI 建议", description: "正在生成建议问题..." })}>
                <Sparkles className="h-5 w-5" />
              </Button>
              <Button size="icon" className="h-10 w-10 rounded-full shadow-md hover:shadow-lg transition-all" onClick={handleSend} isLoading={isSending}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="text-center mt-3 text-xs text-muted-foreground font-medium">
            {t('aiAssistant.disclaimer')}
          </div>
        </div>
      </Card>
    </div>
  );
}
