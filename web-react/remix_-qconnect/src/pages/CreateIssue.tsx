import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/src/components/ui/card';
import { Input } from '@/src/components/ui/input';
import { Button } from '@/src/components/ui/button';
import { ArrowLeft, Save, Send } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useToast } from '@/src/components/ui/use-toast';

export function CreateIssue() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      toast({
        title: "创建成功",
        description: "问题单已成功提交并进入处理流程。",
        variant: "success"
      });
      navigate('/issues');
    }, 1500);
  };

  const handleSaveDraft = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      toast({
        title: "草稿已保存",
        description: "您可以在“我的待办”中继续编辑此问题单。",
        variant: "default"
      });
    }, 800);
  };

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">创建问题单</h1>
          <p className="text-muted-foreground">填写问题详细信息以启动处理流程。</p>
        </div>
      </div>

      <Card className="hover:shadow-md transition-all duration-300">
        <CardHeader>
          <CardTitle>基本信息</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium">问题标题 <span className="text-destructive">*</span></label>
            <Input placeholder="简明扼要地描述问题..." className="transition-all focus:ring-2" />
          </div>
          
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">问题分类 <span className="text-destructive">*</span></label>
              <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                <option value="">请选择分类</option>
                <option value="quality">质量投诉</option>
                <option value="tech">技术咨询</option>
                <option value="support">现场支持</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">涉及产品 <span className="text-destructive">*</span></label>
              <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                <option value="">请选择产品</option>
                <option value="brake">制动盘</option>
                <option value="compressor">空压机</option>
                <option value="valve">控制阀</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">严重程度</label>
              <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                <option value="high">高 - 影响行车安全或导致停运</option>
                <option value="medium">中 - 影响部分功能</option>
                <option value="low">低 - 轻微瑕疵</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">发生时间</label>
              <Input type="date" className="transition-all focus:ring-2" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">问题详细描述 <span className="text-destructive">*</span></label>
            <textarea 
              className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background transition-all placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              placeholder="请详细描述问题现象、发生条件、频次等信息..."
            ></textarea>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">客户信息</label>
            <Input placeholder="客户名称、项目名称、车号等..." className="transition-all focus:ring-2" />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">附件上传</label>
            <div className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-muted-foreground hover:bg-muted/50 hover:border-primary/50 transition-all cursor-pointer">
              <p className="text-sm">点击或拖拽文件到此处上传</p>
              <p className="text-xs mt-1">支持图片、视频、文档等格式，单个文件不超过 50MB</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="hover:shadow-md transition-all duration-300">
        <CardHeader>
          <CardTitle>流程配置</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between border-b pb-4">
            <div>
              <div className="font-medium">启动 8D 流程</div>
              <div className="text-sm text-muted-foreground">是否需要生成标准的 8D 报告以回复客户</div>
            </div>
            <input type="checkbox" className="h-4 w-4 accent-primary" />
          </div>
          <div className="flex items-center justify-between border-b pb-4">
            <div>
              <div className="font-medium">发起根因分析</div>
              <div className="text-sm text-muted-foreground">是否需要使用 5Why 或鱼骨图进行深入分析</div>
            </div>
            <input type="checkbox" className="h-4 w-4 accent-primary" defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">组建专项团队</div>
              <div className="text-sm text-muted-foreground">是否需要跨部门协作处理此问题</div>
            </div>
            <input type="checkbox" className="h-4 w-4 accent-primary" defaultChecked />
          </div>
        </CardContent>
        <CardFooter className="flex justify-between border-t p-6 bg-muted/10">
          <Button variant="outline" className="gap-2" onClick={handleSaveDraft} isLoading={isSaving}>
            <Save className="h-4 w-4" />
            保存草稿
          </Button>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => toast({ title: "预览已生成", description: "正在打开预览页面..." })}>预览</Button>
            <Button className="gap-2" onClick={handleSubmit} isLoading={isSubmitting}>
              <Send className="h-4 w-4" />
              提交问题
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
