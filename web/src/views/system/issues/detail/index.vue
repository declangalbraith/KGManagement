<template>
	<div class="kg-issue-detail">
		<!-- Header -->
		<div class="kg-issue-detail__head">
			<div class="kg-issue-detail__title-row">
				<button type="button" class="kg-back-btn" @click="router.back()">
					<el-icon><ArrowLeft /></el-icon>
				</button>
				<div>
					<div class="kg-issue-detail__title-line">
						<h1>{{ meta.title }}</h1>
						<span class="kg-status-pill">{{ meta.status }}</span>
						<span class="kg-id-pill">{{ issueId }}</span>
					</div>
					<p class="kg-issue-detail__meta">
						{{ t('message.pages.issues.createdBy', { name: meta.creator, time: meta.createdAt }) }}
					</p>
				</div>
			</div>
			<div class="kg-issue-detail__actions">
				<button type="button" class="kg-btn-8d" @click="report8dOpen = true">
					<el-icon><Document /></el-icon>
					{{ t('message.pages.issues.dynamic8d') }}
					<span class="kg-btn-8d__badge">{{ t('message.pages.issues.writing') }}</span>
				</button>
				<button type="button" class="kg-btn-outline" @click="ElMessage.info(t('message.pages.issues.edit'))">
					<el-icon><EditPen /></el-icon>
					{{ t('message.pages.issues.edit') }}
				</button>
				<button type="button" class="kg-btn-primary" @click="ElMessage.success(t('message.pages.issues.resolve'))">
					<el-icon><CircleCheck /></el-icon>
					{{ t('message.pages.issues.resolve') }}
				</button>
			</div>
		</div>

		<!-- Nav tabs -->
		<nav class="kg-issue-detail__nav">
			<button type="button" class="is-active">{{ t('message.pages.issues.overview') }}</button>
			<button type="button" @click="router.push(`/tasks?issueId=${issueId}`)">{{ t('message.pages.issues.subTasks') }}</button>
			<button type="button" @click="router.push(`/rca/${issueId}`)">{{ t('message.pages.issues.rca') }}</button>
			<button type="button" @click="router.push(`/8d-reports/${issueId}`)">{{ t('message.pages.issues.report8d') }}</button>
		</nav>

		<!-- 8D progress -->
		<section class="kg-card kg-card--gradient">
			<div class="kg-card__head">
				<h2>{{ t('message.pages.issues.d8Progress') }}</h2>
				<button type="button" class="kg-link" @click="router.push(`/8d-reports/${issueId}`)">
					{{ t('message.pages.issues.viewFullReport') }} &gt;
				</button>
			</div>
			<div class="kg-d8">
				<div v-for="(step, idx) in d8Steps" :key="step.id" class="kg-d8__step">
					<div v-if="idx < d8Steps.length - 1" class="kg-d8__connector" :class="{ 'is-done': step.status === 'done' }" />
					<div
						class="kg-d8__dot"
						:class="{
							'is-done': step.status === 'done',
							'is-progress': step.status === 'in-progress',
						}"
					>
						<el-icon v-if="step.status === 'done'"><CircleCheck /></el-icon>
						<el-icon v-else-if="step.status === 'in-progress'" class="is-spin"><Loading /></el-icon>
						<el-icon v-else><MoreFilled /></el-icon>
					</div>
					<div class="kg-d8__label">
						<strong :class="step.status">{{ step.id }}</strong>
						<span>{{ step.name }}</span>
					</div>
				</div>
			</div>
		</section>

		<div class="kg-issue-detail__grid">
			<div class="kg-issue-detail__main">
				<!-- Description -->
				<section class="kg-card">
					<div class="kg-card__head">
						<h2>{{ t('message.pages.issues.description') }}</h2>
					</div>
					<div class="kg-card__body">
						<p v-for="(para, i) in meta.description" :key="i" class="kg-desc">{{ para }}</p>
						<div class="kg-meta-grid">
							<div>
								<div class="kg-meta-grid__label">{{ t('message.pages.issues.colCategory') }}</div>
								<div class="kg-meta-grid__value">{{ meta.category }}</div>
							</div>
							<div>
								<div class="kg-meta-grid__label">{{ t('message.pages.issues.colProduct') }}</div>
								<div class="kg-meta-grid__value">{{ meta.product }}</div>
							</div>
							<div>
								<div class="kg-meta-grid__label">{{ t('message.pages.issues.severity') }}</div>
								<div class="kg-meta-grid__value kg-meta-grid__value--warn">
									<span class="kg-dot-warn" />{{ meta.severity }}
								</div>
							</div>
							<div>
								<div class="kg-meta-grid__label">{{ t('message.pages.issues.customer') }}</div>
								<div class="kg-meta-grid__value">{{ meta.customer }}</div>
							</div>
						</div>
					</div>
				</section>

				<!-- Gantt -->
				<IssueGantt
					:tasks="ganttTasks"
					:maximized="maximizedCard === 'gantt'"
					@manage="router.push(`/tasks?issueId=${issueId}`)"
					@toggle-max="maximizedCard = maximizedCard === 'gantt' ? null : 'gantt'"
				/>

				<!-- Storyline -->
				<section class="kg-card kg-card--storyline" :class="{ 'is-max': maximizedCard === 'storyline' }">
					<div class="kg-card__head">
						<div class="kg-card__head-left">
							<h2>{{ t('message.pages.issues.storylineFull') }}</h2>
							<span class="kg-queen-tag">
								<el-icon><MagicStick /></el-icon>
								Queen 伴随
							</span>
						</div>
						<button type="button" class="kg-icon-btn" @click="maximizedCard = maximizedCard === 'storyline' ? null : 'storyline'">
							<el-icon><FullScreen v-if="maximizedCard !== 'storyline'" /><Close v-else /></el-icon>
						</button>
					</div>
					<div class="kg-card__body kg-card__body--storyline">
						<HolographicStoryline :items="storylineItems" @send-message="onSendMessage" />
					</div>
				</section>
			</div>

			<aside class="kg-issue-detail__side">
				<!-- Team -->
				<section class="kg-card">
					<div class="kg-card__head">
						<h2>{{ t('message.pages.issues.team') }}</h2>
					</div>
					<div class="kg-card__body">
						<div v-for="m in teamMembers" :key="m.name" class="kg-team-row">
							<span class="kg-team-av" :class="{ 'is-primary': m.primary }">{{ m.avatar }}</span>
							<div>
								<div class="kg-team-name">{{ m.name }}</div>
								<div class="kg-team-role">{{ m.role }}</div>
							</div>
						</div>
						<button type="button" class="kg-team-manage" @click="ElMessage.info(t('message.pages.issues.manageTeam'))">
							<el-icon><User /></el-icon>
							{{ t('message.pages.issues.manageTeam') }}
						</button>
					</div>
				</section>

				<!-- Quick actions -->
				<section class="kg-card">
					<div class="kg-card__head">
						<h2>{{ t('message.pages.issues.quickActions') }}</h2>
					</div>
					<div class="kg-card__body kg-quick">
						<button type="button" class="kg-quick__item" @click="router.push(`/rca/${issueId}`)">
							<span class="kg-quick__icon is-primary"><el-icon><Search /></el-icon></span>
							<span>{{ t('message.pages.issues.rca') }}</span>
						</button>
						<button type="button" class="kg-quick__item" @click="router.push(`/8d-reports/${issueId}`)">
							<span class="kg-quick__icon is-purple"><el-icon><Document /></el-icon></span>
							<span>{{ t('message.pages.issues.report8dDraft') }}</span>
						</button>
						<button type="button" class="kg-quick__item" @click="router.push('/ai-assistant')">
							<span class="kg-quick__icon is-blue"><el-icon><ChatDotRound /></el-icon></span>
							<span>{{ t('message.pages.issues.askAi') }}</span>
						</button>
					</div>
				</section>

				<!-- Process timeline -->
				<section class="kg-card">
					<div class="kg-card__head">
						<h2>{{ t('message.pages.issues.processTimeline') }}</h2>
					</div>
					<div class="kg-card__body">
						<div class="kg-process">
							<div v-for="(ev, i) in processTimeline" :key="i" class="kg-process__item">
								<span class="kg-process__dot" :class="{ 'is-active': ev.active }" />
								<div>
									<div class="kg-process__title" :class="{ 'is-active': ev.active }">{{ ev.title }}</div>
									<div class="kg-process__sub">{{ ev.sub }}</div>
								</div>
							</div>
						</div>
						<button type="button" class="kg-process__more">{{ t('message.pages.issues.viewFullTimeline') }}</button>
					</div>
				</section>
			</aside>
		</div>

		<Dynamic8DReport v-model="report8dOpen" />
	</div>
</template>

<script setup lang="ts" name="kg-issues-detail">
import { computed, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { ElMessage } from 'element-plus';
import {
	ArrowLeft,
	ChatDotRound,
	CircleCheck,
	Close,
	Document,
	EditPen,
	FullScreen,
	Loading,
	MagicStick,
	MoreFilled,
	Search,
	User,
} from '@element-plus/icons-vue';
import HolographicStoryline from '../components/HolographicStoryline/index.vue';
import Dynamic8DReport from './components/Dynamic8DReport.vue';
import IssueGantt from './components/IssueGantt.vue';
import type { StorylineItem } from '../types';
import { issueDetailById } from '../mock';
import {
	detailD8Steps,
	detailGanttTasks,
	detailStoryline,
	issueDetailMeta,
	processTimeline,
	teamMembers,
} from './mock';

const route = useRoute();
const router = useRouter();
const { t } = useI18n();

const issueId = computed(() => (route.params.id as string) || 'ISS-202604-001');

const meta = computed(() => {
	const base = issueDetailById[issueId.value];
	const ext = issueDetailMeta[issueId.value];
	if (ext) return ext;
	return {
		title: base?.title ?? '问题详情',
		status: base?.status ?? '处理中',
		creator: base?.creator ?? '—',
		createdAt: base?.createdAt ?? '—',
		category: '—',
		product: '—',
		severity: '—',
		customer: '—',
		description: ['暂无描述'],
	};
});

const report8dOpen = ref(false);
const maximizedCard = ref<'gantt' | 'storyline' | null>(null);
const d8Steps = ref([...detailD8Steps]);
const ganttTasks = ref([...detailGanttTasks]);
const storylineItems = ref<StorylineItem[]>([...detailStoryline]);

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
.kg-issue-detail {
	padding: 0 4px 32px;
	max-width: 1400px;
}

.kg-issue-detail__head {
	display: flex;
	justify-content: space-between;
	align-items: flex-start;
	margin-bottom: 20px;
	gap: 16px;
	flex-wrap: wrap;
}

.kg-issue-detail__title-row {
	display: flex;
	gap: 12px;
	align-items: flex-start;
}

.kg-back-btn {
	width: 40px;
	height: 40px;
	border: 1px solid #e2e8f0;
	border-radius: 50%;
	background: #fff;
	cursor: pointer;
	display: flex;
	align-items: center;
	justify-content: center;
	&:hover {
		background: #f8fafc;
	}
}

.kg-issue-detail__title-line {
	display: flex;
	align-items: center;
	gap: 10px;
	flex-wrap: wrap;
	h1 {
		margin: 0;
		font-size: 26px;
		font-weight: 700;
		letter-spacing: -0.02em;
	}
}

.kg-status-pill {
	display: inline-flex;
	padding: 4px 10px;
	font-size: 12px;
	font-weight: 600;
	border-radius: 6px;
	background: #fff7ed;
	color: #c2410c;
	border: 1px solid #fed7aa;
}

.kg-id-pill {
	font-family: ui-monospace, monospace;
	font-size: 12px;
	padding: 4px 10px;
	border-radius: 6px;
	border: 1px solid #e2e8f0;
	color: #64748b;
	background: #f8fafc;
}

.kg-issue-detail__meta {
	margin: 8px 0 0;
	font-size: 13px;
	color: #64748b;
}

.kg-issue-detail__actions {
	display: flex;
	gap: 8px;
	flex-wrap: wrap;
	align-items: center;
}

.kg-btn-8d {
	display: inline-flex;
	align-items: center;
	gap: 6px;
	height: 40px;
	padding: 0 14px;
	border: 1px solid #e9d5ff;
	border-radius: 999px;
	background: #faf5ff;
	color: #7c3aed;
	font-size: 14px;
	font-weight: 500;
	cursor: pointer;
	&:hover {
		background: #f3e8ff;
	}
}
.kg-btn-8d__badge {
	font-size: 10px;
	padding: 2px 6px;
	border-radius: 4px;
	background: #ede9fe;
	color: #6d28d9;
}

.kg-btn-outline {
	display: inline-flex;
	align-items: center;
	gap: 6px;
	height: 40px;
	padding: 0 16px;
	border: 1px solid #e2e8f0;
	border-radius: 999px;
	background: #fff;
	font-size: 14px;
	cursor: pointer;
	&:hover {
		background: #f8fafc;
	}
}

.kg-btn-primary {
	display: inline-flex;
	align-items: center;
	gap: 6px;
	height: 40px;
	padding: 0 18px;
	border: none;
	border-radius: 999px;
	background: #1a1a1a;
	color: #fff;
	font-size: 14px;
	font-weight: 500;
	cursor: pointer;
	&:hover {
		background: #333;
	}
}

.kg-issue-detail__nav {
	display: flex;
	gap: 24px;
	border-bottom: 1px solid #e2e8f0;
	margin-bottom: 24px;
	button {
		border: none;
		background: none;
		padding: 0 0 12px;
		font-size: 14px;
		color: #64748b;
		cursor: pointer;
		position: relative;
		&.is-active {
			color: #0f172a;
			font-weight: 600;
			&::after {
				content: '';
				position: absolute;
				left: 0;
				right: 0;
				bottom: -1px;
				height: 2px;
				background: #1a1a1a;
				border-radius: 2px;
			}
		}
		&:not(.is-active):hover {
			color: #334155;
		}
	}
}

.kg-card {
	border-radius: 8px;
	border: 1px solid rgba(0, 0, 0, 0.06);
	background: #fff;
	margin-bottom: 20px;
	overflow: hidden;
	&--gradient .kg-card__head {
		background: linear-gradient(to right, rgba(99, 102, 241, 0.04), transparent);
	}
	&--storyline {
		min-height: 420px;
		display: flex;
		flex-direction: column;
		&.is-max {
			position: fixed;
			inset: 16px;
			z-index: 2000;
			min-height: auto;
			box-shadow: 0 25px 50px rgba(0, 0, 0, 0.15);
		}
	}
}

.kg-card__head {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 16px 20px;
	border-bottom: 1px solid rgba(0, 0, 0, 0.06);
	h2 {
		margin: 0;
		font-size: 17px;
		font-weight: 600;
	}
}

.kg-card__head-left {
	display: flex;
	align-items: center;
	gap: 10px;
}

.kg-queen-tag {
	display: inline-flex;
	align-items: center;
	gap: 4px;
	font-size: 10px;
	padding: 2px 8px;
	border-radius: 999px;
	background: #f3e8ff;
	color: #7c3aed;
}

.kg-link {
	border: none;
	background: none;
	font-size: 13px;
	color: var(--el-color-primary);
	cursor: pointer;
	&:hover {
		text-decoration: underline;
	}
}

.kg-card__body {
	padding: 20px;
	&--storyline {
		flex: 1;
		display: flex;
		flex-direction: column;
		min-height: 360px;
		padding: 16px 20px 20px;
	}
}

.kg-d8 {
	display: flex;
	padding: 24px 16px 8px;
	overflow-x: auto;
}

.kg-d8__step {
	position: relative;
	flex: 1;
	min-width: 72px;
	display: flex;
	flex-direction: column;
	align-items: center;
}

.kg-d8__connector {
	position: absolute;
	top: 16px;
	left: 50%;
	width: 100%;
	height: 2px;
	background: #e2e8f0;
	z-index: 0;
	&.is-done {
		background: #1a1a1a;
	}
}

.kg-d8__dot {
	position: relative;
	z-index: 1;
	width: 32px;
	height: 32px;
	border-radius: 50%;
	border: 2px solid #cbd5e1;
	background: #fff;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 14px;
	color: #94a3b8;
	&.is-done {
		border-color: #1a1a1a;
		color: #1a1a1a;
	}
	&.is-progress {
		border-color: #f59e0b;
		color: #f59e0b;
		box-shadow: 0 0 0 4px rgba(245, 158, 11, 0.15);
	}
	.is-spin {
		animation: spin 3s linear infinite;
	}
}

@keyframes spin {
	to {
		transform: rotate(360deg);
	}
}

.kg-d8__label {
	margin-top: 10px;
	text-align: center;
	strong {
		display: block;
		font-size: 11px;
		&.done {
			color: #1a1a1a;
		}
		&.in-progress {
			color: #f59e0b;
		}
		&.pending {
			color: #94a3b8;
		}
	}
	span {
		display: block;
		font-size: 10px;
		color: #64748b;
		margin-top: 2px;
		white-space: nowrap;
	}
}

.kg-issue-detail__grid {
	display: grid;
	grid-template-columns: 1fr 320px;
	gap: 20px;
	align-items: start;
}

.kg-desc {
	margin: 0 0 12px;
	font-size: 14px;
	line-height: 1.75;
	color: #475569;
	&:last-of-type {
		margin-bottom: 0;
	}
}

.kg-meta-grid {
	display: grid;
	grid-template-columns: repeat(4, 1fr);
	gap: 20px;
	margin-top: 24px;
	padding-top: 24px;
	border-top: 1px solid rgba(0, 0, 0, 0.06);
	@media (max-width: 900px) {
		grid-template-columns: repeat(2, 1fr);
	}
}

.kg-meta-grid__label {
	font-size: 11px;
	text-transform: uppercase;
	letter-spacing: 0.06em;
	color: #94a3b8;
	margin-bottom: 6px;
}

.kg-meta-grid__value {
	font-size: 14px;
	font-weight: 500;
	color: #0f172a;
	&--warn {
		display: flex;
		align-items: center;
		gap: 6px;
		color: #d97706;
	}
}

.kg-dot-warn {
	width: 8px;
	height: 8px;
	border-radius: 50%;
	background: #f59e0b;
	flex-shrink: 0;
}

.kg-team-row {
	display: flex;
	align-items: center;
	gap: 14px;
	padding: 10px 12px;
	border-radius: 12px;
	margin-bottom: 4px;
	&:hover {
		background: rgba(0, 0, 0, 0.02);
	}
}

.kg-team-av {
	width: 40px;
	height: 40px;
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	font-weight: 600;
	font-size: 14px;
	background: #f1f5f9;
	border: 1px solid #e2e8f0;
	&.is-primary {
		background: linear-gradient(135deg, #e0e7ff, #c7d2fe);
		color: #4338ca;
		border-color: rgba(67, 56, 202, 0.15);
	}
}

.kg-team-name {
	font-size: 14px;
	font-weight: 500;
}

.kg-team-role {
	font-size: 12px;
	color: #64748b;
	margin-top: 2px;
}

.kg-team-manage {
	width: 100%;
	margin-top: 12px;
	height: 44px;
	border: 1px dashed #cbd5e1;
	border-radius: 12px;
	background: transparent;
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 8px;
	font-size: 14px;
	color: #475569;
	cursor: pointer;
	&:hover {
		border-color: var(--el-color-primary);
		color: var(--el-color-primary);
		background: rgba(64, 158, 255, 0.04);
	}
}

.kg-quick__item {
	width: 100%;
	display: flex;
	align-items: center;
	gap: 12px;
	padding: 12px;
	border: 1px solid transparent;
	border-radius: 12px;
	background: transparent;
	cursor: pointer;
	font-size: 14px;
	font-weight: 500;
	text-align: left;
	&:hover {
		background: rgba(0, 0, 0, 0.02);
		border-color: rgba(0, 0, 0, 0.06);
	}
}

.kg-quick__icon {
	width: 32px;
	height: 32px;
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	&.is-primary {
		background: rgba(64, 158, 255, 0.1);
		color: var(--el-color-primary);
	}
	&.is-purple {
		background: rgba(124, 58, 237, 0.1);
		color: #7c3aed;
	}
	&.is-blue {
		background: rgba(59, 130, 246, 0.1);
		color: #3b82f6;
	}
}

.kg-process {
	border-left: 2px solid #e2e8f0;
	margin-left: 8px;
	padding-left: 20px;
}

.kg-process__item {
	position: relative;
	margin-bottom: 28px;
	&:last-child {
		margin-bottom: 0;
	}
}

.kg-process__dot {
	position: absolute;
	left: -27px;
	top: 4px;
	width: 14px;
	height: 14px;
	border-radius: 50%;
	background: #e2e8f0;
	border: 3px solid #fff;
	box-shadow: 0 0 0 1px #e2e8f0;
	&.is-active {
		background: #1a1a1a;
		box-shadow: 0 0 0 4px #fff;
	}
}

.kg-process__title {
	font-size: 14px;
	font-weight: 500;
	&.is-active {
		color: #1a1a1a;
		font-weight: 600;
	}
}

.kg-process__sub {
	font-size: 12px;
	color: #64748b;
	margin-top: 4px;
}

.kg-process__more {
	width: 100%;
	margin-top: 16px;
	border: none;
	background: none;
	font-size: 12px;
	color: #64748b;
	cursor: pointer;
	padding: 8px;
	border-radius: 8px;
	&:hover {
		color: var(--el-color-primary);
		background: rgba(0, 0, 0, 0.02);
	}
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

@media (max-width: 1100px) {
	.kg-issue-detail__grid {
		grid-template-columns: 1fr;
	}
}
</style>
