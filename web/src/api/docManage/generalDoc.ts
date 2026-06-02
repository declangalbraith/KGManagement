import request from '/@/utils/request';

export type ApprovalStatus = 'draft' | 'pending' | 'approved';

export interface DocumentType {
	id: number;
	code: string;
	name: string;
	sort_order: number;
	is_active: boolean;
}

export interface GeneralDocument {
	id: number;
	name: string;
	doc_type_id: number;
	doc_type_name: string;
	doc_type_code: string;
	version: string;
	approval_status: ApprovalStatus;
	approval_status_display: string;
	file_description: string;
	approver: string;
	uploader: string;
	minio_path: string;
	original_filename: string;
	file_ext: string;
	file_size: number;
	create_datetime: string;
	update_datetime: string;
}

const GENERAL_DOC_UPLOAD_TIMEOUT_MS = 120000;

export function fetchDocumentTypes(): Promise<DocumentType[]> {
	return request({
		url: '/api/doc-manage/document-types/',
		method: 'get',
	}) as Promise<DocumentType[]>;
}

export function fetchGeneralDocList(search?: string): Promise<GeneralDocument[]> {
	return request({
		url: '/api/doc-manage/general-doc/',
		method: 'get',
		params: search ? { search } : undefined,
	}) as Promise<GeneralDocument[]>;
}

export function fetchGeneralDoc(id: number): Promise<GeneralDocument> {
	return request({
		url: `/api/doc-manage/general-doc/${id}/`,
		method: 'get',
	}) as Promise<GeneralDocument>;
}

export function uploadGeneralDocument(
	file: File,
	payload: { doc_type_id: number; description?: string; approver?: string }
): Promise<GeneralDocument> {
	const form = new FormData();
	form.append('file', file);
	form.append('doc_type_id', String(payload.doc_type_id));
	if (payload.description) form.append('description', payload.description);
	if (payload.approver) form.append('approver', payload.approver);
	return request({
		url: '/api/doc-manage/general-doc/',
		method: 'post',
		timeout: GENERAL_DOC_UPLOAD_TIMEOUT_MS,
		data: form,
		headers: { 'Content-Type': 'multipart/form-data' },
	}) as Promise<GeneralDocument>;
}

export function deleteGeneralDocument(id: number): Promise<void> {
	return request({
		url: `/api/doc-manage/general-doc/${id}/`,
		method: 'delete',
	}) as Promise<void>;
}

export async function downloadGeneralDocument(id: number, filename: string): Promise<void> {
	const baseURL = import.meta.env.VITE_API_URL as string;
	const { Session } = await import('/@/utils/storage');
	const token = Session.get('token');
	const response = await fetch(`${baseURL}/api/doc-manage/general-doc/${id}/download/`, {
		headers: token ? { Authorization: `JWT ${token}` } : {},
	});
	if (!response.ok) {
		throw new Error('download failed');
	}
	const blob = await response.blob();
	const url = URL.createObjectURL(blob);
	const link = document.createElement('a');
	link.href = url;
	link.download = filename;
	link.click();
	URL.revokeObjectURL(url);
}
