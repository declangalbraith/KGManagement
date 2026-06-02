<template>
	<div v-if="loading" class="kg-gdoc-detail kg-gdoc-detail--loading">{{ t('message.pages.generalDoc.listLoading') }}</div>
	<div v-else-if="doc" class="kg-gdoc-detail">
		<header class="kg-gdoc-detail__head">
			<div class="kg-gdoc-detail__head-left">
				<button type="button" class="kg-gdoc-detail__back" @click="goBack">
					<el-icon><ArrowLeft /></el-icon>
				</button>
				<div>
					<div class="kg-gdoc-detail__title-row">
						<h1>{{ doc.name }}</h1>
						<span class="kg-status-pill" :class="statusClass">{{ statusLabel }}</span>
					</div>
					<div class="kg-gdoc-detail__meta">
						<span>{{ doc.doc_type_name }}</span>
						<span>·</span>
						<span class="mono">{{ doc.version }}</span>
					</div>
				</div>
			</div>
			<div class="kg-gdoc-detail__actions">
				<button type="button" class="kg-gdoc-detail__btn" @click="onDownload">
					<el-icon><Download /></el-icon>
					{{ t('message.pages.generalDoc.download') }}
				</button>
			</div>
		</header>

		<section class="kg-gdoc-detail__card">
			<h2>{{ t('message.pages.generalDoc.basicInfo') }}</h2>
			<div class="kg-gdoc-detail__grid">
				<div>
					<span class="kg-label">{{ t('message.pages.generalDoc.colType') }}</span>
					<strong>{{ doc.doc_type_name }}</strong>
				</div>
				<div>
					<span class="kg-label">{{ t('message.pages.generalDoc.colUploader') }}</span>
					<strong>{{ doc.uploader || '—' }}</strong>
				</div>
				<div>
					<span class="kg-label">{{ t('message.pages.generalDoc.labelApprover') }}</span>
					<strong>{{ doc.approver || '—' }}</strong>
				</div>
				<div>
					<span class="kg-label">{{ t('message.pages.generalDoc.labelFilename') }}</span>
					<strong>{{ doc.original_filename }}</strong>
				</div>
				<div>
					<span class="kg-label">{{ t('message.pages.generalDoc.labelUploadedAt') }}</span>
					<strong>{{ formatTime(doc.create_datetime) }}</strong>
				</div>
				<div>
					<span class="kg-label">{{ t('message.pages.generalDoc.colUpdated') }}</span>
					<strong>{{ formatTime(doc.update_datetime) }}</strong>
				</div>
				<div class="is-full">
					<span class="kg-label">{{ t('message.pages.generalDoc.labelDescription') }}</span>
					<div class="kg-gdoc-detail__desc">{{ doc.file_description || t('message.pages.generalDoc.noDescription') }}</div>
				</div>
			</div>
		</section>
	</div>
	<div v-else class="kg-gdoc-detail kg-gdoc-detail--empty">{{ t('message.pages.generalDoc.notFound') }}</div>
</template>

<script setup lang="ts" name="kg-general-doc-detail">
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { ElMessage } from 'element-plus';
import { ArrowLeft, Download } from '@element-plus/icons-vue';
import {
	downloadGeneralDocument,
	fetchGeneralDoc,
	type GeneralDocument,
} from '/@/api/docManage/generalDoc';

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const doc = ref<GeneralDocument | null>(null);
const loading = ref(true);

const statusClass = computed(() => {
	if (!doc.value) return '';
	if (doc.value.approval_status === 'approved') return 'is-approved';
	if (doc.value.approval_status === 'pending') return 'is-pending';
	return 'is-draft';
});

const statusLabel = computed(() => {
	if (!doc.value) return '';
	if (doc.value.approval_status === 'approved') return t('message.pages.generalDoc.statusApproved');
	if (doc.value.approval_status === 'pending') return t('message.pages.generalDoc.statusPending');
	return t('message.pages.generalDoc.statusDraft');
});

function formatTime(value: string) {
	if (!value) return '—';
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return value;
	return date.toLocaleString('zh-CN', { hour12: false });
}

function goBack() {
	router.push('/document-management?tab=general-doc');
}

async function loadDetail() {
	const id = Number(route.params.id);
	if (!id) {
		doc.value = null;
		loading.value = false;
		return;
	}
	loading.value = true;
	try {
		doc.value = await fetchGeneralDoc(id);
	} catch {
		doc.value = null;
		ElMessage.error(t('message.pages.generalDoc.detailLoadFailed'));
	} finally {
		loading.value = false;
	}
}

async function onDownload() {
	if (!doc.value) return;
	try {
		await downloadGeneralDocument(doc.value.id, doc.value.original_filename);
		ElMessage.success(t('message.pages.generalDoc.downloadToast'));
	} catch {
		ElMessage.error(t('message.pages.generalDoc.downloadFailed'));
	}
}

onMounted(loadDetail);
</script>

<style scoped lang="scss">
.kg-gdoc-detail {
	max-width: 960px;
	margin: 0 auto;
	padding: 0 8px 32px;
}

.kg-gdoc-detail--loading,
.kg-gdoc-detail--empty {
	padding: 48px 16px;
	text-align: center;
	color: #94a3b8;
}

.kg-gdoc-detail__head {
	display: flex;
	align-items: flex-start;
	justify-content: space-between;
	gap: 16px;
	margin-bottom: 24px;
}

.kg-gdoc-detail__head-left {
	display: flex;
	align-items: flex-start;
	gap: 12px;
	min-width: 0;
}

.kg-gdoc-detail__back {
	width: 36px;
	height: 36px;
	border: 1px solid #e2e8f0;
	border-radius: 8px;
	background: #fff;
	cursor: pointer;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	flex-shrink: 0;
}

.kg-gdoc-detail__title-row {
	display: flex;
	align-items: center;
	gap: 10px;
	flex-wrap: wrap;
	h1 {
		margin: 0;
		font-size: 24px;
		font-weight: 700;
		color: #0f172a;
	}
}

.kg-gdoc-detail__meta {
	margin-top: 6px;
	font-size: 13px;
	color: #64748b;
	display: flex;
	gap: 8px;
	flex-wrap: wrap;
	.mono {
		font-family: ui-monospace, monospace;
	}
}

.kg-gdoc-detail__actions {
	flex-shrink: 0;
}

.kg-gdoc-detail__btn {
	display: inline-flex;
	align-items: center;
	gap: 6px;
	height: 36px;
	padding: 0 14px;
	border: 1px solid #e2e8f0;
	border-radius: 6px;
	background: #fff;
	cursor: pointer;
	font-size: 14px;
	&:hover {
		background: #f8fafc;
	}
}

.kg-gdoc-detail__card {
	border: 1px solid rgba(0, 0, 0, 0.08);
	border-radius: 8px;
	background: #fff;
	padding: 20px;
	h2 {
		margin: 0 0 16px;
		font-size: 16px;
		font-weight: 600;
	}
}

.kg-gdoc-detail__grid {
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
	gap: 16px;
	.is-full {
		grid-column: 1 / -1;
	}
}

.kg-label {
	display: block;
	font-size: 12px;
	color: #64748b;
	margin-bottom: 4px;
}

.kg-gdoc-detail__desc {
	padding: 12px;
	border-radius: 6px;
	background: #f8fafc;
	color: #334155;
	line-height: 1.5;
	white-space: pre-wrap;
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
</style>
