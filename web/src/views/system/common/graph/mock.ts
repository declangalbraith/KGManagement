import type { GraphLink, GraphNode } from './types';

export const rawGraphNodes: GraphNode[] = [
	{ id: 'PROJ-A', group: 5, label: '地铁1号线', type: 'Project' },
	{ id: 'PROJ-B', group: 5, label: '高铁CRH380', type: 'Project' },
	{ id: 'PROD-X', group: 6, label: 'A型车', type: 'Product' },
	{ id: 'PROD-Y', group: 6, label: '动车组', type: 'Product' },
	{ id: 'COMP-001', group: 2, label: '闸瓦', type: 'Component' },
	{ id: 'COMP-002', group: 2, label: '制动盘', type: 'Component' },
	{ id: 'COMP-003', group: 2, label: '制动夹钳', type: 'Component' },
	{ id: 'ISS-001', group: 1, label: '制动盘异常磨损', type: 'Issue', occurrences: 12 },
	{ id: 'ISS-002', group: 1, label: '制动盘偏磨异响', type: 'Issue', occurrences: 5 },
	{ id: 'CAUSE-001', group: 3, label: '材质过硬', type: 'Cause', confidence: 0.92 },
	{ id: 'CAUSE-002', group: 3, label: '配方比例错误', type: 'Cause', confidence: 0.85 },
	{ id: 'SOL-001', group: 4, label: '更新检验规范', type: 'Solution', occurrences: 45 },
	{ id: 'SOL-002', group: 4, label: '隔离退回', type: 'Solution', occurrences: 8 },
	{ id: 'DOC-001', group: 7, label: '制动盘总成 PFMEA', type: 'QualityDoc' },
];

export const rawGraphLinks: GraphLink[] = [
	{ source: 'PROJ-A', target: 'PROD-X', label: '包含' },
	{ source: 'PROJ-B', target: 'PROD-Y', label: '包含' },
	{ source: 'PROD-X', target: 'COMP-001', label: '使用' },
	{ source: 'PROD-X', target: 'COMP-002', label: '使用' },
	{ source: 'COMP-002', target: 'ISS-001', label: '发生' },
	{ source: 'COMP-002', target: 'ISS-002', label: '发生' },
	{ source: 'ISS-001', target: 'CAUSE-001', label: '归因于' },
	{ source: 'CAUSE-001', target: 'CAUSE-002', label: '深层原因' },
	{ source: 'CAUSE-001', target: 'SOL-001', label: '解决措施' },
	{ source: 'CAUSE-002', target: 'SOL-002', label: '解决措施' },
	{ source: 'DOC-001', target: 'COMP-002', label: '关联部件' },
	{ source: 'DOC-001', target: 'ISS-001', label: '预防失效' },
];

export const graphTypeConfig: Record<
	GraphNode['type'],
	{ color: string; label: string; icon: string }
> = {
	Project: { color: '#a855f7', label: '项目', icon: '🏢' },
	Product: { color: '#06b6d4', label: '产品', icon: '🚆' },
	Issue: { color: '#ef4444', label: '问题', icon: '⚠' },
	Component: { color: '#3b82f6', label: '组件', icon: '⚙' },
	Cause: { color: '#f59e0b', label: '原因', icon: '🔍' },
	Solution: { color: '#10b981', label: '解决方案', icon: '✓' },
	QualityDoc: { color: '#4f46e5', label: '质量文档', icon: '📄' },
};
