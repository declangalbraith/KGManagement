import React, { useState } from 'react';
import { motion } from 'motion/react';
import { FileText, BrainCircuit, CheckCircle2, AlertCircle, X, Sparkles, Edit2, Save } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Textarea } from './ui/textarea';

interface Dynamic8DReportProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Dynamic8DReport({ isOpen, onClose }: Dynamic8DReportProps) {
  const [isEditingD4, setIsEditingD4] = useState(false);
  const [d4Content, setD4Content] = useState(`基于故事线中的鱼骨图分析，初步结论如下：
- 物料：同批次闸瓦材质过硬，硬度测试报告显示超出标准上限。
- 人员：操作员在接收物料时未严格执行硬度抽检。
- 方法：正在分析工艺参数设置记录...`);

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="fixed inset-y-0 right-0 w-[600px] bg-background border-l border-border/50 shadow-2xl z-[90] flex flex-col"
    >
      <div className="flex items-center justify-between p-4 border-b border-border/50 bg-muted/10">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg text-primary">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-semibold text-lg">动态 8D 报告 (草稿)</h2>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
              <BrainCircuit className="w-3 h-3 text-purple-500" />
              <span className="text-purple-500 font-medium">Queen 影子伴写中...</span>
              <span>最后更新: 刚刚</span>
            </div>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
          <X className="w-5 h-5" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        {/* D1 */}
        <section className="space-y-3">
          <div className="flex items-center justify-between border-b pb-2">
            <h3 className="font-semibold text-foreground">D1: 成立团队 (Team Formation)</h3>
            <Badge variant="success" className="text-[10px]">已完成</Badge>
          </div>
          <div className="bg-muted/30 p-3 rounded-lg text-sm text-foreground space-y-2">
            <p><strong>负责人 (Champion):</strong> 李四</p>
            <p><strong>团队成员 (Members):</strong> 张三 (质量), 王五 (生产), 赵六 (工程)</p>
          </div>
        </section>

        {/* D2 */}
        <section className="space-y-3">
          <div className="flex items-center justify-between border-b pb-2">
            <h3 className="font-semibold text-foreground">D2: 描述问题 (Describe the Problem)</h3>
            <Badge variant="success" className="text-[10px]">已完成</Badge>
          </div>
          <div className="bg-purple-50/50 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/50 p-3 rounded-lg text-sm text-foreground relative">
            <div className="absolute -top-2 -right-2 bg-purple-500 text-white text-[9px] px-1.5 py-0.5 rounded flex items-center gap-1 shadow-sm">
              <BrainCircuit className="w-2.5 h-2.5" /> Queen 提取
            </div>
            <p>2026年4月10日，在总装车间发现批次为 BATCH-202604-001 的列车闸瓦在常规制动测试中出现异常磨损。磨损率超出标准公差 15%。</p>
          </div>
        </section>

        {/* D3 */}
        <section className="space-y-3">
          <div className="flex items-center justify-between border-b pb-2">
            <h3 className="font-semibold text-foreground">D3: 临时围堵措施 (Interim Containment Actions)</h3>
            <Badge variant="success" className="text-[10px]">已完成</Badge>
          </div>
          <div className="bg-purple-50/50 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/50 p-3 rounded-lg text-sm text-foreground relative">
            <div className="absolute -top-2 -right-2 bg-purple-500 text-white text-[9px] px-1.5 py-0.5 rounded flex items-center gap-1 shadow-sm">
              <BrainCircuit className="w-2.5 h-2.5" /> Queen 提取
            </div>
            <ul className="list-disc list-inside space-y-1">
              <li>立即隔离 BATCH-202604-001 批次的所有剩余库存。</li>
              <li>暂停使用该供应商的当前批次物料，切换至备用供应商物料。</li>
              <li>对已安装该批次闸瓦的 5 列车进行紧急召回和更换。</li>
            </ul>
          </div>
        </section>

        {/* D4 */}
        <section className="space-y-3">
          <div className="flex items-center justify-between border-b pb-2">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              D4: 根本原因分析 (Root Cause Analysis)
              {!isEditingD4 && (
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
                </span>
              )}
            </h3>
            <div className="flex items-center gap-2">
              <Badge variant="warning" className="text-[10px] bg-warning/10 text-warning-700 border-warning/20">伴写中</Badge>
              {isEditingD4 ? (
                <Button variant="ghost" size="sm" className="h-6 px-2 text-xs text-primary" onClick={() => setIsEditingD4(false)}>
                  <Save className="w-3 h-3 mr-1" /> 保存
                </Button>
              ) : (
                <Button variant="ghost" size="sm" className="h-6 px-2 text-xs text-muted-foreground hover:text-primary" onClick={() => setIsEditingD4(true)}>
                  <Edit2 className="w-3 h-3 mr-1" /> 人工介入
                </Button>
              )}
            </div>
          </div>
          <div className="bg-gradient-to-br from-purple-50/80 to-indigo-50/80 dark:from-purple-950/30 dark:to-indigo-950/30 border border-purple-200/50 dark:border-purple-800/50 p-4 rounded-xl text-sm text-foreground relative shadow-sm overflow-hidden group">
            <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-purple-500 to-indigo-500"></div>
            {!isEditingD4 && (
              <div className="absolute -top-2 -right-2 bg-gradient-to-r from-purple-500 to-indigo-500 text-white text-[9px] px-2 py-1 rounded-md flex items-center gap-1 shadow-md transform group-hover:scale-105 transition-transform">
                <BrainCircuit className="w-3 h-3 animate-pulse" /> Queen 实时同步
              </div>
            )}
            
            <div className="space-y-3 mt-1">
              {isEditingD4 ? (
                <Textarea 
                  value={d4Content}
                  onChange={(e) => setD4Content(e.target.value)}
                  className="min-h-[150px] text-sm bg-background/50 border-purple-200 focus-visible:ring-purple-500"
                />
              ) : (
                <>
                  <p className="text-muted-foreground italic flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-purple-500" />
                    基于故事线中的鱼骨图分析，初步结论如下：
                  </p>
                  <div className="space-y-2 pl-2 border-l-2 border-purple-200 dark:border-purple-800/50 ml-1.5">
                    <div className="flex gap-2 items-start">
                      <Badge variant="outline" className="text-[9px] bg-background mt-0.5 shrink-0">物料</Badge>
                      <span className="text-foreground leading-relaxed">同批次闸瓦材质过硬，硬度测试报告显示超出标准上限。</span>
                    </div>
                    <div className="flex gap-2 items-start">
                      <Badge variant="outline" className="text-[9px] bg-background mt-0.5 shrink-0">人员</Badge>
                      <span className="text-foreground leading-relaxed">操作员在接收物料时未严格执行硬度抽检。</span>
                    </div>
                    <div className="flex gap-2 items-start opacity-70 animate-pulse">
                      <Badge variant="outline" className="text-[9px] bg-background mt-0.5 shrink-0 border-dashed">方法</Badge>
                      <span className="text-muted-foreground leading-relaxed">正在分析工艺参数设置记录...</span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </section>

        {/* D5-D8 Placeholders */}
        <section className="space-y-3 opacity-50">
          <div className="flex items-center justify-between border-b pb-2">
            <h3 className="font-semibold text-foreground">D5: 制定永久纠正措施 (Develop Permanent Corrective Actions)</h3>
            <Badge variant="secondary" className="text-[10px]">待定</Badge>
          </div>
          <div className="bg-muted/30 p-3 rounded-lg text-sm text-muted-foreground flex items-center justify-center h-16">
            等待故事线推进...
          </div>
        </section>
      </div>
      
      <div className="p-4 border-t border-border/50 bg-background flex justify-end gap-3">
        <Button variant="outline">导出 PDF</Button>
        <Button className="gap-2"><CheckCircle2 className="w-4 h-4" /> 提交审核</Button>
      </div>
    </motion.div>
  );
}
