<template>
	<div class="kg-issues">
		<div class="kg-issues__head">
			<div>
				<h1 class="kg-issues__title">{{ t('message.pages.issues.title') }}</h1>
				<p class="kg-issues__subtitle">{{ t('message.pages.issues.subtitle') }}</p>
			</div>
			<div class="kg-issues__actions">
				<el-button class="kg-issues__btn-outline" :loading="isExporting" @click="handleExport">
					<el-icon><Download /></el-icon>
					{{ t('message.pages.issues.export') }}
				</el-button>
				<el-button class="kg-issues__btn-create" @click="router.push('/issues/new')">
					<el-icon><Plus /></el-icon>
					{{ t('message.pages.issues.create') }}
				</el-button>
			</div>
		</div>

		<div class="kg-issues__card kg-glass">
			<div class="kg-issues__toolbar">
				<div class="kg-issues__toolbar-left">
					<div class="kg-issues__search-wrap">
						<el-icon class="kg-issues__search-icon"><Search /></el-icon>
						<input
							v-model="searchQuery"
							class="kg-issues__search"
							:placeholder="t('message.pages.issues.searchPlaceholder')"
						/>
					</div>
					<el-button class="kg-issues__btn-outline" @click="ElMessage.info(t('message.pages.issues.filterOpen'))">
						<el-icon><Filter /></el-icon>
						{{ t('message.pages.issues.filter') }}
					</el-button>
				</div>
				<div class="kg-issues__tabs">
					<button
						type="button"
						class="kg-issues__tab"
						:class="{ 'is-active': viewMode === 'active' }"
						@click="viewMode = 'active'"
					>
						{{ t('message.pages.issues.viewActive') }}
					</button>
					<button
						type="button"
						class="kg-issues__tab"
						:class="{ 'is-active': viewMode === 'hot', 'is-hot-tab': viewMode === 'hot' }"
						@click="viewMode = 'hot'"
					>
						<svg class="kg-issues__tab-flame" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
						</svg>
						{{ t('message.pages.issues.viewHot') }}
					</button>
					<button
						type="button"
						class="kg-issues__tab"
						:class="{ 'is-active': viewMode === 'archived' }"
						@click="viewMode = 'archived'"
					>
						{{ t('message.pages.issues.viewArchived') }}
					</button>
					<button
						type="button"
						class="kg-issues__tab"
						:class="{ 'is-active': viewMode === 'deleted' }"
						@click="viewMode = 'deleted'"
					>
						{{ t('message.pages.issues.viewDeleted') }}
					</button>
				</div>
			</div>

			<div class="kg-issues__table-wrap">
				<table class="kg-issues__table">
					<thead>
						<tr>
							<th>{{ t('message.pages.issues.colId') }}</th>
							<th>{{ t('message.pages.issues.colTitle') }}</th>
							<th>{{ t('message.pages.issues.colCategory') }}</th>
							<th>{{ t('message.pages.issues.colProduct') }}</th>
							<th>{{ t('message.pages.issues.colStatus') }}</th>
							<th>{{ t('message.pages.issues.colPriority') }}</th>
							<th>{{ t('message.pages.issues.colOwner') }}</th>
							<th>{{ t('message.pages.issues.colDate') }}</th>
							<th class="is-right">{{ t('message.pages.issues.colActions') }}</th>
						</tr>
					</thead>
					<tbody>
						<tr
							v-for="issue in filteredIssues"
							:key="issue.id"
							class="kg-issues__row"
							@click="router.push(`/issues/${issue.id}`)"
						>
							<td>
								<span class="kg-issues__id">{{ issue.id }}</span>
							</td>
							<td class="kg-issues__title-cell">
								<span>{{ issue.title }}</span>
								<svg
									v-if="issue.isHot"
									class="kg-issues__flame"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2"
									title="热点问题"
								>
									<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
								</svg>
							</td>
							<td class="is-muted">{{ issue.category }}</td>
							<td class="is-muted">{{ issue.product }}</td>
							<td>
								<span class="kg-badge" :class="statusBadgeClass(issue.status)">{{ issue.status }}</span>
							</td>
							<td>
								<span class="kg-badge" :class="priorityBadgeClass(issue.priority)">{{ issue.priority }}</span>
							</td>
							<td class="is-muted">{{ issue.owner }}</td>
							<td class="is-muted is-mono">{{ issue.date }}</td>
							<td class="is-right" @click.stop>
								<div class="kg-issues__row-actions">
									<template v-if="viewMode === 'active' || viewMode === 'hot'">
										<button type="button" class="kg-icon-btn" :title="t('message.pages.issues.actionOverview')" @click.stop="router.push(`/issues/${issue.id}`)">
											<el-icon><Odometer /></el-icon>
										</button>
										<button
											v-if="isAdmin && !issue.isHot && viewMode === 'active'"
											type="button"
											class="kg-icon-btn is-danger-soft"
											:title="t('message.pages.issues.actionSetHot')"
											@click.stop="setHot(issue.id, true)"
										>
											<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="kg-icon-btn__svg">
												<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
											</svg>
										</button>
										<button
											v-if="isAdmin && issue.isHot"
											type="button"
											class="kg-icon-btn is-danger-soft"
											:title="t('message.pages.issues.actionRemoveHot')"
											@click.stop="setHot(issue.id, false)"
										>
											<el-icon><Hide /></el-icon>
										</button>
										<button type="button" class="kg-icon-btn is-warn-soft" :title="t('message.pages.issues.actionArchive')" @click.stop="archiveIssue(issue.id)">
											<el-icon><FolderOpened /></el-icon>
										</button>
										<button type="button" class="kg-icon-btn is-danger-soft" :title="t('message.pages.issues.actionDelete')" @click.stop="deleteIssue(issue.id)">
											<el-icon><Delete /></el-icon>
										</button>
									</template>
									<button
										v-else
										type="button"
										class="kg-icon-btn"
										:title="t('message.pages.issues.actionRestore')"
										@click.stop="restoreIssue(issue.id)"
									>
										<el-icon><RefreshRight /></el-icon>
									</button>
								</div>
							</td>
						</tr>
						<tr v-if="!filteredIssues.length">
							<td colspan="9" class="kg-issues__empty">
								<el-icon :size="32" class="kg-issues__empty-icon"><DocumentDelete /></el-icon>
								<p>{{ t('message.pages.issues.empty') }}</p>
							</td>
						</tr>
					</tbody>
				</table>
			</div>

			<div class="kg-issues__footer">
				<span>{{ t('message.pages.issues.pagination', { count: filteredIssues.length }) }}</span>
				<div class="kg-issues__pager">
					<button type="button" class="kg-issues__pager-btn" disabled>{{ t('message.pages.issues.prevPage') }}</button>
					<button type="button" class="kg-issues__pager-btn" :disabled="filteredIssues.length < 4">{{ t('message.pages.issues.nextPage') }}</button>
				</div>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts" name="kg-issues-index">
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { ElMessage } from 'element-plus';
import {
	Delete,
	DocumentDelete,
	Download,
	Filter,
	FolderOpened,
	Hide,
	Odometer,
	Plus,
	RefreshRight,
	Search,
} from '@element-plus/icons-vue';
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

function statusBadgeClass(status: string) {
	if (status === '已完成') return 'kg-badge--success';
	if (status === '处理中') return 'kg-badge--processing';
	return 'kg-badge--warning';
}

function priorityBadgeClass(priority: string) {
	if (priority === '紧急') return 'kg-badge--urgent';
	if (priority === '高') return 'kg-badge--high';
	if (priority === '低') return 'kg-badge--low';
	return 'kg-badge--medium';
}

function handleExport() {
	isExporting.value = true;
	setTimeout(() => {
		isExporting.value = false;
		ElMessage.success(t('message.pages.issues.exportSuccess'));
	}, 1200);
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
.kg-glass {
	background: rgba(255, 255, 255, 0.95);
	border: 1px solid rgba(0, 0, 0, 0.06);
	box-shadow: 0 4px 6px rgba(0, 0, 0, 0.04);
	border-radius: 8px;
}

.kg-issues__head {
	display: flex;
	justify-content: space-between;
	align-items: flex-start;
	margin-bottom: 24px;
	gap: 16px;
}

.kg-issues__title {
	margin: 0;
	font-size: 30px;
	font-weight: 700;
	letter-spacing: -0.02em;
	color: #0f172a;
}

.kg-issues__subtitle {
	margin: 8px 0 0;
	font-size: 14px;
	color: #64748b;
}

.kg-issues__actions {
	display: flex;
	gap: 12px;
	flex-shrink: 0;
}

.kg-issues__btn-outline {
	height: 40px;
	padding: 0 16px;
	border: 1px solid #e2e8f0;
	background: #fff;
	color: #334155;
	border-radius: 6px;
	&:hover {
		background: rgba(59, 130, 246, 0.05);
		color: var(--el-color-primary);
		border-color: #cbd5e1;
	}
}

.kg-issues__btn-create {
	height: 40px;
	padding: 0 18px;
	border: none;
	background: #1a1a1a;
	color: #fff;
	border-radius: 6px;
	box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
	&:hover {
		background: #333;
	}
}

.kg-issues__card {
	overflow: hidden;
	transition: box-shadow 0.2s;
	&:hover {
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.06);
	}
}

.kg-issues__toolbar {
	display: flex;
	justify-content: space-between;
	align-items: center;
	flex-wrap: wrap;
	gap: 12px;
	padding: 16px 20px;
	border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}

.kg-issues__toolbar-left {
	display: flex;
	align-items: center;
	gap: 8px;
}

.kg-issues__search-wrap {
	position: relative;
	width: 288px;
}

.kg-issues__search-icon {
	position: absolute;
	left: 12px;
	top: 50%;
	transform: translateY(-50%);
	color: #94a3b8;
	font-size: 16px;
}

.kg-issues__search {
	width: 100%;
	height: 40px;
	padding: 0 12px 0 36px;
	border: 1px solid transparent;
	border-radius: 6px;
	background: #f1f5f9;
	font-size: 14px;
	outline: none;
	transition: border-color 0.15s, background 0.15s, box-shadow 0.15s;
	&:focus {
		background: #fff;
		border-color: rgba(59, 130, 246, 0.3);
		box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
	}
}

.kg-issues__tabs {
	display: flex;
	gap: 2px;
	padding: 4px;
	background: #f1f5f9;
	border-radius: 6px;
}

.kg-issues__tab {
	display: inline-flex;
	align-items: center;
	gap: 4px;
	height: 32px;
	padding: 0 12px;
	border: none;
	background: transparent;
	font-size: 13px;
	color: #64748b;
	border-radius: 4px;
	cursor: pointer;
	transition: background 0.15s, color 0.15s, box-shadow 0.15s;
	&.is-active {
		background: #fff;
		color: var(--el-color-primary);
		box-shadow: 0 1px 2px rgba(0, 0, 0, 0.06);
	}
	&.is-hot-tab.is-active {
		color: #dc2626;
	}
}

.kg-issues__tab-flame {
	width: 14px;
	height: 14px;
}

.kg-issues__table-wrap {
	overflow-x: auto;
}

.kg-issues__table {
	width: 100%;
	border-collapse: collapse;
	font-size: 14px;
	text-align: left;
	thead tr {
		background: rgba(0, 0, 0, 0.02);
		border-bottom: 1px solid rgba(0, 0, 0, 0.06);
	}
	th {
		padding: 14px 24px;
		font-size: 12px;
		font-weight: 500;
		color: #64748b;
		white-space: nowrap;
		&.is-right {
			text-align: right;
		}
	}
	td {
		padding: 16px 24px;
		border-bottom: 1px solid rgba(0, 0, 0, 0.05);
		vertical-align: middle;
		&.is-right {
			text-align: right;
		}
		&.is-muted {
			color: #64748b;
		}
		&.is-mono {
			font-family: ui-monospace, monospace;
			font-size: 12px;
		}
	}
}

.kg-issues__row {
	cursor: pointer;
	transition: background 0.12s;
	&:hover {
		background: rgba(0, 0, 0, 0.02);
		.kg-issues__row-actions {
			opacity: 1;
		}
		.kg-issues__title-cell span {
			color: var(--el-color-primary);
		}
	}
}

.kg-issues__id {
	font-family: ui-monospace, monospace;
	font-size: 12px;
	font-weight: 500;
	color: #2563eb;
	&:hover {
		text-decoration: underline;
	}
}

.kg-issues__title-cell {
	font-weight: 500;
	color: #0f172a;
	display: flex;
	align-items: center;
	gap: 8px;
}

.kg-issues__flame {
	width: 16px;
	height: 16px;
	color: #ef4444;
	flex-shrink: 0;
}

.kg-badge {
	display: inline-block;
	padding: 2px 10px;
	font-size: 12px;
	font-weight: 500;
	border-radius: 4px;
	white-space: nowrap;
	box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
}
.kg-badge--processing {
	background: #1a1a1a;
	color: #fff;
}
.kg-badge--success {
	background: #ecfdf5;
	color: #059669;
	border: 1px solid #a7f3d0;
}
.kg-badge--warning {
	background: #fef9c3;
	color: #a16207;
	border: 1px solid #fde047;
}
.kg-badge--urgent {
	background: #fef2f2;
	color: #dc2626;
	border: 1px solid #fecaca;
}
.kg-badge--high {
	background: #fff7ed;
	color: #c2410c;
	border: 1px solid #fed7aa;
}
.kg-badge--medium {
	background: #fff;
	color: #475569;
	border: 1px solid #e2e8f0;
}
.kg-badge--low {
	background: #f8fafc;
	color: #64748b;
	border: 1px solid #e2e8f0;
}

.kg-issues__row-actions {
	display: inline-flex;
	align-items: center;
	justify-content: flex-end;
	gap: 2px;
	opacity: 0;
	transition: opacity 0.15s;
}

.kg-icon-btn {
	width: 32px;
	height: 32px;
	border: none;
	background: transparent;
	border-radius: 6px;
	color: #64748b;
	cursor: pointer;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	transition: background 0.12s, color 0.12s;
	&:hover {
		background: rgba(59, 130, 246, 0.1);
		color: var(--el-color-primary);
	}
	&.is-danger-soft:hover {
		background: #fef2f2;
		color: #dc2626;
	}
	&.is-warn-soft:hover {
		background: #fff7ed;
		color: #ea580c;
	}
}

.kg-icon-btn__svg {
	width: 16px;
	height: 16px;
}

.kg-issues__empty {
	text-align: center;
	padding: 48px 24px !important;
	color: #94a3b8;
	p {
		margin: 8px 0 0;
	}
}

.kg-issues__empty-icon {
	color: #cbd5e1;
}

.kg-issues__footer {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 14px 20px;
	border-top: 1px solid rgba(0, 0, 0, 0.06);
	background: rgba(0, 0, 0, 0.02);
	font-size: 13px;
	color: #64748b;
}

.kg-issues__pager {
	display: flex;
	gap: 8px;
}

.kg-issues__pager-btn {
	height: 32px;
	padding: 0 14px;
	font-size: 13px;
	border: 1px solid #e2e8f0;
	border-radius: 6px;
	background: #fff;
	color: #475569;
	cursor: pointer;
	&:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
	&:not(:disabled):hover {
		background: #f8fafc;
	}
}
</style>
