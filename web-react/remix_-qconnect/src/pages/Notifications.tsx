import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card';
import { Button } from '@/src/components/ui/button';
import { Badge } from '@/src/components/ui/badge';
import { Bell, CheckCircle2, Clock, FileText, MessageSquare, AlertCircle, Check } from 'lucide-react';
import { useToast } from '@/src/components/ui/use-toast';

export function Notifications() {
  const { toast } = useToast();
  const [isMarkingAll, setIsMarkingAll] = useState(false);

  const handleMarkAllRead = () => {
    setIsMarkingAll(true);
    setTimeout(() => {
      setIsMarkingAll(false);
      toast({
        title: "操作成功",
        description: "所有通知已标记为已读。",
        variant: "success"
      });
    }, 800);
  };

  const handleNotificationClick = (id: string) => {
    toast({
      title: "正在跳转",
      description: `正在打开通知详情...`,
    });
  };

  return (
    <div className="flex flex-col gap-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-serif text-primary-900 dark:text-primary-100 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Bell className="h-5 w-5 text-primary" />
            </div>
            通知中心
          </h1>
          <p className="text-muted-foreground mt-2">查看所有系统提醒、流程通知和任务分配。</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="gap-2 rounded-full hover:bg-primary/5 hover:text-primary transition-colors shadow-sm" onClick={handleMarkAllRead} isLoading={isMarkingAll}>
            <Check className="h-4 w-4" />
            全部标记为已读
          </Button>
        </div>
      </div>

      <Card className="glass-panel hover:shadow-lg transition-all duration-300 overflow-hidden border-border/50">
        <CardHeader className="border-b border-border/50 pb-0 pt-6 px-6 bg-muted/10">
          <div className="flex gap-6">
            <div className="font-medium text-primary border-b-2 border-primary pb-4 px-1 cursor-pointer transition-colors relative">
              全部通知
              <span className="absolute -top-1 -right-3 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-40"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
              </span>
            </div>
            <div className="text-muted-foreground pb-4 px-1 cursor-pointer hover:text-foreground transition-colors">未读 (3)</div>
            <div className="text-muted-foreground pb-4 px-1 cursor-pointer hover:text-foreground transition-colors">@我的</div>
            <div className="text-muted-foreground pb-4 px-1 cursor-pointer hover:text-foreground transition-colors">系统公告</div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border/50">
            <div className="p-5 flex gap-5 bg-primary/5 hover:bg-primary/10 transition-colors cursor-pointer group relative" onClick={() => handleNotificationClick('1')}>
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary"></div>
              <div className="mt-1">
                <div className="h-2.5 w-2.5 rounded-full bg-primary mt-1.5 group-hover:scale-125 transition-transform shadow-[0_0_8px_rgba(var(--primary),0.6)]"></div>
              </div>
              <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0 mt-0.5 group-hover:bg-blue-200 dark:group-hover:bg-blue-900/50 transition-colors shadow-sm border border-blue-200 dark:border-blue-800">
                <AlertCircle className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="font-semibold text-sm group-hover:text-primary transition-colors">流程节点提醒</div>
                  <div className="text-xs text-primary font-medium bg-primary/10 px-2 py-0.5 rounded-full">10 分钟前</div>
                </div>
                <p className="text-sm text-foreground leading-relaxed">
                  问题 <span className="font-mono font-medium text-primary bg-primary/5 px-1.5 py-0.5 rounded border border-primary/10">ISS-202604-002</span> 已流转至【待确认原因】节点，请您及时处理。
                </p>
              </div>
            </div>

            <div className="p-5 flex gap-5 bg-primary/5 hover:bg-primary/10 transition-colors cursor-pointer group relative" onClick={() => handleNotificationClick('2')}>
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-orange-500"></div>
              <div className="mt-1">
                <div className="h-2.5 w-2.5 rounded-full bg-orange-500 mt-1.5 group-hover:scale-125 transition-transform shadow-[0_0_8px_rgba(249,115,22,0.6)]"></div>
              </div>
              <div className="h-10 w-10 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-600 dark:text-orange-400 shrink-0 mt-0.5 group-hover:bg-orange-200 dark:group-hover:bg-orange-900/50 transition-colors shadow-sm border border-orange-200 dark:border-orange-800">
                <Clock className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="font-semibold text-sm group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">任务逾期提醒</div>
                  <div className="text-xs text-orange-600 dark:text-orange-400 font-medium bg-orange-500/10 px-2 py-0.5 rounded-full">2 小时前</div>
                </div>
                <p className="text-sm text-foreground leading-relaxed">
                  子任务 <span className="font-mono font-medium text-orange-600 dark:text-orange-400 bg-orange-500/5 px-1.5 py-0.5 rounded border border-orange-500/10">TSK-202604-01</span> (确认制动盘表面裂纹原因) 已逾期 2 天。
                </p>
              </div>
            </div>

            <div className="p-5 flex gap-5 hover:bg-muted/50 transition-colors cursor-pointer group" onClick={() => handleNotificationClick('3')}>
              <div className="mt-1 w-2.5"></div>
              <div className="h-10 w-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5 group-hover:bg-emerald-200 dark:group-hover:bg-emerald-900/50 transition-colors shadow-sm border border-emerald-200 dark:border-emerald-800">
                <FileText className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="font-medium text-sm group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">8D 报告审批通过</div>
                  <div className="text-xs text-muted-foreground">昨天 16:30</div>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  您提交的 <span className="font-mono font-medium text-foreground">8D-202604-003</span> 报告已由 王总 审批通过。
                </p>
              </div>
            </div>

            <div className="p-5 flex gap-5 hover:bg-muted/50 transition-colors cursor-pointer group" onClick={() => handleNotificationClick('4')}>
              <div className="mt-1 w-2.5"></div>
              <div className="h-10 w-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400 shrink-0 mt-0.5 group-hover:bg-purple-200 dark:group-hover:bg-purple-900/50 transition-colors shadow-sm border border-purple-200 dark:border-purple-800">
                <MessageSquare className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="font-medium text-sm group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">新评论 @了你</div>
                  <div className="text-xs text-muted-foreground">昨天 14:20</div>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  <span className="font-medium text-foreground">李四</span> 在问题 ISS-202604-001 中提到了您："<span className="text-foreground">@张三</span> 请确认一下现场测试数据是否已上传。"
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
