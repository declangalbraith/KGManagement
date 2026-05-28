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
