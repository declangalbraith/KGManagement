<template>
	<div class="kg-issues">
		<div class="kg-issues__head">
			<div>
				<h1 class="kg-issues__title">{{ t('message.pages.issues.title') }}</h1>
				<p class="kg-issues__subtitle">{{ t('message.pages.issues.subtitle') }}</p>
			</div>
			<div class="kg-issues__actions">
				<el-button :loading="isExporting" @click="handleExport">
					<el-icon><Download /></el-icon>
					{{ t('message.pages.issues.export') }}
				</el-button>
				<el-button type="primary" @click="router.push('/issues/new')">
					<el-icon><Plus /></el-icon>
					{{ t('message.pages.issues.create') }}
				</el-button>
			</div>
		</div>

		<el-card shadow="never">
			<div class="kg-issues__toolbar">
				<div class="kg-issues__search">
					<el-input
						v-model="searchQuery"
						:placeholder="t('message.pages.issues.searchPlaceholder')"
						clearable
						class="kg-issues__search-input"
					>
						<template #prefix>
							<el-icon><Search /></el-icon>
						</template>
					</el-input>
					<el-button @click="ElMessage.info(t('message.pages.issues.filterOpen'))">
						<el-icon><Filter /></el-icon>
						{{ t('message.pages.issues.filter') }}
					</el-button>
				</div>
				<el-radio-group v-model="viewMode" size="small">
					<el-radio-button value="active">{{ t('message.pages.issues.viewActive') }}</el-radio-button>
					<el-radio-button value="hot">{{ t('message.pages.issues.viewHot') }}</el-radio-button>
					<el-radio-button value="archived">{{ t('message.pages.issues.viewArchived') }}</el-radio-button>
					<el-radio-button value="deleted">{{ t('message.pages.issues.viewDeleted') }}</el-radio-button>
				</el-radio-group>
			</div>

			<el-table :data="filteredIssues" stripe @row-click="onRowClick">
				<el-table-column prop="id" :label="t('message.pages.issues.colId')" width="150">
					<template #default="{ row }">
						<span class="kg-issues__id">{{ row.id }}</span>
					</template>
				</el-table-column>
				<el-table-column prop="title" :label="t('message.pages.issues.colTitle')" min-width="200">
					<template #default="{ row }">
						<span>{{ row.title }}</span>
						<el-icon v-if="row.isHot" class="kg-issues__hot"><WarningFilled /></el-icon>
					</template>
				</el-table-column>
				<el-table-column prop="category" :label="t('message.pages.issues.colCategory')" width="110" />
				<el-table-column prop="product" :label="t('message.pages.issues.colProduct')" width="100" />
				<el-table-column prop="status" :label="t('message.pages.issues.colStatus')" width="110">
					<template #default="{ row }">
						<el-tag :type="statusTagType(row.status)" size="small">{{ row.status }}</el-tag>
					</template>
				</el-table-column>
				<el-table-column prop="priority" :label="t('message.pages.issues.colPriority')" width="90">
					<template #default="{ row }">
						<el-tag :type="priorityTagType(row.priority)" size="small" effect="plain">{{ row.priority }}</el-tag>
					</template>
				</el-table-column>
				<el-table-column prop="owner" :label="t('message.pages.issues.colOwner')" width="90" />
				<el-table-column prop="date" :label="t('message.pages.issues.colDate')" width="110" />
				<el-table-column :label="t('message.pages.issues.colActions')" width="160" align="right" @click.stop>
					<template #default="{ row }">
						<template v-if="viewMode === 'active' || viewMode === 'hot'">
							<el-button link type="primary" @click.stop="router.push(`/issues/${row.id}`)">
								<el-icon><Odometer /></el-icon>
							</el-button>
							<el-button v-if="isAdmin && !row.isHot && viewMode === 'active'" link @click.stop="setHot(row.id, true)">
								<el-icon><WarningFilled /></el-icon>
							</el-button>
							<el-button link @click.stop="archiveIssue(row.id)"><el-icon><FolderOpened /></el-icon></el-button>
							<el-button link type="danger" @click.stop="deleteIssue(row.id)"><el-icon><Delete /></el-icon></el-button>
						</template>
						<el-button v-else link type="primary" @click.stop="restoreIssue(row.id)">
							<el-icon><RefreshRight /></el-icon>
						</el-button>
					</template>
				</el-table-column>
			</el-table>

			<div class="kg-issues__footer">
				<span>{{ t('message.pages.issues.pagination', { count: filteredIssues.length }) }}</span>
			</div>
		</el-card>
	</div>
</template>

<script setup lang="ts" name="kg-issues-index">
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { ElMessage } from 'element-plus';
import { Plus, Search, Filter, Download, WarningFilled, Odometer, FolderOpened, Delete, RefreshRight } from '@element-plus/icons-vue';
import type { IssueListItem, IssueViewMode } from './types';
import { initialIssues } from './mock';

const router = useRouter();
const { t } = useI18n();
const issues = ref<IssueListItem[]>([...initialIssues]);
const viewMode = ref<IssueViewMode>('active');
const searchQuery = ref('');
const isExporting = ref(false);
const isAdmin = true;

const filteredIssues = computed(() =>
	issues.value.filter((issue) => {
		const q = searchQuery.value.trim();
		const matchesSearch =
			!q || issue.title.includes(q) || issue.id.includes(q) || issue.product.includes(q);
		if (viewMode.value === 'deleted') return issue.isDeleted && matchesSearch;
		if (viewMode.value === 'archived') return issue.isArchived && !issue.isDeleted && matchesSearch;
		if (viewMode.value === 'hot') return issue.isHot && !issue.isDeleted && matchesSearch;
		return !issue.isArchived && !issue.isDeleted && matchesSearch;
	})
);

function statusTagType(status: string) {
	if (status === '已完成') return 'success';
	if (status === '处理中') return '';
	return 'warning';
}

function priorityTagType(priority: string) {
	if (priority === '紧急') return 'danger';
	if (priority === '高') return 'warning';
	return 'info';
}

function onRowClick(row: IssueListItem) {
	router.push(`/issues/${row.id}`);
}

function handleExport() {
	isExporting.value = true;
	setTimeout(() => {
		isExporting.value = false;
		ElMessage.success(t('message.pages.issues.exportSuccess'));
	}, 800);
}

function archiveIssue(id: string) {
	issues.value = issues.value.map((i) => (i.id === id ? { ...i, isArchived: true } : i));
	ElMessage.success(t('message.pages.issues.archived'));
}

function deleteIssue(id: string) {
	issues.value = issues.value.map((i) => (i.id === id ? { ...i, isDeleted: true } : i));
	ElMessage.warning(t('message.pages.issues.deleted'));
}

function restoreIssue(id: string) {
	issues.value = issues.value.map((i) =>
		i.id === id ? { ...i, isArchived: false, isDeleted: false } : i
	);
	ElMessage.success(t('message.pages.issues.restored'));
}

function setHot(id: string, hot: boolean) {
	issues.value = issues.value.map((i) => (i.id === id ? { ...i, isHot: hot } : i));
	ElMessage.success(hot ? t('message.pages.issues.hotSet') : t('message.pages.issues.hotRemoved'));
}
</script>

<style scoped lang="scss">
.kg-issues__head {
	display: flex;
	justify-content: space-between;
	align-items: flex-start;
	margin-bottom: 16px;
	gap: 12px;
}
.kg-issues__title {
	margin: 0;
	font-size: 24px;
	font-weight: 700;
}
.kg-issues__subtitle {
	margin: 6px 0 0;
	color: var(--el-text-color-secondary);
	font-size: 14px;
}
.kg-issues__actions {
	display: flex;
	gap: 8px;
}
.kg-issues__toolbar {
	display: flex;
	justify-content: space-between;
	align-items: center;
	flex-wrap: wrap;
	gap: 12px;
	margin-bottom: 12px;
}
.kg-issues__search {
	display: flex;
	gap: 8px;
	align-items: center;
}
.kg-issues__search-input {
	width: 280px;
}
.kg-issues__id {
	font-family: monospace;
	font-size: 12px;
	color: var(--el-color-primary);
}
.kg-issues__hot {
	color: var(--el-color-danger);
	margin-left: 6px;
	vertical-align: middle;
}
.kg-issues__footer {
	padding: 12px 0 4px;
	font-size: 13px;
	color: var(--el-text-color-secondary);
}
:deep(.el-table__row) {
	cursor: pointer;
}
</style>
