import type { KnowledgeCategory, KnowledgeDoc, LatestQualityDoc, RecommendedKnowledge } from './types';

export const knowledgeDocs: KnowledgeDoc[] = [
	{ id: 'doc-1', title: '制动盘异常磨损 8D 结案报告', type: 'Report', category: '质量报告', updatedAt: '2026-04-08', views: 128, rating: 4.8 },
	{ id: 'doc-2', title: '闸瓦安装标准作业指导书', type: 'SOP', category: '工艺文件', updatedAt: '2026-03-20', views: 456, rating: 4.9 },
	{ id: 'doc-3', title: '空压机异响诊断培训视频', type: 'Video', category: '培训资料', updatedAt: '2026-02-15', views: 89, rating: 4.5 },
	{ id: 'doc-4', title: 'KB75 主机 BOM 技术规格书', type: 'PDF', category: '技术文档', updatedAt: '2026-01-10', views: 234, rating: 4.7 },
];

export const hotTopics = ['制动盘磨损', '空压机异响', '8D 报告模板', '5Why 分析法', 'PFMEA 制动系统'];

export const knowledgeCategories: KnowledgeCategory[] = [
	'标准操作规程 (SOP)',
	'历史 8D 报告',
	'常见问题解答 (FAQ)',
	'产品技术文档',
	'培训资料',
];

export const latestQualityDocs: LatestQualityDoc[] = [
	{
		id: 'doc-001',
		tag: 'PFMEA',
		tagClass: 'is-blue',
		title: '制动盘总成 PFMEA V1.0',
		updatedLabel: '2天前更新',
		path: '/document-management/quality/doc-001',
	},
	{
		id: 'doc-002',
		tag: '巡检记录',
		tagClass: 'is-green',
		title: '地铁1号线转向架巡检',
		updatedLabel: '刚刚更新',
		path: '/document-management/quality/doc-002',
	},
];

export const recommendedKnowledge: RecommendedKnowledge[] = [
	{
		id: 'rec-1',
		tag: '历史案例',
		tagClass: 'is-blue',
		title: '制动盘表面异常磨损的根因分析与解决案例 (ISS-202408-012)',
		summary:
			'本文档详细记录了 2024 年 8 月发生的制动盘异常磨损问题的处理过程，包含完整的 5Why 分析和最终的纠正预防措施。',
		author: '张三',
		authorInitial: '张',
		date: '2024-09-15',
		views: '1.2k',
		rating: 4.8,
	},
	{
		id: 'rec-2',
		tag: '技术文档',
		tagClass: 'is-green',
		title: '知识条目标题示例 2',
		summary:
			'本文档详细记录了 2024 年 8 月发生的制动盘异常磨损问题的处理过程，包含完整的 5Why 分析和最终的纠正预防措施。',
		author: '张三',
		authorInitial: '张',
		date: '2024-09-15',
		views: '1.2k',
		rating: 4.8,
	},
	{
		id: 'rec-3',
		tag: '受控文档',
		tagClass: 'is-blue',
		title: '制动盘总成 PFMEA (FMEA-BRK-001)',
		summary: '针对新型制动盘总成的潜在失效模式及后果分析，已关联最新 8D 报告中的纠正措施。',
		author: '张三',
		authorInitial: '张',
		date: '2024-09-15',
		views: '1.2k',
		rating: 4.8,
	},
	{
		id: 'rec-4',
		tag: '技术文档',
		tagClass: 'is-green',
		title: '知识条目标题示例 4',
		summary:
			'本文档详细记录了 2024 年 8 月发生的制动盘异常磨损问题的处理过程，包含完整的 5Why 分析和最终的纠正预防措施。',
		author: '张三',
		authorInitial: '张',
		date: '2024-09-15',
		views: '1.2k',
		rating: 4.8,
	},
];
