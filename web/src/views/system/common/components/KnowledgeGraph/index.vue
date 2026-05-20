<template>
	<div class="kg-graph">
		<div class="kg-graph__toolbar">
			<el-input v-model="searchQuery" placeholder="搜索节点..." clearable style="width: 220px" size="small" />
			<el-checkbox-group v-model="visibleTypeList" size="small">
				<el-checkbox v-for="(cfg, type) in graphTypeConfig" :key="type" :value="type">{{ cfg.label }}</el-checkbox>
			</el-checkbox-group>
			<el-button-group size="small">
				<el-button @click="zoomBy(1.2)"><el-icon><ZoomIn /></el-icon></el-button>
				<el-button @click="zoomBy(0.8)"><el-icon><ZoomOut /></el-icon></el-button>
				<el-button @click="resetView"><el-icon><Refresh /></el-icon></el-button>
			</el-button-group>
		</div>
		<div ref="containerRef" class="kg-graph__canvas">
			<svg ref="svgRef" class="kg-graph__svg" />
		</div>
		<el-card v-if="selectedNode" class="kg-graph__panel" shadow="always">
			<template #header>{{ selectedNode.label }}</template>
			<p><strong>类型</strong>：{{ graphTypeConfig[selectedNode.type].label }}</p>
			<p v-if="selectedNode.occurrences"><strong>出现次数</strong>：{{ selectedNode.occurrences }}</p>
			<p v-if="selectedNode.confidence"><strong>置信度</strong>：{{ (selectedNode.confidence * 100).toFixed(0) }}%</p>
		</el-card>
	</div>
</template>

<script setup lang="ts" name="KnowledgeGraph">
import { onMounted, onUnmounted, ref, shallowRef, watch } from 'vue';
import * as d3 from 'd3';
import { Refresh, ZoomIn, ZoomOut } from '@element-plus/icons-vue';
import type { GraphLink, GraphNode, GraphNodeType } from '../../graph/types';
import { graphTypeConfig, rawGraphLinks, rawGraphNodes } from '../../graph/mock';

const containerRef = ref<HTMLDivElement | null>(null);
const svgRef = ref<SVGSVGElement | null>(null);
const searchQuery = ref('');
const visibleTypeList = ref<GraphNodeType[]>(Object.keys(graphTypeConfig) as GraphNodeType[]);
const selectedNode = shallowRef<GraphNode | null>(null);

let simulation: d3.Simulation<GraphNode, GraphLink> | null = null;
let zoomBehavior: d3.ZoomBehavior<SVGSVGElement, unknown> | null = null;
let zoomLayer: d3.Selection<SVGGElement, unknown, null, undefined> | null = null;

const colorScale = d3.scaleOrdinal<number, string>().domain([1, 2, 3, 4, 5, 6, 7]).range(['#ef4444', '#3b82f6', '#f59e0b', '#10b981', '#a855f7', '#06b6d4', '#4f46e5']);

function buildGraph() {
	if (!svgRef.value || !containerRef.value) return;
	simulation?.stop();

	const width = containerRef.value.clientWidth;
	const height = containerRef.value.clientHeight || 520;
	const svg = d3.select(svgRef.value);
	svg.selectAll('*').remove();
	svg.attr('width', width).attr('height', height);

	const nodes = rawGraphNodes.filter((n) => visibleTypeList.value.includes(n.type)).map((d) => ({ ...d }));
	const nodeIds = new Set(nodes.map((n) => n.id));
	const links = rawGraphLinks
		.filter((l) => {
			const s = typeof l.source === 'string' ? l.source : l.source.id;
			const t = typeof l.target === 'string' ? l.target : l.target.id;
			return nodeIds.has(s) && nodeIds.has(t);
		})
		.map((d) => ({ ...d }));

	const g = svg.append('g');
	zoomLayer = g;

	zoomBehavior = d3.zoom<SVGSVGElement, unknown>().scaleExtent([0.2, 4]).on('zoom', (event) => {
		g.attr('transform', event.transform);
	});
	svg.call(zoomBehavior);

	simulation = d3
		.forceSimulation(nodes)
		.force('link', d3.forceLink<GraphNode, GraphLink>(links).id((d) => d.id).distance(90))
		.force('charge', d3.forceManyBody().strength(-500))
		.force('center', d3.forceCenter(width / 2, height / 2))
		.force('collide', d3.forceCollide().radius(48));

	const link = g
		.selectAll('line')
		.data(links)
		.enter()
		.append('line')
		.attr('stroke', '#cbd5e1')
		.attr('stroke-width', 1.5);

	const node = g
		.selectAll('g')
		.data(nodes)
		.enter()
		.append('g')
		.style('cursor', 'pointer')
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
		.on('click', (_, d) => {
			selectedNode.value = d;
		});

	node
		.append('circle')
		.attr('r', (d) => (d.type === 'Project' || d.type === 'Product' ? 22 : 18))
		.attr('fill', (d) => colorScale(d.group))
		.attr('stroke', '#fff')
		.attr('stroke-width', 2);

	node
		.append('text')
		.attr('text-anchor', 'middle')
		.attr('dy', 4)
		.attr('font-size', 12)
		.attr('fill', '#fff')
		.text((d) => graphTypeConfig[d.type].icon);

	node
		.append('text')
		.attr('dy', 32)
		.attr('text-anchor', 'middle')
		.attr('font-size', 11)
		.attr('fill', 'var(--el-text-color-primary)')
		.text((d) => d.label);

	simulation.on('tick', () => {
		link.attr('x1', (d) => (d.source as GraphNode).x!)
			.attr('y1', (d) => (d.source as GraphNode).y!)
			.attr('x2', (d) => (d.target as GraphNode).x!)
			.attr('y2', (d) => (d.target as GraphNode).y!);
		node.attr('transform', (d) => `translate(${d.x},${d.y})`);
	});
}

function zoomBy(factor: number) {
	if (!svgRef.value || !zoomBehavior) return;
	d3.select(svgRef.value).transition().duration(200).call(zoomBehavior.scaleBy, factor);
}

function resetView() {
	if (!svgRef.value || !zoomBehavior) return;
	d3.select(svgRef.value).transition().duration(300).call(zoomBehavior.transform, d3.zoomIdentity);
	selectedNode.value = null;
}

let resizeObserver: ResizeObserver | null = null;

onMounted(() => {
	buildGraph();
	if (containerRef.value) {
		resizeObserver = new ResizeObserver(() => buildGraph());
		resizeObserver.observe(containerRef.value);
	}
});

onUnmounted(() => {
	simulation?.stop();
	resizeObserver?.disconnect();
});

watch(visibleTypeList, () => {
	selectedNode.value = null;
	buildGraph();
});
</script>

<style scoped lang="scss">
.kg-graph {
	position: relative;
	height: 560px;
	display: flex;
	flex-direction: column;
}
.kg-graph__toolbar {
	display: flex;
	flex-wrap: wrap;
	gap: 12px;
	align-items: center;
	margin-bottom: 8px;
}
.kg-graph__canvas {
	flex: 1;
	border: 1px solid var(--el-border-color-lighter);
	border-radius: 8px;
	overflow: hidden;
	background: var(--el-fill-color-blank);
}
.kg-graph__svg {
	width: 100%;
	height: 100%;
	min-height: 480px;
}
.kg-graph__panel {
	position: absolute;
	right: 12px;
	top: 52px;
	width: 220px;
	z-index: 2;
	p {
		margin: 4px 0;
		font-size: 13px;
	}
}
</style>
