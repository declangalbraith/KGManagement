import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card';
import { Button } from '@/src/components/ui/button';
import { Users, Shield, Settings, Database, FileText, LayoutTemplate, ArrowRight } from 'lucide-react';
import { useToast } from '@/src/components/ui/use-toast';

export function Admin() {
  const { toast } = useToast();
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});

  const handleEnterManagement = (moduleName: string) => {
    setLoadingStates(prev => ({ ...prev, [moduleName]: true }));
    setTimeout(() => {
      setLoadingStates(prev => ({ ...prev, [moduleName]: false }));
      toast({
        title: "正在进入",
        description: `正在加载 ${moduleName} 模块...`,
      });
    }, 800);
  };

  return (
    <div className="flex flex-col gap-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-serif text-primary-900 dark:text-primary-100 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Settings className="h-6 w-6 text-primary" />
            </div>
            后台管理
          </h1>
          <p className="text-muted-foreground mt-2">配置系统参数、管理用户权限和组织架构。</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="glass-panel hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer group border-transparent hover:border-primary/20" onClick={() => handleEnterManagement('用户管理')}>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-3 text-lg group-hover:text-primary transition-colors">
              <div className="p-2 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/40 transition-colors">
                <Users className="h-5 w-5" />
              </div>
              用户管理
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground mb-6 leading-relaxed">管理系统用户账号、状态启停及基本信息维护。</p>
            <div className="flex justify-end">
              <Button variant="ghost" size="sm" className="text-primary group-hover:bg-primary/10 rounded-full transition-colors" isLoading={loadingStates['用户管理']} onClick={(e) => { e.stopPropagation(); handleEnterManagement('用户管理'); }}>
                进入管理 <ArrowRight className="h-4 w-4 ml-1.5 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-panel hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer group border-transparent hover:border-primary/20" onClick={() => handleEnterManagement('角色与权限')}>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-3 text-lg group-hover:text-primary transition-colors">
              <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400 group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/40 transition-colors">
                <Shield className="h-5 w-5" />
              </div>
              角色与权限
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground mb-6 leading-relaxed">配置角色权限矩阵，控制功能访问和数据可见范围。</p>
            <div className="flex justify-end">
              <Button variant="ghost" size="sm" className="text-primary group-hover:bg-primary/10 rounded-full transition-colors" isLoading={loadingStates['角色与权限']} onClick={(e) => { e.stopPropagation(); handleEnterManagement('角色与权限'); }}>
                进入管理 <ArrowRight className="h-4 w-4 ml-1.5 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-panel hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer group border-transparent hover:border-primary/20" onClick={() => handleEnterManagement('组织与领域')}>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-3 text-lg group-hover:text-primary transition-colors">
              <div className="p-2 rounded-lg bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400 group-hover:bg-purple-100 dark:group-hover:bg-purple-900/40 transition-colors">
                <Database className="h-5 w-5" />
              </div>
              组织与领域
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground mb-6 leading-relaxed">维护公司组织架构树、部门信息及业务领域划分。</p>
            <div className="flex justify-end">
              <Button variant="ghost" size="sm" className="text-primary group-hover:bg-primary/10 rounded-full transition-colors" isLoading={loadingStates['组织与领域']} onClick={(e) => { e.stopPropagation(); handleEnterManagement('组织与领域'); }}>
                进入管理 <ArrowRight className="h-4 w-4 ml-1.5 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-panel hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer group border-transparent hover:border-primary/20" onClick={() => handleEnterManagement('业务配置')}>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-3 text-lg group-hover:text-primary transition-colors">
              <div className="p-2 rounded-lg bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400 group-hover:bg-orange-100 dark:group-hover:bg-orange-900/40 transition-colors">
                <Settings className="h-5 w-5" />
              </div>
              业务配置
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground mb-6 leading-relaxed">配置问题分类、状态字典、优先级及通知规则。</p>
            <div className="flex justify-end">
              <Button variant="ghost" size="sm" className="text-primary group-hover:bg-primary/10 rounded-full transition-colors" isLoading={loadingStates['业务配置']} onClick={(e) => { e.stopPropagation(); handleEnterManagement('业务配置'); }}>
                进入管理 <ArrowRight className="h-4 w-4 ml-1.5 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-panel hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer group border-transparent hover:border-primary/20" onClick={() => handleEnterManagement('模板管理')}>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-3 text-lg group-hover:text-primary transition-colors">
              <div className="p-2 rounded-lg bg-pink-50 text-pink-600 dark:bg-pink-900/20 dark:text-pink-400 group-hover:bg-pink-100 dark:group-hover:bg-pink-900/40 transition-colors">
                <LayoutTemplate className="h-5 w-5" />
              </div>
              模板管理
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground mb-6 leading-relaxed">管理 8D 报告模板、问题单模板及通知消息模板。</p>
            <div className="flex justify-end">
              <Button variant="ghost" size="sm" className="text-primary group-hover:bg-primary/10 rounded-full transition-colors" isLoading={loadingStates['模板管理']} onClick={(e) => { e.stopPropagation(); handleEnterManagement('模板管理'); }}>
                进入管理 <ArrowRight className="h-4 w-4 ml-1.5 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
