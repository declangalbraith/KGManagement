import request from '/@/utils/request';

export type GraphStatus = 'pending' | 'extracted';

export interface BomDocument {
	id: number;
	number: string;
	state: string;
	type_designation: string;
	description_en: string;
	uploader: string;
	graph_status: GraphStatus;
	graph_status_display: string;
	minio_path: string;
	original_filename: string;
	file_type: string;
	file_size: number;
	upload_time: string;
	create_datetime: string;
	update_datetime: string;
}

const BOM_UPLOAD_TIMEOUT_MS = 120000;

export function fetchBomList(search?: string): Promise<BomDocument[]> {
	return request({
		url: '/api/doc-manage/bom/',
		method: 'get',
		params: search ? { search } : undefined,
	}) as Promise<BomDocument[]>;
}

export function uploadBomFile(file: File): Promise<BomDocument> {
	const form = new FormData();
	form.append('file', file);
	return request({
		url: '/api/doc-manage/bom/',
		method: 'post',
		timeout: BOM_UPLOAD_TIMEOUT_MS,
		data: form,
		headers: { 'Content-Type': 'multipart/form-data' },
	}) as Promise<BomDocument>;
}

export function patchBomGraphStatus(id: number, graph_status: GraphStatus): Promise<BomDocument> {
	return request({
		url: `/api/doc-manage/bom/${id}/`,
		method: 'patch',
		data: { graph_status },
	}) as Promise<BomDocument>;
}

export function deleteBomDocument(id: number): Promise<void> {
	return request({
		url: `/api/doc-manage/bom/${id}/`,
		method: 'delete',
	}) as Promise<void>;
}

export async function downloadBomDocument(id: number, filename: string): Promise<void> {
	const baseURL = import.meta.env.VITE_API_URL as string;
	const { Session } = await import('/@/utils/storage');
	const token = Session.get('token');
	const response = await fetch(`${baseURL}/api/doc-manage/bom/${id}/download/`, {
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
