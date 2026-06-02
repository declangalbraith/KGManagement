export type GraphStatus = 'pending' | 'extracted';

export interface BomRecord {
	id: number;
	number: string;
	state: string;
	type_designation: string;
	description_en: string;
	uploader: string;
	upload_time: string;
	graph_status: GraphStatus;
	original_filename: string;
}

export type BomNodeStatus = 'Ingested' | 'Pending';

export interface BomTreeNode {
	id: string;
	name: string;
	code: string;
	level: number;
	spec: string;
	status: BomNodeStatus;
	children?: BomTreeNode[];
}
