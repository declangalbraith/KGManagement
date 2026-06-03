import axios from 'axios';
import { Session, Local } from '/@/utils/storage';
import qs from 'qs';
import type { GraphSubgraphPayload, GraphTypeLegendItem, GraphVizLink, GraphVizNode } from '/@/api/business/kag';

export type { GraphSubgraphPayload, GraphTypeLegendItem, GraphVizLink, GraphVizNode };

interface DvadminEnvelope<T> {
	code?: number;
	data?: T;
	msg?: string;
}

/** dvadmin 成功码为 2000；全局 request 拦截器按 code!==0 会误拒，故 8D 接口单独实例 */
const kgAgentService = axios.create({
	baseURL: import.meta.env.VITE_API_URL,
	timeout: 50000,
	headers: { 'Content-Type': 'application/json' },
	paramsSerializer: {
		serialize(params) {
			return qs.stringify(params, { allowDots: true });
		},
	},
});

kgAgentService.interceptors.request.use((config) => {
	if (Session.get('token')) {
		config.headers.Authorization = `JWT ${Session.get('token')}`;
	}
	const themeConfig = Local.get('themeConfig') as { globalI18n?: string } | null;
	config.headers['Accept-Language'] = themeConfig?.globalI18n || 'zh-cn';
	return config;
});

kgAgentService.interceptors.response.use(
	(response) => response.data,
	(error) => Promise.reject(error)
);

function unwrapDetail<T>(res: DvadminEnvelope<T> | T): T {
	if (res && typeof res === 'object' && 'code' in res && (res as DvadminEnvelope<T>).code === 2000) {
		return (res as DvadminEnvelope<T>).data as T;
	}
	return res as T;
}

function unwrapList<T>(res: DvadminEnvelope<T[]> & { total?: number }): T[] {
	if (res && typeof res === 'object' && 'code' in res && (res as DvadminEnvelope<T[]>).code === 2000) {
		return ((res as DvadminEnvelope<T[]>).data || []) as T[];
	}
	if (Array.isArray(res)) return res;
	return [];
}

export function extractKgAgentError(err: unknown, fallback = '请求失败'): string {
	if (err && typeof err === 'object' && 'response' in err) {
		const data = (err as { response?: { data?: DvadminEnvelope<unknown> } }).response?.data;
		if (data && typeof data === 'object') {
			if (typeof data.msg === 'string' && data.msg) return data.msg;
			const inner = data.data as { trace_id?: string; error_code?: string } | undefined;
			if (inner && typeof inner === 'object' && 'trace_id' in inner) {
				return `${data.msg || fallback} (trace: ${inner.trace_id})`;
			}
		}
	}
	if (err instanceof Error && err.message) return err.message;
	return fallback;
}

function parseEnvelope<T>(res: unknown): T {
	if (res && typeof res === 'object' && 'code' in res) {
		const envelope = res as DvadminEnvelope<T>;
		if (envelope.code === 2000) {
			return envelope.data as T;
		}
		throw new Error(envelope.msg || '请求失败');
	}
	return res as T;
}

async function kgRequest<T>(config: Parameters<typeof kgAgentService>[0]): Promise<T> {
	try {
		const res = await kgAgentService(config);
		return parseEnvelope<T>(res);
	} catch (err) {
		throw new Error(extractKgAgentError(err));
	}
}

async function kgRequestList<T>(config: Parameters<typeof kgAgentService>[0]): Promise<T[]> {
	try {
		const res = await kgAgentService(config);
		if (res && typeof res === 'object' && 'code' in res) {
			const envelope = res as DvadminEnvelope<T[]>;
			if (envelope.code === 2000) {
				return (envelope.data || []) as T[];
			}
			throw new Error(envelope.msg || '请求失败');
		}
		if (Array.isArray(res)) return res as T[];
		return [];
	} catch (err) {
		throw new Error(extractKgAgentError(err));
	}
}

export interface KgBuildJobItem {
	id: number;
	doc_id: string;
	run_id: string;
	trace_id: string;
	source_record_id: string;
	status: string;
	current_stage: string;
	file_name: string;
	error_message?: string;
	stats?: Record<string, unknown>;
	create_datetime?: string;
}

export interface KgBuildUploadResponse {
	job_id: number;
	doc_id: string;
	run_id: string;
	status: string;
	source_record_id: string;
}

export interface KgBuildStatusResponse {
	job_id: number;
	doc_id: string;
	run_id: string;
	status: string;
	current_stage: string;
	trace_id: string;
	error: string | null;
	finished_at: string | null;
}

export interface KgBuildResultResponse {
	job_id: number;
	doc_id: string;
	subgraph: GraphSubgraphPayload;
	stats: { nodeCount: number; edgeCount: number; [key: string]: unknown };
}

const KG_BUILD_TIMEOUT_MS = 300000;
const KG_POLL_TIMEOUT_MS = 60000;

export function kgBuildUpload(options: {
	file?: File;
	content?: string;
	title?: string;
}): Promise<KgBuildUploadResponse> {
	const { file, content, title } = options;
	if (file) {
		const form = new FormData();
		form.append('file', file);
		if (title) form.append('title', title);
		return kgRequest<KgBuildUploadResponse>({
			url: '/api/kg-agent/build/upload/',
			method: 'post',
			timeout: KG_BUILD_TIMEOUT_MS,
			data: form,
			headers: { 'Content-Type': 'multipart/form-data' },
		});
	}
	return kgRequest<KgBuildUploadResponse>({
		url: '/api/kg-agent/build/upload/',
		method: 'post',
		timeout: KG_BUILD_TIMEOUT_MS,
		data: { content, ...(title ? { title } : {}) },
	});
}

export function kgBuildPollStatus(jobId: number): Promise<KgBuildStatusResponse> {
	return kgRequest<KgBuildStatusResponse>({
		url: `/api/kg-agent/build/${jobId}/status/`,
		method: 'get',
		timeout: KG_POLL_TIMEOUT_MS,
	});
}

export function kgBuildResult(jobId: number): Promise<KgBuildResultResponse> {
	return kgRequest<KgBuildResultResponse>({
		url: `/api/kg-agent/build/${jobId}/result/`,
		method: 'get',
		timeout: KG_BUILD_TIMEOUT_MS,
	});
}

export function kgBuildList(params?: { status?: string; limit?: number }): Promise<KgBuildJobItem[]> {
	return kgRequestList<KgBuildJobItem>({
		url: '/api/kg-agent/build/',
		method: 'get',
		timeout: KG_POLL_TIMEOUT_MS,
		params: {
			status: params?.status,
			limit: params?.limit ?? 50,
			page: 1,
		},
	});
}

export interface KgGraphOverviewMeta {
	mergedDocCount?: number;
}

export function kgFetchGraphOverview(
	options?: { limit?: number; maxDocs?: number },
): Promise<GraphSubgraphPayload & KgGraphOverviewMeta> {
	return kgRequest<{
		subgraph: GraphSubgraphPayload;
		stats?: { nodeCount: number; edgeCount: number; mergedDocCount?: number };
	}>({
		url: '/api/kg-agent/graph/overview/',
		method: 'get',
		timeout: KG_BUILD_TIMEOUT_MS,
		params: {
			limit: options?.limit ?? 80,
			max_docs: options?.maxDocs ?? 20,
		},
	}).then((data) => {
		const sg = data.subgraph;
		return {
			nodes: sg?.nodes || [],
			links: sg?.links || [],
			typeLegend: sg?.typeLegend,
			truncated: sg?.truncated,
			source: sg?.source,
			mergedDocCount: data.stats?.mergedDocCount,
		};
	});
}

export function kgFetchGraph(params: { docId?: string; jobId?: number }): Promise<GraphSubgraphPayload> {
	const query: Record<string, string | number> = {};
	if (params.docId) query.doc_id = params.docId;
	if (params.jobId != null) query.job_id = params.jobId;
	return kgRequest<GraphSubgraphPayload & { doc_id?: string }>({
		url: '/api/kg-agent/graph/',
		method: 'get',
		timeout: KG_BUILD_TIMEOUT_MS,
		params: query,
	}).then((data) => {
		const { doc_id: _docId, nodes, links, typeLegend, truncated, source } = data;
		return { nodes: nodes || [], links: links || [], typeLegend, truncated, source };
	});
}

const TERMINAL_STATUSES = new Set([
	'success',
	'partial_success',
	'failed',
	'succeeded',
	'committed',
	'completed',
]);

export async function kgBuildUploadAndWait(
	options: { file?: File; content?: string; title?: string },
	poll: { intervalMs?: number; maxAttempts?: number } = {}
): Promise<{ job: KgBuildUploadResponse; status: KgBuildStatusResponse; result?: KgBuildResultResponse }> {
	const intervalMs = poll.intervalMs ?? 3000;
	const maxAttempts = poll.maxAttempts ?? 120;
	const job = await kgBuildUpload(options);
	let status = await kgBuildPollStatus(job.job_id);
	let attempts = 0;
	while (!TERMINAL_STATUSES.has(status.status) && attempts < maxAttempts) {
		await new Promise((r) => setTimeout(r, intervalMs));
		status = await kgBuildPollStatus(job.job_id);
		attempts += 1;
	}
	if (!TERMINAL_STATUSES.has(status.status)) {
		throw new Error('构建超时，请稍后在任务列表中查看状态');
	}
	const normalized = status.status?.toLowerCase?.() || status.status;
	if (normalized === 'failed') {
		throw new Error(status.error || '8D 构建失败');
	}
	const result = await kgBuildResult(job.job_id);
	return { job, status, result };
}
