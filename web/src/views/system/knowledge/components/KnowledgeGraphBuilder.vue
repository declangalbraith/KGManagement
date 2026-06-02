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
			<button
				type="button"
				class="kg-builder__save"
				:disabled="!canSave || isSaving"
				@click="handleSaveToGraph"
			>
				<el-icon v-if="isSaving" class="is-spin"><Loading /></el-icon>
				<el-icon v-else><FolderChecked /></el-icon>
				{{ t('message.pages.knowledge.builder.confirmSave') }}
			</button>
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
							accept=".txt,.md,.docx"
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
							:disabled="isExtracting || !canExtract"
							@click="handleExtract"
						>
							<el-icon v-if="isExtracting" class="is-spin"><Loading /></el-icon>
							<el-icon v-else><Service /></el-icon>
							{{ isExtracting ? t('message.pages.knowledge.builder.extracting') : t('message.pages.knowledge.builder.aiExtract') }}
						</button>
					</div>
				</section>

				<section class="kg-builder__card kg-glass kg-builder__review">
					<div class="kg-builder__card-head">
						<div>
							<el-icon><CircleCheck /></el-icon>
							<span>{{ t('message.pages.knowledge.builder.hitl') }}</span>
						</div>
						<button v-if="hasExtracted" type="button" class="kg-builder__approve-all" @click="approveAll">
							{{ t('message.pages.knowledge.builder.approveAll') }}
						</button>
					</div>
					<div class="kg-builder__tabs">
						<button
							type="button"
							:class="{ 'is-active': reviewTab === 'nodes' }"
							@click="reviewTab = 'nodes'"
						>
							{{ t('message.pages.knowledge.builder.entities') }} ({{ reviewNodes.length }})
						</button>
						<button
							type="button"
							:class="{ 'is-active': reviewTab === 'links' }"
							@click="reviewTab = 'links'"
						>
							{{ t('message.pages.knowledge.builder.relations') }} ({{ reviewLinks.length }})
						</button>
					</div>
					<div class="kg-builder__review-body">
						<div v-if="!hasExtracted" class="kg-builder__empty">
							<el-icon><Service /></el-icon>
							<p>{{ t('message.pages.knowledge.builder.waitExtract') }}</p>
						</div>
						<template v-else-if="reviewTab === 'nodes'">
							<div
								v-for="node in reviewNodes"
								:key="node.id"
								class="kg-builder__item"
								:class="`is-${node.reviewStatus || 'pending'}`"
							>
								<div class="kg-builder__item-main">
									<div class="kg-builder__item-tags">
										<span
											class="kg-builder__type-tag"
											:style="{ color: legendFor(node).color, borderColor: legendFor(node).color }"
										>
											{{ legendFor(node).label }}
										</span>
										<span v-if="node.reviewStatus === 'pending'" class="kg-builder__pending-tag">
											{{ t('message.pages.knowledge.builder.pending') }}
										</span>
									</div>
									<input
										v-model="node.label"
										class="kg-builder__item-input"
										@change="syncNodeLabel(node.id, node.label)"
									/>
								</div>
								<div class="kg-builder__item-actions">
									<button
										v-if="node.reviewStatus !== 'approved'"
										type="button"
										class="is-ok"
										@click="updateNodeStatus(node.id, 'approved')"
									>
										<el-icon><Check /></el-icon>
									</button>
									<button
										v-if="node.reviewStatus !== 'rejected'"
										type="button"
										class="is-no"
										@click="updateNodeStatus(node.id, 'rejected')"
									>
										<el-icon><Close /></el-icon>
									</button>
								</div>
							</div>
						</template>
						<template v-else>
							<div
								v-for="link in reviewLinks"
								:key="link.id"
								class="kg-builder__item kg-builder__item--link"
								:class="`is-${link.reviewStatus || 'pending'}`"
							>
								<div class="kg-builder__link-top">
									<span class="kg-builder__rel-tag">{{ link.label }}</span>
									<div class="kg-builder__item-actions">
										<button
											v-if="link.reviewStatus !== 'approved'"
											type="button"
											class="is-ok is-sm"
											@click="updateLinkStatus(link.id, 'approved')"
										>
											<el-icon><Check /></el-icon>
										</button>
										<button
											v-if="link.reviewStatus !== 'rejected'"
											type="button"
											class="is-no is-sm"
											@click="updateLinkStatus(link.id, 'rejected')"
										>
											<el-icon><Close /></el-icon>
										</button>
									</div>
								</div>
								<div class="kg-builder__link-path">
									<span>{{ nodeLabel(link.source) }}</span>
									<span>→</span>
									<span>{{ nodeLabel(link.target) }}</span>
								</div>
							</div>
						</template>
					</div>
				</section>
			</div>

			<section class="kg-builder__preview kg-glass">
				<div class="kg-builder__card-head">
					<div>
						<el-icon><VideoPlay /></el-icon>
						<span>{{ t('message.pages.knowledge.builder.preview') }}</span>
					</div>
					<div class="kg-builder__legend">
						<span><i class="is-existing" /> {{ t('message.pages.knowledge.builder.legendExisting') }}</span>
						<span><i class="is-pending" /> {{ t('message.pages.knowledge.builder.legendPending') }}</span>
						<span><i class="is-approved" /> {{ t('message.pages.knowledge.builder.legendApproved') }}</span>
					</div>
				</div>
				<div ref="containerRef" class="kg-builder__canvas">
					<div v-if="graphLoading" class="kg-builder__preview-empty">
						<el-icon class="is-spin"><Loading /></el-icon>
						<p>{{ t('message.pages.knowledge.graph.loading') }}</p>
					</div>
					<div v-else-if="graphError" class="kg-builder__preview-empty">
						<p>{{ graphError }}</p>
						<button type="button" class="kg-builder__retry" @click="loadBaseGraph">
							{{ t('message.pages.knowledge.graph.retry') }}
						</button>
					</div>
					<div v-else-if="!graphNodes.length" class="kg-builder__preview-empty">
						<el-icon><Share /></el-icon>
						<p>{{ t('message.pages.knowledge.graph.empty') }}</p>
					</div>
					<svg v-else ref="svgRef" class="kg-builder__svg" />
				</div>
			</section>
		</div>
	</div>
</template>

<script setup lang="ts" name="KnowledgeGraphBuilder">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { ElMessage } from 'element-plus';
import type { UploadFile } from 'element-plus';
import * as d3 from 'd3';
import {
	Check,
	CircleCheck,
	Close,
	Document,
	FolderChecked,
	Loading,
	Service,
	Share,
	Upload,
	VideoPlay,
} from '@element-plus/icons-vue';
import {
	fetchGraphSubgraph,
	kagBuildCommit,
	kagBuildExtract,
	type GraphTypeLegendItem,
} from '/@/api/business/kag';
import { BUILDER_OVERVIEW_LIMIT } from '/@/views/system/common/graph/cluster';
import {
	FALLBACK_LEGEND,
	mapApiLink,
	mapApiNode,
	mergeGraphWithExtract,
	nodeRadius,
	visibleGraph,
	type ReviewLink,
	type ReviewNode,
	type ReviewStatus,
} from '/@/views/system/common/graph/utils';

const BUILDER_OVERVIEW_LIMIT = 80;
const { t } = useI18n();

const defaultSource =
	'2024年8月，地铁1号线A型车发生制动盘异常磨损。经排查，根本原因是闸瓦材质过硬，导致摩擦面受损。建议更新检验规范。参考文档：制动盘总成 PFMEA (DOC-001)。';

const sourceText = ref(defaultSource);
const uploadFile = ref<File | null>(null);
const isExtracting = ref(false);
const isSaving = ref(false);
const hasExtracted = ref(false);
const reviewTab = ref<'nodes' | 'links'>('nodes');

const graphNodes = ref<ReviewNode[]>([]);
const graphLinks = ref<ReviewLink[]>([]);
const reviewNodes = ref<ReviewNode[]>([]);
const reviewLinks = ref<ReviewLink[]>([]);
const typeLegend = ref<Record<string, GraphTypeLegendItem>>({ ...FALLBACK_LEGEND });

const graphLoading = ref(true);
const graphError = ref('');

const containerRef = ref<HTMLDivElement | null>(null);
const svgRef = ref<SVGSVGElement | null>(null);

let simulation: d3.Simulation<ReviewNode, d3.SimulationLinkDatum<ReviewNode>> | null = null;
let resizeObserver: ResizeObserver | null = null;

const typeLegendConfig = computed(() => ({ ...FALLBACK_LEGEND, ...typeLegend.value }));

const canExtract = computed(() => Boolean(uploadFile.value || sourceText.value.trim()));
const canSave = computed(() => {
	if (!hasExtracted.value) return false;
	const existingIds = new Set(graphNodes.value.filter((n) => n.origin === 'existing').map((n) => n.id));
	const hasNewNodes = reviewNodes.value.some(
		(n) => n.reviewStatus === 'approved' && !existingIds.has(n.id)
	);
	const hasNewLinks = reviewLinks.value.some(
		(l) => l.origin === 'extract' && l.reviewStatus === 'approved'
	);
	return hasNewNodes || hasNewLinks;
});

function legendFor(node: ReviewNode): GraphTypeLegendItem {
	return typeLegendConfig.value[node.spgType] || FALLBACK_LEGEND.other;
}

function nodeLabel(id: string | ReviewNode) {
	const nodeId = typeof id === 'string' ? id : id.id;
	return (
		graphNodes.value.find((n) => n.id === nodeId)?.label ||
		reviewNodes.value.find((n) => n.id === nodeId)?.label ||
		nodeId
	);
}

function handleFileChange(file: UploadFile) {
	uploadFile.value = file.raw ?? null;
}

function handleFileRemove() {
	uploadFile.value = null;
}

async function loadBaseGraph() {
	graphLoading.value = true;
	graphError.value = '';
	try {
		const payload = await fetchGraphSubgraph({ mode: 'overview', limit: BUILDER_OVERVIEW_LIMIT });
		graphNodes.value = (payload.nodes || []).map((n) => ({ ...mapApiNode(n), origin: 'existing' as const }));
		graphLinks.value = (payload.links || []).map((l, i) => ({
			...mapApiLink(l, i),
			origin: 'existing' as const,
		}));
		typeLegend.value = { ...FALLBACK_LEGEND, ...(payload.typeLegend || {}) };
		if (payload.truncated) {
			ElMessage.warning(t('message.pages.knowledge.graph.truncated'));
		}
		graphLoading.value = false;
		await nextTick();
		buildPreview();
	} catch (err) {
		graphError.value = t('message.pages.knowledge.graph.loadFailed');
		console.error(err);
	} finally {
		graphLoading.value = false;
	}
}

async function handleExtract() {
	if (!canExtract.value) return;
	isExtracting.value = true;
	try {
		const res = await kagBuildExtract({
			content: uploadFile.value ? undefined : sourceText.value,
			file: uploadFile.value ?? undefined,
		});
		const baseNodes = graphNodes.value.filter((n) => n.origin === 'existing');
		const baseLinks = graphLinks.value.filter((l) => l.origin === 'existing');
		const merged = mergeGraphWithExtract(baseNodes, baseLinks, res.subgraph);
		graphNodes.value = merged.nodes;
		graphLinks.value = merged.links;
		reviewNodes.value = merged.reviewNodes;
		reviewLinks.value = merged.reviewLinks;
		typeLegend.value = { ...typeLegend.value, ...merged.typeLegend };
		hasExtracted.value = true;
		ElMessage.success(
			t('message.pages.knowledge.builder.extractDone', {
				n: res.stats.nodeCount,
				l: res.stats.edgeCount,
			})
		);
		await nextTick();
		buildPreview();
	} catch (err: unknown) {
		const msg = err instanceof Error ? err.message : t('message.pages.knowledge.builder.extractFailed');
		ElMessage.error(msg);
		console.error(err);
	} finally {
		isExtracting.value = false;
	}
}

function syncNodeLabel(id: string, label: string) {
	graphNodes.value = graphNodes.value.map((n) => (n.id === id ? { ...n, label } : n));
	reviewNodes.value = reviewNodes.value.map((n) => (n.id === id ? { ...n, label } : n));
	buildPreview();
}

function updateNodeStatus(id: string, status: ReviewStatus) {
	reviewNodes.value = reviewNodes.value.map((n) => (n.id === id ? { ...n, reviewStatus: status } : n));
	graphNodes.value = graphNodes.value.map((n) =>
		n.id === id && n.origin === 'extract' ? { ...n, reviewStatus: status } : n
	);
	buildPreview();
}

function updateLinkStatus(id: string, status: ReviewStatus) {
	reviewLinks.value = reviewLinks.value.map((l) => (l.id === id ? { ...l, reviewStatus: status } : l));
	graphLinks.value = graphLinks.value.map((l) =>
		l.id === id && l.origin === 'extract' ? { ...l, reviewStatus: status } : l
	);
	buildPreview();
}

function approveAll() {
	reviewNodes.value = reviewNodes.value.map((n) => ({ ...n, reviewStatus: 'approved' as ReviewStatus }));
	reviewLinks.value = reviewLinks.value.map((l) => ({ ...l, reviewStatus: 'approved' as ReviewStatus }));
	graphNodes.value = graphNodes.value.map((n) =>
		n.origin === 'extract' ? { ...n, reviewStatus: 'approved' as ReviewStatus } : n
	);
	graphLinks.value = graphLinks.value.map((l) =>
		l.origin === 'extract' ? { ...l, reviewStatus: 'approved' as ReviewStatus } : l
	);
	ElMessage.success(t('message.pages.knowledge.builder.approveAllDone'));
	buildPreview();
}

async function handleSaveToGraph() {
	const existingIds = new Set(graphNodes.value.filter((n) => n.origin === 'existing').map((n) => n.id));
	const newApprovedNodes = reviewNodes.value.filter(
		(n) => n.reviewStatus === 'approved' && !existingIds.has(n.id)
	);
	const approvedExtractLinks = reviewLinks.value.filter(
		(l) => l.origin === 'extract' && l.reviewStatus === 'approved'
	);
	const endpointIds = new Set<string>();
	approvedExtractLinks.forEach((l) => {
		endpointIds.add(String(l.source));
		endpointIds.add(String(l.target));
	});
	const linkedExistingNodes = reviewNodes.value.filter(
		(n) => n.reviewStatus === 'approved' && existingIds.has(n.id) && endpointIds.has(n.id)
	);
	const nodesToCommit = [...newApprovedNodes, ...linkedExistingNodes];
	const commitNodeIds = new Set(nodesToCommit.map((n) => n.id));
	const linksToCommit = approvedExtractLinks.filter(
		(l) => commitNodeIds.has(String(l.source)) && commitNodeIds.has(String(l.target))
	);
	if (!nodesToCommit.length && !linksToCommit.length) {
		ElMessage.warning(t('message.pages.knowledge.builder.saveEmpty'));
		return;
	}
	isSaving.value = true;
	try {
		await kagBuildCommit({
			nodes: nodesToCommit.map((n) => ({
				id: n.id,
				label: n.label,
				spgType: n.spgType,
				vizType: String(n.vizType),
				group: n.group,
				properties: n.properties,
			})),
			links: linksToCommit.map((l) => ({
				source: String(l.source),
				target: String(l.target),
				label: l.label,
			})),
		});
		ElMessage.success(
			t('message.pages.knowledge.builder.saveDone', {
				n: newApprovedNodes.length,
				l: linksToCommit.length,
			})
		);
		hasExtracted.value = false;
		reviewNodes.value = [];
		reviewLinks.value = [];
		uploadFile.value = null;
		sourceText.value = '';
		await loadBaseGraph();
	} catch (err: unknown) {
		const msg = err instanceof Error ? err.message : t('message.pages.knowledge.builder.commitFailed');
		ElMessage.error(msg);
		console.error(err);
	} finally {
		isSaving.value = false;
	}
}

function extractStroke(node: ReviewNode) {
	if (node.origin === 'existing') return { color: '#fff', dash: 'none', width: 2 };
	if (node.reviewStatus === 'approved') return { color: '#10b981', dash: 'none', width: 3 };
	if (node.reviewStatus === 'rejected') return { color: '#ef4444', dash: '4,4', width: 2 };
	return { color: '#f59e0b', dash: '4,4', width: 3 };
}

function extractLinkStyle(link: ReviewLink) {
	if (link.origin === 'existing') {
		return { stroke: '#cbd5e1', dash: 'none', width: 2, marker: 'url(#kgb-arrow-existing)' };
	}
	if (link.reviewStatus === 'approved') {
		return { stroke: '#10b981', dash: 'none', width: 2, marker: 'url(#kgb-arrow-approved)' };
	}
	return { stroke: '#f59e0b', dash: '4,4', width: 1.5, marker: 'url(#kgb-arrow-pending)' };
}

function buildPreview() {
	if (!svgRef.value || !containerRef.value || graphLoading.value || !graphNodes.value.length) return;
	simulation?.stop();

	const { nodes: displayNodes, links: displayLinks } = visibleGraph(graphNodes.value, graphLinks.value);
	if (!displayNodes.length) return;

	const width = containerRef.value.clientWidth;
	const height = containerRef.value.clientHeight || 500;
	const svg = d3.select(svgRef.value);
	svg.selectAll('*').remove();
	svg.attr('width', width).attr('height', height);

	const colorScale = d3.scaleOrdinal<string>().range(d3.schemeTableau10);
	const simNodes = displayNodes.map((d) => ({ ...d }));
	const simLinks = displayLinks.map((d) => ({ ...d }));

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
				.forceLink<ReviewNode, (typeof simLinks)[0]>(simLinks)
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

	const link = g
		.selectAll('line')
		.data(simLinks)
		.enter()
		.append('line')
		.attr('stroke', (d) => extractLinkStyle(d).stroke)
		.attr('stroke-width', (d) => extractLinkStyle(d).width)
		.attr('stroke-dasharray', (d) => extractLinkStyle(d).dash)
		.attr('marker-end', (d) => extractLinkStyle(d).marker);

	const linkText = g
		.selectAll('text.link-label')
		.data(simLinks)
		.enter()
		.append('text')
		.attr('class', 'link-label')
		.attr('font-size', '10px')
		.attr('fill', '#64748b')
		.attr('text-anchor', 'middle')
		.text((d) => d.label);

	const node = g
		.selectAll<SVGGElement, ReviewNode>('g')
		.data(simNodes)
		.enter()
		.append('g')
		.call(
			d3
				.drag<SVGGElement, ReviewNode>()
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
		.attr('stroke', (d) => extractStroke(d).color)
		.attr('stroke-width', (d) => extractStroke(d).width)
		.attr('stroke-dasharray', (d) => extractStroke(d).dash)
		.style('cursor', 'pointer')
		.style('filter', 'drop-shadow(0 4px 6px rgba(0,0,0,0.08))');

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
			.attr('x1', (d) => (d.source as ReviewNode).x!)
			.attr('y1', (d) => (d.source as ReviewNode).y!)
			.attr('x2', (d) => (d.target as ReviewNode).x!)
			.attr('y2', (d) => (d.target as ReviewNode).y!);
		linkText
			.attr('x', (d) => ((d.source as ReviewNode).x! + (d.target as ReviewNode).x!) / 2)
			.attr('y', (d) => ((d.source as ReviewNode).y! + (d.target as ReviewNode).y!) / 2 - 5);
		node.attr('transform', (d) => `translate(${d.x},${d.y})`);
	});
}

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

.kg-builder__preview {
	flex: 1;
	min-width: 0;
	display: flex;
	flex-direction: column;
	overflow: hidden;
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
