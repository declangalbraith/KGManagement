import request from '/@/utils/request';
import type { WorkflowAuditLog } from '/@/api/workflow/index';

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
	version_label: string;
	approval_status: ApprovalStatus;
	approval_status_display: string;
	file_description: string;
	approver: string;
	uploader: string;
	workflow_definition_id: number | null;
	workflow_definition_name: string | null;
	can_trigger_workflow: boolean;
	pending_task_id: number | null;
	current_assignee_name: string;
	minio_path: string;
	original_filename: string;
	file_ext: string;
	file_size: number;
	create_datetime: string;
	update_datetime: string;
}

export interface GeneralDocumentVersion {
	id: number;
	version_label: string;
	version: string;
	original_filename: string;
	file_ext: string;
	file_size: number;
	uploader: string;
	create_datetime: string;
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
	payload: { doc_type_id: number; description?: string; workflow_definition_id?: number | null }
): Promise<GeneralDocument> {
	const form = new FormData();
	form.append('file', file);
	form.append('doc_type_id', String(payload.doc_type_id));
	if (payload.description) form.append('description', payload.description);
	if (payload.workflow_definition_id) {
		form.append('workflow_definition_id', String(payload.workflow_definition_id));
	}
	return request({
		url: '/api/doc-manage/general-doc/',
		method: 'post',
		timeout: GENERAL_DOC_UPLOAD_TIMEOUT_MS,
		data: form,
		headers: { 'Content-Type': 'multipart/form-data' },
	}) as Promise<GeneralDocument>;
}

export function reviseGeneralDocument(
	id: number,
	file: File,
	description?: string
): Promise<GeneralDocument> {
	const form = new FormData();
	form.append('file', file);
	if (description) form.append('description', description);
	return request({
		url: `/api/doc-manage/general-doc/${id}/revise/`,
		method: 'post',
		timeout: GENERAL_DOC_UPLOAD_TIMEOUT_MS,
		data: form,
		headers: { 'Content-Type': 'multipart/form-data' },
	}) as Promise<GeneralDocument>;
}

export function patchGeneralDocument(
	id: number,
	payload: { file_description?: string; workflow_definition_id?: number | null }
): Promise<GeneralDocument> {
	return request({
		url: `/api/doc-manage/general-doc/${id}/`,
		method: 'patch',
		data: payload,
	}) as Promise<GeneralDocument>;
}

export function triggerGeneralDocWorkflow(id: number): Promise<GeneralDocument> {
	return request({
		url: `/api/doc-manage/general-doc/${id}/trigger-workflow/`,
		method: 'post',
	}) as Promise<GeneralDocument>;
}

export function approveGeneralDocument(id: number): Promise<GeneralDocument> {
	return request({
		url: `/api/doc-manage/general-doc/${id}/approve/`,
		method: 'post',
	}) as Promise<GeneralDocument>;
}

export function rejectGeneralDocument(id: number, comment?: string): Promise<GeneralDocument> {
	return request({
		url: `/api/doc-manage/general-doc/${id}/reject/`,
		method: 'post',
		data: { comment: comment || '' },
	}) as Promise<GeneralDocument>;
}

export function fetchGeneralDocVersions(id: number): Promise<GeneralDocumentVersion[]> {
	return request({
		url: `/api/doc-manage/general-doc/${id}/versions/`,
		method: 'get',
	}) as Promise<GeneralDocumentVersion[]>;
}

export function fetchGeneralDocAuditLogs(id: number): Promise<WorkflowAuditLog[]> {
	return request({
		url: `/api/doc-manage/general-doc/${id}/audit-logs/`,
		method: 'get',
	}) as Promise<WorkflowAuditLog[]>;
}

export function deleteGeneralDocument(id: number): Promise<void> {
	return request({
		url: `/api/doc-manage/general-doc/${id}/`,
		method: 'delete',
	}) as Promise<void>;
}

async function authorizedFetch(path: string): Promise<Response> {
	const baseURL = import.meta.env.VITE_API_URL as string;
	const { Session } = await import('/@/utils/storage');
	const token = Session.get('token');
	return fetch(`${baseURL}${path}`, {
		headers: token ? { Authorization: `JWT ${token}` } : {},
	});
}

async function parseErrorDetail(response: Response): Promise<string> {
	try {
		const data = (await response.json()) as { detail?: string };
		return data.detail || '';
	} catch {
		return '';
	}
}

export async function downloadGeneralDocument(id: number, filename: string): Promise<void> {
	const response = await authorizedFetch(`/api/doc-manage/general-doc/${id}/download/`);
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

export interface GeneralDocPreviewHtml {
	format: 'html';
	html: string;
}

/** PDF: binary stream; Word (.docx): JSON with HTML body. */
export async function fetchGeneralDocPreview(
	id: number,
	fileExt: string
): Promise<{ mode: 'pdf'; blob: Blob } | { mode: 'html'; html: string }> {
	const ext = fileExt.toLowerCase().replace(/^\./, '');
	const response = await authorizedFetch(`/api/doc-manage/general-doc/${id}/preview/`);
	if (!response.ok) {
		const detail = await parseErrorDetail(response);
		throw new Error(detail || 'preview failed');
	}
	if (ext === 'pdf') {
		return { mode: 'pdf', blob: await response.blob() };
	}
	const data = (await response.json()) as GeneralDocPreviewHtml;
	return { mode: 'html', html: data.html || '' };
}
