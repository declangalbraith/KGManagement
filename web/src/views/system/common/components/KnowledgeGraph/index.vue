<template>
	<div class="kg-graph">
		<!-- 左侧：图谱智能检索 -->
		<aside class="kg-graph__chat kg-glass">
			<header class="kg-graph__chat-head">
				<h3>
					<el-icon><MagicStick /></el-icon>
					{{ t('message.pages.knowledge.graph.chatTitle') }}
				</h3>
				<p>{{ t('message.pages.knowledge.graph.chatSubtitle') }}</p>
			</header>
			<div ref="chatScrollRef" class="kg-graph__chat-body">
				<div
					v-for="msg in chatHistory"
					:key="msg.id"
					class="kg-graph__msg"
					:class="{ 'is-user': msg.role === 'user' }"
				>
					<div class="kg-graph__avatar" :class="msg.role">
						<el-icon v-if="msg.role === 'ai'"><Service /></el-icon>
						<el-icon v-else><User /></el-icon>
					</div>
					<div class="kg-graph__bubble">
						{{ msg.content }}
						<button
							v-if="msg.highlightNodes?.length"
							type="button"
							class="kg-graph__rehighlight"
							@click="activeHighlight = [...msg.highlightNodes!]"
						>
							<el-icon><CopyDocument /></el-icon>
							{{ t('message.pages.knowledge.graph.rehighlight') }}
						</button>
					</div>
				</div>
			</div>
			<footer class="kg-graph__chat-foot">
				<div class="kg-graph__quick">
					<button
						type="button"
						:disabled="isQuerying"
						@click="executeQuery(t('message.pages.knowledge.graph.quickQuery1Question'))"
					>
						{{ t('message.pages.knowledge.graph.quickQuery1') }}
					</button>
					<button
						type="button"
						:disabled="isQuerying"
						@click="executeQuery(t('message.pages.knowledge.graph.quickQuery2Question'))"
					>
						{{ t('message.pages.knowledge.graph.quickQuery2') }}
					</button>
				</div>
				<div class="kg-graph__chat-input">
					<input
						v-model="chatInput"
						:disabled="isQuerying"
						:placeholder="t('message.pages.knowledge.graph.chatPlaceholder')"
						@keydown.enter="handleSendQA"
					/>
					<button type="button" class="kg-graph__send" :disabled="isQuerying" @click="handleSendQA">
						<el-icon v-if="isQuerying" class="is-spin"><Loading /></el-icon>
						<el-icon v-else><Promotion /></el-icon>
					</button>
				</div>
			</footer>
		</aside>

		<!-- 中间：图谱画布 -->
		<section class="kg-graph__main kg-glass">
			<header class="kg-graph__main-head">
				<div class="kg-graph__main-title">
					<h3>
						<el-icon><CopyDocument /></el-icon>
						{{ t('message.pages.knowledge.graph.graphTitle') }}
					</h3>
					<span class="kg-graph__divider" />
					<div class="kg-graph__doc-select">
						<el-select
							v-model="selectedDocId"
							clearable
							filterable
							:placeholder="t('message.pages.knowledge.graph.allGraphsOverview')"
							:loading="jobsLoading"
							@change="loadOverviewGraph"
						>
							<el-option
								:label="t('message.pages.knowledge.graph.allGraphsOverview')"
								value=""
							/>
							<el-option
								v-for="job in buildJobOptions"
								:key="job.doc_id"
								:label="jobLabel(job)"
								:value="job.doc_id"
							/>
						</el-select>
					</div>
					<span class="kg-graph__divider" />
					<div class="kg-graph__node-search">
						<el-icon><Search /></el-icon>
						<input v-model="searchQuery" :placeholder="t('message.pages.knowledge.graph.nodeSearch')" />
					</div>
				</div>
				<div class="kg-graph__zoom-bar">
					<button
						v-if="activeHighlight"
						type="button"
						class="kg-graph__clear-hl"
						@click="activeHighlight = null"
					>
						{{ t('message.pages.knowledge.graph.clearHighlight') }}
					</button>
					<button type="button" :title="t('message.pages.knowledge.graph.zoomIn')" @click="handleZoomIn">
						<el-icon><ZoomIn /></el-icon>
					</button>
					<button type="button" :title="t('message.pages.knowledge.graph.zoomOut')" @click="handleZoomOut">
						<el-icon><ZoomOut /></el-icon>
					</button>
					<button type="button" :title="t('message.pages.knowledge.graph.resetView')" @click="handleResetZoom">
						<el-icon><FullScreen /></el-icon>
					</button>
				</div>
			</header>
			<div ref="containerRef" class="kg-graph__canvas">
				<div v-if="graphLoading" class="kg-graph__canvas-loading">
					<el-icon class="is-spin"><Loading /></el-icon>
					<span>{{ t('message.pages.knowledge.graph.loading') }}</span>
				</div>
				<div v-else-if="graphError" class="kg-graph__canvas-error">
					<p>{{ graphError }}</p>
					<button type="button" @click="loadOverviewGraph">{{ t('message.pages.knowledge.graph.retry') }}</button>
				</div>
				<svg v-show="!graphLoading && !graphError" ref="svgRef" class="kg-graph__svg" />
				<div v-if="!graphLoading && !graphError" class="kg-graph__legend">
					<div class="kg-graph__legend-title">
						<el-icon><Filter /></el-icon>
						{{ t('message.pages.knowledge.graph.nodeFilter') }}
					</div>
					<button
						v-for="(cfg, type) in typeLegendConfig"
						:key="type"
						type="button"
						class="kg-graph__legend-item"
						:class="{ 'is-off': !visibleTypes.has(type) }"
						@click="toggleType(type)"
					>
						<span class="kg-graph__legend-dot" :style="{ background: cfg.color }">{{ cfg.icon }}</span>
						<span>{{ cfg.label }}</span>
					</button>
				</div>
			</div>
		</section>

		<!-- 右侧：节点详情 -->
		<aside v-if="selectedNode" class="kg-graph__detail kg-glass">
			<header class="kg-graph__detail-head">
				<div class="kg-graph__detail-top">
					<span class="kg-graph__type-badge" :style="{ background: legendForNode(selectedNode).color }">
						{{ legendForNode(selectedNode).icon }}
						{{ legendForNode(selectedNode).label }}
					</span>
					<button type="button" class="kg-graph__detail-close" @click="selectedNode = null">
						<el-icon><Close /></el-icon>
					</button>
				</div>
				<h3>{{ selectedNode.label }}</h3>
				<code>{{ selectedNode.id }}</code>
			</header>
			<div class="kg-graph__detail-body">
				<ul v-if="selectedNodeProperties.length" class="kg-graph__props">
					<li v-for="(row, i) in selectedNodeProperties" :key="i">
						<span>{{ row.key }}</span>
						<strong>{{ row.value }}</strong>
					</li>
				</ul>
				<h4>
					<el-icon><Share /></el-icon>
					{{ t('message.pages.knowledge.graph.relations') }}
				</h4>
				<ul class="kg-graph__relations">
					<li
						v-for="(rel, i) in relatedLinks"
						:key="i"
						@click="onRelatedClick(rel.node)"
					>
						<div class="kg-graph__rel-meta">
							<span class="kg-graph__rel-label">{{ rel.isSource ? rel.link.label : `${rel.link.label} (${t('message.pages.knowledge.graph.passive')})` }}</span>
							<span :style="{ color: legendForNode(rel.node).color }">
								{{ legendForNode(rel.node).icon }} {{ legendForNode(rel.node).label }}
							</span>
						</div>
						<span class="kg-graph__rel-name">{{ rel.node.label }}</span>
					</li>
				</ul>
			</div>
			<footer v-if="selectedNode.spgType === 'EightDReport'" class="kg-graph__detail-foot">
				<button type="button" class="kg-graph__btn-primary" @click="onViewReport">
					<el-icon><Link /></el-icon>
					{{ t('message.pages.knowledge.graph.viewReport') }}
				</button>
			</footer>
		</aside>
	</div>
</template>

<script setup lang="ts" name="KnowledgeGraph">
import { computed, nextTick, onMounted, onUnmounted, ref, shallowRef, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { ElMessage } from 'element-plus';
import * as d3 from 'd3';
import {
	Close,
	CopyDocument,
	Filter,
	FullScreen,
	Link,
	Loading,
	MagicStick,
	Promotion,
	Search,
	Service,
	Share,
	User,
	ZoomIn,
	ZoomOut,
} from '@element-plus/icons-vue';
import {
	extractKgAgentError,
	kgBuildList,
	kgFetchGraph,
	kgFetchGraphOverview,
	type KgBuildJobItem,
} from '/@/api/business/kgAgent';
import { kagAsk, type GraphSubgraphDelta, type GraphSubgraphPayload, type GraphTypeLegendItem } from '/@/api/business/kag';
import {
	BUILDER_OVERVIEW_LIMIT,
	focusGraphCluster,
	HIGHLIGHT_CLUSTER_MAX_NODES,
	MAX_CLUSTER_NODES,
} from '../../graph/cluster';
import type { GraphLink, GraphNode } from '../../graph/types';
import { FALLBACK_LEGEND, mapApiLink, mapApiNode } from '../../graph/utils';
import { graphChatWelcome } from '../../graph/mock';

interface ChatMessage {
	id: string;
	role: 'user' | 'ai';
	content: string;
	highlightNodes?: string[];
}

const { t } = useI18n();

const containerRef = ref<HTMLDivElement | null>(null);
const svgRef = ref<SVGSVGElement | null>(null);
const chatScrollRef = ref<HTMLDivElement | null>(null);

const searchQuery = ref('');
const chatInput = ref('');
const graphNodes = ref<GraphNode[]>([]);
const graphLinks = ref<GraphLink[]>([]);
const typeLegend = ref<Record<string, GraphTypeLegendItem>>({});
const visibleTypes = ref<Set<string>>(new Set());
const graphLoading = ref(true);
const graphError = ref('');
const jobsLoading = ref(false);
const selectedDocId = ref('');
const buildJobOptions = ref<KgBuildJobItem[]>([]);
const selectedNode = shallowRef<GraphNode | null>(null);
const activeHighlight = ref<string[] | null>(null);

const chatHistory = ref<ChatMessage[]>([{ id: 'msg-0', role: 'ai', content: graphChatWelcome }]);
const isQuerying = ref(false);

const typeLegendConfig = computed(() => ({ ...FALLBACK_LEGEND, ...typeLegend.value }));

const selectedNodeProperties = computed(() => {
	const node = selectedNode.value;
	if (!node?.properties) return [];
	const skip = new Set(['id', 'name', 'biz_node_id', 'gdb_timestamp']);
	return Object.entries(node.properties)
		.filter(([k, v]) => !skip.has(k) && v != null && String(v).trim() !== '')
		.slice(0, 12)
		.map(([key, value]) => ({ key, value: String(value) }));
});

function legendForNode(node: GraphNode): GraphTypeLegendItem {
	return typeLegendConfig.value[node.vizType] || typeLegendConfig.value[node.spgType] || FALLBACK_LEGEND.other;
}

/** 图例键为 vizType（8D）或 spgType（KAG），与 buildGraph 过滤一致 */
function isNodeTypeVisible(node: GraphNode): boolean {
	const vt = node.vizType || 'other';
	if (visibleTypes.value.has(vt)) return true;
	if (node.spgType && visibleTypes.value.has(node.spgType)) return true;
	return visibleTypes.value.size === 0;
}

function applyTypeLegend(legend?: Record<string, GraphTypeLegendItem>) {
	if (!legend) return;
	typeLegend.value = { ...typeLegend.value, ...legend };
	visibleTypes.value = new Set(Object.keys(typeLegendConfig.value));
}

function applyFocusedGraph(
	rawNodes: GraphNode[],
	rawLinks: GraphLink[],
	seedIds?: string[] | null,
	legend?: Record<string, GraphTypeLegendItem>,
	maxNodes: number = MAX_CLUSTER_NODES,
) {
	const { nodes, links } = focusGraphCluster(rawNodes, rawLinks, seedIds, maxNodes);
	graphNodes.value = nodes;
	graphLinks.value = links;
	if (legend) applyTypeLegend(legend);
	else {
		const nextLegend: Record<string, GraphTypeLegendItem> = {};
		for (const n of nodes) {
			const key = n.vizType || n.spgType || 'other';
			const item =
				typeLegend.value[n.vizType] ||
				typeLegend.value[n.spgType] ||
				typeLegendConfig.value[key];
			if (item && !nextLegend[key]) nextLegend[key] = item;
		}
		typeLegend.value = nextLegend;
	}
	visibleTypes.value = new Set(Object.keys(typeLegendConfig.value));
}

function replaceGraphFromDelta(delta?: GraphSubgraphDelta | null, seedIds?: string[] | null) {
	if (!delta?.nodes?.length) return;
	const nodes = (delta.nodes || []).map(mapApiNode);
	const links = (delta.links || []).map(mapApiLink);
	applyFocusedGraph(nodes, links, seedIds, delta.typeLegend, HIGHLIGHT_CLUSTER_MAX_NODES);
}

const SUCCESS_JOB_STATUSES = new Set(['success', 'partial_success']);

function jobLabel(job: KgBuildJobItem): string {
	const name = job.file_name?.trim();
	if (name) return `${name} (${job.doc_id.slice(0, 8)}…)`;
	return job.doc_id || `#${job.id}`;
}

/** 多文档总览：保留后端合并后的全部子图（各报告子图通常互不连通，不能 BFS 只取一团）。 */
function applyMergedOverviewGraph(
	nodes: GraphNode[],
	links: GraphLink[],
	legend?: Record<string, GraphTypeLegendItem>,
) {
	graphNodes.value = nodes;
	graphLinks.value = links;
	if (legend) {
		applyTypeLegend(legend);
	} else {
		const nextLegend: Record<string, GraphTypeLegendItem> = {};
		for (const n of nodes) {
			const key = n.vizType || n.spgType || 'other';
			const item =
				typeLegend.value[n.vizType] ||
				typeLegend.value[n.spgType] ||
				typeLegendConfig.value[key];
			if (item && !nextLegend[key]) nextLegend[key] = item;
		}
		typeLegend.value = nextLegend;
	}
	visibleTypes.value = new Set(Object.keys(typeLegendConfig.value));
}

function applyOverviewPayload(payload: GraphSubgraphPayload, mode: 'merged' | 'single') {
	const nodes = (payload.nodes || []).map(mapApiNode);
	const links = (payload.links || []).map(mapApiLink);
	if (!nodes.length) {
		const apiErr = (payload as { error?: string }).error;
		throw new Error(apiErr || t('message.pages.knowledge.graph.empty'));
	}
	if (mode === 'merged') {
		applyMergedOverviewGraph(nodes, links, payload.typeLegend);
	} else {
		applyFocusedGraph(nodes, links, null, payload.typeLegend, BUILDER_OVERVIEW_LIMIT);
	}
	if (payload.truncated) {
		ElMessage.warning(t('message.pages.knowledge.graph.truncated'));
	}
}

function resolveGraphLoadError(err: unknown, fallback: string): string {
	if (err instanceof Error && err.message && err.message !== '请求失败') return err.message;
	const ax = err as { response?: { data?: { error?: string; msg?: string; migrate_to?: unknown } } };
	const data = ax.response?.data;
	if (typeof data?.error === 'string') return data.error;
	if (typeof data?.msg === 'string') return data.msg;
	if (data?.migrate_to) return t('message.pages.knowledge.graph.kagDeprecated');
	return extractKgAgentError(err, fallback);
}

function dedupeBuildJobs(jobs: KgBuildJobItem[]): KgBuildJobItem[] {
	const seenDoc = new Set<string>();
	const seenName = new Set<string>();
	const out: KgBuildJobItem[] = [];
	for (const j of jobs) {
		if (!j.doc_id || !SUCCESS_JOB_STATUSES.has(j.status)) continue;
		if (seenDoc.has(j.doc_id)) continue;
		const nameKey = (j.file_name || '').trim().toLowerCase();
		if (nameKey && seenName.has(nameKey)) continue;
		seenDoc.add(j.doc_id);
		if (nameKey) seenName.add(nameKey);
		out.push(j);
	}
	return out;
}

async function loadBuildJobOptions() {
	jobsLoading.value = true;
	try {
		const jobs = await kgBuildList({ limit: 50 });
		buildJobOptions.value = dedupeBuildJobs(jobs);
		if (
			selectedDocId.value &&
			!buildJobOptions.value.some((j) => j.doc_id === selectedDocId.value)
		) {
			selectedDocId.value = '';
		}
	} catch (err) {
		console.warn('load build jobs failed', err);
		buildJobOptions.value = [];
	} finally {
		jobsLoading.value = false;
	}
}

async function loadOverviewFromEightD(docId: string) {
	const payload = await kgFetchGraph({ docId });
	applyOverviewPayload(payload, 'single');
}

async function loadOverviewFromEightDMerged() {
	const payload = await kgFetchGraphOverview({ limit: BUILDER_OVERVIEW_LIMIT, maxDocs: 20 });
	applyOverviewPayload(payload, 'merged');
	const docCount = payload.mergedDocCount ?? 0;
	if (docCount > 1) {
		ElMessage.success(t('message.pages.knowledge.builder.overviewMultiDoc', { n: docCount }));
	} else if (docCount === 1) {
		ElMessage.info(t('message.pages.knowledge.builder.overviewSingleDoc'));
	}
}

async function loadOverviewGraph() {
	graphLoading.value = true;
	graphError.value = '';
	selectedNode.value = null;
	try {
		const docId = (selectedDocId.value || '').trim();
		if (docId) {
			await loadOverviewFromEightD(docId);
		} else {
			selectedDocId.value = '';
			await loadOverviewFromEightDMerged();
		}
		graphLoading.value = false;
		await nextTick();
		buildGraph();
	} catch (err) {
		graphError.value = resolveGraphLoadError(err, t('message.pages.knowledge.graph.loadFailed'));
		console.error(err);
	} finally {
		graphLoading.value = false;
	}
}

const selectedNodeRef = ref<GraphNode | null>(null);
const searchQueryRef = ref('');
const activeHighlightRef = ref<string[] | null>(null);

let simulation: d3.Simulation<GraphNode, GraphLink> | null = null;
let zoomBehavior: d3.ZoomBehavior<SVGSVGElement, unknown> | null = null;
let graphGroupEl: d3.Selection<SVGGElement, unknown, null, undefined> | null = null;

function fitGraphToView(width: number, height: number) {
	if (!svgRef.value || !zoomBehavior || !graphGroupEl) return;
	const node = graphGroupEl.node();
	if (!node) return;
	const bbox = node.getBBox();
	if (!bbox.width || !bbox.height) return;
	const pad = 48;
	const scale = Math.min(
		(width - pad * 2) / bbox.width,
		(height - pad * 2) / bbox.height,
		2.5,
	);
	const tx = width / 2 - scale * (bbox.x + bbox.width / 2);
	const ty = height / 2 - scale * (bbox.y + bbox.height / 2);
	const transform = d3.zoomIdentity.translate(tx, ty).scale(Math.max(scale, 0.15));
	d3.select(svgRef.value).transition().duration(500).call(zoomBehavior.transform, transform);
}

const colorScale = d3
	.scaleOrdinal<number, string>()
	.domain([1, 2, 3, 4, 5, 6, 7])
	.range(['#ef4444', '#3b82f6', '#f59e0b', '#10b981', '#a855f7', '#06b6d4', '#4f46e5']);

const linkedByIndex = computed(() => {
	const map: Record<string, boolean> = {};
	graphLinks.value.forEach((d) => {
		const s = typeof d.source === 'string' ? d.source : d.source.id;
		const t = typeof d.target === 'string' ? d.target : d.target.id;
		map[`${s},${t}`] = true;
		map[`${t},${s}`] = true;
	});
	return map;
});

const relatedLinks = computed(() => {
	if (!selectedNode.value) return [];
	return graphLinks.value
		.map((l) => {
			const sId = typeof l.source === 'string' ? l.source : l.source.id;
			const tId = typeof l.target === 'string' ? l.target : l.target.id;
			if (sId !== selectedNode.value!.id && tId !== selectedNode.value!.id) return null;
			const isSource = sId === selectedNode.value!.id;
			const relatedId = isSource ? tId : sId;
			const node = graphNodes.value.find((n) => n.id === relatedId);
			if (!node) return null;
			return { link: l, node, isSource };
		})
		.filter(Boolean) as { link: GraphLink; node: GraphNode; isSource: boolean }[];
});

function isConnected(a: GraphNode | string, b: GraphNode | string) {
	const aId = typeof a === 'string' ? a : a.id;
	const bId = typeof b === 'string' ? b : b.id;
	return linkedByIndex.value[`${aId},${bId}`] || aId === bId;
}

function updateGraphStyles() {
	if (!svgRef.value) return;
	const svg = d3.select(svgRef.value);
	const node = svg.selectAll<SVGGElement, GraphNode>('.node-group');
	const link = svg.selectAll<SVGLineElement, GraphLink>('.links line');
	const linkText = svg.selectAll<SVGTextElement, GraphLink>('.link-labels text');

	const highlight = activeHighlightRef.value;
	const selected = selectedNodeRef.value;

	if (highlight?.length) {
		const set = new Set(highlight);
		node.style('opacity', (d) => (set.has(d.id) ? '1' : '0.1'));
		link.style('opacity', (d) => {
			const s = d.source as GraphNode;
			const t = d.target as GraphNode;
			return set.has(s.id) && set.has(t.id) ? '1' : '0.1';
		});
		linkText.style('opacity', (d) => {
			const s = d.source as GraphNode;
			const t = d.target as GraphNode;
			return set.has(s.id) && set.has(t.id) ? '1' : '0.1';
		});
	} else if (selected) {
		node.style('opacity', (d) => (isConnected(selected, d) ? '1' : '0.1'));
		link.style('opacity', (d) => {
			const s = d.source as GraphNode;
			const t = d.target as GraphNode;
			return s.id === selected.id || t.id === selected.id ? '1' : '0.1';
		});
		linkText.style('opacity', (d) => {
			const s = d.source as GraphNode;
			const t = d.target as GraphNode;
			return s.id === selected.id || t.id === selected.id ? '1' : '0.1';
		});
	} else {
		node.style('opacity', '1');
		link.style('opacity', '1');
		linkText.style('opacity', '1');
	}
}

function applySearchStroke() {
	if (!svgRef.value) return;
	const q = searchQueryRef.value.toLowerCase();
	d3.select(svgRef.value)
		.selectAll<SVGGElement, GraphNode>('.node-group')
		.each(function (d) {
			const isMatch = q && d.label.toLowerCase().includes(q);
			d3.select(this)
				.select('circle')
				.attr('stroke', isMatch ? '#1e293b' : '#fff')
				.attr('stroke-width', isMatch ? 4 : 2);
		});
}

function nodeRadius(d: GraphNode) {
	if (d.vizType === 'report' || d.vizType === 'product') return 26;
	if (d.vizType === 'event' || d.vizType === 'failure') return 24;
	return 20;
}

function buildGraph() {
	if (!svgRef.value || !containerRef.value || graphLoading.value || graphError.value) return;
	simulation?.stop();

	const width = containerRef.value.clientWidth;
	const height = containerRef.value.clientHeight || 600;
	const svg = d3.select(svgRef.value);
	svg.selectAll('*').remove();
	svg.attr('width', width).attr('height', height);

	if (!graphNodes.value.length) return;

	const nodes = graphNodes.value.filter(isNodeTypeVisible).map((d) => ({ ...d }));
	if (!nodes.length) return;
	const cx = width / 2;
	const cy = height / 2;
	const initR = Math.min(width, height) * 0.28;
	nodes.forEach((n, i) => {
		const a = (2 * Math.PI * i) / Math.max(nodes.length, 1);
		n.x = cx + initR * Math.cos(a);
		n.y = cy + initR * Math.sin(a);
	});
	const nodeIds = new Set(nodes.map((n) => n.id));
	const links = graphLinks.value
		.filter((l) => {
			const s = typeof l.source === 'string' ? l.source : l.source.id;
			const t = typeof l.target === 'string' ? l.target : l.target.id;
			return nodeIds.has(s) && nodeIds.has(t);
		})
		.map((d) => ({ ...d }));

	const g = svg.append('g');
	graphGroupEl = g;

	zoomBehavior = d3
		.zoom<SVGSVGElement, unknown>()
		.scaleExtent([0.1, 4])
		.on('zoom', (event) => {
			g.attr('transform', event.transform);
		});
	svg.call(zoomBehavior);

	simulation = d3
		.forceSimulation(nodes)
		.force('link', d3.forceLink<GraphNode, GraphLink>(links).id((d) => d.id).distance(100))
		.force('charge', d3.forceManyBody().strength(-600))
		.force('center', d3.forceCenter(width / 2, height / 2))
		.force('collide', d3.forceCollide().radius(60));

	svg
		.append('defs')
		.append('marker')
		.attr('id', 'kg-arrowhead')
		.attr('viewBox', '-0 -5 10 10')
		.attr('refX', 28)
		.attr('refY', 0)
		.attr('orient', 'auto')
		.attr('markerWidth', 6)
		.attr('markerHeight', 6)
		.append('path')
		.attr('d', 'M 0,-5 L 10 ,0 L 0,5')
		.attr('fill', '#94a3b8');

	const link = g
		.append('g')
		.attr('class', 'links')
		.selectAll('line')
		.data(links)
		.enter()
		.append('line')
		.attr('stroke', '#cbd5e1')
		.attr('stroke-width', 2)
		.attr('marker-end', 'url(#kg-arrowhead)');

	const linkText = g
		.append('g')
		.attr('class', 'link-labels')
		.selectAll('text')
		.data(links)
		.enter()
		.append('text')
		.attr('font-size', '10px')
		.attr('fill', '#64748b')
		.attr('text-anchor', 'middle')
		.attr('pointer-events', 'none')
		.text((d) => d.label);

	const node = g
		.append('g')
		.attr('class', 'nodes')
		.selectAll<SVGGElement, GraphNode>('g')
		.data(nodes)
		.enter()
		.append('g')
		.attr('class', 'node-group')
		.call(
			d3
				.drag<SVGGElement, GraphNode>()
				.on('start', (event, d) => {
					if (!event.active) simulation?.alphaTarget(0.3).restart();
					d.fx = d.x;
					d.fy = d.y;
				})
				.on('drag', (event, d) => {
					d.fx = event.x;
					d.fy = event.y;
				})
				.on('end', (event, d) => {
					if (!event.active) simulation?.alphaTarget(0);
					d.fx = null;
					d.fy = null;
				})
		)
		.on('mouseover', function (_event, d) {
			if (!activeHighlightRef.value && !selectedNodeRef.value) {
				node.style('opacity', (o) => (isConnected(d, o) ? '1' : '0.1'));
				link.style('opacity', (o) => {
					const s = o.source as GraphNode;
					const t = o.target as GraphNode;
					return s.id === d.id || t.id === d.id ? '1' : '0.1';
				});
				linkText.style('opacity', (o) => {
					const s = o.source as GraphNode;
					const t = o.target as GraphNode;
					return s.id === d.id || t.id === d.id ? '1' : '0.1';
				});
			}
			d3.select(this).select('circle').attr('stroke', '#1e293b').attr('stroke-width', 3);
		})
		.on('mouseout', function (_event, d) {
			updateGraphStyles();
			const q = searchQueryRef.value.toLowerCase();
			const isMatch = q && d.label.toLowerCase().includes(q);
			d3.select(this)
				.select('circle')
				.attr('stroke', isMatch ? '#1e293b' : '#fff')
				.attr('stroke-width', isMatch ? 4 : 2);
		})
		.on('click', (event, d) => {
			selectedNode.value = d;
			activeHighlight.value = null;
			event.stopPropagation();
		});

	node
		.append('circle')
		.attr('r', (d) => nodeRadius(d))
		.attr('fill', (d) => colorScale(d.group))
		.attr('stroke', '#fff')
		.attr('stroke-width', 2)
		.style('cursor', 'pointer')
		.style('filter', 'drop-shadow(0 4px 6px rgba(0,0,0,0.1))');

	node
		.append('text')
		.attr('text-anchor', 'middle')
		.attr('dominant-baseline', 'central')
		.attr('font-size', '14px')
		.attr('fill', '#fff')
		.attr('pointer-events', 'none')
		.text((d) => legendForNode(d).icon);

	node
		.append('text')
		.attr('dy', 40)
		.attr('text-anchor', 'middle')
		.attr('font-size', '12px')
		.attr('font-weight', '600')
		.attr('fill', '#1e293b')
		.attr('pointer-events', 'none')
		.text((d) => d.label);

	svg.on('click', () => {
		selectedNode.value = null;
		activeHighlight.value = null;
	});

	let fitScheduled = false;
	const scheduleFit = () => {
		if (fitScheduled) return;
		fitScheduled = true;
		window.requestAnimationFrame(() => fitGraphToView(width, height));
	};
	const fitFallbackTimer = window.setTimeout(scheduleFit, 1400);

	simulation.on('tick', () => {
		link.attr('x1', (d) => (d.source as GraphNode).x!)
			.attr('y1', (d) => (d.source as GraphNode).y!)
			.attr('x2', (d) => (d.target as GraphNode).x!)
			.attr('y2', (d) => (d.target as GraphNode).y!);
		linkText
			.attr('x', (d) => ((d.source as GraphNode).x! + (d.target as GraphNode).x!) / 2)
			.attr('y', (d) => ((d.source as GraphNode).y! + (d.target as GraphNode).y!) / 2 - 5);
		node.attr('transform', (d) => `translate(${d.x},${d.y})`);
	});
	simulation.on('end', () => {
		window.clearTimeout(fitFallbackTimer);
		scheduleFit();
	});

	updateGraphStyles();
	applySearchStroke();
}

function toggleType(type: string) {
	const next = new Set(visibleTypes.value);
	if (next.has(type)) next.delete(type);
	else next.add(type);
	visibleTypes.value = next;
	selectedNode.value = null;
	activeHighlight.value = null;
	buildGraph();
}

function handleZoomIn() {
	if (svgRef.value && zoomBehavior) {
		d3.select(svgRef.value).transition().duration(300).call(zoomBehavior.scaleBy, 1.3);
	}
}

function handleZoomOut() {
	if (svgRef.value && zoomBehavior) {
		d3.select(svgRef.value).transition().duration(300).call(zoomBehavior.scaleBy, 1 / 1.3);
	}
}

function handleResetZoom() {
	if (!containerRef.value) return;
	const w = containerRef.value.clientWidth;
	const h = containerRef.value.clientHeight || 600;
	fitGraphToView(w, h);
}

function resolveKagErrorMessage(err: unknown): string {
	const fallback = t('message.pages.knowledge.graph.queryFailed');
	if (!err || typeof err !== 'object') return fallback;
	const ax = err as { response?: { data?: { error?: string; detail?: string } }; message?: string };
	const data = ax.response?.data;
	if (data?.error) return data.error;
	if (data?.detail) return typeof data.detail === 'string' ? data.detail : fallback;
	if (ax.message?.includes('timeout')) return fallback;
	return fallback;
}

function replaceChatMessage(id: string, patch: Partial<ChatMessage> & Pick<ChatMessage, 'content'>) {
	const idx = chatHistory.value.findIndex((m) => m.id === id);
	if (idx === -1) return;
	chatHistory.value[idx] = { ...chatHistory.value[idx], ...patch, id: String(Date.now()) };
}

async function executeQuery(query: string) {
	if (isQuerying.value) return;

	chatHistory.value.push({ id: String(Date.now()), role: 'user', content: query });
	selectedNode.value = null;

	const pendingId = `pending-${Date.now()}`;
	chatHistory.value.push({
		id: pendingId,
		role: 'ai',
		content: t('message.pages.knowledge.graph.querying'),
	});
	isQuerying.value = true;
	scrollChat();

	try {
		const res = await kagAsk(query, { includeEvidence: true, includeGraph: true });
		const text = res.answer?.trim() || t('message.pages.knowledge.graph.queryEmpty');
		const highlight = res.highlight_node_ids?.length ? res.highlight_node_ids : null;
		if (res.subgraph_delta?.nodes?.length) {
			replaceGraphFromDelta(res.subgraph_delta, highlight);
		} else if (highlight?.length) {
			applyFocusedGraph(
				graphNodes.value,
				graphLinks.value,
				highlight,
				undefined,
				HIGHLIGHT_CLUSTER_MAX_NODES,
			);
		}
		activeHighlight.value = highlight;
		await nextTick();
		buildGraph();
		replaceChatMessage(pendingId, {
			role: 'ai',
			content: text,
			highlightNodes: highlight || undefined,
		});
	} catch (err) {
		replaceChatMessage(pendingId, {
			role: 'ai',
			content: resolveKagErrorMessage(err),
		});
	} finally {
		isQuerying.value = false;
		scrollChat();
	}
}

function handleSendQA() {
	if (isQuerying.value || !chatInput.value.trim()) return;
	const text = chatInput.value.trim();
	chatInput.value = '';
	executeQuery(text);
}

function scrollChat() {
	nextTick(() => {
		if (chatScrollRef.value) {
			chatScrollRef.value.scrollTop = chatScrollRef.value.scrollHeight;
		}
	});
}

function onRelatedClick(node: GraphNode) {
	selectedNode.value = node;
	activeHighlight.value = null;
}

function onViewReport() {
	ElMessage.info(t('message.pages.knowledge.graph.reportToast'));
}

function onCreate8d() {
	ElMessage.info(t('message.pages.knowledge.graph.create8dToast'));
}

watch(selectedNode, (n) => {
	selectedNodeRef.value = n;
	updateGraphStyles();
});

watch(activeHighlight, (h) => {
	activeHighlightRef.value = h;
	updateGraphStyles();
});

watch(searchQuery, (q) => {
	searchQueryRef.value = q;
	applySearchStroke();
});

watch(chatHistory, () => scrollChat(), { deep: true });

let resizeObserver: ResizeObserver | null = null;

onMounted(async () => {
	await loadBuildJobOptions();
	await loadOverviewGraph();
	if (containerRef.value) {
		resizeObserver = new ResizeObserver(() => buildGraph());
		resizeObserver.observe(containerRef.value);
	}
});

onUnmounted(() => {
	simulation?.stop();
	resizeObserver?.disconnect();
});
</script>

<style scoped lang="scss">
.kg-glass {
	background: rgba(255, 255, 255, 0.98);
	border: 1px solid rgba(0, 0, 0, 0.06);
	box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
	border-radius: 12px;
}

.kg-graph {
	display: flex;
	gap: 16px;
	height: 750px;
	min-height: 600px;
}

.kg-graph__chat {
	width: 320px;
	flex-shrink: 0;
	display: flex;
	flex-direction: column;
	overflow: hidden;
}

.kg-graph__chat-head {
	padding: 16px 18px;
	border-bottom: 1px solid rgba(0, 0, 0, 0.06);
	background: rgba(59, 130, 246, 0.05);
	h3 {
		margin: 0;
		display: flex;
		align-items: center;
		gap: 8px;
		font-size: 16px;
		font-weight: 600;
		color: #0f172a;
	}
	p {
		margin: 6px 0 0;
		font-size: 12px;
		color: #64748b;
		line-height: 1.4;
	}
}

.kg-graph__chat-body {
	flex: 1;
	overflow-y: auto;
	padding: 16px;
	display: flex;
	flex-direction: column;
	gap: 16px;
}

.kg-graph__msg {
	display: flex;
	gap: 10px;
	align-items: flex-start;
	&.is-user {
		flex-direction: row-reverse;
		.kg-graph__bubble {
			background: #1a1a1a;
			color: #fff;
			border-radius: 16px 16px 4px 16px;
		}
	}
}

.kg-graph__avatar {
	width: 32px;
	height: 32px;
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	flex-shrink: 0;
	&.ai {
		background: rgba(59, 130, 246, 0.12);
		color: var(--el-color-primary);
	}
	&.user {
		background: #f1f5f9;
		color: #64748b;
	}
}

.kg-graph__bubble {
	max-width: 85%;
	font-size: 13px;
	line-height: 1.55;
	padding: 12px 14px;
	border-radius: 16px 16px 16px 4px;
	background: #f8fafc;
	border: 1px solid rgba(0, 0, 0, 0.06);
	color: #334155;
}

.kg-graph__rehighlight {
	display: inline-flex;
	align-items: center;
	gap: 4px;
	margin-top: 8px;
	border: none;
	background: none;
	color: var(--el-color-primary);
	font-size: 12px;
	cursor: pointer;
	padding: 0;
	&:hover {
		text-decoration: underline;
	}
}

.kg-graph__chat-foot {
	padding: 12px 14px 14px;
	border-top: 1px solid rgba(0, 0, 0, 0.06);
	background: rgba(0, 0, 0, 0.02);
}

.kg-graph__quick {
	display: flex;
	flex-wrap: wrap;
	gap: 6px;
	margin-bottom: 10px;
	button {
		border: none;
		background: #f1f5f9;
		padding: 4px 10px;
		border-radius: 999px;
		font-size: 11px;
		color: #475569;
		cursor: pointer;
		&:disabled {
			cursor: not-allowed;
			opacity: 0.55;
		}
		&:hover:not(:disabled) {
			background: #1a1a1a;
			color: #fff;
		}
	}
}

.kg-graph__chat-input {
	position: relative;
	input {
		width: 100%;
		height: 40px;
		padding: 0 44px 0 16px;
		border: 1px solid rgba(0, 0, 0, 0.1);
		border-radius: 999px;
		font-size: 13px;
		outline: none;
		background: #fff;
		&:focus {
			border-color: rgba(59, 130, 246, 0.5);
		}
	}
}

.kg-graph__send {
	position: absolute;
	right: 4px;
	top: 4px;
	width: 32px;
	height: 32px;
	border: none;
	border-radius: 50%;
	background: transparent;
	color: var(--el-color-primary);
	cursor: pointer;
	display: flex;
	align-items: center;
	justify-content: center;
	&:hover:not(:disabled) {
		background: rgba(59, 130, 246, 0.1);
	}
	&:disabled {
		cursor: not-allowed;
		opacity: 0.55;
	}
	.is-spin {
		animation: kg-graph-spin 0.8s linear infinite;
	}
}

@keyframes kg-graph-spin {
	to {
		transform: rotate(360deg);
	}
}

.kg-graph__main {
	flex: 1;
	min-width: 0;
	display: flex;
	flex-direction: column;
	overflow: hidden;
}

.kg-graph__main-head {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 12px 16px;
	border-bottom: 1px solid rgba(0, 0, 0, 0.06);
	background: rgba(0, 0, 0, 0.02);
	gap: 12px;
	flex-wrap: wrap;
}

.kg-graph__main-title {
	display: flex;
	align-items: center;
	gap: 12px;
	min-width: 0;
	h3 {
		margin: 0;
		display: flex;
		align-items: center;
		gap: 8px;
		font-size: 15px;
		font-weight: 600;
		white-space: nowrap;
	}
}

.kg-graph__divider {
	width: 1px;
	height: 24px;
	background: rgba(0, 0, 0, 0.1);
	flex-shrink: 0;
}

.kg-graph__doc-select {
	min-width: 200px;
	max-width: 280px;
	flex-shrink: 0;
	:deep(.el-select) {
		width: 100%;
	}
}

.kg-graph__node-search {
	position: relative;
	width: 220px;
	.el-icon {
		position: absolute;
		left: 10px;
		top: 50%;
		transform: translateY(-50%);
		color: #94a3b8;
		font-size: 14px;
	}
	input {
		width: 100%;
		height: 32px;
		padding: 0 12px 0 32px;
		border: 1px solid rgba(0, 0, 0, 0.1);
		border-radius: 999px;
		font-size: 12px;
		outline: none;
		background: #fff;
	}
}

.kg-graph__zoom-bar {
	display: flex;
	align-items: center;
	gap: 4px;
	padding: 4px;
	background: #fff;
	border: 1px solid rgba(0, 0, 0, 0.08);
	border-radius: 8px;
	button {
		width: 28px;
		height: 28px;
		border: none;
		background: transparent;
		border-radius: 6px;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		color: #475569;
		&:hover {
			background: #f1f5f9;
		}
	}
}

.kg-graph__clear-hl {
	height: 28px;
	padding: 0 10px;
	border: 1px solid rgba(59, 130, 246, 0.25);
	background: rgba(59, 130, 246, 0.06);
	color: var(--el-color-primary);
	border-radius: 6px;
	font-size: 12px;
	cursor: pointer;
	margin-right: 4px;
	white-space: nowrap;
}

.kg-graph__canvas {
	position: relative;
	flex: 1;
	background: #f8fafc;
	overflow: hidden;
}

.kg-graph__canvas-loading,
.kg-graph__canvas-error {
	position: absolute;
	inset: 0;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: 12px;
	color: #64748b;
	font-size: 13px;
	z-index: 2;
	background: #f8fafc;
	.is-spin {
		animation: kg-graph-spin 0.8s linear infinite;
		font-size: 28px;
	}
	button {
		border: none;
		background: var(--el-color-primary);
		color: #fff;
		padding: 6px 14px;
		border-radius: 6px;
		cursor: pointer;
	}
}

.kg-graph__props {
	list-style: none;
	margin: 0 0 16px;
	padding: 0;
	li {
		display: flex;
		flex-direction: column;
		gap: 2px;
		padding: 8px 0;
		border-bottom: 1px solid #f1f5f9;
		span {
			font-size: 11px;
			color: #94a3b8;
		}
		strong {
			font-size: 12px;
			color: #334155;
			font-weight: 500;
			word-break: break-word;
		}
	}
}

.kg-graph__svg {
	width: 100%;
	height: 100%;
	cursor: grab;
	&:active {
		cursor: grabbing;
	}
}

.kg-graph__legend {
	position: absolute;
	left: 20px;
	bottom: 20px;
	padding: 14px 16px;
	background: rgba(255, 255, 255, 0.95);
	backdrop-filter: blur(12px);
	border: 1px solid rgba(0, 0, 0, 0.08);
	border-radius: 12px;
	box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
	min-width: 160px;
	display: flex;
	flex-direction: column;
	gap: 8px;
	z-index: 2;
}

.kg-graph__legend-title {
	display: flex;
	align-items: center;
	gap: 6px;
	font-size: 11px;
	font-weight: 700;
	color: #64748b;
	text-transform: uppercase;
	letter-spacing: 0.04em;
	margin-bottom: 4px;
}

.kg-graph__legend-item {
	display: flex;
	align-items: center;
	gap: 10px;
	border: none;
	background: none;
	font-size: 13px;
	font-weight: 500;
	color: #334155;
	cursor: pointer;
	padding: 2px 0;
	text-align: left;
	transition: opacity 0.15s;
	&.is-off {
		opacity: 0.4;
		filter: grayscale(1);
	}
	&:hover {
		opacity: 0.85;
	}
}

.kg-graph__legend-dot {
	width: 16px;
	height: 16px;
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 9px;
	color: #fff;
	box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
}

.kg-graph__detail {
	width: 320px;
	flex-shrink: 0;
	display: flex;
	flex-direction: column;
	overflow: hidden;
	animation: kg-slide-in 0.25s ease;
}

@keyframes kg-slide-in {
	from {
		opacity: 0;
		transform: translateX(12px);
	}
	to {
		opacity: 1;
		transform: translateX(0);
	}
}

.kg-graph__detail-head {
	padding: 18px 18px 14px;
	border-bottom: 1px solid rgba(0, 0, 0, 0.06);
	background: linear-gradient(180deg, rgba(0, 0, 0, 0.02) 0%, transparent 100%);
	h3 {
		margin: 10px 0 8px;
		font-size: 18px;
		line-height: 1.3;
		font-weight: 700;
	}
	code {
		font-size: 11px;
		color: #64748b;
		background: #f1f5f9;
		padding: 4px 8px;
		border-radius: 6px;
	}
}

.kg-graph__detail-top {
	display: flex;
	justify-content: space-between;
	align-items: flex-start;
}

.kg-graph__type-badge {
	display: inline-flex;
	align-items: center;
	gap: 4px;
	padding: 4px 10px;
	border-radius: 6px;
	font-size: 12px;
	font-weight: 600;
	color: #fff;
}

.kg-graph__detail-close {
	border: none;
	background: transparent;
	color: #94a3b8;
	cursor: pointer;
	padding: 4px;
	border-radius: 50%;
	&:hover {
		background: #fef2f2;
		color: #dc2626;
	}
}

.kg-graph__detail-body {
	flex: 1;
	overflow-y: auto;
	padding: 16px 18px;
	h4 {
		margin: 0 0 10px;
		display: flex;
		align-items: center;
		gap: 6px;
		font-size: 11px;
		font-weight: 700;
		color: #64748b;
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}
}

.kg-graph__metrics {
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 10px;
	margin-bottom: 20px;
}

.kg-graph__metric {
	padding: 12px;
	background: #f8fafc;
	border: 1px solid rgba(0, 0, 0, 0.06);
	border-radius: 8px;
	> span {
		display: block;
		font-size: 10px;
		color: #64748b;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		margin-bottom: 4px;
	}
	strong {
		font-size: 22px;
		color: var(--el-color-primary);
		small {
			font-size: 13px;
			font-weight: 400;
			color: #94a3b8;
		}
		&.is-green {
			color: #059669;
		}
	}
}

.kg-graph__relations {
	list-style: none;
	margin: 0;
	padding: 0;
	display: flex;
	flex-direction: column;
	gap: 8px;
	li {
		padding: 12px;
		border: 1px solid rgba(0, 0, 0, 0.06);
		border-radius: 8px;
		background: #fff;
		cursor: pointer;
		transition: border-color 0.15s;
		&:hover {
			border-color: rgba(59, 130, 246, 0.35);
		}
	}
}

.kg-graph__rel-meta {
	display: flex;
	justify-content: space-between;
	align-items: center;
	gap: 8px;
	margin-bottom: 6px;
	font-size: 10px;
}

.kg-graph__rel-label {
	padding: 2px 6px;
	background: #f1f5f9;
	border-radius: 4px;
	color: #64748b;
}

.kg-graph__rel-name {
	font-size: 13px;
	font-weight: 500;
	color: #0f172a;
}

.kg-graph__detail-foot {
	padding: 14px 18px;
	border-top: 1px solid rgba(0, 0, 0, 0.06);
	background: rgba(0, 0, 0, 0.02);
	display: flex;
	flex-direction: column;
	gap: 8px;
}

.kg-graph__btn-primary,
.kg-graph__btn-outline {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	gap: 6px;
	height: 38px;
	border-radius: 6px;
	font-size: 14px;
	font-weight: 500;
	cursor: pointer;
	width: 100%;
}

.kg-graph__btn-primary {
	border: none;
	background: #1a1a1a;
	color: #fff;
	&:hover {
		background: #333;
	}
}

.kg-graph__btn-outline {
	border: 1px solid rgba(0, 0, 0, 0.12);
	background: #fff;
	color: #334155;
	&:hover {
		background: #f8fafc;
	}
}

@media (max-width: 1100px) {
	.kg-graph {
		flex-wrap: wrap;
		height: auto;
	}
	.kg-graph__chat,
	.kg-graph__detail {
		width: 100%;
		max-height: 360px;
	}
	.kg-graph__main {
		width: 100%;
		min-height: 520px;
	}
}
</style>
