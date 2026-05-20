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
		updateDate: '2026-04-12',
	},
	{
		id: 'doc-002',
		uniqueId: 'QD-2026-0002',
		fileType: '巡检记录',
		name: '地铁1号线转向架巡检',
		docNumber: 'INSP-202604-001',
		owner: '赵六',
		department: '生产现场质量',
		version: 'V1.0',
		status: 'DRAFT',
		creatorName: '赵六',
		createDate: '2026-04-15',
		updateDate: '2026-04-15',
	},
];

export function docById(id: string) {
	return mockQualityDocs.find((d) => d.id === id);
}
