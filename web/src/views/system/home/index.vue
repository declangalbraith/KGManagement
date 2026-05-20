<template>
	<div class="kg-dashboard">
		<div class="kg-dashboard__head">
			<div>
				<h1 class="kg-dashboard__title">{{ t('message.pages.home.title') }}</h1>
				<p class="kg-dashboard__subtitle">{{ t('message.pages.home.subtitle') }}</p>
			</div>
			<el-button type="primary" @click="router.push('/issues/new')">
				<el-icon class="mr-1"><Plus /></el-icon>
				{{ t('message.pages.home.createIssue') }}
			</el-button>
		</div>

		<el-row :gutter="16" class="kg-dashboard__stats">
			<el-col :xs="24" :sm="12" :lg="6" v-for="card in statCards" :key="card.key">
				<el-card shadow="hover" class="kg-stat-card" @click="card.onClick">
					<div class="kg-stat-card__label">{{ card.label }}</div>
					<div class="kg-stat-card__value">{{ card.value }}</div>
					<div class="kg-stat-card__hint">{{ card.hint }}</div>
				</el-card>
			</el-col>
		</el-row>

		<el-card class="kg-dashboard__feed" shadow="never">
			<template #header>
				<span>{{ t('message.pages.home.hotIssues') }}</span>
			</template>
			<div v-for="item in hotFeed" :key="item.id" class="kg-feed-item" @click="router.push(`/issues/${item.id}`)">
				<div class="kg-feed-item__title">{{ item.title }}</div>
				<div class="kg-feed-item__meta">{{ item.author }} · {{ item.time }}</div>
				<p class="kg-feed-item__content">{{ item.content }}</p>
				<el-progress :percentage="item.progress" :stroke-width="8" />
			</div>
		</el-card>
	</div>
</template>

<script setup lang="ts" name="kg-home-page">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { Plus } from '@element-plus/icons-vue';

const router = useRouter();
const { t } = useI18n();

const statCards = [
	{
		key: 'tasks',
		label: t('message.pages.home.pendingTasks'),
		value: '12',
		hint: t('message.pages.home.pendingTasksHint'),
		onClick: () => router.push('/tasks'),
	},
	{
		key: 'issues',
		label: t('message.pages.home.activeIssues'),
		value: '8',
		hint: t('message.pages.home.activeIssuesHint'),
		onClick: () => router.push('/issues'),
	},
	{
		key: '8d',
		label: t('message.pages.home.pending8D'),
		value: '2',
		hint: t('message.pages.home.pending8DHint'),
		onClick: () => router.push('/8d-reports'),
	},
	{
		key: 'resolved',
		label: t('message.pages.home.resolvedThisMonth'),
		value: '24',
		hint: t('message.pages.home.resolvedHint'),
		onClick: () => {},
	},
];

const hotFeed = ref([
	{
		id: 'ISS-202605-001',
		author: '王工',
		time: '10 分钟前更新',
		title: '[ISS-202605-001] 高铁新型制动盘高温测试异常报警',
		content: '最新进展：8D 第三步已完成并经 SQE 验证。正在进行根本原因分析…',
		progress: 38,
	},
	{
		id: 'ISS-202604-089',
		author: '李经理',
		time: '2 小时前更新',
		title: '[ISS-202604-089] 供应商 A 批次阀门泄漏率超标',
		content: '已启动供应商质量预警机制，SQE 明日现场审核…',
		progress: 25,
	},
]);
</script>

<style scoped lang="scss">
.kg-dashboard__head {
	display: flex;
	justify-content: space-between;
	align-items: flex-start;
	margin-bottom: 20px;
	gap: 16px;
}
.kg-dashboard__title {
	margin: 0;
	font-size: 24px;
	font-weight: 700;
}
.kg-dashboard__subtitle {
	margin: 6px 0 0;
	color: var(--el-text-color-secondary);
	font-size: 14px;
}
.kg-dashboard__stats {
	margin-bottom: 20px;
}
.kg-stat-card {
	cursor: pointer;
	&__label {
		font-size: 13px;
		color: var(--el-text-color-secondary);
	}
	&__value {
		font-size: 32px;
		font-weight: 300;
		margin: 8px 0;
	}
	&__hint {
		font-size: 12px;
		color: var(--el-text-color-secondary);
	}
}
.kg-feed-item {
	padding: 12px 0;
	border-bottom: 1px solid var(--el-border-color-lighter);
	cursor: pointer;
	&:last-child {
		border-bottom: none;
	}
	&__title {
		font-weight: 600;
		margin-bottom: 4px;
	}
	&__meta {
		font-size: 12px;
		color: var(--el-text-color-secondary);
		margin-bottom: 8px;
	}
	&__content {
		font-size: 13px;
		color: var(--el-text-color-regular);
		margin: 0 0 12px;
	}
}
.mr-1 {
	margin-right: 4px;
}
</style>
