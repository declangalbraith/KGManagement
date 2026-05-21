import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  UploadCloud, 
  Search, 
  Filter, 
  Plus, 
  MoreVertical, 
  FileSpreadsheet,
  Database,
  ChevronRight,
  Eye,
  Edit2,
  Trash2,
  GitMerge,
  Network
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { Card, CardContent } from '@/src/components/ui/card';
import { Badge } from '@/src/components/ui/badge';

interface BomRecord {
  id: string;
  name: string;
  code: string;
  version: string;
  deviceModel: string;
  productLine: string;
  uploader: string;
  uploadTime: string;
  updateTime: string;
  status: 'Active' | 'Draft' | 'Archived';
  ingestStatus: 'Pending' | 'Partial' | 'Complete';
}

const BOM_DATA: BomRecord[] = [
  {
    id: 'bom-001',
    name: '75kW 螺杆空压机主 BOM',
    code: 'BOM-KB75-001',
    version: 'V3.0',
    deviceModel: 'KB 75kW 螺杆空压机',
    productLine: '工业空压机系列',
    uploader: '张工 (系统工程部)',
    uploadTime: '2024-05-18 10:30',
    updateTime: '2024-05-18 14:20',
    status: 'Active',
    ingestStatus: 'Partial'
  },
  {
    id: 'bom-002',
    name: '110kW 变频空压机 BOM',
    code: 'BOM-KB110-002',
    version: 'V1.0',
    deviceModel: 'KB 110kW 变频',
    productLine: '工业空压机系列',
    uploader: '李工 (系统工程部)',
    uploadTime: '2024-05-15 09:15',
    updateTime: '2024-05-15 09:15',
    status: 'Draft',
    ingestStatus: 'Pending'
  },
  {
    id: 'bom-003',
    name: '微油螺杆机标准版 BOM',
    code: 'BOM-KB37-005',
    version: 'V2.1',
    deviceModel: 'KB 37kW 标准版',
    productLine: '微油机系列',
    uploader: '王工 (采购部)',
    uploadTime: '2024-05-10 16:45',
    updateTime: '2024-05-12 11:20',
    status: 'Active',
    ingestStatus: 'Complete'
  }
];

export function BomList() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="flex flex-col h-full bg-background space-y-6 container mx-auto p-6 max-w-7xl">
      {/* Header & Breadcrumb */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center text-sm text-muted-foreground">
          <Database className="w-4 h-4 mr-2" />
          <span>质量系统</span>
          <ChevronRight className="w-4 h-4 mx-1" />
          <span className="font-medium text-foreground">BOM 管理</span>
        </div>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold tracking-tight text-primary-900">BOM 清单管理</h1>
          <Button className="gap-2 bg-primary hover:bg-primary/90">
            <Plus className="w-4 h-4" />
            新建 BOM
          </Button>
        </div>
      </div>

      {/* Upload Region */}
      <Card className="border-dashed border-2 border-border/60 bg-muted/10 shadow-sm hover:bg-muted/20 transition-colors">
        <CardContent className="p-8 flex flex-col items-center justify-center text-center">
          <div className="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-4">
            <UploadCloud className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-medium text-foreground mb-1">拖拽或点击上传 BOM 文件</h3>
          <p className="text-sm text-muted-foreground mb-4">支持 .xlsx, .xls 格式，需符合 Knorr-Bremse 官方标准 BOM 模板结构</p>
          <Button variant="outline" className="gap-2 font-medium">
            <FileSpreadsheet className="w-4 h-4 text-green-600" />
            选择 Excel 文件
          </Button>
        </CardContent>
      </Card>

      {/* List Controls */}
      <div className="flex items-center justify-between mt-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="搜索 BOM 名称、编号或设备..." 
              className="w-80 pl-9 h-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button variant="outline" className="gap-2 h-9">
            <Filter className="w-4 h-4" />
            高级筛选
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="border rounded-md bg-card shadow-sm overflow-hidden text-sm">
        <table className="w-full text-left">
          <thead className="bg-muted/50 border-b text-muted-foreground font-medium text-xs uppercase tracking-wider">
            <tr>
              <th className="px-4 py-3">BOM 名称 / 编号</th>
              <th className="px-4 py-3">版本</th>
              <th className="px-4 py-3">设备 / 产品线</th>
              <th className="px-4 py-3">上传信息</th>
              <th className="px-4 py-3">状态</th>
              <th className="px-4 py-3">图谱状态</th>
              <th className="px-4 py-3 text-right">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {BOM_DATA.map(bom => (
              <tr key={bom.id} className="hover:bg-muted/30 group">
                <td className="px-4 py-3">
                  <div className="font-medium text-primary-900">{bom.name}</div>
                  <div className="text-xs text-muted-foreground font-mono mt-0.5">{bom.code}</div>
                </td>
                <td className="px-4 py-3">
                  <Badge variant="outline" className="font-mono text-xs bg-slate-50">{bom.version}</Badge>
                </td>
                <td className="px-4 py-3">
                  <div className="text-foreground">{bom.deviceModel}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{bom.productLine}</div>
                </td>
                <td className="px-4 py-3">
                  <div className="text-foreground">{bom.uploader}</div>
                  <div className="text-xs text-muted-foreground mt-0.5" title={"更新于 " + bom.updateTime}>{bom.uploadTime}</div>
                </td>
                <td className="px-4 py-3">
                  {bom.status === 'Active' && <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-200">启用中 Active</Badge>}
                  {bom.status === 'Draft' && <Badge variant="outline" className="text-slate-600 bg-slate-50">草稿 Draft</Badge>}
                  {bom.status === 'Archived' && <Badge variant="outline" className="text-muted-foreground bg-gray-50 border-gray-200">已归档</Badge>}
                </td>
                <td className="px-4 py-3">
                  {bom.ingestStatus === 'Complete' && <span className="flex items-center gap-1.5 text-green-600 text-xs font-medium"><div className="w-1.5 h-1.5 rounded-full bg-green-600"/> 已完成</span>}
                  {bom.ingestStatus === 'Partial' && <span className="flex items-center gap-1.5 text-blue-600 text-xs font-medium"><div className="w-1.5 h-1.5 rounded-full bg-blue-600"/> 部分提取</span>}
                  {bom.ingestStatus === 'Pending' && <span className="flex items-center gap-1.5 text-slate-500 text-xs font-medium"><div className="w-1.5 h-1.5 rounded-full bg-slate-400"/> 待提取</span>}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="h-8 gap-1.5 border-primary/20 text-primary hover:bg-primary/5"
                      onClick={() => navigate(`/bom-management/${bom.id}/extract`)}
                    >
                      <Network className="w-3.5 h-3.5" />
                      图谱提取
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-red-600 hover:bg-red-50">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
