export type DocStatus = 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED';
export type DocViewMode = 'active' | 'archived' | 'deleted';

export interface DocAttachment {
	id: string;
	name: string;
	size: number;
	uploadDate: string;
}

export interface DocAuditLog {
	id: string;
	operatorName: string;
	action: string;
	timestamp: string;
	details?: string;
}

export interface RelatedKnowledge {
	id: string;
	title: string;
	tag: string;
	tagClass: 'case' | 'tech';
	match: number;
}

export interface QualityDocItem {
	id: string;
	uniqueId: string;
	fileType: string;
	name: string;
	docNumber: string;
	description?: string;
	projectName?: string;
	owner: string;
	department: string;
	version: string;
	status: DocStatus;
	creatorName: string;
	createDate: string;
	updateDate: string;
	isArchived?: boolean;
	isDeleted?: boolean;
	attachments?: DocAttachment[];
	related?: RelatedKnowledge[];
	auditLogs?: DocAuditLog[];
}
