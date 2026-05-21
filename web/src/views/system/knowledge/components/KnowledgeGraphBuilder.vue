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
				:disabled="!canSave"
				@click="handleSaveToGraph"
			>
				<el-icon><FolderChecked /></el-icon>
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
						<button
							type="button"
							class="kg-builder__extract"
							:disabled="isExtracting || !sourceText.trim()"
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
							{{ t('message.pages.knowledge.builder.entities') }} ({{ nodes.length }})
						</button>
						<button
							type="button"
							:class="{ 'is-active': reviewTab === 'links' }"
							@click="reviewTab = 'links'"
						>
							{{ t('message.pages.knowledge.builder.relations') }} ({{ links.length }})
						</button>
					</div>
					<div class="kg-builder__review-body">
						<div v-if="!hasExtracted" class="kg-builder__empty">
							<el-icon><Service /></el-icon>
							<p>{{ t('message.pages.knowledge.builder.waitExtract') }}</p>
						</div>
						<template v-else-if="reviewTab === 'nodes'">
							<div
								v-for="node in nodes"
								:key="node.id"
								class="kg-builder__item"
								:class="`is-${node.status}`"
							>
								<div class="kg-builder__item-main">
									<div class="kg-builder__item-tags">
										<span class="kg-builder__type-tag" :style="{ color: typeCfg(node.type).color, borderColor: typeCfg(node.type).color }">
											{{ typeCfg(node.type).label }}
										</span>
										<span v-if="node.status === 'pending'" class="kg-builder__pending-tag">
											{{ t('message.pages.knowledge.builder.pending') }}
										</span>
									</div>
									<div class="kg-builder__item-label">{{ node.label }}</div>
								</div>
								<div class="kg-builder__item-actions">
									<button
										v-if="node.status !== 'approved'"
										type="button"
										class="is-ok"
										@click="updateNodeStatus(node.id, 'approved')"
									>
										<el-icon><Check /></el-icon>
									</button>
									<button
										v-if="node.status !== 'rejected'"
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
								v-for="link in links"
								:key="link.id"
								class="kg-builder__item kg-builder__item--link"
								:class="`is-${link.status}`"
							>
								<div class="kg-builder__link-top">
									<span class="kg-builder__rel-tag">{{ link.label }}</span>
									<div class="kg-builder__item-actions">
										<button
											v-if="link.status !== 'approved'"
											type="button"
											class="is-ok is-sm"
											@click="updateLinkStatus(link.id, 'approved')"
										>
											<el-icon><Check /></el-icon>
										</button>
										<button
											v-if="link.status !== 'rejected'"
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
						<span><i class="is-pending" /> {{ t('message.pages.knowledge.builder.legendPending') }}</span>
						<span><i class="is-approved" /> {{ t('message.pages.knowledge.builder.legendApproved') }}</span>
					</div>
				</div>
				<div ref="containerRef" class="kg-builder__canvas">
					<div v-if="!hasExtracted" class="kg-builder__preview-empty">
						<el-icon><Share /></el-icon>
						<p>{{ t('message.pages.knowledge.builder.previewEmpty') }}</p>
					</div>
					<svg v-else ref="svgRef" class="kg-builder__svg" />
				</div>
			</section>
		</div>
	</div>
</template>

<script setup lang="ts" name="KnowledgeGraphBuilder">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { ElMessage } from 'element-plus';
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
	VideoPlay,
} from '@element-plus/icons-vue';
import { graphTypeConfig } from '/@/views/system/common/graph/mock';
import type { GraphNodeType } from '/@/views/system/common/graph/types';

type ExtractionStatus = 'pending' | 'approved' | 'rejected';

interface BuilderNode {
	id: string;
	label: string;
	type: GraphNodeType;
	status: ExtractionStatus;
	x?: number;
	y?: number;
	fx?: number | null;
	fy?: number | null;
}

interface BuilderLink {
	id: string;
	source: string;
	target: string;
	label: string;
	status: ExtractionStatus;
}

const { t } = useI18n();

const defaultSource =
	'2024年8月，地铁1号线A型车发生制动盘异常磨损。经排查，根本原因是闸瓦材质过硬，导致摩擦面受损。建议更新检验规范。参考文档：制动盘总成 PFMEA (DOC-001)。';

const sourceText = ref(defaultSource);
const isExtracting = ref(false);
const hasExtracted = ref(false);
const reviewTab = ref<'nodes' | 'links'>('nodes');
const nodes = ref<BuilderNode[]>([]);
const links = ref<BuilderLink[]>([]);

const containerRef = ref<HTMLDivElement | null>(null);
const svgRef = ref<SVGSVGElement | null>(null);

let simulation: d3.Simulation<BuilderNode, d3.SimulationLinkDatum<BuilderNode>> | null = null;

const canSave = computed(
	() => hasExtracted.value && nodes.value.some((n) => n.status === 'approved')
);

function typeCfg(type: GraphNodeType) {
	return graphTypeConfig[type];
}

function nodeLabel(id: string) {
	return nodes.value.find((n) => n.id === id)?.label ?? id;
}

function handleExtract() {
	if (!sourceText.value.trim()) return;
	isExtracting.value = true;
	setTimeout(() => {
		nodes.value = [
			{ id: 'n1', label: '地铁1号线', type: 'Project', status: 'pending' },
			{ id: 'n2', label: 'A型车', type: 'Product', status: 'pending' },
			{ id: 'n3', label: '制动盘', type: 'Component', status: 'pending' },
			{ id: 'n4', label: '闸瓦', type: 'Component', status: 'pending' },
			{ id: 'n5', label: '异常磨损', type: 'Issue', status: 'pending' },
			{ id: 'n6', label: '材质过硬', type: 'Cause', status: 'pending' },
			{ id: 'n7', label: '更新检验规范', type: 'Solution', status: 'pending' },
			{ id: 'n8', label: '制动盘总成 PFMEA', type: 'QualityDoc', status: 'pending' },
		];
		links.value = [
			{ id: 'l1', source: 'n1', target: 'n2', label: '包含', status: 'pending' },
			{ id: 'l2', source: 'n2', target: 'n3', label: '使用', status: 'pending' },
			{ id: 'l3', source: 'n2', target: 'n4', label: '使用', status: 'pending' },
			{ id: 'l4', source: 'n3', target: 'n5', label: '发生', status: 'pending' },
			{ id: 'l5', source: 'n5', target: 'n6', label: '归因于', status: 'pending' },
			{ id: 'l6', source: 'n6', target: 'n7', label: '解决措施', status: 'pending' },
			{ id: 'l7', source: 'n8', target: 'n3', label: '关联部件', status: 'pending' },
			{ id: 'l8', source: 'n8', target: 'n5', label: '预防失效', status: 'pending' },
		];
		isExtracting.value = false;
		hasExtracted.value = true;
		ElMessage.success(t('message.pages.knowledge.builder.extractDone'));
	}, 1500);
}

function updateNodeStatus(id: string, status: ExtractionStatus) {
	nodes.value = nodes.value.map((n) => (n.id === id ? { ...n, status } : n));
}

function updateLinkStatus(id: string, status: ExtractionStatus) {
	links.value = links.value.map((l) => (l.id === id ? { ...l, status } : l));
}

function approveAll() {
	nodes.value = nodes.value.map((n) => ({ ...n, status: 'approved' as ExtractionStatus }));
	links.value = links.value.map((l) => ({ ...l, status: 'approved' as ExtractionStatus }));
	ElMessage.success(t('message.pages.knowledge.builder.approveAllDone'));
}

function handleSaveToGraph() {
	const approvedNodes = nodes.value.filter((n) => n.status === 'approved');
	const approvedLinks = links.value.filter((l) => l.status === 'approved');
	if (!approvedNodes.length) {
		ElMessage.warning(t('message.pages.knowledge.builder.saveEmpty'));
		return;
	}
	ElMessage.success(
		t('message.pages.knowledge.builder.saveDone', {
			n: approvedNodes.length,
			l: approvedLinks.length,
		})
	);
	nodes.value = [];
	links.value = [];
	hasExtracted.value = false;
	sourceText.value = '';
}

function buildPreview() {
	if (!svgRef.value || !containerRef.value || !hasExtracted.value) return;
	simulation?.stop();

	const width = containerRef.value.clientWidth;
	const height = containerRef.value.clientHeight || 500;
	const svg = d3.select(svgRef.value);
	svg.selectAll('*').remove();
	svg.attr('width', width).attr('height', height);

	const displayNodes = nodes.value.filter((n) => n.status !== 'rejected').map((d) => ({ ...d }));
	const nodeIds = new Set(displayNodes.map((n) => n.id));
	const displayLinks = links.value
		.filter((l) => l.status !== 'rejected' && nodeIds.has(l.source) && nodeIds.has(l.target))
		.map((d) => ({ ...d }));

	if (!displayNodes.length) return;

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
		d3.zoomIdentity.translate(width / 2, height / 2).scale(0.8).translate(-width / 2, -height / 2)
	);

	simulation = d3
		.forceSimulation(displayNodes)
		.force(
			'link',
			d3
				.forceLink<BuilderNode, (typeof displayLinks)[0]>(displayLinks)
				.id((d) => d.id)
				.distance(120)
		)
		.force('charge', d3.forceManyBody().strength(-500))
		.force('center', d3.forceCenter(width / 2, height / 2))
		.force('collide', d3.forceCollide().radius(50));

	const defs = svg.append('defs');
	defs
		.append('marker')
		.attr('id', 'kgb-arrow-pending')
		.attr('viewBox', '-0 -5 10 10')
		.attr('refX', 25)
		.attr('refY', 0)
		.attr('orient', 'auto')
		.attr('markerWidth', 6)
		.attr('markerHeight', 6)
		.append('path')
		.attr('d', 'M 0,-5 L 10 ,0 L 0,5')
		.attr('fill', '#f59e0b');
	defs
		.append('marker')
		.attr('id', 'kgb-arrow-approved')
		.attr('viewBox', '-0 -5 10 10')
		.attr('refX', 25)
		.attr('refY', 0)
		.attr('orient', 'auto')
		.attr('markerWidth', 6)
		.attr('markerHeight', 6)
		.append('path')
		.attr('d', 'M 0,-5 L 10 ,0 L 0,5')
		.attr('fill', '#10b981');

	const link = g
		.selectAll('line')
		.data(displayLinks)
		.enter()
		.append('line')
		.attr('stroke', (d) => (d.status === 'approved' ? '#10b981' : '#f59e0b'))
		.attr('stroke-width', (d) => (d.status === 'approved' ? 2 : 1.5))
		.attr('stroke-dasharray', (d) => (d.status === 'pending' ? '4,4' : 'none'))
		.attr('marker-end', (d) => (d.status === 'approved' ? 'url(#kgb-arrow-approved)' : 'url(#kgb-arrow-pending)'));

	const linkText = g
		.selectAll('text')
		.data(displayLinks)
		.enter()
		.append('text')
		.attr('font-size', '10px')
		.attr('fill', (d) => (d.status === 'approved' ? '#059669' : '#d97706'))
		.attr('text-anchor', 'middle')
		.text((d) => d.label);

	const node = g
		.selectAll<SVGGElement, BuilderNode>('g')
		.data(displayNodes)
		.enter()
		.append('g')
		.call(
			d3
				.drag<SVGGElement, BuilderNode>()
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
		.attr('r', 20)
		.attr('fill', (d) => typeCfg(d.type).color)
		.attr('stroke', (d) => (d.status === 'approved' ? '#10b981' : '#f59e0b'))
		.attr('stroke-width', 3)
		.attr('stroke-dasharray', (d) => (d.status === 'pending' ? '4,4' : 'none'))
		.style('cursor', 'pointer');

	node
		.append('text')
		.attr('text-anchor', 'middle')
		.attr('dominant-baseline', 'central')
		.attr('font-size', '14px')
		.attr('fill', '#fff')
		.attr('pointer-events', 'none')
		.text((d) => typeCfg(d.type).icon);

	node
		.append('text')
		.attr('dy', 32)
		.attr('text-anchor', 'middle')
		.attr('font-size', '12px')
		.attr('font-weight', '600')
		.attr('fill', '#1e293b')
		.text((d) => d.label);

	simulation.on('tick', () => {
		link
			.attr('x1', (d) => (d.source as BuilderNode).x!)
			.attr('y1', (d) => (d.source as BuilderNode).y!)
			.attr('x2', (d) => (d.target as BuilderNode).x!)
			.attr('y2', (d) => (d.target as BuilderNode).y!);
		linkText
			.attr('x', (d) => ((d.source as BuilderNode).x! + (d.target as BuilderNode).x!) / 2)
			.attr('y', (d) => ((d.source as BuilderNode).y! + (d.target as BuilderNode).y!) / 2 - 5);
		node.attr('transform', (d) => `translate(${d.x},${d.y})`);
	});
}

watch([nodes, links, hasExtracted], () => {
	if (hasExtracted.value) {
		setTimeout(buildPreview, 50);
	}
});

let resizeObserver: ResizeObserver | null = null;

onMounted(() => {
	if (containerRef.value) {
		resizeObserver = new ResizeObserver(() => {
			if (hasExtracted.value) buildPreview();
		});
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
	opacity: 0.6;
	.el-icon {
		font-size: 48px;
		margin-bottom: 8px;
	}
	p {
		margin: 0;
		font-size: 14px;
	}
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

.kg-builder__item-label {
	font-size: 14px;
	font-weight: 500;
	color: #0f172a;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.kg-builder__item-main {
	flex: 1;
	min-width: 0;
}

.kg-builder__item-actions {
	display: flex;
	gap: 4px;
	flex-shrink: 0;
	button {
		width: 28px;
		height: 28px;
		border: none;
		border-radius: 6px;
		background: transparent;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		&.is-sm {
			width: 24px;
			height: 24px;
		}
		&.is-ok {
			color: #059669;
			&:hover {
				background: #d1fae5;
			}
		}
		&.is-no {
			color: #dc2626;
			&:hover {
				background: #fee2e2;
			}
		}
	}
}

.kg-builder__link-top {
	display: flex;
	justify-content: space-between;
	align-items: center;
}

.kg-builder__rel-tag {
	font-size: 10px;
	padding: 2px 8px;
	background: #f1f5f9;
	border-radius: 4px;
	color: #64748b;
}

.kg-builder__link-path {
	display: flex;
	align-items: center;
	gap: 6px;
	font-size: 12px;
	color: #64748b;
	span:nth-child(2) {
		color: #cbd5e1;
	}
	span:first-child,
	span:last-child {
		font-weight: 500;
		color: #334155;
		max-width: 42%;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
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
	gap: 12px;
	font-size: 12px;
	color: #64748b;
	span {
		display: inline-flex;
		align-items: center;
		gap: 4px;
	}
	i {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		display: inline-block;
		&.is-pending {
			background: #f59e0b;
		}
		&.is-approved {
			background: #10b981;
		}
	}
}

.kg-builder__canvas {
	flex: 1;
	position: relative;
	background: #f8fafc;
	min-height: 0;
}

.kg-builder__preview-empty {
	position: absolute;
	inset: 0;
}

.kg-builder__svg {
	width: 100%;
	height: 100%;
	cursor: grab;
	&:active {
		cursor: grabbing;
	}
}

@media (max-width: 960px) {
	.kg-builder {
		height: auto;
	}
	.kg-builder__body {
		flex-direction: column;
	}
	.kg-builder__left {
		width: 100%;
		max-width: none;
	}
	.kg-builder__preview {
		min-height: 420px;
	}
}
</style>
