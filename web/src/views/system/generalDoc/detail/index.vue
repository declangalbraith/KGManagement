<template>
	<div v-if="loading" class="kg-gdoc-detail kg-gdoc-detail--center">{{ t('message.pages.generalDoc.listLoading') }}</div>
	<div v-else-if="doc" class="kg-gdoc-detail">
		<!-- Header -->
		<header class="kg-gdoc-detail__head">
			<div class="kg-gdoc-detail__head-main">
				<button type="button" class="kg-gdoc-detail__back" @click="goBack">
					<el-icon><ArrowLeft /></el-icon>
				</button>
				<div class="kg-gdoc-detail__head-info">
					<div class="kg-gdoc-detail__title-row">
						<h1>{{ doc.name }}</h1>
						<span class="kg-status-pill" :class="statusClass">{{ statusLabel }}</span>
					</div>
					<div class="kg-gdoc-detail__meta">
						<span>{{ doc.doc_type_name }}</span>
						<span class="kg-gdoc-detail__dot">·</span>
						<span class="mono">{{ doc.version }}</span>
					</div>
				</div>
			</div>

			<div class="kg-gdoc-detail__actions">
				<button type="button" class="kg-action-btn is-outline-primary" @click="openPreview">
					<el-icon><View /></el-icon>
					{{ t('message.pages.generalDoc.preview') }}
				</button>
				<button type="button" class="kg-action-btn is-soft-primary" @click="onSmartRead">
					<el-icon><MagicStick /></el-icon>
					{{ t('message.pages.generalDoc.smartRead') }}
				</button>
				<template v-if="doc.approval_status === 'approved'">
					<button type="button" class="kg-action-btn is-outline-blue" @click="onExtractToGraph">
						<el-icon><Share /></el-icon>
						{{ t('message.pages.generalDoc.extractToGraph') }}
					</button>
					<button type="button" class="kg-action-btn is-orange" @click="onCheckOut">
						<el-icon><Lock /></el-icon>
						{{ t('message.pages.generalDoc.checkOut') }}
					</button>
					<button type="button" class="kg-action-btn is-indigo" @click="onRelease">
						<el-icon><Promotion /></el-icon>
						{{ t('message.pages.generalDoc.release') }}
					</button>
				</template>
				<template v-if="doc.approval_status === 'draft'">
					<button type="button" class="kg-action-btn is-outline" @click="onEdit">
						<el-icon><EditPen /></el-icon>
						{{ t('message.pages.generalDoc.edit') }}
					</button>
					<button type="button" class="kg-action-btn is-primary" @click="onSubmitReview">
						<el-icon><Select /></el-icon>
						{{ t('message.pages.generalDoc.submitReview') }}
					</button>
				</template>
				<template v-if="doc.approval_status === 'pending' && doc.pending_task_id">
					<button type="button" class="kg-action-btn is-danger" @click="onReject">
						<el-icon><CircleClose /></el-icon>
						{{ t('message.pages.generalDoc.reject') }}
					</button>
					<button type="button" class="kg-action-btn is-success" @click="onApprove">
						<el-icon><CircleCheck /></el-icon>
						{{ t('message.pages.generalDoc.approve') }}
					</button>
				</template>
				<button type="button" class="kg-action-btn is-outline" @click="onDownload">
					<el-icon><Download /></el-icon>
					{{ t('message.pages.generalDoc.download') }}
				</button>
			</div>
		</header>

		<!-- Body: 2/3 + 1/3 -->
		<div class="kg-gdoc-detail__body">
			<div class="kg-gdoc-detail__main">
				<!-- Basic Info -->
				<section class="kg-card kg-card--glow">
					<h3 class="kg-section-title">
						<el-icon><Document /></el-icon>
						{{ t('message.pages.generalDoc.basicInfo') }}
					</h3>
					<div class="kg-info-grid">
						<div class="kg-info-item">
							<span class="kg-info-label">{{ t('message.pages.generalDoc.colType') }}</span>
							<span class="kg-info-value">{{ doc.doc_type_name }}</span>
						</div>
						<div class="kg-info-item">
							<span class="kg-info-label">{{ t('message.pages.generalDoc.colVersion') }}</span>
							<span class="kg-info-value mono">{{ doc.version }}</span>
						</div>
						<div class="kg-info-item">
							<span class="kg-info-label">{{ t('message.pages.generalDoc.colUploader') }}</span>
							<span class="kg-info-value">{{ doc.uploader || '—' }}</span>
						</div>
						<div class="kg-info-item">
							<span class="kg-info-label">{{ t('message.pages.generalDoc.labelApprover') }}</span>
							<span class="kg-info-value">{{ doc.current_assignee_name || doc.workflow_definition_name || '—' }}</span>
						</div>
						<div class="kg-info-item">
							<span class="kg-info-label">{{ t('message.pages.generalDoc.labelFilename') }}</span>
							<span class="kg-info-value">{{ doc.original_filename }}</span>
						</div>
						<div class="kg-info-item">
							<span class="kg-info-label">{{ t('message.pages.generalDoc.labelFileExt') }}</span>
							<span class="kg-info-value mono">{{ doc.file_ext || '—' }}</span>
						</div>
						<div class="kg-info-item">
							<span class="kg-info-label">{{ t('message.pages.generalDoc.labelFileSize') }}</span>
							<span class="kg-info-value">{{ formatFileSize(doc.file_size) }}</span>
						</div>
						<div class="kg-info-item">
							<span class="kg-info-label">{{ t('message.pages.generalDoc.labelUploadedAt') }}</span>
							<span class="kg-info-value">{{ formatTime(doc.create_datetime) }}</span>
						</div>
						<div class="kg-info-item">
							<span class="kg-info-label">{{ t('message.pages.generalDoc.colUpdated') }}</span>
							<span class="kg-info-value">{{ formatTime(doc.update_datetime) }}</span>
						</div>
						<div class="kg-info-item is-full">
							<span class="kg-info-label">{{ t('message.pages.generalDoc.labelDescription') }}</span>
							<div class="kg-desc-box">{{ doc.file_description || t('message.pages.generalDoc.noDescription') }}</div>
						</div>
					</div>
				</section>
			</div>

			<aside class="kg-gdoc-detail__side">
				<!-- Recommended -->
				<section class="kg-card kg-card--recommend">
					<div class="kg-card--recommend__watermark" aria-hidden="true">
						<el-icon><Reading /></el-icon>
					</div>
					<div class="kg-card--recommend__inner">
						<h3 class="kg-section-title">
							<span class="kg-section-title__icon is-primary">
								<el-icon><Reading /></el-icon>
							</span>
							{{ t('message.pages.generalDoc.recommendedSet') }}
						</h3>
						<div class="kg-recommend-list">
							<router-link
								v-for="item in recommendedItems"
								:key="item.id"
								:to="`/knowledge/${item.id}`"
								class="kg-recommend-item"
							>
								<span class="kg-recommend-item__title">{{ item.title }}</span>
								<div class="kg-recommend-item__foot">
									<span class="kg-tag" :class="item.tagClass">{{ item.tag }}</span>
									<span class="kg-recommend-item__match">{{ item.match }} {{ t('message.pages.generalDoc.matchScore') }}</span>
								</div>
							</router-link>
						</div>
					</div>
				</section>

				<!-- Audit Log -->
				<section class="kg-card">
					<h3 class="kg-section-title">
						<span class="kg-section-title__icon is-muted">
							<el-icon><Clock /></el-icon>
						</span>
						{{ t('message.pages.generalDoc.auditTitle') }}
					</h3>
					<div class="kg-timeline">
						<div
							v-for="(log, index) in auditLogs"
							:key="`${log.action}-${log.time}-${index}`"
							class="kg-timeline__item"
						>
							<div class="kg-timeline__dot" />
							<div class="kg-timeline__card">
								<div class="kg-timeline__head">
									<div class="kg-timeline__operator">
										<el-icon class="kg-timeline__icon" :class="log.iconClass">
											<component :is="log.icon" />
										</el-icon>
										<strong>{{ log.operator }}</strong>
									</div>
									<span class="kg-timeline__time">{{ formatTimelineTime(log.time) }}</span>
								</div>
								<p class="kg-timeline__message">{{ log.message }}</p>
								<div v-if="log.detail" class="kg-timeline__detail">
									<el-icon><ChatDotRound /></el-icon>
									<span>{{ log.detail }}</span>
								</div>
							</div>
						</div>
					</div>
				</section>
			</aside>
		</div>

		<DocumentViewer
			v-model="viewerOpen"
			:title="doc.name"
			:doc-type="viewerDocType"
			:watermark-text="`CONFIDENTIAL - ${doc.name} - ${todayStr}`"
		/>
	</div>
	<div v-else class="kg-gdoc-detail kg-gdoc-detail--center kg-gdoc-detail--empty">{{ t('message.pages.generalDoc.notFound') }}</div>
</template>

<script setup lang="ts" name="kg-general-doc-detail">
import { computed, onMounted, ref, type Component } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { ElMessage, ElMessageBox } from 'element-plus';
import {
	ArrowLeft,
	ChatDotRound,
	CircleCheck,
	CircleClose,
	Clock,
	Document,
	Download,
	EditPen,
	Lock,
	MagicStick,
	Promotion,
	Reading,
	Select,
	Share,
	View,
} from '@element-plus/icons-vue';
import {
	approveGeneralDocument,
	downloadGeneralDocument,
	fetchGeneralDoc,
	fetchGeneralDocAuditLogs,
	rejectGeneralDocument,
	type GeneralDocument,
} from '/@/api/docManage/generalDoc';
import type { WorkflowAuditLog } from '/@/api/workflow/index';
import DocumentViewer from '../components/DocumentViewer.vue';

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const doc = ref<GeneralDocument | null>(null);
const loading = ref(true);
const viewerOpen = ref(false);

const todayStr = computed(() => new Date().toISOString().split('T')[0]);

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

const viewerDocType = computed((): 'pdf' | 'word' | 'excel' | 'text' | 'markdown' => {
	const ext = doc.value?.file_ext?.toLowerCase() || '';
	if (ext === 'pdf') return 'pdf';
	if (['doc', 'docx'].includes(ext)) return 'word';
	if (['xls', 'xlsx'].includes(ext)) return 'excel';
	return 'pdf';
});

const recommendedItems = computed(() => {
	if (!doc.value) return [];
	return [
		{
			id: 1,
			title: '制动盘表面异常磨损的根因分析与解决案例',
			tag: t('message.pages.generalDoc.recommendTagCase'),
			tagClass: 'is-blue',
			match: '95%',
		},
		{
			id: 2,
			title: '制动系统标准操作规程 (SOP) v2.0',
			tag: t('message.pages.generalDoc.recommendTagTech'),
			tagClass: 'is-purple',
			match: '88%',
		},
	];
});

type AuditEntry = {
	action: string;
	operator: string;
	time: string;
	message: string;
	detail?: string;
	icon: Component;
	iconClass: string;
};

const auditLogs = ref<AuditEntry[]>([]);

function mapAuditLog(log: WorkflowAuditLog): AuditEntry {
	const iconMap: Record<string, Component> = {
		file_created: Document,
		file_revised: Document,
		workflow_started: Promotion,
		workflow_step_approved: CircleCheck,
		workflow_completed: CircleCheck,
		workflow_rejected: CircleClose,
		workflow_bound: Promotion,
	};
	const classMap: Record<string, string> = {
		workflow_completed: 'is-green',
		workflow_step_approved: 'is-green',
		workflow_rejected: 'is-danger',
		workflow_started: 'is-blue',
		workflow_bound: 'is-blue',
	};
	return {
		action: log.action,
		operator: log.operator_name || t('message.pages.generalDoc.systemAuto'),
		time: log.create_datetime,
		message: log.message,
		detail: log.detail,
		icon: iconMap[log.action] || Clock,
		iconClass: classMap[log.action] || 'is-muted',
	};
}

async function loadAuditLogs() {
	if (!doc.value) return;
	try {
		const logs = await fetchGeneralDocAuditLogs(doc.value.id);
		auditLogs.value = (logs || []).map(mapAuditLog);
	} catch {
		auditLogs.value = [];
	}
}

function formatTime(value: string) {
	if (!value) return '—';
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return value;
	return date.toLocaleString('zh-CN', { hour12: false });
}

function formatTimelineTime(value: string) {
	if (!value) return '—';
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return value;
	return `${date.toLocaleDateString('zh-CN')} ${date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false })}`;
}

function formatFileSize(bytes: number) {
	if (!bytes) return '0 KB';
	return `${(bytes / 1024).toFixed(0)} KB`;
}

function goBack() {
	router.push('/document-management?tab=general-doc');
}

function openPreview() {
	viewerOpen.value = true;
}

function toastInfo(key: string) {
	ElMessage.info(t(`message.pages.generalDoc.${key}`));
}

function onSmartRead() {
	toastInfo('smartReadToast');
}

function onExtractToGraph() {
	toastInfo('extractToGraphToast');
}

function onCheckOut() {
	toastInfo('checkOutToast');
}

function onRelease() {
	toastInfo('releaseToast');
}

function onEdit() {
	toastInfo('editToast');
}

function onSubmitReview() {
	toastInfo('submitReviewToast');
}

function onReject() {
	if (!doc.value) return;
	ElMessageBox.prompt(t('message.pages.generalDoc.rejectCommentPlaceholder'), t('message.pages.generalDoc.reject'), {
		confirmButtonText: t('message.pages.generalDoc.reject'),
		cancelButtonText: t('message.pages.generalDoc.uploadCancel'),
		inputPlaceholder: t('message.pages.generalDoc.noDescription'),
	})
		.then(async ({ value }) => {
			doc.value = await rejectGeneralDocument(doc.value!.id, value || '');
			ElMessage.success(t('message.pages.generalDoc.rejectToast'));
			await loadAuditLogs();
		})
		.catch(() => undefined);
}

async function onApprove() {
	if (!doc.value) return;
	try {
		doc.value = await approveGeneralDocument(doc.value.id);
		ElMessage.success(t('message.pages.generalDoc.approveToast'));
		await loadAuditLogs();
	} catch (err: unknown) {
		const data = (err as { response?: { data?: { detail?: string } } })?.response?.data;
		ElMessage.error(data?.detail || t('message.pages.generalDoc.detailLoadFailed'));
	}
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
		await loadAuditLogs();
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
	max-width: 1152px;
	margin: 0 auto;
	padding: 24px 16px 40px;
}

.kg-gdoc-detail--center {
	display: flex;
	align-items: center;
	justify-content: center;
	min-height: 240px;
	color: #94a3b8;
}

.kg-gdoc-detail--empty {
	color: #ef4444;
}

/* ── Header ── */
.kg-gdoc-detail__head {
	display: flex;
	flex-direction: column;
	gap: 16px;
	margin-bottom: 24px;
}

.kg-gdoc-detail__head-main {
	display: flex;
	align-items: flex-start;
	gap: 16px;
	min-width: 0;
}

.kg-gdoc-detail__back {
	width: 40px;
	height: 40px;
	border: 1px solid #e2e8f0;
	border-radius: 50%;
	background: #fff;
	box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
	cursor: pointer;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	flex-shrink: 0;
	color: #334155;
	transition: background 0.15s;
	&:hover {
		background: #f8fafc;
	}
}

.kg-gdoc-detail__head-info {
	min-width: 0;
}

.kg-gdoc-detail__title-row {
	display: flex;
	align-items: center;
	flex-wrap: wrap;
	gap: 12px;
	h1 {
		margin: 0;
		font-size: clamp(20px, 3vw, 28px);
		font-weight: 700;
		letter-spacing: -0.02em;
		color: #0f172a;
		line-height: 1.2;
	}
}

.kg-gdoc-detail__meta {
	display: flex;
	align-items: center;
	flex-wrap: wrap;
	gap: 8px;
	margin-top: 6px;
	font-size: 14px;
	color: #64748b;
	.mono {
		font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
	}
}

.kg-gdoc-detail__dot {
	color: #cbd5e1;
}

.kg-gdoc-detail__actions {
	display: flex;
	flex-wrap: wrap;
	gap: 8px;
}

/* ── Action buttons ── */
.kg-action-btn {
	display: inline-flex;
	align-items: center;
	gap: 6px;
	height: 36px;
	padding: 0 14px;
	border-radius: 6px;
	font-size: 13px;
	font-weight: 500;
	cursor: pointer;
	border: 1px solid transparent;
	white-space: nowrap;
	transition: all 0.15s ease;
	.el-icon {
		font-size: 16px;
	}
	&.is-sm {
		height: 32px;
		padding: 0 12px;
		font-size: 12px;
	}
	&.is-outline {
		background: #fff;
		border-color: #e2e8f0;
		color: #334155;
		&:hover {
			background: #f8fafc;
		}
	}
	&.is-outline-primary {
		background: #fff;
		border-color: var(--el-color-primary);
		color: var(--el-color-primary);
		&:hover {
			background: rgba(59, 130, 246, 0.05);
		}
	}
	&.is-soft-primary {
		background: rgba(59, 130, 246, 0.1);
		color: #1d4ed8;
		&:hover {
			background: rgba(59, 130, 246, 0.18);
		}
	}
	&.is-outline-blue {
		background: #eff6ff;
		border-color: #bfdbfe;
		color: #1d4ed8;
		&:hover {
			background: #dbeafe;
		}
	}
	&.is-orange {
		background: #ea580c;
		color: #fff;
		&:hover {
			background: #c2410c;
		}
	}
	&.is-indigo {
		background: #4f46e5;
		color: #fff;
		&:hover {
			background: #4338ca;
		}
	}
	&.is-primary {
		background: #1a1a1a;
		color: #fff;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
		&:hover {
			background: #333;
		}
	}
	&.is-success {
		background: #059669;
		color: #fff;
		&:hover {
			background: #047857;
		}
	}
	&.is-danger {
		background: #fff;
		border-color: #fecaca;
		color: #dc2626;
		&:hover {
			background: #fef2f2;
		}
	}
}

/* ── Body grid ── */
.kg-gdoc-detail__body {
	display: grid;
	grid-template-columns: 1fr;
	gap: 24px;
}

.kg-gdoc-detail__main,
.kg-gdoc-detail__side {
	display: flex;
	flex-direction: column;
	gap: 24px;
}

/* ── Cards ── */
.kg-card {
	position: relative;
	border: 1px solid rgba(0, 0, 0, 0.08);
	border-radius: 12px;
	background: #fff;
	padding: 24px;
	box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
	overflow: hidden;
}

.kg-card--glow::before {
	content: '';
	position: absolute;
	top: -64px;
	right: -64px;
	width: 128px;
	height: 128px;
	border-radius: 50%;
	background: rgba(59, 130, 246, 0.06);
	filter: blur(32px);
	pointer-events: none;
}

.kg-card--recommend {
	background: linear-gradient(135deg, rgba(59, 130, 246, 0.06) 0%, transparent 60%);
	border-color: rgba(59, 130, 246, 0.15);
}

.kg-card--recommend__watermark {
	position: absolute;
	top: 0;
	right: 0;
	padding: 16px;
	opacity: 0.08;
	pointer-events: none;
	.el-icon {
		font-size: 128px;
		color: var(--el-color-primary);
	}
}

.kg-card--recommend__inner {
	position: relative;
	z-index: 1;
}

/* ── Section titles ── */
.kg-section-title {
	display: flex;
	align-items: center;
	gap: 8px;
	margin: 0 0 20px;
	font-size: 18px;
	font-weight: 600;
	color: #0f172a;
	.el-icon {
		font-size: 20px;
		color: var(--el-color-primary);
	}
}

.kg-section-title__icon {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 32px;
	height: 32px;
	border-radius: 8px;
	.el-icon {
		font-size: 18px;
	}
	&.is-primary {
		background: rgba(59, 130, 246, 0.1);
		.el-icon {
			color: var(--el-color-primary);
		}
	}
	&.is-muted {
		background: #f1f5f9;
		.el-icon {
			color: #64748b;
		}
	}
}

/* ── Basic info grid ── */
.kg-info-grid {
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
	gap: 24px 32px;
}

.kg-info-item.is-full {
	grid-column: 1 / -1;
}

.kg-info-label {
	display: block;
	font-size: 11px;
	font-weight: 500;
	text-transform: uppercase;
	letter-spacing: 0.06em;
	color: #64748b;
	margin-bottom: 6px;
}

.kg-info-value {
	font-size: 15px;
	font-weight: 500;
	color: #0f172a;
	&.mono {
		font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
	}
}

.kg-desc-box {
	margin-top: 4px;
	padding: 12px 14px;
	border-radius: 8px;
	background: rgba(0, 0, 0, 0.03);
	color: #334155;
	line-height: 1.6;
	white-space: pre-wrap;
}

/* ── Recommend ── */
.kg-recommend-list {
	display: flex;
	flex-direction: column;
	gap: 12px;
}

.kg-recommend-item {
	display: block;
	padding: 14px;
	border: 1px solid rgba(0, 0, 0, 0.06);
	border-radius: 12px;
	background: rgba(255, 255, 255, 0.85);
	text-decoration: none;
	color: inherit;
	transition: all 0.15s ease;
	&:hover {
		border-color: rgba(59, 130, 246, 0.35);
		background: #fff;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
		.kg-recommend-item__title {
			color: var(--el-color-primary);
		}
	}
}

.kg-recommend-item__title {
	display: block;
	font-size: 14px;
	font-weight: 500;
	line-height: 1.5;
	color: #0f172a;
	transition: color 0.15s;
}

.kg-recommend-item__foot {
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-top: 12px;
	gap: 8px;
}

.kg-recommend-item__match {
	font-size: 12px;
	font-weight: 600;
	color: #059669;
	white-space: nowrap;
}

.kg-tag {
	display: inline-block;
	padding: 2px 8px;
	font-size: 10px;
	font-weight: 600;
	border-radius: 999px;
	&.is-blue {
		background: #dbeafe;
		color: #1d4ed8;
		border: 1px solid #bfdbfe;
	}
	&.is-purple {
		background: #f3e8ff;
		color: #7e22ce;
		border: 1px solid #e9d5ff;
	}
}

/* ── Timeline ── */
.kg-timeline {
	margin-left: 4px;
	border-left: 2px solid #e2e8f0;
	padding-left: 20px;
}

.kg-timeline__item {
	position: relative;
	padding: 0 0 16px;
	&:last-child {
		padding-bottom: 0;
	}
}

.kg-timeline__dot {
	position: absolute;
	left: -27px;
	top: 16px;
	width: 14px;
	height: 14px;
	border-radius: 50%;
	background: #fff;
	border: 2px solid #94a3b8;
	box-shadow: 0 0 0 4px #fff;
}

.kg-timeline__card {
	padding: 14px;
	border-radius: 8px;
	background: rgba(0, 0, 0, 0.02);
	border: 1px solid transparent;
	transition: all 0.15s;
	&:hover {
		background: rgba(0, 0, 0, 0.04);
		border-color: rgba(0, 0, 0, 0.06);
	}
}

.kg-timeline__head {
	display: flex;
	align-items: flex-start;
	justify-content: space-between;
	gap: 8px;
}

.kg-timeline__operator {
	display: flex;
	align-items: center;
	gap: 8px;
	strong {
		font-size: 14px;
		color: #0f172a;
	}
}

.kg-timeline__icon {
	font-size: 16px;
	&.is-green {
		color: #059669;
	}
	&.is-blue {
		color: #2563eb;
	}
	&.is-muted {
		color: #64748b;
	}
}

.kg-timeline__time {
	font-size: 11px;
	font-family: ui-monospace, monospace;
	color: #94a3b8;
	white-space: nowrap;
	flex-shrink: 0;
}

.kg-timeline__message {
	margin: 8px 0 0;
	font-size: 14px;
	font-weight: 500;
	color: #334155;
	line-height: 1.4;
}

.kg-timeline__detail {
	display: flex;
	align-items: flex-start;
	gap: 8px;
	margin-top: 10px;
	padding: 10px 12px;
	border-radius: 6px;
	background: #fff;
	border: 1px solid #e2e8f0;
	font-size: 12px;
	color: #64748b;
	line-height: 1.5;
	.el-icon {
		flex-shrink: 0;
		margin-top: 1px;
		opacity: 0.5;
	}
}

/* ── Status pill ── */
.kg-status-pill {
	display: inline-flex;
	align-items: center;
	padding: 3px 10px;
	font-size: 12px;
	font-weight: 600;
	border-radius: 999px;
	border: 1px solid transparent;
	&.is-approved {
		background: rgba(5, 150, 105, 0.1);
		color: #059669;
		border-color: rgba(5, 150, 105, 0.2);
	}
	&.is-draft {
		background: #f1f5f9;
		color: #475569;
		border-color: #e2e8f0;
	}
	&.is-pending {
		background: #fff7ed;
		color: #c2410c;
		border-color: #fed7aa;
	}
}

/* ── Responsive ── */
@media (min-width: 768px) {
	.kg-gdoc-detail__head {
		flex-direction: row;
		align-items: flex-start;
		justify-content: space-between;
	}
	.kg-gdoc-detail__actions {
		justify-content: flex-end;
		flex-shrink: 0;
		max-width: 520px;
	}
}

@media (min-width: 1024px) {
	.kg-gdoc-detail__body {
		grid-template-columns: 2fr 1fr;
		align-items: start;
	}
}
</style>
