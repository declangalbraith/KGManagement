import type { QualityDocItem } from './types';

export const mockQualityDocs: QualityDocItem[] = [
	{
		id: 'doc-001',
		uniqueId: 'QD-2026-0001',
		fileType: 'PFMEA',
		name: '制动盘总成 PFMEA',
		docNumber: 'FMEA-BRK-001',
		description: '针对新型制动盘总成的潜在失效模式及后果分析',
		owner: '张三',
		department: '质量工程部',
		version: 'V1.0',
		status: 'APPROVED',
		creatorName: '李四',
		createDate: '2026-04-10',
		updateDate: '2026/4/12',
		isArchived: false,
		isDeleted: false,
		projectName: '制动系统质量改进',
		attachments: [
			{ id: 'att-1', name: 'PFMEA_Brake_Disc_v1.pdf', size: 245000, uploadDate: '2026-04-11' },
		],
		related: [
			{ id: 'k3', title: '制动盘磨损失效模式库', tag: '技术文档', tagClass: 'tech', match: 92 },
		],
		auditLogs: [
			{ id: 'l1', operatorName: '李四', action: 'CREATE', timestamp: '2026-04-10T10:00:00' },
			{ id: 'l2', operatorName: '李四', action: 'SUBMIT', timestamp: '2026-04-11T14:30:00' },
			{ id: 'l3', operatorName: '王五', action: 'APPROVE', timestamp: '2026-04-12T09:15:00' },
		],
	},
	{
		id: 'doc-002',
		uniqueId: 'QD-2026-0002',
		fileType: '巡检记录',
		name: '地铁1号线转向架巡检',
		docNumber: 'INSP-202604-001',
		projectName: '地铁1号线',
		description: '',
		owner: '赵六',
		department: '生产现场质量',
		version: 'V1.0',
		status: 'DRAFT',
		creatorName: '赵六',
		createDate: '2026-04-15',
		updateDate: '2026/4/15',
		isArchived: false,
		isDeleted: false,
		attachments: [],
		related: [
			{ id: 'k1', title: '制动盘表面异常磨损的根因分析与解决案例', tag: '历史案例', tagClass: 'case', match: 95 },
			{ id: 'k2', title: '制动系统标准操作规程 (SOP) v2.0', tag: '技术文档', tagClass: 'tech', match: 88 },
		],
		auditLogs: [
			{ id: 'l1', operatorName: '赵六', action: 'CREATE', timestamp: '2026-04-15T09:00:00', details: '创建了初始草稿' },
		],
	},
	{
		id: 'doc-003',
		uniqueId: 'QD-2025-0088',
		fileType: 'SOP',
		name: '制动系统装配标准作业程序',
		docNumber: 'SOP-BRK-088',
		owner: '王工',
		department: '生产部',
		version: 'V2.1',
		status: 'APPROVED',
		creatorName: '王工',
		createDate: '2025-11-20',
		updateDate: '2025/12/1',
		isArchived: true,
		isDeleted: false,
	},
];

export function docById(id: string) {
	return mockQualityDocs.find((d) => d.id === id);
}
