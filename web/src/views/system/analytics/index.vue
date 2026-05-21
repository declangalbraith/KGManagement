<template>
	<div class="kg-analytics">
		<div class="kg-analytics__head">
			<div>
				<h1>{{ t('message.pages.analytics.title') }}</h1>
				<p>{{ t('message.pages.analytics.subtitle') }}</p>
			</div>
			<div>
				<el-button>{{ t('message.pages.analytics.period') }}</el-button>
				<el-button>{{ t('message.pages.analytics.filter') }}</el-button>
				<el-button type="primary" :loading="exporting" @click="doExport">{{ t('message.pages.analytics.export') }}</el-button>
			</div>
		</div>
		<el-row :gutter="16" class="mb-3">
			<el-col :span="6" v-for="kpi in kpis" :key="kpi.key">
				<el-card shadow="hover">
					<div class="kg-analytics__kpi-label">{{ kpi.label }}</div>
					<div class="kg-analytics__kpi-value">{{ kpi.value }}</div>
				</el-card>
			</el-col>
		</el-row>
		<el-row :gutter="16">
			<el-col :span="8">
				<el-card shadow="never">
					<template #header>{{ t('message.pages.analytics.statusDist') }}</template>
					<div ref="pieRef" class="kg-analytics__chart" />
				</el-card>
			</el-col>
			<el-col :span="16">
				<el-card shadow="never">
					<template #header>{{ t('message.pages.analytics.trend') }}</template>
					<div ref="lineRef" class="kg-analytics__chart" />
				</el-card>
			</el-col>
		</el-row>
		<el-card shadow="never" class="mt-3">
			<template #header>{{ t('message.pages.analytics.byProduct') }}</template>
			<div ref="barRef" class="kg-analytics__chart kg-analytics__chart--bar" />
		</el-card>
	</div>
</template>

<script setup lang="ts" name="kg-analytics-index">
import { onActivated, onMounted, onUnmounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { ElMessage } from 'element-plus';
import * as echarts from 'echarts';
import { productBar, statusPie, trendLine } from './mock';

const { t } = useI18n();
const exporting = ref(false);
const pieRef = ref<HTMLElement | null>(null);
const lineRef = ref<HTMLElement | null>(null);
const barRef = ref<HTMLElement | null>(null);
let charts: echarts.ECharts[] = [];

const kpis = [
	{ key: 'total', label: t('message.pages.analytics.totalIssues'), value: '142' },
	{ key: 'avg', label: t('message.pages.analytics.avgDays'), value: '5.2 ' + t('message.pages.analytics.days') },
	{ key: 'rate', label: t('message.pages.analytics.resolveRate'), value: '78%' },
	{ key: 'hot', label: t('message.pages.analytics.hotProduct'), value: '制动盘' },
];

function doExport() {
	exporting.value = true;
	setTimeout(() => {
		exporting.value = false;
		ElMessage.success(t('message.pages.analytics.exportSuccess'));
	}, 800);
}

function initCharts() {
	if (pieRef.value) {
		const c = echarts.init(pieRef.value);
		c.setOption({
			tooltip: { trigger: 'item' },
			series: [{ type: 'pie', radius: '65%', data: statusPie }],
		});
		charts.push(c);
	}
	if (lineRef.value) {
		const c = echarts.init(lineRef.value);
		c.setOption({
			tooltip: { trigger: 'axis' },
			legend: { data: ['新增', '解决'] },
			xAxis: { type: 'category', data: trendLine.map((x) => x.name) },
			yAxis: { type: 'value' },
			series: [
				{ name: '新增', type: 'line', data: trendLine.map((x) => x.新增) },
				{ name: '解决', type: 'line', data: trendLine.map((x) => x.解决) },
			],
		});
		charts.push(c);
	}
	if (barRef.value) {
		const c = echarts.init(barRef.value);
		c.setOption({
			tooltip: { trigger: 'axis' },
			xAxis: { type: 'category', data: productBar.map((x) => x.name) },
			yAxis: { type: 'value' },
			series: [{ type: 'bar', data: productBar.map((x) => x.问题数), itemStyle: { color: '#409eff' } }],
		});
		charts.push(c);
	}
}

function resizeCharts() {
	charts.forEach((c) => c.resize());
}

onMounted(() => {
	initCharts();
	window.addEventListener('resize', resizeCharts);
});

onActivated(() => {
	resizeCharts();
});

onUnmounted(() => {
	window.removeEventListener('resize', resizeCharts);
	charts.forEach((c) => c.dispose());
	charts = [];
});
</script>

<style scoped lang="scss">
.kg-analytics__head {
	display: flex;
	justify-content: space-between;
	margin-bottom: 16px;
	flex-wrap: wrap;
	gap: 12px;
	h1 {
		margin: 0 0 4px;
		font-size: 22px;
	}
	p {
		margin: 0;
		font-size: 13px;
		color: var(--el-text-color-secondary);
	}
}
.kg-analytics__kpi-label {
	font-size: 13px;
	color: var(--el-text-color-secondary);
}
.kg-analytics__kpi-value {
	font-size: 28px;
	font-weight: 700;
	margin-top: 8px;
}
.kg-analytics__chart {
	height: 280px;
	&--bar {
		height: 320px;
	}
}
.mb-3 {
	margin-bottom: 16px;
}
.mt-3 {
	margin-top: 16px;
}
</style>
