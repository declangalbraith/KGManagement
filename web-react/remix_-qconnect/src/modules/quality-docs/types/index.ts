export type DocStatus = 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'RELEASED' | 'OBSOLETE';

export interface QualityDoc {
  id: string;
  uniqueId: string; // 系统生成的唯一编号
  fileType: string; // PFMEA, Control Plan, etc.
  name: string;
  docNumber: string;
  description?: string;
  docCategory?: string; // 文档类型
  productionType?: string; // 新造 / 大修 / 整改 / 返工
  productCategory1?: string; // AS / BC / BE
  productCategory2?: string;
  owner: string;
  department: string;
  projectName?: string;
  workOrder?: string; // 工单号
  trainSequence?: string; // 列次
  
  // Arrays for multi-select
  applicablePartNumbers: string[];
  applicableGTL: string[];
  applicableRouting: string[];
  applicableProjects: string[];
  applicableLines: string[];
  
  version: string;
  isLatest: boolean;
  status: DocStatus;
  
  // Checkout system
  isCheckedOut?: boolean;
  checkedOutBy?: string;
  checkedOutAt?: string;
  
  // Archive & Delete system
  isArchived?: boolean;
  isDeleted?: boolean;
  
  creatorId: string;
  creatorName: string;
  createDate: string;
  updateDate: string;
  approverId?: string;
  approverName?: string;
  approveDate?: string;

  attachments: DocAttachment[];
}

export interface DocAttachment {
  id: string;
  name: string;
  url?: string;
  size: number;
  uploadDate: string;
}

export interface AuditLog {
  id: string;
  docId: string;
  action: 'CREATE' | 'UPDATE' | 'SUBMIT' | 'APPROVE' | 'REJECT' | 'RELEASE' | 'OBSOLETE' | 'CHECK_OUT' | 'CHECK_IN' | 'CANCEL_CHECK_OUT' | 'ARCHIVE' | 'RESTORE_ARCHIVE' | 'DELETE' | 'RESTORE_DELETE';
  operatorId: string;
  operatorName: string;
  timestamp: string;
  details?: string;
}
