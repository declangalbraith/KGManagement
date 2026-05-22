<template>
	<div class="kg-bom" :class="{ 'is-embedded': embedded }">
		<div v-if="!embedded" class="kg-bom__breadcrumb">
			<el-icon><Coin /></el-icon>
			<span>{{ t('message.pages.bom.breadcrumbSystem') }}</span>
			<el-icon class="kg-bom__chev"><ArrowRight /></el-icon>
			<span class="is-current">{{ t('message.pages.bom.breadcrumbCurrent') }}</span>
		</div>

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
				{{ t('message.pages.bom.selectExcel') }}
			</button>
			<input ref="fileInputRef" type="file" accept=".xlsx,.xls" class="kg-bom__file-input" @change="onFileChange" />
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
			<table class="kg-bom__table">
				<thead>
					<tr>
						<th>{{ t('message.pages.bom.colNameCode') }}</th>
						<th>{{ t('message.pages.bom.colVersion') }}</th>
						<th>{{ t('message.pages.bom.colDeviceLine') }}</th>
						<th>{{ t('message.pages.bom.colUpload') }}</th>
						<th>{{ t('message.pages.bom.colStatus') }}</th>
						<th>{{ t('message.pages.bom.colGraph') }}</th>
						<th class="is-right">{{ t('message.pages.bom.colActions') }}</th>
					</tr>
				</thead>
				<tbody>
					<tr v-for="bom in filtered" :key="bom.id" class="kg-bom__row">
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
							<span class="kg-badge" :class="statusClass(bom.status)">{{ statusLabel(bom.status) }}</span>
						</td>
						<td>
							<span class="kg-bom__ingest" :class="ingestClass(bom.ingestStatus)">
								<span class="kg-bom__ingest-dot" />
								{{ ingestLabel(bom.ingestStatus) }}
							</span>
						</td>
						<td class="is-right">
							<div class="kg-bom__actions">
								<button
									type="button"
									class="kg-bom__action-primary"
									@click="router.push(`${routePrefix}/bom/${bom.id}/extract`)"
								>
									<el-icon><Share /></el-icon>
									{{ t('message.pages.bom.extractGraph') }}
								</button>
								<button type="button" class="kg-icon-btn" :title="t('message.pages.bom.view')" @click="onView(bom.id)">
									<el-icon><View /></el-icon>
								</button>
								<button type="button" class="kg-icon-btn" :title="t('message.pages.bom.edit')" @click="onEdit(bom.id)">
									<el-icon><EditPen /></el-icon>
								</button>
								<button type="button" class="kg-icon-btn is-danger" :title="t('message.pages.bom.delete')" @click="onDelete(bom.id)">
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
import {
	ArrowRight,
	Coin,
	Delete,
	Document,
	EditPen,
	Filter,
	Plus,
	Search,
	Share,
	UploadFilled,
	View,
} from '@element-plus/icons-vue';
import type { BomRecord, BomStatus, IngestStatus } from './types';
import { bomList } from './mock';

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

function statusClass(status: BomStatus) {
	if (status === 'Active') return 'kg-badge--success';
	if (status === 'Draft') return 'kg-badge--low';
	return 'kg-badge--archived';
}

function statusLabel(status: BomStatus) {
	if (status === 'Active') return t('message.pages.bom.statusActive');
	if (status === 'Draft') return t('message.pages.bom.statusDraft');
	return t('message.pages.bom.statusArchived');
}

function ingestClass(status: IngestStatus) {
	if (status === 'Complete') return 'is-complete';
	if (status === 'Partial') return 'is-partial';
	return 'is-pending';
}

function ingestLabel(status: IngestStatus) {
	if (status === 'Complete') return t('message.pages.bom.ingestComplete');
	if (status === 'Partial') return t('message.pages.bom.ingestPartial');
	return t('message.pages.bom.ingestPending');
}

function onCreate() {
	ElMessage.info(t('message.pages.bom.createToast'));
}

function onUploadClick() {
	fileInputRef.value?.click();
}

function onFileChange(e: Event) {
	const input = e.target as HTMLInputElement;
	if (input.files?.length) {
		ElMessage.success(`${t('message.pages.bom.uploadToast')}: ${input.files[0].name}`);
		input.value = '';
	}
}

function onView(id: string) {
	router.push(`${props.routePrefix}/bom/${id}/extract`);
}

function onEdit(id: string) {
	ElMessage.info(`${t('message.pages.bom.edit')}: ${id}`);
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

.kg-bom__breadcrumb {
	display: flex;
	align-items: center;
	gap: 6px;
	font-size: 13px;
	color: #64748b;
	margin-bottom: 12px;
	.is-current {
		color: #0f172a;
		font-weight: 500;
	}
}

.kg-bom__chev {
	font-size: 12px;
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
		&:hover {
			background: rgba(0, 0, 0, 0.02);
		}
	}
	td {
		padding: 12px 16px;
		vertical-align: middle;
		&.is-right {
			text-align: right;
		}
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

.kg-badge {
	display: inline-block;
	padding: 2px 8px;
	font-size: 11px;
	font-weight: 600;
	border-radius: 4px;
	white-space: nowrap;
}
.kg-badge--success {
	background: #ecfdf5;
	color: #047857;
	border: 1px solid #a7f3d0;
}
.kg-badge--low {
	background: #f8fafc;
	color: #475569;
	border: 1px solid #e2e8f0;
}
.kg-badge--archived {
	background: #f1f5f9;
	color: #64748b;
	border: 1px solid #e2e8f0;
}

.kg-bom__ingest {
	display: inline-flex;
	align-items: center;
	gap: 6px;
	font-size: 12px;
	font-weight: 500;
	&.is-complete {
		color: #059669;
		.kg-bom__ingest-dot {
			background: #059669;
		}
	}
	&.is-partial {
		color: #2563eb;
		.kg-bom__ingest-dot {
			background: #2563eb;
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

.kg-bom__action-primary {
	display: inline-flex;
	align-items: center;
	gap: 4px;
	height: 32px;
	padding: 0 10px;
	border: 1px solid rgba(59, 130, 246, 0.25);
	border-radius: 6px;
	background: #fff;
	color: var(--el-color-primary);
	font-size: 12px;
	font-weight: 500;
	cursor: pointer;
	&:hover {
		background: rgba(59, 130, 246, 0.06);
	}
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
