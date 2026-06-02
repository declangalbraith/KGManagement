import { request } from '/@/utils/service';
import type { SchemaWorkbenchSnapshot } from './types';

const prefix = '/api/schema/';

function unwrapData<T>(res: T | { data: T; code?: number }): T {
	if (res && typeof res === 'object' && 'data' in res && 'code' in res) {
		return (res as { data: T }).data;
	}
	return res as T;
}

export interface SchemaProjectItem {
	id: number;
	name: string;
	display_name: string;
	description: string;
	init_schema_path: string;
	create_datetime: string;
	update_datetime: string;
}

interface SchemaVersionDetail {
	id: number;
	project_id: number;
	version: string;
	status: 'draft' | 'published';
	is_current: boolean;
	description: string;
	author: string;
	snapshot: SchemaWorkbenchSnapshot;
	create_datetime: string;
	update_datetime: string;
}

interface SchemaVersionSummary {
	id: number;
	project_id: number;
	version: string;
	status: 'draft' | 'published';
	is_current: boolean;
	description: string;
	author: string;
	create_datetime: string;
	update_datetime: string;
}

interface SchemaImportResult {
	snapshot: SchemaWorkbenchSnapshot;
	stats: {
		namespace: string;
		entities: number;
		relations: number;
		properties: number;
		constraint: number;
		indexCount: number;
	};
}

export async function listSchemaProjects(): Promise<SchemaProjectItem[]> {
	const res = await request({ url: prefix + 'projects/', method: 'get' });
	const data = unwrapData<SchemaProjectItem[]>(res);
	return Array.isArray(data) ? data : [];
}

export async function createSchemaProject(data: {
	name: string;
	display_name?: string;
	description?: string;
	init_schema_path?: string;
}): Promise<SchemaProjectItem> {
	const res = await request({ url: prefix + 'projects/', method: 'post', data });
	return unwrapData<SchemaProjectItem>(res);
}

export function getCurrentSchema(projectId: number): Promise<SchemaVersionDetail | null> {
	return request({ url: prefix + 'current/', method: 'get', params: { project_id: projectId } });
}

export function saveSchemaDraft(
	projectId: number,
	description: string,
	snapshot: SchemaWorkbenchSnapshot
): Promise<SchemaVersionDetail> {
	return request({
		url: prefix + 'save/',
		method: 'post',
		data: { project_id: projectId, description, snapshot },
	});
}

export function publishSchema(projectId: number): Promise<SchemaVersionDetail> {
	return request({ url: prefix + 'publish/', method: 'post', data: { project_id: projectId } });
}

export function getVersionList(projectId: number): Promise<SchemaVersionSummary[]> {
	return request({ url: prefix + 'versions/', method: 'get', params: { project_id: projectId } });
}

export function getVersionDetail(id: number): Promise<SchemaVersionDetail> {
	return request({ url: prefix + `versions/${id}/`, method: 'get' });
}

export function importSchemaFile(file: File): Promise<SchemaImportResult> {
	const formData = new FormData();
	formData.append('file', file);
	return request({
		url: prefix + 'import/',
		method: 'post',
		data: formData,
		headers: { 'Content-Type': 'multipart/form-data' },
	});
}

export function exportSchema(projectId: number): Promise<{ version: string; content: string }> {
	return request({ url: prefix + 'export/', method: 'get', params: { project_id: projectId } });
}
