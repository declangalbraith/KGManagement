<template>
	<div v-if="doc" class="kg-doc-detail">
		<header class="kg-doc-detail__head">
			<div class="kg-doc-detail__head-left">
				<button type="button" class="kg-doc-back" @click="router.push('/document-management?tab=quality')">
					<el-icon><ArrowLeft /></el-icon>
				</button>
				<div>
					<div class="kg-doc-detail__title-row">
						<h1>{{ doc.name }}</h1>
						<span class="kg-status-tag" :class="statusClass(doc)">{{ statusLabel(doc) }}</span>
					</div>
					<div class="kg-doc-detail__meta">
						<span class="kg-meta-id">{{ doc.uniqueId }}</span>
						<span>·</span>
						<span>{{ doc.fileType }}</span>
						<span>·</span>
						<span class="mono">v{{ doc.version }}</span>
					</div>
				</div>
			</div>
			<div class="kg-doc-detail__actions">
				<button type="button" class="kg-btn-outline is-primary" @click="openPreview()">
					<el-icon><View /></el-icon>
					{{ t('message.pages.qualityDocs.previewBody') }}
				</button>
				<button type="button" class="kg-btn-outline is-purple" @click="ElMessage.success(t('message.pages.qualityDocs.smartReadToast'))">
					<el-icon><MagicStick /></el-icon>
					{{ t('message.pages.qualityDocs.smartRead') }}
				</button>
				<button
					v-if="doc.status === 'DRAFT' || doc.status === 'REJECTED'"
					type="button"
					class="kg-btn-outline"
					@click="ElMessage.info(t('message.pages.qualityDocs.editToast'))"
				>
					<el-icon><EditPen /></el-icon>
					{{ t('message.pages.qualityDocs.edit') }}
				</button>
				<button
					v-if="doc.status === 'DRAFT' || doc.status === 'REJECTED'"
					type="button"
					class="kg-btn-submit"
					@click="submitReview"
				>
					<el-icon><DocumentChecked /></el-icon>
					{{ t('message.pages.qualityDocs.submitReview') }}
				</button>
			</div>
		</header>

		<div class="kg-doc-detail__grid">
			<div class="kg-doc-detail__main">
				<section class="kg-card">
					<h2><el-icon><Document /></el-icon>{{ t('message.pages.qualityDocs.basicInfo') }}</h2>
					<div class="kg-info-grid">
						<div>
							<span class="kg-label">{{ t('message.pages.qualityDocs.fileNumber') }}</span>
							<strong>{{ doc.docNumber }}</strong>
						</div>
						<div>
							<span class="kg-label">{{ t('message.pages.qualityDocs.ownerLabel') }}</span>
							<strong class="kg-owner">
								<span class="kg-av">{{ doc.owner[0] }}</span>
								{{ doc.owner }}
							</strong>
						</div>
						<div>
							<span class="kg-label">{{ t('message.pages.qualityDocs.department') }}</span>
							<strong>{{ doc.department || '—' }}</strong>
						</div>
						<div>
							<span class="kg-label">{{ t('message.pages.qualityDocs.projectName') }}</span>
							<strong>{{ doc.projectName || '—' }}</strong>
						</div>
						<div class="is-full">
							<span class="kg-label">{{ t('message.pages.qualityDocs.fileDesc') }}</span>
							<div class="kg-desc-box">{{ doc.description || t('message.pages.qualityDocs.noDescription') }}</div>
						</div>
					</div>
				</section>
			</div>

			<aside class="kg-doc-detail__side">
				<section class="kg-card kg-card--related">
					<h2>
						<el-icon><Reading /></el-icon>
						{{ t('message.pages.qualityDocs.relatedTitle') }}
					</h2>
					<div class="kg-related-list">
						<button
							v-for="item in doc.related"
							:key="item.id"
							type="button"
							class="kg-related-item"
							@click="goKnowledge(item)"
						>
							<span class="kg-related-title">{{ item.title }}</span>
							<div class="kg-related-foot">
								<span class="kg-related-tag" :class="item.tagClass">{{ item.tag }}</span>
								<span class="kg-related-match">{{ item.match }}% 匹配度</span>
							</div>
						</button>
					</div>
				</section>

				<section class="kg-card">
					<h2><el-icon><Clock /></el-icon>{{ t('message.pages.qualityDocs.auditVersion') }}</h2>
					<div class="kg-audit-timeline">
						<div v-for="log in auditLogs" :key="log.id" class="kg-audit-item">
							<div class="kg-audit-dot" />
							<div class="kg-audit-body">
								<div class="kg-audit-head">
									<strong>{{ log.operatorName }}</strong>
									<span>{{ formatLogTime(log.timestamp) }}</span>
								</div>
								<p>{{ logText(log.action) }}</p>
								<p v-if="log.details" class="kg-audit-detail">{{ log.details }}</p>
							</div>
						</div>
					</div>
				</section>
			</aside>
		</div>
	</div>
	<div v-else class="kg-doc-empty">{{ t('message.pages.qualityDocs.notFound') }}</div>

	<DocumentViewer
		v-model="viewerOpen"
		:title="previewTitle"
		:watermark-text="previewWatermark"
		doc-type="pdf"
	/>
</template>

<script setup lang="ts" name="kg-quality-docs-detail">
import { computed, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { ElMessage } from 'element-plus';
import {
	ArrowLeft,
	Clock,
	Document,
	DocumentChecked,
	EditPen,
	MagicStick,
	Reading,
	View,
} from '@element-plus/icons-vue';
import DocumentViewer from '../components/DocumentViewer.vue';
import type { QualityDocItem, RelatedKnowledge } from '../types';
import { docById, mockQualityDocs } from '../mock';
import { getDocDisplayStatus } from '../utils';

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const viewerOpen = ref(false);
const previewTitle = ref('');

const docId = computed(() => (route.params.id as string) || 'doc-002');
const doc = ref<QualityDocItem | undefined>(docById(docId.value) ?? mockQualityDocs[1]);

const auditLogs = computed(() => doc.value?.auditLogs ?? []);

const previewWatermark = computed(() => {
	if (!doc.value) return 'CONFIDENTIAL';
	const date = new Date().toISOString().split('T')[0];
	return `CONFIDENTIAL - ${doc.value.uniqueId} - ${date}`;
});

function openPreview(attachmentName?: string) {
	if (!doc.value) return;
	previewTitle.value = attachmentName ?? doc.value.name;
	viewerOpen.value = true;
}

function statusClass(docItem: QualityDocItem) {
	const status = getDocDisplayStatus(docItem);
	if (status === 'APPROVED') return 'is-approved';
	if (status === 'PENDING') return 'is-pending';
	if (status === 'REJECTED') return 'is-rejected';
	if (status === 'ARCHIVED') return 'is-archived';
	if (status === 'DELETED') return 'is-deleted';
	return 'is-draft';
}

function statusLabel(docItem: QualityDocItem) {
	const status = getDocDisplayStatus(docItem);
	if (status === 'APPROVED') return t('message.pages.qualityDocs.statusApproved');
	if (status === 'PENDING') return t('message.pages.qualityDocs.statusPending');
	if (status === 'REJECTED') return t('message.pages.qualityDocs.statusRejected');
	if (status === 'ARCHIVED') return t('message.pages.qualityDocs.statusArchived');
	if (status === 'DELETED') return t('message.pages.qualityDocs.statusDeleted');
	return t('message.pages.qualityDocs.statusDraft');
}

function goKnowledge(item: RelatedKnowledge) {
	router.push({ path: `/knowledge/${item.id}`, query: { title: item.title } });
}

function logText(action: string) {
	const map: Record<string, string> = {
		CREATE: t('message.pages.qualityDocs.logCreate'),
		SUBMIT: t('message.pages.qualityDocs.logSubmit'),
		APPROVE: t('message.pages.qualityDocs.logApprove'),
		REJECT: t('message.pages.qualityDocs.logReject'),
		UPDATE: t('message.pages.qualityDocs.logUpdate'),
		UPLOAD: t('message.pages.qualityDocs.logUpload'),
	};
	return map[action] ?? action;
}

function formatLogTime(ts: string) {
	const d = new Date(ts);
	return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
}

function submitReview() {
	if (!doc.value) return;
	doc.value = { ...doc.value, status: 'PENDING' };
	ElMessage.success(t('message.pages.qualityDocs.submitSuccess'));
}

</script>

<style scoped lang="scss">
.kg-doc-detail {
	max-width: 1200px;
	margin: 0 auto;
	padding: 0 4px 32px;
}

.kg-doc-detail__head {
	display: flex;
	justify-content: space-between;
	align-items: flex-start;
	gap: 16px;
	margin-bottom: 24px;
	flex-wrap: wrap;
}

.kg-doc-detail__head-left {
	display: flex;
	gap: 14px;
	align-items: flex-start;
}

.kg-doc-back {
	width: 40px;
	height: 40px;
	border: 1px solid #e2e8f0;
	border-radius: 50%;
	background: #fff;
	box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
	cursor: pointer;
	display: flex;
	align-items: center;
	justify-content: center;
	flex-shrink: 0;
	&:hover {
		background: #f8fafc;
	}
}

.kg-doc-detail__title-row {
	display: flex;
	align-items: center;
	gap: 10px;
	flex-wrap: wrap;
	h1 {
		margin: 0;
		font-size: 24px;
		font-weight: 700;
		letter-spacing: -0.02em;
	}
}

.kg-status-tag {
	font-size: 11px;
	font-weight: 600;
	padding: 2px 10px;
	border-radius: 999px;
	border: 1px solid;
	&.is-draft {
		background: #f1f5f9;
		color: #475569;
		border-color: #e2e8f0;
	}
	&.is-approved {
		background: #ecfdf5;
		color: #047857;
		border-color: #a7f3d0;
	}
	&.is-pending {
		background: #fff7ed;
		color: #c2410c;
		border-color: #fed7aa;
	}
	&.is-rejected {
		background: #fef2f2;
		color: #b91c1c;
		border-color: #fecaca;
	}
	&.is-archived {
		background: #f8fafc;
		color: #475569;
		border-color: #e2e8f0;
	}
	&.is-deleted {
		background: #f1f5f9;
		color: #64748b;
		border-color: #cbd5e1;
	}
}

.kg-doc-detail__meta {
	display: flex;
	align-items: center;
	gap: 8px;
	margin-top: 6px;
	font-size: 13px;
	color: #64748b;
	flex-wrap: wrap;
}

.kg-meta-id {
	font-family: ui-monospace, monospace;
	font-size: 12px;
	padding: 2px 8px;
	border: 1px solid #e2e8f0;
	border-radius: 4px;
	background: #f8fafc;
}

.mono {
	font-family: ui-monospace, monospace;
}

.kg-doc-detail__actions {
	display: flex;
	gap: 8px;
	flex-wrap: wrap;
	justify-content: flex-end;
}

.kg-btn-outline {
	display: inline-flex;
	align-items: center;
	gap: 6px;
	height: 36px;
	padding: 0 14px;
	border: 1px solid #e2e8f0;
	border-radius: 6px;
	background: #fff;
	font-size: 13px;
	color: #334155;
	cursor: pointer;
	white-space: nowrap;
	&:hover {
		background: #f8fafc;
	}
	&.is-primary {
		color: var(--el-color-primary);
		border-color: rgba(59, 130, 246, 0.3);
		&:hover {
			background: rgba(59, 130, 246, 0.06);
		}
	}
	&.is-purple {
		color: #7c3aed;
		border-color: #e9d5ff;
		background: #faf5ff;
		&:hover {
			background: #f3e8ff;
		}
	}
}

.kg-btn-submit {
	display: inline-flex;
	align-items: center;
	gap: 6px;
	height: 36px;
	padding: 0 16px;
	border: none;
	border-radius: 6px;
	background: #1a1a1a;
	color: #fff;
	font-size: 13px;
	font-weight: 500;
	cursor: pointer;
	box-shadow: 0 2px 4px rgba(0, 0, 0, 0.12);
	&:hover {
		background: #333;
	}
}

.kg-doc-detail__grid {
	display: grid;
	grid-template-columns: 1fr 340px;
	gap: 20px;
	align-items: start;
}

.kg-card {
	background: #fff;
	border: 1px solid rgba(0, 0, 0, 0.08);
	border-radius: 12px;
	padding: 20px 24px;
	box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
	margin-bottom: 20px;
	position: relative;
	overflow: hidden;
	h2 {
		margin: 0 0 20px;
		font-size: 17px;
		font-weight: 600;
		display: flex;
		align-items: center;
		gap: 8px;
		.el-icon {
			color: var(--el-color-primary);
		}
	}
	&--related {
		background: linear-gradient(135deg, rgba(59, 130, 246, 0.06), transparent);
		border-color: rgba(59, 130, 246, 0.15);
	}
}

.kg-info-grid {
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 20px 32px;
	.is-full {
		grid-column: 1 / -1;
	}
}

.kg-label {
	display: block;
	font-size: 11px;
	text-transform: uppercase;
	letter-spacing: 0.06em;
	color: #64748b;
	margin-bottom: 6px;
}

.kg-owner {
	display: inline-flex;
	align-items: center;
	gap: 8px;
}

.kg-av {
	width: 24px;
	height: 24px;
	border-radius: 50%;
	background: rgba(59, 130, 246, 0.15);
	color: var(--el-color-primary);
	font-size: 11px;
	font-weight: 700;
	display: inline-flex;
	align-items: center;
	justify-content: center;
}

.kg-desc-box {
	margin-top: 4px;
	padding: 12px 14px;
	background: rgba(0, 0, 0, 0.03);
	border-radius: 8px;
	font-size: 14px;
	color: #475569;
	line-height: 1.6;
}

.kg-related-list {
	display: flex;
	flex-direction: column;
	gap: 10px;
}

.kg-related-item {
	width: 100%;
	text-align: left;
	padding: 14px;
	border: 1px solid rgba(0, 0, 0, 0.06);
	border-radius: 10px;
	background: rgba(255, 255, 255, 0.85);
	cursor: pointer;
	transition: border-color 0.15s, box-shadow 0.15s;
	&:hover {
		border-color: rgba(59, 130, 246, 0.35);
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
	}
}

.kg-related-title {
	display: block;
	font-size: 13px;
	font-weight: 500;
	line-height: 1.5;
	color: #0f172a;
	margin-bottom: 10px;
}

.kg-related-foot {
	display: flex;
	justify-content: space-between;
	align-items: center;
}

.kg-related-tag {
	font-size: 10px;
	padding: 2px 8px;
	border-radius: 4px;
	&.case {
		background: #eff6ff;
		color: #1d4ed8;
		border: 1px solid #bfdbfe;
	}
	&.tech {
		background: #f3e8ff;
		color: #6d28d9;
		border: 1px solid #e9d5ff;
	}
}

.kg-related-match {
	font-size: 11px;
	font-weight: 600;
	color: #059669;
}

.kg-audit-timeline {
	border-left: 2px solid #e2e8f0;
	margin-left: 8px;
	padding-left: 20px;
}

.kg-audit-item {
	position: relative;
	padding-bottom: 16px;
	&:last-child {
		padding-bottom: 0;
	}
}

.kg-audit-dot {
	position: absolute;
	left: -27px;
	top: 6px;
	width: 12px;
	height: 12px;
	border-radius: 50%;
	background: #fff;
	border: 2px solid #94a3b8;
	box-shadow: 0 0 0 3px #fff;
}

.kg-audit-body {
	padding: 12px 14px;
	background: rgba(0, 0, 0, 0.02);
	border-radius: 8px;
	border: 1px solid transparent;
	&:hover {
		background: rgba(0, 0, 0, 0.04);
		border-color: rgba(0, 0, 0, 0.06);
	}
}

.kg-audit-head {
	display: flex;
	justify-content: space-between;
	gap: 8px;
	margin-bottom: 6px;
	strong {
		font-size: 13px;
	}
	span {
		font-size: 11px;
		font-family: ui-monospace, monospace;
		color: #94a3b8;
		white-space: nowrap;
	}
}

.kg-audit-body p {
	margin: 0;
	font-size: 13px;
	color: #334155;
}

.kg-audit-detail {
	margin-top: 8px !important;
	font-size: 12px !important;
	color: #64748b !important;
}

.kg-doc-empty {
	padding: 48px;
	text-align: center;
	color: #94a3b8;
}

@media (max-width: 1000px) {
	.kg-doc-detail__grid {
		grid-template-columns: 1fr;
	}
}
</style>
