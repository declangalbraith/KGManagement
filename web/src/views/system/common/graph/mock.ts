/** 图谱构建器演示用节点类型（与 KGtestV2 SPG 无关） */
export type BuilderGraphNodeType =
	| 'Project'
	| 'Product'
	| 'Issue'
	| 'Component'
	| 'Cause'
	| 'Solution'
	| 'QualityDoc';

export const graphTypeConfig: Record<BuilderGraphNodeType, { color: string; label: string; icon: string }> = {
	Project: { color: '#a855f7', label: '项目', icon: '🏢' },
	Product: { color: '#06b6d4', label: '产品', icon: '🚆' },
	Issue: { color: '#ef4444', label: '问题', icon: '⚠' },
	Component: { color: '#3b82f6', label: '组件', icon: '⚙' },
	Cause: { color: '#f59e0b', label: '原因', icon: '🔍' },
	Solution: { color: '#10b981', label: '解决方案', icon: '✓' },
	QualityDoc: { color: '#4f46e5', label: '质量文档', icon: '📄' },
};

export const graphChatWelcome =
	'您好！我是图谱智能助手。您可以提问已入库的质量报告相关问题，例如复兴号干燥器故障（5228）或佛山3号线制动不缓解调查结论。';
