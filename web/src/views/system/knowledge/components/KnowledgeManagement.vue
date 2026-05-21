<template>
	<div class="kg-mgmt kg-glass">
		<header class="kg-mgmt__head">
			<h2>{{ t('message.pages.knowledge.management.title') }}</h2>
			<div class="kg-mgmt__head-actions">
				<div class="kg-mgmt__search">
					<el-icon><Search /></el-icon>
					<input v-model="searchQuery" :placeholder="t('message.pages.knowledge.management.searchPlaceholder')" />
				</div>
				<button type="button" class="kg-mgmt__btn-sync" :disabled="isSyncing" @click="handleSyncQualityDocs">
					<el-icon :class="{ 'is-spin': isSyncing }"><Refresh /></el-icon>
					{{ t('message.pages.knowledge.management.syncDocs') }}
				</button>
				<button type="button" class="kg-mgmt__btn-create" @click="onNewKnowledge">
					<el-icon><Plus /></el-icon>
					{{ t('message.pages.knowledge.management.newKnowledge') }}
				</button>
			</div>
		</header>

		<div class="kg-mgmt__filters">
			<div class="kg-mgmt__status-tabs">
				<button
					v-for="s in statusFilters"
					:key="s.key"
					type="button"
					:class="{ 'is-active': filter === s.key }"
					@click="filter = s.key"
				>
					{{ s.label }}
				</button>
			</div>
			<div class="kg-mgmt__view-tabs">
				<button
					v-for="v in viewFilters"
					:key="v.key"
					type="button"
					:class="{ 'is-active': viewMode === v.key }"
					@click="viewMode = v.key"
				>
					{{ v.label }}
				</button>
			</div>
		</div>

		<div class="kg-mgmt__table-wrap">
			<table class="kg-mgmt__table">
				<thead>
					<tr>
						<th>{{ t('message.pages.knowledge.management.colId') }}</th>
						<th>{{ t('message.pages.knowledge.management.colTitle') }}</th>
						<th>{{ t('message.pages.knowledge.management.colCategory') }}</th>
						<th>{{ t('message.pages.knowledge.management.colAuthor') }}</th>
						<th>{{ t('message.pages.knowledge.management.colDate') }}</th>
						<th>{{ t('message.pages.knowledge.management.colStatus') }}</th>
						<th class="is-right">{{ t('message.pages.knowledge.management.colActions') }}</th>
					</tr>
				</thead>
				<tbody>
					<tr v-if="filteredItems.length === 0">
						<td colspan="7" class="kg-mgmt__empty">{{ t('message.pages.knowledge.management.empty') }}</td>
					</tr>
					<tr v-for="item in filteredItems" :key="item.id" class="kg-mgmt__row">
						<td class="is-id">{{ item.id }}</td>
						<td class="is-title" :title="item.title">{{ item.title }}</td>
						<td>
							<span class="kg-mgmt__cat">{{ item.category }}</span>
						</td>
						<td class="is-muted">{{ item.author }}</td>
						<td class="is-muted is-date">{{ item.date }}</td>
						<td>
							<span class="kg-mgmt__status" :class="`is-${item.status}`">
								<el-icon><component :is="statusIcon(item.status)" /></el-icon>
								{{ statusLabel(item.status) }}
							</span>
						</td>
						<td class="is-right">
							<div class="kg-mgmt__actions">
								<template v-if="viewMode === 'active'">
									<template v-if="item.status === 'pending'">
										<button type="button" class="is-pass" @click="handleStatusChange(item.id, 'published')">
											{{ t('message.pages.knowledge.management.approve') }}
										</button>
										<button type="button" class="is-reject" @click="handleStatusChange(item.id, 'rejected')">
											{{ t('message.pages.knowledge.management.reject') }}
										</button>
									</template>
									<button
										v-if="item.status === 'draft'"
										type="button"
										class="is-submit"
										@click="handleStatusChange(item.id, 'pending')"
									>
										{{ t('message.pages.knowledge.management.submitReview') }}
									</button>
									<button type="button" class="is-icon" :title="t('message.pages.knowledge.management.archive')" @click="handleArchive(item.id)">
										<el-icon><Box /></el-icon>
									</button>
									<button type="button" class="is-icon is-danger" :title="t('message.pages.knowledge.management.delete')" @click="handleDelete(item.id)">
										<el-icon><Delete /></el-icon>
									</button>
								</template>
								<button v-else type="button" class="is-restore" @click="onRestore(item)">
									<el-icon><RefreshLeft /></el-icon>
									{{ t('message.pages.knowledge.management.restore') }}
								</button>
							</div>
						</td>
					</tr>
				</tbody>
			</table>
		</div>
	</div>
</template>

<script setup lang="ts" name="KnowledgeManagement">
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { ElMessage } from 'element-plus';
import {
	Box,
	CircleCheck,
	CircleClose,
	Clock,
	Delete,
	EditPen,
	Plus,
	Refresh,
	RefreshLeft,
	Search,
} from '@element-plus/icons-vue';
import { initialKnowledgeMgmtItems } from '../mock-management';
import type { KnowledgeMgmtItem, KnowledgeMgmtStatus } from '../mock-management';

const { t } = useI18n();

const items = ref<KnowledgeMgmtItem[]>([...initialKnowledgeMgmtItems]);
const filter = ref<'all' | KnowledgeMgmtStatus>('all');
const viewMode = ref<'active' | 'archived' | 'deleted'>('active');
const searchQuery = ref('');
const isSyncing = ref(false);

const statusFilters = computed(() => [
	{ key: 'all' as const, label: t('message.pages.knowledge.management.filterAll') },
	{ key: 'pending' as const, label: t('message.pages.knowledge.management.filterPending') },
	{ key: 'published' as const, label: t('message.pages.knowledge.management.filterPublished') },
	{ key: 'draft' as const, label: t('message.pages.knowledge.management.filterDraft') },
	{ key: 'rejected' as const, label: t('message.pages.knowledge.management.filterRejected') },
]);

const viewFilters = computed(() => [
	{ key: 'active' as const, label: t('message.pages.knowledge.management.viewActive') },
	{ key: 'archived' as const, label: t('message.pages.knowledge.management.viewArchived') },
	{ key: 'deleted' as const, label: t('message.pages.knowledge.management.viewDeleted') },
]);

const filteredItems = computed(() =>
	items.value.filter((item) => {
		const matchesFilter = filter.value === 'all' || item.status === filter.value;
		const q = searchQuery.value.toLowerCase();
		const matchesSearch =
			!q || item.title.toLowerCase().includes(q) || item.id.toLowerCase().includes(q);
		let matchesView = false;
		if (viewMode.value === 'deleted') matchesView = !!item.isDeleted;
		else if (viewMode.value === 'archived') matchesView = !!item.isArchived && !item.isDeleted;
		else matchesView = !item.isArchived && !item.isDeleted;
		return matchesFilter && matchesSearch && matchesView;
	})
);

function statusLabel(status: KnowledgeMgmtStatus) {
	const map: Record<KnowledgeMgmtStatus, string> = {
		published: t('message.pages.knowledge.management.statusPublished'),
		pending: t('message.pages.knowledge.management.statusPending'),
		draft: t('message.pages.knowledge.management.statusDraft'),
		rejected: t('message.pages.knowledge.management.statusRejected'),
	};
	return map[status];
}

function statusIcon(status: KnowledgeMgmtStatus) {
	if (status === 'published') return CircleCheck;
	if (status === 'pending') return Clock;
	if (status === 'draft') return EditPen;
	return CircleClose;
}

function statusToastLabel(status: KnowledgeMgmtStatus) {
	if (status === 'published') return t('message.pages.knowledge.management.statusPublished');
	if (status === 'rejected') return t('message.pages.knowledge.management.statusRejected');
	return t('message.pages.knowledge.management.statusPending');
}

function handleStatusChange(id: string, newStatus: KnowledgeMgmtStatus) {
	items.value = items.value.map((item) => (item.id === id ? { ...item, status: newStatus } : item));
	ElMessage.success(
		t('message.pages.knowledge.management.statusUpdated', { id, status: statusToastLabel(newStatus) })
	);
}

function handleArchive(id: string) {
	items.value = items.value.map((item) => (item.id === id ? { ...item, isArchived: true } : item));
	ElMessage.success(t('message.pages.knowledge.management.archived', { id }));
}

function handleRestoreArchive(id: string) {
	items.value = items.value.map((item) => (item.id === id ? { ...item, isArchived: false } : item));
	ElMessage.success(t('message.pages.knowledge.management.restoredArchive', { id }));
}

function handleDelete(id: string) {
	items.value = items.value.map((item) => (item.id === id ? { ...item, isDeleted: true } : item));
	ElMessage.warning(t('message.pages.knowledge.management.deleted', { id }));
}

function handleRestoreDelete(id: string) {
	items.value = items.value.map((item) => (item.id === id ? { ...item, isDeleted: false } : item));
	ElMessage.success(t('message.pages.knowledge.management.restoredDelete', { id }));
}

function onRestore(item: KnowledgeMgmtItem) {
	if (viewMode.value === 'archived') handleRestoreArchive(item.id);
	else handleRestoreDelete(item.id);
}

function handleSyncQualityDocs() {
	isSyncing.value = true;
	setTimeout(() => {
		const today = new Date().toISOString().split('T')[0];
		items.value = [
			{
				id: 'KN-006',
				title: '制动盘总成 PFMEA V1.0',
				category: t('message.pages.knowledge.management.syncCategory'),
				author: t('message.pages.knowledge.management.syncAuthor'),
				date: today,
				status: 'published',
				isArchived: false,
				isDeleted: false,
			},
			...items.value,
		];
		isSyncing.value = false;
		ElMessage.success(t('message.pages.knowledge.management.syncDone'));
	}, 1500);
}

function onNewKnowledge() {
	ElMessage.info(t('message.pages.knowledge.management.newToast'));
}
</script>

<style scoped lang="scss">
.kg-glass {
	background: rgba(255, 255, 255, 0.98);
	border: 1px solid rgba(0, 0, 0, 0.06);
	box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
	border-radius: 12px;
}

.kg-mgmt {
	overflow: hidden;
}

.kg-mgmt__head {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	justify-content: space-between;
	gap: 16px;
	padding: 20px 24px;
	border-bottom: 1px solid rgba(0, 0, 0, 0.06);
	background: rgba(0, 0, 0, 0.02);
	h2 {
		margin: 0;
		font-size: 20px;
		font-weight: 700;
		font-family: Georgia, 'Times New Roman', serif;
		color: #0f172a;
	}
}

.kg-mgmt__head-actions {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 10px;
}

.kg-mgmt__search {
	position: relative;
	width: 256px;
	.el-icon {
		position: absolute;
		left: 12px;
		top: 50%;
		transform: translateY(-50%);
		color: #94a3b8;
		font-size: 14px;
	}
	input {
		width: 100%;
		height: 36px;
		padding: 0 14px 0 36px;
		border: 1px solid rgba(0, 0, 0, 0.1);
		border-radius: 999px;
		font-size: 13px;
		outline: none;
		background: #fff;
		&:focus {
			border-color: rgba(59, 130, 246, 0.45);
		}
	}
}

.kg-mgmt__btn-sync {
	display: inline-flex;
	align-items: center;
	gap: 6px;
	height: 36px;
	padding: 0 14px;
	border: 1px solid #bfdbfe;
	border-radius: 999px;
	background: #fff;
	color: #1d4ed8;
	font-size: 13px;
	cursor: pointer;
	&:hover:not(:disabled) {
		background: #eff6ff;
	}
	&:disabled {
		opacity: 0.7;
		cursor: wait;
	}
	.is-spin {
		animation: kg-spin 0.8s linear infinite;
	}
}

.kg-mgmt__btn-create {
	display: inline-flex;
	align-items: center;
	gap: 6px;
	height: 36px;
	padding: 0 16px;
	border: none;
	border-radius: 999px;
	background: #1a1a1a;
	color: #fff;
	font-size: 13px;
	font-weight: 500;
	cursor: pointer;
	box-shadow: 0 2px 6px rgba(0, 0, 0, 0.12);
	&:hover {
		background: #333;
	}
}

@keyframes kg-spin {
	to {
		transform: rotate(360deg);
	}
}

.kg-mgmt__filters {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	justify-content: space-between;
	gap: 12px;
	padding: 14px 24px;
	border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}

.kg-mgmt__status-tabs {
	display: flex;
	flex-wrap: wrap;
	gap: 6px;
	button {
		height: 32px;
		padding: 0 14px;
		border: 1px solid rgba(0, 0, 0, 0.1);
		border-radius: 4px;
		background: #fff;
		font-size: 12px;
		color: #475569;
		cursor: pointer;
		&.is-active {
			background: #1a1a1a;
			border-color: #1a1a1a;
			color: #fff;
		}
		&:not(.is-active):hover {
			background: #f8fafc;
		}
	}
}

.kg-mgmt__view-tabs {
	display: flex;
	gap: 2px;
	padding: 4px;
	background: #f1f5f9;
	border: 1px solid rgba(0, 0, 0, 0.06);
	border-radius: 4px;
	button {
		height: 28px;
		padding: 0 12px;
		border: none;
		background: transparent;
		font-size: 12px;
		color: #64748b;
		border-radius: 2px;
		cursor: pointer;
		&.is-active {
			background: #fff;
			color: #0f172a;
			font-weight: 500;
			box-shadow: 0 1px 2px rgba(0, 0, 0, 0.06);
		}
	}
}

.kg-mgmt__table-wrap {
	overflow-x: auto;
}

.kg-mgmt__table {
	width: 100%;
	border-collapse: collapse;
	font-size: 14px;
	thead {
		background: rgba(0, 0, 0, 0.02);
		border-bottom: 1px solid rgba(0, 0, 0, 0.06);
	}
	th {
		padding: 12px 24px;
		text-align: left;
		font-size: 12px;
		font-weight: 600;
		color: #64748b;
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
	}
}

.kg-mgmt__row {
	transition: background 0.15s;
	&:hover {
		background: rgba(0, 0, 0, 0.02);
		.kg-mgmt__actions {
			opacity: 1;
		}
	}
}

.kg-mgmt__empty {
	text-align: center;
	padding: 48px 24px !important;
	color: #94a3b8;
}

.is-id {
	font-family: ui-monospace, monospace;
	font-size: 12px;
	color: #94a3b8;
}

.is-title {
	font-weight: 500;
	color: #0f172a;
	max-width: 300px;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.is-muted {
	color: #64748b;
	&.is-date {
		font-size: 12px;
	}
}

.kg-mgmt__cat {
	display: inline-block;
	padding: 2px 8px;
	border: 1px solid rgba(0, 0, 0, 0.08);
	border-radius: 4px;
	font-size: 12px;
	color: #475569;
	background: #fff;
}

.kg-mgmt__status {
	display: inline-flex;
	align-items: center;
	gap: 4px;
	padding: 2px 8px;
	border-radius: 4px;
	font-size: 12px;
	font-weight: 500;
	border: 1px solid;
	&.is-published {
		background: #ecfdf5;
		color: #047857;
		border-color: #a7f3d0;
	}
	&.is-pending {
		background: #fffbeb;
		color: #b45309;
		border-color: #fde68a;
	}
	&.is-draft {
		background: #f8fafc;
		color: #475569;
		border-color: #e2e8f0;
	}
	&.is-rejected {
		background: #fef2f2;
		color: #b91c1c;
		border-color: #fecaca;
	}
}

.kg-mgmt__actions {
	display: flex;
	justify-content: flex-end;
	align-items: center;
	gap: 6px;
	opacity: 0;
	transition: opacity 0.15s;
	flex-wrap: wrap;
	button {
		border-radius: 4px;
		font-size: 12px;
		cursor: pointer;
		white-space: nowrap;
	}
	.is-pass {
		height: 28px;
		padding: 0 8px;
		border: 1px solid #a7f3d0;
		background: #fff;
		color: #059669;
		&:hover {
			background: #ecfdf5;
		}
	}
	.is-reject {
		height: 28px;
		padding: 0 8px;
		border: 1px solid #fecaca;
		background: #fff;
		color: #dc2626;
		&:hover {
			background: #fef2f2;
		}
	}
	.is-submit {
		height: 28px;
		padding: 0 8px;
		border: 1px solid rgba(59, 130, 246, 0.25);
		background: #fff;
		color: var(--el-color-primary);
		&:hover {
			background: rgba(59, 130, 246, 0.06);
		}
	}
	.is-icon {
		width: 28px;
		height: 28px;
		border: none;
		background: transparent;
		color: #64748b;
		display: flex;
		align-items: center;
		justify-content: center;
		&:hover {
			background: #fff7ed;
			color: #ea580c;
		}
		&.is-danger:hover {
			background: #fef2f2;
			color: #dc2626;
		}
	}
	.is-restore {
		display: inline-flex;
		align-items: center;
		gap: 4px;
		height: 28px;
		padding: 0 10px;
		border: 1px solid rgba(0, 0, 0, 0.1);
		background: #fff;
		color: var(--el-color-primary);
		&:hover {
			background: rgba(59, 130, 246, 0.06);
		}
	}
}

/* 回收站/归档行始终显示操作 */
.kg-mgmt__row:hover .kg-mgmt__actions,
.kg-mgmt__actions:has(.is-restore) {
	opacity: 1;
}
</style>
