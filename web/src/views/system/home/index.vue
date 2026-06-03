<template>
	<div class="kg-dashboard">
		<div class="kg-dashboard__head">
			<div>
				<h1 class="kg-dashboard__title">{{ t('message.pages.home.title') }}</h1>
				<p class="kg-dashboard__subtitle">{{ subtitleText }}</p>
			</div>
			<el-button class="kg-dashboard__cta" @click="router.push('/issues/new')">
				<el-icon><Plus /></el-icon>
				{{ t('message.pages.home.createIssue') }}
			</el-button>
		</div>

		<el-row :gutter="20" class="kg-dashboard__stats">
			<el-col v-for="card in statCards" :key="card.key" :xs="24" :sm="12" :md="6">
				<div class="kg-stat-card kg-glass" :class="`kg-stat-card--${card.tone}`" @click="card.onClick">
					<div class="kg-stat-card__top">
						<span class="kg-stat-card__label">{{ card.label }}</span>
						<div class="kg-stat-card__icon">
							<el-icon><component :is="card.icon" /></el-icon>
						</div>
					</div>
					<div class="kg-stat-card__value">{{ card.value }}</div>
					<p class="kg-stat-card__hint">
						<template v-if="card.highlight">
							<span :class="`kg-stat-card__hl kg-stat-card__hl--${card.tone}`">{{ card.highlight }}</span>
						</template>
						{{ card.hint }}
					</p>
				</div>
			</el-col>
		</el-row>

		<div class="kg-dashboard__main">
			<!-- 热点动态：React xl:col-span-5 -->
			<div class="kg-dashboard__col kg-dashboard__col--hot">
				<div class="kg-panel kg-glass">
					<div class="kg-panel__head">
						<div>
							<h3 class="kg-panel__title">
								<svg class="kg-panel__flame" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
									<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
								</svg>
								{{ t('message.pages.home.hotIssuesFeed') }}
							</h3>
							<p class="kg-panel__desc">{{ t('message.pages.home.hotIssuesDesc') }}</p>
						</div>
					</div>
					<div class="kg-panel__body kg-panel__body--scroll">
						<template v-if="hotFeed.length">
							<div v-for="issue in hotFeed" :key="issue.id" class="kg-hot-item">
								<div class="kg-hot-item__avatar" :class="{ 'is-hot': issue.heat > 90 }">
									{{ issue.author[0] }}
								</div>
								<div class="kg-hot-item__main">
									<div class="kg-hot-item__meta-row">
										<div>
											<div class="kg-hot-item__author">
												{{ issue.author }}
												<span class="kg-hot-item__dept">{{ issue.department }}</span>
											</div>
											<div class="kg-hot-item__time">{{ issue.time }}</div>
										</div>
										<div class="kg-hot-item__badges">
											<span class="kg-heat-badge" :class="issue.heat > 90 ? 'is-high' : 'is-mid'">
												🔥 热度 {{ issue.heat }}%
											</span>
											<el-button
												v-if="isAdmin"
												link
												class="kg-hot-item__hide"
												@click.stop="hideHot(issue.id)"
											>
												<el-icon><Hide /></el-icon>
											</el-button>
										</div>
									</div>
									<h4 class="kg-hot-item__title" @click="router.push(`/issues/${issue.id}`)">{{ issue.title }}</h4>
									<p class="kg-hot-item__content">{{ issue.content }}</p>
									<div class="kg-hot-item__progress">
										<div class="kg-hot-item__bar">
											<div
												class="kg-hot-item__bar-fill"
												:style="{ width: `${issue.progress}%`, background: issue.progressColor }"
											/>
										</div>
										<span class="kg-hot-item__phase">{{ issue.progressLabel }}</span>
									</div>
									<div class="kg-hot-item__actions">
										<button type="button" @click="onFollow">
											<el-icon><Plus /></el-icon>{{ t('message.pages.home.follow') }}
										</button>
										<button type="button" @click="router.push(`/issues/${issue.id}`)">
											<el-icon><ChatDotRound /></el-icon>{{ t('message.pages.home.comment') }}
										</button>
										<button type="button" class="is-link" @click="router.push(`/issues/${issue.id}`)">
											{{ t('message.pages.home.viewDetails') }}
											<el-icon><ArrowRight /></el-icon>
										</button>
									</div>
								</div>
							</div>
						</template>
						<el-empty v-else :description="t('message.pages.home.noHotIssues')" :image-size="64" />
					</div>
				</div>
			</div>

			<!-- 待处理任务：React xl:col-span-4 -->
			<div class="kg-dashboard__col kg-dashboard__col--tasks">
				<div class="kg-panel kg-glass">
					<div class="kg-panel__head kg-panel__head--row">
						<div>
							<h3 class="kg-panel__title">{{ t('message.pages.home.tasksToProcess') }}</h3>
							<p class="kg-panel__desc">{{ tasksDescText }}</p>
						</div>
						<el-button link type="primary" @click="router.push('/tasks')">
							{{ t('message.pages.home.viewAll') }}
							<el-icon><ArrowRight /></el-icon>
						</el-button>
					</div>
					<div class="kg-panel__body kg-panel__body--scroll">
						<div v-for="task in workflowTasks" :key="task.id" class="kg-task-item">
							<div class="kg-task-item__icon is-warning">
								<el-icon><Clock /></el-icon>
							</div>
							<div class="kg-task-item__body">
								<p
									class="kg-task-item__title"
									@click="router.push(`/document-management/general-doc/${task.biz_id}`)"
								>
									{{ task.document_name }} · {{ task.workflow_name }}
								</p>
								<div class="kg-task-item__meta">
									<span>{{ task.document_version }}</span>
									<span>·</span>
									<span>{{ t('message.pages.home.workflowStep', { step: task.step_order }) }}</span>
								</div>
							</div>
							<el-button
								size="small"
								round
								class="kg-task-item__btn"
								@click="router.push(`/document-management/general-doc/${task.biz_id}`)"
							>
								{{ t('message.pages.home.process') }}
							</el-button>
						</div>
						<el-empty v-if="workflowTasks.length === 0" :description="t('message.pages.home.noWorkflowTasks')" :image-size="48" />
					</div>
				</div>
			</div>

			<!-- 公告通知：React xl:col-span-3 -->
			<div class="kg-dashboard__col kg-dashboard__col--notice">
				<div class="kg-panel kg-glass">
					<div class="kg-panel__head">
						<h3 class="kg-panel__title">{{ t('message.pages.home.systemNotices') }}</h3>
						<p class="kg-panel__desc">{{ t('message.pages.home.noticesDescription') }}</p>
					</div>
					<div class="kg-panel__body kg-panel__body--scroll">
						<div class="kg-announce">
							<div class="kg-announce__tags">
								<el-tag type="primary" size="small">{{ t('message.pages.home.announcementBadge') }}</el-tag>
								<span class="kg-announce__time">{{ t('message.pages.home.announcementTime') }}</span>
							</div>
							<p class="kg-announce__title">{{ t('message.pages.home.announcementTitle') }}</p>
							<p class="kg-announce__text">{{ t('message.pages.home.announcementContent') }}</p>
						</div>
						<div
							v-for="n in processNotices"
							:key="n.id"
							class="kg-notice-item"
							@click="router.push(`/issues/${n.issueId}`)"
						>
							<div class="kg-notice-item__head">
								<strong>{{ t('message.pages.home.processReminder') }}</strong>
								<span>{{ n.time }}</span>
							</div>
							<p>
								{{
									t('message.pages.home.processReminderBody', {
										issueId: n.issueId,
										node: n.node,
									})
								}}
							</p>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts" name="kg-home-page">
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { ElMessage } from 'element-plus';
import {
	ArrowRight,
	ChatDotRound,
	CircleCheck,
	Clock,
	Document,
	Hide,
	Plus,
	Tickets,
	WarningFilled,
} from '@element-plus/icons-vue';
import { storeToRefs } from 'pinia';
import { useUserInfo } from '/@/stores/userInfo';
import { initialHotFeed, processNotices } from './mock';
import { fetchMyWorkflowTasks, type WorkflowTask } from '/@/api/workflow/index';

const router = useRouter();
const { t } = useI18n();
const { userInfos } = storeToRefs(useUserInfo());

const hotFeed = ref([...initialHotFeed]);
const workflowTasks = ref<WorkflowTask[]>([]);
const isAdmin = true;

const pendingTaskCount = computed(() => workflowTasks.value.length);

const subtitleText = computed(() =>
	t('message.pages.home.subtitle', { name: userInfos.value.name || '张三' })
);

const tasksDescText = computed(() =>
	t('message.pages.home.tasksDescription', { count: pendingTaskCount })
);

const statCards = computed(() => [
	{
		key: 'tasks',
		label: t('message.pages.home.pendingTasks'),
		value: String(pendingTaskCount.value),
		highlight: t('message.pages.home.pendingTasksOverdue'),
		hint: t('message.pages.home.pendingTasksHint'),
		tone: 'warning',
		icon: Clock,
		onClick: () => router.push('/tasks'),
	},
	{
		key: 'issues',
		label: t('message.pages.home.activeIssues'),
		value: '8',
		highlight: '',
		hint: t('message.pages.home.activeIssuesHint'),
		tone: 'primary',
		icon: Tickets,
		onClick: () => router.push('/issues'),
	},
	{
		key: '8d',
		label: t('message.pages.home.pending8D'),
		value: '2',
		highlight: '',
		hint: t('message.pages.home.pending8DHint'),
		tone: 'purple',
		icon: Document,
		onClick: () => router.push('/8d-reports'),
	},
	{
		key: 'resolved',
		label: t('message.pages.home.resolvedThisMonth'),
		value: '24',
		highlight: t('message.pages.home.resolvedDelta'),
		hint: t('message.pages.home.resolvedHint'),
		tone: 'success',
		icon: CircleCheck,
		onClick: () => {},
	},
]);

function hideHot(id: string) {
	hotFeed.value = hotFeed.value.filter((x) => x.id !== id);
	ElMessage.success(t('message.pages.home.hiddenDesc'));
}

function onFollow() {
	ElMessage.success(t('message.pages.home.followDesc'));
}

onMounted(async () => {
	try {
		workflowTasks.value = (await fetchMyWorkflowTasks()) || [];
	} catch {
		workflowTasks.value = [];
	}
});
</script>

<style scoped lang="scss">
/* 对齐 React Dashboard：gap-8、glass-panel、xl 三栏 5:4:3 */
.kg-glass {
	background: rgba(255, 255, 255, 0.92);
	border: 1px solid rgba(0, 0, 0, 0.06);
	box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
}

.kg-dashboard {
	display: flex;
	flex-direction: column;
	gap: 32px;
	max-width: 1280px;
	margin: 0 auto;
	width: 100%;
}

.kg-dashboard__head {
	display: flex;
	justify-content: space-between;
	align-items: flex-start;
	gap: 16px;
}

.kg-dashboard__title {
	margin: 0;
	font-size: 30px;
	font-weight: 700;
	letter-spacing: -0.02em;
	color: var(--el-text-color-primary);
}

.kg-dashboard__subtitle {
	margin: 8px 0 0;
	font-size: 14px;
	color: var(--el-text-color-secondary);
}

.kg-dashboard__cta {
	--el-button-bg-color: #1a1a1a;
	--el-button-border-color: #1a1a1a;
	--el-button-hover-bg-color: #333;
	--el-button-hover-border-color: #333;
	border-radius: 6px;
	padding: 10px 20px;
	font-weight: 500;
	box-shadow: 0 4px 6px rgba(0, 0, 0, 0.08);
}

.kg-dashboard__stats {
	margin-bottom: 0 !important;
}

/* 三栏：≥1200px 与 React xl:grid-cols-12 (5+4+3) 一致 */
.kg-dashboard__main {
	display: grid;
	gap: 24px;
	grid-template-columns: 1fr;
	align-items: stretch;
}

@media (min-width: 1200px) {
	.kg-dashboard__main {
		grid-template-columns: minmax(0, 5fr) minmax(0, 4fr) minmax(0, 3fr);
	}
}

@media (min-width: 768px) and (max-width: 1199px) {
	.kg-dashboard__main {
		grid-template-columns: repeat(2, minmax(0, 1fr));
	}
	.kg-dashboard__col--hot {
		grid-column: 1 / -1;
	}
}

.kg-dashboard__col {
	min-width: 0;
}

.kg-stat-card {
	border-radius: 8px;
	padding: 20px 24px 24px;
	cursor: pointer;
	transition: box-shadow 0.2s, transform 0.2s;
	border-top-width: 4px;
	border-top-style: solid;
	&:hover {
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.06);
		transform: translateY(-2px);
	}
	&--warning {
		border-top-color: #f59e0b;
		.kg-stat-card__icon {
			background: rgba(245, 158, 11, 0.12);
			color: #d97706;
		}
	}
	&--primary {
		border-top-color: var(--el-color-primary);
		.kg-stat-card__icon {
			background: var(--el-color-primary-light-9);
			color: var(--el-color-primary);
		}
	}
	&--purple {
		border-top-color: #a855f7;
		.kg-stat-card__icon {
			background: rgba(168, 85, 247, 0.12);
			color: #9333ea;
		}
	}
	&--success {
		border-top-color: #10b981;
		.kg-stat-card__icon {
			background: rgba(16, 185, 129, 0.12);
			color: #059669;
		}
	}
}

.kg-stat-card__top {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 12px;
}

.kg-stat-card__label {
	font-size: 13px;
	color: var(--el-text-color-secondary);
	font-weight: 500;
}

.kg-stat-card__icon {
	width: 32px;
	height: 32px;
	border-radius: 8px;
	display: flex;
	align-items: center;
	justify-content: center;
}

.kg-stat-card__value {
	font-size: 40px;
	font-weight: 300;
	line-height: 1;
	letter-spacing: -0.03em;
}

.kg-stat-card__hint {
	margin: 10px 0 0;
	font-size: 12px;
	color: var(--el-text-color-secondary);
}

.kg-stat-card__hl {
	font-weight: 600;
	margin-right: 4px;
	&--warning {
		color: #d97706;
	}
	&--success {
		color: #059669;
	}
}

.kg-panel {
	border-radius: 8px;
	display: flex;
	flex-direction: column;
	height: 600px;
	overflow: hidden;
}

.kg-panel__head {
	padding: 20px 24px 16px;
	border-bottom: 1px solid rgba(0, 0, 0, 0.06);
	background: rgba(0, 0, 0, 0.02);
	flex-shrink: 0;
	&--row {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: 8px;
	}
}

.kg-panel__title {
	margin: 0;
	font-size: 17px;
	font-weight: 600;
	display: flex;
	align-items: center;
	gap: 8px;
}

.kg-panel__flame {
	width: 20px;
	height: 20px;
	color: #ef4444;
	flex-shrink: 0;
}

.kg-panel__desc {
	margin: 6px 0 0;
	font-size: 12px;
	color: var(--el-text-color-secondary);
}

.kg-panel__body--scroll {
	flex: 1;
	overflow-y: auto;
	min-height: 0;
	scrollbar-width: thin;
	&::-webkit-scrollbar {
		width: 6px;
	}
	&::-webkit-scrollbar-thumb {
		background: rgba(0, 0, 0, 0.12);
		border-radius: 3px;
	}
}

.kg-heat-badge {
	display: inline-flex;
	align-items: center;
	padding: 2px 8px;
	font-size: 12px;
	font-weight: 500;
	border-radius: 4px;
	border: 1px solid;
	&.is-high {
		background: #fef2f2;
		color: #dc2626;
		border-color: #fecaca;
	}
	&.is-mid {
		background: #fff7ed;
		color: #ea580c;
		border-color: #fed7aa;
	}
}

.kg-hot-item {
	display: flex;
	gap: 16px;
	padding: 20px 24px;
	border-bottom: 1px solid var(--el-border-color-lighter);
	transition: background 0.15s;
	&:hover {
		background: var(--el-fill-color-light);
	}
}

.kg-hot-item__avatar {
	width: 40px;
	height: 40px;
	border-radius: 8px;
	display: flex;
	align-items: center;
	justify-content: center;
	font-weight: 700;
	font-size: 14px;
	flex-shrink: 0;
	background: rgba(16, 185, 129, 0.15);
	color: #059669;
	&.is-hot {
		background: var(--el-color-primary-light-8);
		color: var(--el-color-primary);
	}
}

.kg-hot-item__main {
	flex: 1;
	min-width: 0;
}

.kg-hot-item__meta-row {
	display: flex;
	justify-content: space-between;
	gap: 12px;
}

.kg-hot-item__author {
	font-size: 13px;
	font-weight: 600;
}

.kg-hot-item__dept {
	font-weight: 400;
	color: var(--el-text-color-secondary);
	margin-left: 6px;
}

.kg-hot-item__time {
	font-size: 12px;
	color: var(--el-text-color-secondary);
	margin-top: 2px;
}

.kg-hot-item__badges {
	display: flex;
	align-items: center;
	gap: 4px;
}

.kg-hot-item__hide {
	opacity: 0;
}
.kg-hot-item:hover .kg-hot-item__hide {
	opacity: 1;
}

.kg-hot-item__title {
	margin: 12px 0 0;
	font-size: 15px;
	font-weight: 600;
	cursor: pointer;
	line-height: 1.4;
	color: #0f172a;
	&:hover {
		color: var(--el-color-primary);
	}
}

.kg-hot-item__content {
	margin: 8px 0 0;
	font-size: 13px;
	line-height: 1.65;
	color: var(--el-text-color-regular);
	display: -webkit-box;
	-webkit-line-clamp: 3;
	-webkit-box-orient: vertical;
	overflow: hidden;
}

.kg-hot-item__progress {
	display: flex;
	align-items: center;
	gap: 10px;
	margin-top: 12px;
}

.kg-hot-item__bar {
	flex: 1;
	height: 6px;
	background: #e2e8f0;
	border-radius: 999px;
	overflow: hidden;
}

.kg-hot-item__bar-fill {
	height: 100%;
	border-radius: 999px;
	transition: width 0.3s;
}

.kg-hot-item__phase {
	font-size: 12px;
	color: var(--el-text-color-secondary);
	white-space: nowrap;
}

.kg-hot-item__actions {
	display: flex;
	align-items: center;
	gap: 20px;
	margin-top: 14px;
	padding-top: 8px;
	button {
		display: inline-flex;
		align-items: center;
		gap: 4px;
		border: none;
		background: none;
		font-size: 12px;
		color: var(--el-text-color-secondary);
		cursor: pointer;
		padding: 0;
		&:hover {
			color: var(--el-color-primary);
		}
		&.is-link {
			margin-left: auto;
		}
	}
}

.kg-task-item {
	display: flex;
	align-items: center;
	gap: 14px;
	padding: 16px 20px;
	border-bottom: 1px solid var(--el-border-color-lighter);
	&:hover {
		background: var(--el-fill-color-light);
		.kg-task-item__btn {
			opacity: 1;
		}
	}
}

.kg-task-item__icon {
	width: 32px;
	height: 32px;
	border-radius: 8px;
	display: flex;
	align-items: center;
	justify-content: center;
	flex-shrink: 0;
	&.is-danger {
		background: var(--el-color-danger-light-9);
		color: var(--el-color-danger);
	}
	&.is-warning {
		background: rgba(245, 158, 11, 0.12);
		color: #d97706;
	}
}

.kg-task-item__body {
	flex: 1;
	min-width: 0;
}

.kg-task-item__title {
	margin: 0 0 6px;
	font-size: 14px;
	font-weight: 500;
	cursor: pointer;
	&:hover {
		color: var(--el-color-primary);
	}
}

.kg-task-item__meta {
	display: flex;
	align-items: center;
	gap: 8px;
	font-size: 12px;
	color: var(--el-text-color-secondary);
}

.kg-task-item__issue {
	font-family: ui-monospace, monospace;
	cursor: pointer;
	&:hover {
		color: var(--el-color-primary);
		text-decoration: underline;
	}
}

.kg-task-item__due.is-overdue {
	color: var(--el-color-danger);
	font-weight: 600;
	background: rgba(245, 63, 63, 0.08);
	padding: 2px 8px;
	border-radius: 4px;
}

.kg-task-item__meta .kg-task-item__due:not(.is-overdue) {
	background: #f1f5f9;
	padding: 2px 8px;
	border-radius: 4px;
}

.kg-task-item__btn {
	opacity: 0;
	transition: opacity 0.15s;
}

.kg-announce {
	padding: 16px;
	margin: 16px;
	border-radius: 8px;
	border: 1px solid var(--el-border-color-lighter);
	border-left: 4px solid var(--el-color-primary);
	background: linear-gradient(135deg, var(--el-color-primary-light-9), var(--el-bg-color));
	cursor: pointer;
	&:hover {
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
	}
}

.kg-announce__tags {
	display: flex;
	align-items: center;
	gap: 8px;
	margin-bottom: 8px;
}

.kg-announce__time {
	font-size: 11px;
	color: var(--el-text-color-secondary);
	font-family: ui-monospace, monospace;
}

.kg-announce__title {
	margin: 0;
	font-size: 14px;
	font-weight: 600;
}

.kg-announce__text {
	margin: 8px 0 0;
	font-size: 12px;
	line-height: 1.6;
	color: var(--el-text-color-regular);
}

.kg-notice-item {
	padding: 12px 16px;
	margin: 0 8px 8px;
	border-radius: 8px;
	cursor: pointer;
	&:hover {
		background: var(--el-fill-color-light);
	}
	p {
		margin: 6px 0 0;
		font-size: 13px;
		color: var(--el-text-color-secondary);
		line-height: 1.5;
	}
}

.kg-notice-item__head {
	display: flex;
	justify-content: space-between;
	font-size: 13px;
	span {
		font-size: 11px;
		color: var(--el-text-color-placeholder);
		font-family: ui-monospace, monospace;
	}
}
</style>
