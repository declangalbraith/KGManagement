<template>
	<div class="kg-gantt" :class="{ 'is-max': maximized }">
		<div class="kg-gantt__head">
			<div>
				<h3 class="kg-gantt__title">
					<el-icon><Calendar /></el-icon>
					{{ t('message.pages.issues.gantt') }}
				</h3>
				<p class="kg-gantt__sub">{{ t('message.pages.issues.ganttSub') }}</p>
			</div>
			<div class="kg-gantt__tools">
				<div class="kg-gantt__zoom hidden-sm">
					<button type="button">{{ t('message.pages.issues.zoomOut') }}</button>
					<button type="button">{{ t('message.pages.issues.zoomIn') }}</button>
					<span class="kg-gantt__sep" />
					<button type="button" class="is-primary-text">{{ t('message.pages.issues.today') }}</button>
				</div>
				<button type="button" class="kg-gantt__btn-outline hidden-sm" @click="emit('export')">{{ t('message.pages.issues.export') }}</button>
				<button type="button" class="kg-gantt__btn-create" @click="emit('manage')">{{ t('message.pages.issues.manageTasks') }}</button>
				<button type="button" class="kg-icon-btn" @click="emit('toggleMax')">
					<el-icon><FullScreen v-if="!maximized" /><Close v-else /></el-icon>
				</button>
			</div>
		</div>
		<div class="kg-gantt__body">
			<div class="kg-gantt__list">
				<div class="kg-gantt__list-h">
					<span>{{ t('message.pages.issues.ganttColTask') }}</span>
					<span>{{ t('message.pages.issues.ganttColOwner') }}</span>
					<span>{{ t('message.pages.issues.ganttColStatus') }}</span>
				</div>
				<div v-for="task in tasks" :key="task.id" class="kg-gantt__row" @click="emit('openTask', task.id)">
					<div class="kg-gantt__cell-name">
						<div class="kg-gantt__task-name">{{ task.name }}</div>
						<div class="kg-gantt__task-date">{{ task.start }} ~ {{ task.end }}</div>
					</div>
					<div class="kg-gantt__cell-owner">
						<span class="kg-gantt__av">{{ task.assignee[0] }}</span>
						<span class="kg-gantt__owner-name">{{ task.assignee }}</span>
					</div>
					<div class="kg-gantt__cell-status">
						<span class="kg-badge" :class="statusClass(task.status)">{{ statusLabel(task.status) }}</span>
					</div>
				</div>
			</div>
			<div class="kg-gantt__timeline">
				<div class="kg-gantt__months">
					<div v-for="(m, i) in months" :key="i" class="kg-gantt__month" :style="{ width: m.width }">{{ m.label }}</div>
				</div>
				<div class="kg-gantt__days">
					<div v-for="(d, i) in days" :key="i" class="kg-gantt__day" :class="{ 'is-today': d.isToday, 'is-weekend': d.isWeekend }">{{ d.label }}</div>
					<div class="kg-gantt__today-line" :style="{ left: todayLeft }" />
				</div>
				<div class="kg-gantt__bars">
					<div v-for="task in tasks" :key="task.id" class="kg-gantt__bar-row">
						<div
							class="kg-gantt__bar"
							:class="barClass(task.status)"
							:style="barPos(task)"
							@click.stop="emit('openTask', task.id)"
						>
							<span v-if="barPos(task).widthPx > 50">{{ task.progress }}%</span>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts" name="IssueGantt">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { Calendar, Close, FullScreen } from '@element-plus/icons-vue';
import type { GanttTask } from '../../types';

const props = defineProps<{ tasks: GanttTask[]; maximized?: boolean }>();
const emit = defineEmits<{ manage: []; export: []; toggleMax: []; openTask: [string] }>();
const { t } = useI18n();

const DAY_W = 36;
const start = new Date('2026-04-05');
const end = new Date('2026-04-18');
const today = new Date('2026-04-12');

function dayDiff(a: Date, b: Date) {
	return Math.round((b.getTime() - a.getTime()) / 86400000);
}

const days = computed(() => {
	const list: { label: number; isToday: boolean; isWeekend: boolean }[] = [];
	const cur = new Date(start);
	while (cur <= end) {
		list.push({
			label: cur.getDate(),
			isToday: cur.toDateString() === today.toDateString(),
			isWeekend: cur.getDay() === 0 || cur.getDay() === 6,
		});
		cur.setDate(cur.getDate() + 1);
	}
	return list;
});

const months = computed(() => {
	const result: { label: string; width: string }[] = [];
	let cur = -1;
	days.value.forEach((d, i) => {
		const dt = new Date(start);
		dt.setDate(dt.getDate() + i);
		if (dt.getMonth() !== cur) {
			result.push({ label: `${dt.getFullYear()}年${dt.getMonth() + 1}月`, width: `${DAY_W}px` });
			cur = dt.getMonth();
		} else {
			const last = result[result.length - 1];
			const n = parseInt(last.width) + DAY_W;
			last.width = `${n}px`;
		}
	});
	return result;
});

const todayLeft = computed(() => `${dayDiff(start, today) * DAY_W + DAY_W / 2}px`);

function barPos(task: GanttTask) {
	const s = new Date(task.start);
	const e = new Date(task.end);
	const left = dayDiff(start, s) * DAY_W;
	const widthPx = Math.max((dayDiff(s, e) + 1) * DAY_W - 4, 8);
	return { left: `${left}px`, width: `${widthPx}px`, widthPx };
}

function barClass(status: string) {
	if (status === 'done') return 'is-done';
	if (status === 'in-progress') return 'is-progress';
	return 'is-pending';
}

function statusClass(status: string) {
	if (status === 'done') return 'kg-badge--success';
	if (status === 'in-progress') return 'kg-badge--processing-blue';
	return 'kg-badge--low';
}

function statusLabel(status: string) {
	if (status === 'done') return '已完成';
	if (status === 'in-progress') return '处理中';
	return '未开始';
}
</script>

<style scoped lang="scss">
.kg-gantt {
	border-radius: 8px;
	border: 1px solid rgba(0, 0, 0, 0.06);
	background: #fff;
	overflow: hidden;
	&.is-max {
		position: fixed;
		inset: 16px;
		z-index: 2000;
		box-shadow: 0 25px 50px rgba(0, 0, 0, 0.15);
	}
}
.kg-gantt__head {
	display: flex;
	justify-content: space-between;
	align-items: flex-start;
	padding: 16px 20px;
	border-bottom: 1px solid rgba(0, 0, 0, 0.06);
	background: rgba(0, 0, 0, 0.02);
	gap: 12px;
	flex-wrap: wrap;
}
.kg-gantt__title {
	margin: 0;
	font-size: 17px;
	font-weight: 600;
	display: flex;
	align-items: center;
	gap: 8px;
}
.kg-gantt__sub {
	margin: 4px 0 0;
	font-size: 13px;
	color: #64748b;
}
.kg-gantt__tools {
	display: flex;
	align-items: center;
	gap: 8px;
	flex-wrap: wrap;
}
.kg-gantt__zoom {
	display: flex;
	align-items: center;
	border: 1px solid #e2e8f0;
	border-radius: 6px;
	padding: 2px;
	button {
		border: none;
		background: transparent;
		font-size: 12px;
		padding: 4px 10px;
		cursor: pointer;
		border-radius: 4px;
		&:hover {
			background: #f1f5f9;
		}
		&.is-primary-text {
			color: var(--el-color-primary);
		}
	}
}
.kg-gantt__sep {
	width: 1px;
	height: 16px;
	background: #e2e8f0;
	margin: 0 4px;
}
.kg-gantt__btn-outline {
	height: 32px;
	padding: 0 12px;
	border: 1px solid #e2e8f0;
	border-radius: 999px;
	background: #fff;
	font-size: 13px;
	cursor: pointer;
}
.kg-gantt__btn-create {
	height: 32px;
	padding: 0 14px;
	border: none;
	border-radius: 999px;
	background: #1a1a1a;
	color: #fff;
	font-size: 13px;
	cursor: pointer;
}
.kg-gantt__body {
	display: flex;
	min-height: 280px;
	max-height: 360px;
}
.kg-gantt.is-max .kg-gantt__body {
	max-height: none;
	flex: 1;
}
.kg-gantt__list {
	width: 300px;
	flex-shrink: 0;
	border-right: 1px solid rgba(0, 0, 0, 0.06);
	overflow-y: auto;
}
.kg-gantt__list-h,
.kg-gantt__row {
	display: grid;
	grid-template-columns: 1fr 72px 64px;
	align-items: center;
	font-size: 12px;
}
.kg-gantt__list-h {
	height: 40px;
	padding: 0 12px;
	background: rgba(0, 0, 0, 0.02);
	color: #64748b;
	text-transform: uppercase;
	letter-spacing: 0.04em;
}
.kg-gantt__row {
	height: 44px;
	padding: 0 12px;
	border-bottom: 1px solid rgba(0, 0, 0, 0.04);
	cursor: pointer;
	&:hover {
		background: rgba(0, 0, 0, 0.02);
	}
}
.kg-gantt__task-name {
	font-weight: 500;
	font-size: 13px;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
}
.kg-gantt__task-date {
	font-size: 10px;
	color: #94a3b8;
	font-family: ui-monospace, monospace;
}
.kg-gantt__cell-owner {
	display: flex;
	align-items: center;
	gap: 6px;
}
.kg-gantt__av {
	width: 22px;
	height: 22px;
	border-radius: 50%;
	background: var(--el-color-primary-light-9);
	color: var(--el-color-primary);
	font-size: 10px;
	font-weight: 700;
	display: flex;
	align-items: center;
	justify-content: center;
}
.kg-gantt__owner-name {
	font-size: 12px;
	overflow: hidden;
	text-overflow: ellipsis;
}
.kg-gantt__timeline {
	flex: 1;
	overflow: auto;
	background: #f8fafc;
	position: relative;
}
.kg-gantt__months,
.kg-gantt__days {
	display: flex;
	height: 28px;
	background: rgba(0, 0, 0, 0.02);
	border-bottom: 1px solid rgba(0, 0, 0, 0.06);
	font-size: 11px;
	color: #64748b;
}
.kg-gantt__month {
	flex-shrink: 0;
	display: flex;
	align-items: center;
	justify-content: center;
	border-right: 1px solid rgba(0, 0, 0, 0.06);
}
.kg-gantt__day {
	width: 36px;
	flex-shrink: 0;
	display: flex;
	align-items: center;
	justify-content: center;
	border-right: 1px solid rgba(0, 0, 0, 0.04);
	&.is-weekend {
		background: rgba(0, 0, 0, 0.03);
		color: #94a3b8;
	}
	&.is-today {
		background: var(--el-color-primary-light-9);
		color: var(--el-color-primary);
		font-weight: 700;
	}
}
.kg-gantt__today-line {
	position: absolute;
	top: 56px;
	bottom: 0;
	width: 2px;
	background: rgba(239, 68, 68, 0.5);
	z-index: 2;
	pointer-events: none;
}
.kg-gantt__bars {
	position: relative;
	z-index: 1;
}
.kg-gantt__bar-row {
	height: 44px;
	border-bottom: 1px solid rgba(0, 0, 0, 0.04);
	position: relative;
}
.kg-gantt__bar {
	position: absolute;
	top: 10px;
	height: 24px;
	border-radius: 4px;
	cursor: pointer;
	display: flex;
	align-items: center;
	padding: 0 8px;
	font-size: 10px;
	font-weight: 600;
	color: #fff;
	box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
	&.is-done {
		background: #10b981;
	}
	&.is-progress {
		background: #3b82f6;
	}
	&.is-pending {
		background: #94a3b8;
	}
}
.kg-badge {
	display: inline-block;
	padding: 2px 8px;
	font-size: 10px;
	border-radius: 4px;
	white-space: nowrap;
}
.kg-badge--success {
	background: #ecfdf5;
	color: #059669;
}
.kg-badge--processing-blue {
	background: #3b82f6;
	color: #fff;
}
.kg-badge--low {
	background: #f1f5f9;
	color: #64748b;
}
.kg-icon-btn {
	width: 32px;
	height: 32px;
	border: none;
	background: transparent;
	border-radius: 50%;
	cursor: pointer;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	&:hover {
		background: #f1f5f9;
	}
}
@media (max-width: 900px) {
	.hidden-sm {
		display: none !important;
	}
	.kg-gantt__body {
		flex-direction: column;
	}
	.kg-gantt__list {
		width: 100%;
		border-right: none;
		border-bottom: 1px solid rgba(0, 0, 0, 0.06);
	}
}
</style>
