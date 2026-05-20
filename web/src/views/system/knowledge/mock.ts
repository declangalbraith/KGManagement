import type { KnowledgeDoc } from './types';

export const knowledgeDocs: KnowledgeDoc[] = [
	{ id: 'doc-1', title: '制动盘异常磨损 8D 结案报告', type: 'Report', category: '质量报告', updatedAt: '2026-04-08', views: 128, rating: 4.8 },
	{ id: 'doc-2', title: '闸瓦安装标准作业指导书', type: 'SOP', category: '工艺文件', updatedAt: '2026-03-20', views: 456, rating: 4.9 },
	{ id: 'doc-3', title: '空压机异响诊断培训视频', type: 'Video', category: '培训资料', updatedAt: '2026-02-15', views: 89, rating: 4.5 },
	{ id: 'doc-4', title: 'KB75 主机 BOM 技术规格书', type: 'PDF', category: '技术文档', updatedAt: '2026-01-10', views: 234, rating: 4.7 },
];

export const hotTopics = ['制动盘磨损', '闸瓦硬度', '8D 报告模板', 'BOM 入图规范'];
