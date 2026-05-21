import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, X, BrainCircuit, Send, Bot, User, Database, Wrench, 
  CheckSquare, AlertCircle, BarChart2, FileText, Zap, Activity, 
  Paperclip, ChevronRight, ChevronDown, Search, ArrowRight,
  FolderOpen, BookOpen, Plus
} from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { useToast } from './ui/use-toast';
import Markdown from 'react-markdown';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  isStreaming?: boolean;
}

interface Reference {
  id: string;
  type: 'knowledge' | 'project' | 'skill';
  name: string;
  icon: React.ReactNode;
}

export function QueenAssistant() {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [context, setContext] = useState<'global' | 'issue' | 'task'>('global');
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [showPing, setShowPing] = useState(true);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [selectingProject, setSelectingProject] = useState(false);
  
  // Token usage state
  const [tokenUsage, setTokenUsage] = useState({ used: 0, limit: 500000 });
  
  // References state (Claude-like context attachments)
  const [references, setReferences] = useState<Reference[]>([]);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: '你好！我是 Knorr-Bremse 智能助手。你可以直接向我描述遇到的质量问题，或者在下方关联具体的项目和知识库，我会帮你分析故障原因、检索历史案例，并提供处置建议。'
    }
  ]);
  
  const dragConstraintsRef = useRef(null);
  const isDragging = useRef(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const attachMenuRef = useRef<HTMLDivElement>(null);

  // Stop the ping animation after 5 seconds to avoid annoyance
  useEffect(() => {
    const timer = setTimeout(() => setShowPing(false), 5000);
    return () => clearTimeout(timer);
  }, []);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  // Click outside to close attach menu
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (attachMenuRef.current && !attachMenuRef.current.contains(event.target as Node)) {
        setShowAttachMenu(false);
        setSelectingProject(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSend = async (text: string = input) => {
    if (!text.trim()) return;
    
    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: text.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsSending(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMsg].map(m => ({ role: m.role, content: m.content })),
          context,
          references: references.map(r => ({ type: r.type, name: r.name }))
        })
      });

      if (!response.ok) {
        throw new Error('Failed to fetch response');
      }

      const data = await response.json();
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'assistant', content: data.content }]);
      
      // Update token usage
      if (data.usage && data.usage.totalTokens) {
        setTokenUsage(prev => ({ ...prev, used: prev.used + data.usage.totalTokens }));
      }
      
    } catch (error) {
      console.error("Chat error:", error);
      toast({
        title: "请求失败",
        description: "无法连接到 Queen 服务，请稍后重试。",
        variant: "destructive"
      });
      // Remove the user message if it failed, or add an error message
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'assistant', content: "抱歉，我遇到了一些网络问题，暂时无法回答您的问题。" }]);
    } finally {
      setIsSending(false);
    }
  };

  const handlePointerDown = () => {
    isDragging.current = false;
  };

  const addReference = (type: 'knowledge' | 'project' | 'skill', name: string, icon: React.ReactNode) => {
    if (!references.find(r => r.name === name)) {
      setReferences([...references, { id: Date.now().toString(), type, name, icon }]);
    }
    setShowAttachMenu(false);
  };

  const removeReference = (id: string) => {
    setReferences(references.filter(r => r.id !== id));
  };

  return (
    <>
      <div ref={dragConstraintsRef} className="fixed inset-0 pointer-events-none z-[100]" />
      <AnimatePresence>
        {isOpen && (
          <motion.div
            drag
            dragConstraints={dragConstraintsRef}
            dragElastic={0.1}
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-24 right-6 z-[101] w-[450px] shadow-2xl pointer-events-auto"
            style={{ touchAction: 'none' }}
          >
            <Card className="border-border bg-white dark:bg-slate-950 backdrop-blur-none flex flex-col h-[650px] shadow-2xl rounded-sm">
              <div className="bg-primary h-1.5 w-full shrink-0 cursor-grab active:cursor-grabbing" />
              <CardHeader className="pb-3 pt-4 flex flex-row items-center justify-between shrink-0 cursor-grab active:cursor-grabbing bg-muted/10 border-b border-border/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary rounded-sm text-primary-foreground shadow-sm">
                    <BrainCircuit className="w-5 h-5" />
                  </div>
                  <div>
                    <CardTitle className="text-base font-bold text-primary">
                      KB Assistant
                    </CardTitle>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                      </span>
                      <p className="text-[10px] text-muted-foreground font-medium">系统就绪</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-[10px] text-muted-foreground bg-muted/50 px-2 py-1 rounded-md border border-border/50 flex items-center gap-1">
                    <Zap className="w-3 h-3 text-amber-500" />
                    <span>{tokenUsage.used.toLocaleString()} / {tokenUsage.limit.toLocaleString()}</span>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2 hover:bg-muted" onClick={() => setIsOpen(false)}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="flex-1 overflow-hidden flex flex-col p-0">
                {/* Context Selector */}
                <div className="px-4 py-2.5 shrink-0 border-b border-border/50 bg-background/50 flex items-center justify-between">
                  <div className="flex flex-wrap gap-1.5">
                    <Badge variant={context === 'global' ? 'default' : 'outline'} className="cursor-pointer text-[10px] py-0.5 h-6 transition-all" onClick={() => setContext('global')}>
                      <Database className="w-3 h-3 mr-1" /> 全局视野
                    </Badge>
                    <Badge variant={context === 'issue' ? 'default' : 'outline'} className="cursor-pointer text-[10px] py-0.5 h-6 transition-all" onClick={() => setContext('issue')}>
                      <AlertCircle className="w-3 h-3 mr-1" /> 当前问题
                    </Badge>
                  </div>
                  <Button variant="ghost" size="sm" className="h-6 text-[10px] px-2 text-muted-foreground hover:text-primary" onClick={() => toast({ title: "配置技能", description: "正在打开技能配置面板..." })}>
                    <Wrench className="w-3 h-3 mr-1" /> 配置技能
                  </Button>
                </div>
                
                {/* Chat Area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-gradient-to-b from-slate-50/50 to-background dark:from-slate-900/20">
                  
                  {messages.map((msg, index) => (
                    <div key={msg.id} className={`flex gap-3 group ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                      <div className={`h-8 w-8 rounded flex items-center justify-center shrink-0 shadow-sm ${
                        msg.role === 'user' 
                          ? 'bg-primary text-primary-foreground shadow-md' 
                          : 'bg-primary/10 text-primary border border-primary/20'
                      }`}>
                        {msg.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                      </div>
                      <div className={`flex-1 space-y-2 max-w-[85%] ${msg.role === 'user' ? 'flex flex-col items-end' : ''}`}>
                        <div className={`text-xs p-3.5 rounded-2xl shadow-sm leading-relaxed ${
                          msg.role === 'user'
                            ? 'bg-primary text-primary-foreground rounded-tr-sm'
                            : 'bg-card border border-border/50 rounded-tl-sm'
                        }`}>
                          {msg.role === 'assistant' ? (
                            <div className="markdown-body prose prose-sm dark:prose-invert max-w-none text-xs">
                              <Markdown>{msg.content}</Markdown>
                            </div>
                          ) : (
                            msg.content
                          )}
                          
                          {/* Render Quick Actions only for the first welcome message */}
                          {index === 0 && msg.role === 'assistant' && (
                            <div className="grid grid-cols-1 gap-2 mt-4">
                              <div className="flex items-start gap-2 p-2 rounded-lg border border-border/50 hover:border-primary/50 hover:bg-primary/5 cursor-pointer transition-colors" onClick={() => handleSend('产品：CRH380动车组。故障描述：车轮踏面剥离。请分析故障原因、检索历史案例，并给出处置方案。')}>
                                <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-md shrink-0 mt-0.5"><Search className="w-3.5 h-3.5" /></div>
                                <div className="flex flex-col">
                                  <span className="text-[11px] font-medium text-foreground">车轮踏面剥离分析</span>
                                  <span className="text-[9px] text-muted-foreground line-clamp-1">产品：CRH380动车组。故障描述：车轮踏面剥离...</span>
                                </div>
                              </div>
                              <div className="flex items-start gap-2 p-2 rounded-lg border border-border/50 hover:border-primary/50 hover:bg-primary/5 cursor-pointer transition-colors" onClick={() => handleSend('产品：转向架。故障描述：轴承温度过高报警。请分析可能的原因，并提供应急处置建议。')}>
                                <div className="p-1.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-md shrink-0 mt-0.5"><Activity className="w-3.5 h-3.5" /></div>
                                <div className="flex flex-col">
                                  <span className="text-[11px] font-medium text-foreground">轴承温度过高报警</span>
                                  <span className="text-[9px] text-muted-foreground line-clamp-1">产品：转向架。故障描述：轴承温度过高报警...</span>
                                </div>
                              </div>
                              <div className="flex items-start gap-2 p-2 rounded-lg border border-border/50 hover:border-primary/50 hover:bg-primary/5 cursor-pointer transition-colors" onClick={() => handleSend('产品：高压牵引电机。故障描述：绝缘测试不合格。请调取相关质量整改记录并给出排查指南。')}>
                                <div className="p-1.5 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-md shrink-0 mt-0.5"><FileText className="w-3.5 h-3.5" /></div>
                                <div className="flex flex-col">
                                  <span className="text-[11px] font-medium text-foreground">绝缘测试不合格排查</span>
                                  <span className="text-[9px] text-muted-foreground line-clamp-1">产品：高压牵引电机。故障描述：绝缘测试不合格...</span>
                                </div>
                              </div>
                              <div className="flex items-start gap-2 p-2 rounded-lg border border-border/50 hover:border-primary/50 hover:bg-primary/5 cursor-pointer transition-colors" onClick={() => handleSend('产品：制动系统。故障描述：制动闸片异常偏磨。请评估潜在风险及预防措施。')}>
                                <div className="p-1.5 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-md shrink-0 mt-0.5"><AlertCircle className="w-3.5 h-3.5" /></div>
                                <div className="flex flex-col">
                                  <span className="text-[11px] font-medium text-foreground">制动闸片异常偏磨评估</span>
                                  <span className="text-[9px] text-muted-foreground line-clamp-1">产品：制动系统。故障描述：制动闸片异常偏磨...</span>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                  {isSending && (
                    <div className="flex gap-3 group">
                      <div className={`h-8 w-8 rounded bg-primary/10 flex items-center justify-center text-primary shrink-0 shadow-sm border border-primary/20`}>
                        <Bot className="h-4 w-4" />
                      </div>
                      <div className="flex-1 space-y-2 max-w-[85%]">
                        <div className="text-xs bg-card p-3.5 rounded-2xl rounded-tl-sm border border-border/50 shadow-sm flex items-center gap-2 w-fit">
                          <div className="flex gap-1">
                            <span className="w-1.5 h-1.5 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                            <span className="w-1.5 h-1.5 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                            <span className="w-1.5 h-1.5 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                          </div>
                          <span className="text-muted-foreground text-[10px]">Queen 正在思考...</span>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-3 border-t border-border/50 bg-card/95 backdrop-blur-md shrink-0 relative">
                  
                  {/* References Display */}
                  {references.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-2 px-1">
                      {references.map(ref => (
                        <Badge key={ref.id} variant="secondary" className="text-[10px] py-0.5 h-6 bg-muted/50 flex items-center gap-1 border border-border/50">
                          {ref.icon}
                          <span className="max-w-[100px] truncate">{ref.name}</span>
                          <X 
                            className="w-3 h-3 ml-1 cursor-pointer hover:text-destructive" 
                            onClick={() => removeReference(ref.id)}
                          />
                        </Badge>
                      ))}
                    </div>
                  )}

                  <div className="relative flex items-center">
                    {/* Attachment Menu */}
                    <div className="relative" ref={attachMenuRef}>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className={`h-8 w-8 rounded-lg mr-1 ${showAttachMenu ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-primary hover:bg-primary/10'}`}
                        onClick={() => setShowAttachMenu(!showAttachMenu)}
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                      
                      <AnimatePresence mode="wait">
                        {showAttachMenu && (
                          <motion.div 
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            transition={{ duration: 0.15 }}
                            className="absolute bottom-full left-0 mb-2 w-48 bg-card border border-border/50 shadow-xl rounded-xl overflow-hidden z-50"
                          >
                            {!selectingProject ? (
                              <motion.div key="main" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="p-1.5">
                                <div className="text-[10px] font-semibold text-muted-foreground px-2 py-1.5 uppercase tracking-wider">添加上下文关联</div>
                                <button 
                                  className="w-full flex items-center gap-2 px-2 py-2 text-xs hover:bg-muted rounded-md transition-colors text-left"
                                  onClick={() => addReference('knowledge', '全局知识库', <BookOpen className="w-3 h-3 text-blue-500" />)}
                                >
                                  <div className="p-1 bg-blue-100 dark:bg-blue-900/30 rounded"><BookOpen className="w-3 h-3 text-blue-600 dark:text-blue-400" /></div>
                                  <span>关联知识库</span>
                                </button>
                                <button 
                                  className="w-full flex items-center justify-between px-2 py-2 text-xs hover:bg-muted rounded-md transition-colors text-left"
                                  onClick={() => setSelectingProject(true)}
                                >
                                  <div className="flex items-center gap-2">
                                    <div className="p-1 bg-emerald-100 dark:bg-emerald-900/30 rounded"><FolderOpen className="w-3 h-3 text-emerald-600 dark:text-emerald-400" /></div>
                                    <span>关联项目</span>
                                  </div>
                                  <ChevronRight className="w-3 h-3 text-muted-foreground" />
                                </button>
                                <button 
                                  className="w-full flex items-center gap-2 px-2 py-2 text-xs hover:bg-muted rounded-md transition-colors text-left"
                                  onClick={() => addReference('skill', '数据分析引擎', <Wrench className="w-3 h-3 text-purple-500" />)}
                                >
                                  <div className="p-1 bg-purple-100 dark:bg-purple-900/30 rounded"><Wrench className="w-3 h-3 text-purple-600 dark:text-purple-400" /></div>
                                  <span>调用特定技能</span>
                                </button>
                              </motion.div>
                            ) : (
                              <motion.div key="projects" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="p-1.5">
                                <div 
                                  className="flex items-center gap-1 px-2 py-1.5 text-[10px] font-semibold text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
                                  onClick={() => setSelectingProject(false)}
                                >
                                  <ChevronRight className="w-3 h-3 rotate-180" /> 返回
                                </div>
                                <div className="max-h-[200px] overflow-y-auto no-scrollbar">
                                  {['CRH380 检修项目', '地铁1号线维护项目', '复兴号质量提升专项', '城际列车制动系统改造'].map(p => (
                                    <button 
                                      key={p}
                                      className="w-full flex items-center gap-2 px-2 py-2 text-xs hover:bg-muted rounded-md transition-colors text-left"
                                      onClick={() => {
                                        addReference('project', p, <FolderOpen className="w-3 h-3 text-emerald-500" />);
                                        setSelectingProject(false);
                                      }}
                                    >
                                      <FolderOpen className="w-3 h-3 text-muted-foreground shrink-0" />
                                      <span className="truncate">{p}</span>
                                    </button>
                                  ))}
                                </div>
                              </motion.div>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    <Input 
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                      placeholder="输入指令，或输入 '/' 唤起快捷命令..." 
                      className="pr-20 h-11 rounded-xl bg-muted/30 border-border/50 focus-visible:ring-primary focus-visible:bg-background transition-all text-xs shadow-inner"
                      disabled={isSending}
                    />
                    <div className="absolute right-1.5 flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-primary hover:bg-primary/10" onClick={() => toast({ title: "AI 建议", description: "正在生成建议问题..." })}>
                        <Sparkles className="h-4 w-4" />
                      </Button>
                      <Button size="icon" className="h-8 w-8 rounded-lg shadow-md bg-gradient-to-br from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 border-none" onClick={() => handleSend()} disabled={isSending || !input.trim()}>
                        <Send className="h-3.5 w-3.5 text-white" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="fixed bottom-6 right-6 z-[100] pointer-events-auto flex items-center justify-center">
        <motion.button
          drag
          dragConstraints={dragConstraintsRef}
          dragElastic={0.1}
          dragMomentum={false}
          onPointerDown={handlePointerDown}
          onDrag={() => { isDragging.current = true; }}
          onDragEnd={() => { 
            setTimeout(() => { isDragging.current = false; }, 200); 
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClickCapture={(e) => {
            if (isDragging.current) {
              e.preventDefault();
              e.stopPropagation();
              return;
            }
            setIsOpen(!isOpen);
          }}
          className="relative h-14 w-14 rounded bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:shadow-xl hover:bg-primary-600 transition-colors cursor-grab active:cursor-grabbing group"
        >
          <BrainCircuit className="w-6 h-6" />
          
          {/* Tooltip */}
          {!isOpen && (
            <div className="absolute right-full mr-4 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-foreground text-background text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-xl">
              唤醒 KB 智能助手
              <div className="absolute top-1/2 -right-1 -translate-y-1/2 border-4 border-transparent border-l-slate-800" />
            </div>
          )}
        </motion.button>
      </div>
    </>
  );
}
