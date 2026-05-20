import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card';
import { Button } from '@/src/components/ui/button';
import { Download, Calendar, Filter, TrendingUp, TrendingDown, Activity, PieChart as PieChartIcon, BarChart3, Clock, CheckCircle2, FileText } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, LabelList } from 'recharts';
import { useToast } from '@/src/components/ui/use-toast';

const statusData = [
  { name: '待受理', value: 12 },
  { name: '处理中', value: 28 },
  { name: '待确认', value: 15 },
  { name: '已完成', value: 45 },
];

const COLORS = ['#94a3b8', '#3b82f6', '#f59e0b', '#10b981'];

const trendData = [
  { name: '1月', 新增: 40, 解决: 24 },
  { name: '2月', 新增: 30, 解决: 35 },
  { name: '3月', 新增: 45, 解决: 40 },
  { name: '4月', 新增: 25, 解决: 30 },
];

const productData = [
  { name: '制动盘', 问题数: 35 },
  { name: '空压机', 问题数: 28 },
  { name: '控制阀', 问题数: 22 },
  { name: '传感器', 问题数: 15 },
];

export function DataAnalytics() {
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = () => {
    setIsExporting(true);
    setTimeout(() => {
      setIsExporting(false);
      toast({
        title: "导出成功",
        description: "数据分析报告已导出为 PDF 文件。",
        variant: "success"
      });
    }, 2000);
  };

  return (
    <div className="flex flex-col gap-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-serif text-primary-900 dark:text-primary-100">数据分析看板</h1>
          <p className="text-muted-foreground mt-1">全局掌握问题处理效率、质量趋势和产品表现。</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="gap-2 rounded-full hover:bg-primary/5 hover:text-primary transition-colors" onClick={() => toast({ title: "选择时间范围", description: "正在打开日期选择器..." })}>
            <Calendar className="h-4 w-4" />
            本年度
          </Button>
          <Button variant="outline" className="gap-2 rounded-full hover:bg-primary/5 hover:text-primary transition-colors" onClick={() => toast({ title: "数据筛选", description: "正在打开筛选面板..." })}>
            <Filter className="h-4 w-4" />
            筛选
          </Button>
          <Button className="gap-2 rounded-full shadow-md hover:shadow-lg transition-all" onClick={handleExport} isLoading={isExporting}>
            <Download className="h-4 w-4" />
            导出报告
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="glass-panel hover:shadow-lg transition-all duration-300 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Activity className="h-16 w-16 text-primary" />
          </div>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">问题总数</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold font-mono text-foreground">142</div>
            <p className="text-sm text-muted-foreground mt-2 flex items-center gap-1">
              <span className="text-destructive flex items-center bg-destructive/10 px-1.5 py-0.5 rounded text-xs font-medium"><TrendingUp className="h-3 w-3 mr-1" /> 12%</span> 
              <span>较上期</span>
            </p>
          </CardContent>
        </Card>
        
        <Card className="glass-panel hover:shadow-lg transition-all duration-300 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Clock className="h-16 w-16 text-success" />
          </div>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">平均处理时长</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold font-mono text-foreground">5.2 <span className="text-xl font-normal text-muted-foreground font-sans">天</span></div>
            <p className="text-sm text-muted-foreground mt-2 flex items-center gap-1">
              <span className="text-success flex items-center bg-success/10 px-1.5 py-0.5 rounded text-xs font-medium"><TrendingDown className="h-3 w-3 mr-1" /> 0.8天</span> 
              <span>较上期</span>
            </p>
          </CardContent>
        </Card>
        
        <Card className="glass-panel hover:shadow-lg transition-all duration-300 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <CheckCircle2 className="h-16 w-16 text-primary" />
          </div>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">按期关闭率</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold font-mono text-foreground">86%</div>
            <p className="text-sm text-muted-foreground mt-2 flex items-center gap-1">
              <span className="text-success flex items-center bg-success/10 px-1.5 py-0.5 rounded text-xs font-medium"><TrendingUp className="h-3 w-3 mr-1" /> 4%</span> 
              <span>较上期</span>
            </p>
          </CardContent>
        </Card>
        
        <Card className="glass-panel hover:shadow-lg transition-all duration-300 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <FileText className="h-16 w-16 text-blue-500" />
          </div>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">8D 报告生成率</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold font-mono text-foreground">92%</div>
            <p className="text-sm text-muted-foreground mt-2 flex items-center gap-1">
              <span className="bg-blue-500/10 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded text-xs font-medium whitespace-nowrap">严重问题 100% 覆盖</span>
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <Card className="glass-panel hover:shadow-lg transition-all duration-300">
          <CardHeader className="border-b border-border/50 pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <PieChartIcon className="h-5 w-5 text-primary" />
              问题状态分布
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[350px] pt-6">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={120}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} className="hover:opacity-80 transition-opacity cursor-pointer stroke-background stroke-2" />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)', backgroundColor: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(8px)' }} 
                  itemStyle={{ color: '#1e293b', fontWeight: 500 }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="glass-panel hover:shadow-lg transition-all duration-300">
          <CardHeader className="border-b border-border/50 pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Activity className="h-5 w-5 text-primary" />
              问题新增与解决趋势
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[350px] pt-6">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.5} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))' }} dx={-10} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)', backgroundColor: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(8px)' }} 
                />
                <Legend wrapperStyle={{ paddingTop: '20px' }} />
                <Line type="monotone" dataKey="新增" stroke="#ef4444" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6, strokeWidth: 0 }} />
                <Line type="monotone" dataKey="解决" stroke="#10b981" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6, strokeWidth: 0 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="md:col-span-2 glass-panel hover:shadow-lg transition-all duration-300">
          <CardHeader className="border-b border-border/50 pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <BarChart3 className="h-5 w-5 text-primary" />
              按产品分类问题统计
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[400px] pt-6">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={productData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }} barSize={40}>
                <defs>
                  <linearGradient id="colorProduct" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3388cd" stopOpacity={0.9}/>
                    <stop offset="95%" stopColor="#003F7A" stopOpacity={0.9}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.5} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))' }} dx={-10} />
                <Tooltip 
                  cursor={{ fill: 'rgba(0, 63, 122, 0.05)' }} 
                  contentStyle={{ borderRadius: '12px', border: '1px solid rgba(0,0,0,0.05)', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)', backgroundColor: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(8px)' }} 
                />
                <Bar dataKey="问题数" fill="url(#colorProduct)" radius={[6, 6, 0, 0]} className="hover:opacity-80 transition-opacity cursor-pointer">
                  <LabelList dataKey="问题数" position="top" fill="#3388cd" fontSize={12} fontWeight={600} offset={10} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
