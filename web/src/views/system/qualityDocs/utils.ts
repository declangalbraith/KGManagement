import type { DocStatus, QualityDocItem } from './types';

export type DocDisplayStatus = DocStatus | 'ARCHIVED' | 'DELETED';

export function getDocDisplayStatus(doc: QualityDocItem): DocDisplayStatus {
	if (doc.isDeleted) return 'DELETED';
	if (doc.isArchived) return 'ARCHIVED';
	return doc.status;
}
