export type ApprovalStatus = 'draft' | 'pending' | 'approved';

export interface GeneralDocListItem {
	id: number;
	name: string;
	doc_type_id: number;
	doc_type_name: string;
	version: string;
	approval_status: ApprovalStatus;
	uploader: string;
	update_datetime: string;
	original_filename: string;
	can_trigger_workflow: boolean;
}
