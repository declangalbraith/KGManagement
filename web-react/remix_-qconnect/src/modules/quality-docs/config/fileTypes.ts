export const FILE_TYPES = [
  'PFMEA',
  'Control Plan',
  'C Part Checklist',
  'Process Checklist',
  'Final Checklist',
  '目视控制计划',
  'WI/SOP',
  'QMP',
  'Inspection and Test Acceptance Plan',
  'FAI报告',
  '巡检记录',
  '终检记录',
  '8D report'
] as const;

export type FileType = typeof FILE_TYPES[number];

export interface FileTypeRule {
  type: FileType;
  attachmentRule: 'SINGLE' | 'MULTIPLE' | 'OPTIONAL';
  requiresApproval: boolean;
  requiresVersioning: boolean;
  requiredFields: string[];
  optionalFields: string[];
}

// 预定义字段池
export const FIELD_POOL = {
  name: { label: '文件名称', type: 'text' },
  docNumber: { label: '文件编号', type: 'text' },
  description: { label: '文件描述', type: 'textarea' },
  docCategory: { label: '文档类型', type: 'text' },
  productionType: { label: '适用的生产类型', type: 'select', options: ['新造', '大修', '整改', '返工'] },
  productCategory1: { label: '产品类别1', type: 'select', options: ['AS', 'BC', 'BE'] },
  productCategory2: { label: '产品类别2', type: 'text' },
  owner: { label: 'Owner', type: 'text' },
  department: { label: '部门', type: 'text' },
  projectName: { label: '项目名称', type: 'text' },
  workOrder: { label: '工单号', type: 'text' },
  trainSequence: { label: '列次', type: 'text' },
  applicablePartNumbers: { label: '适用的料号', type: 'multi-select' },
  applicableGTL: { label: '适用的GTL', type: 'multi-select' },
  applicableRouting: { label: '适用的Routing', type: 'multi-select' },
  applicableProjects: { label: '适用的项目号', type: 'multi-select' },
  applicableLines: { label: '适用的产线', type: 'multi-select' },
};

export const FILE_TYPE_CONFIGS: Record<FileType, FileTypeRule> = {
  'PFMEA': {
    type: 'PFMEA',
    attachmentRule: 'SINGLE',
    requiresApproval: true,
    requiresVersioning: true,
    requiredFields: ['name', 'docNumber', 'owner', 'department'],
    optionalFields: ['description', 'applicablePartNumbers']
  },
  'Control Plan': {
    type: 'Control Plan',
    attachmentRule: 'SINGLE',
    requiresApproval: true,
    requiresVersioning: true,
    requiredFields: ['name', 'docNumber', 'owner', 'department'],
    optionalFields: ['description', 'applicablePartNumbers']
  },
  'C Part Checklist': {
    type: 'C Part Checklist',
    attachmentRule: 'SINGLE',
    requiresApproval: true,
    requiresVersioning: true,
    requiredFields: ['name', 'docNumber', 'owner'],
    optionalFields: ['description']
  },
  'Process Checklist': {
    type: 'Process Checklist',
    attachmentRule: 'SINGLE',
    requiresApproval: true,
    requiresVersioning: true,
    requiredFields: ['name', 'docNumber', 'owner'],
    optionalFields: ['description']
  },
  'Final Checklist': {
    type: 'Final Checklist',
    attachmentRule: 'SINGLE',
    requiresApproval: true,
    requiresVersioning: true,
    requiredFields: ['name', 'docNumber', 'owner'],
    optionalFields: ['description']
  },
  '目视控制计划': {
    type: '目视控制计划',
    attachmentRule: 'SINGLE',
    requiresApproval: false,
    requiresVersioning: false,
    requiredFields: ['name', 'docNumber', 'applicableLines'],
    optionalFields: ['description', 'owner']
  },
  'WI/SOP': {
    type: 'WI/SOP',
    attachmentRule: 'MULTIPLE',
    requiresApproval: true,
    requiresVersioning: true,
    requiredFields: ['name', 'docNumber', 'owner', 'department'],
    optionalFields: ['description', 'productionType']
  },
  'QMP': {
    type: 'QMP',
    attachmentRule: 'SINGLE',
    requiresApproval: false,
    requiresVersioning: false,
    requiredFields: ['name', 'docNumber', 'applicableProjects', 'applicableGTL', 'applicableRouting'],
    optionalFields: ['description', 'owner']
  },
  'Inspection and Test Acceptance Plan': {
    type: 'Inspection and Test Acceptance Plan',
    attachmentRule: 'SINGLE',
    requiresApproval: false,
    requiresVersioning: false,
    requiredFields: ['name', 'docNumber', 'applicableProjects', 'applicableGTL', 'applicableRouting'],
    optionalFields: ['description', 'owner']
  },
  'FAI报告': {
    type: 'FAI报告',
    attachmentRule: 'MULTIPLE',
    requiresApproval: false,
    requiresVersioning: true,
    requiredFields: ['name', 'docNumber', 'projectName'],
    optionalFields: ['description', 'owner']
  },
  '巡检记录': {
    type: '巡检记录',
    attachmentRule: 'OPTIONAL',
    requiresApproval: false,
    requiresVersioning: false,
    requiredFields: ['name', 'projectName', 'workOrder', 'trainSequence'],
    optionalFields: ['description', 'owner']
  },
  '终检记录': {
    type: '终检记录',
    attachmentRule: 'OPTIONAL',
    requiresApproval: false,
    requiresVersioning: false,
    requiredFields: ['name', 'projectName', 'workOrder', 'trainSequence'],
    optionalFields: ['description', 'owner']
  },
  '8D report': {
    type: '8D report',
    attachmentRule: 'MULTIPLE',
    requiresApproval: true,
    requiresVersioning: true,
    requiredFields: ['name', 'docNumber', 'owner', 'department'],
    optionalFields: ['description', 'projectName', 'workOrder']
  }
};
