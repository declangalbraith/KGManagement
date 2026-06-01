import request from '/@/utils/request';

/** KAG 问答请求可选参数 */
export interface KagAskOptions {
	projectName?: string;
	projectId?: number;
	includeEvidence?: boolean;
	includeGraph?: boolean;
}

export interface GraphVizNode {
	id: string;
	label: string;
	spgType: string;
	vizType: string;
	group: number;
	properties?: Record<string, unknown>;
}

export interface GraphVizLink {
	source: string;
	target: string;
	label: string;
}

export interface GraphTypeLegendItem {
	label: string;
	color: string;
	icon: string;
}

export interface GraphSubgraphPayload {
	nodes: GraphVizNode[];
	links: GraphVizLink[];
	typeLegend: Record<string, GraphTypeLegendItem>;
	truncated?: boolean;
	/** openspg | neo4j | empty — 调试用 */
	source?: string;
	/** Neo4j/OpenSPG 失败时的可读说明 */
	error?: string;
}

export interface GraphSubgraphDelta {
	nodes: GraphVizNode[];
	links: GraphVizLink[];
	typeLegend?: Record<string, GraphTypeLegendItem>;
	truncated?: boolean;
}

/** POST /api/kag/qa/ 成功响应（DRF 直出，无 code 包装） */
export interface KagAskResponse {
	answer: string;
	task_id?: number;
	evidence?: unknown[];
	highlight_node_ids?: string[];
	subgraph_delta?: GraphSubgraphDelta;
}

export interface FetchGraphSubgraphParams {
	projectName?: string;
	mode?: 'overview' | 'expand';
	centerId?: string;
	limit?: number;
}

const KAG_QA_TIMEOUT_MS = 180000;
const KAG_GRAPH_TIMEOUT_MS = 120000;

/**
 * 调用 KAG Solver 进行图谱智能问答
 */
export function kagAsk(question: string, options: KagAskOptions = {}): Promise<KagAskResponse> {
	const {
		projectName = 'KGtestV2',
		projectId,
		includeEvidence = false,
		includeGraph = false,
	} = options;
	return request({
		url: '/api/kag/qa/',
		method: 'post',
		timeout: KAG_QA_TIMEOUT_MS,
		data: {
			question,
			project_name: projectName,
			...(projectId != null ? { project_id: projectId } : {}),
			include_evidence: includeEvidence || includeGraph,
			include_graph: includeGraph,
		},
	}) as Promise<KagAskResponse>;
}

/**
 * 获取图谱子图（总览或按节点扩展）
 */
export function fetchGraphSubgraph(params: FetchGraphSubgraphParams = {}): Promise<GraphSubgraphPayload> {
	const { projectName = 'KGtestV2', mode = 'overview', centerId, limit = mode === 'overview' ? 40 : 200 } = params;
	return request({
		url: '/api/kag/graph/subgraph/',
		method: 'get',
		timeout: KAG_GRAPH_TIMEOUT_MS,
		params: {
			project_name: projectName,
			mode,
			...(centerId ? { center_id: centerId } : {}),
			limit,
		},
	}) as Promise<GraphSubgraphPayload>;
}

export interface KagBuildExtractOptions {
	projectName?: string;
	content?: string;
	title?: string;
	file?: File;
}

export interface KagBuildExtractResponse {
	task_id: number;
	subgraph: GraphSubgraphPayload;
	stats: { nodeCount: number; edgeCount: number };
}

export interface KagBuildCommitOptions {
	projectName?: string;
	nodes: GraphVizNode[];
	links: GraphVizLink[];
}

export interface KagBuildCommitResponse {
	task_id: number;
	status: string;
	written: { nodes: number; edges: number };
}

const KAG_BUILD_TIMEOUT_MS = 180000;

/**
 * OpenSPG build 抽取预览（不写库）
 */
export function kagBuildExtract(options: KagBuildExtractOptions = {}): Promise<KagBuildExtractResponse> {
	const { projectName = 'KGtestV2', content, title, file } = options;
	if (file) {
		const form = new FormData();
		form.append('file', file);
		form.append('project_name', projectName);
		if (title) form.append('title', title);
		return request({
			url: '/api/kag/build/extract/',
			method: 'post',
			timeout: KAG_BUILD_TIMEOUT_MS,
			data: form,
			headers: { 'Content-Type': 'multipart/form-data' },
		}) as Promise<KagBuildExtractResponse>;
	}
	return request({
		url: '/api/kag/build/extract/',
		method: 'post',
		timeout: KAG_BUILD_TIMEOUT_MS,
		data: {
			project_name: projectName,
			content,
			...(title ? { title } : {}),
		},
	}) as Promise<KagBuildExtractResponse>;
}

/**
 * HITL 审核通过后确认入库
 */
export function kagBuildCommit(options: KagBuildCommitOptions): Promise<KagBuildCommitResponse> {
	const { projectName = 'KGtestV2', nodes, links } = options;
	return request({
		url: '/api/kag/build/commit/',
		method: 'post',
		timeout: KAG_BUILD_TIMEOUT_MS,
		data: {
			project_name: projectName,
			nodes,
			links,
		},
	}) as Promise<KagBuildCommitResponse>;
}
