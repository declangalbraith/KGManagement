export interface KnowledgeDoc {
	id: string;
	title: string;
	type: 'PDF' | 'SOP' | 'Video' | 'Report';
	category: string;
	updatedAt: string;
	views: number;
	rating: number;
}

export type KnowledgeCategory =
	| '标准操作规程 (SOP)'
	| '历史 8D 报告'
	| '常见问题解答 (FAQ)'
	| '产品技术文档'
	| '培训资料';

export interface LatestQualityDoc {
	id: string;
	tag: string;
	tagClass: 'is-blue' | 'is-green';
	title: string;
	updatedLabel: string;
	path: string;
}

export interface RecommendedKnowledge {
	id: string;
	tag: string;
	tagClass: 'is-blue' | 'is-green';
	title: string;
	summary: string;
	author: string;
	authorInitial: string;
	date: string;
	views: string;
	rating: number;
}
