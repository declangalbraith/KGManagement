<template>
	<div class="kg-issue-detail">
		<div class="kg-issue-detail__head">
			<div class="kg-issue-detail__title-row">
				<el-button circle @click="router.back()"><el-icon><ArrowLeft /></el-icon></el-button>
				<div>
					<div class="kg-issue-detail__title-line">
						<h1>{{ detail.title }}</h1>
						<el-tag type="warning">{{ detail.status }}</el-tag>
						<el-tag effect="plain">{{ issueId }}</el-tag>
					</div>
					<p class="kg-issue-detail__meta">
						{{ detail.creator }} · {{ detail.createdAt }}
					</p>
				</div>
			</div>
			<div class="kg-issue-detail__actions">
				<el-button @click="report8dOpen = true">{{ t('message.pages.issues.dynamic8d') }}</el-button>
				<el-button type="primary" @click="ElMessage.success(t('message.pages.issues.resolve'))">
					{{ t('message.pages.issues.resolve') }}
				</el-button>
			</div>
		</div>

		<el-tabs v-model="activeTab" class="kg-issue-detail__tabs">
			<el-tab-pane :label="t('message.pages.issues.overview')" name="overview" />
			<el-tab-pane :label="t('message.pages.issues.subTasks')" name="tasks" />
			<el-tab-pane :label="t('message.pages.issues.rca')" name="rca" />
			<el-tab-pane :label="t('message.pages.issues.report8d')" name="8d" />
		</el-tabs>

		<el-card shadow="never" class="mb-3">
			<template #header>
				<span>{{ t('message.pages.issues.d8Progress') }}</span>
				<el-button link type="primary" class="fr" @click="router.push(`/8d-reports/${issueId}`)">
					{{ t('message.pages.issues.viewFullReport') }}
				</el-button>
			</template>
			<div class="kg-issue-detail__d8">
				<div v-for="(step, idx) in d8Steps" :key="step.id" class="kg-issue-detail__d8-step">
					<div
						class="kg-issue-detail__d8-dot"
						:class="{
							'is-done': step.status === 'done',
							'is-progress': step.status === 'in-progress',
						}"
					>
						<el-icon v-if="step.status === 'done'"><CircleCheck /></el-icon>
						<span v-else>{{ step.id }}</span>
					</div>
					<div class="kg-issue-detail__d8-label">{{ step.name }}</div>
					<div v-if="idx < d8Steps.length - 1" class="kg-issue-detail__d8-line" />
				</div>
			</div>
		</el-card>

		<el-row :gutter="16">
			<el-col :span="16">
				<el-card shadow="never" class="mb-3">
					<template #header>{{ t('message.pages.issues.description') }}</template>
					<p class="kg-issue-detail__desc">
						客户反馈制动盘表面存在异常划痕和磨损，磨损深度约 0.5mm。运行里程约 5000km 后发现，目前已影响 3 列车。
					</p>
				</el-card>
				<el-card shadow="never">
					<template #header>{{ t('message.pages.issues.gantt') }}</template>
					<el-table :data="ganttTasks" size="small">
						<el-table-column prop="name" label="任务" />
						<el-table-column prop="assignee" label="负责人" width="100" />
						<el-table-column prop="phase" label="阶段" width="70" />
						<el-table-column label="进度" width="120">
							<template #default="{ row }">
								<el-progress :percentage="row.progress" :stroke-width="6" />
							</template>
						</el-table-column>
					</el-table>
					<el-button class="mt-2" link type="primary" @click="router.push(`/tasks?issueId=${issueId}`)">
						{{ t('message.pages.issues.subTasks') }}
					</el-button>
				</el-card>
			</el-col>
			<el-col :span="8">
				<el-card shadow="never">
					<template #header>{{ t('message.pages.issues.storyline') }}</template>
					<HolographicStoryline :items="storylineItems" @send-message="onSendMessage" />
				</el-card>
			</el-col>
		</el-row>

		<Dynamic8DReport v-model="report8dOpen" />
	</div>
</template>

<script setup lang="ts" name="kg-issues-detail">
import { computed, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { ElMessage } from 'element-plus';
import { ArrowLeft, CircleCheck } from '@element-plus/icons-vue';
import HolographicStoryline from '../components/HolographicStoryline/index.vue';
import Dynamic8DReport from './components/Dynamic8DReport.vue';
import type { StorylineItem } from '../types';
import { defaultD8Steps, defaultGanttTasks, issueDetailById, mockStoryline } from '../mock';

const route = useRoute();
const router = useRouter();
const { t } = useI18n();

const issueId = computed(() => (route.params.id as string) || 'ISS-202604-001');
const detail = computed(
	() =>
		issueDetailById[issueId.value] ?? {
			title: '问题详情',
			status: '处理中',
			creator: '—',
			createdAt: '—',
		}
);

const activeTab = ref('overview');
const report8dOpen = ref(false);
const d8Steps = ref([...defaultD8Steps]);
const ganttTasks = ref([...defaultGanttTasks]);
const storylineItems = ref<StorylineItem[]>([...mockStoryline]);

function onSendMessage(content: string) {
	storylineItems.value.push({
		id: String(Date.now()),
		type: 'chat',
		sender: '我',
		avatar: '我',
		content,
		timestamp: '刚刚',
	});
	if (content.includes('@Q')) {
		setTimeout(() => {
			storylineItems.value.push({
				id: String(Date.now() + 1),
				type: 'queen_widget',
				sender: 'Queen',
				content: '收到指令，已为您创建相关子任务并分配负责人。',
				timestamp: '刚刚',
				widgetType: 'task_card',
			});
		}, 800);
	}
}
</script>

<style scoped lang="scss">
.kg-issue-detail__head {
	display: flex;
	justify-content: space-between;
	align-items: flex-start;
	margin-bottom: 12px;
	gap: 12px;
}
.kg-issue-detail__title-row {
	display: flex;
	gap: 12px;
	align-items: flex-start;
}
.kg-issue-detail__title-line {
	display: flex;
	align-items: center;
	gap: 8px;
	flex-wrap: wrap;
	h1 {
		margin: 0;
		font-size: 22px;
	}
}
.kg-issue-detail__meta {
	margin: 6px 0 0;
	font-size: 13px;
	color: var(--el-text-color-secondary);
}
.kg-issue-detail__actions {
	display: flex;
	gap: 8px;
}
.kg-issue-detail__d8 {
	display: flex;
	gap: 4px;
	overflow-x: auto;
	padding: 8px 0;
}
.kg-issue-detail__d8-step {
	position: relative;
	min-width: 72px;
	text-align: center;
}
.kg-issue-detail__d8-dot {
	width: 32px;
	height: 32px;
	margin: 0 auto 8px;
	border-radius: 50%;
	border: 2px solid var(--el-border-color);
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 11px;
	font-weight: 700;
	&.is-done {
		border-color: var(--el-color-primary);
		color: var(--el-color-primary);
	}
	&.is-progress {
		border-color: var(--el-color-warning);
		color: var(--el-color-warning);
	}
}
.kg-issue-detail__d8-label {
	font-size: 11px;
	color: var(--el-text-color-secondary);
}
.kg-issue-detail__d8-line {
	display: none;
}
.kg-issue-detail__desc {
	font-size: 14px;
	line-height: 1.7;
	color: var(--el-text-color-regular);
	margin: 0;
}
.fr {
	float: right;
}
.mb-3 {
	margin-bottom: 16px;
}
.mt-2 {
	margin-top: 8px;
}
</style>
