import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { Send, Paperclip, BrainCircuit, CheckCircle2, Clock, FileText, AlertCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Card } from './ui/card';

export type StorylineItem = {
  id: string;
  type: 'chat' | 'system' | 'file' | 'queen_widget';
  sender?: string;
  avatar?: string;
  content: string;
  timestamp: string;
  widgetType?: 'fishbone' | 'task_card' | 'knowledge_card';
  widgetData?: any;
};

interface HolographicStorylineProps {
  items: StorylineItem[];
  onSendMessage: (content: string) => void;
}

export function HolographicStoryline({ items, onSendMessage }: HolographicStorylineProps) {
  const [inputValue, setInputValue] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [items]);

  const handleSend = () => {
    if (inputValue.trim()) {
      onSendMessage(inputValue);
      setInputValue('');
    }
  };

  const renderWidget = (item: StorylineItem) => {
    if (item.widgetType === 'fishbone') {
      return (
        <Card className="mt-3 overflow-hidden border-primary/20 shadow-sm transition-all hover:shadow-md bg-background">
          <div className="bg-gradient-to-r from-indigo-500/10 via-purple-500/5 to-transparent p-4 border-b border-border/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-primary/10 rounded-md text-primary">
                  <BrainCircuit className="w-4 h-4" />
                </div>
                <span className="font-semibold text-sm text-foreground">Queen 生成的鱼骨图 (Ishikawa)</span>
              </div>
              <Badge variant="outline" className="bg-background/50 backdrop-blur-sm text-[10px] border-primary/20 text-primary animate-pulse">实时协作中</Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-2 ml-9">基于当前讨论上下文自动生成的初步根因分析，支持全员实时拖拽编辑。</p>
          </div>
          <div className="p-6 bg-background/50 relative overflow-x-auto">
            <div className="min-w-[500px] relative">
              {/* Central Spine */}
              <div className="absolute top-1/2 left-0 right-16 h-1.5 bg-gradient-to-r from-primary/40 to-primary/80 -translate-y-1/2 rounded-full"></div>
              <div className="absolute top-1/2 right-4 -translate-y-1/2 w-0 h-0 border-t-[12px] border-t-transparent border-l-[20px] border-l-primary/80 border-b-[12px] border-b-transparent"></div>
              <div className="absolute top-1/2 right-0 -translate-y-1/2 font-bold text-primary text-sm bg-background px-2 py-1 rounded border border-primary/20 shadow-sm">问题</div>
              
              <div className="grid grid-cols-2 gap-x-12 gap-y-16 relative z-10 py-8 pr-24">
                {/* Top Branches */}
                <div className="space-y-3 relative group">
                  <div className="absolute -bottom-8 left-1/2 w-0.5 h-12 bg-primary/30 rotate-[30deg] origin-bottom group-hover:bg-primary/60 transition-colors"></div>
                  <div className="font-semibold text-xs text-primary bg-primary/10 border border-primary/20 px-3 py-1.5 rounded-md inline-block mb-2 shadow-sm whitespace-nowrap">人员 (Man)</div>
                  <ul className="space-y-2 relative z-20">
                    <li className="text-xs bg-background hover:bg-muted border border-border/50 rounded-md px-3 py-1.5 cursor-grab active:cursor-grabbing transition-all flex items-center gap-2 shadow-sm hover:shadow"><div className="w-1.5 h-1.5 rounded-full bg-primary/50"></div>操作员培训不足</li>
                    <li className="text-xs bg-background hover:bg-muted border border-border/50 rounded-md px-3 py-1.5 cursor-grab active:cursor-grabbing transition-all flex items-center gap-2 shadow-sm hover:shadow"><div className="w-1.5 h-1.5 rounded-full bg-primary/50"></div>疲劳作业</li>
                  </ul>
                </div>
                <div className="space-y-3 relative group">
                  <div className="absolute -bottom-8 left-1/2 w-0.5 h-12 bg-primary/30 rotate-[30deg] origin-bottom group-hover:bg-primary/60 transition-colors"></div>
                  <div className="font-semibold text-xs text-primary bg-primary/10 border border-primary/20 px-3 py-1.5 rounded-md inline-block mb-2 shadow-sm whitespace-nowrap">机器 (Machine)</div>
                  <ul className="space-y-2 relative z-20">
                    <li className="text-xs bg-background hover:bg-muted border border-border/50 rounded-md px-3 py-1.5 cursor-grab active:cursor-grabbing transition-all flex items-center gap-2 shadow-sm hover:shadow"><div className="w-1.5 h-1.5 rounded-full bg-primary/50"></div>设备老化</li>
                    <li className="text-xs bg-background hover:bg-muted border border-border/50 rounded-md px-3 py-1.5 cursor-grab active:cursor-grabbing transition-all flex items-center gap-2 shadow-sm hover:shadow"><div className="w-1.5 h-1.5 rounded-full bg-primary/50"></div>维护保养不及时</li>
                  </ul>
                </div>
                
                {/* Bottom Branches */}
                <div className="space-y-3 relative group flex flex-col justify-end mt-6">
                  <div className="absolute -top-12 left-1/2 w-0.5 h-12 bg-primary/30 -rotate-[30deg] origin-top group-hover:bg-primary/60 transition-colors"></div>
                  <ul className="space-y-2 order-1 mt-2 relative z-20">
                    <li className="text-xs bg-warning/10 hover:bg-warning/20 border border-warning/30 text-warning-700 dark:text-warning-400 rounded-md px-3 py-1.5 cursor-grab active:cursor-grabbing transition-all flex items-center gap-2 shadow-sm hover:shadow"><div className="w-2 h-2 rounded-full bg-warning animate-pulse"></div>同批次闸瓦材质过硬</li>
                    <li className="text-xs bg-background hover:bg-muted border border-border/50 rounded-md px-3 py-1.5 cursor-grab active:cursor-grabbing transition-all flex items-center gap-2 shadow-sm hover:shadow"><div className="w-1.5 h-1.5 rounded-full bg-primary/50"></div>供应商变更</li>
                  </ul>
                  <div className="font-semibold text-xs text-primary bg-primary/10 border border-primary/20 px-3 py-1.5 rounded-md inline-block order-0 self-start shadow-sm whitespace-nowrap">物料 (Material)</div>
                </div>
                <div className="space-y-3 relative group flex flex-col justify-end mt-6">
                  <div className="absolute -top-12 left-1/2 w-0.5 h-12 bg-primary/30 -rotate-[30deg] origin-top group-hover:bg-primary/60 transition-colors"></div>
                  <ul className="space-y-2 order-1 mt-2 relative z-20">
                    <li className="text-xs bg-background hover:bg-muted border border-border/50 rounded-md px-3 py-1.5 cursor-grab active:cursor-grabbing transition-all flex items-center gap-2 shadow-sm hover:shadow"><div className="w-1.5 h-1.5 rounded-full bg-primary/50"></div>工艺参数设置错误</li>
                  </ul>
                  <div className="font-semibold text-xs text-primary bg-primary/10 border border-primary/20 px-3 py-1.5 rounded-md inline-block order-0 self-start shadow-sm whitespace-nowrap">方法 (Method)</div>
                </div>
              </div>
            </div>
          </div>
          <div className="p-3 bg-muted/30 border-t border-border/50 flex justify-between items-center">
            <div className="text-[10px] text-muted-foreground flex items-center gap-2 bg-background px-2 py-1 rounded-full border border-border/50 shadow-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-success"></span>
              </span>
              李四 正在编辑...
            </div>
            <Button size="sm" variant="default" className="h-7 text-xs bg-primary/90 hover:bg-primary shadow-sm">进入全屏编辑</Button>
          </div>
        </Card>
      );
    }
    
    if (item.widgetType === 'task_card') {
      return (
        <Card className="mt-3 overflow-hidden border-border/50 shadow-sm transition-all hover:shadow-md bg-background group">
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-success/10 rounded-md text-success">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <span className="font-semibold text-sm text-foreground">已分配子任务</span>
              </div>
              <Badge variant="outline" className="text-[10px] bg-muted/50 font-mono">{item.widgetData?.id || 'TSK-202604-002'}</Badge>
            </div>
            <div className="space-y-3">
              <div className="font-medium text-sm leading-snug group-hover:text-primary transition-colors">{item.widgetData?.title || '进行硬度测试并出具报告'}</div>
              
              <div className="flex items-center gap-4 text-xs text-muted-foreground bg-muted/30 p-2.5 rounded-lg border border-border/50">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-orange-500" /> 
                  <span className="font-medium text-orange-600 dark:text-orange-400">{item.widgetData?.dueDate || '明天 12:00'}</span>
                </div>
                <div className="w-px h-3 bg-border"></div>
                <div className="flex items-center gap-1.5">
                  <div className="h-4 w-4 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[9px] font-bold">
                    {item.widgetData?.assignee?.charAt(0) || '张'}
                  </div>
                  <span>{item.widgetData?.assignee || '张三'}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="px-4 py-2 bg-muted/10 border-t border-border/50 flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity">
            <span className="text-[10px] text-muted-foreground">已自动同步至任务看板</span>
            <Button size="sm" variant="ghost" className="h-6 text-[10px] text-primary hover:text-primary hover:bg-primary/10">查看详情 <AlertCircle className="w-3 h-3 ml-0.5" /></Button>
          </div>
        </Card>
      );
    }

    return null;
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto pr-4 space-y-6" ref={scrollRef}>
        {items.map((item) => (
          <motion.div 
            key={item.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-4 group"
          >
            {item.type === 'system' ? (
              <div className="w-full flex items-center justify-center gap-2 py-2">
                <div className="h-px bg-border flex-1" />
                <span className="text-xs text-muted-foreground font-medium px-2 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {item.content}
                </span>
                <div className="h-px bg-border flex-1" />
              </div>
            ) : item.type === 'file' ? (
              <div className="w-full flex justify-center py-2">
                <Badge variant="secondary" className="font-normal text-xs py-1 px-3 flex items-center gap-2">
                  <FileText className="w-3 h-3 text-primary" />
                  {item.content}
                  <span className="text-muted-foreground ml-2">{item.timestamp}</span>
                </Badge>
              </div>
            ) : (
              <>
                <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 shadow-sm border font-medium ${
                  item.sender === 'Queen' 
                    ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white border-purple-400/30' 
                    : 'bg-gradient-to-br from-primary-100 to-primary-200 text-primary-700 border-primary/10'
                }`}>
                  {item.sender === 'Queen' ? <BrainCircuit className="w-5 h-5" /> : item.avatar || item.sender?.[0]}
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="font-medium text-sm text-foreground flex items-center gap-2">
                      {item.sender}
                      {item.sender === 'Queen' && <Badge variant="default" className="bg-purple-500 hover:bg-purple-600 text-[10px] px-1.5 py-0 h-4">AI</Badge>}
                    </div>
                    <span className="text-xs text-muted-foreground font-mono">{item.timestamp}</span>
                  </div>
                  <div className={`text-sm p-4 rounded-2xl rounded-tl-none border leading-relaxed shadow-sm ${
                    item.sender === 'Queen' 
                      ? 'bg-indigo-50/50 dark:bg-indigo-950/20 border-indigo-100 dark:border-indigo-900/50 text-foreground' 
                      : 'bg-muted/50 border-border/50 text-foreground'
                  }`}>
                    {item.content}
                    {item.type === 'queen_widget' && renderWidget(item)}
                  </div>
                </div>
              </>
            )}
          </motion.div>
        ))}
      </div>
      
      <div className="mt-6 pt-4 border-t border-border/50">
        <div className="relative flex items-center">
          <Button variant="ghost" size="icon" className="absolute left-2 text-muted-foreground hover:text-foreground">
            <Paperclip className="h-4 w-4" />
          </Button>
          <Input 
            className="pl-10 pr-12 py-6 bg-muted/30 rounded-full border-border/50 focus-visible:ring-primary/30" 
            placeholder="输入 @Q 呼叫 Queen，或直接输入讨论内容..." 
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSend();
            }}
          />
          <Button 
            size="icon" 
            className="absolute right-2 rounded-full h-8 w-8 shadow-sm"
            onClick={handleSend}
            disabled={!inputValue.trim()}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
