<template>
	<div class="kg-bom" :class="{ 'is-embedded': embedded }">
		<div v-if="!embedded" class="kg-bom__head">
			<h1 class="kg-bom__title">{{ t('message.pages.bom.title') }}</h1>
			<button type="button" class="kg-bom__btn-create" @click="onCreate">
				<el-icon><Plus /></el-icon>
				{{ t('message.pages.bom.create') }}
			</button>
		</div>
		<div v-else class="kg-bom__head kg-bom__head--embedded">
			<button type="button" class="kg-bom__btn-create" @click="onCreate">
				<el-icon><Plus /></el-icon>
				{{ t('message.pages.bom.create') }}
			</button>
		</div>

		<div class="kg-bom__upload" @click="onUploadClick">
			<div class="kg-bom__upload-icon">
				<el-icon><UploadFilled /></el-icon>
			</div>
			<h3>{{ t('message.pages.bom.uploadTitle') }}</h3>
			<p>{{ t('message.pages.bom.uploadHint') }}</p>
			<button type="button" class="kg-bom__upload-btn" @click.stop="onUploadClick">
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
						<th>{{ t('message.pages.bom.colNameCode') }}</th>
						<th>{{ t('message.pages.bom.colVersion') }}</th>
						<th>{{ t('message.pages.bom.colDeviceLine') }}</th>
						<th>{{ t('message.pages.bom.colUpload') }}</th>
						<th>{{ t('message.pages.bom.colGraph') }}</th>
						<th class="is-right">{{ t('message.pages.bom.colActions') }}</th>
					</tr>
				</thead>
				<tbody>
					<tr
						v-for="bom in filtered"
						:key="bom.id"
						class="kg-bom__row"
						@click="onView(bom.id)"
					>
						<td>
							<div class="kg-bom__name">{{ bom.name }}</div>
							<div class="kg-bom__code">{{ bom.code }}</div>
						</td>
						<td>
							<span class="kg-bom__version">{{ bom.version }}</span>
						</td>
						<td>
							<div>{{ bom.deviceModel }}</div>
							<div class="kg-bom__sub">{{ bom.productLine }}</div>
						</td>
						<td>
							<div>{{ bom.uploader }}</div>
							<div class="kg-bom__sub" :title="`${t('message.pages.bom.colUpload')} ${bom.updateTime}`">
								{{ bom.uploadTime }}
							</div>
						</td>
						<td>
							<span class="kg-bom__ingest" :class="ingestClass(bom.ingestStatus)">
								<span class="kg-bom__ingest-dot" />
								{{ ingestLabel(bom.ingestStatus) }}
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
			<div v-if="filtered.length === 0" class="kg-bom__empty">—</div>
		</div>
	</div>
</template>

<script setup lang="ts" name="kg-bom-index">
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { ElMessage } from 'element-plus';
import {
	Delete,
	Document,
	Download,
	Filter,
	Plus,
	Search,
	UploadFilled,
} from '@element-plus/icons-vue';
import type { BomRecord, IngestStatus } from './types';
import { bomList } from './mock';

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
const list = ref<BomRecord[]>([...bomList]);

const filtered = computed(() => {
	const q = searchQuery.value.trim().toLowerCase();
	if (!q) return list.value;
	return list.value.filter(
		(b) =>
			b.name.toLowerCase().includes(q) ||
			b.code.toLowerCase().includes(q) ||
			b.deviceModel.toLowerCase().includes(q) ||
			b.productLine.toLowerCase().includes(q)
	);
});

function ingestClass(status: IngestStatus) {
	return status === 'Extracted' ? 'is-extracted' : 'is-pending';
}

function ingestLabel(status: IngestStatus) {
	return status === 'Extracted'
		? t('message.pages.bom.ingestExtracted')
		: t('message.pages.bom.ingestPending');
}

function isAllowedBomFile(file: File) {
	const name = file.name.toLowerCase();
	return BOM_FILE_EXT.some((ext) => name.endsWith(ext));
}

function onCreate() {
	ElMessage.info(t('message.pages.bom.createToast'));
}

function onUploadClick() {
	fileInputRef.value?.click();
}

function onFileChange(e: Event) {
	const input = e.target as HTMLInputElement;
	const file = input.files?.[0];
	if (!file) return;
	if (!isAllowedBomFile(file)) {
		ElMessage.warning(t('message.pages.bom.uploadInvalidType'));
		input.value = '';
		return;
	}
	ElMessage.success(`${t('message.pages.bom.uploadToast')}: ${file.name}`);
	input.value = '';
}

function onView(id: string) {
	router.push(`${props.routePrefix}/bom/${id}/extract`);
}

function onDownload(bom: BomRecord) {
	const ext = bom.ingestStatus === 'Extracted' ? 'xlsx' : 'csv';
	const filename = `${bom.code}.${ext}`;
	const content = `BOM,${bom.code}\nName,${bom.name}\nVersion,${bom.version}`;
	const blob = new Blob([content], { type: 'text/csv;charset=utf-8' });
	const url = URL.createObjectURL(blob);
	const link = document.createElement('a');
	link.href = url;
	link.download = filename;
	link.click();
	URL.revokeObjectURL(url);
	ElMessage.success(t('message.pages.bom.downloadStarted', { name: bom.name }));
}

function onDelete(id: string) {
	list.value = list.value.filter((b) => b.id !== id);
	ElMessage.warning(t('message.pages.bom.deleteConfirm'));
}
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

.kg-bom__head--embedded {
	justify-content: flex-end;
	margin-bottom: 16px;
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

.kg-bom__btn-create {
	display: inline-flex;
	align-items: center;
	gap: 6px;
	height: 40px;
	padding: 0 18px;
	border: none;
	border-radius: 6px;
	background: #1a1a1a;
	color: #fff;
	font-size: 14px;
	font-weight: 500;
	cursor: pointer;
	box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
	&:hover {
		background: #333;
	}
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
	&:hover {
		background: rgba(0, 0, 0, 0.04);
		border-color: #cbd5e1;
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
	&:hover {
		background: #f8fafc;
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

.kg-bom__sub {
	font-size: 11px;
	color: #64748b;
	margin-top: 2px;
}

.kg-bom__version {
	display: inline-block;
	padding: 2px 8px;
	font-size: 11px;
	font-family: ui-monospace, monospace;
	border: 1px solid #e2e8f0;
	border-radius: 4px;
	background: #f8fafc;
	color: #475569;
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
