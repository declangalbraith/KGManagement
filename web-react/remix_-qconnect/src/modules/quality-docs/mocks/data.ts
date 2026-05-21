import { QualityDoc, AuditLog } from '../types';

export const MOCK_DOCS: QualityDoc[] = [
  {
    id: 'doc-001',
    uniqueId: 'QD-2026-0001',
    fileType: 'PFMEA',
    name: '制动盘总成 PFMEA',
    docNumber: 'FMEA-BRK-001',
    description: '针对新型制动盘总成的潜在失效模式及后果分析',
    owner: '张三',
    department: '质量工程部',
    applicablePartNumbers: ['PN-1001', 'PN-1002'],
    applicableGTL: [],
    applicableRouting: [],
    applicableProjects: [],
    applicableLines: [],
    version: 'V1.0',
    isLatest: true,
    status: 'APPROVED',
    creatorId: 'u1',
    creatorName: '李四',
    createDate: '2026-04-10T10:00:00Z',
    updateDate: '2026-04-12T14:30:00Z',
    approverId: 'u2',
    approverName: '王五',
    approveDate: '2026-04-12T14:30:00Z',
    attachments: [
      { id: 'att-1', name: 'PFMEA_BRK_001_v1.pdf', url: '#', size: 1024500, uploadDate: '2026-04-10T10:00:00Z' }
    ]
  },
  {
    id: 'doc-002',
    uniqueId: 'QD-2026-0002',
    fileType: '巡检记录',
    name: '地铁1号线转向架巡检',
    docNumber: 'INSP-202604-001',
    projectName: '地铁1号线',
    workOrder: 'WO-2026-8899',
    trainSequence: '01A',
    owner: '赵六',
    department: '生产现场质量',
    applicablePartNumbers: [],
    applicableGTL: [],
    applicableRouting: [],
    applicableProjects: [],
    applicableLines: [],
    version: 'V1.0',
    isLatest: true,
    status: 'DRAFT',
    creatorId: 'u3',
    creatorName: '赵六',
    createDate: '2026-04-15T08:00:00Z',
    updateDate: '2026-04-15T08:00:00Z',
    attachments: []
  }
];

export const MOCK_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'log-1',
    docId: 'doc-001',
    action: 'CREATE',
    operatorId: 'u1',
    operatorName: '李四',
    timestamp: '2026-04-10T10:00:00Z',
    details: '创建了文档草稿'
  },
  {
    id: 'log-2',
    docId: 'doc-001',
    action: 'SUBMIT',
    operatorId: 'u1',
    operatorName: '李四',
    timestamp: '2026-04-11T09:00:00Z',
    details: '提交审批'
  },
  {
    id: 'log-3',
    docId: 'doc-001',
    action: 'APPROVE',
    operatorId: 'u2',
    operatorName: '王五',
    timestamp: '2026-04-12T14:30:00Z',
    details: '审批通过'
  }
];
