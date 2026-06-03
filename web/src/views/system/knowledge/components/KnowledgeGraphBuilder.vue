<template>
	<div class="kg-builder">
		<header class="kg-builder__top">
			<div>
				<h2>
					<el-icon><Share /></el-icon>
					{{ t('message.pages.knowledge.builder.title') }}
				</h2>
				<p>{{ t('message.pages.knowledge.builder.subtitle') }}</p>
			</div>
		</header>

		<div class="kg-builder__body">
			<div class="kg-builder__left">
				<section class="kg-builder__card kg-glass">
					<div class="kg-builder__card-head">
						<el-icon><Document /></el-icon>
						<span>{{ t('message.pages.knowledge.builder.dataSource') }}</span>
					</div>
					<div class="kg-builder__card-body">
						<textarea
							v-model="sourceText"
							class="kg-builder__textarea"
							:placeholder="t('message.pages.knowledge.builder.sourcePlaceholder')"
							rows="5"
						/>
						<el-upload
							class="kg-builder__upload"
							:auto-upload="false"
							:show-file-list="true"
							:limit="1"
							accept=".txt,.md,.docx,.pdf"
							:on-change="handleFileChange"
							:on-remove="handleFileRemove"
						>
							<button type="button" class="kg-builder__upload-btn">
								<el-icon><Upload /></el-icon>
								{{ t('message.pages.knowledge.builder.uploadFile') }}
							</button>
						</el-upload>
						<p class="kg-builder__upload-hint">{{ t('message.pages.knowledge.builder.uploadHint') }}</p>
						<button
							type="button"
							class="kg-builder__extract"
							:disabled="isBuilding || !canBuild"
							@click="handleBuild"
						>
							<el-icon v-if="isBuilding" class="is-spin"><Loading /></el-icon>
							<el-icon v-else><Service /></el-icon>
							{{ isBuilding ? t('message.pages.knowledge.builder.building') : t('message.pages.knowledge.builder.startBuild') }}
						</button>
					</div>
				</section>

				<section class="kg-builder__card kg-glass kg-builder__review">
					<div class="kg-builder__card-head">
						<el-icon><CircleCheck /></el-icon>
						<span>{{ t('message.pages.knowledge.builder.buildStatus') }}</span>
					</div>
					<div class="kg-builder__review-body">
						<div v-if="!buildJobId && !isBuilding" class="kg-builder__empty">
							<el-icon><Service /></el-icon>
							<p>{{ t('message.pages.knowledge.builder.waitBuild') }}</p>
						</div>
						<template v-else>
							<el-progress
								v-if="isBuilding"
								:percentage="buildProgress"
								:indeterminate="buildProgress < 0"
								status="success"
							/>
							<p class="kg-builder__status-line">
								<strong>{{ buildStatusLabel }}</strong>
							</p>
							<p v-if="buildStage" class="kg-builder__status-line">
								{{ t('message.pages.knowledge.builder.buildStage', { stage: buildStage }) }}
							</p>
							<p v-if="buildDocId" class="kg-builder__status-line kg-builder__doc-id">
								{{ t('message.pages.knowledge.builder.docId') }}: {{ buildDocId }}
							</p>
							<p v-if="hasBuilt" class="kg-builder__readonly-hint">
								{{ t('message.pages.knowledge.builder.readonlyHint') }}
							</p>
						</template>
					</div>
				</section>
			</div>

			<div class="kg-builder__right">
				<section class="kg-builder__preview kg-glass">
					<div class="kg-builder__card-head">
						<div>
							<el-icon><VideoPlay /></el-icon>
							<span>{{ t('message.pages.knowledge.builder.preview') }}</span>
						</div>
					</div>
					<div ref="containerRef" class="kg-builder__canvas">
						<div v-if="graphLoading" class="kg-builder__preview-empty">
							<el-icon class="is-spin"><Loading /></el-icon>
							<p>{{ t('message.pages.knowledge.graph.loading') }}</p>
						</div>
						<div v-else-if="graphError" class="kg-builder__preview-empty">
							<p>{{ graphError }}</p>
							<button
								type="button"
								class="kg-builder__retry"
								@click="buildJobId ? reloadResult() : loadBaseGraph()"
							>
								{{ t('message.pages.knowledge.graph.retry') }}
							</button>
						</div>
						<div v-else-if="!graphNodes.length" class="kg-builder__preview-empty">
							<el-icon><Share /></el-icon>
							<p>{{ t('message.pages.knowledge.builder.previewEmpty') }}</p>
						</div>
						<template v-else>
							<svg ref="svgRef" class="kg-builder__svg" />
							<div class="kg-builder__type-legend">
								<div class="kg-builder__type-legend-title">
									<el-icon><Filter /></el-icon>
									{{ t('message.pages.knowledge.graph.nodeFilter') }}
								</div>
								<button
									v-for="[type, cfg] in legendTypesInGraph"
									:key="type"
									type="button"
									class="kg-builder__type-legend-item"
									:class="{ 'is-off': !visibleTypes.has(type) }"
									@click="toggleType(type)"
								>
									<span class="kg-builder__type-legend-dot" :style="{ background: cfg.color }">{{ cfg.icon }}</span>
									<span>{{ cfg.label }}</span>
								</button>
							</div>
						</template>
					</div>
				</section>

				<aside v-if="selectedNode" class="kg-builder__detail kg-glass">
					<header class="kg-builder__detail-head">
						<div class="kg-builder__detail-top">
							<span class="kg-builder__type-badge" :style="{ background: legendFor(selectedNode).color }">
								{{ legendFor(selectedNode).icon }}
								{{ legendFor(selectedNode).label }}
							</span>
							<button type="button" class="kg-builder__detail-close" @click="clearSelection">
								<el-icon><Close /></el-icon>
							</button>
						</div>
						<h3>{{ selectedNode.label }}</h3>
						<code>{{ selectedNode.id }}</code>
					</header>
					<div class="kg-builder__detail-body">
						<ul v-if="selectedNodeProperties.length" class="kg-builder__props">
							<li v-for="(row, i) in selectedNodeProperties" :key="i">
								<span>{{ row.key }}</span>
								<strong>{{ row.value }}</strong>
							</li>
						</ul>
						<p v-else class="kg-builder__detail-empty">{{ t('message.pages.knowledge.builder.noProperties') }}</p>
						<h4>
							<el-icon><Share /></el-icon>
							{{ t('message.pages.knowledge.graph.relations') }}
						</h4>
						<ul v-if="relatedLinks.length" class="kg-builder__relations">
							<li
								v-for="(rel, i) in relatedLinks"
								:key="i"
								@click="onRelatedNodeClick(rel.node)"
							>
								<div class="kg-builder__rel-meta">
									<span class="kg-builder__rel-label">{{ rel.isSource ? rel.link.label : `${rel.link.label} (${t('message.pages.knowledge.graph.passive')})` }}</span>
									<span :style="{ color: legendFor(rel.node).color }">
										{{ legendFor(rel.node).icon }} {{ legendFor(rel.node).label }}
									</span>
								</div>
								<span class="kg-builder__rel-name">{{ rel.node.label }}</span>
							</li>
						</ul>
						<p v-else class="kg-builder__detail-empty">{{ t('message.pages.knowledge.builder.noRelations') }}</p>
					</div>
				</aside>

				<aside v-else-if="selectedLink" class="kg-builder__detail kg-glass">
					<header class="kg-builder__detail-head">
						<div class="kg-builder__detail-top">
							<span class="kg-builder__rel-badge">{{ selectedLink.label }}</span>
							<button type="button" class="kg-builder__detail-close" @click="clearSelection">
								<el-icon><Close /></el-icon>
							</button>
						</div>
						<h3>{{ t('message.pages.knowledge.builder.relationDetail') }}</h3>
					</header>
					<div class="kg-builder__detail-body">
						<ul class="kg-builder__props">
							<li>
								<span>{{ t('message.pages.knowledge.builder.relationType') }}</span>
								<strong>{{ selectedLink.label }}</strong>
							</li>
							<li>
								<span>{{ t('message.pages.knowledge.builder.relationSource') }}</span>
								<strong>{{ linkEndpointLabel(selectedLink.source) }}</strong>
							</li>
							<li>
								<span>{{ t('message.pages.knowledge.builder.relationTarget') }}</span>
								<strong>{{ linkEndpointLabel(selectedLink.target) }}</strong>
							</li>
						</ul>
						<button type="button" class="kg-builder__detail-jump" @click="focusLinkEndpoint('source')">
							{{ t('message.pages.knowledge.builder.viewSourceEntity') }}
						</button>
						<button type="button" class="kg-builder__detail-jump" @click="focusLinkEndpoint('target')">
							{{ t('message.pages.knowledge.builder.viewTargetEntity') }}
						</button>
					</div>
				</aside>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts" name="KnowledgeGraphBuilder">
import { computed, nextTick, onMounted, onUnmounted, ref, shallowRef, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { ElMessage } from 'element-plus';
import type { UploadFile } from 'element-plus';
import * as d3 from 'd3';
import { CircleCheck, Close, Document, Filter, Loading, Service, Share, Upload, VideoPlay } from '@element-plus/icons-vue';
import {
	extractKgAgentError,
	kgBuildResult,
	kgBuildUploadAndWait,
	kgFetchGraphOverview,
	type GraphTypeLegendItem,
} from '/@/api/business/kgAgent';
import {
	FALLBACK_LEGEND,
	mapApiLink,
	mapApiNode,
	nodeRadius,
	visibleGraph,
} from '/@/views/system/common/graph/utils';
import type { GraphLink, GraphNode } from '/@/views/system/common/graph/types';

const { t } = useI18n();

const sourceText = ref('');
const uploadFile = ref<File | null>(null);
const isBuilding = ref(false);
const hasBuilt = ref(false);
const buildJobId = ref<number | null>(null);
const buildDocId = ref('');
const buildStage = ref('');
const buildStatus = ref('');
const buildProgress = ref(-1);

const graphNodes = ref<GraphNode[]>([]);
const graphLinks = ref<GraphLink[]>([]);
const typeLegend = ref<Record<string, GraphTypeLegendItem>>({ ...FALLBACK_LEGEND });

const BUILDER_OVERVIEW_LIMIT = 80;

const graphLoading = ref(true);
const graphError = ref('');

const containerRef = ref<HTMLDivElement | null>(null);
const svgRef = ref<SVGSVGElement | null>(null);

let simulation: d3.Simulation<GraphNode, d3.SimulationLinkDatum<GraphNode>> | null = null;
let resizeObserver: ResizeObserver | null = null;

const typeLegendConfig = computed(() => ({ ...FALLBACK_LEGEND, ...typeLegend.value }));
const visibleTypes = ref<Set<string>>(new Set(Object.keys(FALLBACK_LEGEND)));

const selectedNode = shallowRef<GraphNode | null>(null);
const selectedLink = shallowRef<GraphLink | null>(null);
const selectedNodeRef = ref<GraphNode | null>(null);

const canBuild = computed(() => Boolean(uploadFile.value || sourceText.value.trim()));

const legendTypesInGraph = computed(() => {
	const keys = new Set<string>();
	for (const n of graphNodes.value) {
		keys.add(n.vizType || 'other');
	}
	if (!keys.size) keys.add('other');
	return [...keys]
		.sort()
		.map((type) => [type, typeLegendConfig.value[type] || FALLBACK_LEGEND.other] as const);
});

const selectedNodeProperties = computed(() => {
	const node = selectedNode.value;
	if (!node?.properties) return [];
	const skip = new Set(['id', 'name', 'biz_node_id', 'gdb_timestamp']);
	return Object.entries(node.properties)
		.filter(([k, v]) => !skip.has(k) && v != null && String(v).trim() !== '')
		.slice(0, 12)
		.map(([key, value]) => ({ key, value: String(value) }));
});

const relatedLinks = computed(() => {
	if (!selectedNode.value) return [];
	return graphLinks.value
		.map((l) => {
			const sId = linkNodeId(l.source);
			const tId = linkNodeId(l.target);
			if (sId !== selectedNode.value!.id && tId !== selectedNode.value!.id) return null;
			const isSource = sId === selectedNode.value!.id;
			const relatedId = isSource ? tId : sId;
			const node = graphNodes.value.find((n) => n.id === relatedId);
			if (!node) return null;
			return { link: l, node, isSource };
		})
		.filter(Boolean) as { link: GraphLink; node: GraphNode; isSource: boolean }[];
});

const buildStatusLabel = computed(() => {
	const s = buildStatus.value;
	if (s === 'success' || s === 'partial_success') return t('message.pages.knowledge.builder.buildSuccess');
	if (s === 'failed') return t('message.pages.knowledge.builder.buildFailed');
	if (s === 'running') return t('message.pages.knowledge.builder.buildRunning');
	return t('message.pages.knowledge.builder.buildQueued');
});

function legendFor(node: GraphNode): GraphTypeLegendItem {
	return typeLegendConfig.value[node.vizType] || typeLegendConfig.value[node.spgType] || FALLBACK_LEGEND.other;
}

function linkNodeId(endpoint: string | GraphNode): string {
	return typeof endpoint === 'string' ? endpoint : endpoint.id;
}

function syncVisibleTypes() {
	const keys = new Set<string>();
	for (const n of graphNodes.value) {
		keys.add(n.vizType || 'other');
	}
	if (!keys.size) keys.add('other');
	visibleTypes.value = keys;
}

function toggleType(type: string) {
	const next = new Set(visibleTypes.value);
	if (next.has(type)) next.delete(type);
	else next.add(type);
	if (!next.size) return;
	visibleTypes.value = next;
	nextTick(() => buildPreview());
}

function clearSelection() {
	selectedNode.value = null;
	selectedLink.value = null;
	updatePreviewStyles();
}

function onNodeClick(node: GraphNode) {
	selectedLink.value = null;
	selectedNode.value = node;
	updatePreviewStyles();
}

function onLinkClick(link: GraphLink) {
	selectedNode.value = null;
	selectedLink.value = link;
	updatePreviewStyles();
}

function onRelatedNodeClick(node: GraphNode) {
	onNodeClick(node);
}

function linkEndpointLabel(endpoint: string | GraphNode): string {
	const id = linkNodeId(endpoint);
	return graphNodes.value.find((n) => n.id === id)?.label || id;
}

function focusLinkEndpoint(which: 'source' | 'target') {
	const link = selectedLink.value;
	if (!link) return;
	const id = linkNodeId(which === 'source' ? link.source : link.target);
	const node = graphNodes.value.find((n) => n.id === id);
	if (node) onNodeClick(node);
}

function handleFileChange(file: UploadFile) {
	uploadFile.value = file.raw ?? null;
}

function handleFileRemove() {
	uploadFile.value = null;
}

function applySubgraph(payload: { nodes?: unknown[]; links?: unknown[]; typeLegend?: Record<string, GraphTypeLegendItem> }) {
	graphNodes.value = (payload.nodes || []).map((n) => mapApiNode(n as Parameters<typeof mapApiNode>[0]));
	graphLinks.value = (payload.links || []).map((l, i) => {
		const mapped = mapApiLink(l as Parameters<typeof mapApiLink>[0], i);
		return { source: mapped.source, target: mapped.target, label: mapped.label };
	});
	typeLegend.value = { ...FALLBACK_LEGEND, ...(payload.typeLegend || {}) };
	syncVisibleTypes();
}

async function loadBaseGraph() {
	graphLoading.value = true;
	graphError.value = '';
	hasBuilt.value = false;
	try {
		const payload = await kgFetchGraphOverview({ limit: BUILDER_OVERVIEW_LIMIT, maxDocs: 20 });
		applySubgraph(payload);
		const docCount = payload.mergedDocCount ?? 0;
		if (docCount <= 1) {
			ElMessage.info(t('message.pages.knowledge.builder.overviewSingleDoc'));
		} else {
			ElMessage.success(t('message.pages.knowledge.builder.overviewMultiDoc', { n: docCount }));
		}
		if (payload.truncated) {
			ElMessage.warning(t('message.pages.knowledge.graph.truncated'));
		}
		await nextTick();
		buildPreview();
	} catch (err) {
		graphError.value = extractKgAgentError(err, t('message.pages.knowledge.builder.overviewLoadFailed'));
		console.error(err);
	} finally {
		graphLoading.value = false;
	}
}

async function reloadResult() {
	if (!buildJobId.value) return;
	graphLoading.value = true;
	graphError.value = '';
	try {
		const res = await kgBuildResult(buildJobId.value);
		applySubgraph(res.subgraph);
		hasBuilt.value = true;
		await nextTick();
		buildPreview();
	} catch (err) {
		graphError.value = t('message.pages.knowledge.graph.loadFailed');
		console.error(err);
	} finally {
		graphLoading.value = false;
	}
}

async function handleBuild() {
	if (!canBuild.value) return;
	isBuilding.value = true;
	hasBuilt.value = false;
	clearSelection();
	buildProgress.value = -1;
	graphError.value = '';
	buildStatus.value = 'queued';
	buildStage.value = '';
	try {
		const { result, status, job } = await kgBuildUploadAndWait({
			file: uploadFile.value ?? undefined,
			content: uploadFile.value ? undefined : sourceText.value,
		});
		buildJobId.value = job.job_id;
		buildDocId.value = job.doc_id;
		buildStatus.value = status.status;
		buildStage.value = status.current_stage || '';
		if (status.error) {
			buildStage.value = status.error;
		}
		buildProgress.value = 100;
		if (result?.subgraph) {
			applySubgraph(result.subgraph);
			hasBuilt.value = true;
			ElMessage.success(
				t('message.pages.knowledge.builder.buildDone', {
					n: result.stats.nodeCount,
					l: result.stats.edgeCount,
				})
			);
			await nextTick();
			buildPreview();
		}
	} catch (err: unknown) {
		buildStatus.value = 'failed';
		const msg = err instanceof Error ? err.message : t('message.pages.knowledge.builder.buildFailedMsg');
		ElMessage.error(msg);
		console.error(err);
	} finally {
		isBuilding.value = false;
	}
}

function extractLinkStyle() {
	return { stroke: '#94a3b8', dash: 'none', width: 2, marker: 'url(#kgb-arrow-existing)' };
}

function extractStroke() {
	return { color: '#fff', dash: 'none', width: 2 };
}

const linkedByIndex = computed(() => {
	const map: Record<string, boolean> = {};
	graphLinks.value.forEach((l) => {
		const s = linkNodeId(l.source);
		const t = linkNodeId(l.target);
		map[`${s},${t}`] = true;
		map[`${t},${s}`] = true;
	});
	return map;
});

function isConnected(a: GraphNode | string, b: GraphNode | string) {
	const aId = typeof a === 'string' ? a : a.id;
	const bId = typeof b === 'string' ? b : b.id;
	return linkedByIndex.value[`${aId},${bId}`] || aId === bId;
}

function updatePreviewStyles() {
	if (!svgRef.value) return;
	const svg = d3.select(svgRef.value);
	const node = svg.selectAll<SVGGElement, GraphNode>('.node-group');
	const link = svg.selectAll<SVGLineElement, GraphLink>('.links line');
	const linkText = svg.selectAll<SVGTextElement, GraphLink>('.link-labels text');
	const selected = selectedNodeRef.value;

	if (selected) {
		node.style('opacity', (d) => (isConnected(selected, d) ? '1' : '0.15'));
		link.style('opacity', (d) => {
			const sId = linkNodeId(d.source as GraphNode);
			const tId = linkNodeId(d.target as GraphNode);
			return sId === selected.id || tId === selected.id ? '1' : '0.15';
		});
		linkText.style('opacity', (d) => {
			const sId = linkNodeId(d.source as GraphNode);
			const tId = linkNodeId(d.target as GraphNode);
			return sId === selected.id || tId === selected.id ? '1' : '0.15';
		});
		node.select('circle').attr('stroke', (d) => (d.id === selected.id ? '#1e293b' : '#fff')).attr('stroke-width', (d) => (d.id === selected.id ? 4 : 2));
	} else if (selectedLink.value) {
		const sel = selectedLink.value;
		const sId = linkNodeId(sel.source);
		const tId = linkNodeId(sel.target);
		node.style('opacity', (d) => (d.id === sId || d.id === tId ? '1' : '0.15'));
		link.style('opacity', (d) => {
			const ds = linkNodeId(d.source as GraphNode);
			const dt = linkNodeId(d.target as GraphNode);
			return (ds === sId && dt === tId) || (ds === tId && dt === sId) ? '1' : '0.15';
		});
		linkText.style('opacity', (d) => {
			const ds = linkNodeId(d.source as GraphNode);
			const dt = linkNodeId(d.target as GraphNode);
			return (ds === sId && dt === tId) || (ds === tId && dt === sId) ? '1' : '0.15';
		});
	} else {
		node.style('opacity', '1');
		link.style('opacity', '1');
		linkText.style('opacity', '1');
		node.select('circle').attr('stroke', '#fff').attr('stroke-width', 2);
	}
}

function buildPreview() {
	if (!svgRef.value || !containerRef.value || graphLoading.value || !graphNodes.value.length) return;
	simulation?.stop();

	const { nodes: displayNodes, links: displayLinks } = visibleGraph(
		graphNodes.value as Parameters<typeof visibleGraph>[0],
		graphLinks.value as Parameters<typeof visibleGraph>[1]
	);
	const filteredNodes = displayNodes.filter((n) => visibleTypes.value.has(n.vizType || 'other'));
	const nodeIds = new Set(filteredNodes.map((n) => n.id));
	const filteredLinks = displayLinks.filter((l) => {
		const s = linkNodeId(l.source);
		const t = linkNodeId(l.target);
		return nodeIds.has(s) && nodeIds.has(t);
	});
	if (!filteredNodes.length) return;

	const width = containerRef.value.clientWidth;
	const height = containerRef.value.clientHeight || 500;
	const svg = d3.select(svgRef.value);
	svg.selectAll('*').remove();
	svg.attr('width', width).attr('height', height);

	const colorScale = d3.scaleOrdinal<string>().range(d3.schemeTableau10);
	const simNodes = filteredNodes.map((d) => ({ ...d }));
	const simLinks = filteredLinks.map((d) => ({ ...d }));

	const g = svg.append('g');
	const zoom = d3
		.zoom<SVGSVGElement, unknown>()
		.scaleExtent([0.2, 3])
		.on('zoom', (event) => {
			g.attr('transform', event.transform);
		});
	svg.call(zoom);
	svg.call(
		zoom.transform,
		d3.zoomIdentity.translate(width / 2, height / 2).scale(0.75).translate(-width / 2, -height / 2)
	);

	simulation = d3
		.forceSimulation(simNodes)
		.force(
			'link',
			d3
				.forceLink<GraphNode, (typeof simLinks)[0]>(simLinks)
				.id((d) => d.id)
				.distance(110)
		)
		.force('charge', d3.forceManyBody().strength(-550))
		.force('center', d3.forceCenter(width / 2, height / 2))
		.force('collide', d3.forceCollide().radius(52));

	const defs = svg.append('defs');
	(['existing', 'pending', 'approved'] as const).forEach((kind) => {
		const fill = kind === 'existing' ? '#94a3b8' : kind === 'approved' ? '#10b981' : '#f59e0b';
		defs
			.append('marker')
			.attr('id', `kgb-arrow-${kind}`)
			.attr('viewBox', '-0 -5 10 10')
			.attr('refX', 26)
			.attr('refY', 0)
			.attr('orient', 'auto')
			.attr('markerWidth', 6)
			.attr('markerHeight', 6)
			.append('path')
			.attr('d', 'M 0,-5 L 10 ,0 L 0,5')
			.attr('fill', fill);
	});

	const linkG = g.append('g').attr('class', 'links');
	const link = linkG
		.selectAll('line')
		.data(simLinks)
		.enter()
		.append('line')
		.attr('stroke', extractLinkStyle().stroke)
		.attr('stroke-width', extractLinkStyle().width)
		.attr('stroke-dasharray', extractLinkStyle().dash)
		.attr('marker-end', extractLinkStyle().marker)
		.style('cursor', 'pointer')
		.on('click', (event, d) => {
			event.stopPropagation();
			onLinkClick(d);
		});

	const linkTextG = g.append('g').attr('class', 'link-labels');
	const linkText = linkTextG
		.selectAll('text')
		.data(simLinks)
		.enter()
		.append('text')
		.attr('class', 'link-label')
		.attr('font-size', '10px')
		.attr('fill', '#64748b')
		.attr('text-anchor', 'middle')
		.style('cursor', 'pointer')
		.style('pointer-events', 'all')
		.text((d) => d.label)
		.on('click', (event, d) => {
			event.stopPropagation();
			onLinkClick(d);
		});

	const node = g
		.selectAll<SVGGElement, GraphNode>('g.node-group')
		.data(simNodes)
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
		);

	node
		.append('circle')
		.attr('r', (d) => nodeRadius(String(d.vizType)))
		.attr('fill', (d) => legendFor(d).color || colorScale(String(d.group)))
		.attr('stroke', extractStroke().color)
		.attr('stroke-width', extractStroke().width)
		.attr('stroke-dasharray', extractStroke().dash)
		.style('cursor', 'pointer')
		.style('filter', 'drop-shadow(0 4px 6px rgba(0,0,0,0.08))')
		.on('click', (event, d) => {
			event.stopPropagation();
			onNodeClick(d);
		});

	node
		.append('text')
		.attr('text-anchor', 'middle')
		.attr('dominant-baseline', 'central')
		.attr('font-size', '14px')
		.attr('fill', '#fff')
		.attr('pointer-events', 'none')
		.text((d) => legendFor(d).icon);

	node
		.append('text')
		.attr('dy', (d) => nodeRadius(String(d.vizType)) + 14)
		.attr('text-anchor', 'middle')
		.attr('font-size', '11px')
		.attr('font-weight', '600')
		.attr('fill', '#1e293b')
		.text((d) => (d.label.length > 14 ? `${d.label.slice(0, 14)}…` : d.label));

	simulation.on('tick', () => {
		link
			.attr('x1', (d) => (d.source as GraphNode).x!)
			.attr('y1', (d) => (d.source as GraphNode).y!)
			.attr('x2', (d) => (d.target as GraphNode).x!)
			.attr('y2', (d) => (d.target as GraphNode).y!);
		linkText
			.attr('x', (d) => ((d.source as GraphNode).x! + (d.target as GraphNode).x!) / 2)
			.attr('y', (d) => ((d.source as GraphNode).y! + (d.target as GraphNode).y!) / 2 - 5);
		node.attr('transform', (d) => `translate(${d.x},${d.y})`);
	});

	svg.on('click', () => clearSelection());
	updatePreviewStyles();
}

watch(selectedNode, (n) => {
	selectedNodeRef.value = n;
	updatePreviewStyles();
});

watch([graphNodes, graphLinks], () => {
	if (!graphLoading.value && graphNodes.value.length) {
		nextTick(() => buildPreview());
	}
});

onMounted(async () => {
	await loadBaseGraph();
	if (containerRef.value) {
		resizeObserver = new ResizeObserver(() => buildPreview());
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

.kg-builder {
	display: flex;
	flex-direction: column;
	gap: 20px;
	height: 800px;
	min-height: 640px;
}

.kg-builder__top {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 16px;
	padding: 16px 20px;
	background: rgba(0, 0, 0, 0.02);
	border: 1px solid rgba(0, 0, 0, 0.06);
	border-radius: 12px;
	flex-wrap: wrap;
	h2 {
		margin: 0;
		display: flex;
		align-items: center;
		gap: 8px;
		font-size: 18px;
		font-weight: 700;
		color: #0f172a;
	}
	p {
		margin: 6px 0 0;
		font-size: 13px;
		color: #64748b;
	}
}

.kg-builder__save {
	display: inline-flex;
	align-items: center;
	gap: 6px;
	height: 38px;
	padding: 0 18px;
	border: none;
	border-radius: 6px;
	background: #1a1a1a;
	color: #fff;
	font-size: 14px;
	font-weight: 500;
	cursor: pointer;
	box-shadow: 0 2px 6px rgba(0, 0, 0, 0.12);
	&:hover:not(:disabled) {
		background: #333;
	}
	&:disabled {
		background: #e2e8f0;
		color: #94a3b8;
		cursor: not-allowed;
		box-shadow: none;
	}
	.is-spin {
		animation: kg-spin 0.8s linear infinite;
	}
}

.kg-builder__body {
	flex: 1;
	min-height: 0;
	display: flex;
	gap: 20px;
}

.kg-builder__left {
	width: 33.333%;
	min-width: 280px;
	max-width: 400px;
	display: flex;
	flex-direction: column;
	gap: 16px;
	min-height: 0;
}

.kg-builder__card {
	display: flex;
	flex-direction: column;
	overflow: hidden;
	&.kg-builder__review {
		flex: 1;
		min-height: 0;
	}
}

.kg-builder__card-head {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 8px;
	padding: 12px 16px;
	border-bottom: 1px solid rgba(0, 0, 0, 0.06);
	background: rgba(0, 0, 0, 0.02);
	font-size: 14px;
	font-weight: 600;
	color: #0f172a;
	> div:first-child {
		display: flex;
		align-items: center;
		gap: 8px;
	}
}

.kg-builder__approve-all {
	border: 1px solid rgba(0, 0, 0, 0.1);
	background: #fff;
	padding: 4px 10px;
	border-radius: 6px;
	font-size: 12px;
	color: #334155;
	cursor: pointer;
	&:hover {
		background: #f8fafc;
	}
}

.kg-builder__card-body {
	padding: 16px;
	display: flex;
	flex-direction: column;
	gap: 12px;
}

.kg-builder__textarea {
	width: 100%;
	min-height: 120px;
	padding: 12px;
	border: 1px solid rgba(0, 0, 0, 0.1);
	border-radius: 8px;
	font-size: 13px;
	line-height: 1.55;
	resize: none;
	outline: none;
	font-family: inherit;
	&:focus {
		border-color: rgba(59, 130, 246, 0.5);
	}
}

.kg-builder__upload {
	width: 100%;
	:deep(.el-upload) {
		width: 100%;
	}
}

.kg-builder__upload-btn {
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 6px;
	width: 100%;
	height: 36px;
	border: 1px dashed rgba(0, 0, 0, 0.15);
	border-radius: 8px;
	background: #fafafa;
	color: #475569;
	font-size: 13px;
	cursor: pointer;
	&:hover {
		border-color: #94a3b8;
		background: #f8fafc;
	}
}

.kg-builder__upload-hint {
	margin: 0;
	font-size: 11px;
	color: #94a3b8;
}

.kg-builder__extract {
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 8px;
	width: 100%;
	height: 40px;
	border: none;
	border-radius: 6px;
	background: #1a1a1a;
	color: #fff;
	font-size: 14px;
	font-weight: 500;
	cursor: pointer;
	&:hover:not(:disabled) {
		background: #333;
	}
	&:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}
	.is-spin {
		animation: kg-spin 0.8s linear infinite;
	}
}

@keyframes kg-spin {
	to {
		transform: rotate(360deg);
	}
}

.kg-builder__tabs {
	display: flex;
	border-bottom: 1px solid rgba(0, 0, 0, 0.06);
	button {
		flex: 1;
		border: none;
		background: transparent;
		padding: 10px;
		font-size: 13px;
		font-weight: 500;
		color: #64748b;
		cursor: pointer;
		border-bottom: 2px solid transparent;
		&.is-active {
			color: #0f172a;
			border-bottom-color: #1a1a1a;
		}
		&:not(.is-active):hover {
			color: #334155;
		}
	}
}

.kg-builder__status-line {
	margin: 0;
	font-size: 13px;
	color: #475569;
}
.kg-builder__doc-id {
	font-family: ui-monospace, monospace;
	font-size: 11px;
	word-break: break-all;
}
.kg-builder__readonly-hint {
	margin: 0;
	font-size: 12px;
	color: #64748b;
	line-height: 1.5;
}

.kg-builder__review-body {
	flex: 1;
	overflow-y: auto;
	padding: 10px;
	background: #f8fafc;
	display: flex;
	flex-direction: column;
	gap: 8px;
	min-height: 0;
}

.kg-builder__empty,
.kg-builder__preview-empty {
	flex: 1;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	color: #94a3b8;
	opacity: 0.85;
	.el-icon {
		font-size: 48px;
		margin-bottom: 8px;
	}
	p {
		margin: 0;
		font-size: 14px;
	}
}

.kg-builder__retry {
	margin-top: 12px;
	padding: 6px 14px;
	border: 1px solid rgba(0, 0, 0, 0.12);
	border-radius: 6px;
	background: #fff;
	cursor: pointer;
	font-size: 13px;
}

.kg-builder__item {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 8px;
	padding: 12px;
	border-radius: 8px;
	border: 1px solid rgba(0, 0, 0, 0.08);
	background: #fff;
	&.is-approved {
		background: rgba(16, 185, 129, 0.06);
		border-color: #a7f3d0;
	}
	&.is-rejected {
		background: rgba(239, 68, 68, 0.04);
		border-color: #fecaca;
		opacity: 0.55;
	}
	&--link {
		flex-direction: column;
		align-items: stretch;
	}
}

.kg-builder__item-tags {
	display: flex;
	gap: 6px;
	margin-bottom: 4px;
}

.kg-builder__type-tag {
	font-size: 10px;
	font-weight: 600;
	padding: 2px 6px;
	border: 1px solid;
	border-radius: 4px;
}

.kg-builder__pending-tag {
	font-size: 10px;
	padding: 2px 6px;
	border-radius: 4px;
	background: #fef3c7;
	color: #b45309;
}

.kg-builder__item-input {
	width: 100%;
	border: 1px solid transparent;
	border-radius: 4px;
	padding: 2px 4px;
	font-size: 14px;
	font-weight: 500;
	color: #0f172a;
	background: transparent;
	outline: none;
	&:focus {
		border-color: rgba(59, 130, 246, 0.4);
		background: #fff;
	}
}

.kg-builder__item-actions {
	display: flex;
	gap: 4px;
	flex-shrink: 0;
	button {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 28px;
		height: 28px;
		border: none;
		border-radius: 6px;
		cursor: pointer;
		&.is-sm {
			width: 24px;
			height: 24px;
		}
		&.is-ok {
			background: rgba(16, 185, 129, 0.12);
			color: #059669;
		}
		&.is-no {
			background: rgba(239, 68, 68, 0.1);
			color: #dc2626;
		}
	}
}

.kg-builder__link-top {
	display: flex;
	align-items: center;
	justify-content: space-between;
}

.kg-builder__rel-tag {
	font-size: 11px;
	font-weight: 600;
	padding: 2px 8px;
	border-radius: 4px;
	background: #e2e8f0;
	color: #475569;
}

.kg-builder__link-path {
	display: flex;
	align-items: center;
	gap: 6px;
	font-size: 12px;
	color: #64748b;
	margin-top: 6px;
}

.kg-builder__right {
	flex: 1;
	min-width: 0;
	display: flex;
	gap: 16px;
	min-height: 0;
}

.kg-builder__preview {
	flex: 1;
	min-width: 0;
	display: flex;
	flex-direction: column;
	overflow: hidden;
}

.kg-builder__type-legend {
	position: absolute;
	left: 16px;
	bottom: 16px;
	padding: 12px 14px;
	background: rgba(255, 255, 255, 0.95);
	backdrop-filter: blur(12px);
	border: 1px solid rgba(0, 0, 0, 0.08);
	border-radius: 12px;
	box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
	min-width: 150px;
	display: flex;
	flex-direction: column;
	gap: 6px;
	z-index: 2;
	max-height: 45%;
	overflow-y: auto;
}

.kg-builder__type-legend-title {
	display: flex;
	align-items: center;
	gap: 6px;
	font-size: 11px;
	font-weight: 700;
	color: #64748b;
	text-transform: uppercase;
	letter-spacing: 0.04em;
	margin-bottom: 2px;
}

.kg-builder__type-legend-item {
	display: flex;
	align-items: center;
	gap: 8px;
	border: none;
	background: none;
	font-size: 12px;
	font-weight: 500;
	color: #334155;
	cursor: pointer;
	padding: 2px 0;
	text-align: left;
	&.is-off {
		opacity: 0.4;
		filter: grayscale(1);
	}
}

.kg-builder__type-legend-dot {
	width: 16px;
	height: 16px;
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 9px;
	color: #fff;
	box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
	flex-shrink: 0;
}

.kg-builder__detail {
	width: 300px;
	flex-shrink: 0;
	display: flex;
	flex-direction: column;
	overflow: hidden;
	animation: kg-builder-slide-in 0.25s ease;
}

@keyframes kg-builder-slide-in {
	from {
		opacity: 0;
		transform: translateX(10px);
	}
	to {
		opacity: 1;
		transform: translateX(0);
	}
}

.kg-builder__detail-head {
	padding: 16px;
	border-bottom: 1px solid rgba(0, 0, 0, 0.06);
	h3 {
		margin: 10px 0 6px;
		font-size: 17px;
		font-weight: 700;
		line-height: 1.3;
	}
	code {
		font-size: 11px;
		color: #64748b;
		background: #f1f5f9;
		padding: 2px 6px;
		border-radius: 4px;
		word-break: break-all;
	}
}

.kg-builder__detail-top {
	display: flex;
	align-items: flex-start;
	justify-content: space-between;
	gap: 8px;
}

.kg-builder__type-badge,
.kg-builder__rel-badge {
	display: inline-flex;
	align-items: center;
	gap: 4px;
	padding: 4px 10px;
	border-radius: 6px;
	font-size: 12px;
	font-weight: 600;
	color: #fff;
}

.kg-builder__rel-badge {
	background: #64748b;
}

.kg-builder__detail-close {
	border: none;
	background: #f1f5f9;
	width: 28px;
	height: 28px;
	border-radius: 6px;
	cursor: pointer;
	display: flex;
	align-items: center;
	justify-content: center;
	color: #64748b;
	&:hover {
		background: #e2e8f0;
	}
}

.kg-builder__detail-body {
	flex: 1;
	overflow-y: auto;
	padding: 14px 16px;
	h4 {
		margin: 16px 0 8px;
		font-size: 13px;
		font-weight: 600;
		color: #334155;
		display: flex;
		align-items: center;
		gap: 6px;
	}
}

.kg-builder__detail-empty {
	margin: 0;
	font-size: 12px;
	color: #94a3b8;
}

.kg-builder__props {
	list-style: none;
	margin: 0;
	padding: 0;
	li {
		display: flex;
		justify-content: space-between;
		gap: 8px;
		padding: 8px 0;
		border-bottom: 1px solid rgba(0, 0, 0, 0.05);
		font-size: 12px;
		span {
			color: #64748b;
			flex-shrink: 0;
		}
		strong {
			color: #0f172a;
			text-align: right;
			word-break: break-word;
		}
	}
}

.kg-builder__relations {
	list-style: none;
	margin: 0;
	padding: 0;
	li {
		padding: 10px;
		border-radius: 8px;
		border: 1px solid rgba(0, 0, 0, 0.06);
		margin-bottom: 8px;
		cursor: pointer;
		background: #fff;
		&:hover {
			background: #f8fafc;
			border-color: rgba(59, 130, 246, 0.3);
		}
	}
}

.kg-builder__rel-meta {
	display: flex;
	justify-content: space-between;
	gap: 6px;
	font-size: 11px;
	margin-bottom: 4px;
}

.kg-builder__rel-label {
	color: #64748b;
	font-weight: 600;
}

.kg-builder__rel-name {
	font-size: 13px;
	font-weight: 600;
	color: #0f172a;
}

.kg-builder__detail-jump {
	display: block;
	width: 100%;
	margin-top: 8px;
	padding: 8px 12px;
	border: 1px solid rgba(0, 0, 0, 0.1);
	border-radius: 6px;
	background: #fff;
	font-size: 12px;
	color: #334155;
	cursor: pointer;
	text-align: left;
	&:hover {
		background: #f8fafc;
	}
}

.kg-builder__legend {
	display: flex;
	flex-wrap: wrap;
	gap: 12px;
	font-size: 11px;
	color: #64748b;
	font-weight: 400;
	span {
		display: flex;
		align-items: center;
		gap: 4px;
	}
	i {
		display: inline-block;
		width: 16px;
		height: 3px;
		border-radius: 2px;
		&.is-existing {
			background: #cbd5e1;
		}
		&.is-pending {
			background: repeating-linear-gradient(90deg, #f59e0b 0 4px, transparent 4px 8px);
		}
		&.is-approved {
			background: #10b981;
		}
	}
}

.kg-builder__canvas {
	flex: 1;
	min-height: 0;
	position: relative;
	background: radial-gradient(circle at 50% 50%, #f8fafc 0%, #f1f5f9 100%);
}

.kg-builder__svg {
	width: 100%;
	height: 100%;
	display: block;
}
</style>
