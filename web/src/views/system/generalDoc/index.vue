<template>
	<div class="kg-gdocs" :class="{ 'is-embedded': embedded }">
		<p v-if="embedded" class="kg-gdocs__embedded-sub">{{ t('message.pages.generalDoc.embeddedSubtitle') }}</p>

		<div
			class="kg-gdocs__upload"
			:class="{ 'is-dragover': isDragOver, 'is-uploading': uploading }"
			@click="onUploadClick"
			@dragover.prevent="onDragOver"
			@dragleave.prevent="onDragLeave"
			@drop.prevent="onDrop"
		>
			<div class="kg-gdocs__upload-icon">
				<el-icon><UploadFilled /></el-icon>
			</div>
			<h3>{{ t('message.pages.generalDoc.uploadTitle') }}</h3>
			<p>{{ t('message.pages.generalDoc.uploadHint') }}</p>
			<button type="button" class="kg-gdocs__upload-btn" :disabled="uploading" @click.stop="onUploadClick">
				<el-icon><Document /></el-icon>
				{{ t('message.pages.generalDoc.selectFile') }}
			</button>
			<input
				ref="fileInputRef"
				type="file"
				accept=".pdf,.doc,.docx,.xlsx,.xls,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
				class="kg-gdocs__file-input"
				@change="onFileChange"
			/>
		</div>

		<el-dialog
			v-model="uploadDialogVisible"
			:title="t('message.pages.generalDoc.uploadDialogTitle')"
			width="480px"
			:close-on-click-modal="false"
			@closed="onUploadDialogClosed"
		>
			<el-form label-position="top">
				<el-form-item v-if="pendingFile" :label="t('message.pages.generalDoc.colName')">
					<span class="kg-gdocs__pending-name">{{ pendingFile.name }}</span>
				</el-form-item>
				<el-form-item :label="t('message.pages.generalDoc.uploadDocType')" required>
					<el-select v-model="uploadForm.docTypeId" class="w100" :loading="typesLoading" @change="onUploadDocTypeChange">
						<el-option
							v-for="opt in documentTypes"
							:key="opt.id"
							:label="opt.name"
							:value="opt.id"
						/>
					</el-select>
				</el-form-item>
				<el-form-item :label="t('message.pages.generalDoc.uploadFileDesc')">
					<el-input
						v-model="uploadForm.description"
						type="textarea"
						:rows="3"
						:placeholder="t('message.pages.generalDoc.noDescription')"
					/>
				</el-form-item>
				<el-form-item :label="t('message.pages.generalDoc.uploadWorkflow')">
					<el-select
						v-model="uploadForm.workflowDefinitionId"
						class="w100"
						clearable
						:placeholder="t('message.pages.generalDoc.uploadWorkflowPlaceholder')"
						:loading="workflowsLoading"
					>
						<el-option v-for="wf in workflowDefinitions" :key="wf.id" :label="wf.name" :value="wf.id" />
					</el-select>
				</el-form-item>
			</el-form>
			<template #footer>
				<el-button @click="uploadDialogVisible = false">{{ t('message.pages.generalDoc.uploadCancel') }}</el-button>
				<el-button type="primary" :loading="uploading" @click="confirmUpload">
					{{ t('message.pages.generalDoc.uploadConfirm') }}
				</el-button>
			</template>
		</el-dialog>

		<div class="kg-gdocs__card kg-glass">
			<div class="kg-gdocs__toolbar">
				<div class="kg-gdocs__search-wrap">
					<el-icon class="kg-gdocs__search-icon"><Search /></el-icon>
					<input
						v-model="searchQuery"
						class="kg-gdocs__search"
						:placeholder="t('message.pages.generalDoc.searchPlaceholder')"
					/>
				</div>
				<button type="button" class="kg-gdocs__btn-outline" @click="ElMessage.info(t('message.pages.generalDoc.filterOpen'))">
					<el-icon><Filter /></el-icon>
					{{ t('message.pages.generalDoc.filter') }}
				</button>
			</div>

			<div class="kg-gdocs__table-wrap">
				<table class="kg-gdocs__table">
					<thead>
						<tr>
							<th>{{ t('message.pages.generalDoc.colName') }}</th>
							<th>{{ t('message.pages.generalDoc.colType') }}</th>
							<th>{{ t('message.pages.generalDoc.colVersion') }}</th>
							<th>{{ t('message.pages.generalDoc.colStatus') }}</th>
							<th>{{ t('message.pages.generalDoc.colUploader') }}</th>
							<th>{{ t('message.pages.generalDoc.colUpdated') }}</th>
							<th class="is-right">{{ t('message.pages.generalDoc.colActions') }}</th>
						</tr>
					</thead>
					<tbody>
						<tr v-if="loading">
							<td colspan="7" class="kg-gdocs__empty">{{ t('message.pages.generalDoc.listLoading') }}</td>
						</tr>
						<tr v-else-if="list.length === 0">
							<td colspan="7" class="kg-gdocs__empty">
								<el-icon><DocumentDelete /></el-icon>
								<p>{{ t('message.pages.generalDoc.emptyList') }}</p>
							</td>
						</tr>
						<tr
							v-for="doc in list"
							:key="doc.id"
							class="kg-gdocs__row"
							@click="onView(doc.id)"
						>
							<td class="is-name">{{ doc.name }}</td>
							<td><span class="kg-type-pill">{{ doc.doc_type_name }}</span></td>
							<td>{{ doc.version }}</td>
							<td>
								<span class="kg-status-pill" :class="statusClass(doc.approval_status)">
									{{ statusLabel(doc.approval_status) }}
								</span>
							</td>
							<td>{{ doc.uploader || '—' }}</td>
							<td class="is-muted">{{ formatTime(doc.update_datetime) }}</td>
							<td class="is-right" @click.stop>
								<div class="kg-gdocs__actions">
									<button
										v-if="doc.can_trigger_workflow"
										type="button"
										class="kg-gdocs__text-btn"
										@click="onTriggerWorkflow(doc.id)"
									>
										{{ t('message.pages.generalDoc.triggerWorkflow') }}
									</button>
									<button
										type="button"
										class="kg-icon-btn"
										:title="t('message.pages.generalDoc.download')"
										@click="onDownload(doc)"
									>
										<el-icon><Download /></el-icon>
									</button>
									<button
										type="button"
										class="kg-icon-btn is-danger"
										:title="t('message.pages.generalDoc.delete')"
										@click="onDelete(doc.id)"
									>
										<el-icon><Delete /></el-icon>
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

<script setup lang="ts" name="kg-general-doc-index">
import { onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { ElMessage } from 'element-plus';
import { Delete, Document, DocumentDelete, Download, Filter, Search, UploadFilled } from '@element-plus/icons-vue';
import type { ApprovalStatus, GeneralDocListItem } from './types';
import {
	deleteGeneralDocument,
	downloadGeneralDocument,
	fetchDocumentTypes,
	fetchGeneralDocList,
	triggerGeneralDocWorkflow,
	uploadGeneralDocument,
	type DocumentType,
	type GeneralDocument,
} from '/@/api/docManage/generalDoc';
import { fetchWorkflowDefinitions, type WorkflowDefinition } from '/@/api/workflow/index';

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

const { t } = useI18n();
const router = useRouter();
const searchQuery = ref('');
const list = ref<GeneralDocListItem[]>([]);
const documentTypes = ref<DocumentType[]>([]);
const workflowDefinitions = ref<WorkflowDefinition[]>([]);
const loading = ref(false);
const typesLoading = ref(false);
const workflowsLoading = ref(false);
const uploading = ref(false);
const fileInputRef = ref<HTMLInputElement | null>(null);
const isDragOver = ref(false);
const uploadDialogVisible = ref(false);
const pendingFile = ref<File | null>(null);
const uploadForm = ref({
	docTypeId: undefined as number | undefined,
	description: '',
	workflowDefinitionId: undefined as number | undefined,
});

function mapRecord(doc: GeneralDocument): GeneralDocListItem {
	return {
		id: doc.id,
		name: doc.name,
		doc_type_id: doc.doc_type_id,
		doc_type_name: doc.doc_type_name,
		version: doc.version,
		approval_status: doc.approval_status,
		uploader: doc.uploader,
		update_datetime: doc.update_datetime,
		original_filename: doc.original_filename,
		can_trigger_workflow: doc.can_trigger_workflow,
	};
}

function formatTime(value: string) {
	if (!value) return '—';
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return value;
	return date.toLocaleString('zh-CN', { hour12: false });
}

function statusClass(status: ApprovalStatus) {
	if (status === 'approved') return 'is-approved';
	if (status === 'pending') return 'is-pending';
	return 'is-draft';
}

function statusLabel(status: ApprovalStatus) {
	if (status === 'approved') return t('message.pages.generalDoc.statusApproved');
	if (status === 'pending') return t('message.pages.generalDoc.statusPending');
	return t('message.pages.generalDoc.statusDraft');
}

async function loadWorkflowsForType(docTypeId?: number) {
	if (!docTypeId) {
		workflowDefinitions.value = [];
		return;
	}
	workflowsLoading.value = true;
	try {
		workflowDefinitions.value =
			(await fetchWorkflowDefinitions({ doc_type_id: docTypeId, is_active: true })) || [];
	} finally {
		workflowsLoading.value = false;
	}
}

function onUploadDocTypeChange(docTypeId: number) {
	uploadForm.value.workflowDefinitionId = undefined;
	loadWorkflowsForType(docTypeId);
}

async function onTriggerWorkflow(id: number) {
	try {
		await triggerGeneralDocWorkflow(id);
		ElMessage.success(t('message.pages.generalDoc.triggerWorkflowSuccess'));
		await loadList();
	} catch (err: unknown) {
		const data = (err as { response?: { data?: { detail?: string } } })?.response?.data;
		ElMessage.error(data?.detail || t('message.pages.generalDoc.triggerWorkflowFailed'));
	}
}

async function loadDocumentTypes() {
	typesLoading.value = true;
	try {
		documentTypes.value = (await fetchDocumentTypes()) || [];
	} finally {
		typesLoading.value = false;
	}
}

async function loadList() {
	loading.value = true;
	try {
		const data = await fetchGeneralDocList(searchQuery.value.trim() || undefined);
		list.value = (data || []).map(mapRecord);
	} catch {
		ElMessage.error(t('message.pages.generalDoc.listLoadFailed'));
	} finally {
		loading.value = false;
	}
}

function onView(id: number) {
	router.push(`${props.routePrefix}/general-doc/${id}`);
}

async function onDelete(id: number) {
	try {
		await deleteGeneralDocument(id);
		list.value = list.value.filter((d) => d.id !== id);
		ElMessage.warning(t('message.pages.generalDoc.deleteConfirm'));
	} catch {
		ElMessage.error(t('message.pages.generalDoc.deleteFailed'));
	}
}

async function onDownload(doc: GeneralDocListItem) {
	try {
		await downloadGeneralDocument(doc.id, doc.original_filename);
		ElMessage.success(t('message.pages.generalDoc.downloadToast'));
	} catch {
		ElMessage.error(t('message.pages.generalDoc.downloadFailed'));
	}
}

function onUploadClick() {
	if (uploading.value) return;
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
	const docTypeId = documentTypes.value[0]?.id;
	uploadForm.value = {
		docTypeId,
		description: '',
		workflowDefinitionId: undefined,
	};
	if (docTypeId) loadWorkflowsForType(docTypeId);
	uploadDialogVisible.value = true;
}

function onUploadDialogClosed() {
	pendingFile.value = null;
}

async function confirmUpload() {
	if (!uploadForm.value.docTypeId) {
		ElMessage.warning(t('message.pages.generalDoc.uploadTypeRequired'));
		return;
	}
	const file = pendingFile.value;
	if (!file) return;

	uploading.value = true;
	try {
		await uploadGeneralDocument(file, {
			doc_type_id: uploadForm.value.docTypeId,
			description: uploadForm.value.description,
			workflow_definition_id: uploadForm.value.workflowDefinitionId,
		});
		uploadDialogVisible.value = false;
		ElMessage.success(t('message.pages.generalDoc.uploadSuccess'));
		await loadList();
	} catch (err: unknown) {
		const data = (err as { response?: { data?: Record<string, string[] | string> } })?.response?.data;
		const detail =
			(Array.isArray(data?.file) ? data?.file[0] : undefined) ||
			(Array.isArray(data?.doc_type_id) ? data?.doc_type_id[0] : undefined) ||
			(typeof data?.detail === 'string' ? data.detail : undefined);
		ElMessage.error(detail || t('message.pages.generalDoc.uploadFailed'));
	} finally {
		uploading.value = false;
	}
}

let searchTimer: ReturnType<typeof setTimeout> | null = null;
watch(searchQuery, () => {
	if (searchTimer) clearTimeout(searchTimer);
	searchTimer = setTimeout(() => loadList(), 300);
});

onMounted(async () => {
	await loadDocumentTypes();
	await loadList();
});
</script>

<style scoped lang="scss">
.kg-glass {
	background: rgba(255, 255, 255, 0.98);
	border: 1px solid rgba(0, 0, 0, 0.06);
	box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
	border-radius: 8px;
}

.kg-gdocs.is-embedded {
	max-width: none;
}

.kg-gdocs__embedded-sub {
	margin: 0 0 16px;
	font-size: 13px;
	color: #64748b;
	line-height: 1.5;
}

.kg-gdocs__upload {
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
	&.is-uploading {
		opacity: 0.7;
		pointer-events: none;
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

.kg-gdocs__upload-icon {
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

.kg-gdocs__upload-btn {
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
	&:hover:not(:disabled) {
		background: #f8fafc;
	}
	&:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}
}

.kg-gdocs__file-input {
	position: absolute;
	width: 0;
	height: 0;
	opacity: 0;
	pointer-events: none;
}

.kg-gdocs__pending-name {
	font-size: 14px;
	color: #334155;
	word-break: break-all;
}

.w100 {
	width: 100%;
}

.kg-gdocs__toolbar {
	display: flex;
	align-items: center;
	gap: 12px;
	padding: 16px 20px;
	border-bottom: 1px solid rgba(0, 0, 0, 0.06);
	flex-wrap: wrap;
}

.kg-gdocs__search-wrap {
	position: relative;
	flex: 1;
	min-width: 200px;
}

.kg-gdocs__search-icon {
	position: absolute;
	left: 12px;
	top: 50%;
	transform: translateY(-50%);
	color: #94a3b8;
}

.kg-gdocs__search {
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

.kg-gdocs__btn-outline {
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

.kg-gdocs__table-wrap {
	overflow-x: auto;
}

.kg-gdocs__table {
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

.kg-gdocs__row {
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
		&.is-name {
			font-weight: 500;
		}
		&.is-muted {
			color: #64748b;
		}
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
}

.kg-status-pill {
	display: inline-block;
	padding: 2px 10px;
	font-size: 11px;
	font-weight: 700;
	border-radius: 4px;
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
}

.kg-gdocs__actions {
	display: inline-flex;
	align-items: center;
	justify-content: flex-end;
	gap: 8px;
}

.kg-gdocs__text-btn {
	border: none;
	background: transparent;
	color: var(--el-color-primary);
	font-size: 12px;
	font-weight: 600;
	cursor: pointer;
	padding: 4px 8px;
	border-radius: 4px;
	&:hover {
		background: var(--el-color-primary-light-9);
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
	color: #64748b;
	&:hover {
		background: #f1f5f9;
		color: #0f172a;
	}
	&.is-danger:hover {
		background: #fef2f2;
		color: #dc2626;
	}
}

.kg-gdocs__empty {
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
