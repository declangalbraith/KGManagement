export type BomStatus = 'Active' | 'Draft' | 'Archived';
export type IngestStatus = 'Pending' | 'Partial' | 'Complete';
export type BomNodeStatus = 'Ingested' | 'Pending';

export interface BomRecord {
	id: string;
	name: string;
	code: string;
	version: string;
	deviceModel: string;
	productLine: string;
	uploader: string;
	uploadTime: string;
	updateTime: string;
	status: BomStatus;
	ingestStatus: IngestStatus;
}

export interface BomTreeNode {
	id: string;
	name: string;
	code: string;
	level: number;
	spec: string;
	status: BomNodeStatus;
	children?: BomTreeNode[];
}
