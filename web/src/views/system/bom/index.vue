<template>
	<div class="kg-bom" :class="{ 'is-embedded': embedded }">
		<div v-if="!embedded" class="kg-bom__head">
			<h1 class="kg-bom__title">{{ t('message.pages.bom.title') }}</h1>
		</div>

		<div
			class="kg-bom__upload"
			:class="{ 'is-dragover': isDragOver, 'is-uploading': uploading }"
			@click="onUploadClick"
			@dragover.prevent="onDragOver"
			@dragleave.prevent="onDragLeave"
			@drop.prevent="onDrop"
		>
			<div class="kg-bom__upload-icon">
				<el-icon><UploadFilled /></el-icon>
			</div>
			<h3>{{ t('message.pages.bom.uploadTitle') }}</h3>
			<p>{{ t('message.pages.bom.uploadHint') }}</p>
			<button type="button" class="kg-bom__upload-btn" :disabled="uploading" @click.stop="onUploadClick">
				<el-icon class="is-excel"><Document /></el-icon>
				{{ t('message.pages.bom.selectFile') }}
			</button>
			<input
				ref="fileInputRef"
				type="file"
				accept=".xlsx,.xls,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv"
				class="kg-bom__file-input"
				@change="onFileChange"
			/>
		</div>

		<div class="kg-bom__controls">
			<div class="kg-bom__search-wrap">
				<el-icon class="kg-bom__search-icon"><Search /></el-icon>
				<input
					v-model="searchQuery"
					class="kg-bom__search"
					:placeholder="t('message.pages.bom.searchPlaceholder')"
					@keyup.enter="loadList"
				/>
			</div>
			<button type="button" class="kg-bom__btn-outline" @click="ElMessage.info(t('message.pages.bom.filterOpen'))">
				<el-icon><Filter /></el-icon>
				{{ t('message.pages.bom.filter') }}
			</button>
		</div>

		<div class="kg-bom__table-card">
			<div class="kg-bom__table-head">
				<h2 class="kg-bom__list-title">{{ t('message.pages.bom.listTitle') }}</h2>
			</div>
			<table class="kg-bom__table">
				<thead>
					<tr>
						<th>{{ t('message.pages.bom.colNumberDesc') }}</th>
						<th>{{ t('message.pages.bom.colState') }}</th>
						<th>{{ t('message.pages.bom.colTypeDesignation') }}</th>
						<th>{{ t('message.pages.bom.colUpload') }}</th>
						<th>{{ t('message.pages.bom.colGraph') }}</th>
						<th class="is-right">{{ t('message.pages.bom.colActions') }}</th>
					</tr>
				</thead>
				<tbody>
					<tr
						v-for="bom in list"
						:key="bom.id"
						class="kg-bom__row"
						@click="onView(bom.id)"
					>
						<td>
							<div class="kg-bom__name">{{ bom.description_en || '—' }}</div>
							<div class="kg-bom__code">{{ bom.number }}</div>
						</td>
						<td>
							<span class="kg-bom__state">{{ bom.state || '—' }}</span>
						</td>
						<td>
							<div>{{ bom.type_designation || '—' }}</div>
							<div class="kg-bom__sub">{{ bom.original_filename }}</div>
						</td>
						<td>
							<div>{{ bom.uploader || '—' }}</div>
							<div class="kg-bom__sub">{{ formatTime(bom.upload_time) }}</div>
						</td>
						<td>
							<span class="kg-bom__ingest" :class="ingestClass(bom.graph_status)">
								<span class="kg-bom__ingest-dot" />
								{{ ingestLabel(bom.graph_status) }}
							</span>
						</td>
						<td class="is-right" @click.stop>
							<div class="kg-bom__actions">
								<button
									type="button"
									class="kg-icon-btn"
									:title="t('message.pages.bom.download')"
									@click="onDownload(bom)"
								>
									<el-icon><Download /></el-icon>
								</button>
								<button
									type="button"
									class="kg-icon-btn is-danger"
									:title="t('message.pages.bom.delete')"
									@click="onDelete(bom.id)"
								>
									<el-icon><Delete /></el-icon>
								</button>
							</div>
						</td>
					</tr>
				</tbody>
			</table>
			<div v-if="loading" class="kg-bom__empty">{{ t('message.pages.bom.listLoading') }}</div>
			<div v-else-if="list.length === 0" class="kg-bom__empty">—</div>
		</div>
	</div>
</template>

<script setup lang="ts" name="kg-bom-index">
import { onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { ElMessage } from 'element-plus';
import { Delete, Document, Download, Filter, Search, UploadFilled } from '@element-plus/icons-vue';
import type { BomRecord, GraphStatus } from './types';
import {
	deleteBomDocument,
	downloadBomDocument,
	fetchBomList,
	uploadBomFile,
	type BomDocument,
} from '/@/api/docManage/bom';

const BOM_FILE_EXT = ['.xlsx', '.xls', '.csv'];

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
const fileInputRef = ref<HTMLInputElement | null>(null);
const isDragOver = ref(false);
const uploading = ref(false);
const loading = ref(false);
const list = ref<BomRecord[]>([]);

function mapRecord(doc: BomDocument): BomRecord {
	return {
		id: doc.id,
		number: doc.number,
		state: doc.state,
		type_designation: doc.type_designation,
		description_en: doc.description_en,
		uploader: doc.uploader,
		upload_time: doc.upload_time,
		graph_status: doc.graph_status,
		original_filename: doc.original_filename,
	};
}

function formatTime(value: string) {
	if (!value) return '—';
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return value;
	return date.toLocaleString('zh-CN', { hour12: false });
}

function ingestClass(status: GraphStatus) {
	return status === 'extracted' ? 'is-extracted' : 'is-pending';
}

function ingestLabel(status: GraphStatus) {
	return status === 'extracted'
		? t('message.pages.bom.ingestExtracted')
		: t('message.pages.bom.ingestPending');
}

function isAllowedBomFile(file: File) {
	const name = file.name.toLowerCase();
	return BOM_FILE_EXT.some((ext) => name.endsWith(ext));
}

async function loadList() {
	loading.value = true;
	try {
		const data = await fetchBomList(searchQuery.value.trim() || undefined);
		list.value = (data || []).map(mapRecord);
	} catch {
		ElMessage.error(t('message.pages.bom.listLoadFailed'));
	} finally {
		loading.value = false;
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
	if (file) handleBomFile(file);
}

function onFileChange(e: Event) {
	const input = e.target as HTMLInputElement;
	const file = input.files?.[0];
	if (!file) return;
	handleBomFile(file);
	input.value = '';
}

async function handleBomFile(file: File) {
	if (!isAllowedBomFile(file)) {
		ElMessage.warning(t('message.pages.bom.uploadInvalidType'));
		return;
	}
	uploading.value = true;
	try {
		await uploadBomFile(file);
		ElMessage.success(`${t('message.pages.bom.uploadToast')}: ${file.name}`);
		await loadList();
	} catch (err: unknown) {
		const detail =
			(err as { response?: { data?: { file?: string[]; detail?: string } } })?.response?.data?.file?.[0] ||
			(err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
		ElMessage.error(detail || t('message.pages.bom.uploadFailed'));
	} finally {
		uploading.value = false;
	}
}

function onView(id: number) {
	router.push(`${props.routePrefix}/bom/${id}/extract`);
}

async function onDownload(bom: BomRecord) {
	try {
		await downloadBomDocument(bom.id, bom.original_filename);
		ElMessage.success(t('message.pages.bom.downloadStarted', { name: bom.description_en || bom.number }));
	} catch {
		ElMessage.error(t('message.pages.bom.downloadFailed'));
	}
}

async function onDelete(id: number) {
	try {
		await deleteBomDocument(id);
		list.value = list.value.filter((b) => b.id !== id);
		ElMessage.warning(t('message.pages.bom.deleteConfirm'));
	} catch {
		ElMessage.error(t('message.pages.bom.deleteFailed'));
	}
}

let searchTimer: ReturnType<typeof setTimeout> | null = null;
watch(searchQuery, () => {
	if (searchTimer) clearTimeout(searchTimer);
	searchTimer = setTimeout(() => loadList(), 300);
});

onMounted(() => {
	loadList();
});
</script>

<style scoped lang="scss">
.kg-bom {
	max-width: 1280px;
	margin: 0 auto;
	padding: 0 8px 32px;

	&.is-embedded {
		max-width: none;
		margin: 0;
		padding: 0;
	}
}

.kg-bom__head {
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-bottom: 24px;
	gap: 16px;
}

.kg-bom__title {
	margin: 0;
	font-size: 24px;
	font-weight: 600;
	letter-spacing: -0.02em;
	color: #0f172a;
}

.kg-bom__upload {
	position: relative;
	margin-bottom: 24px;
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
		max-width: 480px;
		margin-left: auto;
		margin-right: auto;
	}
}

.kg-bom__upload-icon {
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

.kg-bom__upload-btn {
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
	.is-excel {
		color: #16a34a;
	}
	&:hover:not(:disabled) {
		background: #f8fafc;
	}
	&:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}
}

.kg-bom__file-input {
	position: absolute;
	width: 0;
	height: 0;
	opacity: 0;
	pointer-events: none;
}

.kg-bom__controls {
	display: flex;
	align-items: center;
	gap: 12px;
	margin-bottom: 16px;
	flex-wrap: wrap;
}

.kg-bom__search-wrap {
	position: relative;
	width: 320px;
}

.kg-bom__search-icon {
	position: absolute;
	left: 12px;
	top: 50%;
	transform: translateY(-50%);
	color: #94a3b8;
}

.kg-bom__search {
	width: 100%;
	height: 36px;
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

.kg-bom__btn-outline {
	display: inline-flex;
	align-items: center;
	gap: 6px;
	height: 36px;
	padding: 0 14px;
	border: 1px solid #e2e8f0;
	border-radius: 6px;
	background: #fff;
	font-size: 14px;
	color: #334155;
	cursor: pointer;
	&:hover {
		background: #f8fafc;
	}
}

.kg-bom__table-card {
	border: 1px solid rgba(0, 0, 0, 0.08);
	border-radius: 8px;
	background: #fff;
	box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
	overflow: hidden;
}

.kg-bom__table-head {
	padding: 16px 16px 0;
}

.kg-bom__list-title {
	margin: 0;
	font-size: 16px;
	font-weight: 600;
	color: #0f172a;
}

.kg-bom__table {
	width: 100%;
	border-collapse: collapse;
	font-size: 13px;
	text-align: left;
	thead {
		background: rgba(0, 0, 0, 0.03);
		border-bottom: 1px solid rgba(0, 0, 0, 0.06);
		th {
			padding: 12px 16px;
			font-size: 11px;
			font-weight: 600;
			text-transform: uppercase;
			letter-spacing: 0.04em;
			color: #64748b;
			&.is-right {
				text-align: right;
			}
		}
	}
	tbody tr {
		border-bottom: 1px solid rgba(0, 0, 0, 0.04);
	}
	td {
		padding: 12px 16px;
		vertical-align: middle;
		&.is-right {
			text-align: right;
		}
	}
}

.kg-bom__row {
	cursor: pointer;
	transition: background 0.12s;
	&:hover {
		background: rgba(0, 0, 0, 0.02);
	}
}

.kg-bom__name {
	font-weight: 600;
	color: #0f172a;
}

.kg-bom__code {
	font-size: 11px;
	font-family: ui-monospace, monospace;
	color: #64748b;
	margin-top: 2px;
}

.kg-bom__state {
	display: inline-block;
	padding: 2px 8px;
	font-size: 11px;
	font-family: ui-monospace, monospace;
	border: 1px solid #e2e8f0;
	border-radius: 4px;
	background: #f8fafc;
	color: #475569;
}

.kg-bom__sub {
	font-size: 11px;
	color: #64748b;
	margin-top: 2px;
}

.kg-bom__ingest {
	display: inline-flex;
	align-items: center;
	gap: 6px;
	font-size: 12px;
	font-weight: 500;
	&.is-extracted {
		color: #059669;
		.kg-bom__ingest-dot {
			background: #059669;
		}
	}
	&.is-pending {
		color: #64748b;
		.kg-bom__ingest-dot {
			background: #94a3b8;
		}
	}
}

.kg-bom__ingest-dot {
	width: 6px;
	height: 6px;
	border-radius: 50%;
	flex-shrink: 0;
}

.kg-bom__actions {
	display: inline-flex;
	align-items: center;
	justify-content: flex-end;
	gap: 4px;
	opacity: 0;
	transition: opacity 0.15s;
}
.kg-bom__row:hover .kg-bom__actions {
	opacity: 1;
}

.kg-icon-btn {
	width: 32px;
	height: 32px;
	border: none;
	background: transparent;
	border-radius: 6px;
	cursor: pointer;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	color: #64748b;
	&:hover {
		color: var(--el-color-primary);
		background: rgba(59, 130, 246, 0.06);
	}
	&.is-danger:hover {
		color: #dc2626;
		background: #fef2f2;
	}
}

.kg-bom__empty {
	padding: 32px;
	text-align: center;
	color: #94a3b8;
}
</style>
