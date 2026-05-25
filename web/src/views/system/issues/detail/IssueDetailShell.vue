<template>
	<div class="kg-issue-detail__shell">
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
				<button type="button" class="kg-btn-8d" @click="emit('open8d')">
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

		<nav class="kg-issue-detail__nav">
			<button
				v-for="tab in tabs"
				:key="tab.key"
				type="button"
				:class="{ 'is-active': activeTab === tab.key }"
				@click="router.push(tab.path)"
			>
				{{ tab.label }}
			</button>
		</nav>
	</div>
</template>

<script setup lang="ts" name="IssueDetailShell">
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { ElMessage } from 'element-plus';
import { ArrowLeft, CircleCheck, Document, EditPen } from '@element-plus/icons-vue';
import { useIssueDetailMeta } from './useIssueDetailMeta';

const emit = defineEmits<{ open8d: [] }>();

const route = useRoute();
const router = useRouter();
const { t } = useI18n();
const { issueId, meta } = useIssueDetailMeta();

const tabs = computed(() => {
	const id = issueId.value;
	return [
		{ key: 'overview', label: t('message.pages.issues.overview'), path: `/issues/${id}` },
		{ key: 'tasks', label: t('message.pages.issues.subTasks'), path: `/issues/${id}/tasks` },
		{ key: 'rca', label: t('message.pages.issues.rca'), path: `/issues/${id}/rca` },
		{ key: '8d', label: t('message.pages.issues.report8d'), path: `/issues/${id}/8d` },
	];
});

const activeTab = computed(() => {
	const name = String(route.name ?? '');
	if (name === 'kg-issues-detail-tasks') return 'tasks';
	if (name === 'kg-issues-detail-rca') return 'rca';
	if (name === 'kg-issues-detail-8d') return '8d';
	return 'overview';
});
</script>

<style scoped lang="scss">
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
</style>
