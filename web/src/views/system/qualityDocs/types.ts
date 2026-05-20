export type DocStatus = 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED';
export type DocViewMode = 'active' | 'archived' | 'deleted';

export interface QualityDocItem {
	id: string;
	uniqueId: string;
	fileType: string;
	name: string;
	docNumber: string;
	description?: string;
	owner: string;
	department: string;
	version: string;
	status: DocStatus;
	creatorName: string;
	createDate: string;
	updateDate: string;
	isArchived?: boolean;
	isDeleted?: boolean;
}
