<template>
	<div class="kg-qdocs" :class="{ 'is-embedded': embedded }">
		<div v-if="!embedded" class="kg-qdocs__head">
			<div>
				<h1 class="kg-qdocs__title">{{ t('message.pages.qualityDocs.title') }}</h1>
				<p class="kg-qdocs__subtitle">{{ t('message.pages.qualityDocs.subtitle') }}</p>
			</div>
		</div>

		<div
			class="kg-qdocs__upload"
			:class="{ 'is-dragover': isDragOver }"
			@click="onUploadClick"
			@dragover.prevent="onDragOver"
			@dragleave.prevent="onDragLeave"
			@drop.prevent="onDrop"
		>
			<div class="kg-qdocs__upload-icon">
				<el-icon><UploadFilled /></el-icon>
			</div>
			<h3>{{ t('message.pages.qualityDocs.uploadTitle') }}</h3>
			<p>{{ t('message.pages.qualityDocs.uploadHint') }}</p>
			<button type="button" class="kg-qdocs__upload-btn" @click.stop="onUploadClick">
				<el-icon><Document /></el-icon>
				{{ t('message.pages.qualityDocs.selectFile') }}
			</button>
			<input
				ref="fileInputRef"
				type="file"
				accept=".pdf,.doc,.docx,.xlsx,.xls,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
				class="kg-qdocs__file-input"
				@change="onFileChange"
			/>
		</div>

		<el-dialog
			v-model="uploadDialogVisible"
			:title="t('message.pages.qualityDocs.uploadDialogTitle')"
			width="480px"
			:close-on-click-modal="false"
			@closed="onUploadDialogClosed"
		>
			<el-form label-position="top">
				<el-form-item v-if="pendingFile" :label="t('message.pages.qualityDocs.colName')">
					<span class="kg-qdocs__pending-name">{{ pendingFile.name }}</span>
				</el-form-item>
				<el-form-item :label="t('message.pages.qualityDocs.uploadFileType')" required>
					<el-select v-model="uploadForm.fileType" class="w100">
						<el-option
							v-for="opt in fileTypeOptions"
							:key="opt"
							:label="opt"
							:value="opt"
						/>
					</el-select>
				</el-form-item>
				<el-form-item :label="t('message.pages.qualityDocs.uploadFileDesc')">
					<el-input
						v-model="uploadForm.description"
						type="textarea"
						:rows="3"
						:placeholder="t('message.pages.qualityDocs.noDescription')"
					/>
				</el-form-item>
				<el-form-item :label="t('message.pages.qualityDocs.uploadApprover')" required>
					<el-select
						v-model="uploadForm.approver"
						class="w100"
						:placeholder="t('message.pages.qualityDocs.uploadApproverPlaceholder')"
					>
						<el-option
							v-for="person in mockApprovers"
							:key="person"
							:label="person"
							:value="person"
						/>
					</el-select>
				</el-form-item>
			</el-form>
			<template #footer>
				<el-button @click="uploadDialogVisible = false">{{ t('message.pages.qualityDocs.uploadCancel') }}</el-button>
				<el-button type="primary" @click="confirmUpload">{{ t('message.pages.qualityDocs.uploadConfirm') }}</el-button>
			</template>
		</el-dialog>

		<div class="kg-qdocs__card kg-glass">
			<div class="kg-qdocs__toolbar">
				<div class="kg-qdocs__tabs">
					<button
						type="button"
						class="kg-qdocs__tab"
						:class="{ 'is-active': viewMode === 'active' }"
						@click="viewMode = 'active'"
					>
						{{ t('message.pages.qualityDocs.viewActive') }}
					</button>
					<button
						type="button"
						class="kg-qdocs__tab"
						:class="{ 'is-active': viewMode === 'archived' }"
						@click="viewMode = 'archived'"
					>
						{{ t('message.pages.qualityDocs.viewArchived') }}
					</button>
					<button
						type="button"
						class="kg-qdocs__tab"
						:class="{ 'is-active': viewMode === 'deleted' }"
						@click="viewMode = 'deleted'"
					>
						{{ t('message.pages.qualityDocs.viewDeleted') }}
					</button>
				</div>
				<div class="kg-qdocs__search-wrap">
					<el-icon class="kg-qdocs__search-icon"><Search /></el-icon>
					<input
						v-model="searchQuery"
						class="kg-qdocs__search"
						:placeholder="t('message.pages.qualityDocs.searchPlaceholder')"
					/>
				</div>
				<button type="button" class="kg-qdocs__btn-outline" @click="ElMessage.info(t('message.pages.qualityDocs.filterOpen'))">
					<el-icon><Filter /></el-icon>
					{{ t('message.pages.qualityDocs.filter') }}
				</button>
			</div>

			<div class="kg-qdocs__table-wrap">
				<table class="kg-qdocs__table">
					<thead>
						<tr>
							<th>{{ t('message.pages.qualityDocs.colDocNumber') }}</th>
							<th>{{ t('message.pages.qualityDocs.colType') }}</th>
							<th>{{ t('message.pages.qualityDocs.colName') }}</th>
							<th>{{ t('message.pages.qualityDocs.colVersion') }}</th>
							<th>{{ t('message.pages.qualityDocs.colStatus') }}</th>
							<th>{{ t('message.pages.qualityDocs.colOwner') }}</th>
							<th>{{ t('message.pages.qualityDocs.colUpdated') }}</th>
							<th class="is-right">{{ t('message.pages.qualityDocs.colActions') }}</th>
						</tr>
					</thead>
					<tbody>
						<tr v-if="filtered.length === 0">
							<td colspan="8" class="kg-qdocs__empty">
								<el-icon><DocumentDelete /></el-icon>
								<p>{{ emptyText }}</p>
							</td>
						</tr>
						<tr
							v-for="doc in filtered"
							:key="doc.id"
							class="kg-qdocs__row"
							@click="router.push(`${props.routePrefix}/quality/${doc.id}`)"
						>
							<td class="is-mono">{{ doc.uniqueId }}</td>
							<td>
								<span class="kg-type-pill">{{ doc.fileType }}</span>
							</td>
							<td class="is-name">{{ doc.name }}</td>
							<td>{{ doc.version }}</td>
							<td>
								<span class="kg-status-pill" :class="statusClass(doc)">{{ statusLabel(doc) }}</span>
							</td>
							<td>{{ doc.owner }}</td>
							<td class="is-muted">{{ doc.updateDate }}</td>
							<td class="is-right" @click.stop>
								<div class="kg-qdocs__actions">
									<template v-if="viewMode === 'active'">
										<button
											type="button"
											class="kg-icon-btn"
											:title="t('message.pages.qualityDocs.view')"
											@click="router.push(`${props.routePrefix}/quality/${doc.id}`)"
										>
											<el-icon><View /></el-icon>
										</button>
										<button
											type="button"
											class="kg-icon-btn is-warn"
											:title="t('message.pages.qualityDocs.archive')"
											@click="archiveDoc(doc.id)"
										>
											<el-icon><FolderOpened /></el-icon>
										</button>
										<button
											type="button"
											class="kg-icon-btn is-danger"
											:title="t('message.pages.qualityDocs.delete')"
											@click="deleteDoc(doc.id)"
										>
											<el-icon><Delete /></el-icon>
										</button>
									</template>
									<button
										v-else
										type="button"
										class="kg-icon-btn"
										:title="viewMode === 'archived' ? t('message.pages.qualityDocs.restoreArchive') : t('message.pages.qualityDocs.restoreDelete')"
										@click="restoreDoc(doc.id)"
									>
										<el-icon><RefreshRight /></el-icon>
									</button>
								</div>
							</td>
						</tr>
					</tbody>
				</table>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts" name="kg-quality-docs-index">
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { ElMessage } from 'element-plus';
import {
	Delete,
	Document,
	DocumentDelete,
	Filter,
	FolderOpened,
	RefreshRight,
	Search,
	UploadFilled,
	View,
} from '@element-plus/icons-vue';
import { QUALITY_DOC_FILE_TYPES } from './constants';
import type { DocViewMode, QualityDocItem } from './types';
import { mockQualityDocs } from './mock';
import { getDocDisplayStatus } from './utils';

const props = withDefaults(
	defineProps<{
		embedded?: boolean;
		routePrefix?: string;
	}>(),
	{
		embedded: false,
		routePrefix: '/document-management',
	}
);

const fileTypeOptions = QUALITY_DOC_FILE_TYPES;
const mockApprovers = ['张三', '王五', '李经理', '赵六'];

const { t } = useI18n();
const router = useRouter();
const searchQuery = ref('');
const viewMode = ref<DocViewMode>('active');
const docs = ref<QualityDocItem[]>([...mockQualityDocs]);
const fileInputRef = ref<HTMLInputElement | null>(null);
const isDragOver = ref(false);
const uploadDialogVisible = ref(false);
const pendingFile = ref<File | null>(null);
const uploadForm = ref({
	fileType: QUALITY_DOC_FILE_TYPES[0],
	description: '',
	approver: '',
});
let docSeq = mockQualityDocs.length + 1;

const filtered = computed(() =>
	docs.value.filter((doc) => {
		if (viewMode.value === 'deleted') {
			if (!doc.isDeleted) return false;
		} else if (viewMode.value === 'archived') {
			if (!doc.isArchived || doc.isDeleted) return false;
		} else {
			if (doc.isArchived || doc.isDeleted) return false;
		}
		const q = searchQuery.value.trim().toLowerCase();
		if (!q) return true;
		return (
			doc.name.toLowerCase().includes(q) ||
			doc.uniqueId.toLowerCase().includes(q) ||
			doc.docNumber.toLowerCase().includes(q) ||
			doc.fileType.toLowerCase().includes(q)
		);
	})
);

const emptyText = computed(() => {
	if (viewMode.value === 'archived') return t('message.pages.qualityDocs.emptyArchived');
	if (viewMode.value === 'deleted') return t('message.pages.qualityDocs.emptyDeleted');
	return t('message.pages.qualityDocs.emptyActive');
});

function statusClass(doc: QualityDocItem) {
	const status = getDocDisplayStatus(doc);
	if (status === 'APPROVED') return 'is-approved';
	if (status === 'DRAFT') return 'is-draft';
	if (status === 'PENDING') return 'is-pending';
	if (status === 'REJECTED') return 'is-rejected';
	if (status === 'ARCHIVED') return 'is-archived';
	if (status === 'DELETED') return 'is-deleted';
	return 'is-default';
}

function statusLabel(doc: QualityDocItem) {
	const status = getDocDisplayStatus(doc);
	if (status === 'APPROVED') return t('message.pages.qualityDocs.statusApproved');
	if (status === 'PENDING') return t('message.pages.qualityDocs.statusPending');
	if (status === 'REJECTED') return t('message.pages.qualityDocs.statusRejected');
	if (status === 'ARCHIVED') return t('message.pages.qualityDocs.statusArchived');
	if (status === 'DELETED') return t('message.pages.qualityDocs.statusDeleted');
	return t('message.pages.qualityDocs.statusDraft');
}

function archiveDoc(id: string) {
	docs.value = docs.value.map((d) => (d.id === id ? { ...d, isArchived: true } : d));
	ElMessage.success(t('message.pages.qualityDocs.archived'));
}

function deleteDoc(id: string) {
	docs.value = docs.value.map((d) => (d.id === id ? { ...d, isDeleted: true, isArchived: false } : d));
	ElMessage.warning(t('message.pages.qualityDocs.deleted'));
}

function restoreDoc(id: string) {
	docs.value = docs.value.map((d) =>
		d.id === id ? { ...d, isDeleted: false, isArchived: false } : d
	);
	ElMessage.success(t('message.pages.qualityDocs.restored'));
}

function onUploadClick() {
	fileInputRef.value?.click();
}

function onDragOver() {
	isDragOver.value = true;
}

function onDragLeave() {
	isDragOver.value = false;
}

function onDrop(e: DragEvent) {
	isDragOver.value = false;
	const file = e.dataTransfer?.files?.[0];
	if (file) openUploadDialog(file);
}

function onFileChange(e: Event) {
	const input = e.target as HTMLInputElement;
	const file = input.files?.[0];
	if (!file) return;
	openUploadDialog(file);
	input.value = '';
}

function openUploadDialog(file: File) {
	pendingFile.value = file;
	uploadForm.value = {
		fileType: QUALITY_DOC_FILE_TYPES[0],
		description: '',
		approver: '',
	};
	uploadDialogVisible.value = true;
}

function onUploadDialogClosed() {
	pendingFile.value = null;
}

function confirmUpload() {
	if (!uploadForm.value.fileType) {
		ElMessage.warning(t('message.pages.qualityDocs.uploadTypeRequired'));
		return;
	}
	if (!uploadForm.value.approver) {
		ElMessage.warning(t('message.pages.qualityDocs.uploadApproverRequired'));
		return;
	}
	const file = pendingFile.value;
	const stem = file?.name.replace(/\.[^.]+$/, '') || '未命名文档';
	const seq = String(docSeq++).padStart(4, '0');
	const today = new Date().toISOString().slice(0, 10);
	const displayDate = today.replace(/-/g, '/');

	docs.value = [
		{
			id: `doc-upload-${Date.now()}`,
			uniqueId: `QD-2026-${seq}`,
			fileType: uploadForm.value.fileType,
			name: stem,
			docNumber: `DOC-${Date.now().toString(36).toUpperCase()}`,
			description: uploadForm.value.description,
			owner: '当前用户',
			approver: uploadForm.value.approver,
			department: '质量工程部',
			version: 'V0.1',
			status: 'PENDING',
			creatorName: '当前用户',
			createDate: today,
			updateDate: displayDate,
			isArchived: false,
			isDeleted: false,
			attachments: file
				? [{ id: `att-${Date.now()}`, name: file.name, size: file.size, uploadDate: today }]
				: [],
			auditLogs: [
				{
					id: `log-${Date.now()}`,
					operatorName: '当前用户',
					action: 'UPLOAD',
					timestamp: new Date().toISOString(),
					details: `提交审批，审批人：${uploadForm.value.approver}`,
				},
			],
		},
		...docs.value,
	];
	viewMode.value = 'active';
	uploadDialogVisible.value = false;
	ElMessage.success(t('message.pages.qualityDocs.uploadSuccess'));
}
</script>

<style scoped lang="scss">
.kg-glass {
	background: rgba(255, 255, 255, 0.98);
	border: 1px solid rgba(0, 0, 0, 0.06);
	box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
	border-radius: 8px;
}

.kg-qdocs.is-embedded {
	max-width: none;
}

.kg-qdocs__head {
	display: flex;
	justify-content: space-between;
	align-items: flex-start;
	margin-bottom: 24px;
	gap: 16px;
}

.kg-qdocs__title {
	margin: 0;
	font-size: 28px;
	font-weight: 700;
	letter-spacing: -0.02em;
	color: #0f172a;
}

.kg-qdocs__subtitle {
	margin: 8px 0 0;
	font-size: 14px;
	color: #64748b;
	max-width: 640px;
	line-height: 1.5;
}

.kg-qdocs__upload {
	position: relative;
	margin-bottom: 20px;
	padding: 32px 24px;
	border: 2px dashed #e2e8f0;
	border-radius: 8px;
	background: rgba(0, 0, 0, 0.02);
	text-align: center;
	cursor: pointer;
	transition: background 0.2s, border-color 0.2s;
	&:hover,
	&.is-dragover {
		background: rgba(0, 0, 0, 0.04);
		border-color: #cbd5e1;
	}
	&.is-dragover {
		border-color: var(--el-color-primary);
		background: var(--el-color-primary-light-9);
	}
	h3 {
		margin: 0 0 6px;
		font-size: 17px;
		font-weight: 500;
		color: #0f172a;
	}
	p {
		margin: 0 0 16px;
		font-size: 13px;
		color: #64748b;
		max-width: 520px;
		margin-left: auto;
		margin-right: auto;
	}
}

.kg-qdocs__upload-icon {
	width: 48px;
	height: 48px;
	margin: 0 auto 16px;
	border-radius: 50%;
	background: var(--el-color-primary-light-9);
	color: var(--el-color-primary);
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 24px;
}

.kg-qdocs__upload-btn {
	display: inline-flex;
	align-items: center;
	gap: 8px;
	height: 36px;
	padding: 0 16px;
	border: 1px solid #e2e8f0;
	border-radius: 6px;
	background: #fff;
	font-size: 14px;
	font-weight: 500;
	cursor: pointer;
	&:hover {
		background: #f8fafc;
	}
}

.kg-qdocs__file-input {
	position: absolute;
	width: 0;
	height: 0;
	opacity: 0;
	pointer-events: none;
}

.kg-qdocs__pending-name {
	font-size: 14px;
	color: #334155;
	word-break: break-all;
}

.w100 {
	width: 100%;
}

.kg-qdocs__toolbar {
	display: flex;
	align-items: center;
	gap: 12px;
	padding: 16px 20px;
	border-bottom: 1px solid rgba(0, 0, 0, 0.06);
	flex-wrap: wrap;
}

.kg-qdocs__tabs {
	display: flex;
	gap: 2px;
	padding: 4px;
	background: #f1f5f9;
	border-radius: 999px;
	flex-shrink: 0;
}

.kg-qdocs__tab {
	border: none;
	background: transparent;
	padding: 6px 14px;
	font-size: 13px;
	color: #64748b;
	border-radius: 999px;
	cursor: pointer;
	white-space: nowrap;
	&.is-active {
		background: #fff;
		color: #0f172a;
		font-weight: 500;
		box-shadow: 0 1px 2px rgba(0, 0, 0, 0.06);
	}
	&:not(.is-active):hover {
		color: #334155;
	}
}

.kg-qdocs__search-wrap {
	position: relative;
	flex: 1;
	min-width: 200px;
}

.kg-qdocs__search-icon {
	position: absolute;
	left: 12px;
	top: 50%;
	transform: translateY(-50%);
	color: #94a3b8;
}

.kg-qdocs__search {
	width: 100%;
	height: 40px;
	padding: 0 12px 0 36px;
	border: 1px solid #e2e8f0;
	border-radius: 6px;
	font-size: 14px;
	outline: none;
	background: #fff;
	&:focus {
		border-color: rgba(59, 130, 246, 0.4);
		box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
	}
}

.kg-qdocs__btn-outline {
	display: inline-flex;
	align-items: center;
	gap: 6px;
	height: 40px;
	padding: 0 16px;
	border: 1px solid #e2e8f0;
	border-radius: 6px;
	background: #fff;
	font-size: 14px;
	color: #334155;
	cursor: pointer;
	white-space: nowrap;
	flex-shrink: 0;
	&:hover {
		background: #f8fafc;
	}
}

.kg-qdocs__table-wrap {
	overflow-x: auto;
}

.kg-qdocs__table {
	width: 100%;
	border-collapse: collapse;
	font-size: 14px;
	thead {
		border-bottom: 1px solid rgba(0, 0, 0, 0.08);
		th {
			padding: 14px 16px;
			text-align: left;
			font-size: 13px;
			font-weight: 500;
			color: #64748b;
			white-space: nowrap;
			&.is-right {
				text-align: right;
			}
		}
	}
	tbody tr {
		border-bottom: 1px solid rgba(0, 0, 0, 0.04);
	}
}

.kg-qdocs__row {
	cursor: pointer;
	transition: background 0.12s;
	&:hover {
		background: rgba(0, 0, 0, 0.02);
	}
	td {
		padding: 14px 16px;
		vertical-align: middle;
		&.is-right {
			text-align: right;
		}
		&.is-mono {
			font-weight: 500;
			color: #0f172a;
		}
		&.is-name {
			font-weight: 500;
		}
		&.is-muted {
			color: #64748b;
		}
	}
	&:hover .kg-qdocs__actions {
		opacity: 1;
	}
}

.kg-type-pill {
	display: inline-block;
	padding: 2px 10px;
	font-size: 12px;
	font-weight: 600;
	border-radius: 999px;
	background: #f1f5f9;
	color: #475569;
	border: 1px solid transparent;
}

.kg-status-pill {
	display: inline-block;
	padding: 2px 10px;
	font-size: 11px;
	font-weight: 700;
	border-radius: 4px;
	letter-spacing: 0.02em;
	&.is-approved {
		background: #1a1a1a;
		color: #fff;
	}
	&.is-draft {
		background: #fff;
		color: #0f172a;
		border: 1px solid #1a1a1a;
	}
	&.is-pending {
		background: #fff7ed;
		color: #c2410c;
		border: 1px solid #fed7aa;
	}
	&.is-rejected {
		background: #fef2f2;
		color: #b91c1c;
		border: 1px solid #fecaca;
	}
	&.is-archived {
		background: #f8fafc;
		color: #475569;
		border: 1px solid #e2e8f0;
	}
	&.is-deleted {
		background: #f1f5f9;
		color: #64748b;
		border: 1px dashed #cbd5e1;
	}
	&.is-default {
		background: #f1f5f9;
		color: #475569;
	}
}

.kg-qdocs__actions {
	display: inline-flex;
	align-items: center;
	justify-content: flex-end;
	gap: 4px;
	opacity: 0;
	transition: opacity 0.15s;
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
	color: #64748b;
	&:hover {
		background: #f1f5f9;
		color: #0f172a;
	}
	&.is-warn:hover {
		background: #fff7ed;
		color: #ea580c;
	}
	&.is-danger:hover {
		background: #fef2f2;
		color: #dc2626;
	}
}

.kg-qdocs__empty {
	padding: 48px 16px !important;
	text-align: center;
	color: #94a3b8;
	.el-icon {
		font-size: 40px;
		margin-bottom: 8px;
		opacity: 0.4;
	}
	p {
		margin: 0;
	}
}
</style>
