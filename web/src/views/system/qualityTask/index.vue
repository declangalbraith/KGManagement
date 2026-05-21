<template>
	<div class="kg-tasks">
		<template v-if="currentView === 'list'">
			<div class="kg-tasks__head">
				<div>
					<h1>{{ t('message.pages.qualityTask.title') }}</h1>
					<p>{{ t('message.pages.qualityTask.subtitle') }}</p>
					<el-tag v-if="issueFilter" type="info" class="mt-1">{{ issueFilter }}</el-tag>
				</div>
				<el-button type="primary" @click="openCreate">
					<el-icon><Plus /></el-icon>
					{{ t('message.pages.qualityTask.create') }}
				</el-button>
			</div>
			<el-card shadow="never">
				<div class="kg-tasks__toolbar">
					<el-input v-model="searchQuery" :placeholder="t('message.pages.qualityTask.searchPlaceholder')" clearable style="max-width: 320px">
						<template #prefix><el-icon><Search /></el-icon></template>
					</el-input>
					<el-radio-group v-model="filterStatus" size="small">
						<el-radio-button value="all">{{ t('message.pages.qualityTask.filterAll') }}</el-radio-button>
						<el-radio-button value="my">{{ t('message.pages.qualityTask.filterMy') }}</el-radio-button>
						<el-radio-button value="pending">{{ t('message.pages.qualityTask.filterPending') }}</el-radio-button>
					</el-radio-group>
				</div>
				<el-table :data="filteredTasks" stripe @row-click="openDetail">
					<el-table-column prop="id" :label="t('message.pages.qualityTask.colId')" width="150" />
					<el-table-column prop="title" :label="t('message.pages.qualityTask.colTitle')" min-width="200" show-overflow-tooltip />
					<el-table-column prop="issueId" :label="t('message.pages.qualityTask.colIssue')" width="150" />
					<el-table-column prop="assignee" :label="t('message.pages.qualityTask.colAssignee')" width="110" />
					<el-table-column prop="status" :label="t('message.pages.qualityTask.colStatus')" width="100">
						<template #default="{ row }">
							<el-tag :type="statusTag(row.status)" size="small">{{ row.status }}</el-tag>
						</template>
					</el-table-column>
					<el-table-column prop="phase" :label="t('message.pages.qualityTask.colPhase')" width="70" />
					<el-table-column prop="deadline" :label="t('message.pages.qualityTask.colDeadline')" width="120" />
				</el-table>
			</el-card>
		</template>

		<template v-else>
			<div class="kg-tasks__head">
				<el-button @click="currentView = 'list'">
					<el-icon><ArrowLeft /></el-icon>
					{{ t('message.pages.qualityTask.back') }}
				</el-button>
				<h2>{{ activeTask?.title || t('message.pages.qualityTask.create') }}</h2>
			</div>
			<el-row :gutter="16">
				<el-col :span="14">
					<el-card shadow="never" class="mb-3">
						<el-form label-position="top">
							<el-form-item :label="t('message.pages.qualityTask.colTitle')">
								<el-input v-model="form.title" />
							</el-form-item>
							<el-form-item :label="t('message.pages.qualityTask.description')">
								<el-input v-model="form.description" type="textarea" :rows="4" />
							</el-form-item>
							<el-row :gutter="12">
								<el-col :span="8">
									<el-form-item :label="t('message.pages.qualityTask.colAssignee')">
										<el-input v-model="form.assignee" />
									</el-form-item>
								</el-col>
								<el-col :span="8">
									<el-form-item :label="t('message.pages.qualityTask.colPhase')">
										<el-select v-model="form.phase" class="w100">
											<el-option v-for="p in ['D0','D1','D2','D3','D4','D5','D6','D7','D8']" :key="p" :label="p" :value="p" />
										</el-select>
									</el-form-item>
								</el-col>
								<el-col :span="8">
									<el-form-item :label="t('message.pages.qualityTask.colStatus')">
										<el-tag>{{ form.status }}</el-tag>
									</el-form-item>
								</el-col>
							</el-row>
						</el-form>
						<div class="kg-tasks__actions">
							<el-button @click="saveStatus('草稿', t('message.pages.qualityTask.draftSaved'))">{{ t('message.pages.qualityTask.saveDraft') }}</el-button>
							<el-button type="primary" @click="saveStatus('处理中', t('message.pages.qualityTask.submitted'))">{{ t('message.pages.qualityTask.submit') }}</el-button>
							<el-button v-if="form.status === '处理中'" @click="saveStatus('待审核', t('message.pages.qualityTask.submitted'))">{{ t('message.pages.qualityTask.submitReview') }}</el-button>
							<el-button v-if="form.status === '待审核'" type="success" @click="saveStatus('已完成', t('message.pages.qualityTask.approve'))">{{ t('message.pages.qualityTask.approve') }}</el-button>
						</div>
					</el-card>
				</el-col>
				<el-col :span="10">
					<el-card shadow="never" class="mb-3">
						<template #header>{{ t('message.pages.qualityTask.comments') }}</template>
						<div v-for="c in form.comments" :key="c.id" class="kg-tasks__comment" :class="{ 'is-system': c.type === 'system' }">
							<strong>{{ c.author }}</strong> · {{ c.time }}
							<p>{{ c.text }}</p>
						</div>
						<el-input v-model="newComment" type="textarea" :rows="2" class="mt-2" />
						<el-button class="mt-2" size="small" @click="addComment">{{ t('message.pages.qualityTask.addComment') }}</el-button>
					</el-card>
					<el-card shadow="never">
						<template #header>{{ t('message.pages.qualityTask.attachments') }}</template>
						<div v-for="a in form.attachments" :key="a.id" class="kg-tasks__file">
							<el-icon><Document /></el-icon>
							{{ a.name }} ({{ a.size }})
						</div>
						<el-empty v-if="!form.attachments?.length" :image-size="48" />
					</el-card>
				</el-col>
			</el-row>
		</template>
	</div>
</template>

<script setup lang="ts" name="kg-quality-task-index">
import { computed, reactive, ref } from 'vue';
import { useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { ElMessage } from 'element-plus';
import { ArrowLeft, Document, Plus, Search } from '@element-plus/icons-vue';
import type { QualityTask, TaskApprovalStatus } from './types';
import { initialTasks } from './mock';

const { t } = useI18n();
const route = useRoute();
const issueFilter = computed(() => (route.query.issueId as string) || '');
const currentUser = '李四';

const tasks = ref<QualityTask[]>([...initialTasks]);
const searchQuery = ref('');
const filterStatus = ref<'all' | 'my' | 'pending'>('all');
const currentView = ref<'list' | 'detail' | 'create'>('list');
const activeTask = ref<QualityTask | null>(null);
const form = reactive<Partial<QualityTask>>({ comments: [], attachments: [] });
const newComment = ref('');

const filteredTasks = computed(() => {
	let list = tasks.value.filter((x) => !x.isDeleted && !x.isArchived);
	if (issueFilter.value) list = list.filter((x) => x.issueId === issueFilter.value);
	if (searchQuery.value) {
		const q = searchQuery.value.toLowerCase();
		list = list.filter((x) => x.id.toLowerCase().includes(q) || x.title.toLowerCase().includes(q));
	}
	if (filterStatus.value === 'my') list = list.filter((x) => x.assignee === currentUser);
	if (filterStatus.value === 'pending') list = list.filter((x) => x.status === '待审核');
	return list;
});

function statusTag(s: string) {
	if (s === '已完成') return 'success';
	if (s === '待审核') return 'warning';
	if (s === '已驳回') return 'danger';
	return 'info';
}

function openDetail(row: QualityTask) {
	activeTask.value = row;
	Object.assign(form, JSON.parse(JSON.stringify(row)));
	currentView.value = 'detail';
}

function openCreate() {
	activeTask.value = null;
	Object.assign(form, {
		issueId: issueFilter.value || '',
		title: '',
		description: '',
		assignee: currentUser,
		status: '草稿' as TaskApprovalStatus,
		priority: '中',
		phase: 'D0',
		startDate: new Date().toISOString().slice(0, 10),
		deadline: new Date(Date.now() + 172800000).toISOString().slice(0, 10),
		comments: [],
		attachments: [],
	});
	currentView.value = 'create';
}

function saveStatus(status: TaskApprovalStatus, msg: string) {
	if (!form.title) {
		ElMessage.warning('请填写任务标题');
		return;
	}
	form.status = status;
	if (activeTask.value) {
		const idx = tasks.value.findIndex((x) => x.id === activeTask.value!.id);
		if (idx >= 0) tasks.value[idx] = { ...tasks.value[idx], ...form } as QualityTask;
	} else {
		const id = `TSK-${Date.now()}`;
		tasks.value.unshift({ id, ...form, comments: form.comments || [], attachments: form.attachments || [] } as QualityTask);
	}
	ElMessage.success(msg);
	currentView.value = 'list';
}

function addComment() {
	if (!newComment.value.trim()) return;
	form.comments = form.comments || [];
	form.comments.push({
		id: String(Date.now()),
		author: currentUser,
		text: newComment.value,
		time: '刚刚',
		type: 'comment',
	});
	newComment.value = '';
}
</script>

<style scoped lang="scss">
.kg-tasks__head {
	display: flex;
	justify-content: space-between;
	align-items: flex-start;
	margin-bottom: 16px;
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
.kg-tasks__toolbar {
	display: flex;
	justify-content: space-between;
	margin-bottom: 12px;
	gap: 12px;
	flex-wrap: wrap;
}
.kg-tasks__actions {
	display: flex;
	gap: 8px;
	flex-wrap: wrap;
}
.kg-tasks__comment {
	margin-bottom: 12px;
	font-size: 13px;
	p {
		margin: 4px 0 0;
	}
	&.is-system {
		color: var(--el-text-color-secondary);
	}
}
.kg-tasks__file {
	display: flex;
	align-items: center;
	gap: 6px;
	font-size: 13px;
	margin-bottom: 8px;
}
.mb-3 {
	margin-bottom: 16px;
}
.mt-1 {
	margin-top: 6px;
}
.mt-2 {
	margin-top: 8px;
}
.w100 {
	width: 100%;
}
</style>
