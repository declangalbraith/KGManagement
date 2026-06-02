import { request } from '/@/utils/service';
import type { SchemaWorkbenchSnapshot } from './types';

const prefix = '/api/schema/';

interface SchemaVersionDetail {
    id: number;
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

export function getCurrentSchema(): Promise<SchemaVersionDetail | null> {
    return request({ url: prefix + 'current/', method: 'get' });
}

export function saveSchemaDraft(description: string, snapshot: SchemaWorkbenchSnapshot): Promise<SchemaVersionDetail> {
    return request({
        url: prefix + 'save/',
        method: 'post',
        data: { description, snapshot },
    });
}

export function publishSchema(): Promise<SchemaVersionDetail> {
    return request({ url: prefix + 'publish/', method: 'post' });
}

export function getVersionList(): Promise<SchemaVersionSummary[]> {
    return request({ url: prefix + 'versions/', method: 'get' });
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

export function exportSchema(): Promise<{ version: string; content: string }> {
    return request({ url: prefix + 'export/', method: 'get' });
}
