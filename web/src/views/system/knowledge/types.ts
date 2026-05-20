export interface KnowledgeDoc {
	id: string;
	title: string;
	type: 'PDF' | 'SOP' | 'Video' | 'Report';
	category: string;
	updatedAt: string;
	views: number;
	rating: number;
}
